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

// ===========================================
// INTERFAZ Y NAVEGACIÓN
// ===========================================
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
}

let currentLevel = 'OL';
let currentMode = 'exam'; 
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// ===========================================
// BASE DE DATOS (DATA) - TEMAS 1-15
// ===========================================
const DATA = [
  { 
    title: "1. Yo mismo", 
    OL: "¿Cómo te llamas? ¿Cuándo es tu cumpleaños? ¿Puedes describirte físicamente?", 
    HL: "Háblame de ti. Describe tu personalidad y tu físico con detalle.",
    check_HL: "Nombre, Edad, Cumpleaños, Celebración típica, Físico detallado, Personalidad, Conectores.",
    checkpoints_OL: ["Datos Básicos (Nombre, Edad...)", "El Cumpleaños (Fechas)", "Descripción Física (Verbos)"],
    checkpoints_HL: ["Personalidad (Adjetivos)", "Ser (Rasgo) vs Estar (Estado)", "Conectores (Sin embargo...)"],
    checkpoints_TOP: ["✨ Idiom: Tener don de gentes", "✨ Structure: Soler + Infinitivo", "✨ Vocab: Virtudes y Defectos"]
  },
  { 
    title: "2. Mi familia", 
    OL: "¿Cuántas personas hay en tu familia? ¿Tienes hermanos?", 
    HL: "Háblame de tu familia. ¿Cómo son tus padres y hermanos? ¿Te llevas bien con ellos?",
    check_HL: "Cuántos sois, Profesiones, Descripción física/carácter, Verbos de relación (Me llevo bien/mal).",
    checkpoints_OL: ["Cuántos somos (Hay... / Somos...)", "Tengo hermanos (Mayor/Menor)", "Profesión padres (Mi madre es...)"],
    checkpoints_HL: ["Llevarse bien/mal (Me llevo...)", "Discutir (Discuto con...)", "Descripción Carácter (Es trabajador...)"],
    checkpoints_TOP: ["✨ Idiom: Ser la oveja negra", "✨ Idiom: Ser uña y carne", "✨ Grammar: Ojalá tuviera... (Wish)"]
  },
  { 
    title: "3. Mis amigos", 
    OL: "¿Tienes muchos amigos? ¿Cómo se llama tu mejor amigo?", 
    HL: "Háblame de tu mejor amigo. ¿Tenéis los mismos intereses? ¿Por qué es especial?",
    check_HL: "Nombre, Descripción, Gustos en común (Nos gusta + Infinitivo), Por qué es buen amigo (Es leal, me escucha).",
    checkpoints_OL: ["Mi mejor amigo (Se llama...)", "Descripción física (Es alto...)", "Qué hacemos (Jugamos...)"],
    checkpoints_HL: ["Por qué es mi amigo (Es leal...)", "Gustos en común (Nos gusta...)", "Desde cuándo (Lo conozco desde...)"],
    checkpoints_TOP: ["✨ Idiom: Contar con alguien", "✨ Grammar: Condicional (Hablaría...)", "✨ Vocab: Inseparables"]
  },
  { 
    title: "4. Mi casa", 
    OL: "¿Vives en una casa o en un piso? ¿Cómo es tu dormitorio?", 
    HL: "Describe tu casa ideal. ¿Qué es lo que más te gusta y lo que menos de tu hogar?",
    check_HL: "Tipo de vivienda, Ubicación, Mi dormitorio (Hay + muebles), Opinión, Tareas.",
    checkpoints_OL: ["Dónde vivo (Vivo en...)", "Mi dormitorio (Tengo...)", "Opinión (Me gusta mi casa...)"],
    checkpoints_HL: ["Mi rincón favorito (Lo que más...)", "Tareas domésticas (Tengo que...)", "Ubicación (Está cerca de...)"],
    checkpoints_TOP: ["✨ Idiom: Sentirse como en casa", "✨ Grammar: Si ganara la lotería...", "✨ Vocab: Chalet adosado"]
  },
  { 
    title: "5. Mi barrio", 
    OL: "¿Cómo es tu barrio? ¿Hay tiendas o un parque?", 
    HL: "Háblame de tu barrio. ¿Hay problemas sociales? ¿Qué instalaciones hay para jóvenes?",
    check_HL: "Instalaciones (Hay...), Lo bueno/malo, Problemas (Ruido/tráfico), Opinión personal.",
    checkpoints_OL: ["Instalaciones (Hay un parque...)", "Adjetivos (Es tranquilo/ruidoso)", "Tiendas (La farmacia, el super...)"],
    checkpoints_HL: ["Problemas sociales (Botellón...)", "Ventajas y Desventajas", "Transporte público"],
    checkpoints_TOP: ["✨ Idiom: Es un barrio de mala muerte", "✨ Grammar: Ojalá hubiera...", "✨ Vocab: Zonas verdes"]
  },
  { 
    title: "6. Mi pueblo/ciudad", 
    OL: "¿Vives en el campo o en la ciudad? ¿Te gusta tu pueblo?", 
    HL: "Háblame de tu pueblo o ciudad. ¿Prefieres la vida urbana o la rural?",
    check_HL: "Ubicación, Comparativos (Más tranquilo que...), Ventajas/Desventajas, Preferencia.",
    checkpoints_OL: ["Ubicación (Está en el norte...)", "Tamaño (Es pequeño/grande)", "Lugares de interés"],
    checkpoints_HL: ["Vida urbana vs Rural", "Contaminación y Tráfico", "Comparativos (Más... que)"],
    checkpoints_TOP: ["✨ Idiom: Echar de menos (Miss)", "✨ Grammar: Si pudiera elegir...", "✨ Vocab: Calidad de vida"]
  },
  { 
    title: "7. Mi colegio", 
    OL: "¿Cómo es tu colegio? ¿Es mixto? ¿Llevas uniforme?", 
    HL: "Háblame de tu instituto. ¿Qué opinas de las normas y del uniforme?",
    check_HL: "Tipo (Mixto/Público), Instalaciones, Uniforme, Opinión, Normas.",
    checkpoints_OL: ["Descripción (Es mixto...)", "El Uniforme (Llevo...)", "Instalaciones (Cantina, lab...)"],
    checkpoints_HL: ["Las Normas (Está prohibido...)", "Opinión del Uniforme", "Profesores y Alumnos"],
    checkpoints_TOP: ["✨ Idiom: Hincar los codos", "✨ Grammar: Si yo fuera director...", "✨ Vocab: Acoso escolar (Bullying)"]
  },
  { 
    title: "8. Mis asignaturas", 
    OL: "¿Qué asignaturas estudias? ¿Cuál es tu favorita?", 
    HL: "Háblame de tus asignaturas. ¿Crees que el sistema educativo prepara bien para la vida?",
    check_HL: "Asignaturas, Favorita, Difícil, Opinión Sistema (Estrés, Puntos).",
    checkpoints_OL: ["Lista de asignaturas", "Asignatura favorita (Me gusta...)", "Asignatura difícil (Odio...)"],
    checkpoints_HL: ["Presión de los exámenes", "El sistema de puntos (CAO)", "Utilidad para el futuro"],
    checkpoints_TOP: ["✨ Idiom: Ser un empollón", "✨ Grammar: Se me da bien/mal", "✨ Vocab: Aprobar / Suspender"]
  },
  { 
    title: "9. Rutina diaria", 
    OL: "¿A qué hora te levantas? ¿Qué haces después del colegio?", 
    HL: "Describe tu rutina diaria. ¿Te resulta difícil compaginar el estudio con tu tiempo libre?",
    check_HL: "Verbos Reflexivos (Me levanto...), Horarios, Conectores, Estudio vs Tiempo libre.",
    checkpoints_OL: ["Verbos Reflexivos (Me levanto)", "Las horas (A las siete...)", "Comidas (Desayuno, Ceno)"],
    checkpoints_HL: ["Equilibrio estudio/vida", "El estrés diario", "Diferencia con el fin de semana"],
    checkpoints_TOP: ["✨ Idiom: Pegársele a uno las sábanas", "✨ Idiom: No dar abasto", "✨ Grammar: Antes de + Infinitivo"]
  },
  { 
    title: "10. Pasatiempos", 
    OL: "¿Qué haces en tus ratos libres? ¿Te gusta el deporte?", 
    HL: "Háblame de tus aficiones. ¿Por qué es importante tener pasatiempos para la salud mental?",
    check_HL: "Deporte (Juego al...), Frecuencia, Importancia (Desconectar, Estar en forma).",
    checkpoints_OL: ["Deportes (Juego al fútbol...)", "Instrumentos (Toco el piano...)", "Frecuencia (A veces/Nunca)"],
    checkpoints_HL: ["Beneficios mentales (Desconectar)", "Deporte individual vs Equipo", "Influencia de la tecnología"],
    checkpoints_TOP: ["✨ Idiom: Matar el tiempo", "✨ Vocab: Sedentarismo", "✨ Grammar: Llevo X años jugando..."]
  },
  { 
    title: "11. Tareas domésticas", 
    OL: "¿Ayudas en casa? ¿Haces tu cama?", 
    HL: "Háblame de las tareas del hogar. ¿Crees que el reparto es justo en tu casa?",
    check_HL: "Tareas (Pongo la mesa...), Frecuencia, Opinión (Justo/injusto).",
    checkpoints_OL: ["Acciones (Lavar, planchar...)", "Mi responsabilidad", "Frecuencia"],
    checkpoints_HL: ["Igualdad de género en casa", "La paga (Pocket money)", "Conflictos por las tareas"],
    checkpoints_TOP: ["✨ Idiom: Arrimar el hombro", "✨ Idiom: Es pan comido", "✨ Vocab: Reparto equitativo"]
  },
  { 
    title: "12. Vacaciones", 
    OL: "¿Qué hiciste el verano pasado? ¿Has estado en España?", 
    HL: "Háblame de tus vacaciones. ¿Prefieres quedarte en Irlanda o viajar? ¿Por qué?",
    check_HL: "Pretérito Indefinido (Fui, Visité...), Imperfecto (Hacía sol...), Alojamiento, Opinión.",
    checkpoints_OL: ["Destino (Fui a España...)", "Actividades (Nadé, tomé el sol)", "Transporte (En avión)"],
    checkpoints_HL: ["Turismo de sol y playa vs Cultural", "Experiencias gastronómicas", "Clima (Hacía calor...)"],
    checkpoints_TOP: ["✨ Idiom: Costar un ojo de la cara", "✨ Idiom: Recargar las pilas", "✨ Grammar: Lo pasé bomba"]
  },
  { 
    title: "13. Planes de Futuro", 
    OL: "¿Qué vas a hacer el año que viene? ¿Quieres ir a la universidad?", 
    HL: "Háblame de tus planes. ¿Qué carrera te gustaría estudiar y por qué?",
    check_HL: "Futuro Simple (Estudiaré...), Condicional (Me gustaría...), Universidad, Por qué.",
    checkpoints_OL: ["Ir a la universidad", "La carrera (Medicina, Derecho...)", "Trabajar (Quiero ser...)"],
    checkpoints_HL: ["El Año Sabático (Gap Year)", "Independizarse de los padres", "Vocación vs Salario"],
    checkpoints_TOP: ["✨ Idiom: El mundo es un pañuelo", "✨ Idiom: Buscarse la vida", "✨ Grammar: Cuando termine... (Subjuntivo)"]
  },
  { 
    title: "14. Fin de semana pasado", 
    OL: "¿Qué hiciste el fin de semana pasado? ¿Saliste?", 
    HL: "Háblame de lo que hiciste el fin de semana pasado. ¿Hiciste algo especial?",
    check_HL: "Pretérito Indefinido (Fui al cine...), Imperfecto (Estaba cansado), Conectores.",
    checkpoints_OL: ["Viernes/Sábado/Domingo", "Actividades (Fui, Vi, Comí)", "Con quién (Con mis amigos)"],
    checkpoints_HL: ["Describir una fiesta/evento", "Sensaciones (Estaba agotado)", "Imprevistos"],
    checkpoints_TOP: ["✨ Idiom: Quedarse frito (Sleep)", "✨ Idiom: Pasarlo de cine", "✨ Grammar: Al llegar a casa..."]
  },
  { 
    title: "15. Próximo fin de semana", 
    OL: "¿Qué harás el próximo fin de semana?", 
    HL: "Háblame de tus planes para el próximo fin de semana.",
    check_HL: "Ir a + Infinitivo, Futuro Simple, Planes concretos.",
    checkpoints_OL: ["Planes fijos (Voy a trabajar)", "Ocio (Voy a ir al cine)", "Descanso (Voy a dormir)"],
    checkpoints_HL: ["Planes dependientes del clima", "Estudio y deberes", "Eventos familiares"],
    checkpoints_TOP: ["✨ Idiom: Darse un capricho", "✨ Grammar: Tengo ganas de...", "✨ Grammar: Si hace buen tiempo..."]
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

// ===========================================
// FUNCIÓN ANALYZE (MODO EXAMEN)
// ===========================================
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
    const rawText = await callSmartAI(prompt);
    
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
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
    alert(`⚠️ Error: ${e.message}`);
  } finally { 
    b.disabled = false; b.innerText = "✨ Evaluate Answer"; 
  }
}

// ===========================================
// FUNCIÓN ASK AI CONCEPT (MODO ESTUDIO)
// ===========================================
async function askAIConcept(concept) {
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; 
    box.innerHTML = "⏳ <b>Consulting AI Teacher...</b>";

    const prompt = `
        ACT AS: Spanish Teacher.
        TOPIC: "${currentTopic ? currentTopic.title : 'General'}".
        CONCEPT: "${concept}".
        INSTRUCTIONS: Explain in English (max 50 words). 2 Examples (ES->EN).
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
// MODO ESTUDIO (RENDERIZADO)
// ===========================================
function initStudyHTML() {
    // Si ya existe el contenedor en HTML (que ahora SÍ existe), no lo creamos de nuevo
}

function renderCheckpoints() {
    const container = document.getElementById('studyContainer');
    if (!container) return; // Seguridad

    if (!currentTopic) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#64748b; font-weight:bold;'>👈 Please select a topic from the grid above to start studying.</p>";
        return;
    }

    // Limpiamos el contenedor y añadimos el título
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
        h.innerText = title; 
        h.style.margin = "15px 0 5px 0"; 
        h.style.color = "#374151"; 
        h.style.borderBottom = "1px solid #e5e7eb"; 
        h.style.paddingBottom = "5px";
        list.appendChild(h);
        
        const grid = document.createElement('div'); 
        grid.className = 'checklist-grid';
        
        items.forEach(point => {
            const btn = document.createElement('button'); 
            btn.className = `check-btn ${cssClass}`; 
            btn.innerHTML = cssClass === 'btn-top' ? point : `❓ ${point}`;
            btn.onclick = () => askAIConcept(point);
            grid.appendChild(btn);
        });
        list.appendChild(grid);
    };

    if (currentTopic.checkpoints_OL) createSection("🧱 Cimientos (Lo Básico)", currentTopic.checkpoints_OL, "btn-ol");
    if (currentLevel === 'HL' && currentTopic.checkpoints_HL) {
        createSection("🔧 Nivel Superior (HL Requisitos)", currentTopic.checkpoints_HL, "btn-hl");
        if(currentTopic.checkpoints_TOP) {
            createSection("🚀 Nivel TOP (Frases H1)", currentTopic.checkpoints_TOP, "btn-top");
        }
    }
}

// ===========================================
// PARTE 2: ROLEPLAYS (DATOS ACTUALIZADOS Y CORREGIDOS ✅)
// ===========================================
let rpActual = null; let pasoActual = 0;
let rpResponses = [];
let rpEvaluationInProgress = false;

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

const RP_DB = {
    1: { 
        context: "Situación 1: Alojamiento (Accommodation). You are going on Erasmus to Cáceres. You need accommodation and call the university.", 
        dialogs: ["¡Hola, dígame!", "¿En qué parte de la ciudad querrías vivir?", "¿Por qué?", "Tienes razón. Pero sabes que Cáceres es muy pequeña y se puede andar desde las afueras a la Plaza Mayor en media hora.", ["¿Has estado antes en España?", "¿Qué te gusta de España?", "¿Por qué estudiar en España?"]], 
        instructions: [
            "Say that you will be on ERASMUS in the university for the coming academic year. Say you don’t know anybody in Cáceres and ask if he/she could give you some advice about accommodation",
            "Say that you would prefer to live near the university because last year you lived in the outskirts of Dublin and really didn’t like it.",
            "Well, you spent too much time travelling because it was very far from everything. Say that if you could spend that time studying you would be able to get good grades.",
            "Say that's not far and the climate is much better than in Ireland so you will consider all areas even though you would prefer the city centre.",
            "Answer the examiner's question"
        ],
        sugerencias: ["Voy a ir de Erasmus a la universidad durante el próximo curso académico. No conozco a nadie en Cáceres. ¿Podría darme algún consejo para encontrar alojamiento por favor?", "Preferiría vivir cerca de la universidad porque el año pasado viví en las afueras de Dublín y no me gustó.", "Pues es que pasaba demasiado tiempo viajando porque estaba muy lejos de todo. Si pudiera dedicar ese tiempo a estudiar, podría sacar buenas notas.", "Eso no está tan lejos y el clima es mucho mejor que en Irlanda así que tendré en cuenta todos los barrios aunque preferiría vivir en el centro de la ciudad."] 
    },
    2: { 
        context: "Situación 2: Ordenador portátil (Broken Laptop). You are in a computer shop in Ávila.", 
        dialogs: ["¡Hola! ¿En qué puedo ayudarte?", "Vamos a ver. ¿Qué te pasó?", "Vas a necesitar una pantalla nueva que cuesta 200 euros.", "Sí, hay una oferta especial esta semana. ¿Quieres comprarlo?", ["¿De qué marca es tu ordenador?","¿Para qué usas el ordenador?","¿De qué color te gustaría la funda?"]], 
        instructions: [
            "Say your laptop has just fallen and the screen is broken. Say that the worst thing is that you have an essay due for tomorrow and the only copy is on the laptop.",
            "Say you were late and you had to run to catch the bus. Say that you slipped and the laptop fell on the ground and you only noticed the problem when you got up.",
            "Say it is good to know that it can be fixed but you noticed the same laptop model and make for sale in the window and it only costs three hundred euro.",
            "Say you will buy it if he/she can copy all your files and give you a free bag for the laptop.",
            "Answer the examiner's question."
        ],
        sugerencias: ["Se me acaba de caer el portátil y la pantalla está rota. Lo peor es que tengo que entregar un ensayo mañana y la única copia está en el portátil.", "Llegaba tarde y tuve que correr para coger el autobús. Me resbalé y el portátil se cayó al suelo y solo me di cuenta del problema cuando me levanté.", "Es bueno saber que tiene arreglo pero he visto un portátil del mismo modelo y marca a la venta en el escaparate y solo cuesta trescientos euros.", "Lo compraré si puede copiar todos mis archivos y darme una funda gratis para el portátil.", "(Respuesta libre)"] 
    },
    3: { 
        context: "Situación 3: Alquiler de autocaravana (Camper Van). You are phoning a rental company in Madrid.", 
        dialogs: ["¡Hola! ¿En qué puedo ayudarte?", "Para alquilar un cámper hace falta tener al menos veinticinco años y mucha experiencia al volante.", "Pues, muy bien. Tu madre cumple con los requisitos para alquilar un cámper.", "¡Fenomenal! Os alquilo un cámper. ¿Tenéis el itinerario previsto?", ["¿A qué hora vendréis a recogerla?", "¿Qué música os gusta?", "¿Qué ciudades queréis visitar?"]], 
        instructions: [
            "Say you are a student from Ireland and you are interested in hiring a camper van for two weeks in July.",
            "Say your mother will be driving because you don't have your driving licence yet. Say you are getting driving lessons and hope to pass the test in the Autumn.",
            "Say she has driven on the right in various European countries over the last twenty years. Say that she is a very careful driver and has never had an accident.",
            "Say that you have spent a lot of time on the coast but this summer you would like to travel through Castilla-La Mancha to see the land of Cervantes and Don Quixote, away from the tourists.",
            "Answer the examiner's question."
        ],
        sugerencias: ["Soy estudiante de Irlanda y me interesa alquilar un cámper durante dos semanas en julio.", "Mi madre va a conducir porque yo todavía no tengo el carné de conducir. Estoy dando clases de conducir y espero aprobar el examen en otoño.", "Ha conducido por la derecha en varios países europeos durante los últimos veinte años. Es una conductora muy prudente y nunca ha tenido un accidente.", "Hemos pasado mucho tiempo en la costa, pero este verano nos gustaría viajar por Castilla-La Mancha para ver la tierra de Cervantes y Don Quijote, lejos de los turistas.", "(Respuesta libre)"] 
    },
    4: { 
        context: "Situación 4: Plásticos (Environment). You are talking to your Spanish friend about the environment.", 
        dialogs: ["Pareces muy contento, ¿por qué?", "¿Es importante prohibir plásticos de usar y tirar?", "¿Podemos hacer algo más?", "Y, ¿ya está?", ["¿Qué reciclas en casa?", "¿Qué haces tú por el planeta?", "¿Cómo vienes al instituto?"]], 
        instructions: [
            "Say that the European Parliament has agreed to ban single use plastics such as knives, forks, spoons, cups, plates and straws.",
            "Say that it is absolutely essential. Say it will be very good for the planet's waters. Say pollution caused by plastics is a grave problem in rivers, lakes and oceans.",
            "Say that there are many things that we can do. Say for example, instead of using plastics we can use recycled paper, cardboard and other biodegradable materials.",
            "Say no, as citizens we need to be more responsible and change our lifestyle. Say to protect the environment we could cycle, use public transport or walk more often.",
            "Answer the examiner's question."
        ],
        sugerencias: ["El Parlamento Europeo ha acordado prohibir los plásticos de un solo uso, como cuchillos, tenedores, cucharas, tazas, platos y pajitas.", "Es absolutamente imprescindible. Será muy bueno para las aguas del planeta. La contaminación causada por los plásticos es un problema grave en ríos, lagos y océanos.", "Hay muchas cosas que podemos hacer. Por ejemplo, en vez de usar plásticos, podemos usar papel reciclado, cartón y otros materiales biodegradables.", "No, como ciudadanos necesitamos ser más responsables y cambiar nuestro estilo de vida. Para proteger el medio ambiente podríamos ir en bicicleta, usar el transporte público o caminar más a menudo.", "(Respuesta libre)"] 
    },
    5: { 
        context: "Situación 5: Avería de coche (Breakdown). You are calling your insurance company.", 
        dialogs: ["Hola, buenas tardes.", "Debes estar entre Medina del Campo y Tordesillas. ¿Hay alguna señal de tráfico por ahí?", "Claro que sí. Voy a arreglarlo todo inmediatamente.", "Por supuesto. ¿Me puedes describir tu coche?", ["¿Viajas solo o acompañado?", "¿Qué ciudades quieres visitar?", "¿Cuánto costó el coche?"]], 
        instructions: [
            "Say your car has just broken down and that you are on the AP-6 motorway. Say that you don’t know exactly where you are but that you passed through the toll half an hour ago.",
            "Say you can see the exit sign 156 in the distance. Ask if they can send out a mechanic or perhaps a tow truck because you think the problem is serious.",
            "Ask if they could give you a replacement car so that you can continue your journey to Lugo. Say you have to collect your parents from the airport in Santiago de Compostela.",
            "Say it is red Seat Ibiza. The registration is 4620 CFK. Say you bought if second hand from your aunt and you have never had a problem with it before.",
            "Answer the examiner's question."
        ],
        sugerencias: ["Mi coche se acaba de averiar y estoy en la autopista AP-6. No sé exactamente dónde estoy pero pasé el peaje hace media hora.", "Veo a lo lejos la señal de salida 156. ¿Pueden enviar un mecánico o quizás una grúa porque creo que el problema es serio?", "¿Podrían darme un coche de sustitución para que pueda seguir mi viaje a Lugo? Tengo que recoger a mis padres en el aeropuerto de Santiago de Compostela.", "Es un Seat Ibiza rojo. La matrícula es 4620 CFK. Se lo compré de segunda mano a mi tía y nunca antes he tenido un problema con él.", "(Respuesta libre)"] 
    }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0;
    rpResponses = [];
    rpEvaluationInProgress = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = RP_DB[id].context;
    
    // Resetear chat y botones
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Examiner" to begin.</div>`;
    
    // Ocultar caja de instrucciones al inicio (se muestra al activar input)
    document.getElementById('rpInstructionBox').style.display = 'none';
    
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block"; nextBtn.innerText = "▶️ Start Examiner"; nextBtn.onclick = reproducirSiguienteAudio;
    
    document.getElementById('rpInput').disabled = true; document.getElementById('rpInput').value = "";
    document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

function reproducirSiguienteAudio() {
    document.getElementById('nextAudioBtn').style.display = "none";
    
    // CORRECCIÓN: Ahora verificamos si es MAYOR que 4, para que la pregunta 5 (índice 4) suene.
    if (pasoActual > 4) {
        document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed!</div>`;
        document.getElementById('rpInstructionBox').style.display = 'none';
        return;
    }

    // Obtener texto y nombre del archivo de audio
    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    let audioFile = "";
    
    // Lógica para la última pregunta aleatoria (Step 5)
    if (Array.isArray(dialogText)) {
        const randomIndex = Math.floor(Math.random() * dialogText.length);
        dialogText = dialogText[randomIndex];
        audioFile = `rp${rpActual}_5${['a','b','c'][randomIndex]}.mp3`;
    } else { 
        audioFile = `rp${rpActual}_${pasoActual + 1}.mp3`; 
    }

    // Mostrar burbuja del examinador
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`; 
    chat.scrollTop = chat.scrollHeight;
    
    // Intentar reproducir audio con Fallback robusto
    const audio = new Audio(audioFile);
    
    // Función de respaldo (Voz robótica)
    const playFallback = () => {
        console.log("Audio MP3 falló, usando voz sintética...");
        window.speechSynthesis.cancel(); // Limpiar cola anterior
        window.utterance = new SpeechSynthesisUtterance(dialogText); // VARIABLE GLOBAL (CRUCIAL)
        window.utterance.lang = 'es-ES'; 
        window.utterance.rate = 0.9;
        window.utterance.onend = function() {
            habilitarInput();
        };
        window.utterance.onerror = function(e) {
            console.error("Error en TTS:", e);
            habilitarInput(); // Si falla la voz, habilitamos input para no bloquear
        };
        window.speechSynthesis.speak(window.utterance);
    };

    audio.onerror = playFallback;
    
    audio.onended = habilitarInput;
    
    // Intentar reproducir y capturar errores de promesa (común en iOS/Safari)
    audio.play().catch(e => { 
        console.warn("Autoplay bloqueado o archivo no encontrado:", e);
        playFallback(); 
    });
}

function habilitarInput() {
    if(pasoActual < 5) { 
        const inp = document.getElementById('rpInput');
        inp.disabled = false; 
        document.getElementById('rpSendBtn').disabled = false;
        
        // Mostrar la instrucción
        const instructionBox = document.getElementById('rpInstructionBox');
        const instructionText = RP_DB[rpActual].instructions[pasoActual];
        instructionBox.innerHTML = `<span class="instruction-label">YOUR TURN (CANDIDATE CARD):</span>${instructionText}`;
        instructionBox.style.display = 'block';

        document.getElementById('hintBtn').style.display = "block";
        inp.placeholder = "Type your reply...";
        
        // FIX DE USABILIDAD: Forzar scroll hacia el input para que no se pierdan
        inp.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Darle foco para que salga el teclado en el móvil
        setTimeout(() => inp.focus(), 300);
    }
}

function enviarRespuestaRP() {
    const inp = document.getElementById('rpInput'); const txt = inp.value.trim(); if(!txt) return;
    const chat = document.getElementById('rpChat'); chat.innerHTML += `<div class="bubble st">${escapeHTML(txt)}</div>`; chat.scrollTop = chat.scrollHeight;

    const examinerText = RP_DB[rpActual].dialogs[pasoActual];
    rpResponses.push({
        turn: pasoActual + 1,
        examiner: Array.isArray(examinerText) ? 'Pregunta personal elegida por el examinador' : examinerText,
        instruction: RP_DB[rpActual].instructions[pasoActual],
        answer: txt
    });
    
    inp.value = ""; inp.disabled = true; 
    document.getElementById('rpSendBtn').disabled = true; 
    document.getElementById('hintBtn').style.display = "none";
    document.getElementById('rpInstructionBox').style.display = 'none'; // Ocultar instrucción al enviar
    
    pasoActual++;
    
    setTimeout(() => { 
        // CORRECCIÓN: Si pasoActual es 5, debe mostrar el botón final o terminar. 
        // Como hemos contestado la 5 (índice 4), pasoActual ahora es 5.
        if(pasoActual <= 4) { 
            const nextBtn = document.getElementById('nextAudioBtn');
            nextBtn.style.display = "block"; nextBtn.innerText = "🔊 Listen to Examiner"; nextBtn.onclick = reproducirSiguienteAudio;
        } else { 
            // Si ya terminó el paso 4, mostramos el mensaje final y quitamos el botón de audio
            document.getElementById('nextAudioBtn').style.display = "none";
            document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`;
            evaluarRoleplay();
        }
    }, 500);
}

async function evaluarRoleplay() {
    if (rpEvaluationInProgress || !rpActual || rpResponses.length !== 5) return;
    rpEvaluationInProgress = true;
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div id="rpEvaluationLoading" class="roleplay-evaluation loading">⏳ <b>Evaluating your role play...</b><br><span>Each turn is worth 6 marks. The result is indicative and focuses on communication, task completion and Spanish accuracy.</span></div>`;
    chat.scrollTop = chat.scrollHeight;

    const roleplay = RP_DB[rpActual];
    const transcript = rpResponses.map(r => `TURN ${r.turn}\nEXAMINER: ${r.examiner}\nCANDIDATE INSTRUCTION: ${r.instruction}\nCANDIDATE ANSWER: ${r.answer}`).join('\n\n');
    const prompt = `
ACT AS: A fair Leaving Certificate Spanish oral examiner in Ireland.
TASK: Evaluate the completed role play below. It has five candidate turns and is worth 30 marks: 6 marks per turn.
ROLE PLAY CONTEXT: ${roleplay.context}
TRANSCRIPT:
${transcript}

MARKING PRINCIPLES:
- Award each turn 0-6 marks for completing the communicative task, relevance, comprehensibility, grammar and vocabulary.
- Accept any natural Spanish formulation that fulfils the instruction; do not penalise an answer merely because it differs from the model answer.
- Treat the final personal question as a genuine spontaneous answer. Do not require a specific fact.
- Do not assess pronunciation because the answer is a text transcription.
- Be constructive and specific. Identify only meaningful errors or omissions.

Return ONLY valid JSON in this exact shape:
{"total_score":0,"overall_es":"","overall_en":"","turns":[{"turn":1,"score":0,"feedback_es":"","feedback_en":"","missing":"","errors":[{"original":"","correction":"","explanation_en":""}],"improved_answer":""}]}
The turns array must contain exactly five objects and each score must be an integer from 0 to 6. total_score must equal the sum of the five scores.
`;

    try {
        const rawText = await callSmartAI(prompt);
        const cleanJson = rawText.replace(/```json|```/g, '').trim();
        const evaluation = JSON.parse(cleanJson);
        renderRoleplayEvaluation(evaluation);
    } catch (e) {
        console.error('Roleplay evaluation failed:', e);
        const loading = document.getElementById('rpEvaluationLoading');
        if (loading) loading.innerHTML = `<b>⚠️ We could not evaluate this role play.</b><br><span>${escapeHTML(e.message)}</span><br><button class="btn-main rp-retry" onclick="evaluarRoleplay()">🔄 Try again</button>`;
    } finally {
        rpEvaluationInProgress = false;
    }
}

function renderRoleplayEvaluation(evaluation) {
    const loading = document.getElementById('rpEvaluationLoading');
    if (loading) loading.remove();
    const turns = Array.isArray(evaluation.turns) ? evaluation.turns : [];
    const total = Number.isFinite(Number(evaluation.total_score)) ? Number(evaluation.total_score) : turns.reduce((sum, t) => sum + Number(t.score || 0), 0);
    let html = `<section class="roleplay-evaluation" aria-label="Role play feedback">
        <h3>🎭 Role play feedback: ${Math.max(0, Math.min(30, total))}/30</h3>
        <p class="evaluation-note">Indicative AI feedback based on the written/transcribed answers. Pronunciation and fluency are not assessed here.</p>
        <p><strong>🇪🇸 ${escapeHTML(evaluation.overall_es || 'Revisa cada turno y vuelve a intentarlo.')}</strong></p>
        <p class="feedback-en">🇬🇧 ${escapeHTML(evaluation.overall_en || '')}</p>
        <div class="turn-feedback-list">`;
    for (let i = 0; i < 5; i++) {
        const t = turns[i] || {turn:i+1, score:0, feedback_es:'No feedback returned for this turn.'};
        const errors = Array.isArray(t.errors) ? t.errors : [];
        html += `<article class="turn-feedback">
            <div class="turn-heading"><strong>Turn ${i + 1}</strong><span>${escapeHTML(t.score ?? 0)}/6</span></div>
            <p><strong>🇪🇸</strong> ${escapeHTML(t.feedback_es || '')}</p>
            ${t.feedback_en ? `<p class="feedback-en"><strong>🇬🇧</strong> ${escapeHTML(t.feedback_en)}</p>` : ''}
            ${t.missing ? `<p><b>Task point to revisit:</b> ${escapeHTML(t.missing)}</p>` : ''}
            ${errors.length ? `<div class="turn-errors">${errors.map(e => `<div>❌ <s>${escapeHTML(e.original)}</s> → <b>${escapeHTML(e.correction)}</b>${e.explanation_en ? ` <span>(${escapeHTML(e.explanation_en)})</span>` : ''}</div>`).join('')}</div>` : '<div class="turn-good">✅ No significant language error identified.</div>'}
            ${t.improved_answer ? `<div class="improved-answer"><b>Possible improved answer:</b> ${escapeHTML(t.improved_answer)}</div>` : ''}
        </article>`;
    }
    html += `</div></section>`;
    document.getElementById('rpChat').insertAdjacentHTML('beforeend', html);
    document.getElementById('rpChat').scrollTop = document.getElementById('rpChat').scrollHeight;
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

// Inicialización
initConv();
