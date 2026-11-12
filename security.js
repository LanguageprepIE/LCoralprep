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

  // Phase 2 (preview only): age band and guardian declaration prototype.
  // It asks no DOB/name/contact details, records no declaration on our servers,
  // and DOES NOT authorise minor requests until the other safeguards are ready.
  let adultConfirmed = false;
  let ageDialogPending = null;
  function previewOnly() {
    if (typeof location === 'undefined') return false; // Offline tests / non-browser environments.
    return /^(?:deploy-preview-[0-9]+|[a-f0-9]{24})--lcorals\.netlify\.app$/i.test(location.hostname);
  }
  async function confirmAdultForPreview() {
    if (!previewOnly()) return null;
    if (adultConfirmed) return '18-plus';
    try { if (sessionStorage.getItem('lcorals-preview-age-band-v1') === '18-plus') { adultConfirmed = true; return '18-plus'; } } catch {}
    if (ageDialogPending) return ageDialogPending;
    ageDialogPending = new Promise(resolve => {
      const previousFocus = document.activeElement;
      const overlay = document.createElement('div');
      overlay.setAttribute('role', 'presentation');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.76);display:grid;place-items:center;padding:16px;z-index:2147483647';
      const dialog = document.createElement('section');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'lcorals-age-title');
      dialog.setAttribute('aria-describedby', 'lcorals-age-text');
      dialog.style.cssText = 'background:#fff;color:#172033;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow:auto;padding:24px;font:inherit;box-shadow:0 16px 40px #0004';
      const title=document.createElement('h2');
      title.id='lcorals-age-title';title.style.margin='0 0 12px';
      const description=document.createElement('p');
      description.id='lcorals-age-text';description.style.margin='0 0 18px';
      const controls=document.createElement('div');controls.style.cssText='display:grid;gap:10px';
      const status=document.createElement('p');status.setAttribute('role','status');
      status.style.cssText='font-size:.93rem;margin:12px 0 0;color:#334155';
      let completed=false;
      function finish(value) {
        if(completed)return;
        completed=true;overlay.remove();
        if(previousFocus && typeof previousFocus.focus==='function')previousFocus.focus();
        resolve(value);
      }
      function button(label,action,primary=false) {
        const b=document.createElement('button');b.type='button';b.textContent=label;
        b.style.cssText='padding:12px;border-radius:9px;border:1px solid #bac4d2;background:'+(primary?'#1d4ed8':'#f8fafc')+';color:'+(primary?'#fff':'#172033')+';font:inherit;cursor:pointer;min-height:44px';
        b.addEventListener('click',action);controls.appendChild(b);return b;
      }
      function renderAge() {
        title.textContent='Before using AI practice';
        description.textContent='Choose your age group. No name, date of birth or account is requested. In this preview, only users aged 18 or over can send answers to the AI. Students aged 16–17 can view the parent/guardian permission step, but their practice remains disabled.';
        controls.replaceChildren();status.textContent='';
        const first=button('I am 18 or older',()=>{adultConfirmed=true;try { sessionStorage.setItem('lcorals-preview-age-band-v1','18-plus'); } catch {} finish('18-plus')},true);
        button('I am 16 or 17',renderGuardian);
        button('I am under 16',()=>{
          status.textContent='AI practice is not available to users under 16.';
        });
        button('Cancel',()=>finish(null));
        first.focus();
      }
      function renderGuardian() {
        title.textContent='Parent or guardian permission — ages 16–17';
        description.textContent='This is a draft permission step for a parent or legal guardian. LCorals is a free Leaving Certificate practice tool. Students type or dictate answers; answer text is processed by AI to provide questions and feedback. AI feedback can contain mistakes. Please avoid sharing real names, contact details or sensitive information. See Privacy & AI for full information.';
        controls.replaceChildren();status.textContent='Preview only: completing this declaration does not yet enable AI practice for anyone under 18.';
        const link=document.createElement('a');link.href='/privacy.html';link.textContent='Read Privacy & AI';link.target='_blank';link.rel='noopener noreferrer';controls.appendChild(link);
        const label=document.createElement('label');label.style.cssText='display:flex;align-items:start;gap:10px;padding:10px 0;line-height:1.45';
        const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.style.cssText='width:20px;height:20px;flex-shrink:0;margin-top:3px';
        const statement=document.createElement('span');
        statement.textContent='I confirm that I am the parent or legal guardian of a student aged 16–17. I have read the explanation above and the privacy information, and I give permission for the student to use LCorals AI practice when its safeguards are enabled.';
        label.append(checkbox,statement);controls.appendChild(label);
        const confirm=button('Confirm permission (preview only)',()=>{
          status.textContent='Declaration preview completed. No personal details or permission record were submitted. AI practice remains unavailable for ages 16–17 until the additional safeguards are completed.';
          confirm.disabled=true;confirm.style.opacity='.6';checkbox.disabled=true;
        },true);
        confirm.disabled=true;confirm.style.opacity='.6';
        checkbox.addEventListener('change',()=>{confirm.disabled=!checkbox.checked;confirm.style.opacity=checkbox.checked?'1':'.6'});
        button('Back to age selection',renderAge);
        button('Close',()=>finish(null));
        checkbox.focus();
      }
      dialog.append(title,description,controls,status);overlay.appendChild(dialog);document.body.appendChild(overlay);
      overlay.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();finish(null)}
        if(event.key==='Tab'){
          const focusable=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
          const first=focusable[0],last=focusable[focusable.length-1];
          if(!first)return;
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
          else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
        }
      });
      renderAge();
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
