// ===========================================
// CONFIGURACIÓN Y CLAVES (API KEY)
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// --- NAVEGACIÓN DE PESTAÑAS ---
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: CONVERSATION (AI - GEMINI)
// ===========================================
let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// Base de datos de Conversación (15 Temas) + CRITERIOS BILINGÜES
const DATA = [
  { 
    title: "1. Yo mismo", 
    OL: "¿Cómo te llamas? ¿Cuándo es tu cumpleaños? ¿Puedes describirte físicamente?", 
    HL: "Háblame de ti. Describe tu personalidad y tu físico.",
    check_HL: "Nombre (Name), Edad (Age), Cumpleaños (Birthday), Descripción física (Physical desc. - eyes/hair/height), Personalidad (Personality - 3 adjectives)."
  },
  { 
    title: "2. Mi familia", 
    OL: "¿Cuántas personas hay en tu familia? ¿Tienes hermanos?", 
    HL: "Háblame de tu familia. ¿Cómo son tus padres y hermanos? ¿Te llevas bien con ellos?",
    check_HL: "Cuántos sois (Number of people), Profesión de padres (Parents' jobs), Descripción de hermanos (Siblings), Relación (Relationship - get on well/badly), Mascotas (Pets)."
  },
  { 
    title: "3. Mis amigos", 
    OL: "¿Tienes muchos amigos? ¿Cómo se llama tu mejor amigo?", 
    HL: "Háblame de tu mejor amigo. ¿Tenéis los mismos intereses? ¿Por qué es especial?",
    check_HL: "Nombre (Best friend's name), Descripción física/personalidad (Physical/Personality), Gustos en común (Shared interests), Por qué es buen amigo (Why special)."
  },
  { 
    title: "4. Mi casa", 
    OL: "¿Vives en una casa o en un piso? ¿Cómo es tu dormitorio?", 
    HL: "Describe tu casa ideal. ¿Qué es lo que más te gusta y lo que menos de tu hogar?",
    check_HL: "Tipo de vivienda (House/Apartment), Ubicación (Location), Mi dormitorio (My bedroom), Lo que más/menos me gusta (Likes/Dislikes), Tareas (Chores)."
  },
  { 
    title: "5. Mi barrio", 
    OL: "¿Cómo es tu barrio? ¿Hay tiendas o un parque?", 
    HL: "Háblame de tu barrio. ¿Hay problemas sociales? ¿Qué instalaciones hay para jóvenes?",
    check_HL: "Instalaciones (Facilities - shops/parks), Ventajas/Desventajas (Pros/Cons - noise/traffic), Opinión personal (Opinion)."
  },
  { 
    title: "6. Mi pueblo/ciudad", 
    OL: "¿Vives en el campo o en la ciudad? ¿Te gusta tu pueblo?", 
    HL: "Háblame de tu pueblo o ciudad. ¿Prefieres la vida urbana o la rural?",
    check_HL: "Ubicación (Location), Campo vs Ciudad (Rural vs Urban), Ventajas/Desventajas (Pros/Cons), Preferencia (Preference)."
  },
  { 
    title: "7. Mi colegio", 
    OL: "¿Cómo es tu colegio? ¿Es mixto? ¿Llevas uniforme?", 
    HL: "Háblame de tu instituto. ¿Qué opinas de las normas y del uniforme?",
    check_HL: "Tipo de colegio (Type - Mixed/Public), Instalaciones (Facilities), Uniforme (Description), Normas (Rules - strict/fair)."
  },
  { 
    title: "8. Mis asignaturas", 
    OL: "¿Qué asignaturas estudias? ¿Cuál es tu favorita?", 
    HL: "Háblame de tus asignaturas. ¿Crees que el sistema educativo prepara bien para la vida?",
    check_HL: "Lista de asignaturas (Subjects list), Favorita vs Difícil (Fav vs Hard), Opinión del sistema (Points system/Stress)."
  },
  { 
    title: "9. Rutina diaria", 
    OL: "¿A qué hora te levantas? ¿Qué haces después del colegio?", 
    HL: "Describe tu rutina diaria. ¿Te resulta difícil compaginar el estudio con tu tiempo libre?",
    check_HL: "Horarios (Times - wake up/sleep), Comidas (Meals), Transporte (Transport), Extraescolares (After-school activities), Estudio (Study time)."
  },
  { 
    title: "10. Pasatiempos", 
    OL: "¿Qué haces en tus ratos libres? ¿Te gusta el deporte?", 
    HL: "Háblame de tus aficiones. ¿Por qué es importante tener pasatiempos para la salud mental?",
    check_HL: "Deporte (Specific sport), Música/Cine (Music/Movies), Frecuencia (How often), Importancia (Importance for mental health)."
  },
  { 
    title: "11. Tareas domésticas", 
    OL: "¿Ayudas en casa? ¿Haces tu cama?", 
    HL: "Háblame de las tareas del hogar. ¿Crees que el reparto es justo en tu casa?",
    check_HL: "Tareas que hago (Tasks I do), Paga (Pocket money), Reparto justo/injusto (Fair/Unfair division)."
  },
  { 
    title: "12. Vacaciones", 
    OL: "¿Qué hiciste el verano pasado? ¿Has estado en España?", 
    HL: "Háblame de tus vacaciones. ¿Prefieres quedarte en Irlanda o viajar? ¿Por qué?",
    check_HL: "Pasado: Dónde fuiste (Past: Where you went), Alojamiento/Comida (Accommodation/Food), El tiempo (Weather), Preferencias (Travel vs Staycation)."
  },
  { 
    title: "13. Planes de Futuro", 
    OL: "¿Qué vas a hacer el año que viene? ¿Quieres ir a la universidad?", 
    HL: "Háblame de tus planes. ¿Qué carrera te gustaría estudiar y por qué?",
    check_HL: "Futuro/Condicional (Future/Conditional tense), Universidad/Carrera (College/Course), Año sabático/Viajes (Gap Year/Travel)."
  },
  { 
    title: "14. Fin de semana pasado", 
    OL: "¿Qué hiciste el fin de semana pasado? ¿Saliste?", 
    HL: "Háblame de lo que hiciste el fin de semana pasado. ¿Hiciste algo especial?",
    check_HL: "Uso del Pretérito (Past Tenses), Actividades sociales (Socializing), Estudio/Descanso (Study/Rest)."
  },
  { 
    title: "15. Próximo fin de semana", 
    OL: "¿Qué harás el próximo fin de semana?", 
    HL: "Háblame de tus planes para el próximo fin de semana.",
    check_HL: "Uso del Futuro (Future Tense), Planes específicos (Specific plans - friends/sport/study)."
  }
];

const PAST_Q = ["¿Qué hiciste el fin de semana pasado?", "¿Adónde fuiste el verano pasado?", "¿Qué hiciste ayer?"];
const FUT_Q = ["¿Qué harás mañana?", "¿Qué planes tienes para el verano?", "¿Qué harás tras el colegio?"];

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

// --- FUNCIÓN: MOSTRAR/OCULTAR PISTAS ---
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
    const t = rawHTML.replace(/<[^>]*>/g, " ").replace(/\(PASADO\)|\(FUTURO\)/g, "").replace(/HL|OL/g, "").replace(/[0-9]\./g, ""); 
    
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'es-ES'; 
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } 
}

// === LÓGICA DEL MOCK EXAM SECUENCIAL ===
function startMockExam() { 
    isMockExam = true; 
    mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    
    let i = [...Array(DATA.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA[i[0]][currentLevel],
        DATA[i[1]][currentLevel],
        DATA[i[2]][currentLevel],
        PAST_Q[Math.floor(Math.random()*3)] + " (PASADO)",
        FUT_Q[Math.floor(Math.random()*3)] + " (FUTURO)"
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Question ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
    
    // En Mock Exam NO mostramos pistas
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

    // LÓGICA DE PISTAS (SCAFFOLDING) BILINGÜE
    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    if (hintBox && btnHint) {
        hintBox.style.display = 'none'; // Siempre oculta al empezar
        
        // Solo mostramos el botón si es HL y hay pistas definidas
        if (currentLevel === 'HL' && currentTopic.check_HL) {
            btnHint.style.display = 'inline-block';
            // Texto de cabecera bilingüe en la caja
            hintBox.innerHTML = "<strong>📝 Puntos clave / Key Points (HL):</strong><br>" + currentTopic.check_HL;
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
  if(t.length < 5) return alert("Por favor, di algo más...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; 
  b.innerText = "⏳ Grading...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

  // Recogemos criterios HL si existen
  let criteria = "Gramática y vocabulario correctos."; 
  if (currentLevel === 'HL' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Sympathetic Leaving Cert Spanish Oral Examiner (Ireland).
    CONTEXT: The input is RAW VOICE TRANSCRIPTION. It has NO PUNCTUATION and NO CAPITALIZATION.
    
    QUESTION ASKED: "${questionContext}"
    STUDENT ANSWER: "${t}"
    
    CRITICAL INSTRUCTIONS:
    1. IGNORE completely the lack of punctuation.
    2. IGNORE run-on sentences. 
    3. CURRENT LEVEL: ${currentLevel}.
    4. CHECK CONTENT: The student MUST mention these points: [ ${criteria} ].
       - If Ordinary Level (OL): Be VERY GENEROUS.
       - If Higher Level (HL): Be stricter. If they miss points from the checklist, TELL THEM explicitly.
    
    OUTPUT JSON ONLY:
    {
      "score": (0-100 based on grammar AND content completeness),
      "feedback_es": "Feedback in Spanish. If they missed points from the checklist, mention what is missing.",
      "feedback_en": "Feedback in English explaining mistakes and missing content.",
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

    document.getElementById('fbES').innerHTML = "🇪🇸 " + j.feedback_es; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    
    const l = document.getElementById('errorsList'); 
    l.innerHTML = "";
    
    if(j.errors && j.errors.length > 0) {
        j.errors.forEach(e => { 
            l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`; 
        });
    } else {
        l.innerHTML = "<div style='color:#166534; font-weight:bold;'>✅ Perfect! No significant errors found.</div>";
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
    alert("⚠️ The AI is a bit busy right now (High Traffic).\nPlease wait 10 seconds and try again!\n\n(La IA está ocupada, espera 10 segundos)."); 
  } finally { 
    b.disabled = false; 
    b.innerText = "✨ Evaluate Answer"; 
  }
}

// ===========================================
// PARTE 2: ROLEPLAYS (AUDIOS MP3 ORIGINALES)
// ===========================================
let rpActual = null; 
let pasoActual = 0; 
let speaking = false;

// Base de Datos RP (Tus audios)
const RP_DB = {
    1: { context: "ERASMUS in Cáceres. You call for accommodation.", dialogs: ["¡Hola, dígame!", "¿En qué parte de la ciudad querrías vivir?", "Entiendo. ¿Por qué?", "Tienes razón. Pero sabes que Cáceres es muy pequeña y se puede andar desde las afueras a la Plaza Mayor en media hora.", ["¿Has estado antes en España?", "¿Qué te gusta de España?", "¿Por qué estudiar en España?"]], sugerencias: ["Voy a ir de Erasmus a la universidad durante el próximo curso académico. No conozco a nadie en Cáceres. ¿Podría darme algún consejo para encontrar alojamiento por favor?", "Preferiría vivir cerca de la universidad porque el año pasado viví en las afueras de Dublín y no me gustó.", "Pues es que pasaba demasiado tiempo viajando porque estaba muy lejos de todo. Si pudiera dedicar ese tiempo a estudiar, podría sacar buenas notas.", "Eso no está tan lejos y el clima es mucho mejor que en Irlanda así que tendré en cuenta todos los barrios aunque preferiría vivir en el centro de la ciudad.", "(Respuesta libre)"] },
    2: { context: "Broken laptop in Ávila. Repair shop.", dialogs: ["¡Hola! ¿En qué puedo ayudarte?", "Vamos a ver. ¿Qué te pasó?", "Vas a necesitar una pantalla nueva que cuesta 200 euros.", "Sí, hay una oferta especial esta semana. ¿Quieres comprarlo?", ["¿De qué marca es tu ordenador?","¿Para qué usas el ordenador?","¿De qué color te gustaría la funda?"]], sugerencias: ["Se me cayó el portátil y la pantalla está rota. Lo peor es que tengo que entregar un ensayo mañana y la única copia que tengo está en mi portátil.", "Llegaba tarde y tuve que correr para coger el autobús. Me resbalé y el portátil se cayó al suelo y me di cuenta del problema en cuanto me levanté.", "Es bueno saber que tiene arreglo pero he visto un portátil del mismo modelo y la misma marca a la venta en el escaparate y solo cuesta trescientos euros.", "Lo compraré si me copias los archivos y me das una funda gratis.", "(Respuesta libre)"] },
    3: { context: "Hiring a camper van. Family holiday.", dialogs: ["¡Hola! ¿En qué puedo ayudarte?", "Para alquilar un cámper hace falta tener al menos veinticinco años y mucha experiencia al volante.", "Pues, muy bien. Tu madre cumple con los requisitos para alquilar un cámper.", "¡Fenomenal! Os alquilo un cámper. ¿Tenéis el itinerario previsto?", ["¿A qué hora vendréis a recogerla?", "¿Qué música os gusta?", "¿Qué ciudades queréis visitar?"]], sugerencias: ["Soy estudiante y llamo desde Irlanda, me interesa alquilar un cámper durante dos semanas en julio.", "Mi madre va a conducir porque yo todavía no tengo el carné de conducir. Estoy yendo a clases de conducir y espero aprobar el examen en otoño.", "Ha conducido por la derecha en varios países europeos durante los últimos veinte años. Es una conductora muy prudente y nunca ha tenido un accidente.", "Hemos pasado mucho tiempo en la costa, pero este verano nos gustaría viajar por Castilla-La Mancha para ver la tierra de Cervantes y Don Quijote, lejos de los turistas.", "(Respuesta libre)"] },
    4: { context: "Discussion: Single-use plastics.", dialogs: ["Pareces muy contento, ¿por qué?", "¿Es importante prohibir plásticos de usar y tirar?", "¿Podemos hacer algo más?", "Y, ¿ya está?", ["¿Qué reciclas en casa?", "¿Qué haces tú por el planeta?", "¿Cómo vienes al instituto?"]], sugerencias: ["El Parlamento Europeo ha convenido prohibir los plásticos de un solo uso, por ejemplo, los cuchillos, los tenedores, las cucharas, las tazas, los platos y las pajitas.", "Sí, es absolutamente imprescindible. Será muy bueno para las aguas del planeta. La contaminación causada por los plásticos es un problema grave en ríos, lagos y océanos.", "Hay muchas cosas que podemos hacer. por ejemplo, en vez de usar plásticos, podemos usar papel reciclado, cartón y otros materiales biodegradables.", "No, como ciudadanos necesitamos ser más responsables y cambiar nuestro estilo de vida. Para proteger el medio ambiente podríamos ir en bicicleta, usar el transporte público o caminar más a menudo.", "(Respuesta libre)"] },
    5: { context: "Car breakdown on AP-6.", dialogs: ["Hola, buenas tardes.", "Debes estar entre Medina del Campo y Tordesillas. ¿Hay alguna señal de tráfico por ahí?", "Claro que sí. Voy a arreglarlo todo inmediatamente.", "Por supuesto. ¿Me puedes describir tu coche?", ["¿Viajas solo o acompañado?", "¿Qué ciudades quieres visitar?", "¿Cuánto costó el coche?"]], sugerencias: ["Mi coche se ha averiado en la AP-6. No sé donde estoy pero pasé el peaje hace media hora.", "Veo a lo lejos la señal de salida 156. ¿Pueden enviar un mecánico o quizás una grúa? Es que creo que el problema es serio", "¿Podrían darme un coche de sustitución para que pueda seguir mi viaje a Lugo. Tengo que recoger a mis padres en el aeropuerto de Santiago de Compostela.?", "Es un Seat Ibiza rojo, matrícula 4620 CFK. Se lo compré de segunda mano a mi tía y nunca antes he tenido un problema con él.", "(Respuesta libre)"] }
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

function reproducirAudio(path, fallbackText) {
    const audio = new Audio(path);
    audio.onerror = () => {
        console.log("Audio no encontrado, usando TTS de reserva: " + path);
        const u = new SpeechSynthesisUtterance(fallbackText);
        u.lang = 'es-ES';
        u.onend = habilitarInput;
        window.speechSynthesis.speak(u);
    };
    audio.onended = habilitarInput;
    audio.play().catch(e => { console.log("Error play:", e); audio.onerror(); });
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
        document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed! Well done.</div>`;
        return;
    }

    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    let audioFile = "";

    if (Array.isArray(dialogText)) {
        const randomIndex = Math.floor(Math.random() * dialogText.length);
        dialogText = dialogText[randomIndex];
        const letter = ['a','b','c'][randomIndex]; 
        audioFile = `rp${rpActual}_5${letter}.mp3`;
    } else {
        audioFile = `rp${rpActual}_${pasoActual + 1}.mp3`;
    }

    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`;
    chat.scrollTop = chat.scrollHeight;
    reproducirAudio(audioFile, dialogText);
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

// Función para leer lo que escribo (ESPAÑOL)
function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; 
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

// Inicialización
initConv();
