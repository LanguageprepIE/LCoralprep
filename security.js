/* Shared transport and safe rendering. No prompts, scoring or task state. */
const LCSecurity = (() => {
  'use strict';
  const messages = {
    INVALID_REQUEST: 'The practice request could not be read. Please try again.',
    REQUEST_TOO_LARGE: 'This practice request is too large to send. Your answer has not been sent.',
    UNAVAILABLE: 'AI practice is temporarily unavailable. Your answer is still on this page. Please try again later.',
    BUSY: 'AI practice is busy or its usage allowance has been reached. Your answer is still on this page. Please try again later.',
    TIMEOUT: 'The AI took too long to respond. Your answer is still on this page. Please try again.',
    INVALID_RESPONSE: 'The AI did not return a complete response. Your answer is still on this page. Please try again.',
    NETWORK: 'The connection was interrupted. Your answer is still on this page. Check your connection and try again.'
  };
  const error = code => Object.assign(new Error(messages[code] || messages.INVALID_RESPONSE), { code });
  const message = value => messages[value?.code] || messages.INVALID_RESPONSE;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

  async function request(prompt) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw error('INVALID_REQUEST');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), signal: controller.signal
      });
      if (!response.ok) {
        if (response.status === 429) throw error('BUSY');
        if (response.status === 413) throw error('REQUEST_TOO_LARGE');
        if (response.status === 504) throw error('TIMEOUT');
        throw error('UNAVAILABLE');
      }
      let data;
      try { data = await response.json(); } catch { throw error('INVALID_RESPONSE'); }
      const candidate = data?.candidates?.[0];
      if (!Array.isArray(data?.candidates) || data?.error || (candidate?.finishReason && candidate.finishReason !== 'STOP')) throw error('INVALID_RESPONSE');
      const parts = candidate?.content?.parts;
      if (!Array.isArray(parts) || !parts.length || parts.some(part => typeof part?.text !== 'string')) throw error('INVALID_RESPONSE');
      const text = parts.map(part => part.text).join('');
      if (!text.trim()) throw error('INVALID_RESPONSE');
      return text;
    } catch (failure) {
      if (controller.signal.aborted) throw error('TIMEOUT');
      if (failure?.code && messages[failure.code]) throw error(failure.code);
      throw error('NETWORK');
    } finally { clearTimeout(timer); }
  }

  function object(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw error('INVALID_RESPONSE');
    for (const key of ['errors','corrections','strengths','next_steps','connectors','vocabulary_suggestions','examples','speaking_plan']) {
      if (data[key] !== undefined && !Array.isArray(data[key])) throw error('INVALID_RESPONSE');
      if (data[key]?.some(item => item === null || !['string','object'].includes(typeof item) || Array.isArray(item))) throw error('INVALID_RESPONSE');
    }
    for (const key of ['errors','corrections','vocabulary_suggestions','examples']) {
      if (data[key]?.some(item => typeof item !== 'object' ||
          Object.values(item).some(value => typeof value !== 'string'))) throw error('INVALID_RESPONSE');
    }
    for (const key of ['errors','corrections']) {
      if (data[key]?.some(item => typeof item.original !== 'string' || typeof item.correction !== 'string')) throw error('INVALID_RESPONSE');
    }
    for (const key of Object.keys(data)) {
      if (/^(feedback_|summary_)/.test(key) && typeof data[key] !== 'string') throw error('INVALID_RESPONSE');
    }
    return data;
  }
  function feedback(data, fields) {
    object(data);
    if (typeof data.score !== 'number' || !Number.isFinite(data.score) ||
        !Array.isArray(data.errors) || fields.some(field => typeof data[field] !== 'string')) throw error('INVALID_RESPONSE');
    return data;
  }

  function roleplay(data) {
    object(data);
    if (!Array.isArray(data.turns) || data.turns.length !== 5 ||
        typeof data.total_score !== 'number' || !Number.isFinite(data.total_score) ||
        data.turns.some(turn => !turn || typeof turn.score !== 'number' || !Number.isFinite(turn.score) ||
          typeof turn.feedback_es !== 'string' || (turn.errors !== undefined && !Array.isArray(turn.errors)))) throw error('INVALID_RESPONSE');
    for (const turn of data.turns) if (turn.errors !== undefined) object({ errors: turn.errors });
    return data;
  }

  function studyHTML(source) {
    // Parse into an inert template, then construct a NEW attribute-free HTML
    // tree. No untrusted element is adopted into the active document. This is
    // a DOM allow-list renderer, not a regex filter or an HTML string blacklist.
    const template = document.createElement('template');
    template.innerHTML = String(source ?? '');
    const output = document.createElement('div');
    const allowed = new Set(['P','B','STRONG','I','EM','UL','OL','LI','BR','HR','DIV','SPAN','H3','H4','BLOCKQUOTE','CODE','PRE','TABLE','THEAD','TBODY','TR','TD','TH']);
    function copy(node, parent) {
      if (node.nodeType === 3) { parent.appendChild(document.createTextNode(node.textContent)); return; }
      if (node.nodeType !== 1) return;
      if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !allowed.has(node.tagName)) {
        parent.appendChild(document.createTextNode(node.outerHTML)); return;
      }
      const clean = document.createElement(node.tagName.toLowerCase());
      for (const child of node.childNodes) copy(child, clean);
      parent.appendChild(clean);
    }
    for (const child of template.content.childNodes) copy(child, output);
    return output.innerHTML;
  }
  return { request, message, escape, object, feedback, roleplay, studyHTML };
})();
