const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const languages = ['es', 'fr', 'de', 'it', 'pl', 'ga', 'eal'];
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

// Optional test-only DOM engine, never shipped or loaded by the website.
const JSDOM = process.env.LCORALS_JSDOM_PATH ? require(process.env.LCORALS_JSDOM_PATH).JSDOM : null;

test('all response fields have persistent labels and zoom is unrestricted', () => {
  for (const lang of [...languages, '']) {
    const html = read(lang ? `${lang}/index.html` : 'index.html');
    assert.ok(!/user-scalable=no|maximum-scale/.test(html), lang);
    assert.ok(!/<div[^>]+onclick=/.test(html), `${lang}: non-native interactive div`);
    for (const field of html.matchAll(/<textarea\b[^>]*id="([^"]+)"/g)) {
      assert.ok(html.includes(`for="${field[1]}"`), `${lang}: ${field[1]}`);
    }
    assert.match(html, /accessibility\.css/);
    assert.match(html, /accessibility\.js/);
  }
  const ga = read('ga/script.js');
  assert.ok(!/const (btn|d) = document\.createElement\('div'\);\s+(?:btn|d)\.className = 'rp-btn-select'/.test(ga));
});

function contrast(a, b) {
  const luminance = hex => hex.match(/../g).map(x => parseInt(x, 16) / 255)
    .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
    .reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
test('changed hint, selection and gradient endpoint colors meet AA text contrast', () => {
  for (const lang of ['es', 'it']) {
    const hint = read(`${lang}/index.html`).match(/<button id="btnHint"[^>]+color:#([a-f\d]{6})/i)[1];
    assert.ok(contrast(hint, 'ffffff') >= 4.5, `${lang}: ${hint}`);
  }
  for (const [lang, color] of [['fr','dc2626'], ['it','007a3c'], ['ga','15803d'], ['es','4f46e5'], ['es','7e22ce']]) {
    assert.ok(read(`${lang}/style.css`).includes('#' + color));
    assert.ok(contrast(color, 'ffffff') >= 4.5, `${lang}: ${color}`);
  }
  assert.ok(contrast('166534', 'ffffff') >= 4.5);
  assert.ok(read('eal/index.html').includes('background:#15803d;'));
});

const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function fixture(lang) {
  const html = read(`${lang}/index.html`).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', url: `https://fixture.invalid/${lang}/`, pretendToBeVisual: true });
  const w = dom.window;
  const errors = [];
  dom.virtualConsole.on('jsdomError', error => errors.push(String(error)));
  w.console.error = (...args) => errors.push(args.map(String).join(' '));
  w.alert = message => errors.push('alert: ' + message);
  w.confirm = () => true;
  w.fetch = () => { throw new Error('NETWORK DISABLED IN ACCESSIBILITY TEST'); };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  Object.defineProperty(w.HTMLElement.prototype, 'innerText', {
    configurable: true, get() { return this.textContent; }, set(value) { this.textContent = value; }
  });
  // jsdom has no layout. Model visibility only; this is NOT a reflow or browser rendering test.
  w.HTMLElement.prototype.getClientRects = function () {
    for (let e = this; e; e = e.parentElement) {
      if (e.hidden || w.getComputedStyle(e).display === 'none') return [];
    }
    return [{}];
  };
  w.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  Object.defineProperty(w, 'speechSynthesis', { value: { cancel() {}, getVoices: () => [], speak(u) { setTimeout(() => u.onend?.(), 0); } } });
  w.Audio = class { play() { setTimeout(() => this.onended?.(), 0); return Promise.resolve(); } };
  const css = w.document.createElement('style');
  css.textContent = read(`${lang}/style.css`) + '\n' + read('accessibility.css');
  w.document.head.appendChild(css);
  w.eval(read('security.js') + '\n' + read('oral-scoring.js') + '\n' + read(`${lang}/script.js`) + '\n' + read('accessibility.js'));
  await new Promise(resolve => w.addEventListener('load', resolve, { once: true }));
  await tick();
  return { w, d: w.document, errors, close: () => w.close() };
}
function reply(lang, task = 'conversation') {
  const max = { es: 70, it: task === 'picture' || task === 'roleplay' ? 25 : 50, de: task === 'picture' ? 30 : 40, pl: 100, ga: 100, eal: 100 }[lang];
  const data = { question: '', band: 'excellent', score: max, feedback_es: 'Synthetic feedback.', feedback_it: 'Synthetic feedback.', feedback_de: 'Synthetic feedback.', feedback_pl: 'Synthetic feedback.', feedback_fr: 'Synthetic feedback.', feedback_ga: 'Synthetic feedback.', feedback_native: 'Synthetic feedback.', feedback_en: 'Synthetic feedback.', summary_en: 'Synthetic summary.', strengths: [], next_steps: [], connectors: [], vocabulary_suggestions: [], errors: [], corrections: [] };
  const part = score => ({ band: 'excellent', score });
  if (lang === 'fr') Object.assign(data, { communication: part(30), structures: part(30), vocabulary: part(20) });
  if (lang === 'it' && task === 'mock') Object.assign(data, { conversation: part(50), roleplay: part(25), picture: part(25) });
  if (lang === 'de' && task === 'mock') Object.assign(data, { conversation: part(40), part_two: part(30), roleplay: part(30) });
  return data;
}
function keyboardClick(w, button) {
  button.focus();
  button.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  // DOM dispatch checks application behavior; native Enter/Space activation is tested in Chrome separately.
  button.click();
}

for (const lang of languages) test(`${lang}: DOM levels, names, focus, hints, loading and synthetic feedback`, { skip: !JSDOM }, async () => {
  const f = await fixture(lang); const { w, d } = f;
  try {
    const defaults = lang === 'eal' ? 'btnBasic' : lang === 'ga' ? 'btnOL' : 'btnHL';
    assert.equal(d.querySelector('#' + defaults).getAttribute('aria-pressed'), 'true');
    for (const input of d.querySelectorAll('textarea, select, input:not([type=checkbox]):not([type=radio])')) {
      assert.ok(input.labels?.length || input.getAttribute('aria-label'), `${lang}: ${input.id}`);
    }
    for (const button of d.querySelectorAll('.level-selector button')) {
      keyboardClick(w, button); await tick();
      assert.equal(button.getAttribute('aria-pressed'), 'true');
      assert.equal(button.parentElement.querySelectorAll('[aria-pressed=true]').length, 1);
    }
    const topic = d.querySelector('#topicGrid button'); keyboardClick(w, topic); await tick();
    assert.equal(d.activeElement.id, 'qDisplay');
    assert.equal(d.querySelector('#userInput').disabled, false);
    const instructions = d.querySelector('.info-toggle');
    if (instructions) {
      keyboardClick(w, instructions); await tick(); assert.equal(instructions.getAttribute('aria-expanded'), 'true');
      keyboardClick(w, instructions); await tick(); assert.equal(instructions.getAttribute('aria-expanded'), 'false');
    }
    const hint = d.querySelector('#btnHint');
    if (hint.getClientRects().length) {
      hint.click(); await tick(); assert.equal(hint.getAttribute('aria-expanded'), 'true');
      hint.click(); await tick(); assert.equal(hint.getAttribute('aria-expanded'), 'false');
    }
    d.querySelector('#userInput').value = 'Synthetic response for accessibility regression.';
    let release;
    w.callSmartAI = () => new Promise(resolve => { release = resolve; });
    const submit = d.querySelector('#btnAction'); keyboardClick(w, submit); await tick();
    assert.equal(d.querySelector('#exerciseArea').getAttribute('aria-busy'), 'true');
    assert.match(d.querySelector('#a11yStatus').textContent, /Please wait/);
    w.callSmartAI = async () => JSON.stringify(reply(lang));
    release(JSON.stringify(reply(lang))); await tick(); await tick();
    assert.ok(d.querySelector('#scoreDisplay').textContent.trim(), `${lang}: score missing`);
    assert.equal(d.querySelector('#exerciseArea').getAttribute('aria-busy'), 'false');
    assert.equal(d.activeElement.id, 'scoreDisplay');
    assert.deepEqual(f.errors, []);
    // A style mutation on unrelated UI must not repeat or replace the announcement/focus.
    d.querySelector('.container').style.borderRadius = '21px'; await tick();
    assert.equal(d.activeElement.id, 'scoreDisplay');
    // Reading updates must never interrupt editing or invoke focus() on a response field.
    w.updateQuestion(); await tick();
    d.querySelector('#userInput').focus();
    d.querySelector('#qDisplay').textContent += ' Synthetic update'; await tick();
    assert.equal(d.activeElement.id, 'userInput');
  } finally { f.close(); }
});

test('DOM roleplay/story controls retain selection and original handlers', { skip: !JSDOM }, async () => {
  for (const lang of ['es','de','it','eal']) {
    const f = await fixture(lang); const { w, d } = f;
    try {
      keyboardClick(w, d.querySelector('#tabRole')); await tick();
      const choice = d.querySelector('#sectionRoleplay .rp-btn-select');
      assert.equal(choice.tagName, 'BUTTON'); keyboardClick(w, choice); await tick();
      assert.equal(choice.getAttribute('aria-pressed'), 'true');
      assert.ok(d.querySelector('#rpArea').getClientRects().length);
      d.querySelector('#nextAudioBtn').click(); await tick(); await tick();
      assert.equal(d.querySelector('#rpInput').disabled, false);
      d.querySelector('#rpInput').value = 'Synthetic roleplay reply';
      d.querySelector('#rpSendBtn').click(); await new Promise(resolve => setTimeout(resolve, 550));
      assert.match(d.querySelector('#rpChat').textContent, /Synthetic roleplay reply/);
      assert.equal(d.querySelector('#rpInput').disabled, true);
      if (['it','de'].includes(lang)) {
        d.querySelector('#tabStory').click(); await tick();
        const story = d.querySelector('#sectionStory .rp-btn-select'); keyboardClick(w, story); await tick();
        assert.equal(story.getAttribute('aria-pressed'), 'true');
        assert.ok(d.querySelector('#storyArea').getClientRects().length);
      }
      assert.deepEqual(f.errors, []);
    } finally { f.close(); }
  }
});

test('DOM Irish dynamic poem and Sraith choices are real buttons', { skip: !JSDOM }, async () => {
  const f = await fixture('ga'); const { w, d } = f;
  try {
    for (const [tab, selector] of [['tabPoem','#poemButtonsContainer'],['tabSraith','#sraithSelector']]) {
      keyboardClick(w, d.getElementById(tab)); await tick();
      const button = d.querySelector(selector + ' button'); assert.ok(button);
      keyboardClick(w, button); await tick(); assert.equal(button.getAttribute('aria-pressed'), 'true');
    }
  } finally { f.close(); }
});

test('DOM complete conversation/full mock routes preserve score contracts (synthetic AI only)', { skip: !JSDOM }, async () => {
  for (const lang of ['es','fr','de','it','pl','ga']) {
    const f = await fixture(lang); const { w, d } = f;
    try {
      w.callSmartAI = async () => JSON.stringify(reply(lang, 'mock'));
      if (lang === 'de') {
        w.openGermanFullMockSetup(); await tick();
        for (const name of ['preparedStory','preparedRoleplay']) {
          [...d.querySelectorAll(`input[name="${name}"]`)].slice(0,3).forEach(input => { input.checked = true; });
        }
        await w.startGermanFullMock();
        for (let i = 0; i < 14; i++) {
          d.querySelector('#fullMockInput').value = 'Synthetic response for full mock.';
          await w.submitGermanFullMockAnswer(); await tick();
        }
        assert.match(d.querySelector('#mockTotalScore').textContent, /100/);
        assert.equal(d.querySelector('#fullMockResult').style.display, 'block');
      } else {
        w.startMockExam(); await tick();
        if (lang === 'es') {
          for (const button of [...d.querySelectorAll('.mock-rp-option')].slice(0,3)) button.click();
          await tick();
          assert.equal(d.querySelectorAll('.mock-rp-option[aria-pressed=true]').length, 3);
          assert.equal(d.querySelector('#mockBeginBtn').disabled, false);
          w.beginMockConversation();
        }
        if (['it','pl'].includes(lang)) {
          d.querySelector('#mockContext').value = 'A fictional class project about a city.';
          w.beginMockExam();
        }
        const length = { es:6, fr:6, it:10, pl:7, ga:5 }[lang];
        for (let i = 0; i < length; i++) {
          d.querySelector('#userInput').value = 'Synthetic response for full mock.';
          await w.analyze(); await tick();
          if (['es','ga'].includes(lang) && i < length-1) { d.querySelector('#btnReset').click(); await tick(); }
        }
        if (['fr','it','pl'].includes(lang)) {
          await w.showMockSummary(); await tick();
          assert.match(d.querySelector('#scoreDisplay').textContent, lang === 'fr' ? /80/ : /100/);
        }
        if (lang === 'es') {
          w.finishMockConversation(); w.startMockRoleplay();
          w.callSmartAI = async () => JSON.stringify({ total_score:30, overall_es:'Synthetic feedback.', overall_en:'Synthetic feedback.', turns:Array.from({length:5},(_,i)=>({turn:i+1,score:6,feedback_es:'Synthetic feedback.',feedback_en:'Synthetic feedback.',errors:[]})) });
          for (let i = 0; i < 5; i++) {
            w.reproducirSiguienteAudio(); await tick();
            d.querySelector('#rpInput').value = 'Synthetic roleplay response';
            w.enviarRespuestaRP(); await new Promise(resolve => setTimeout(resolve, 550));
          }
          assert.match(d.querySelector('.mock-total-score').textContent, /100/);
        }
        if (lang === 'ga') assert.match(d.querySelector('#scoreDisplay').textContent, /100/);
      }
      assert.deepEqual(f.errors, [], lang);
    } finally { f.close(); }
  }
});

test('DOM AI failure restores the submit control and retains the typed answer', { skip: !JSDOM }, async () => {
  const f = await fixture('es'); const { w, d } = f;
  try {
    d.querySelector('#topicGrid button').click();
    d.querySelector('#userInput').value = 'Synthetic answer retained after failure.';
    w.callSmartAI = async () => { throw new Error('Synthetic offline error'); };
    await w.analyze(); await tick();
    assert.equal(d.querySelector('#btnAction').disabled, false);
    assert.equal(d.querySelector('#exerciseArea').getAttribute('aria-busy'), 'false');
    assert.equal(d.querySelector('#userInput').value, 'Synthetic answer retained after failure.');
    assert.ok(f.errors.some(x => /Synthetic offline error/.test(x)));
  } finally { f.close(); }
});
