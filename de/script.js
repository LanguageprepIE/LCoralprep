// ===========================================
// CONFIGURACIÓN
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// ===========================================
// DATOS CONVERSACIÓN (15 TEMAS - COMPLETO)
// ===========================================
const DATA_CONV = [
  { 
    title: "1. Sich vorstellen", 
    General: "Wie heißt du und wie alt bist du? Wann hast du Geburtstag?", 
    Advanced: "Erzähl mir ein bisschen über dich selbst. Wie würdest du deinen Charakter beschreiben?",
    check_HL: "Name, Alter, Geburtstag (Datum), Aussehen (Ich habe... Augen/Haare), Charakter (Ich bin... + 3 Adjektive)."
  },
  { 
    title: "2. Familie", 
    General: "Hast du Geschwister? Wie heißen sie?", 
    Advanced: "Verstehst du dich gut mit deinen Eltern? Gibt es oft Streit zu Hause?",
    check_HL: "Personenzahl (Wir sind... Personen), Berufe der Eltern, Geschwister (Beschreibung), Verhältnis (Ich verstehe mich gut/schlecht mit...), Streitgründe."
  },
  { 
    title: "3. Wohnort", 
    General: "Wo wohnst du? Wohnst du gern dort?", 
    Advanced: "Beschreibe deine Gegend. Was sind die Vor- und Nachteile vom Leben auf dem Land/in der Stadt?",
    check_HL: "Wohnort (Ich wohne in...), Beschreibung (Es gibt...), Vorteile/Nachteile (Es ist ruhig/langweilig), Stadt vs Land Vergleich."
  },
  { 
    title: "4. Schule", 
    General: "Wie viele Fächer lernst du? Was ist dein Lieblingsfach?", 
    Advanced: "Was hältst du vom irischen Schulsystem? Ist der Druck für das Leaving Cert zu hoch?",
    check_HL: "Schulart, Fächer (Ich lerne...), Lieblingsfach (Mein Lieblingsfach ist... weil...), Meinung zum System (Punkte, Druck, Uniform)."
  },
  { 
    title: "5. Freizeit & Hobbys", 
    General: "Was machst du in deiner Freizeit? Spielst du ein Instrument?", 
    Advanced: "Warum ist Sport wichtig für Jugendliche? Erzähl mir von deinen Interessen.",
    check_HL: "Sportart (Ich spiele...), Musik/Lesen, Häufigkeit (Oft, Jeden Tag), Wichtigkeit (Gesundheit, Stressabbau), Wortstellung (In meiner Freizeit spiele ich...)."
  },
  { 
    title: "6. Alltag", 
    General: "Wann stehst du auf? Was isst du zum Frühstück?", 
    Advanced: "Wie sieht ein typischer Samstag bei dir aus? Hilfst du im Haushalt?",
    check_HL: "Trennbare Verben (Ich stehe... auf, Ich sehe... fern), Uhrzeiten (Um acht Uhr), Mahlzeiten, Hausarbeit (Ich muss...)."
  },
  { 
    title: "7. Ferien & Reisen", 
    General: "Was hast du letzten Sommer gemacht? Warst du im Ausland?", 
    Advanced: "Fährst du lieber mit der Familie oder mit Freunden in den Urlaub? Warum?",
    check_HL: "Perfekt Form (Ich bin... gefahren, Ich habe... gesehen), Reiseziel, Wetter (Es war...), Präferenz (Lieber mit Freunden, weil...)."
  },
  { 
    title: "8. Zukunftspläne", 
    General: "Was möchtest du nach der Schule machen? Willst du studieren?", 
    Advanced: "Welchen Beruf möchtest du später ausüben? Ist es schwer, heutzutage einen Job zu finden?",
    check_HL: "Futur I (Ich werde...), Modalverben (Ich möchte/will...), Studium/Ausbildung, Gap Year, Berufswunsch."
  },
  { 
    title: "9. Arbeit (Nebenjob)", 
    General: "Hast du einen Nebenjob? Wo arbeitest du?", 
    Advanced: "Sollten Schüler neben der Schule arbeiten? Was sind die Vor- und Nachteile?",
    check_HL: "Jobbeschreibung (Ich arbeite als...), Stundenlohn/Zeiten, Meinung (Geld vs Zeit für Schule), Vor-/Nachteile."
  },
  { 
    title: "10. Deutsch & Sprachen", 
    General: "Warum lernst du Deutsch? Warst du schon mal in Deutschland?", 
    Advanced: "Warum ist es wichtig, Fremdsprachen zu lernen? Was gefällt dir an der deutschen Kultur?",
    check_HL: "Gründe (Jobchancen, Reisen), Erfahrung in Deutschland, Meinung (Deutsch ist schwer/logisch), Nebensätze mit 'dass' oder 'weil'."
  },
  { 
    title: "11. Soziale Probleme", 
    General: "Ist das Leben für Jugendliche heute schwer?", 
    Advanced: "Alkohol, Drogen und Obdachlosigkeit. Was sind die größten Probleme in Irland heute?",
    check_HL: "Spezifisches Problem (Obdachlosigkeit, Alkohol), Ursachen, Lösungen (Die Regierung sollte...), Eigene Meinung (Ich finde es traurig, dass...)."
  },
  { 
    title: "12. Technologie", 
    General: "Hast du ein Handy? Wie oft benutzt du das Internet?", 
    Advanced: "Welche Rolle spielen soziale Medien in deinem Leben? Fluch oder Segen?",
    check_HL: "Nutzung (Ich benutze...), Soziale Medien (Instagram/TikTok), Gefahren (Cybermobbing), Vorteile (Kontakt bleiben)."
  },
  // --- TEMAS AÑADIDOS PARA COMPLETAR 15 ---
  { 
    title: "13. Letztes Wochenende", 
    General: "Was hast du letztes Wochenende gemacht? Bist du ausgegangen?", 
    Advanced: "Erzähl mir genau, was du letztes Wochenende gemacht hast. War es ein typisches Wochenende?",
    check_HL: "Perfekt (Ich habe gelernt, Ich bin ins Kino gegangen), Präteritum (Es war lustig), Zeitangaben (Am Samstagmorgen...)."
  },
  { 
    title: "14. Nächstes Wochenende", 
    General: "Was wirst du nächstes Wochenende machen?", 
    Advanced: "Was sind deine Pläne für das nächste Wochenende? Wirst du lernen oder dich entspannen?",
    check_HL: "Futur I (Ich werde... gehen), Pläne (Ich habe vor, zu...), Modalverben (Ich möchte/muss...), Aktivitäten."
  },
  { 
    title: "15. Feste & Feiern", 
    General: "Wie feierst du deinen Geburtstag? Was machst du an Weihnachten?", 
    Advanced: "Welches ist dein Lieblingsfest? Wie feiern die Iren im Vergleich zu den Deutschen?",
    check_HL: "Feiertage (Weihnachten/Geburtstag), Traditionen (Geschenke, Essen), Vergleich (In Irland...), Meinung."
  }
];

// ===========================================
// DATOS ROLEPLAYS (SIMULACIÓN)
// ===========================================
const DATA_RP = [
  { id: 1, title: "🎟️ Fahrkarte kaufen", context: "You are at the train station. You want to buy a ticket to Berlin." },
  { id: 2, title: "🏨 Hotelzimmer", context: "You call a hotel to reserve a room for two people for the weekend." },
  { id: 3, title: "🤒 Beim Arzt", context: "You are sick. You are talking to a doctor about your symptoms." },
  { id: 4, title: "👕 Im Kaufhaus", context: "You want to buy a sweater but it is too small. You ask for a different size." },
  { id: 5, title: "☕ Im Café", context: "You order coffee and cake for yourself and a friend. You ask for the bill." }
];

let currentLevel = 'General';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0; 
let currentRp = null;

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab === 'conv' ? 'tabConv' : 'tabRole').classList.add('active');
    document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
    document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
}

function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function init() { 
    // Init Conv
    const g = document.getElementById('topicGrid'); 
    DATA_CONV.forEach((item) => { 
        const b = document.createElement('button'); 
        b.className = 'topic-btn'; 
        b.innerText = item.title; 
        b.onclick = () => { 
            isMockExam = false; 
            document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
            b.classList.add('active'); 
            currentTopic = item; 
            updateQuestion(); 
        }; 
        g.appendChild(b); 
    });
    
    // Init RP
    const rpc = document.querySelector('.rp-selector');
    DATA_RP.forEach(rp => {
       const b = document.createElement('div');
       b.className = 'rp-btn-select';
       b.innerText = rp.title;
       b.onclick = () => selectRP(rp, b);
       rpc.appendChild(b);
    });
}

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'General' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'Advanced' ? 'level-btn hl active' : 'level-btn'; 
    if(currentTopic && !isMockExam) updateQuestion(); 
}

// --- FUNCIÓN: PISTAS (SCAFFOLDING) ---
function toggleHint() {
    const box = document.getElementById('hintBox');
    if (box.style.display === 'none') {
        box.style.display = 'block';
    } else {
        box.style.display = 'none';
    }
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerText = currentTopic[currentLevel]; 
    document.getElementById('userInput').value = "";

    // LÓGICA DE PISTAS (GERMAN)
    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    if (hintBox && btnHint) {
        hintBox.style.display = 'none'; 
        
        // Mostrar pista solo en HL/Advanced y si existe
        if (currentLevel === 'Advanced' && currentTopic.check_HL) {
            btnHint.style.display = 'inline-block';
            hintBox.innerHTML = "<strong>📝 Wichtige Punkte / Key Points (HL):</strong><br>" + currentTopic.check_HL;
        } else {
            btnHint.style.display = 'none'; 
        }
    }
}

function speakText(text = null) { 
    const t = text || document.getElementById('qDisplay').innerText; 
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'de-DE'; 
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } 
}

function readMyInput() {
    const t = document.getElementById("userInput").value;
    if(t) speakText(t);
}

// LOGICA IA (Gemini)
async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Bitte schreib mehr... (Write more)");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Wird korrigiert...";
  
  const q = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

  // Recoger criterios HL
  let criteria = "Correct grammar (Wortstellung!) and vocabulary."; 
  if (currentLevel === 'Advanced' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Strict Leaving Cert German Oral Examiner (Ireland).
    QUESTION: "${q}". 
    STUDENT ANSWER: "${t}". 
    
    CRITICAL INSTRUCTIONS:
    1. IGNORE punctuation/capitalization errors (Voice input).
    2. CHECK GRAMMAR: Focus on Word Order (Verb position), Cases (Accusative/Dative), and Tenses.
    3. CHECK CONTENT: Student MUST mention: [ ${criteria} ].
       - If General Level: Be lenient.
       - If Advanced Level: Be strict. If they miss content points or mess up word order, TELL THEM.
    
    OUTPUT JSON ONLY: 
    { 
      "score": (0-100), 
      "feedback_de": "Feedback in German", 
      "feedback_en": "Feedback in English (Explain word order mistakes clearly)", 
      "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] 
    }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Ergebnis: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbDE').innerText = "🇩🇪 " + j.feedback_de; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Perfekt!";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { btnReset.innerText = "➡️ Nächste Frage"; btnReset.onclick = resetApp; } else { btnReset.innerText = "🔄 Anderes Thema"; btnReset.onclick = () => { isMockExam=false; resetApp(); }; }
  } catch (e) { 
      console.error(e); 
      alert("⚠️ The AI is busy (High Traffic). Please try again in 10s."); 
  } finally { b.disabled = false; b.innerText = "✨ Prüfen"; }
}

// ROLEPLAY LOGIC
function selectRP(rp, btn) {
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRp = rp;
    document.getElementById('rpArea').style.display = 'block';
    document.getElementById('rpContext').innerText = rp.context;
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex">Hallo! Wie kann ich Ihnen helfen?</div>`;
    speakText("Hallo! Wie kann ich Ihnen helfen?");
    
    const inp = document.getElementById('rpInput');
    inp.disabled = false; inp.value = ""; inp.focus();
    document.getElementById('rpSendBtn').disabled = false;
}

async function sendRP() {
    const inp = document.getElementById('rpInput');
    const txt = inp.value;
    if(!txt) return;
    
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble st">${txt}</div>`;
    inp.value = "";
    chat.scrollTop = chat.scrollHeight;

    // AI Response for Roleplay
    const hist = chat.innerText;
    const prompt = `ACT AS: German partner in a roleplay. CONTEXT: ${currentRp.context}. HISTORY: ${hist}. STUDENT SAID: "${txt}". 
    TASK: Reply briefly in German as the character (waiter, doctor, etc). Keep it simple (A2/B1 level). Return ONLY the German text.`;

    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
        const d = await r.json();
        const reply = d.candidates[0].content.parts[0].text;
        
        chat.innerHTML += `<div class="bubble ex">${reply}</div>`;
        speakText(reply);
        chat.scrollTop = chat.scrollHeight;
    } catch(e) { console.error(e); }
}

function startMockExam() { 
    isMockExam = true; mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    let i = [...Array(DATA_CONV.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [DATA_CONV[i[0]][currentLevel], DATA_CONV[i[1]][currentLevel], DATA_CONV[i[2]][currentLevel], "Was hast du gestern gemacht?", "Was sind deine Pläne für den Sommer?"];
    showMockQuestion();
}
function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Frage ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
    
    // Ocultar pistas en Mock
    const btnHint = document.getElementById('btnHint');
    const hintBox = document.getElementById('hintBox');
    if(btnHint) btnHint.style.display = 'none';
    if(hintBox) hintBox.style.display = 'none';
}
function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    if(isMockExam && mockIndex < 4) { 
        mockIndex++; showMockQuestion(); 
    } else { 
        isMockExam = false; 
        document.getElementById('userInput').value = ""; 
        document.getElementById('qDisplay').innerText = "Wähle ein Thema..."; 
        // Ocultar botón al resetear
        const btnHint = document.getElementById('btnHint');
        if(btnHint) btnHint.style.display = 'none';
    }
}

window.onload = init;
