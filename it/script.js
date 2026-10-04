function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
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
    utterance.lang = 'it-IT';
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
// PARTE 1: CONVERSATION
// ===========================================
let currentLevel = 'OL';
let currentMode = 'exam';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// Base de datos de Conversación (15 Temas) + STUDY MODE CHECKPOINTS (ADAPTADO A REGISTRO FORMAL 'LEI')
const DATA = [
  { 
    title: "1. Mi presento", 
    OL: "Come si chiama? Quanti anni ha? Quando è il Suo compleanno?", 
    HL: "Mi parli di Lei. Descriva la Sua personalità e i Suoi interessi.",
    check_HL: "Nome, Età, Compleanno (Il mio compleanno è il...), Descrizione fisica (Occhi/Capelli), Personalità (Sono simpatico/a, aperto/a...).",
    checkpoints_OL: ["Mi chiamo... (Nome)", "Ho X anni (Avere - Età)", "Il mio compleanno è il... (Data)"],
    checkpoints_HL: ["Descrizione fisica (Sono alto/basso...)", "Aggettivi (Simpatico, Timido, Pigro)", "I miei occhi sono... (Accordo)"],
    checkpoints_TOP: ["✨ Idiom: Essere alla mano (Easy-going)", "✨ Grammar: Piacere (Mi piace/Mi piacciono)", "✨ Vocab: Pregi e difetti"]
  },
  { 
    title: "2. La mia famiglia", 
    OL: "Quante persone ci sono nella Sua famiglia? Ha fratelli o sorelle?", 
    HL: "Mi parli della Sua famiglia. Va d'accordo con i Suoi genitori e fratelli?",
    check_HL: "Numero persone (Siamo in...), Lavoro genitori (Mio padre fa...), Fratelli/Sorelle, Rapporti (Vado d'accordo con..., Litighiamo spesso).",
    checkpoints_OL: ["Siamo in quattro (Numeri)", "Ho un fratello / una sorella", "Mio padre fa il medico (Lavori)"],
    checkpoints_HL: ["Andare d'accordo (Get along)", "Litigare (Argue)", "Descrizione caratteriale dei genitori"],
    checkpoints_TOP: ["✨ Idiom: Essere la pecora nera", "✨ Grammar: I possessivi (Mio padre vs Il mio gatto)", "✨ Vocab: Famiglia allargata"]
  },
  { 
    title: "3. La mia casa", 
    OL: "Vive in una casa o in un appartamento? Descriva la Sua camera.", 
    HL: "Descriva la Sua casa ideale. Cosa Le piace di più della Sua casa attuale?",
    check_HL: "Tipo (Villetta/Appartamento), Stanze (C'è/Ci sono...), La mia camera (Ho un letto...), Opinione (Mi piace perché...), Casa ideale (Vorrei una piscina...).",
    checkpoints_OL: ["Vivo in una casa / un appartamento", "La mia camera è...", "C'è un letto e una scrivania"],
    checkpoints_HL: ["Preposizioni (In cucina, In salotto)", "Le faccende domestiche (Chores)", "La casa dei miei sogni (Condizionale)"],
    checkpoints_TOP: ["✨ Idiom: Sentirsi a casa", "✨ Grammar: C'è vs Ci sono", "✨ Vocab: Arredamento moderno"]
  },
  { 
    title: "4. Il mio quartiere", 
    OL: "Cosa c'è nel Suo quartiere? C'è un parco o un cinema?", 
    HL: "Mi parli della Sua zona. Quali sono i vantaggi e gli svantaggi di vivere lì?",
    check_HL: "Strutture (C'è un parco...), Vantaggi (È tranquillo), Svantaggi (Non c'è niente da fare), Mezzi di trasporto.",
    checkpoints_OL: ["C'è un parco / una chiesa", "Abito vicino a... (Near)", "È tranquillo / rumoroso"],
    checkpoints_HL: ["Vantaggi e svantaggi", "Problemi sociali (Traffico, Rifiuti)", "Mezzi di trasporto"],
    checkpoints_TOP: ["✨ Idiom: A due passi da qui", "✨ Grammar: Si può + Infinito (Si può andare...)", "✨ Vocab: Zona residenziale"]
  },
  { 
    title: "5. La scuola", 
    OL: "Le piace la scuola? Qual è la Sua materia preferita?", 
    HL: "Mi parli della Sua scuola. Cosa ne pensa del sistema scolastico irlandese?",
    check_HL: "Tipo (Mista/Maschile/Femminile), Materie (Studio...), Materia preferita vs Odiata, Opinione sistema (Punti Leaving Cert, Stress).",
    checkpoints_OL: ["La mia scuola è mista", "Studio l'italiano e la matematica", "La mia materia preferita è..."],
    checkpoints_HL: ["Opinione sulla divisa (Uniforme)", "Regole scolastiche (È vietato...)", "Sistema dei punti (CAO)"],
    checkpoints_TOP: ["✨ Idiom: Essere un secchione (Nerd)", "✨ Grammar: Penso che sia... (Congiuntivo)", "✨ Vocab: Esame di maturità"]
  },
  { 
    title: "6. Passatempi", 
    OL: "Cosa fa nel tempo libero? Le piace lo sport?", 
    HL: "Mi parli dei Suoi hobby. Perché è importante avere interessi fuori dalla scuola?",
    check_HL: "Sport (Gioco a calcio...), Musica/Lettura, Frequenza (Due volte alla settimana), Importanza (Per rilassarmi, Salute mentale).",
    checkpoints_OL: ["Gioco a calcio / rugby", "Ascolto la musica", "Guardo Netflix"],
    checkpoints_HL: ["Sport di squadra vs individuale", "Benefici mentali (Rilassarsi)", "Frequenza (Spesso, Mai, A volte)"],
    checkpoints_TOP: ["✨ Idiom: Staccare la spina (Switch off)", "✨ Grammar: Mi piace vs Mi piacciono", "✨ Vocab: Tempo libero"]
  },
  { 
    title: "7. Il lavoro", 
    OL: "Ha un lavoro part-time? Cosa fa?", 
    HL: "Mi parli della Sua esperienza lavorativa. Pensa che gli studenti dovrebbero lavorare?",
    check_HL: "Lavoro attuale (Faccio il cameriere...), Mansioni (Devo pulire...), Opinione (Indipendenza economica vs Tempo per studiare).",
    checkpoints_OL: ["Faccio il cameriere / la babysitter", "Lavoro il sabato", "Guadagno X euro all'ora"],
    checkpoints_HL: ["Indipendenza economica", "Conciliare studio e lavoro", "Risparmiare soldi"],
    checkpoints_TOP: ["✨ Idiom: Essere al verde (Broke)", "✨ Grammar: Vorrei lavorare come...", "✨ Vocab: Esperienza lavorativa"]
  },
  { 
    title: "8. Le vacanze", 
    OL: "Dove è andato in vacanza l'anno scorso? Le piace l'Italia?", 
    HL: "Mi parli delle Sue vacanze. Preferisce il mare o la montagna? Perché?",
    check_HL: "Passato Prossimo (Sono andato/a in...), Imperfetto (Faceva caldo, Era bello), Alloggio, Preferenze (Preferisco il mare).",
    checkpoints_OL: ["Sono andato in Italia (Passato)", "Ho viaggiato in aereo", "Era bellissimo!"],
    checkpoints_HL: ["Passato Prossimo (Azioni)", "Imperfetto (Descrizione/Meteo)", "Vacanze attive vs Relax"],
    checkpoints_TOP: ["✨ Idiom: Costare un occhio della testa", "✨ Grammar: Essere vs Avere (Passato)", "✨ Vocab: Turismo sostenibile"]
  },
  { 
    title: "9. Il futuro", 
    OL: "Cosa farà l'anno prossimo? Vuole andare all'università?", 
    HL: "Quali sono i Suoi progetti per il futuro? Che lavoro Le piacerebbe fare?",
    check_HL: "Futuro Semplice (Andrò, Studierò...), Condizionale (Vorrei diventare...), Università/Corso di laurea, Anno sabbatico.",
    checkpoints_OL: ["Andrò all'università (Futuro)", "Studierò economia", "Vorrei essere ricco"],
    checkpoints_HL: ["Anno sabbatico (Gap year)", "Vivere all'estero", "Sogni e ambizioni"],
    checkpoints_TOP: ["✨ Idiom: Il mio sogno nel cassetto", "✨ Grammar: Quando finirò la scuola...", "✨ Vocab: Carriera lavorativa"]
  },
  { 
    title: "10. Fine settimana scorso", 
    OL: "Cosa ha fatto il fine settimana scorso?", 
    HL: "Mi racconti come ha trascorso lo scorso weekend. Ha fatto qualcosa di speciale?",
    check_HL: "Passato Prossimo AVERE (Ho guardato, Ho mangiato), Passato Prossimo ESSERE (Sono uscito/a, Sono andato/a), Amici/Famiglia.",
    checkpoints_OL: ["Ho guardato la TV", "Sono uscito con gli amici", "Ho dormito molto"],
    checkpoints_HL: ["Attività sociali (Cinema, Festa)", "Studio e compiti", "Pranzo della domenica"],
    checkpoints_TOP: ["✨ Idiom: Divertirsi un mondo", "✨ Grammar: Ho dovuto studiare...", "✨ Vocab: Rilassarsi"]
  },
  { 
    title: "11. Prossimo weekend", 
    OL: "Cosa farà il prossimo fine settimana?", 
    HL: "Quali sono i Suoi programmi per il prossimo weekend?",
    check_HL: "Futuro Semplice (Andrò al cinema, Farò i compiti...), Piani specifici (Uscirò con gli amici).",
    checkpoints_OL: ["Andrò al cinema", "Farò i compiti", "Giocherò a calcio"],
    checkpoints_HL: ["Piani con la famiglia", "Eventi sportivi", "Preparazione esami"],
    checkpoints_TOP: ["✨ Idiom: Non vedo l'ora (Can't wait)", "✨ Grammar: Se farà bel tempo...", "✨ Vocab: Programmi"]
  },
  { 
    title: "12. Cibo italiano", 
    OL: "Le piace il cibo italiano? Qual è il Suo piatto preferito?", 
    HL: "Cosa ne pensa della cucina italiana? Sa cucinare qualche piatto?",
    check_HL: "Piatto preferito (Adoro la pizza...), Cucinare (So cucinare la pasta...), Confronto Cibo Irlandese vs Italiano.",
    checkpoints_OL: ["Amo la pizza e la pasta", "Il mio piatto preferito è...", "Non mi piace il pesce"],
    checkpoints_HL: ["Cucina salutare (Dieta mediterranea)", "Differenze Italia/Irlanda", "So cucinare..."],
    checkpoints_TOP: ["✨ Idiom: L'acquolina in bocca", "✨ Grammar: Ne mangio molta (Partitivo)", "✨ Vocab: Ingredienti freschi"]
  },
  { 
    title: "13. La routine", 
    OL: "A che ora si sveglia la mattina? Cosa fa dopo scuola?", 
    HL: "Descriva la Sua giornata tipica. È stressante la vita di uno studente?",
    check_HL: "Verbi Riflessivi (Mi sveglio, Mi alzo, Mi vesto...), Orari (Alle otto...), Pasti, Studio vs Tempo libero.",
    checkpoints_OL: ["Mi sveglio alle 7 (Riflessivo)", "Faccio colazione", "Vado a scuola in autobus"],
    checkpoints_HL: ["Gestione del tempo", "Lo stress degli esami", "Differenza settimana/weekend"],
    checkpoints_TOP: ["✨ Idiom: Fare le ore piccole", "✨ Grammar: Prima di + Infinito", "✨ Vocab: Quotidianità"]
  },
  { 
    title: "14. La moda", 
    OL: "Le piace fare shopping? Cosa indossa di solito?", 
    HL: "Segue la moda? Pensa che i vestiti firmati siano importanti per i giovani?",
    check_HL: "Abbigliamento abituale (Di solito indosso...), Opinione marche (Sono troppo costose), Pressione sociale.",
    checkpoints_OL: ["Mi piace fare shopping", "Indosso jeans e felpa", "Il mio colore preferito è..."],
    checkpoints_HL: ["Vestiti firmati vs economici", "L'importanza dell'apparenza", "Uniforme scolastica"],
    checkpoints_TOP: ["✨ Idiom: Essere alla moda", "✨ Grammar: Mi sta bene (It suits me)", "✨ Vocab: Il centro commerciale"]
  },
  { 
    title: "15. Tecnologia", 
    OL: "Ha un telefono nuovo? Usa molto i social media?", 
    HL: "Qual è il ruolo della tecnologia nella Sua vita? Pensa che siamo dipendenti dai telefoni?",
    check_HL: "Uso quotidiano (Uso Instagram per...), Vantaggi (Comunicazione), Svantaggi (Cyberbullismo, Dipendenza).",
    checkpoints_OL: ["Uso il telefono ogni giorno", "Guardo video su TikTok", "Chatto con gli amici"],
    checkpoints_HL: ["Dipendenza dalla tecnologia", "Cyberbullismo", "Vantaggi per lo studio"],
    checkpoints_TOP: ["✨ Idiom: Essere sempre connessi", "✨ Grammar: Passare tempo a...", "✨ Vocab: I social network"]
  }
];

const PAST_Q = ["Cosa ha fatto ieri?", "Dove è andato l'estate scorsa?", "Come ha festeggiato il Suo compleanno?"];
const FUT_Q = ["Cosa farà domani?", "Dove andrà in vacanza quest'anno?", "Cosa farà dopo gli esami?"];

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
    DATA.forEach((item) => { 
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
        .replace(/\s*\((?:PASSATO|FUTURO|OL|HL)\)\s*/gi, ' ')
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
    
    let i = [...Array(DATA.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA[i[0]][currentLevel],
        DATA[i[1]][currentLevel],
        DATA[i[2]][currentLevel],
        PAST_Q[Math.floor(Math.random()*3)] + " (PASSATO)",
        FUT_Q[Math.floor(Math.random()*3)] + " (FUTURO)"
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Question ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
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
            hintBox.innerHTML = "<strong>📝 Punti Chiave / Key Points (HL):</strong><br>" + currentTopic.check_HL;
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
        document.getElementById('qDisplay').innerHTML = "Select a topic or start a new Mock Exam.";
        const btnHint = document.getElementById('btnHint');
        if(btnHint) btnHint.style.display = 'none';
    } else {
        document.getElementById('userInput').value = "";
    }
}

// ===========================================
// FUNCIÓN ANALYZE (MODO EXAMEN)
// ===========================================
function analyze() {
  const t = document.getElementById('userInput').value.trim();
  if (t.length < 5) return alert("Please say something more...");
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
    Act as a fair Leaving Certificate Italian oral examiner in Ireland.
    Assess communicative success, relevance to the question, development, range, accuracy and comprehensibility at the stated level.
    Level: ${currentLevel}. Question: ${questionContext}
    Learner response (raw speech transcription): ${t}
    Study guidance (optional support, never a compulsory checklist): ${criteria}
    Apply level-appropriate expectations. Ordinary/OL answers should be judged for clear basic communication; HL/Advanced answers can show more development and range, but do not expect native-speaker performance. Do not require every suggested content point.
    Ignore punctuation, capitalization and accent-mark differences that may be transcription artifacts. Do not assess pronunciation, accent or prosody from text. Penalize only clear, meaningful language errors; distinguish errors from likely speech-recognition artifacts.
    Address the learner consistently using Italian formal Lei; never switch to informal address.
    Calibrate scores: 90-100 exceptional; 82-89 excellent; 75-81 very good; 65-74 competent; 50-64 adequate; below 50 needs substantial development. Reserve high scores for relevant, developed answers with generally effective language. Return feedback in Italian and concise English.
    Return valid JSON only: {"score":0,"feedback_it":"...","feedback_en":"...","strengths":["..."],"next_steps":["..."],"connectors":["..."],"vocabulary_suggestions":[{"basic":"...","richer":"..."}],"errors":[{"original":"...","correction":"...","explanation_en":"..."}]}.
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
    scoreDisplay.innerText = `Score: ${score}%`;
    scoreDisplay.style.color = score >= (advanced ? 75 : 85) ? '#166534' : (score >= 50 ? '#ca8a04' : '#991b1b');
    document.getElementById('fbES').innerText = '🌍 ' + (j.feedback_it || '');
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
    btnReset.innerText = isMockExam ? '➡️ Next Question' : '🔄 Another topic';
    btnReset.onclick = isMockExam ? nextMockQuestion : resetApp;
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
    // No es necesario crear el contenedor si ya existe en HTML
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

function askAIConcept(concept, kind = 'language') {
  const box = document.getElementById('aiExplanationBox');
  if (!box) return;
  box.style.display = 'block'; box.textContent = '⏳ Preparing a guided study plan...';
  const prompt = `
    You are a supportive Italian oral-exam tutor. Topic: ${currentTopic?.title || 'General'}.
    Learner level: ${currentLevel}. Practice item: ${concept}. Type: ${kind}.
    Explain the idea briefly in English, then provide a 3-step speaking plan (keywords, not a memorised script) and up to two natural Italian examples with English translations.
    Keep Italian formal Lei register throughout all target-language examples and never use informal address. Treat topic guidance as optional; do not imply that every bullet is required.
    Return valid JSON only: {"explanation_en":"...","speaking_plan":["..."],"examples":[{"target":"...","en":"..."}],"optional_challenge":"..."}.
  `;
  try {
    const raw = await callSmartAI(prompt);
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
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
// PARTE 2: ROLEPLAYS (ADAPTADO A REGISTRO FORMAL 'LEI')
// ===========================================
let rpActual = null; let pasoActual = 0; let speaking = false;
const RP_DB = {
    1: { context: "Un problema in albergo. You booked a room but the receptionist has no record.", dialogs: ["Buongiorno, benvenuto all'Hotel Milano. Come posso aiutarla?", "Mi dispiace, signore. Ho controllato il computer ma non risulta nessuna prenotazione a questo nome.", "Capisco che è arrabbiato, ma purtroppo siamo al completo questa settimana.", "Sì, conosco un albergo qui vicino. Si chiama Hotel Stella. Vuole che chiami per vedere se hanno posto?", ["Ho chiamato l'Hotel Stella e fortunatamente hanno una camera libera.", "È tutto risolto. L'Hotel Stella La aspetta."]], sugerencias: ["Buongiorno. Mi chiamo [Nome] e ho prenotato una camera singola per tre notti. Ecco la mia conferma.", "Non è possibile! Ho fatto la prenotazione su internet un mese fa. Sono molto sorpreso e preoccupato.", "Guardi, è un disastro per me. Ho assolutamente bisogno di un alloggio in questa zona perché ho una conferenza importante qui vicino.", "Sì, per favore. Sarebbe molto gentile da parte Sua. Non conosco bene la città e non saprei dove andare.", "Grazie mille per il Suo aiuto. Apprezzo molto la Sua disponibilità. Arrivederci."] },
    2: { context: "Una multa sul treno. You didn't validate your ticket.", dialogs: ["Buongiorno. Biglietto, prego.", "Signore, vedo che ha il biglietto ma non è stato convalidato. Devo farLe la multa.", "Mi dispiace, ma la regola è chiara. La multa è di cinquanta euro. Deve pagare ora.", "Se non ha contanti, posso darLe un bollettino postale. Ha domande su come funziona?", ["Sì, deve convalidare il biglietto ogni volta che cambia treno, anche a Bologna.", "Ricordi sempre di timbrare alle macchinette gialle prima di salire."]], sugerencias: ["Buongiorno. Ecco il mio biglietto, sto andando a Venezia.", "Mi scusi tanto! Sono arrivato in ritardo alla stazione e sono salito di corsa sul treno. Non l'ho fatto apposta, per favore non mi faccia la multa.", "Cinquanta euro?! Purtroppo non ho abbastanza contanti con me in questo momento. Sono uno studente.", "Va bene, accetto il bollettino. Posso chiedere se devo convalidare di nuovo il biglietto quando cambio treno a Bologna?", "Ho capito, starò più attento la prossima volta. Grazie per l'informazione. Arrivederci."] },
    3: { context: "In farmacia. You feel sick and need advice.", dialogs: ["Buongiorno. Mi dica, cosa c'è che non va?", "Da quanto tempo si sente così? Ha mangiato qualcosa di strano recentemente?", "Capisco. Le consiglio di prendere queste compresse due volte al giorno dopo i pasti.", "Che lavoro farà quest'estate qui in Italia?", ["Non si preoccupi. Con questa medicina starà meglio in un paio di giorni.", "Beva molta acqua e si riposi. Arrivederci."]], sugerencias: ["Buongiorno. Non mi sento molto bene. Ho mal di stomaco e un po' di febbre.", "Sto male da ieri sera. Penso di aver mangiato del pesce che non era fresco in un ristorante del centro.", "Grazie dottore. Per quanti giorni devo prenderle? E ci sono cibi che dovrei evitare?", "Lavorerò come cameriere in un ristorante, per questo è molto importante che io guarisca presto.", "Grazie mille per il consiglio. Spero di rimettermi presto. Arrivederci."] },
    4: { context: "Dov'è il passaporto? You left it at your host family's house.", dialogs: ["Pronto, casa Rossi. Chi parla?", "Oh no! È sicuro? Dove l'ha visto l'ultima volta?", "Aspetti un attimo, vado a controllare... Sì! L'ho trovato! Era proprio lì.", "Ascolti, non si preoccupi. Prendo un taxi e glielo porto subito all'aeroporto.", ["Non si preoccupi per il taxi, mi fa piacere aiutarLa.", "Sto uscendo ora. Ci vediamo agli arrivi tra mezz'ora!"]], sugerencias: ["Pronto, Signora Rossi? Sono [Nome]. Sono disperato! Sono in fila al check-in all'aeroporto e mi sono accorto di non avere il passaporto.", "L'ultima volta l'ho visto stamattina sul comodino accanto al letto, o forse sulla scrivania. Potrebbe controllare per favore?", "Che sollievo! La ringrazio moltissimo! Devo assolutamente tornare in Irlanda oggi per un esame domani.", "È un angelo! Grazie infinite. Ovviamente Le pagherò io il taxi quando arriva.", "Grazie ancora Signora Rossi, non so cosa avrei fatto senza di Lei. A tra poco!"] },
    5: { context: "Un colloquio di lavoro. Summer job in a tourist village.", dialogs: ["Buongiorno. Prego, si accomodi. Come si chiama e quanti anni ha?", "Molto bene. Mi parli delle Sue esperienze lavorative precedenti.", "Parla molto bene l'italiano! Dove l'ha studiato e per quanto tempo?", "Perché pensa di essere il candidato ideale per questo lavoro nel nostro villaggio?", ["Ha qualche domanda da farmi sugli orari o sullo stipendio?", "Le faremo sapere la nostra decisione domani. Arrivederci."]], sugerencias: ["Buongiorno. Mi chiamo [Nome], ho 18 anni e vengo dall'Irlanda.", "L'estate scorsa ho lavorato in un campo estivo in Irlanda. Organizzavo attività sportive per i bambini e aiutavo in cucina.", "Studio italiano a scuola da cinque anni e guardo molti film italiani per migliorare la pronuncia.", "Sono una persona molto socievole, affidabile e gran lavoratore. Mi piace stare a contatto con la gente e imparo in fretta.", "Sì, vorrei sapere quali sono i turni di lavoro e se l'alloggio è compreso. Grazie."] }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; speaking = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DB[id].context;
    
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Examiner" to begin.</div>`;
    
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block"; nextBtn.innerText = "▶️ Start Examiner"; nextBtn.className = "audio-btn"; nextBtn.style.background = "var(--primary)"; nextBtn.style.color = "white";
    nextBtn.onclick = reproducirInterventoExaminer; 
    
    document.getElementById('rpInput').disabled = true; document.getElementById('rpSendBtn').disabled = true; document.getElementById('hintBtn').style.display = "none";
}

function reproducirInterventoExaminer() {
    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    if (Array.isArray(dialogText)) dialogText = dialogText[Math.floor(Math.random() * dialogText.length)];

    const chat = document.getElementById('rpChat');
    const lastMsg = chat.lastElementChild;
    const isReplay = lastMsg && lastMsg.classList.contains('ex') && lastMsg.innerText.includes(dialogText);

    if (!isReplay) {
        if (pasoActual >= 5) {
            chat.innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed!</div>`;
            document.getElementById('nextAudioBtn').style.display = "none"; return;
        }
        chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`; chat.scrollTop = chat.scrollHeight;
    }

    reproducirAudio(dialogText);

    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block"; nextBtn.innerText = "🔄 Riascolta / Replay"; nextBtn.style.background = "#fbbf24"; nextBtn.style.color = "black";
    nextBtn.onclick = () => reproducirAudio(dialogText);
}

function reproducirAudio(texto) {
    const u = new SpeechSynthesisUtterance(texto); u.lang = 'it-IT'; u.rate = 0.9;
    u.onend = habilitarInput; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
}

function habilitarInput() {
    speaking = false;
    if(pasoActual < 5) { 
        document.getElementById('rpInput').disabled = false; document.getElementById('rpSendBtn').disabled = false;
        if(!(/iPad|iPhone|iPod/.test(navigator.userAgent))) document.getElementById('rpInput').focus();
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
            nextBtn.style.display = "block"; nextBtn.innerText = "🔊 Ascolta / Listen Next"; nextBtn.style.background = "var(--primary)"; nextBtn.style.color = "white";
            nextBtn.onclick = reproducirInterventoExaminer; 
        } else { document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`; }
    }, 500);
}

function mostrarSugerencia() {
    const sug = RP_DB[rpActual].sugerencias[pasoActual];
    if(sug) { const chat = document.getElementById('rpChat'); chat.innerHTML += `<div class="feedback-rp">💡 <b>Model Answer:</b> ${sug}</div>`; chat.scrollTop = chat.scrollHeight; }
}

// ===========================================
// LÓGICA DE STORIE ILLUSTRATE (INTATTA)
// ===========================================
let currentStoryTitle = "";
const STORIE_TITLES = [ "Storia 1: La Spesa al Supermercato", "Storia 2: L'Incidente Stradale", "Storia 3: Il Portafoglio Smarrito/Ritrovato", "Storia 4: La Festa in Casa", "Storia 5: La Gita Scolastica" ];

function selectStory(index, btn) {
    document.querySelectorAll('#sectionStory .rp-btn-select').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    currentStoryTitle = STORIE_TITLES[index];
    document.getElementById('storyArea').style.display = 'block'; document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyTitle').innerText = currentStoryTitle; document.getElementById('userInputStory').value = "";
}

function speakStoryPrompt() {
    const text = "Guardiamo questa storia. Descriva ciò che vede nelle immagini.";
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'it-IT'; u.rate = 0.9; window.speechSynthesis.speak(u); }
}

function readMyStoryInput() {
    const text = document.getElementById("userInputStory").value; if (!text) return;
    window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'it-IT'; u.rate = 0.9; window.speechSynthesis.speak(u);
}

async function analyzeStory() {
  const t = document.getElementById('userInputStory').value; if(t.length < 5) return alert("Scrivi o dì qualcosa di più...");
  const b = document.getElementById('btnActionStory'); b.disabled = true; b.innerText = "⏳ Valutando...";

  const prompt = `ACT AS: Italian Leaving Cert Examiner. TASK: Picture Sequence "${currentStoryTitle}". STUDENT: "${t}". OUTPUT JSON: { "score": 0-100, "feedback_it": "...", "feedback_en": "...", "errors": [{ "original": "...", "correction": "...", "explanation_en": "..." }] }`;

  try {
    const rawText = await callSmartAI(prompt);
    const j = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    
    document.getElementById('storyArea').style.display = 'none'; document.getElementById('resultStory').style.display = 'block';
    document.getElementById('userResponseTextStory').innerText = t;
    document.getElementById('scoreDisplayStory').innerText = `Punteggio: ${j.score}%`;
    document.getElementById('scoreDisplayStory').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbITStory').innerText = "🇮🇹 " + j.feedback_it; 
    document.getElementById('fbENStory').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListStory').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Eccellente!";
  } catch (e) { console.error(e); alert("⚠️ Errore: " + e.message); } finally { b.disabled = false; b.innerText = "✨ Evaluate Description"; }
}

function readMyInput() {
    const text = document.getElementById('userInput').value;
    speakWithBrowserTTS(text);
}

// Inicialización
window.onload = initConv;
