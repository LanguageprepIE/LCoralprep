// ===========================================
// CONFIGURACIÓN (BACKEND ACTIVADO 🔒)
// ===========================================
// La clave API ha sido eliminada. 
// Ahora nos conectamos a través de Netlify Functions.

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
    check_HL: "Sport (Gioco a calcio...), Musica/Lettura, Frequenza (Due volte alla settimana), Importanza (Per rilassarmi, Salute mentale)."
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

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Please say something more...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Grading...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

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
    // CONEXIÓN AL BACKEND (NETLIFY)
    const r = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!r.ok) throw new Error("Errore Backend");
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);

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
      alert("⚠️ Errore: " + e.message); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Evaluate Answer"; 
  }
}

// ===========================================
// PARTE 2: ROLEPLAYS (BOTÓN INTELIGENTE: LISTEN -> REPLAY)
// ===========================================
let rpActual = null; 
let pasoActual = 0; 
let speaking = false;

const RP_DB = {
    1: { 
        context: "Un problema in albergo. You booked a room but the receptionist has no record.", 
        dialogs: [
            "Buongiorno, benvenuto all'Hotel Milano. Come posso aiutarla?", 
            "Mi dispiace, signore. Ho controllato il computer ma non risulta nessuna prenotazione a questo nome.", 
            "Capisco che è arrabbiato, ma purtroppo siamo al completo questa settimana.", 
            "Sì, conosco un albergo qui vicino. Si chiama Hotel Stella. Vuole che chiami per vedere se hanno posto?", 
            ["Ho chiamato l'Hotel Stella e fortunatamente hanno una camera libera.", "È tutto risolto. L'Hotel Stella la aspetta."]
        ], 
        sugerencias: [
            "Buongiorno. Mi chiamo [Nome] e ho prenotato una camera singola per tre notti. Ecco la mia conferma.", 
            "Non è possibile! Ho fatto la prenotazione su internet un mese fa. Sono molto sorpreso e preoccupato.", 
            "Guardi, è un disastro per me. Ho assolutamente bisogno di un alloggio in questa zona perché ho una conferenza importante qui vicino.", 
            "Sì, per favore. Sarebbe molto gentile da parte sua. Non conosco bene la città e non saprei dove andare.", 
            "Grazie mille per il suo aiuto. Apprezzo molto la sua disponibilità. Arrivederci."
        ] 
    },
    2: { 
        context: "Una multa sul treno. You didn't validate your ticket.", 
        dialogs: [
            "Buongiorno. Biglietto, prego.", 
            "Signore, vedo che ha il biglietto ma non è stato convalidato. Devo farle la multa.", 
            "Mi dispiace, ma la regola è chiara. La multa è di cinquanta euro. Deve pagare ora.", 
            "Se non ha contanti, posso darle un bollettino postale. Ha domande su come funziona?", 
            ["Sì, deve convalidare il biglietto ogni volta che cambia treno, anche a Bologna.", "Ricordi sempre di timbrare alle macchinette gialle prima di salire."]
        ], 
        sugerencias: [
            "Buongiorno. Ecco il mio biglietto, sto andando a Venezia.", 
            "Mi scusi tanto! Sono arrivato in ritardo alla stazione e sono salito di corsa sul treno. Non l'ho fatto apposta, per favore non mi faccia la multa.", 
            "Cinquanta euro?! Purtroppo non ho abbastanza contanti con me in questo momento. Sono uno studente.", 
            "Va bene, accetto il bollettino. Posso chiedere se devo convalidare di nuovo il biglietto quando cambio treno a Bologna?", 
            "Ho capito, starò più attento la prossima volta. Grazie per l'informazione. Arrivederci."
        ] 
    },
    3: { 
        context: "In farmacia. You feel sick and need advice.", 
        dialogs: [
            "Buongiorno. Dimmi, cosa c'è che non va?", 
            "Da quanto tempo ti senti così? Hai mangiato qualcosa di strano recentemente?", 
            "Capisco. Ti consiglio di prendere queste compresse due volte al giorno dopo i pasti.", 
            "Che lavoro farai quest'estate qui in Italia?", 
            ["Non preoccuparti. Con questa medicina starai meglio in un paio di giorni.", "Bevi molta acqua e riposati. Arrivederci."]
        ], 
        sugerencias: [
            "Buongiorno. Non mi sento molto bene. Ho mal di stomaco e un po' di febbre.", 
            "Sto male da ieri sera. Penso di aver mangiato del pesce che non era fresco in un ristorante del centro.", 
            "Grazie dottore. Per quanti giorni devo prenderle? E ci sono cibi che dovrei evitare?", 
            "Lavorerò come cameriere in un ristorante, per questo è molto importante che io guarisca presto.", 
            "Grazie mille per il consiglio. Spero di rimettermi presto. Arrivederci."
        ] 
    },
    4: { 
        context: "Dov'è il passaporto? You left it at your host family's house.", 
        dialogs: [
            "Pronto, casa Rossi. Chi parla?", 
            "Oh no! Sei sicuro? Dove l'hai visto l'ultima volta?", 
            "Aspetta un attimo, vado a controllare... Sì! L'ho trovato! Era proprio lì.", 
            "Ascolta, non preoccuparti. Prendo un taxi e te lo porto subito all'aeroporto.", 
            ["Non preoccuparti per il taxi, mi fa piacere aiutarti.", "Sto uscendo ora. Ci vediamo agli arrivi tra mezz'ora!"]
        ], 
        sugerencias: [
            "Pronto Maria? Sono io. Sono disperato! Sono in fila al check-in all'aeroporto e mi sono accorto di non avere il passaporto.", 
            "L'ultima volta l'ho visto stamattina sul comodino accanto al letto, o forse sulla scrivania. Potresti controllare per favore?", 
            "Che sollievo! Grazie mille! Devo assolutamente tornare in Irlanda oggi per un esame domani.", 
            "Sei un angelo! Grazie infinite. Ovviamente ti pagherò io il taxi quando arrivi.", 
            "Grazie ancora Maria, non so cosa avrei fatto senza di te. A tra poco!"
        ] 
    },
    5: { 
        context: "Un colloquio di lavoro. Summer job in a tourist village.", 
        dialogs: [
            "Buongiorno. Prego, si accomodi. Come si chiama e quanti anni ha?", 
            "Molto bene. Mi parli delle sue esperienze lavorative precedenti.", 
            "Parla molto bene l'italiano! Dove l'ha studiato e per quanto tempo?", 
            "Perché pensa di essere il candidato ideale per questo lavoro nel nostro villaggio?", 
            ["Ha qualche domanda da farmi sugli orari o sullo stipendio?", "Le faremo sapere la nostra decisione domani. Arrivederci."]
        ], 
        sugerencias: [
            "Buongiorno. Mi chiamo [Nome], ho 18 anni e vengo dall'Irlanda.", 
            "L'estate scorsa ho lavorato in un campo estivo in Irlanda. Organizzavo attività sportive per i bambini e aiutavo in cucina.", 
            "Studio italiano a scuola da cinque anni e guardo molti film italiani per migliorare la pronuncia.", 
            "Sono una persona molto socievole, affidabile e gran lavoratore. Mi piace stare a contatto con la gente e imparo in fretta.", 
            "Sì, vorrei sapere quali sono i turni di lavoro e se l'alloggio è compreso. Grazie."
        ] 
    }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; speaking = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DB[id].context;
    
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Examiner" to begin.</div>`;
    
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "▶️ Start Examiner";
    nextBtn.className = "audio-btn"; 
    nextBtn.style.background = "var(--primary)";
    nextBtn.style.color = "white";
    nextBtn.onclick = reproducirInterventoExaminer; 
    
    document.getElementById('rpInput').disabled = true; 
    document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

function reproducirInterventoExaminer() {
    // 1. Obtener texto del diálogo
    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    if (Array.isArray(dialogText)) dialogText = dialogText[Math.floor(Math.random() * dialogText.length)];

    // 2. Comprobar si ya mostramos este texto (para no duplicar burbujas al re-escuchar)
    const chat = document.getElementById('rpChat');
    const lastMsg = chat.lastElementChild;
    const isReplay = lastMsg && lastMsg.classList.contains('ex') && lastMsg.innerText.includes(dialogText);

    if (!isReplay) {
        if (pasoActual >= 5) {
            chat.innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed!</div>`;
            document.getElementById('nextAudioBtn').style.display = "none";
            return;
        }
        chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }

    // 3. Reproducir Audio
    reproducirAudio(dialogText);

    // 4. CAMBIAR EL BOTÓN A MODO "REPLAY"
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "🔄 Riascolta / Replay";
    nextBtn.style.background = "#fbbf24"; 
    nextBtn.style.color = "black";
    
    nextBtn.onclick = () => reproducirAudio(dialogText);
}

function reproducirAudio(texto) {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'it-IT'; u.rate = 0.9;
    
    // Habilitar input SOLO si no está habilitado ya
    u.onend = habilitarInput;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
}

function habilitarInput() {
    speaking = false;
    if(pasoActual < 5) { // 5 es el límite de pasos
        document.getElementById('rpInput').disabled = false;
        document.getElementById('rpSendBtn').disabled = false;
        if(!(/iPad|iPhone|iPod/.test(navigator.userAgent))) document.getElementById('rpInput').focus();
        
        document.getElementById('hintBtn').style.display = "block";
        document.getElementById('rpInput').placeholder = "Type your reply...";
    }
}

function enviarRespuestaRP() {
    const inp = document.getElementById('rpInput');
    const txt = inp.value.trim(); if(!txt) return;
    
    // 1. Enviar mensaje usuario
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble st">${txt}</div>`;
    chat.scrollTop = chat.scrollHeight;
    
    // 2. Deshabilitar controles
    inp.value = ""; inp.disabled = true; document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
    
    // 3. Ocultar el botón de Replay
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "none";

    // 4. Avanzar paso
    pasoActual++;
    
    // 5. Preparar botón para el SIGUIENTE turno (Listen)
    setTimeout(() => { 
        if(pasoActual < 5) { 
            nextBtn.style.display = "block";
            nextBtn.innerText = "🔊 Ascolta / Listen Next";
            nextBtn.style.background = "var(--primary)"; 
            nextBtn.style.color = "white";
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
    // CONEXIÓN AL BACKEND (NETLIFY)
    const r = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!r.ok) throw new Error("Errore Backend");
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);

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
      alert("⚠️ Errore: " + e.message); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Evaluate Description"; 
  }
}

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
