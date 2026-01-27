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
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: CONVERSATION (Gaeilge Logic)
// ===========================================
let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// Base de datos de Conversación (ITALIANO)
const DATA = [
  { title: "1. Mi presento", OL: "Come ti chiami? Quanti anni hai? Quando è il tuo compleanno?", HL: "Parlami di te. Descrivi la tua personalità e i tuoi interessi." },
  { title: "2. La mia famiglia", OL: "Quante persone ci sono nella tua famiglia? Hai fratelli o sorelle?", HL: "Parlami della tua famiglia. Vai d'accordo con i tuoi genitori e fratelli?" },
  { title: "3. La mia casa", OL: "Vivi in una casa o in un appartamento? Descrivi la tua camera.", HL: "Descrivi la tua casa ideale. Cosa ti piace di più della tua casa attuale?" },
  { title: "4. Il mio quartiere", OL: "Cosa c'è nel tuo quartiere? C'è un parco o un cinema?", HL: "Parlami della tua zona. Quali sono i vantaggi e gli svantaggi di vivere lì?" },
  { title: "5. La scuola", OL: "Ti piace la scuola? Qual è la tua materia preferita?", HL: "Parlami della tua scuola. Cosa ne pensi del sistema scolastico irlandese?" },
  { title: "6. Passatempi", OL: "Cosa fai nel tempo libero? Ti piace lo sport?", HL: "Parlami dei tuoi hobby. Perché è importante avere interessi fuori dalla scuola?" },
  { title: "7. Il lavoro", OL: "Hai un lavoro part-time? Cosa fai?", HL: "Parlami della tua esperienza lavorativa. Pensi che gli studenti dovrebbero lavorare?" },
  { title: "8. Le vacanze", OL: "Dove sei andato in vacanza l'anno scorso? Ti piace l'Italia?", HL: "Parlami delle tue vacanze. Preferisci il mare o la montagna? Perché?" },
  { title: "9. Il futuro", OL: "Cosa farai l'anno prossimo? Vuoi andare all'università?", HL: "Quali sono i tuoi progetti per il futuro? Che lavoro ti piacerebbe fare?" },
  { title: "10. Fine settimana scorso", OL: "Cosa hai fatto il fine settimana scorso?", HL: "Raccontami come hai trascorso lo scorso weekend. Hai fatto qualcosa di speciale?" },
  { title: "11. Prossimo weekend", OL: "Cosa farai il prossimo fine settimana?", HL: "Quali sono i tuoi programmi per il prossimo weekend?" },
  { title: "12. Cibo italiano", OL: "Ti piace il cibo italiano? Qual è il tuo piatto preferito?", HL: "Cosa ne pensi della cucina italiana? Sai cucinare qualche piatto?" },
  { title: "13. La routine", OL: "A che ora ti svegli la mattina? Cosa fai dopo scuola?", HL: "Descrivi la tua giornata tipica. È stressante la vita di uno studente?" },
  { title: "14. La moda", OL: "Ti piace fare shopping? Cosa indossi di solito?", HL: "Segui la moda? Pensi che i vestiti firmati siano importanti per i giovani?" },
  { title: "15. Tecnologia", OL: "Hai un telefono nuovo? Usi molto i social media?", HL: "Qual è il ruolo della tecnologia nella tua vita? Pensi che siamo dipendenti dai telefoni?" }
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

function speakText() { 
    const rawHTML = document.getElementById('qDisplay').innerHTML;
    // Limpiamos etiquetas HTML y texto extra para que la voz no lea "(PASADO)" etc.
    const t = rawHTML.replace(/<[^>]*>/g, " ").replace(/\(PASADO\)|\(FUTURO\)/g, "").replace(/HL|OL/g, "").replace(/[0-9]\./g, ""); 
    
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'it-IT'; // ITALIANO
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } 
}

// === MOCK EXAM ===
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
}

function nextMockQuestion() {
    mockIndex++;
    showMockQuestion();
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = currentTopic[currentLevel]; 
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    if(isMockExam) {
        isMockExam = false;
        document.getElementById('userInput').value = "";
        document.getElementById('qDisplay').innerHTML = "Select a topic or start a new Mock Exam.";
    } else {
        document.getElementById('userInput').value = "";
    }
}

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Please say something more...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; 
  b.innerText = "⏳ Grading...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

  // 🔥 PROMPT ITALIANO 🔥
  const prompt = `
    ACT AS: Sympathetic Leaving Cert Italian Oral Examiner (Ireland).
    CONTEXT: The input is RAW VOICE TRANSCRIPTION. It has NO PUNCTUATION and NO CAPITALIZATION.
    
    QUESTION ASKED: "${questionContext}"
    
    CRITICAL INSTRUCTIONS:
    1. IGNORE completely the lack of punctuation.
    2. IGNORE run-on sentences. 
    3. CURRENT LEVEL: ${currentLevel}.
       - If Ordinary Level (OL): Be VERY GENEROUS. If the Italian is understandable, score HIGH (80-100%).
       - If Higher Level (HL): Look for vocabulary/tenses, but still ignore writing mechanics.
    
    TASK:
    Evaluate the student's answer: "${t}"
    
    OUTPUT JSON ONLY:
    {
      "score": (0-100 based on communication),
      "feedback_it": "Brief motivating feedback in Italian",
      "feedback_en": "Brief feedback in English",
      "errors": [
        { "original": "error", "correction": "fix", "explanation_en": "reason" }
      ]
    }
  `;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const d = await r.json(); 
    const cleanJson = d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    const j = JSON.parse(cleanJson);
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    
    const s = document.getElementById('scoreDisplay');
    s.innerText = `Score: ${j.score}%`;
    s.style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");

    document.getElementById('fbES').innerText = "🇮🇹 " + j.feedback_it; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    
    const l = document.getElementById('errorsList'); 
    l.innerHTML = "";
    
    if(j.errors && j.errors.length > 0) {
        j.errors.forEach(e => { 
            l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`; 
        });
    } else {
        l.innerHTML = "<div style='color:#166534; font-weight:bold;'>✅ Benissimo! No significant errors.</div>";
    }

    const btnReset = document.getElementById('btnReset');
    if (isMockExam) {
        if (mockIndex < 4) {
            btnReset.innerText = "➡️ Next Question";
            btnReset.onclick = nextMockQuestion; 
        } else {
            btnReset.innerText = "🏁 Finish Exam";
            btnReset.onclick = resetApp; 
        }
    } else {
        btnReset.innerText = "🔄 Try another topic";
        btnReset.onclick = resetApp;
    }

  } catch (e) { 
    console.error(e);
    alert("Error communicating with AI evaluator."); 
  } finally { 
    b.disabled = false; 
    b.innerText = "✨ Evaluate Answer"; 
  }
}

// ===========================================
// PARTE 2: ROLEPLAYS (SIN MP3 - TEXT TO SPEECH)
// ===========================================
let rpActual = null; 
let pasoActual = 0; 
let speaking = false;

// Base de Datos RP (OFICIAL LEAVING CERT 2024-2028)
const RP_DB = {
    1: { 
        context: "Un problema in albergo. (A problem at the hotel). You booked a room in Milan but they have no record.", 
        dialogs: [
            "Buongiorno, benvenuto all'Hotel Milano. Come posso aiutarla?", 
            "Mi dispiace, signore. Ho controllato il computer ma non risulta nessuna prenotazione a suo nome.", 
            "Capisco che è arrabbiato, ma purtroppo siamo al completo stasera.", 
            "Sì, conosco un albergo qui vicino. Si chiama Hotel Stella. Vuole che chiami per vedere se hanno posto?", 
            ["Ho chiamato l'Hotel Stella e hanno una camera libera. Ho prenotato a suo nome.", "È tutto risolto. L'Hotel Stella la aspetta."]
        ], 
        sugerencias: [
            "Buongiorno. Mi chiamo [Nome] e ho una prenotazione per una camera doppia per tre notti.", 
            "Non è possibile! Sono scioccato. Ho prenotato su internet un mese fa e ho la conferma.", 
            "È un disastro! È essenziale per me stare in questa zona perché ho delle riunioni di lavoro importanti qui vicino.", 
            "Sì, per favore. Sarebbe molto gentile se potesse prenotare una camera per me lì.", 
            "Grazie mille per il suo aiuto. È stato gentilissimo. Arrivederci." 
        ] 
    },
    2: { 
        context: "Una multa sul treno. (A fine on the train). Florence to Venice. Ticket not validated.", 
        dialogs: [
            "Buongiorno. Biglietto, prego.", 
            "Signore, questo biglietto non è convalidato. Devo farle la multa.", 
            "Mi dispiace, ma le regole sono regole. La multa è di cinquanta euro. Deve pagare ora.", 
            "Se non ha contanti, posso darle un bollettino postale. Ha altre domande sul viaggio?", 
            ["Sì, deve convalidare il biglietto ogni volta che cambia treno.", "Esatto. Ricordi sempre di timbrare prima di salire."]
        ], 
        sugerencias: [
            "Buongiorno. Ecco il mio biglietto.", 
            "Mi scusi, mi dispiace molto! Non l'ho convalidato perché ero in ritardo e stavo per perdere il treno. Per favore, non mi faccia la multa.", 
            "Cinquanta euro? Non ho abbastanza soldi con me. Posso pagare con la carta o ricevere la multa per posta?", 
            "Va bene. Senta, devo convalidare il biglietto anche quando cambio treno a Bologna?", 
            "Ho capito, grazie per l'informazione. Starò più attento la prossima volta. Arrivederci." 
        ] 
    },
    3: { 
        context: "In farmacia. (At the chemist's). Working in Italy, feeling unwell.", 
        dialogs: [
            "Buongiorno. Dimmi, cosa c'è che non va?", 
            "Capisco. Da quanto tempo ti senti così? Hai mangiato qualcosa di strano?", 
            "Sembra un virus. Ti consiglio di prendere queste compresse due volte al giorno e riposare.", 
            "Oh, capisco. Che lavoro farai?", 
            ["Non preoccuparti. Con questa medicina starai meglio in due giorni.", "Bevi molta acqua e starai bene presto. Arrivederci."]
        ], 
        sugerencias: [
            "Buongiorno. Non mi sento bene. Ho mal di stomaco, mal di testa e un po' di febbre.", 
            "Sto male da ieri sera. Forse ho mangiato dei frutti di mare che non erano freschi.", 
            "Grazie. Per quanti giorni devo prendere le compresse? E devo prenderle prima o dopo i pasti?", 
            "È molto importante per me guarire presto perché inizio il mio lavoro estivo come cameriere la settimana prossima.", 
            "Va bene, grazie mille per i consigli dottore. Arrivederci." 
        ] 
    },
    4: { 
        context: "Dov'è il passaporto? (Where is my passport?). At Fiumicino airport, lost passport. Calling host family.", 
        dialogs: [
            "Pronto, casa Rossi. Chi parla?", 
            "Oh no! Sei sicuro? Dove l'hai visto l'ultima volta?", 
            "Aspetta un attimo, vado a controllare... (Pausa)... Sì! L'ho trovato! Era proprio lì.", 
            "Certo! Prendo subito un taxi e te lo porto all'aeroporto. Arrivo tra mezz'ora.", 
            ["Non preoccuparti per il taxi. L'importante è che tu riesca a partire.", "Figurati! Corro subito. A dopo!"]
        ], 
        sugerencias: [
            "Pronto Maria? Sono io. Sono all'aeroporto in fila per il check-in e mi sono accorto di non avere il passaporto!", 
            "L'ultima volta l'ho visto stamattina sul comodino accanto al letto. Per favore, puoi controllare se è lì?", 
            "Che sollievo! Sono contentissimo. Devo assolutamente tornare in Irlanda oggi per un esame domani.", 
            "Grazie mille! Ti pago io il taxi, naturalmente. Ci vediamo agli arrivi?", 
            "Grazie infinite Maria, mi hai salvato la vita! A tra poco." 
        ] 
    },
    5: { 
        context: "Un colloquio di lavoro. (A job interview). Tourist village in Puglia. Interview with Manager.", 
        dialogs: [
            "Buongiorno, prego si accomodi. Mi dica, come si chiama e quanti anni ha?", 
            "Bene. Vedo dal curriculum che ha esperienza. Mi parli del suo lavoro in Irlanda.", 
            "Interessante. E parla molto bene l'italiano! Dove l'ha studiato?", 
            "Molto bravo. Perché pensa di essere il candidato ideale per questo lavoro?", 
            ["Ottimo. Ha qualche domanda da farmi sul lavoro?", "Perfetto. Le faremo sapere entro domani. Arrivederci."]
        ], 
        sugerencias: [
            "Buongiorno. Mi chiamo [Nome] e ho diciotto anni.", 
            "Sì, l'estate scorsa ho lavorato in un campo estivo in Irlanda. Organizzavo giochi e attività sportive per i bambini.", 
            "Studio l'italiano a scuola da cinque anni e guardo molti film italiani per migliorare.", 
            "Sono una persona molto affidabile, socievole e gran lavoratore. Mi piace molto lavorare in squadra.", 
            "Sì, vorrei sapere quali sono gli orari di lavoro e se c'è un giorno libero alla settimana. Grazie." 
        ] 
    }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; speaking = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DB[id].context;
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Play Examiner Audio" to start.</div>`;
    document.getElementById('nextAudioBtn').style.display = "block";
    document.getElementById('rpInput').disabled = true; document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

// MODIFICADO: NO USA MP3, USA TTS (Voz Robot)
function reproducirAudio(texto) {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'it-IT'; // Voz Italiana
    u.rate = 0.9;
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

function proximaIntervencion() {
    if (!rpActual || speaking) return;
    document.getElementById('nextAudioBtn').style.display = "none";
    speaking = true;
    
    if (pasoActual >= 5) {
        document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed! Ben fatto.</div>`;
        return;
    }

    let dialogText = RP_DB[rpActual].dialogs[pasoActual];

    if (Array.isArray(dialogText)) {
        const randomIndex = Math.floor(Math.random() * dialogText.length);
        dialogText = dialogText[randomIndex];
    }

    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`;
    chat.scrollTop = chat.scrollHeight;
    
    reproducirAudio(dialogText);
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
        if(pasoActual < 5) { document.getElementById('nextAudioBtn').style.display = "block"; } else { document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`; }
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
// LÓGICA DE STORIE ILLUSTRATE (PICTURE SEQUENCES)
// ===========================================
let currentStoryTitle = "";

const STORIE_TITLES = [
  "Storia 1: La Spesa al Supermercato (Grocery Shopping)",
  "Storia 2: L'Incidente Stradale (The Car Accident)",
  "Storia 3: Il Portafoglio Smarrito/Ritrovato (Lost/Found Wallet)",
  "Storia 4: La Festa in Casa (The House Party)",
  "Storia 5: La Gita Scolastica (The School Trip)"
];

// Actualizar switchTab para incluir 'story'
const oldSwitch = switchTab; // Guardamos la vieja referencia si fuera necesario, pero mejor reescribirla:
function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabStory').className = tab === 'story' ? 'tab-btn active' : 'tab-btn';
  
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
  document.getElementById('sectionStory').style.display = tab === 'story' ? 'block' : 'none';
}

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
    
    INSTRUCTIONS:
    1. Check if the Italian grammar (passato prossimo/imperfetto) and vocabulary are correct for this story.
    2. Ignore lack of punctuation (it might be voice input).
    3. Be encouraging but correct mistakes clearly.
    
    OUTPUT JSON ONLY:
    { "score": (0-100), "feedback_it": "Feedback in Italian", "feedback_en": "Feedback in English", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
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

  } catch (e) { console.error(e); alert("Errore di connessione."); } finally { b.disabled = false; b.innerText = "✨ Evaluate Description"; }
}

function resetStory() {
    document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyArea').style.display = 'block';
    document.getElementById('userInputStory').value = "";
}
// Inicializamos la botonera
initConv();

// Función para escuchar lo que el alumno escribe (opcional)
function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT'; 
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}
