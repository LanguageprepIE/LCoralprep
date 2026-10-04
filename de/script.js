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
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Bitte sagen Sie etwas mehr...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Korrigiere...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  let criteria = "Correct grammar (Wortstellung!) and vocabulary."; 
  if (currentLevel === 'HL' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Strict Leaving Cert German Oral Examiner (Ireland).
    CONTEXT: RAW VOICE TRANSCRIPTION (No punctuation).
    QUESTION: "${questionContext}"
    LEVEL: ${currentLevel}.
    STUDENT ANSWER: "${t}"
    CHECKPOINTS: [ ${criteria} ].
    INSTRUCTIONS: Ignore punctuation errors. Check Verb Position (Wortstellung). Maintain 'Sie' form perspective if addressing the student.
    OUTPUT JSON: { "score": 0-100, "feedback_de": "...", "feedback_en": "...", "errors": [{ "original": "...", "correction": "...", "explanation_en": "..." }] }
  `;

  try {
    const rawText = await callSmartAI(prompt);
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    const j = JSON.parse(cleanJson);
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    
    const s = document.getElementById('scoreDisplay');
    s.innerText = `Ergebnis: ${j.score}%`;
    s.style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbDE').innerText = "🇩🇪 " + j.feedback_de; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "<div style='color:#166534; font-weight:bold;'>✅ Sehr gut!</div>";

    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) {
        btnReset.innerText = "➡️ Nächste Frage"; btnReset.onclick = nextMockQuestion; 
    } else {
        btnReset.innerText = "🔄 Anderes Thema"; btnReset.onclick = resetApp; 
    }
  } catch (e) { 
      console.error(e); 
      alert("⚠️ Fehler: " + e.message); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Prüfen"; 
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

    if (!currentTopic) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#64748b; font-weight:bold;'>👈 Bitte wählen Sie ein Thema aus.</p>";
        return;
    }
    
    container.innerHTML = `
        <h3>📚 Study Mode: ${currentTopic.title}</h3>
        <p class="small-text">Click on a concept to get an instant explanation.</p>
        <div id="checkpointsList"></div> 
        <div id="aiExplanationBox" class="ai-box" style="display:none;"></div>
    `;

    const list = document.getElementById('checkpointsList');
    
    const createSection = (title, items, cssClass) => {
        if(!items || items.length === 0) return;
        const h = document.createElement('h4');
        h.innerText = title; h.style.margin = "15px 0 5px 0"; h.style.color = "#374151"; h.style.borderBottom = "1px solid #e5e7eb"; h.style.paddingBottom = "5px";
        list.appendChild(h);
        const grid = document.createElement('div'); grid.className = 'checklist-grid';
        items.forEach(point => {
            const btn = document.createElement('button'); btn.className = `check-btn ${cssClass}`; 
            btn.innerHTML = cssClass === 'btn-top' ? point : `❓ ${point}`;
            btn.onclick = () => askAIConcept(point);
            grid.appendChild(btn);
        });
        list.appendChild(grid);
    };

    if (currentTopic.checkpoints_OL) createSection("🧱 Grundlagen (Foundations)", currentTopic.checkpoints_OL, "btn-ol");
    if (currentLevel === 'HL' && currentTopic.checkpoints_HL) {
        createSection("🔧 Erweitert (Higher Level)", currentTopic.checkpoints_HL, "btn-hl");
        if(currentTopic.checkpoints_TOP) {
            createSection("🚀 Top Sätze (Idioms & Grammar)", currentTopic.checkpoints_TOP, "btn-top");
        }
    }
}

async function askAIConcept(concept) {
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; 
    box.innerHTML = "⏳ <b>Frage Lehrer AI...</b>";

    const prompt = `
        ACT AS: German Teacher.
        TOPIC: "${currentTopic ? currentTopic.title : 'General'}".
        CONCEPT: "${concept}".
        INSTRUCTIONS: Explain in English (max 50 words). Provide 2 German examples with English translation.
        OUTPUT HTML: <p><b>Explanation:</b> ...</p><ul><li>...</li></ul>
    `;

    try {
        const text = await callSmartAI(prompt);
        const cleanText = text.replace(/```html|```/g, "").trim();
        
        box.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>💡 Concept: ${concept}</strong>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="background:none;border:none;cursor:pointer;">✖️</button>
            </div>
            <hr>
            ${cleanText}
        `;
    } catch (e) {
        console.error(e);
        box.innerHTML = `<div style="color:#dc2626; font-weight:bold; padding:10px; background:#fee2e2; border-radius:5px;">⚠️ Error: ${e.message}</div>`;
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

// Inicialización
window.onload = initConv;
