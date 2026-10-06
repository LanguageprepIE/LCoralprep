function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function parseAIJSON(raw) {
  const cleaned = String(raw || '').replace(/```json|```/gi, '').trim();
  try { return JSON.parse(cleaned); } catch (_) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    throw new Error('The AI response was not structured as JSON.');
  }
}

// ===========================================
// CONFIGURACIÓN (BACKEND ACTIVADO 🔒)
// ===========================================
async function callSmartAI(prompt) {
    try {
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (!response.ok) throw new Error(`Netlify Error: ${response.statusText}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || "AI Error");
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("AI Call Failed:", e);
        throw e;
    }
}

let speechRequestId = 0;

function scrollToVisibleSection(id) {
    const element = document.getElementById(id);
    if (!element) return;
    window.requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function speakWithBrowserTTS(text) {
    const synth = window.speechSynthesis;
    if (!synth || !text || !text.trim()) return;
    const requestId = ++speechRequestId;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    utterance.onerror = event => console.warn('Speech playback failed:', event.error);
    window.setTimeout(() => {
        if (requestId === speechRequestId) synth.speak(utterance);
    }, 120);
}

// --- NAVEGACIÓN ---
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabStory').className = tab === 'story' ? 'tab-btn active' : 'tab-btn';
  
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
  
  const sectionStory = document.getElementById('sectionStory');
  if (sectionStory) sectionStory.style.display = tab === 'story' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: CONVERSATION (AI - GEMINI)
// ===========================================
let currentLevel = 'OL';
let currentMode = 'exam';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// Base de datos de Conversación (15 Temas) + STUDY MODE CHECKPOINTS
const DATA_CONV = [
  { 
    title: "1. Sich vorstellen", 
    OL: "Wie heißen Sie und wie alt sind Sie? Wann haben Sie Geburtstag?", 
    HL: "Erzählen Sie mir ein bisschen über sich selbst. Wie würden Sie Ihren Charakter beschreiben?",
    check_HL: "Name, Alter, Geburtstag (Datum), Aussehen (Ich habe... Augen/Haare), Charakter (Ich bin... + 3 Adjektive).",
    checkpoints_OL: ["Ich heiße... (Name)", "Ich bin X Jahre alt", "Ich wohne in..."],
    checkpoints_HL: ["Aussehen (Ich habe blaue Augen)", "Charakter (Ehrgeizig, Offen)", "Geburtstag (Am dritten Mai...)"],
    checkpoints_TOP: ["✨ Idiom: Ich habe die Nase voll", "✨ Grammar: Seit + Dativ (Seit drei Jahren)", "✨ Vocab: Stärken und Schwächen"]
  },
  { 
    title: "2. Familie", 
    OL: "Haben Sie Geschwister? Wie heißen sie?", 
    HL: "Verstehen Sie sich gut mit Ihren Eltern? Gibt es oft Streit zu Hause?",
    check_HL: "Personenzahl (Wir sind... Personen), Berufe der Eltern, Geschwister (Beschreibung), Verhältnis (Ich verstehe mich gut/schlecht mit...), Streitgründe.",
    checkpoints_OL: ["Ich habe einen Bruder / eine Schwester", "Meine Mutter ist...", "Wir sind fünf Personen"],
    checkpoints_HL: ["Sich gut verstehen mit...", "Streit über Hausarbeit", "Ältester/Jüngster sein"],
    checkpoints_TOP: ["✨ Idiom: Blut ist dicker als Wasser", "✨ Grammar: Genitiv (Das Haus meines Vaters)", "✨ Vocab: Patchwork-Familie"]
  },
  { 
    title: "3. Wohnort", 
    OL: "Wo wohnen Sie? Wohnen Sie gern dort?", 
    HL: "Beschreiben Sie Ihre Gegend. Was sind die Vor- und Nachteile vom Leben auf dem Land/in der Stadt?",
    check_HL: "Wohnort (Ich wohne in...), Beschreibung (Es gibt...), Vorteile/Nachteile (Es ist ruhig/langweilig), Stadt vs Land Vergleich.",
    checkpoints_OL: ["Ich wohne in Dublin", "Es gibt einen Park", "Es ist ruhig"],
    checkpoints_HL: ["Vorteile (Verkehrsmittel)", "Nachteile (Lärm, Kriminalität)", "Stadtleben vs Landleben"],
    checkpoints_TOP: ["✨ Idiom: Hier ist tote Hose (Nothing happening)", "✨ Grammar: Weder... noch (Neither... nor)", "✨ Vocab: Öffentliche Verkehrsmittel"]
  },
  { 
    title: "4. Schule", 
    OL: "Wie viele Fächer lernen Sie? Was ist Ihr Lieblingsfach?", 
    HL: "Was halten Sie vom irischen Schulsystem? Ist der Druck für das Leaving Cert zu hoch?",
    check_HL: "Schulart, Fächer (Ich lerne...), Lieblingsfach (Mein Lieblingsfach ist... weil...), Meinung zum System (Punkte, Druck, Uniform).",
    checkpoints_OL: ["Meine Schule ist gemischt", "Ich lerne Deutsch und Mathe", "Ich trage eine Uniform"],
    checkpoints_HL: ["Das Punktesystem (CAO)", "Druck und Stress", "Schulregeln (Handyverbot)"],
    checkpoints_TOP: ["✨ Idiom: Büffeln (Cramming)", "✨ Grammar: Wenn ich Direktor wäre...", "✨ Vocab: Leistungsdruck"]
  },
  { 
    title: "5. Freizeit & Hobbys", 
    OL: "Was machen Sie in Ihrer Freizeit? Spielen Sie ein Instrument?", 
    HL: "Warum ist Sport wichtig für Jugendliche? Erzählen Sie mir von Ihren Interessen.",
    check_HL: "Sportart (Ich spiele...), Musik/Lesen, Häufigkeit (Oft, Jeden Tag), Wichtigkeit (Gesundheit, Stressabbau), Wortstellung.",
    checkpoints_OL: ["Ich spiele Fußball", "Ich höre Musik", "Ich treffe Freunde"],
    checkpoints_HL: ["Mannschaftssport vs Einzelsport", "Wichtig für die Gesundheit", "Abschalten vom Stress"],
    checkpoints_TOP: ["✨ Idiom: Ich drücke dir die Daumen", "✨ Grammar: Interessieren für (Reflexiv)", "✨ Vocab: Ausgleich zum Alltag"]
  },
  { 
    title: "6. Alltag", 
    OL: "Wann stehen Sie auf? Was essen Sie zum Frühstück?", 
    HL: "Wie sieht ein typischer Samstag bei Ihnen aus? Helfen Sie im Haushalt?",
    check_HL: "Trennbare Verben (Ich stehe... auf), Uhrzeiten, Mahlzeiten, Hausarbeit (Ich muss...)."
  },
  { 
    title: "7. Ferien & Reisen", 
    OL: "Was haben Sie letzten Sommer gemacht? Waren Sie im Ausland?", 
    HL: "Fahren Sie lieber mit der Familie oder mit Freunden in den Urlaub? Warum?",
    check_HL: "Perfekt Form (Ich bin... gefahren), Reiseziel, Wetter, Präferenz (Lieber mit Freunden, weil...)."
  },
  { 
    title: "8. Zukunftspläne", 
    OL: "Was möchten Sie nach der Schule machen? Wollen Sie studieren?", 
    HL: "Welchen Beruf möchten Sie später ausüben? Ist es schwer, heutzutage einen Job zu finden?",
    check_HL: "Futur I (Ich werde...), Modalverben (Ich möchte...), Studium/Ausbildung, Gap Year, Berufswunsch."
  },
  { 
    title: "9. Arbeit (Nebenjob)", 
    OL: "Haben Sie einen Nebenjob? Wo arbeiten Sie?", 
    HL: "Sollten Schüler neben der Schule arbeiten? Was sind die Vor- und Nachteile?",
    check_HL: "Jobbeschreibung (Ich arbeite als...), Stundenlohn/Zeiten, Meinung (Geld vs Zeit für Schule), Vor-/Nachteile."
  },
  { 
    title: "10. Deutsch & Sprachen", 
    OL: "Warum lernen Sie Deutsch? Waren Sie schon mal in Deutschland?", 
    HL: "Warum ist es wichtig, Fremdsprachen zu lernen? Was gefällt Ihnen an der deutschen Kultur?",
    check_HL: "Gründe (Jobchancen, Reisen), Erfahrung in Deutschland, Meinung (Deutsch ist schwer/logisch), Nebensätze."
  },
  { 
    title: "11. Soziale Probleme", 
    OL: "Ist das Leben für Jugendliche heute schwer?", 
    HL: "Alkohol, Drogen und Obdachlosigkeit. Was sind die größten Probleme in Irland heute?",
    check_HL: "Spezifisches Problem (Obdachlosigkeit, Alkohol), Ursachen, Lösungen (Die Regierung sollte...), Eigene Meinung."
  },
  { 
    title: "12. Technologie", 
    OL: "Haben Sie ein Handy? Wie oft benutzen Sie das Internet?", 
    HL: "Welche Rolle spielen soziale Medien in Ihrem Leben? Fluch oder Segen?",
    check_HL: "Nutzung (Ich benutze...), Soziale Medien, Gefahren (Cybermobbing), Vorteile (Kontakt bleiben)."
  },
  { 
    title: "13. Letztes Wochenende", 
    OL: "Was haben Sie letztes Wochenende gemacht? Sind Sie ausgegangen?", 
    HL: "Erzählen Sie mir genau, was Sie letztes Wochenende gemacht haben. War es ein typisches Wochenende?",
    check_HL: "Perfekt (Ich habe gelernt, Ich bin gegangen), Präteritum (Es war lustig), Zeitangaben."
  },
  { 
    title: "14. Nächstes Wochenende", 
    OL: "Was werden Sie nächstes Wochenende machen?", 
    HL: "Was sind Ihre Pläne für das nächste Wochenende? Werden Sie lernen oder sich entspannen?",
    check_HL: "Futur I (Ich werde... gehen), Pläne (Ich habe vor, zu...), Modalverben (Ich möchte...), Aktivitäten."
  },
  { 
    title: "15. Feste & Feiern", 
    OL: "Wie feiern Sie Ihren Geburtstag? Was machen Sie an Weihnachten?", 
    HL: "Welches ist Ihr Lieblingsfest? Wie feiern die Iren im Vergleich zu den Deutschen?",
    check_HL: "Feiertage, Traditionen (Geschenke, Essen), Vergleich (In Irland...), Meinung."
  }
];

const PAST_Q = ["Was haben Sie gestern gemacht?", "Was haben Sie letzten Sommer gemacht?", "Wie haben Sie Ihren letzten Geburtstag gefeiert?"];
const FUT_Q = ["Was werden Sie morgen machen?", "Was sind Ihre Pläne für den Sommer?", "Was werden Sie nach den Prüfungen machen?"];

// ===========================================
// LÓGICA DE CONTROL (NIVEL Y MODO)
// ===========================================

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'OL' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'HL' ? 'level-btn hl active' : 'level-btn'; 
    
    if(currentMode === 'exam') {
        if(currentTopic && !isMockExam) updateQuestion(); 
    } else {
        renderCheckpoints(); 
    }
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('modeExam').className = mode === 'exam' ? 'mode-btn active' : 'mode-btn';
    document.getElementById('modeStudy').className = mode === 'study' ? 'mode-btn active' : 'mode-btn';

    const exerciseArea = document.getElementById('exerciseArea');
    const resultArea = document.getElementById('result'); 
    
    let studyContainer = document.getElementById('studyContainer');
    if (!studyContainer) { initStudyHTML(); studyContainer = document.getElementById('studyContainer'); }

    if (mode === 'exam') {
        studyContainer.style.display = 'none';
        if (document.getElementById('scoreDisplay').innerText !== "") {
             resultArea.style.display = 'block';
             exerciseArea.style.display = 'none';
        } else {
             exerciseArea.style.display = 'block';
             resultArea.style.display = 'none';
        }
    } else {
        studyContainer.style.display = 'block';
        exerciseArea.style.display = 'none';
        resultArea.style.display = 'none';
        renderCheckpoints(); 
    }
}

// ===========================================
// FUNCIONES DE UI
// ===========================================

function initConv() { 
    const g = document.getElementById('topicGrid'); 
    g.innerHTML = ""; 
    DATA_CONV.forEach((item) => { 
        const b = document.createElement('button'); 
        b.className = 'topic-btn'; 
        b.innerText = item.title; 
        b.onclick = () => { 
            isMockExam = false; 
            document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
            b.classList.add('active'); 
            currentTopic = item; 
            
            if(currentMode === 'study') {
                renderCheckpoints();
            } else {
                updateQuestion(); 
            }
        }; 
        g.appendChild(b); 
    }); 
}

function toggleHint() {
    const box = document.getElementById('hintBox');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function speakText() {
    const prompt = isMockExam ? mockQuestions[mockIndex] : (currentTopic ? currentTopic[currentLevel] : '');
    const text = String(prompt || '')
        .replace(/\s*\((?:OL|HL|VERGANGENHEIT|ZUKUNFT)\)\s*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    speakWithBrowserTTS(text);
}

// === MOCK EXAM ===
function startMockExam() { 
    setMode('exam');
    isMockExam = true; 
    mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    
    let i = [...Array(DATA_CONV.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA_CONV[i[0]][currentLevel],
        DATA_CONV[i[1]][currentLevel],
        DATA_CONV[i[2]][currentLevel],
        PAST_Q[Math.floor(Math.random()*3)],
        FUT_Q[Math.floor(Math.random()*3)]
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Frage ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
    
    const btnHint = document.getElementById('btnHint');
    const hintBox = document.getElementById('hintBox');
    if(btnHint) btnHint.style.display = 'none';
    if(hintBox) hintBox.style.display = 'none';
    scrollToVisibleSection('exerciseArea');
}

function nextMockQuestion() { mockIndex++; showMockQuestion(); }

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('studyContainer').style.display = 'none'; 
    
    document.getElementById('qDisplay').innerHTML = currentTopic[currentLevel]; 
    document.getElementById('userInput').value = "";

    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    if (hintBox && btnHint) {
        hintBox.style.display = 'none'; 
        if (currentLevel === 'HL' && currentTopic.check_HL) {
            btnHint.style.display = 'inline-block';
            hintBox.innerHTML = "<strong>📝 Wichtige Punkte / Key Points (HL):</strong><br>" + currentTopic.check_HL;
        } else {
            btnHint.style.display = 'none'; 
        }
    }
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    if(isMockExam) {
        isMockExam = false;
        document.getElementById('userInput').value = "";
        document.getElementById('qDisplay').innerHTML = "Wählen Sie ein Thema oder starten Sie das Mock Exam.";
        const btnHint = document.getElementById('btnHint');
        if(btnHint) btnHint.style.display = 'none';
    } else {
        document.getElementById('userInput').value = "";
    }
}

// ===========================================
// FUNCIÓN ANALYZE (MODO EXAMEN)
// ===========================================
async function analyze() {
  const t = document.getElementById('userInput').value.trim();
  if (t.length < 5) return alert("Bitte sagen Sie etwas mehr...");
  const b = document.getElementById('btnAction');
  b.disabled = true;
  const originalButtonText = b.innerText;
  b.innerText = "⏳ Evaluating...";
  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic?.[currentLevel];
  const criteria = currentLevel === 'HL' || currentLevel === 'Advanced'
    ? (currentTopic?.check_HL || currentTopic?.checkpoints_HL || '')
    : '';
  const advanced = (currentLevel === 'HL');
  const prompt = `
    Act as a fair Leaving Certificate German oral examiner in Ireland.
    Assess communicative success, relevance to the question, development, range, accuracy and comprehensibility at the stated level.
    Level: ${currentLevel}. Question: ${questionContext}
    Learner response (raw speech transcription): ${t}
    Study guidance (optional support, never a compulsory checklist): ${criteria}
    Apply level-appropriate expectations. Ordinary/OL answers should be judged for clear basic communication; HL/Advanced answers can show more development and range, but do not expect native-speaker performance. Do not require every suggested content point.
    Ignore punctuation, capitalization and accent-mark differences that may be transcription artifacts. Do not assess pronunciation, accent or prosody from text. Penalize only clear, meaningful language errors; distinguish errors from likely speech-recognition artifacts.
    Address the learner consistently using German formal Sie; never switch to informal address.
    Be generously fair: reward what the learner successfully communicates and demonstrates. Do not search for imperfections merely to hold back a high mark, but do not hide clear weaknesses. Judge against realistic Leaving Certificate senior-cycle performance, not native-speaker perfection.
Use the whole 0–100 scale. Treat these bands as practice guidance inspired by Leaving Certificate MFL oral descriptors, not as a mathematical conversion of an official mark:
- 90–100: top-band senior-cycle performance: sustained, well-developed, autonomous/proactive and generally well controlled. Occasional slips or minor grammatical inaccuracies are fully compatible with this band when they do not undermine communication or overall control. 100 does NOT mean error-free, native or bilingual speech.
- 82–89: excellent/effective performance: clear, developed and independent, with good range and control. Inaccuracies may occur but communication remains secure.
- 72–81: very good/competent performance: relevant and generally developed, with successful communication. Noticeable inaccuracies or uneven control may be present, but meaning is normally clear.
- 60–71: adequate/competent performance: straightforward communication succeeds, though development, range or control is limited and inaccuracies may recur.
- 40–59: limited performance: communication is possible but substantial support, simplification or recurring errors may be needed; inaccuracies can impede communication.
- Below 40: substantial difficulty communicating a relevant, comprehensible response.
Do not lower a score simply because extra idioms, rarer vocabulary, more tenses or more sophisticated structures could be added. For a strong response, next steps may be optional enrichment rather than reasons for withholding marks. Return feedback in German and concise English.
    Return valid JSON only: {"score":0,"feedback_de":"...","feedback_en":"...","strengths":["..."],"next_steps":["..."],"connectors":["..."],"vocabulary_suggestions":[{"basic":"...","richer":"..."}],"errors":[{"original":"...","correction":"...","explanation_en":"..."}]}.
    Keep arrays concise (max 3 items each). Do not invent errors; use empty arrays when none are clear.
  `;
  try {
    const raw = await callSmartAI(prompt);
    const j = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const score = Math.max(0, Math.min(100, Number(j.score) || 0));
    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    const scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.innerText = `Ergebnis: ${score}%`;
    scoreDisplay.style.color = score >= (advanced ? 75 : 85) ? '#166534' : (score >= 50 ? '#ca8a04' : '#991b1b');
    document.getElementById('fbDE').innerText = '🌍 ' + (j.feedback_de || '');
    document.getElementById('fbEN').innerText = '🇬🇧 ' + (j.feedback_en || '');
    const list = document.getElementById('errorsList');
    list.replaceChildren();
    const addGroup = (heading, items, render) => {
      if (!Array.isArray(items) || !items.length) return;
      const section = document.createElement('section');
      const title = document.createElement('strong'); title.textContent = heading; section.appendChild(title);
      items.slice(0, 3).forEach(item => { const row = document.createElement('div'); row.className = 'error-item'; render(row, item); section.appendChild(row); });
      list.appendChild(section);
    };
    addGroup('Strengths', j.strengths, (row, item) => row.textContent = item);
    addGroup('Next steps', j.next_steps, (row, item) => row.textContent = item);
    addGroup('Useful connectors', j.connectors, (row, item) => row.textContent = item);
    addGroup('Vocabulary upgrades', j.vocabulary_suggestions, (row, item) => row.textContent = (item.basic || '') + ' → ' + (item.richer || ''));
    addGroup('Corrections', j.errors, (row, item) => row.textContent = (item.original || '') + ' → ' + (item.correction || '') + ' (💡 ' + (item.explanation_en || '') + ')');
    if (!list.childElementCount) list.textContent = '✅ No clear corrections needed.';
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) {
      btnReset.innerText = "➡️ Nächste Frage";
      btnReset.onclick = nextMockQuestion;
    } else {
      btnReset.innerText = isMockExam ? "🏁 Prüfung beenden" : "🔄 Anderes Thema";
      btnReset.onclick = resetApp;
    }
  } catch (e) {
    console.error(e);
    alert('⚠️ Evaluation failed: ' + e.message);
  } finally {
    b.disabled = false;
    b.innerText = originalButtonText;
  }
}

// ===========================================
// MODO FORMACIÓN (STUDY MODE AI)
// ===========================================

function initStudyHTML() {
    // El contenedor ya existe en HTML
}

function renderCheckpoints() {
  const container = document.getElementById('studyContainer');
  if (!container) return;
  if (!currentTopic) { container.textContent = 'Please select a topic to study.'; return; }
  container.replaceChildren();
  const title = document.createElement('h3'); title.textContent = '📚 Study Mode: ' + currentTopic.title; container.appendChild(title);
  const intro = document.createElement('p'); intro.className = 'small-text'; intro.textContent = 'Use these prompts as optional practice. Study points are guidance, not a checklist.'; container.appendChild(intro);
  const list = document.createElement('div'); list.id = 'checkpointsList'; container.appendChild(list);
  const box = document.createElement('div'); box.id = 'aiExplanationBox'; box.className = 'ai-box'; box.style.display = 'none'; container.appendChild(box);
  const groups = [
    ['Practice question', [currentTopic[currentLevel]], 'question'],
    ['Language foundations', currentTopic.checkpoints_OL || currentTopic.checkpoints_TOP, 'language'],
    ['Develop your answer', currentTopic.checkpoints_HL || currentTopic.check_HL, 'language']
  ];
  groups.forEach(([heading, items, kind]) => {
    const values = (Array.isArray(items) ? items : items ? [items] : []).filter(Boolean);
    if (!values.length) return;
    const h = document.createElement('h4'); h.textContent = heading; list.appendChild(h);
    values.forEach(value => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'checkpoint-btn'; button.textContent = value;
      button.addEventListener('click', () => askAIConcept(value, kind)); list.appendChild(button);
    });
  });
}

async function askAIConcept(concept, kind = 'language') {
  const box = document.getElementById('aiExplanationBox');
  if (!box) return;
  box.style.display = 'block'; box.textContent = '⏳ Preparing a guided study plan...';
  const prompt = `
    You are a supportive German oral-exam tutor. Topic: ${currentTopic?.title || 'General'}.
    Learner level: ${currentLevel}. Practice item: ${concept}. Type: ${kind}.
    Explain the idea briefly in English, then provide a 3-step speaking plan (keywords, not a memorised script) and up to two natural German examples with English translations.
    Keep German formal Sie register throughout all target-language examples and never use informal address. Treat topic guidance as optional; do not imply that every bullet is required.
    Return valid JSON only: {"explanation_en":"...","speaking_plan":["..."],"examples":[{"target":"...","en":"..."}],"optional_challenge":"..."}.
  `;
  try {
    const raw = await callSmartAI(prompt);
    const data = parseAIJSON(raw);
    box.replaceChildren();
    const heading = document.createElement('strong'); heading.textContent = '💡 ' + concept; box.appendChild(heading);
    const explanation = document.createElement('p'); explanation.textContent = data.explanation_en || ''; box.appendChild(explanation);
    const planTitle = document.createElement('strong'); planTitle.textContent = 'Speaking plan'; box.appendChild(planTitle);
    const plan = document.createElement('ol');
    (Array.isArray(data.speaking_plan) ? data.speaking_plan : []).slice(0,3).forEach(item => { const li=document.createElement('li'); li.textContent=item; plan.appendChild(li); });
    box.appendChild(plan);
    (Array.isArray(data.examples) ? data.examples : []).slice(0,2).forEach(item => { const p=document.createElement('p'); p.textContent=(item.target || '') + ' — ' + (item.en || ''); box.appendChild(p); });
    if (data.optional_challenge) { const p=document.createElement('p'); p.textContent='Optional challenge: ' + data.optional_challenge; box.appendChild(p); }
  } catch (e) {
    console.error(e); box.textContent = '⚠️ Could not load the study guidance: ' + e.message;
  }
}

// ===========================================
// PARTE 2: ROLEPLAYS (INTACTA - AHORA CON SIE EN RP4)
// ===========================================
let rpActual = null; let pasoActual = 0; 
const RP_DATA = {
    1: { context: "Hund verloren (Missing Dog). You are staying with the Vogler family in Berlin. You lost their dog Otto in Grunewald.", dialogs: ["Guten Tag. Bitte setzen Sie sich. Wie kann ich Ihnen helfen?", "Verstehe. Um wann genau ist das passiert und wo im Grunewald waren Sie?", "Können Sie den Hund genauer beschreiben? Rasse, Aussehen, Charakter?", "Das ist hilfreich. Haben Sie schon etwas unternommen, um ihn zu finden?", ["Ich rate Ihnen, den Tierschutzverein anzurufen. Hier ist die Nummer.", "Hängen Sie auch Zettel in der Nachbarschaft auf. Wir melden uns, wenn wir etwas hören."]], sugerencias: ["Guten Tag. Ich heiße [Name] und wohne bei Familie Vogler. Ich muss einen Verlust melden: Der Hund der Familie ist weggelaufen.", "Es ist heute Morgen gegen 10 Uhr passiert. Ich war im Grunewald spazieren, als wir plötzlich einem Wildschwein begegnet sind.", "Otto ist ein kleiner Terrier-Mischling. Er hat braunes Fell und ist sehr freundlich.", "Ja, ich habe laut nach ihm gerufen und lange gewartet, aber er kam nicht zurück.", "Vielen Dank, Herr Wachtmeister. Das mache ich sofort."] },
    2: { context: "Anruf bei der Redaktion. You call 'Essen & Trinken' magazine.", dialogs: ["Redaktion 'Essen & Trinken', guten Tag. Was kann ich für Sie tun?", "Moment bitte... Hier spricht Müller. Wie war Ihr Name noch einmal?", "Aha. Und was genau möchten Sie wissen? Geht es um deutsche Küche?", "Interessant. Und wie ist das bei Ihnen in Irland? Welche deutschen Produkte sind dort beliebt?", ["Gut, ich kann Ihnen gerne einige alte Ausgaben zuschicken.", "Schicken Sie mir einfach eine E-Mail mit Ihrer Adresse. Auf Wiederhören."]], sugerencias: ["Guten Tag, hier spricht [Name] aus Irland. Ich mache ein Schulprojekt über Essen und Trinken.", "Entschuldigung, ich habe Ihren Namen akustisch nicht verstanden. Könnten Sie ihn bitte buchstabieren?", "Ich möchte wissen: Ist typisch deutsches Essen immer noch beliebt oder gibt es neue Trends?", "Also, in Irland kaufen viele Leute bei Lidl und Aldi ein. Deutsches Brot ist sehr beliebt.", "Das wäre fantastisch! Ich brauche Material für meine Collage. Danke!"] },
    3: { context: "Interview fürs Fernsehen (MDR). Erasmus student in Leipzig.", dialogs: ["Hallo! Wir sind vom MDR Fernsehen. Dürfen wir Ihnen ein paar Fragen stellen?", "Toll, dass Sie so gut Deutsch sprechen! Warum haben Sie sich für ein Erasmus-Jahr entschieden?", "Und warum ausgerechnet Leipzig? Was gefällt Ihnen hier?", "Wie finden Sie das Studium hier im Vergleich zu Irland? Sind die Studiengebühren ein Thema?", ["Vielen Dank für das Interview. Viel Erfolg noch!", "Das war sehr interessant. Genießen Sie Ihre Zeit in Leipzig!"]], sugerencias: ["Ja, natürlich. Ich heiße [Name] und das ist meine Gruppe. Wir kommen aus Irland.", "Ich wollte unbedingt meine Deutschkenntnisse verbessern und neue Leute kennenlernen.", "Leipzig ist eine wunderschöne Stadt mit viel Kultur und Geschichte. Außerdem sind die Mieten hier billiger.", "Das Punktesystem in Irland ist sehr stressig. Hier in Deutschland finde ich es gut, dass es keine Studiengebühren gibt.", "Danke schön! Auf Wiedersehen!"] },
    4: { context: "Eltern überreden (Electric Picnic).", dialogs: ["Hallo! Hier ist der Vater von Thomas. Schön, Sie kennenzulernen.", "Thomas hat erzählt, Sie haben ihn zu einem Festival eingeladen. Wann und wo ist das genau?", "Ich weiß nicht recht. Ist Thomas nicht noch zu jung für so eine weite Reise allein?", "Aber auf solchen Festivals gibt es doch immer viel Alkohol und Drogen. Ich mache mir Sorgen.", ["Na gut, wenn Sie meinen, dass Sie vernünftig sind...", "Okay, wir überlegen es uns noch einmal. Danke für den Anruf."]], sugerencias: ["Guten Tag, Herr Hofer. Ich freue mich auch sehr. Thomas und ich verstehen uns super.", "Ja, genau! Es ist das 'Electric Picnic' Festival im September.", "Ach, keine Sorge! Thomas ist fast 18 und sehr vernünftig. Außerdem hole ich ihn vom Flughafen ab.", "Ich verstehe Ihre Sorgen, aber wir passen gut auf uns auf. Es war alles sehr sicher letztes Jahr.", "Vielen Dank für Ihr Vertrauen, Herr Hofer!"] },
    5: { context: "Ferienjob (Tour Guide). Bus delay.", dialogs: ["Endlich! Wir warten schon seit einer Ewigkeit. Das geht ja gut los!", "Das Wetter ist auch furchtbar. Regnet es hier eigentlich immer?", "Und was steht jetzt auf dem Programm? Ich hoffe, nicht wieder stundenlang Busfahren.", "Ich habe viel Geld für diese Reise bezahlt und erwarte erstklassigen Service!", ["Na gut, hoffentlich wird das Hotel wenigstens besser sein.", "Wir werden sehen. Fahren wir jetzt endlich los?"]], sugerencias: ["Guten Tag und herzlich willkommen. Es tut mir leid, dass ich zu spät bin. Der Bus hatte eine Panne.", "Haha, das ist eben Irland! Aber morgen soll die Sonne scheinen.", "Nein, keine Sorge. Heute fahren wir nur kurz zum Hotel und essen zu Abend.", "Ich verstehe Ihren Ärger, aber wir haben ein tolles Programm für Sie zusammengestellt.", "Das Hotel ist ausgezeichnet. Bitte steigen Sie ein, wir fahren sofort los."] }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; speaking = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DATA[id].context;
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Examiner" to begin.</div>`;
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block"; nextBtn.innerText = "▶️ Start Examiner"; nextBtn.onclick = reproducirInterventoExaminer; 
    document.getElementById('rpInput').disabled = true; document.getElementById('rpSendBtn').disabled = true; document.getElementById('hintBtn').style.display = "none";
}

function reproducirInterventoExaminer() {
    let dialogText = RP_DATA[rpActual].dialogs[pasoActual];
    if (Array.isArray(dialogText)) dialogText = dialogText[Math.floor(Math.random() * dialogText.length)];
    const chat = document.getElementById('rpChat');
    const lastMsg = chat.lastElementChild;
    const isReplay = lastMsg && lastMsg.classList.contains('ex') && lastMsg.innerText.includes(dialogText);
    if (!isReplay) {
        if (pasoActual >= 5) { chat.innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`; document.getElementById('nextAudioBtn').style.display = "none"; return; }
        chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`; chat.scrollTop = chat.scrollHeight;
    }
    reproducirAudio(dialogText);
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block"; nextBtn.innerText = "🔄 Noch einmal hören / Replay"; nextBtn.onclick = () => reproducirAudio(dialogText);
}

function reproducirAudio(texto) {
    const u = new SpeechSynthesisUtterance(texto); u.lang = 'de-DE'; u.rate = 0.9;
    u.onend = habilitarInput; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
}

function habilitarInput() {
    if(pasoActual < 5) { 
        document.getElementById('rpInput').disabled = false; document.getElementById('rpSendBtn').disabled = false;
        document.getElementById('hintBtn').style.display = "block"; document.getElementById('rpInput').placeholder = "Type your reply...";
    }
}

function enviarRespuestaRP() {
    const inp = document.getElementById('rpInput'); const txt = inp.value.trim(); if(!txt) return;
    const chat = document.getElementById('rpChat'); chat.innerHTML += `<div class="bubble st">${txt}</div>`; chat.scrollTop = chat.scrollHeight;
    inp.value = ""; inp.disabled = true; document.getElementById('rpSendBtn').disabled = true; document.getElementById('hintBtn').style.display = "none";
    const nextBtn = document.getElementById('nextAudioBtn'); nextBtn.style.display = "none";
    pasoActual++;
    setTimeout(() => { 
        if(pasoActual < 5) { 
            nextBtn.style.display = "block"; nextBtn.innerText = "🔊 Weiter / Listen Next"; nextBtn.onclick = reproducirInterventoExaminer;
        } else { document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`; }
    }, 500);
}

function mostrarSugerencia() {
    const sug = RP_DATA[rpActual].sugerencias[pasoActual];
    if(sug) { const chat = document.getElementById('rpChat'); chat.innerHTML += `<div class="feedback-rp">💡 <b>Model Answer:</b> ${sug}</div>`; chat.scrollTop = chat.scrollHeight; }
}

// ===========================================
// PARTE 3: BILDERSERIEN (STORIES - OFFICIAL)
// ===========================================
let currentStoryTitle = "";
const STORIE_DATA = [ { title: "1. Handy Mobbing", context: "Bullying" }, { title: "2. Chancen durch Deutsch", context: "Careers" }, { title: "3. Die Abi-Tour", context: "School Trip" }, { title: "4. Die Geburtstagsüberraschung", context: "Birthday" }, { title: "5. Mehr Windkraft", context: "Energy" } ];

function selectStory(index, btn) {
    document.querySelectorAll('#sectionStory .rp-btn-select').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    currentStoryTitle = STORIE_DATA[index].title;
    document.getElementById('storyArea').style.display = 'block'; document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyTitle').innerText = currentStoryTitle; document.getElementById('userInputStory').value = "";
}

function speakStoryPrompt() {
    const text = "Erzählen Sie mir bitte, was hier passiert.";
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.9; window.speechSynthesis.speak(u); }
}

function readMyStoryInput() {
    const text = document.getElementById("userInputStory").value; if (!text) return;
    window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.9; window.speechSynthesis.speak(u);
}

async function analyzeStory() {
  const t = document.getElementById('userInputStory').value; if(t.length < 5) return alert("Bitte schreiben Sie etwas mehr...");
  const b = document.getElementById('btnActionStory'); b.disabled = true; b.innerText = "⏳ Korrigiere...";

  const prompt = `ACT AS: German Leaving Cert Examiner. TASK: Picture Sequence "${currentStoryTitle}". STUDENT: "${t}". INSTRUCTIONS: Maintain 'Sie' form perspective if addressing the student in feedback. OUTPUT JSON: { "score": 0-100, "feedback_de": "...", "feedback_en": "...", "errors": [{ "original": "...", "correction": "...", "explanation_en": "..." }] }`;

  try {
    const rawText = await callSmartAI(prompt);
    const j = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    document.getElementById('storyArea').style.display = 'none'; document.getElementById('resultStory').style.display = 'block';
    document.getElementById('userResponseTextStory').innerText = t;
    document.getElementById('scoreDisplayStory').innerText = `Ergebnis: ${j.score}%`;
    document.getElementById('scoreDisplayStory').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbDEStory').innerText = "🇩🇪 " + j.feedback_de; 
    document.getElementById('fbENStory').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListStory').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Super!";
  } catch (e) { console.error(e); alert("⚠️ Fehler: " + e.message); } finally { b.disabled = false; b.innerText = "✨ Prüfen"; }
}

function resetStory() { document.getElementById('resultStory').style.display = 'none'; document.getElementById('storyArea').style.display = 'block'; document.getElementById('userInputStory').value = ""; }

function readMyInput() {
    const text = document.getElementById('userInput').value;
    speakWithBrowserTTS(text);
}

// ===========================================
// FULL GERMAN MOCK · 2026 FORMAT · 40/30/30
// ===========================================
const FULL_MOCK_STORY_OPINIONS = [
  "Ist Handymobbing heutzutage ein großes Problem? Was sollte man dagegen tun?",
  "Warum ist es wichtig, Fremdsprachen zu lernen? Welche Chancen bietet Deutsch?",
  "Sind Abschlussfahrten eine gute Idee? Begründen Sie Ihre Meinung.",
  "Was bedeutet es für junge Menschen, achtzehn zu werden?",
  "Ist Windenergie eine gute Lösung für die Zukunft? Warum oder warum nicht?"
];

const FULL_MOCK_ROLEPLAY_LABELS = [
  "1. Hund verloren",
  "2. Redaktion anrufen",
  "3. Fernsehinterview",
  "4. Eltern überzeugen",
  "5. Ferienjob"
];

let germanFullMock = null;

function shuffled(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

function openGermanFullMockSetup() {
  populateGermanFullMockChoices();
  ['fullMockArea', 'fullMockLoading', 'fullMockResult'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById('fullMockSetup').style.display = 'block';
  document.getElementById('fullMockSetupError').textContent = '';
  scrollToVisibleSection('fullMockSetup');
}

function closeGermanFullMockSetup() {
  document.getElementById('fullMockSetup').style.display = 'none';
}

function populateGermanFullMockChoices() {
  const storyBox = document.getElementById('mockStoryChoices');
  const roleBox = document.getElementById('mockRoleplayChoices');
  if (!storyBox.childElementCount) {
    STORIE_DATA.forEach((story, index) => storyBox.appendChild(makeMockChoice('preparedStory', String(index), story.title)));
  }
  if (!roleBox.childElementCount) {
    FULL_MOCK_ROLEPLAY_LABELS.forEach((label, index) => roleBox.appendChild(makeMockChoice('preparedRoleplay', String(index + 1), label)));
  }
}

function makeMockChoice(name, value, labelText) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox'; input.name = name; input.value = value;
  const text = document.createElement('span'); text.textContent = labelText;
  label.append(input, text);
  return label;
}

function toggleGermanPartTwoSetup() {
  const route = document.querySelector('input[name="partTwoRoute"]:checked')?.value || 'picture';
  document.getElementById('pictureSetup').style.display = route === 'picture' ? 'block' : 'none';
  document.getElementById('projectSetup').style.display = route === 'project' ? 'block' : 'none';
}

async function startGermanFullMock() {
  const route = document.querySelector('input[name="partTwoRoute"]:checked')?.value || 'picture';
  const stories = [...document.querySelectorAll('input[name="preparedStory"]:checked')].map(input => Number(input.value));
  const roleplays = [...document.querySelectorAll('input[name="preparedRoleplay"]:checked')].map(input => Number(input.value));
  const projectTitle = document.getElementById('mockProjectTitle').value.trim();
  const projectNotes = document.getElementById('mockProjectNotes').value.trim();
  const error = document.getElementById('fullMockSetupError');
  error.textContent = '';
  if (route === 'picture' && stories.length !== 3) {
    error.textContent = 'Please select exactly three prepared picture sequences.'; return;
  }
  if (route === 'project' && projectTitle.length < 3) {
    error.textContent = 'Please enter the topic of your project.'; return;
  }
  if (roleplays.length !== 3) {
    error.textContent = 'Please select exactly three prepared roleplays.'; return;
  }

  const startButton = document.getElementById('startFullMockBtn');
  startButton.disabled = true; startButton.textContent = '⏳ Preparing mock…';
  const conversationPool = shuffled([1, 2, 3, 4, 7, 9, 12, 14]);
  const conversationPrompts = [DATA_CONV[0][currentLevel], ...conversationPool.slice(0, 5).map(index => DATA_CONV[index][currentLevel])];
  const selectedStory = route === 'picture' ? shuffled(stories)[0] : null;
  const selectedRoleplay = shuffled(roleplays)[0];
  let partTwoPrompts;
  if (route === 'picture') {
    partTwoPrompts = [
      `Erzählen Sie mir bitte in zehn bis fünfzehn Sätzen, was in der Bildergeschichte „${STORIE_DATA[selectedStory].title.replace(/^\d+\.\s*/, '')}“ passiert.`,
      "Wie geht die Geschichte weiter? Erklären Sie auch einen Aspekt, der in Ihrer Erzählung noch nicht ganz klar war.",
      FULL_MOCK_STORY_OPINIONS[selectedStory]
    ];
  } else {
    partTwoPrompts = await buildProjectPrompts(projectTitle, projectNotes);
  }

  germanFullMock = {
    active: true, route, projectTitle, projectNotes, selectedStory, selectedRoleplay,
    phase: 'conversation', index: 0, conversationPrompts, partTwoPrompts,
    roleplayPrompts: RP_DATA[selectedRoleplay].dialogs.map(item => Array.isArray(item) ? item[Math.floor(Math.random() * item.length)] : item),
    answers: { conversation: [], partTwo: [], roleplay: [] }
  };
  startButton.disabled = false; startButton.textContent = 'Start full mock';
  document.getElementById('fullMockSetup').style.display = 'none';
  document.getElementById('fullMockArea').style.display = 'block';
  showGermanFullMockStep();
}

async function buildProjectPrompts(title, notes) {
  const fallbacks = [
    `Sie haben ein Projekt über „${title}“ gemacht. Erzählen Sie mir bitte kurz davon.`,
    "Wo haben Sie Ihre Informationen bekommen, und was haben Sie bei der Arbeit an diesem Projekt gelernt?",
    `Warum ist das Thema „${title}“ heute wichtig? Vergleichen Sie, wenn möglich, Deutschland und Irland.`
  ];
  try {
    const raw = await callSmartAI(`
      Create the three prompts for Section II of a Leaving Certificate German oral mock based on a student's cultural project.
      Project title: ${title}. Student notes: ${notes || 'No additional notes supplied.'}
      Prompt 1 must invite an uninterrupted presentation of no more than two minutes. Prompt 2 must clarify content or ask about the project process. Prompt 3 must ask for an opinion on a related wider issue, ideally comparing a German-speaking country and Ireland where natural.
      Use concise, natural formal German (Sie) and return JSON only: {"prompts":["...","...","..."]}.
    `);
    const data = parseAIJSON(raw);
    return Array.isArray(data.prompts) && data.prompts.length === 3 ? data.prompts : fallbacks;
  } catch (e) {
    console.warn('Project follow-up generation failed; using fallback prompts.', e);
    return fallbacks;
  }
}

function currentGermanFullMockPrompt() {
  if (!germanFullMock) return '';
  if (germanFullMock.phase === 'conversation') return germanFullMock.conversationPrompts[germanFullMock.index];
  if (germanFullMock.phase === 'partTwo') return germanFullMock.partTwoPrompts[germanFullMock.index];
  return germanFullMock.roleplayPrompts[germanFullMock.index];
}

function showGermanFullMockStep() {
  const mock = germanFullMock;
  if (!mock) return;
  const section = document.getElementById('fullMockSection');
  const progress = document.getElementById('fullMockProgress');
  const context = document.getElementById('fullMockContext');
  const prompt = document.getElementById('fullMockPrompt');
  const completed = mock.answers.conversation.length + mock.answers.partTwo.length + mock.answers.roleplay.length;
  document.getElementById('fullMockProgressBar').style.width = `${Math.round((completed / 14) * 100)}%`;
  context.style.display = 'none'; context.textContent = '';

  if (mock.phase === 'conversation') {
    section.textContent = 'PART 1 · GENERAL CONVERSATION · 40 MARKS';
    progress.textContent = `Question ${mock.index + 1} of 6`;
  } else if (mock.phase === 'partTwo') {
    const partLabel = mock.route === 'picture' ? 'PICTURE SEQUENCE' : 'PROJECT';
    section.textContent = `PART 2 · ${partLabel} · 30 MARKS`;
    progress.textContent = `Prompt ${mock.index + 1} of 3`;
    context.style.display = 'block';
    context.textContent = mock.route === 'picture'
      ? `Selected at random: ${STORIE_DATA[mock.selectedStory].title}. Use your official picture card while answering.`
      : `Project: ${mock.projectTitle}`;
  } else {
    section.textContent = 'PART 3 · ROLEPLAY · 30 MARKS';
    progress.textContent = `Turn ${mock.index + 1} of 5`;
    context.style.display = 'block';
    context.textContent = `Selected at random: ${FULL_MOCK_ROLEPLAY_LABELS[mock.selectedRoleplay - 1]}. ${RP_DATA[mock.selectedRoleplay].context}`;
  }
  prompt.textContent = currentGermanFullMockPrompt();
  document.getElementById('fullMockInput').value = '';
  document.getElementById('fullMockNextBtn').textContent = completed === 13 ? 'Finish and see result' : 'Save answer and continue';
  scrollToVisibleSection('fullMockArea');
}

function speakGermanFullMockPrompt() {
  speakWithBrowserTTS(currentGermanFullMockPrompt());
}

function speakGermanFullMockResponse() {
  speakWithBrowserTTS(document.getElementById('fullMockInput').value);
}

async function submitGermanFullMockAnswer() {
  const input = document.getElementById('fullMockInput');
  const answer = input.value.trim();
  if (answer.length < 5) return alert('Bitte geben Sie eine etwas längere Antwort.');
  const mock = germanFullMock;
  const record = { prompt: currentGermanFullMockPrompt(), answer };
  if (mock.phase === 'conversation') {
    mock.answers.conversation.push(record);
    mock.index++;
    if (mock.index >= mock.conversationPrompts.length) { mock.phase = 'partTwo'; mock.index = 0; }
  } else if (mock.phase === 'partTwo') {
    mock.answers.partTwo.push(record);
    mock.index++;
    if (mock.index >= mock.partTwoPrompts.length) { mock.phase = 'roleplay'; mock.index = 0; }
  } else {
    mock.answers.roleplay.push(record);
    mock.index++;
    if (mock.index >= mock.roleplayPrompts.length) return evaluateGermanFullMock();
  }
  showGermanFullMockStep();
}

async function evaluateGermanFullMock() {
  const mock = germanFullMock;
  document.getElementById('fullMockArea').style.display = 'none';
  document.getElementById('fullMockLoading').style.display = 'block';
  scrollToVisibleSection('fullMockLoading');
  const routeName = mock.route === 'picture' ? 'Picture Sequence' : 'Project';
  const prompt = `
    Act as a fair Leaving Certificate German oral examiner in Ireland. Assess this complete mock at ${currentLevel} level.
    Official structure: General Conversation /40; ${routeName} /30; Roleplay /30. Total /100.
    Conversation: ${JSON.stringify(mock.answers.conversation)}
    ${routeName}: ${JSON.stringify(mock.answers.partTwo)}
    Roleplay context: ${RP_DATA[mock.selectedRoleplay].context}
    Roleplay turns: ${JSON.stringify(mock.answers.roleplay)}
    For the roleplay, give most weight to successful communicative completion across the five turns (up to 20), then range and accuracy visible in the transcription (up to 10). For the project/picture section, balance the uninterrupted presentation, follow-up/clarification and wider opinion, each approximately 10 marks. Assess general conversation for relevance, independence, range, accuracy and fluency visible in the text.
    Apply level-appropriate expectations. Do not expect native-speaker performance. Ignore punctuation, capitalisation and likely speech-recognition artefacts. Do not assess pronunciation, accent, prosody or listening from text, and explicitly acknowledge this limitation. Address the learner using formal Sie.
    Return valid JSON only: {"conversation_score":0,"part_two_score":0,"roleplay_score":0,"summary_de":"...","summary_en":"...","strengths":["..."],"next_steps":["..."],"corrections":[{"original":"...","correction":"...","explanation_en":"..."}]}.
    Keep each array to a maximum of four concise items. Do not invent errors.
  `;
  try {
    const raw = await callSmartAI(prompt);
    let data;
    try {
      data = parseAIJSON(raw);
    } catch (_) {
      const repaired = await callSmartAI(`
        Convert the assessment below into valid JSON only. Do not add markdown or commentary.
        Required schema: {"conversation_score":0,"part_two_score":0,"roleplay_score":0,"summary_de":"...","summary_en":"...","strengths":["..."],"next_steps":["..."],"corrections":[{"original":"...","correction":"...","explanation_en":"..."}]}.
        Keep conversation_score within 0-40 and both other scores within 0-30. Preserve the assessment's meaning and use empty arrays where details are absent.
        Assessment to structure: ${raw}
      `);
      data = parseAIJSON(repaired);
    }
    renderGermanFullMockResult(data);
  } catch (e) {
    console.error(e);
    document.getElementById('fullMockLoading').style.display = 'none';
    document.getElementById('fullMockArea').style.display = 'block';
    alert('⚠️ The final evaluation could not be completed: ' + e.message);
  }
}

function renderGermanFullMockResult(data) {
  const clamp = (value, max) => Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
  const conversation = clamp(data.conversation_score, 40);
  const partTwo = clamp(data.part_two_score, 30);
  const roleplay = clamp(data.roleplay_score, 30);
  const total = conversation + partTwo + roleplay;
  document.getElementById('mockConversationScore').textContent = `${conversation}/40`;
  document.getElementById('mockPartTwoScore').textContent = `${partTwo}/30`;
  document.getElementById('mockRoleplayScore').textContent = `${roleplay}/30`;
  document.getElementById('mockTotalScore').textContent = `${total}/100`;
  document.getElementById('mockPartTwoLabel').textContent = germanFullMock.route === 'picture' ? 'Picture Sequence' : 'Project';
  const feedback = document.getElementById('fullMockFeedback');
  feedback.replaceChildren();
  addMockFeedbackSection(feedback, 'Feedback auf Deutsch', [data.summary_de]);
  addMockFeedbackSection(feedback, 'English summary', [data.summary_en]);
  addMockFeedbackSection(feedback, 'Strengths', data.strengths);
  addMockFeedbackSection(feedback, 'Next steps', data.next_steps);
  const corrections = Array.isArray(data.corrections) ? data.corrections.map(item => `${item.original || ''} → ${item.correction || ''}${item.explanation_en ? ` — ${item.explanation_en}` : ''}`) : [];
  addMockFeedbackSection(feedback, 'Useful corrections', corrections);
  document.getElementById('fullMockLoading').style.display = 'none';
  document.getElementById('fullMockResult').style.display = 'block';
  germanFullMock.active = false;
  scrollToVisibleSection('fullMockResult');
}

function addMockFeedbackSection(parent, headingText, values) {
  const items = (Array.isArray(values) ? values : []).filter(Boolean);
  if (!items.length) return;
  const section = document.createElement('section');
  const heading = document.createElement('h3'); heading.textContent = headingText;
  const list = document.createElement('ul');
  items.forEach(value => { const item = document.createElement('li'); item.textContent = value; list.appendChild(item); });
  section.append(heading, list); parent.appendChild(section);
}

function exitGermanFullMock() {
  if (germanFullMock?.active && !window.confirm('Exit this mock? Your answers will not be saved.')) return;
  germanFullMock = null;
  document.getElementById('fullMockArea').style.display = 'none';
  document.getElementById('fullMockLoading').style.display = 'none';
  openGermanFullMockSetup();
}

function restartGermanFullMock() {
  germanFullMock = null;
  document.getElementById('fullMockResult').style.display = 'none';
  openGermanFullMockSetup();
}

// Inicialización
window.onload = initConv;
