/* Presentation adapter: observes existing UI, never calls AI or changes task state. */
(() => {
  'use strict';
  const status = document.createElement('div');
  status.id = 'a11yStatus';
  status.className = 'a11y-status';
  status.lang = 'en';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  document.body.appendChild(status);

  const set = (element, name, value) => {
    if (element && element.getAttribute(name) !== String(value)) element.setAttribute(name, String(value));
  };
  const visible = element => !!element && !element.closest('[hidden]') && element.getClientRects().length > 0;
  const text = element => element?.textContent.replace(/\s+/g, ' ').trim() || '';
  const editing = () => document.activeElement?.matches('textarea, input, select, [contenteditable="true"]');
  let keyboard = false;
  let action = null;
  let previous = new Map();
  let initialized = false;
  let announcementTimer;

  document.addEventListener('keydown', event => {
    if (!event.altKey && !event.ctrlKey && !event.metaKey) keyboard = true;
  }, true);
  document.addEventListener('pointerdown', () => { keyboard = false; }, true);
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const group = button.parentElement?.closest('[id]');
    action = { button, label: text(button), group: group?.id, keyboard };
  }, true);

  const tabs = { tabConv: 'sectionConversation', tabRole: 'sectionRoleplay',
    tabStory: 'sectionStory', tabDoc: 'sectionDocument', tabPoem: 'sectionPoetry', tabSraith: 'sectionSraith' };

  function syncControls() {
    document.querySelectorAll('button.level-btn, button.mode-btn, button.tab-btn, button.rp-btn-select, #topicGrid button.topic-btn').forEach(button => {
      set(button, 'aria-pressed', button.classList.contains('active'));
      if (tabs[button.id]) set(button, 'aria-controls', tabs[button.id]);
    });
    const disclosures = [['.info-toggle', 'infoBox'], ['#btnHint', 'hintBox']];
    disclosures.forEach(([selector, id]) => {
      const panel = document.getElementById(id);
      document.querySelectorAll(selector).forEach(button => {
        if (panel) { set(button, 'aria-controls', id); set(button, 'aria-expanded', visible(panel)); }
      });
    });
    set(document.getElementById('hintBtn'), 'aria-controls', 'rpChat');
    document.querySelectorAll('button').forEach(button => {
      if (/^[✖✖️×]+$/u.test(text(button))) set(button, 'aria-label', 'Close study help');
    });
    // A topic grid may be rebuilt by a level change. Restore only keyboard
    // focus to its equivalent control, without selecting or clicking it again.
    if (action?.keyboard && !action.button.isConnected && document.activeElement === document.body && action.group) {
      const group = document.getElementById(action.group);
      const replacement = [...(group?.querySelectorAll('button') || [])].find(button => text(button) === action.label);
      if (visible(replacement)) { replacement.focus({ preventScroll: true }); action.button = replacement; }
    }
  }

  function notify(message, target) {
    clearTimeout(announcementTimer);
    // Focus a short reading target for keyboard users, never the response field.
    // Pointer/touch users keep focus and receive one short polite status instead.
    if (action?.keyboard && visible(target) && !editing() &&
        (document.activeElement === action.button || document.activeElement === document.body)) {
      set(target, 'tabindex', '-1');
      if (!/^H[1-6]$/.test(target.tagName)) { set(target, 'role', 'heading'); set(target, 'aria-level', '2'); }
      status.textContent = '';
      target.focus({ preventScroll: true });
    } else if (status.textContent === message) {
      // A different question can produce the same short announcement. Re-arm
      // the existing live region, without reading the whole question twice.
      status.textContent = '';
      announcementTimer = setTimeout(() => { status.textContent = message; }, 40);
    } else {
      status.textContent = message;
    }
  }

  function sync() {
    syncControls();
    const next = new Map();
    let update = null;
    const watch = (key, element, message, target = element) => {
      const value = visible(element) ? text(element) : '';
      next.set(key, value);
      if (initialized && value && previous.get(key) !== value) update = { message, target };
    };
    // Low priority updates first: a single mutation batch announces at most
    // one outcome, preferring a new question or result to setup/progress text.
    watch('study', document.getElementById('studyContainer'), 'Study guidance updated.', document.querySelector('#studyContainer h3, #studyContainer h4'));
    for (const id of ['mockPanel', 'mockSetup', 'fullMockSetup']) {
      const panel = document.getElementById(id);
      watch(id, panel, 'Mock exam instructions updated.', panel?.querySelector('h2, h3, .mock-score-preview'));
    }
    for (const id of ['rpContext', 'storyTitle', 'sraithTitle', 'poemTitle', 'aiQuestions', 'qTranslation']) {
      watch(id, document.getElementById(id), 'Activity content updated.');
    }
    watch('question', document.getElementById('qDisplay'), 'New question available.');
    watch('fullMockQuestion', document.getElementById('fullMockPrompt'), 'New mock-exam question available.');

    const chat = document.getElementById('rpChat');
    const chatText = visible(chat) ? text(chat) : '';
    next.set('chat', chatText);
    if (initialized && chatText && previous.get('chat') !== chatText) {
      update = { message: 'Role-play conversation updated.', target: null };
    }
    const rpInput = document.getElementById('rpInput');
    const ready = visible(rpInput) && !rpInput.disabled;
    next.set('turnReady', ready);
    if (initialized && ready && !previous.get('turnReady')) update = { message: 'Your turn. The role-play response field is ready.', target: null };

    const help = document.getElementById('aiExplanationBox');
    watch('help', help, 'Study help updated.', help?.querySelector('strong'));
    const busyButtons = [...document.querySelectorAll('button:disabled')].filter(button => visible(button) && /⏳/.test(text(button)));
    const busy = (visible(help) && text(help).includes('⏳')) || busyButtons.length > 0 || visible(document.getElementById('fullMockLoading')) || visible(document.getElementById('rpEvaluationLoading'));
    next.set('busy', busy);
    for (const id of ['exerciseArea', 'docStep3', 'storyArea', 'sraithArea', 'fullMockArea']) set(document.getElementById(id), 'aria-busy', busy);
    if (initialized && busy && !previous.get('busy')) update = { message: 'Please wait. Preparing your response.', target: null };
    if (initialized && !busy && previous.get('busy') && !update) update = { message: 'Request finished. You can continue.', target: null };

    for (const id of ['scoreDisplay', 'scoreDisplayDoc', 'scoreDisplayStory', 'scoreDisplaySraith', 'mockTotalScore']) {
      const score = document.getElementById(id);
      watch(id, score, /^Ready for feedback$/i.test(text(score))
        ? 'Mock complete. Select View final feedback to see your result.'
        : `Feedback and result available. ${text(score)}`);
    }
    const rpScore = document.querySelector('.roleplay-evaluation h3');
    watch('rpScore', rpScore, `Role-play feedback available. ${text(rpScore)}`);
    const final = document.querySelector('.mock-final-summary .mock-total-score');
    watch('spanishFinal', final, `Mock exam result available. ${text(final)}`);
    // Hidden -> visible transitions count as new content even when reused text
    // is identical; unrelated class/style changes do not repeat announcements.
    previous = next;
    if (initialized && update) notify(update.message, update.target);
    initialized = true;
  }

  sync();
  new MutationObserver(records => {
    if (records.some(record => record.target !== status && !status.contains(record.target))) sync();
  }).observe(document.body, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['class', 'style', 'disabled', 'hidden'] });
})();
