// ===========================================
// CONFIGURACIÓN Y CLAVES (API KEY)
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

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
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// DATA CON CRITERIOS HL (check_HL) AÑADIDOS
const DATA = [
  { 
    title: "1. Mi presento", 
    OL: "Come ti chiami? Quanti anni hai? Quando è il tuo compleanno?", 
    HL: "Parlami di te. Descrivi la tua personalità e i tuoi interessi.",
    check_HL: "Nome, Età, Compleanno (Il mio compleanno è il...), Descrizione fisica (Occhi/Capelli), Personalità (Sono simpatico/a, aperto/a...)."
  },
  { 
    title: "2. La mia famiglia", 
    OL: "Quante persone ci sono nella tua famiglia? Hai fratelli o sorelle?", 
    HL: "Parlami della tua famiglia. Vai d'accordo con i tuoi genitori e fratelli?",
    check_HL: "Numero persone (Siamo in...), Lavoro genitori (Mio padre fa...), Fratelli/Sorelle, Rapporti (Vado d'accordo con..., Litighiamo spesso)."
  },
  { 
    title: "3. La mia casa", 
    OL: "Vivi in una casa o in un appartamento? Descrivi la tua camera.", 
    HL: "Descrivi la tua casa ideale. Cosa ti piace di più della tua casa attuale?",
    check_HL: "Tipo (Villetta/Appartamento), Stanze (C'è/Ci sono...), La mia camera (Ho un letto...), Opinione (Mi piace perché...), Casa ideale (Vorrei una piscina...)."
  },
  { 
    title: "4. Il mio quartiere", 
    OL: "Cosa c'è nel tuo quartiere? C'è un parco o un cinema?", 
    HL: "Parlami della tua zona. Quali sono i vantaggi e gli svantaggi di vivere lì?",
    check_HL: "Strutture (C'è un parco...), Vantaggi (È tranquillo), Svantaggi (Non c'è niente da fare), Mezzi di trasporto."
  },
  { 
    title: "5. La scuola", 
    OL: "Ti piace la scuola? Qual è la tua materia preferita?", 
    HL: "Parlami della tua scuola. Cosa ne pensi del sistema scolastico irlandese?",
    check_HL: "Tipo (Mista/Maschile/Femminile), Materie (Studio...), Materia preferita vs Odiata, Opinione sistema (Punti Leaving Cert, Stress)."
  },
  { 
    title: "6. Passatempi", 
    OL: "Cosa fai nel tempo libero? Ti piace lo sport?", 
    HL: "Parlami dei tuoi hobby. Perché è importante avere interessi fuori dalla scuola?",
    check_HL: "Sport (Gioco a calcio...), Musica/Lettura, Frequenza (Due volte alla settimana), Importancia (Per rilassarmi, Salute mentale)."
  },
  { 
    title: "7. Il lavoro", 
    OL: "Hai un lavoro part-time? Cosa fai?", 
    HL: "Parlami della tua esperienza lavorativa. Pensi che gli studenti dovrebbero lavorare?",
    check_HL: "Lavoro attuale (Faccio il cameriere...), Mansioni (Devo pulire...), Opinione (Indipendenza economica vs Tempo per studiare)."
  },
  { 
    title: "8. Le vacanze", 
    OL: "Dove sei andato in vacanza l'anno scorso? Ti piace l'Italia?", 
    HL: "Parlami delle tue vacanze. Preferisci il mare o la montagna? Perché?",
    check_HL: "Passato Prossimo (Sono andato/a in...), Imperfetto (Faceva caldo, Era bello), Alloggio, Preferenze (Preferisco il mare)."
  },
  { 
    title: "9. Il futuro", 
    OL: "Cosa farai l'anno prossimo? Vuoi andare all'università?", 
    HL: "Quali sono i tuoi progetti per il futuro? Che lavoro ti piacerebbe fare?",
    check_HL: "Futuro Semplice (Andrò, Studierò...), Condizionale (Vorrei diventare...), Università/Corso di laurea, Anno sabbatico."
  },
  { 
    title: "10. Fine settimana scorso", 
    OL: "Cosa hai fatto il fine settimana scorso?", 
    HL: "Raccontami come hai trascorso lo scorso weekend. Hai fatto qualcosa di speciale?",
    check_HL: "Passato Prossimo AVERE (Ho guardato, Ho mangiato), Passato Prossimo ESSERE (Sono uscito/a, Sono andato/a), Amici/Famiglia."
  },
  { 
    title: "11. Prossimo weekend", 
    OL: "Cosa farai il prossimo fine settimana?", 
    HL: "Quali sono i tuoi programmi per il prossimo weekend?",
    check_HL: "Futuro Semplice (Andrò al cinema, Farò i compiti...), Piani specifici (Uscirò con gli amici)."
  },
  { 
    title: "12. Cibo italiano", 
    OL: "Ti piace il cibo italiano? Qual è il tuo piatto preferito?", 
    HL: "Cosa ne pensi della cucina italiana? Sai cucinare qualche piatto?",
    check_HL: "Piatto preferito (Adoro la pizza...), Cucinare (So cucinare la pasta...), Confronto Cibo Irlandese vs Italiano."
  },
  { 
    title: "13. La routine", 
    OL: "A che ora ti svegli la mattina? Cosa fai dopo scuola?", 
    HL: "Descrivi la tua giornata tipica. È stressante la vita di uno studente?",
    check_HL: "Verbi Riflessivi (Mi sveglio, Mi alzo, Mi vesto...), Orari (Alle otto...), Pasti, Studio vs Tempo libero."
  },
  { 
    title: "14. La moda", 
    OL: "Ti piace fare shopping? Cosa indossi di solito?", 
    HL: "Segui la moda? Pensi che i vestiti firmati siano importanti per i giovani?",
    check_HL: "Abbigliamento abituale (Di solito indosso...), Opinione marche (Sono troppo costose), Pressione sociale."
  },
  { 
    title: "15. Tecnologia", 
    OL: "Hai un telefono nuovo? Usi molto i social media?", 
    HL: "Qual è il ruolo della tecnologia nella tua vita? Pensi che siamo dipendenti dai telefoni?",
    check_HL: "Uso quotidiano (Uso Instagram per...), Vantaggi (Comunicazione), Svantaggi (Cyberbullismo, Dipendenza)."
  }
];

const PAST_Q = ["Cosa hai fatto ieri?", "Dove sei andato l'estate scorsa?", "Come hai festeggiato il tuo compleanno?"];
const FUT_Q = ["Cosa farai domani?", "Dove andrai in vacanza quest'anno?", "Cosa farai dopo gli esami?"];

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'OL' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'HL' ? 'level-btn hl active' : 'level-btn'; 
    if(currentTopic && !isMockExam) updateQuestion(); 
}

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
            updateQuestion(); 
        }; 
        g.appendChild(b); 
    }); 
}

// --- FUNZIONE: MOSTRA/NASCONDI SUGGERIMENTI (SCAFFOLDING) ---
function toggleHint() {
    const box = document.getElementById('hintBox');
    if (box.style.display === 'none') {
        box.style.display = 'block';
    } else {
        box.style.display = 'none';
    }
}

function speakText() { 
    const rawHTML = document.getElementById('qDisplay').innerHTML;
    // Limpieza de texto para el TTS (Mejorado)
    const t = rawHTML.replace(/<[^>]*>/g, " ").replace(/\(PASSATO\)|\(FUTURO\)/g, "").replace(/HL|OL/g, "").replace(/[0-9]\./g, ""); 
    
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'it-IT'; 
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } 
}

function startMockExam() { 
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
    
    // Nascondi suggerimenti nel Mock Exam
    const btnHint = document.getElementById('btnHint');
    const hintBox = document.getElementById('hintBox');
    if(btnHint) btnHint.style.display = 'none';
    if(hintBox) hintBox.style.display = 'none';
}

function nextMockQuestion() {
    mockIndex++;
    showMockQuestion();
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = currentTopic[currentLevel]; 
    document.getElementById('userInput').value = "";

    // LOGICA SUGGERIMENTI (ITALIANO)
    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    if (hintBox && btnHint) {
        hintBox.style.display = 'none'; 
        
        // Mostra bottone solo se HL e esistono criteri
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
        // Nascondi bottone suggerimento al reset
        const btnHint = document.getElementById('btnHint');
        if(btnHint) btnHint.style.display = 'none';
    } else {
        document.getElementById('userInput').value = "";
    }
}

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Please say something more...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Grading...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

  // Raccogli criteri HL
  let criteria = "Correct grammar (accordance, tenses) and vocabulary."; 
  if (currentLevel === 'HL' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Strict Leaving Cert Italian Oral Examiner (Ireland).
    CONTEXT: RAW VOICE TRANSCRIPTION (No punctuation).
    QUESTION: "${questionContext}"
    LEVEL: ${currentLevel}.
    STUDENT ANSWER: "${t}"
    
    CRITICAL INSTRUCTIONS:
    1. IGNORE punctuation/capitalization errors.
    2. CHECK GRAMMAR: Gender agreement (o/a/i/e), Auxiliary verbs (Essere vs Avere in Passato Prossimo).
    3. CHECK CONTENT: The student MUST mention: [ ${criteria} ].
       - If HL: Be strict on content and grammar. Tell them if they missed key points.
    
    OUTPUT JSON ONLY: { 
        "score": (0-100), 
        "feedback_it": "Italian feedback. Mention missing points if any.", 
        "feedback_en": "English feedback explaining grammar mistakes.", 
        "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] 
    }
  `;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Score: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbES').innerText = "🇮🇹 " + j.feedback_it; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "<div style='color:#166534; font-weight:bold;'>✅ Benissimo!</div>";

    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) {
        btnReset.innerText = "➡️ Next Question";
        btnReset.onclick = nextMockQuestion; 
    } else {
        btnReset.innerText = "🔄 Try another topic";
        btnReset.onclick = resetApp; 
    }
  } catch (e) { 
      console.error(e); 
      // Messaggio Cortese High Traffic
      alert("⚠️ The AI is a bit busy right now (High Traffic).\nPlease wait 10 seconds and try again!\n\n(L'IA è occupata, aspetta 10 secondi)."); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Evaluate Answer"; 
  }
}

// ===========================================
// PARTE 2: ROLEPLAYS (CON BOTÓN MANUAL PARA IPAD)
// ===========================================
let rpActual = null; 
let pasoActual = 0; 
let speaking = false;

const RP_DB = {
    1: { 
        context: "Un problema in albergo.", 
        dialogs: ["Buongiorno, benvenuto all'Hotel Milano. Come posso aiutarla?", "Mi dispiace, signore. Ho controllato il computer ma non risulta nessuna prenotazione.", "Capisco che è arrabbiato, ma siamo al completo.", "Sì, conosco un albergo qui vicino. Si chiama Hotel Stella. Vuole che chiami?", ["Ho chiamato l'Hotel Stella e hanno una camera libera.", "È tutto risolto. L'Hotel Stella la aspetta."]], 
        sugerencias: ["Buongiorno. Mi chiamo [Nome] e ho una prenotazione.", "Non è possibile! Ho la conferma qui.", "È un disastro! Devo stare in questa zona.", "Sì, per favore. Sarebbe molto gentile.", "Grazie mille per il suo aiuto. Arrivederci."] 
    },
    2: { 
        context: "Una multa sul treno.", 
        dialogs: ["Buongiorno. Biglietto, prego.", "Signore, questo biglietto non è convalidato. Devo farle la multa.", "La multa è di cinquanta euro. Deve pagare ora.", "Se non ha contanti, posso darle un bollettino. Ha domande?", ["Sì, deve convalidare il biglietto ogni volta che cambia treno.", "Ricordi sempre di timbrare prima di salire."]], 
        sugerencias: ["Buongiorno. Ecco il mio biglietto.", "Mi scusi! Non l'ho convalidato perché ero in ritardo.", "Non ho abbastanza soldi. Posso pagare con la carta?", "Devo convalidare anche a Bologna?", "Ho capito, grazie. Arrivederci."] 
    },
    3: { 
        context: "In farmacia.", 
        dialogs: ["Buongiorno. Dimmi, cosa c'è che non va?", "Da quanto tempo ti senti così? Hai mangiato qualcosa di strano?", "Ti consiglio di prendere queste compresse due volte al giorno.", "Che lavoro farai quest'estate?", ["Non preoccuparti. Con questa medicina starai meglio.", "Bevi molta acqua. Arrivederci."]], 
        sugerencias: ["Non mi sento bene. Ho mal di stomaco.", "Sto male da ieri sera. Forse ho mangiato pesce non fresco.", "Grazie. Per quanti giorni devo prenderle?", "Lavoro come cameriere.", "Va bene, grazie dottore."] 
    },
    4: { 
        context: "Dov'è il passaporto?", 
        dialogs: ["Pronto, casa Rossi. Chi parla?", "Oh no! Sei sicuro? Dove l'hai visto l'ultima volta?", "Aspetta... Sì! L'ho trovato! Era proprio lì.", "Prendo un taxi e te lo porto all'aeroporto.", ["Non preoccuparti per il taxi.", "Corro subito. A dopo!"]], 
        sugerencias: ["Pronto Maria? Sono io. Sono all'aeroporto e ho perso il passaporto!", "Stamattina era sul comodino.", "Che sollievo! Devo tornare in Irlanda oggi.", "Grazie mille! Ti pago il taxi.", "Grazie infinite Maria!"] 
    },
    5: { 
        context: "Un colloquio di lavoro.", 
        dialogs: ["Buongiorno. Come si chiama e quanti anni ha?", "Mi parli del suo lavoro in Irlanda.", "Parla bene l'italiano! Dove l'ha studiato?", "Perché pensa di essere il candidato ideale?", ["Ha qualche domanda?", "Le faremo sapere domani. Arrivederci."]], 
        sugerencias: ["Buongiorno. Mi chiamo [Nome] e ho 18 anni.", "Lavoravo in un campo estivo con i bambini.", "Studio italiano a scuola da 5 anni.", "Sono affidabile e socievole.", "Quali sono gli orari di lavoro?"] 
    }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; speaking = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DB[id].context;
    
    // 1. Mensaje inicial del sistema
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Examiner" to begin.</div>`;
    
    // 2. Mostrar botón de inicio (Manual para evitar conflicto de audio)
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "▶️ Start Examiner";
    nextBtn.onclick = reproducirInterventoExaminer; // Vinculamos la función
    
    document.getElementById('rpInput').disabled = true; 
    document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

function reproducirInterventoExaminer() {
    // 1. Ocultar botón (ya lo has pulsado)
    document.getElementById('nextAudioBtn').style.display = "none";
    
    if (pasoActual >= 5) {
        document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed!</div>`;
        return;
    }

    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    if (Array.isArray(dialogText)) dialogText = dialogText[Math.floor(Math.random() * dialogText.length)];

    // 2. Mostrar texto en el chat
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`;
    chat.scrollTop = chat.scrollHeight;
    
    // 3. Reproducir audio (Seguro porque viene de un click)
    reproducirAudio(dialogText);
}

function reproducirAudio(texto) {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'it-IT'; u.rate = 0.9;
    u.onend = habilitarInput;
    window.speechSynthesis.speak(u);
}

function habilitarInput() {
    speaking = false;
    if(pasoActual < RP_DB[rpActual].dialogs.length) { 
        document.getElementById('rpInput').disabled = false;
        document.getElementById('rpSendBtn').disabled = false;
        document.getElementById('rpInput').focus();
        document.getElementById('hintBtn').style.display = "block";
        document.getElementById('rpInput').placeholder = "Type your reply...";
    }
}

function enviarRespuestaRP() {
    const inp = document.getElementById('rpInput');
    const txt = inp.value.trim(); if(!txt) return;
    
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble st">${txt}</div>`;
    chat.scrollTop = chat.scrollHeight;
    
    inp.value = ""; inp.disabled = true; document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
    
    pasoActual++;
    
    setTimeout(() => { 
        if(pasoActual < 5) { 
            // AQUÍ EL CAMBIO CLAVE: Volver a mostrar el botón
            const nextBtn = document.getElementById('nextAudioBtn');
            nextBtn.style.display = "block";
            nextBtn.innerText = "🔊 Ascolta / Listen";
            nextBtn.onclick = reproducirInterventoExaminer;
        } else { 
            document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`; 
        }
    }, 500);
}

function mostrarSugerencia() {
    const sug = RP_DB[rpActual].sugerencias[pasoActual];
    if(sug) {
        const chat = document.getElementById('rpChat');
        chat.innerHTML += `<div class="feedback-rp">💡 <b>Model Answer:</b> ${sug}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
}

// ===========================================
// LÓGICA DE STORIE ILLUSTRATE (INTATTA)
// ===========================================
let currentStoryTitle = "";

const STORIE_TITLES = [
  "Storia 1: La Spesa al Supermercato (Grocery Shopping)",
  "Storia 2: L'Incidente Stradale (The Car Accident)",
  "Storia 3: Il Portafoglio Smarrito/Ritrovato (Lost/Found Wallet)",
  "Storia 4: La Festa in Casa (The House Party)",
  "Storia 5: La Gita Scolastica (The School Trip)"
];

function selectStory(index, btn) {
    document.querySelectorAll('#sectionStory .rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentStoryTitle = STORIE_TITLES[index];
    document.getElementById('storyArea').style.display = 'block';
    document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyTitle').innerText = currentStoryTitle;
    document.getElementById('userInputStory').value = "";
}

function speakStoryPrompt() {
    const text = "Guardiamo questa storia. Descrivi ciò che vedi nelle immagini.";
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'it-IT'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }
}

function readMyStoryInput() {
    const text = document.getElementById("userInputStory").value;
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

async function analyzeStory() {
  const t = document.getElementById('userInputStory').value;
  if(t.length < 5) return alert("Scrivi o dì qualcosa di più...");
  
  const b = document.getElementById('btnActionStory'); 
  b.disabled = true; b.innerText = "⏳ Valutando...";

  const prompt = `
    ACT AS: Italian Leaving Cert Examiner.
    TASK: The student is describing a Picture Sequence (Storia Illustrata): "${currentStoryTitle}".
    STUDENT INPUT: "${t}"
    OUTPUT JSON ONLY: { "score": (0-100), "feedback_it": "Italian feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
  `;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('storyArea').style.display = 'none'; 
    document.getElementById('resultStory').style.display = 'block';
    document.getElementById('userResponseTextStory').innerText = t;
    document.getElementById('scoreDisplayStory').innerText = `Punteggio: ${j.score}%`;
    document.getElementById('scoreDisplayStory').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbITStory').innerText = "🇮🇹 " + j.feedback_it; 
    document.getElementById('fbENStory').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListStory').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Eccellente!";

  } catch (e) { 
      console.error(e); 
      // ERROR AMABLE HIGH TRAFFIC
      alert("⚠️ The AI is a bit busy right now (High Traffic).\nPlease wait 10 seconds and try again!\n\n(L'IA è occupata, aspetta 10 secondi)."); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Evaluate Description"; 
  }
}

function resetStory() {
    document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyArea').style.display = 'block';
    document.getElementById('userInputStory').value = "";
}

// Función para escuchar lo que el alumno escribe (general)
function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT'; 
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

// Inicialización
window.onload = initConv;
