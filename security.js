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
    AGE_RESTRICTED: 'AI practice is not available for your age group in this preview. Your answer has not been sent.',
    SAFETY_SUPPORT: 'Practice paused. If this concerns a real person, please speak with a trusted adult or qualified professional. In immediate danger in Ireland, call 112 or 999. LCorals does not send alerts. Your answer was not graded. See Safety and reporting on the homepage.',
    SAFETY_BLOCKED: 'Practice paused because the automated safety check flagged this response. This may be a mistake. Try rephrasing an ordinary exam answer or see Safety and reporting on the homepage. Your answer was not graded.',
    SAFETY_UNAVAILABLE: 'AI safety checks are temporarily unavailable. Your answer was not graded. Please try again later.'
  };
  const error = code => Object.assign(new Error(messages[code] || messages.INVALID_RESPONSE), { code });
  const message = value => messages[value?.code] || messages.INVALID_RESPONSE;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

  // Preview-only age self-declaration. Not identity/guardian verification.
  // One confirmation per tab session across pages, languages and levels.
  const AGE_SESSION_KEY = 'lcorals-preview-age-v2';
  let selectedAge = null;
  let ageDialogPending = null;
  function previewOnly() {
    if (typeof location === 'undefined') return false;
    return /^(?:deploy-preview-[0-9]+|[a-f0-9]{24})--lcorals\.netlify\.app$/i.test(location.hostname);
  }
  async function confirmAgeForPreview() {
    if (!previewOnly()) return null;
    if (selectedAge) return selectedAge;
    try {
      const stored = sessionStorage.getItem(AGE_SESSION_KEY);
      if (stored === '18-plus' || stored === '16-17-permission-declared') {
        selectedAge = stored;
        return stored;
      }
    } catch {}
    if (ageDialogPending) return ageDialogPending;
    ageDialogPending = new Promise(resolve => {
      const priorFocus = document.activeElement;
      const overlay=document.createElement('div');
      overlay.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.72);display:grid;place-items:center;padding:16px;z-index:2147483647';
      const dialog=document.createElement('section');
      dialog.setAttribute('role','dialog');
      dialog.setAttribute('aria-modal','true');
      dialog.setAttribute('aria-labelledby','lc-age-heading');
      dialog.setAttribute('aria-describedby','lc-age-explanation');
      dialog.style.cssText='background:white;color:#172033;border-radius:14px;max-width:440px;width:100%;max-height:90vh;overflow:auto;padding:24px;font:inherit';
      const heading=document.createElement('h2');
      heading.id='lc-age-heading';heading.textContent='Before you practise';heading.style.margin='0 0 8px';
      const desc=document.createElement('p');desc.id='lc-age-explanation';
      desc.textContent='LCorals uses AI to help you practise for your oral exams. Please choose your age group. No account or date of birth is needed.';
      const actions=document.createElement('div');actions.style.cssText='display:grid;gap:9px';
      const note=document.createElement('p');note.setAttribute('role','status');note.style.cssText='font-size:.92rem;margin:10px 0';
      let finished=false;
      function done(choice) {
        if(finished)return;
        finished=true;
        if(choice) {
          selectedAge=choice;
          try { sessionStorage.setItem(AGE_SESSION_KEY,choice); } catch {}
        }
        overlay.remove();
        if(priorFocus?.focus) priorFocus.focus();
        resolve(choice);
      }
      function addButton(text,callback,primary=false) {
        const btn=document.createElement('button');btn.type='button';btn.textContent=text;
        btn.style.cssText='min-height:44px;padding:10px;border:1px solid #bac4d2;border-radius:9px;background:'+(primary?'#1d4ed8':'#f8fafc')+';color:'+(primary?'white':'#172033')+';font:inherit;cursor:pointer';
        btn.addEventListener('click',callback);actions.appendChild(btn);return btn;
      }
      function ageChoices() {
        actions.replaceChildren();note.textContent='';
        const first=addButton('18 or over',()=>done('18-plus'),true);
        addButton('16 or 17',permissionChoice);
        addButton('Under 16',()=>{note.textContent='AI practice is not available for under-16s in this preview.'});
        addButton('Cancel',()=>done(null));
        first.focus();
      }
      function permissionChoice() {
        actions.replaceChildren();
        note.textContent='You only need to confirm this once per browser-tab session.';
        const label=document.createElement('label');label.style.cssText='display:flex;gap:10px;align-items:start;line-height:1.5';
        const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.style.cssText='margin-top:5px;flex-shrink:0';
        const statement=document.createElement('span');
        statement.textContent='I am 16 or 17 and I have permission from my parent or legal guardian to use LCorals AI practice. I understand the AI can make mistakes and I should not share private details.';
        label.append(checkbox,statement);actions.appendChild(label);
        const privacy=document.createElement('a');privacy.href='/privacy.html';privacy.target='_blank';privacy.rel='noopener noreferrer';privacy.textContent='Privacy & AI';actions.appendChild(privacy);
        const submit=addButton('Continue to practice',()=>{if(checkbox.checked)done('16-17-permission-declared')},true);
        submit.disabled=true;
        checkbox.addEventListener('change',()=>{submit.disabled=!checkbox.checked});
        addButton('Back',ageChoices);addButton('Cancel',()=>done(null));
        checkbox.focus();
      }
      dialog.append(heading,desc,actions,note);overlay.appendChild(dialog);document.body.appendChild(overlay);
      overlay.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();done(null)}
        if(event.key==='Tab'){
          const items=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')];
          if(!items.length)return;
          if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items[items.length-1].focus()}
          else if(!event.shiftKey&&document.activeElement===items[items.length-1]){event.preventDefault();items[0].focus()}
        }
      });
      ageChoices();
    }).finally(()=>{ageDialogPending=null});
    return ageDialogPending;
  }

  // Optional support information lives outside exam scoring JSON and never
  // changes marks or the learner's answer. One unobtrusive notice per page.
  function updateWellbeingAdvice(show) {
    if (typeof document === 'undefined') return;
    let node=document.getElementById('lcorals-wellbeing-advice');
    if (!show) { if(node) node.remove(); return; }
    if(!node) {
      node=document.createElement('aside');
      node.id='lcorals-wellbeing-advice';
      node.setAttribute('aria-label','Optional wellbeing support');
      node.style.cssText='max-width:800px;margin:18px auto;padding:12px 16px;border:1px solid #cbd5e1;border-radius:9px;background:#f8fafc;color:#334155;font:inherit;font-size:.9rem;line-height:1.5';
      const text=document.createElement('span');
      text.textContent='If this topic relates to a real difficulty, consider talking to an adult you trust. For confidential support in Ireland: Childline 1800 66 66 66 or Samaritans 116 123. ';
      const link=document.createElement('a');link.href='/safety.html';link.textContent='More support and reporting information';
      node.append(text,link);
      document.body.appendChild(node);
    }
  }

  async function request(prompt) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw error('INVALID_REQUEST');
    const ageBand = await confirmAgeForPreview();
    if (previewOnly() && ageBand !== '18-plus' && ageBand !== '16-17-permission-declared') throw error('AGE_RESTRICTED');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(ageBand ? { 'X-LCorals-Age-Band': ageBand } : {}) },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), signal: controller.signal
      });
      if (!response.ok) {
        if (response.status === 422) {
          let code='SAFETY_BLOCKED';
          try { const data=await response.json(); if (data?.error?.code==='SAFETY_SUPPORT') code='SAFETY_SUPPORT'; } catch {}
          throw error(code);
        }
        if (response.status === 503) {
          try { const data=await response.json(); if (data?.error?.code==='SAFETY_UNAVAILABLE') throw error('SAFETY_UNAVAILABLE'); } catch (err) { if (err?.code==='SAFETY_UNAVAILABLE') throw err; }
        }
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
      // A gentle information panel is separate from generated feedback and scores.
      updateWellbeingAdvice(data?.safety_advisory === 'wellbeing');
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
