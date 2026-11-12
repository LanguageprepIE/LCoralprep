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
    NETWORK: 'The connection was interrupted. Your answer is still on this page. Check your connection and try again.',
    AGE_RESTRICTED: 'AI practice is not available for your age group in this preview. Your answer has not been sent.'
  };
  const error = code => Object.assign(new Error(messages[code] || messages.INVALID_RESPONSE), { code });
  const message = value => messages[value?.code] || messages.INVALID_RESPONSE;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

  // Phase 1 (preview only): self-declared age band, no name/DOB/account stored.
  // This is NOT verified age assurance and does not substitute for U18 safeguards.
  let adultConfirmed = false;
  let ageDialogPending = null;
  function previewOnly() {
    return /^(?:deploy-preview-[0-9]+|[a-f0-9]{24})--lcorals\.netlify\.app$/i.test(location.hostname);
  }
  async function confirmAdultForPreview() {
    if (!previewOnly()) return null; // Keep the existing production experience unchanged.
    if (adultConfirmed) return '18-plus';
    if (ageDialogPending) return ageDialogPending;
    ageDialogPending = new Promise(resolve => {
      const previousFocus = document.activeElement;
      const overlay = document.createElement('div');
      overlay.setAttribute('role','presentation');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.76);display:grid;place-items:center;padding:16px;z-index:2147483647';
      const dialog = document.createElement('section');
      dialog.setAttribute('role','dialog');
      dialog.setAttribute('aria-modal','true');
      dialog.setAttribute('aria-labelledby','lcorals-age-title');
      dialog.setAttribute('aria-describedby','lcorals-age-text');
      dialog.style.cssText = 'background:white;color:#172033;border-radius:16px;max-width:440px;width:100%;padding:24px;font:inherit;box-shadow:0 16px 40px #0004';
      const title = document.createElement('h2');
      title.id='lcorals-age-title';title.textContent='Before using AI practice';title.style.margin='0 0 12px';
      const description=document.createElement('p');description.id='lcorals-age-text';
      description.textContent='Please select your age group. We do not ask for your name or date of birth. This preview is temporarily limited to adults while additional safeguards for students aged 16–17 are completed.';
      description.style.margin='0 0 18px';
      const note=document.createElement('p');note.setAttribute('role','status');note.style.cssText='font-size:.92rem;margin:10px 0;color:#444';
      const buttons=document.createElement('div');buttons.style.cssText='display:grid;gap:9px';
      const actions=[
        ['I am 18 or older','adult'],
        ['I am 16 or 17','teen'],
        ['I am under 16','younger'],
        ['Cancel','cancel']
      ];
      let completed=false;
      const finish=value=>{
        if(completed)return;completed=true;overlay.remove();
        if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus();
        resolve(value);
      };
      for(const [label,choice] of actions) {
        const button=document.createElement('button');button.type='button';button.textContent=label;
        button.style.cssText='padding:12px;border-radius:9px;border:1px solid #bac4d2;background:'+(choice==='adult'?'#1d4ed8':'#f8fafc')+';color:'+(choice==='adult'?'white':'#172033')+';font:inherit;cursor:pointer';
        button.addEventListener('click',()=>{
          if(choice==='adult'){adultConfirmed=true;finish('18-plus');return}
          if(choice==='teen'){note.textContent='Access for ages 16–17 is being prepared. AI practice is not available in this preview yet.';return}
          if(choice==='younger'){note.textContent='AI practice is not available for users under 16.';return}
          finish(null);
        });
        buttons.appendChild(button);
      }
      dialog.append(title,description,buttons,note);overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      const focusables=buttons.querySelectorAll('button');
      overlay.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();finish(null)}
        if(event.key==='Tab'){
          const first=focusables[0],last=focusables[focusables.length-1];
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
        }
      });
      focusables[0].focus();
    }).finally(()=>{ageDialogPending=null});
    return ageDialogPending;
  }

  async function request(prompt) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw error('INVALID_REQUEST');
    const ageBand = await confirmAdultForPreview();
    if (previewOnly() && ageBand !== '18-plus') throw error('AGE_RESTRICTED');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(ageBand ? { 'X-LCorals-Age-Band': ageBand } : {}) },
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

  // Gemini occasionally serializes an integer mark as a string. Accept only
  // canonical, in-range integer strings; malformed marks still fail validation.
  function normalizeSpanishScore(data, level) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.score !== 'string') return data;
    const limit = level === 'HL' ? 70 : 100;
    if (!/^(0|[1-9][0-9]{0,2})$/.test(data.score)) return data;
    const score = Number(data.score);
    if (score > limit) return data;
    return { ...data, score };
  }

  // Fail closed on objectively contradictory Spanish conversation grading.
  // Never silently change a learner's mark or rewrite the examiner's opinion.
  function spanishAssessment(data, level) {
    feedback(data, ['feedback_es', 'feedback_en']);
    const max = level === 'HL' ? 70 : 100;
    if (!Number.isInteger(data.score) || data.score < 0 || data.score > max) throw error('INVALID_RESPONSE');
    if (level === 'HL') {
      const ranges = { 1:[65,70], 2:[55,60], 3:[45,50], 4:[30,40], 5:[20,25], 6:[10,15], 7:[0,5] };
      const band = ranges[data.band];
      if (!Number.isInteger(data.band) || !band || data.score < band[0] || data.score > band[1]) throw error('INVALID_RESPONSE');
    }
    if (data.score === max) {
      const words = `${data.feedback_es} ${data.feedback_en}`.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
      if (/\b(?:no (?:merece|alcanza|obtiene|tiene|recibe)|sin (?:alcanzar|obtener)|did not (?:deserve|receive|get|reach)|does(?: not|n't) (?:deserve|receive|get|reach)|not (?:the |a )?|short of)\b.{0,65}\b(?:maxim[ao]|maximum|full (?:marks?|score)|top (?:marks?|score)|highest (?:marks?|score))\b/i.test(words)) throw error('INVALID_RESPONSE');
    }
    return data;
  }

  // Diagnostic categories contain only fixed schema names, never learner/AI content.
  // Mirrors feedback() rejection conditions without changing acceptance rules.
  function feedbackIssue(data, fields) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return 'root_type';
    for (const key of ['errors','corrections','strengths','next_steps','connectors','vocabulary_suggestions','examples','speaking_plan']) {
      if (data[key] !== undefined && !Array.isArray(data[key])) return `${key}_not_array`;
      if (data[key]?.some(item => item === null || !['string','object'].includes(typeof item) || Array.isArray(item))) return `${key}_item_type`;
    }
    for (const key of ['errors','corrections','vocabulary_suggestions','examples']) {
      if (data[key]?.some(item => typeof item !== 'object' || Object.values(item).some(value => typeof value !== 'string'))) return `${key}_item_field_type`;
    }
    for (const key of ['errors','corrections']) {
      if (data[key]?.some(item => typeof item.original !== 'string' || typeof item.correction !== 'string')) return `${key}_missing_correction_fields`;
    }
    for (const key of ['feedback_es','feedback_en','summary_es','summary_en']) {
      if (data[key] !== undefined && typeof data[key] !== 'string') return `${key}_type`;
    }
    if (Object.keys(data).some(key => /^(feedback_|summary_)/.test(key) && typeof data[key] !== 'string')) return 'text_field_type';
    if (typeof data.score !== 'number' || !Number.isFinite(data.score)) return 'score_type';
    if (!Array.isArray(data.errors)) return 'errors_required';
    for (const field of fields) if (typeof data[field] !== 'string') return field === 'feedback_es' ? 'feedback_es_required' : field === 'feedback_en' ? 'feedback_en_required' : 'feedback_required';
    return 'unknown';
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
  return { request, message, escape, object, feedback, feedbackIssue, normalizeSpanishScore, spanishAssessment, roleplay, studyHTML };
})();
