// ===========================================
// CONFIGURACIÓN Y CLAVES (API KEY)
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// --- NAVEGACIÓN DE PESTAÑAS (Conversation vs Roleplay) ---
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: CONVERSATION (ESTADO Y DATOS)
// ===========================================
let currentLevel = 'OL';
let currentMode = 'exam'; 
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// ===========================================
// BASE DE DATOS (DATA) - COMPLETA (1-15)
// ===========================================
const DATA = [
  // --- TEMA 1 ---
  { 
    title: "1. Yo mismo", 
    OL: "¿Cómo te llamas? ¿Cuándo es tu cumpleaños? ¿Puedes describirte físicamente?", 
    HL: "Háblame de ti. Describe tu personalidad y tu físico con detalle.",
    check_HL: "Nombre, Edad, Cumpleaños, Celebración típica, Físico detallado, Personalidad, Conectores.",
    checkpoints_OL: ["Datos Básicos (Nombre, Edad...)", "El Cumpleaños (Fechas)", "Descripción Física (Verbos)"],
    checkpoints_HL: ["Personalidad (Adjetivos)", "Ser (Rasgo) vs Estar (Estado)", "Conectores (Sin embargo...)"],
    checkpoints_TOP: ["✨ Idiom: Tener don de gentes", "✨ Structure: Soler + Infinitivo (Habits)", "✨ Vocab: Virtudes y Defectos"]
  },
  // --- TEMA 2 ---
  { 
    title: "2. Mi familia", 
    OL: "¿Cuántas personas hay en tu familia? ¿Tienes hermanos?", 
    HL: "Háblame de tu familia. ¿Cómo son tus padres y hermanos? ¿Te llevas bien con ellos?",
    check_HL: "Cuántos sois, Profesiones (Mi padre es...), Descripción física/carácter, Verbos de relación (Me llevo bien/mal, Discutimos, Me apoya).",
    checkpoints_OL: ["Cuántos somos (Hay... / Somos...)", "Tengo hermanos (Mayor/Menor)", "Profesión padres (Mi madre es...)"],
    checkpoints_HL: ["Llevarse bien/mal (Me llevo...)", "Discutir (Discuto con...)", "Descripción Carácter (Es trabajador...)"],
    checkpoints_TOP: ["✨ Idiom: Ser la oveja negra", "✨ Idiom: Ser uña y carne", "✨ Grammar: Ojalá tuviera... (Wish)"]
  },
  // --- TEMA 3 ---
  { 
    title: "3. Mis amigos", 
    OL: "¿Tienes muchos amigos? ¿Cómo se llama tu mejor amigo?", 
    HL: "Háblame de tu mejor amigo. ¿Tenéis los mismos intereses? ¿Por qué es especial?",
    check_HL: "Nombre, Descripción, Gustos en común (Nos gusta + Infinitivo), Por qué es buen amigo (Es leal, me escucha).",
    checkpoints_OL: ["Mi mejor amigo (Se llama...)", "Descripción física (Es alto...)", "Qué hacemos (Jugamos...)"],
    checkpoints_HL: ["Por qué es mi amigo (Es leal...)", "Gustos en común (Nos gusta...)", "Desde cuándo (Lo conozco desde...)"],
    checkpoints_TOP: ["✨ Idiom: Contar con alguien", "✨ Grammar: Condicional (Hablaría...)", "✨ Vocab: Inseparables"]
  },
  // --- TEMA 4 ---
  { 
    title: "4. Mi casa", 
    OL: "¿Vives en una casa o en un piso? ¿Cómo es tu dormitorio?", 
    HL: "Describe tu casa ideal. ¿Qué es lo que más te gusta y lo que menos de tu hogar?",
    check_HL: "Tipo de vivienda, Ubicación, Mi dormitorio (Hay + muebles), Opinión (Lo que más me gusta es...), Tareas (Tengo que + infinitivo).",
    checkpoints_OL: ["Dónde vivo (Vivo en...)", "Mi dormitorio (Tengo...)", "Opinión (Me gusta mi casa...)"],
    checkpoints_HL: ["Mi rincón favorito (Lo que más...)", "Tareas domésticas (Tengo que...)", "Ubicación (Está cerca de...)"],
    checkpoints_TOP: ["✨ Idiom: Sentirse como en casa", "✨ Grammar: Si ganara la lotería...", "✨ Vocab: Chalet adosado"]
  },
  // --- TEMAS 5 al 15 ---
  { 
    title: "5. Mi barrio", 
    OL: "¿Cómo es tu barrio? ¿Hay tiendas o un parque?", 
    HL: "Háblame de tu barrio. ¿Hay problemas sociales? ¿Qué instalaciones hay para jóvenes?",
    check_HL: "Instalaciones (Hay...), Lo bueno/malo (Lo mejor es...), Problemas (Hay mucho ruido/tráfico), Opinión personal."
  },
  { 
    title: "6. Mi pueblo/ciudad", 
    OL: "¿Vives en el campo o en la ciudad? ¿Te gusta tu pueblo?", 
    HL: "Háblame de tu pueblo o ciudad. ¿Prefieres la vida urbana o la rural?",
    check_HL: "Ubicación, Comparativos (Más tranquilo que...), Ventajas/Desventajas, Preferencia (Prefiero vivir en... porque...)."
  },
  { 
    title: "7. Mi colegio", 
    OL: "¿Cómo es tu colegio? ¿Es mixto? ¿Llevas uniforme?", 
    HL: "Háblame de tu instituto. ¿Qué opinas de las normas y del uniforme?",
    check_HL: "Tipo (Mixto/Público), Instalaciones (Hay un gimnasio...), Uniforme (Llevo...), Opinión (Es cómodo/anticuado), Normas (Se debe/No se permite)."
  },
  { 
    title: "8. Mis asignaturas", 
    OL: "¿Qué asignaturas estudias? ¿Cuál es tu favorita?", 
    HL: "Háblame de tus asignaturas. ¿Crees que el sistema educativo prepara bien para la vida?",
    check_HL: "Asignaturas, Favorita (Me encanta porque es...), Difícil (Me cuesta...), Opinión Sistema (Mucho estrés, Puntos)."
  },
  { 
    title: "9. Rutina diaria", 
    OL: "¿A qué hora te levantas? ¿Qué haces después del colegio?", 
    HL: "Describe tu rutina diaria. ¿Te resulta difícil compaginar el estudio con tu tiempo libre?",
    check_HL: "Verbos Reflexivos (Me levanto, Me ducho...), Horarios (A las ocho...), Conectores (Primero, Luego, Después), Estudio vs Tiempo libre."
  },
  { 
    title: "10. Pasatiempos", 
    OL: "¿Qué haces en tus ratos libres? ¿Te gusta el deporte?", 
    HL: "Háblame de tus aficiones. ¿Por qué es importante tener pasatiempos para la salud mental?",
    check_HL: "Deporte (Juego al...), Frecuencia (Dos veces a la semana), Importancia (Para desconectar, Para estar en forma)."
  },
  { 
    title: "11. Tareas domésticas", 
    OL: "¿Ayudas en casa? ¿Haces tu cama?", 
    HL: "Háblame de las tareas del hogar. ¿Crees que el reparto es justo en tu casa?",
    check_HL: "Tareas (Pongo la mesa, Paso la aspiradora), Frecuencia (A veces, Siempre), Opinión (Es justo/injusto, Todos ayudamos)."
  },
  { 
    title: "12. Vacaciones", 
    OL: "¿Qué hiciste el verano pasado? ¿Has estado en España?", 
    HL: "Háblame de tus vacaciones. ¿Prefieres quedarte en Irlanda o viajar? ¿Por qué?",
    check_HL: "Pretérito Indefinido (Fui, Visité, Comí), Imperfecto (Hacía sol, Era bonito), Alojamiento, Opinión."
  },
  { 
    title: "13. Planes de Futuro", 
    OL: "¿Qué vas a hacer el año que viene? ¿Quieres ir a la universidad?", 
    HL: "Háblame de tus planes. ¿Qué carrera te gustaría estudiar y por qué?",
    check_HL: "Futuro Simple (Estudiaré, Viajaré) O 'Ir a + Infinitivo', Condicional (Me gustaría ser...), Universidad/Carrera, Por qué (Porque me interesa...)."
  },
  { 
    title: "14. Fin de semana pasado", 
    OL: "¿Qué hiciste el fin de semana pasado? ¿Saliste?", 
    HL: "Háblame de lo que hiciste el fin de semana pasado. ¿Hiciste algo especial?",
    check_HL: "Pretérito Indefinido (Fui al cine, Estudié, Salí con amigos), Imperfecto (Estaba cansado), Conectores temporales (El sábado por la tarde...)."
  },
  { 
    title: "15. Próximo fin de semana", 
    OL: "¿Qué harás el próximo fin de semana?", 
    HL: "Háblame de tus planes para el próximo fin de semana.",
    check_HL: "Perífrasis 'Ir a + Infinitivo' (Voy a estudiar, Voy a ir...), Futuro Simple (Jugaré un partido), Planes concretos."
  }
];

const PAST_Q = ["¿Qué hiciste el fin de semana pasado?", "¿Adónde fuiste el verano pasado?", "¿Qué hiciste ayer?"];
const FUT_Q = ["¿Qué harás mañana?", "¿Qué planes tienes para el verano?", "¿Qué harás tras el colegio?"];

// ===========================================
// LÓGICA DE CONTROL (NIVEL Y MODO)
// ===========================================

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'OL' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'HL' ? 'level-btn hl active' : 'level-btn'; 
    
    // INTELIGENCIA: Refrescar la pantalla correcta según el modo
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
// FUNCIONES DE LA APP
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
                const titleEl = document.querySelector('#studyContainer h3');
                if(titleEl) titleEl.innerText = "📚 Study Mode: " + item.title;
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
    
    const btnHint = document.getElementById('btnHint');
    const hintBox = document.getElementById('hintBox');
    if(btnHint) btnHint.style.display = 'none';
    if(hintBox) hintBox.style.display = 'none';
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
  b.disabled = true; b.innerText = "⏳ Grading...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  let criteria = "Gramática y vocabulario correctos."; 
  if (currentLevel === 'HL' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Sympathetic Leaving Cert Spanish Oral Examiner (Ireland).
    CONTEXT: RAW VOICE TRANSCRIPTION (NO PUNCTUATION).
    QUESTION: "${questionContext}"
    ANSWER: "${t}"
    LEVEL: ${currentLevel}.
    CHECKPOINTS: [ ${criteria} ].
    INSTRUCTIONS: Ignore punctuation errors.
    OUTPUT JSON: { "score": 0-100, "feedback_es": "...", "feedback_en": "...", "errors": [{ "original": "...", "correction": "...", "explanation_en": "..." }] }
  `;

  try {
    // AQUÍ TAMBIÉN CAMBIAMOS EL MODELO A 1.5-FLASH
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    
    const l = document.getElementById('errorsList'); l.innerHTML = "";
    if(j.errors && j.errors.length > 0) {
        j.errors.forEach(e => { l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`; });
    } else {
        l.innerHTML = "<div style='color:#166534; font-weight:bold;'>✅ Perfect! No significant errors found.</div>";
    }

    const btnReset = document.getElementById('btnReset');
    if (isMockExam) {
        if (mockIndex < 4) {
            btnReset.innerText = "➡️ Next Question"; btnReset.onclick = nextMockQuestion; 
        } else {
            btnReset.innerText = "🏁 Finish Exam"; btnReset.onclick = resetApp; 
        }
    } else {
        btnReset.innerText = "🔄 Try another topic"; btnReset.onclick = resetApp; 
    }

  } catch (e) { 
    console.error(e); 
    alert("⚠️ AI Busy (or Rate Limit). Wait 30s."); 
  } finally { 
    b.disabled = false; b.innerText = "✨ Evaluate Answer"; 
  }
}

// ===========================================
// PARTE 2: ROLEPLAYS (COMPLETOS Y ORIGINALES)
// ===========================================
let rpActual = null; let pasoActual = 0; 

// Base de Datos RP
const RP_DB = {
    1: { context: "ERASMUS in Cáceres. You call for accommodation.", dialogs: ["¡Hola, dígame!", "¿En qué parte de la ciudad querrías vivir?", "Entiendo. ¿Por qué?", "Tienes razón. Pero sabes que Cáceres es muy pequeña y se puede andar desde las afueras a la Plaza Mayor en media hora.", ["¿Has estado antes en España?", "¿Qué te gusta de España?", "¿Por qué estudiar en España?"]], sugerencias: ["Voy a ir de Erasmus a la universidad durante el próximo curso académico. No conozco a nadie en Cáceres. ¿Podría darme algún consejo para encontrar alojamiento por favor?", "Preferiría vivir cerca de la universidad porque el año pasado viví en las afueras de Dublín y no me gustó.", "Pues es que pasaba demasiado tiempo viajando porque estaba muy lejos de todo. Si pudiera dedicar ese tiempo a estudiar, podría sacar buenas notas.", "Eso no está tan lejos y el clima es mucho mejor que en Irlanda así que tendré en cuenta todos los barrios aunque preferiría vivir en el centro de la ciudad.", "(Respuesta libre)"] },
    2: { context: "Broken laptop in Ávila. Repair shop.", dialogs: ["¡Hola! ¿En qué puedo ayudarte?", "Vamos a ver. ¿Qué te pasó?", "Vas a necesitar una pantalla nueva que cuesta 200 euros.", "Sí, hay una oferta especial esta semana. ¿Quieres comprarlo?", ["¿De qué marca es tu ordenador?","¿Para qué usas el ordenador?","¿De qué color te gustaría la funda?"]], sugerencias: ["Se me cayó el portátil y la pantalla está rota. Lo peor es que tengo que entregar un ensayo mañana y la única copia que tengo está en mi portátil.", "Llegaba tarde y tuve que correr para coger el autobús. Me resbalé y el portátil se cayó al suelo y me di cuenta del problema en cuanto me levanté.", "Es bueno saber que tiene arreglo pero he visto un portátil del mismo modelo y la misma marca a la venta en el escaparate y solo cuesta trescientos euros.", "Lo compraré si me copias los archivos y me das una funda gratis.", "(Respuesta libre)"] },
    3: { context: "Hiring a camper van. Family holiday.", dialogs: ["¡Hola! ¿En qué puedo ayudarte?", "Para alquilar un cámper hace falta tener al menos veinticinco años y mucha experiencia al volante.", "Pues, muy bien. Tu madre cumple con los requisitos para alquilar un cámper.", "¡Fenomenal! Os alquilo un cámper. ¿Tenéis el itinerario previsto?", ["¿A qué hora vendréis a recogerla?", "¿Qué música os gusta?", "¿Qué ciudades queréis visitar?"]], sugerencias: ["Soy estudiante y llamo desde Irlanda, me interesa alquilar un cámper durante dos semanas en julio.", "Mi madre va a conducir porque yo todavía no tengo el carné de conducir. Estoy yendo a clases de conducir y espero aprobar el examen en otoño.", "Ha conducido por la derecha en varios países europeos durante los últimos veinte años. Es una conductora muy prudente y nunca ha tenido un accidente.", "Hemos pasado mucho tiempo en la costa, pero este verano nos gustaría viajar por Castilla-La Mancha para ver la tierra de Cervantes y Don Quijote, lejos de los turistas.", "(Respuesta libre)"] },
    4: { context: "Discussion: Single-use plastics.", dialogs: ["Pareces muy contento, ¿por qué?", "¿Es importante prohibir plásticos de usar y tirar?", "¿Podemos hacer algo más?", "Y, ¿ya está?", ["¿Qué reciclas en casa?", "¿Qué haces tú por el planeta?", "¿Cómo vienes al instituto?"]], sugerencias: ["El Parlamento Europeo ha convenido prohibir los plásticos de un solo uso, por ejemplo, los cuchillos, los tenedores, las cucharas, las tazas, los platos y las pajitas.", "Sí, es absolutamente imprescindible. Será muy bueno para las aguas del planeta. La contaminación causada por los plásticos es un problema grave en ríos, lagos y océanos.", "Hay muchas cosas que podemos hacer. por ejemplo, en vez de usar plásticos, podemos usar papel reciclado, cartón y otros materiales biodegradables.", "No, como ciudadanos necesitamos ser más responsables y cambiar nuestro estilo de vida. Para proteger el medio ambiente podríamos ir en bicicleta, usar el transporte público o caminar más a menudo.", "(Respuesta libre)"] },
    5: { context: "Car breakdown on AP-6.", dialogs: ["Hola, buenas tardes.", "Debes estar entre Medina del Campo y Tordesillas. ¿Hay alguna señal de tráfico por ahí?", "Claro que sí. Voy a arreglarlo todo inmediatamente.", "Por supuesto. ¿Me puedes describir tu coche?", ["¿Viajas solo o acompañado?", "¿Qué ciudades quieres visitar?", "¿Cuánto costó el coche?"]], sugerencias: ["Mi coche se ha averiado en la AP-6. No sé donde estoy pero pasé el peaje hace media hora.", "Veo a lo lejos la señal de salida 156. ¿Pueden enviar un mecánico o quizás una grúa? Es que creo que el problema es serio", "¿Podrían darme un coche de sustitución para que pueda seguir mi viaje a Lugo. Tengo que recoger a mis padres en el aeropuerto de Santiago de Compostela.?", "Es un Seat Ibiza rojo, matrícula 4620 CFK. Se lo compré de segunda mano a mi tía y nunca antes he tenido un problema con él.", "(Respuesta libre)"] }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; 
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DB[id].context;
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Examiner" to begin.</div>`;
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block"; nextBtn.innerText = "▶️ Start Examiner"; nextBtn.onclick = reproducirSiguienteAudio;
    document.getElementById('rpInput').disabled = true; document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

function reproducirSiguienteAudio() {
    document.getElementById('nextAudioBtn').style.display = "none";
    if (pasoActual >= 5) {
        document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed!</div>`;
        return;
    }
    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    let audioFile = "";
    if (Array.isArray(dialogText)) {
        const randomIndex = Math.floor(Math.random() * dialogText.length);
        dialogText = dialogText[randomIndex];
        audioFile = `rp${rpActual}_5${['a','b','c'][randomIndex]}.mp3`;
    } else { audioFile = `rp${rpActual}_${pasoActual + 1}.mp3`; }

    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`; chat.scrollTop = chat.scrollHeight;
    const audio = new Audio(audioFile);
    audio.onerror = () => { const u = new SpeechSynthesisUtterance(dialogText); u.lang = 'es-ES'; u.onend = habilitarInput; window.speechSynthesis.speak(u); };
    audio.onended = habilitarInput; audio.play().catch(e => { audio.onerror(); });
}

function habilitarInput() {
    if(pasoActual < 5) { 
        document.getElementById('rpInput').disabled = false; document.getElementById('rpSendBtn').disabled = false;
        document.getElementById('rpInput').focus(); document.getElementById('hintBtn').style.display = "block";
        document.getElementById('rpInput').placeholder = "Type your reply...";
    }
}

function enviarRespuestaRP() {
    const inp = document.getElementById('rpInput'); const txt = inp.value.trim(); if(!txt) return;
    const chat = document.getElementById('rpChat'); chat.innerHTML += `<div class="bubble st">${txt}</div>`; chat.scrollTop = chat.scrollHeight;
    inp.value = ""; inp.disabled = true; document.getElementById('rpSendBtn').disabled = true; document.getElementById('hintBtn').style.display = "none";
    pasoActual++;
    setTimeout(() => { 
        if(pasoActual < 5) { 
            const nextBtn = document.getElementById('nextAudioBtn');
            nextBtn.style.display = "block"; nextBtn.innerText = "🔊 Listen to Examiner"; nextBtn.onclick = reproducirSiguienteAudio;
        } else { document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`; }
    }, 500);
}

function mostrarSugerencia() {
    const sug = RP_DB[rpActual].sugerencias[pasoActual];
    if(sug) {
        const chat = document.getElementById('rpChat');
        chat.innerHTML += `<div class="feedback-rp">💡 <b>Model Answer:</b> ${sug}</div>`; chat.scrollTop = chat.scrollHeight;
    }
}

function readMyInput() {
    const text = document.getElementById("userInput").value; if (!text) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'es-ES'; utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

// ===========================================
// PARTE 3: MODO FORMACIÓN (STUDY MODE AI)
// ===========================================

function initStudyHTML() {
    const div = document.createElement('div');
    div.id = 'studyContainer';
    div.className = 'study-box';
    div.style.display = 'none';
    
    div.innerHTML = `
        <h3>📚 Study Mode: ${currentTopic ? currentTopic.title : 'Select a topic'}</h3>
        <p class="small-text">Click on a concept to get an instant explanation.</p>
        <div id="checkpointsList"></div> 
        <div id="aiExplanationBox" class="ai-box" style="display:none;"></div>
    `;
    const parent = document.getElementById('exerciseArea');
    parent.parentNode.insertBefore(div, parent);
}

function renderCheckpoints() {
    const list = document.getElementById('checkpointsList');
    list.innerHTML = "";
    
    if (!currentTopic) {
        list.innerHTML = "<p style='text-align:center; padding:20px; color:#64748b; font-weight:bold;'>👈 Please select a topic from the grid above to start studying.</p>";
        return;
    }
    
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

    createSection("🧱 Cimientos (Lo Básico)", currentTopic.checkpoints_OL, "btn-ol");
    if (currentLevel === 'HL') {
        createSection("🔧 Nivel Superior (HL Requisitos)", currentTopic.checkpoints_HL, "btn-hl");
        if(currentTopic.checkpoints_TOP) {
            createSection("🚀 Nivel TOP (Frases H1)", currentTopic.checkpoints_TOP, "btn-top");
        }
    }
}

async function askAIConcept(concept) {
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; 
    box.innerHTML = "⏳ <b>Consulting AI Teacher...</b>";

    const isSerEstar = concept.includes("Ser") || concept.includes("Estar");
    let instruction = "";
    if (isSerEstar) {
        instruction = "Note: Define 'Ser' as Identity/Essence/Characteristics and 'Estar' as State/Condition. Avoid using 'permanent/temporary'.";
    }

    const prompt = `
        ACT AS: Spanish Teacher for Leaving Cert.
        TOPIC: "${currentTopic ? currentTopic.title : 'General'}".
        CONCEPT: "${concept}".
        INSTRUCTIONS: Explain in English (max 50 words). 2 Examples (ES->EN).
        ${instruction}
        OUTPUT HTML: <p><b>Explanation:</b> ...</p><ul><li>...</li></ul>
    `;

    try {
        // CAMBIO CRÍTICO: Usamos gemini-1.5-flash
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!r.ok) {
            const err = await r.json();
            throw new Error(err.error?.message || r.statusText);
        }

        const d = await r.json();
        const text = d.candidates[0].content.parts[0].text.replace(/```html|```/g, "").trim();
        
        box.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>💡 Concept: ${concept}</strong>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="background:none;border:none;cursor:pointer;">✖️</button>
            </div>
            <hr>
            ${text}
        `;

    } catch (e) {
        console.error(e);
        box.innerHTML = `<div style="color:red; font-weight:bold;">⚠️ Error: ${e.message}</div>`;
    }
}

// Inicialización
initConv();
