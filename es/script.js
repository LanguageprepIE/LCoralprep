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

function scrollToVisibleSection(id) {
    const element = document.getElementById(id);
    if (!element) return;
    window.requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
}

let currentLevel = 'HL';
let currentMode = 'exam'; 
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;
let mockPhase = 'idle';
let mockAnswers = [];
let mockSelectedRoleplays = [];
let mockChosenRoleplay = null;
let mockConversationScore = null;
let mockRoleplayScore = null;
let mockOpinionQuestion = null;
let mockOpinionCompleted = false;

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
  },
  {
    title: "IA y educación",
    opinion: true,
    OL: "¿Usas la inteligencia artificial para estudiar? ¿Te parece útil?",
    HL: "¿Qué opinas del uso de la inteligencia artificial en la educación?",
    checkpoints_OL: ["Dar una opinión (Creo que...)", "Una ventaja (Es útil para...)", "Un riesgo (Puede ser...)"] ,
    checkpoints_HL: ["Contrastar ventajas y riesgos", "Justificar con un ejemplo", "Proponer un uso responsable"],
    checkpoints_TOP: ["✨ Concession: Aunque puede ser útil...", "✨ Structure: No se trata de..., sino de...", "✨ Vocab: Pensamiento crítico"]
  },
  {
    title: "Tecnología en clase",
    opinion: true,
    OL: "¿Usáis tecnología en clase? ¿Te ayuda a aprender?",
    HL: "¿Crees que la tecnología mejora el aprendizaje en el aula?",
    checkpoints_OL: ["Dispositivos (tableta, ordenador)", "Dar una ventaja", "Dar un problema"],
    checkpoints_HL: ["Aprendizaje y participación", "Distracciones y desigualdad", "Equilibrio entre tecnología y métodos tradicionales"],
    checkpoints_TOP: ["✨ Structure: Siempre que se use bien...", "✨ Contrast: Por un lado... por otro...", "✨ Vocab: Brecha digital"]
  },
  {
    title: "Redes sociales",
    opinion: true,
    OL: "¿Usas las redes sociales? ¿Cuáles son sus ventajas y peligros?",
    HL: "¿Qué influencia tienen las redes sociales en la vida de los jóvenes?",
    checkpoints_OL: ["Redes que usas", "Una ventaja", "Un peligro o problema"],
    checkpoints_HL: ["Comunicación e información", "Presión social y salud mental", "Privacidad y uso responsable"],
    checkpoints_TOP: ["✨ Structure: Es innegable que...", "✨ Hypothesis: Si pasáramos menos tiempo...", "✨ Vocab: Autoestima y desinformación"]
  },
  {
    title: "Contaminación",
    opinion: true,
    OL: "¿Hay contaminación donde vives? ¿Qué podemos hacer?",
    HL: "¿Qué podemos hacer para reducir la contaminación?",
    checkpoints_OL: ["Tipos de contaminación", "Transporte", "Una solución sencilla"],
    checkpoints_HL: ["Causas y consecuencias", "Responsabilidad individual y colectiva", "Medidas realistas"],
    checkpoints_TOP: ["✨ Structure: Hace falta que...", "✨ Proposal: Se debería fomentar...", "✨ Vocab: Emisiones y calidad del aire"]
  },
  {
    title: "Reciclaje",
    opinion: true,
    OL: "¿Reciclas en casa? ¿Por qué es importante?",
    HL: "¿Es suficiente reciclar para proteger el medioambiente?",
    checkpoints_OL: ["Qué reciclas", "Cómo separas los residuos", "Por qué es importante"],
    checkpoints_HL: ["Reciclar, reducir y reutilizar", "Hábitos de consumo", "Papel de colegios, empresas y gobiernos"],
    checkpoints_TOP: ["✨ Structure: Por mucho que reciclemos...", "✨ Proposal: Sería conveniente que...", "✨ Vocab: Consumo sostenible"]
  }
];

// The conversation manual is used as a coverage map, not as a script students
// must reproduce. These ideas guide preparation and supportive AI feedback.
const TOPIC_GUIDES = [
  {
    prompt: { OL: "Habla de ti.", HL: "Habla de ti con detalle." },
    ideas: ["datos personales y cumpleaños", "aspecto físico", "personalidad", "gustos e intereses"],
    hlIdeas: ["cualidades y defectos", "un ejemplo que demuestre cómo eres", "ambiciones o cambios para el futuro"],
    questions: ["¿Cómo te describirías?", "¿Cómo celebras normalmente tu cumpleaños?", "¿Qué es lo que más te gusta de tu personalidad?", "¿Qué te gustaría cambiar de ti?"]
  },
  {
    prompt: { OL: "Habla de tu familia.", HL: "Habla de tu familia y de vuestra relación." },
    ideas: ["quiénes forman tu familia", "edades o profesiones", "personalidad y aspecto", "cómo os lleváis"],
    hlIdeas: ["normas y responsabilidades en casa", "con quién te llevas mejor y por qué", "una experiencia o actividad familiar"],
    questions: ["¿Cuántas personas hay en tu familia?", "¿Cómo son tus familiares?", "¿Con quién te llevas mejor?", "¿Qué soléis hacer juntos?"]
  },
  {
    prompt: { OL: "Habla de tus amigos.", HL: "Habla de tus amigos y de lo que significa la amistad para ti." },
    ideas: ["tu mejor amigo o amiga", "cómo es", "cómo os conocisteis", "qué hacéis juntos"],
    hlIdeas: ["intereses en común y diferencias", "qué valoras en una amistad", "una experiencia compartida"],
    questions: ["¿Cómo es tu mejor amigo o amiga?", "¿Desde cuándo os conocéis?", "¿Qué hacéis juntos?", "¿Qué cualidades buscas en un amigo?"]
  },
  {
    prompt: { OL: "Habla de tu casa.", HL: "Habla de tu casa y de lo que representa para ti." },
    ideas: ["tipo de vivienda y ubicación", "habitaciones", "tu dormitorio", "tu lugar favorito"],
    hlIdeas: ["ventajas y desventajas", "tareas que haces", "cómo sería tu casa ideal"],
    questions: ["¿Dónde vives y qué tipo de vivienda es?", "¿Cómo es tu dormitorio?", "¿Dónde pasas más tiempo?", "¿Qué cambiarías de tu casa?"]
  },
  {
    prompt: { OL: "Habla de tu barrio.", HL: "Habla de tu barrio y valora cómo es vivir allí." },
    ideas: ["ubicación y ambiente", "tiendas e instalaciones", "transporte", "actividades para jóvenes"],
    hlIdeas: ["ventajas y problemas", "algo que mejorarías", "cómo ha cambiado o podría cambiar"],
    questions: ["¿Cómo es tu barrio?", "¿Qué instalaciones hay?", "¿Está bien comunicado?", "¿Qué mejorarías para los jóvenes?"]
  },
  {
    prompt: { OL: "Habla de tu pueblo o ciudad.", HL: "Habla de tu pueblo o ciudad y compáralo con otros lugares." },
    ideas: ["ubicación y tamaño", "lugares de interés", "transporte", "tu lugar favorito"],
    hlIdeas: ["vida urbana y rural", "ventajas y desventajas", "turismo, tráfico o contaminación"],
    questions: ["¿Dónde está y cómo es?", "¿Qué puede visitar un turista?", "¿Qué es lo mejor de vivir allí?", "¿Preferirías vivir en otro lugar?"]
  },
  {
    prompt: { OL: "Habla de tu instituto.", HL: "Habla de tu instituto y da tu opinión sobre la vida escolar." },
    ideas: ["ubicación y tamaño", "instalaciones", "uniforme", "profesores y actividades"],
    hlIdeas: ["normas y convivencia", "ventajas y aspectos que mejorarías", "una experiencia escolar"],
    questions: ["¿Cómo es tu instituto?", "¿Qué instalaciones tiene?", "¿Qué opinas del uniforme?", "¿Qué cambiarías si fueras director o directora?"]
  },
  {
    prompt: { OL: "Habla de las asignaturas que estudias.", HL: "Habla de tus asignaturas y de tu experiencia académica." },
    ideas: ["asignaturas que estudias", "tu favorita y por qué", "la más difícil", "deberes y resultados"],
    hlIdeas: ["presión de los exámenes", "utilidad de las asignaturas", "cómo estudias y qué te ayuda"],
    questions: ["¿Cuál es tu asignatura favorita?", "¿Qué asignatura te resulta difícil?", "¿Cómo estudias para los exámenes?", "¿Te prepara bien el colegio para el futuro?"]
  },
  {
    prompt: { OL: "Habla de tu rutina diaria.", HL: "Habla de tu rutina y de cómo organizas tu tiempo." },
    ideas: ["hora de levantarte", "mañana y jornada escolar", "después del colegio", "noche y fin de semana"],
    hlIdeas: ["equilibrio entre estudio y ocio", "estrés o falta de tiempo", "cómo mejorarías tu rutina"],
    questions: ["¿Qué haces por la mañana?", "¿Cómo es un día normal de colegio?", "¿Qué haces por la tarde?", "¿Cambia tu rutina el fin de semana?"]
  },
  {
    prompt: { OL: "Habla de tus pasatiempos.", HL: "Habla de tus aficiones y de su importancia en tu vida." },
    ideas: ["actividades favoritas", "frecuencia y lugar", "con quién las haces", "música, deporte o tecnología"],
    hlIdeas: ["beneficios físicos o mentales", "cómo empezaste", "cómo han cambiado tus aficiones"],
    questions: ["¿Qué haces en tu tiempo libre?", "¿Practicas algún deporte?", "¿Qué música te gusta?", "¿Por qué es importante tener aficiones?"]
  },
  {
    prompt: { OL: "Habla de cómo ayudas en casa.", HL: "Habla de las tareas domésticas y del reparto de responsabilidades en casa." },
    ideas: ["tareas que haces", "frecuencia", "la tarea que prefieres", "la que menos te gusta"],
    hlIdeas: ["si el reparto es justo", "paga semanal", "responsabilidad e igualdad"],
    questions: ["¿Cómo ayudas en casa?", "¿Qué tarea no te gusta hacer?", "¿Quién hace la mayoría de las tareas?", "¿Crees que el reparto es justo?"]
  },
  {
    prompt: { OL: "Habla de tus vacaciones.", HL: "Habla de tus vacaciones y de tus preferencias al viajar." },
    ideas: ["destino y compañía", "transporte y alojamiento", "actividades", "cómo lo pasaste"],
    hlIdeas: ["comparación entre destinos", "España o Irlanda como destino", "planes para próximas vacaciones"],
    questions: ["¿Dónde pasaste tus últimas vacaciones?", "¿Qué hiciste allí?", "¿Has estado en España?", "¿Adónde te gustaría viajar?"]
  },
  {
    prompt: { OL: "Habla de tus planes de futuro.", HL: "Habla de tus planes y ambiciones para el futuro." },
    ideas: ["el próximo año", "estudios o formación", "trabajo que te gustaría", "lugares donde te gustaría vivir o viajar"],
    hlIdeas: ["razones para elegir una carrera", "dificultades o requisitos", "qué echarás de menos del instituto"],
    questions: ["¿Qué harás cuando termines el instituto?", "¿Qué te gustaría estudiar?", "¿A qué te gustaría dedicarte?", "¿Dónde te ves dentro de diez años?"]
  },
  {
    prompt: { OL: "Habla del fin de semana pasado.", HL: "Cuenta con detalle lo que hiciste el fin de semana pasado." },
    ideas: ["qué hiciste cada día", "con quién estuviste", "dónde fuiste", "cómo lo pasaste"],
    hlIdeas: ["descripción y contexto", "un momento especial o imprevisto", "opinión o reflexión final"],
    questions: ["¿Qué hiciste el viernes?", "¿Saliste con alguien?", "¿Ocurrió algo especial?", "¿Fue un buen fin de semana?"]
  },
  {
    prompt: { OL: "Habla de tus planes para el próximo fin de semana.", HL: "Habla con detalle de tus planes para el próximo fin de semana." },
    ideas: ["planes para cada día", "personas y lugares", "estudio o trabajo", "ocio y descanso"],
    hlIdeas: ["planes alternativos", "cómo influirá el tiempo", "por qué te apetece hacerlos"],
    questions: ["¿Qué vas a hacer el viernes?", "¿Vas a quedar con alguien?", "¿Tienes que estudiar o trabajar?", "¿Qué harás si hace mal tiempo?"]
  },
  {
    prompt: { OL: "¿Usas la inteligencia artificial para estudiar? ¿Te parece útil?", HL: "¿Qué opinas del uso de la inteligencia artificial en la educación?" },
    ideas: ["cómo usas la IA", "una ventaja para aprender", "un posible riesgo", "una experiencia o ejemplo"],
    hlIdeas: ["dependencia y pensamiento crítico", "honestidad académica", "cómo debería utilizarse responsablemente"],
    questions: ["¿Para qué utilizas la IA?", "¿Cómo puede ayudar a un alumno?", "¿Qué riesgos tiene?", "¿Deberían permitirse estas herramientas en el colegio?"]
  },
  {
    prompt: { OL: "¿Usáis tecnología en clase? ¿Te ayuda a aprender?", HL: "¿Crees que la tecnología mejora el aprendizaje en el aula?" },
    ideas: ["tecnología que utilizáis", "cómo ayuda a aprender", "una dificultad o distracción", "tu preferencia personal"],
    hlIdeas: ["participación y acceso a recursos", "desigualdad o brecha digital", "equilibrio con métodos tradicionales"],
    questions: ["¿Qué tecnología usáis en clase?", "¿Cuándo resulta útil?", "¿Puede distraer a los alumnos?", "¿Cómo sería el aula ideal?"]
  },
  {
    prompt: { OL: "¿Usas las redes sociales? ¿Cuáles son sus ventajas y peligros?", HL: "¿Qué influencia tienen las redes sociales en la vida de los jóvenes?" },
    ideas: ["redes que utilizas", "comunicación y entretenimiento", "tiempo que pasas conectado", "un peligro o inconveniente"],
    hlIdeas: ["presión social y autoestima", "privacidad y desinformación", "hábitos para un uso saludable"],
    questions: ["¿Qué redes sociales utilizas?", "¿Qué ventajas tienen?", "¿Qué problemas pueden causar?", "¿Cómo podemos usarlas de forma responsable?"]
  },
  {
    prompt: { OL: "¿Hay contaminación donde vives? ¿Qué podemos hacer?", HL: "¿Qué podemos hacer para reducir la contaminación?" },
    ideas: ["contaminación en tu zona", "tráfico y transporte", "basura o plásticos", "una acción personal"],
    hlIdeas: ["causas y consecuencias", "responsabilidad de gobiernos y empresas", "una medida realista y sus dificultades"],
    questions: ["¿Hay mucha contaminación donde vives?", "¿Qué haces tú para ayudar?", "¿Cómo podríamos viajar de forma más sostenible?", "¿Quién tiene más responsabilidad?"]
  },
  {
    prompt: { OL: "¿Reciclas en casa? ¿Por qué es importante?", HL: "¿Es suficiente reciclar para proteger el medioambiente?" },
    ideas: ["qué materiales reciclas", "cómo separáis los residuos", "por qué es importante", "una dificultad"],
    hlIdeas: ["reducir y reutilizar además de reciclar", "consumo y envases", "papel de colegios, empresas y gobiernos"],
    questions: ["¿Qué recicláis en casa?", "¿Es fácil reciclar en tu zona?", "¿Qué podríamos consumir menos?", "¿Basta con reciclar?"]
  }
];

// English support is shown alongside the Spanish idea, while the actual
// prompt and Gemini evaluation remain grounded in the target language.
const TOPIC_GUIDE_TRANSLATIONS = [
  { ideas: ["personal details and birthday", "physical appearance", "personality", "likes and interests"], hlIdeas: ["strengths and weaknesses", "an example showing what you are like", "ambitions or changes for the future"] },
  { ideas: ["who is in your family", "ages or jobs", "personality and appearance", "how you get on"], hlIdeas: ["house rules and responsibilities", "who you get on best with and why", "a family experience or activity"] },
  { ideas: ["your best friend", "what he or she is like", "how you met", "what you do together"], hlIdeas: ["shared interests and differences", "what you value in a friendship", "a shared experience"] },
  { ideas: ["type of home and location", "rooms", "your bedroom", "your favourite place"], hlIdeas: ["advantages and disadvantages", "chores you do", "what your ideal home would be like"] },
  { ideas: ["location and atmosphere", "shops and facilities", "transport", "activities for young people"], hlIdeas: ["advantages and problems", "something you would improve", "how it has changed or could change"] },
  { ideas: ["location and size", "places of interest", "transport", "your favourite place"], hlIdeas: ["urban and rural life", "advantages and disadvantages", "tourism, traffic or pollution"] },
  { ideas: ["location and size", "facilities", "uniform", "teachers and activities"], hlIdeas: ["rules and relationships", "advantages and things you would improve", "a school experience"] },
  { ideas: ["subjects you study", "your favourite and why", "the most difficult subject", "homework and results"], hlIdeas: ["exam pressure", "the usefulness of subjects", "how you study and what helps you"] },
  { ideas: ["what time you get up", "morning and school day", "after school", "evening and weekend"], hlIdeas: ["balance between study and free time", "stress or lack of time", "how you would improve your routine"] },
  { ideas: ["favourite activities", "how often and where", "who you do them with", "music, sport or technology"], hlIdeas: ["physical or mental benefits", "how you started", "how your interests have changed"] },
  { ideas: ["chores you do", "how often", "the chore you prefer", "the chore you like least"], hlIdeas: ["whether the division is fair", "pocket money", "responsibility and equality"] },
  { ideas: ["destination and company", "transport and accommodation", "activities", "how you enjoyed it"], hlIdeas: ["comparison between destinations", "Spain or Ireland as a destination", "plans for future holidays"] },
  { ideas: ["next year", "studies or training", "the job you would like", "places where you would like to live or travel"], hlIdeas: ["reasons for choosing a course", "difficulties or requirements", "what you will miss about school"] },
  { ideas: ["what you did each day", "who you were with", "where you went", "how you enjoyed it"], hlIdeas: ["description and context", "a special moment or unexpected event", "a final opinion or reflection"] },
  { ideas: ["plans for each day", "people and places", "study or work", "leisure and rest"], hlIdeas: ["alternative plans", "how the weather will affect your plans", "why you are looking forward to them"] },
  { ideas: ["how you use AI", "one learning benefit", "a possible risk", "an experience or example"], hlIdeas: ["dependence and critical thinking", "academic honesty", "how it should be used responsibly"] },
  { ideas: ["technology you use", "how it helps learning", "a difficulty or distraction", "your personal preference"], hlIdeas: ["participation and access to resources", "inequality or the digital divide", "balance with traditional methods"] },
  { ideas: ["social media you use", "communication and entertainment", "time spent online", "a danger or disadvantage"], hlIdeas: ["social pressure and self-esteem", "privacy and misinformation", "healthy-use habits"] },
  { ideas: ["pollution in your area", "traffic and transport", "rubbish or plastics", "one personal action"], hlIdeas: ["causes and consequences", "government and business responsibility", "a realistic measure and its difficulties"] },
  { ideas: ["materials you recycle", "how you separate waste", "why it matters", "one difficulty"], hlIdeas: ["reducing and reusing as well as recycling", "consumption and packaging", "the role of schools, businesses and governments"] }
];

const PAST_Q = [
  { prompt: "Habla de lo que hiciste el fin de semana pasado.", guidance: ["actividades", "personas y lugares", "cómo lo pasaste", "algún detalle o imprevisto"] },
  { prompt: "Habla de tus últimas vacaciones.", guidance: ["destino y compañía", "transporte o alojamiento", "actividades", "opinión personal"] },
  { prompt: "Habla de lo que hiciste ayer.", guidance: ["rutina", "lugares y personas", "una actividad concreta", "cómo fue el día"] }
];
const FUT_Q = [
  { prompt: "Habla de tus planes para mañana.", guidance: ["actividades", "horarios", "personas o lugares", "razones"] },
  { prompt: "Habla de tus planes para el verano.", guidance: ["viajes o trabajo", "personas y lugares", "actividades", "expectativas"] },
  { prompt: "Habla de lo que harás cuando termines el instituto.", guidance: ["estudios o trabajo", "razones", "objetivos", "planes a más largo plazo"] }
];

const OPINION_Q = DATA.filter(topic => topic.opinion).map(topic => {
    const guide = getTopicGuide(topic);
    return { prompt: guide.prompt.HL, guidance: [...guide.ideas, ...guide.hlIdeas] };
});

const ROLEPLAY_LABELS = {
    1: "Erasmus accommodation",
    2: "Broken laptop",
    3: "Camper van",
    4: "Single-use plastics",
    5: "Car breakdown"
};

function getTopicGuide(topic) {
    const index = DATA.indexOf(topic);
    return TOPIC_GUIDES[index] || { prompt: { OL: topic.OL, HL: topic.HL }, ideas: [], hlIdeas: [], questions: [] };
}

function getExamPrompt(topic) {
    // Keep the established OL exam prompts; the broader monologue redesign is
    // currently being trialled only for Higher Level.
    return currentLevel === 'HL' ? getTopicGuide(topic).prompt.HL : topic.OL;
}

function getExamGuidance(topic) {
    const guide = getTopicGuide(topic);
    return currentLevel === 'HL' ? [...guide.ideas, ...guide.hlIdeas] : [];
}

function getExamGuidanceBilingual(topic) {
    const index = DATA.indexOf(topic);
    const guide = getTopicGuide(topic);
    const translations = TOPIC_GUIDE_TRANSLATIONS[index];
    if (!translations) return getExamGuidance(topic).map(es => ({ es, en: '' }));
    const pairs = currentLevel === 'HL'
        ? guide.ideas.map((es, i) => ({ es, en: translations.ideas[i] || '' })).concat(guide.hlIdeas.map((es, i) => ({ es, en: translations.hlIdeas[i] || '' })))
        : [];
    return pairs;
}

// ===========================================
// LÓGICA DE CONTROL (NIVEL Y MODO)
// ===========================================

function setLevel(lvl) { 
    if (isMockExam && !['idle', 'setup'].includes(mockPhase)) {
        alert('Finish or restart the current mock before changing level.');
        return;
    }
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
    if (isMockExam && mode !== 'exam') {
        alert('Finish or restart the current mock before opening Study Mode.');
        return;
    }
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
    let opinionUnitGrid = null;
    DATA.forEach((item) => { 
        if (item.opinion && !opinionUnitGrid) {
            const wrapper = document.createElement('div');
            wrapper.className = 'opinion-unit-wrap';
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'opinion-unit-btn';
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = `<strong>⭐ Extra Opinion Training</strong><small>Entrenamiento extra de opinión · útil para todos</small>`;
            toggle.onclick = () => toggleOpinionUnit(toggle);
            wrapper.appendChild(toggle);
            opinionUnitGrid = document.createElement('div');
            opinionUnitGrid.className = 'opinion-subtopic-grid';
            opinionUnitGrid.style.display = 'none';
            wrapper.appendChild(opinionUnitGrid);
            g.appendChild(wrapper);
        }
        const b = document.createElement('button'); 
        b.className = item.opinion ? 'topic-btn opinion-topic-btn' : 'topic-btn';
        b.innerText = item.title; 
        b.onclick = () => { 
            if (isMockExam) {
                resetMockState();
                document.getElementById('mockPanel').style.display = 'none';
                document.querySelector('.rp-selector').style.display = '';
            }
            document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
            b.classList.add('active'); 
            currentTopic = item; 
            
            if(currentMode === 'study') {
                renderCheckpoints();
                scrollToVisibleSection('studyContainer');
            } else {
                updateQuestion(); 
            }
        }; 
        (item.opinion ? opinionUnitGrid : g).appendChild(b);
    }); 
}

function toggleOpinionUnit(button) {
    const subtopics = button.parentElement.querySelector('.opinion-subtopic-grid');
    const isOpen = subtopics.style.display !== 'none';
    subtopics.style.display = isOpen ? 'none' : 'grid';
    button.setAttribute('aria-expanded', String(!isOpen));
}

function toggleHint() {
    const box = document.getElementById('hintBox');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

let speechRequestId = 0;

function speakWithBrowserTTS(text) {
    const synth = window.speechSynthesis;
    if (!synth || !text || !text.trim()) return;

    const requestId = ++speechRequestId;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.onerror = event => console.warn('Speech playback failed:', event.error);

    // A short delay helps mobile browsers finish cancelling before starting
    // the replacement utterance.
    window.setTimeout(() => {
        if (requestId === speechRequestId) synth.speak(utterance);
    }, 120);
}

function speakText() {
    const rawHTML = document.getElementById('qDisplay').innerHTML;
    const mockPrompt = isMockExam && mockPhase === 'conversation' ? mockQuestions[mockIndex]?.prompt : null;
    const source = mockPrompt || rawHTML;
    const t = source.replace(/<[^>]*>/g, " ").replace(/\(PASADO\)|\(FUTURO\)/g, "").replace(/HL|OL/g, "").replace(/[0-9]\./g, "");
    speakWithBrowserTTS(t);
}

// === MOCK EXAM ===
function resetMockState() {
    isMockExam = false;
    mockPhase = 'idle';
    mockQuestions = [];
    mockIndex = 0;
    mockAnswers = [];
    mockSelectedRoleplays = [];
    mockChosenRoleplay = null;
    mockConversationScore = null;
    mockRoleplayScore = null;
    mockOpinionQuestion = null;
    mockOpinionCompleted = false;
}

function startMockExam() {
    setMode('exam');
    resetMockState();
    isMockExam = true;
    mockPhase = 'setup';
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active'));
    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('studyContainer').style.display = 'none';
    document.querySelector('.rp-selector').style.display = '';
    renderMockRoleplaySelection();
}

function renderMockRoleplaySelection() {
    const panel = document.getElementById('mockPanel');
    panel.style.display = 'block';
    panel.innerHTML = `<div class="mock-step-label">FULL MOCK · ${escapeHTML(currentLevel)}</div>
        <h3>First, choose 3 role plays</h3>
        <p>You will answer six conversation questions: four general topics, one past question and one future question. After the conversation, the mock will randomly choose one of your three role plays.</p>
        <div class="mock-rp-grid">${Object.entries(ROLEPLAY_LABELS).map(([id, label]) => `<button type="button" class="mock-rp-option" data-mock-rp="${id}" aria-pressed="false" onclick="toggleMockRoleplaySelection(${id}, this)"><span>RP ${id}</span>${escapeHTML(label)}</button>`).join('')}</div>
        <p id="mockSelectionCount" class="mock-selection-count">Choose 3 of 5</p>
        <button id="mockBeginBtn" class="btn-main" type="button" onclick="beginMockConversation()" disabled>Start conversation</button>`;
}

function toggleMockRoleplaySelection(id, button) {
    const selectedIndex = mockSelectedRoleplays.indexOf(id);
    if (selectedIndex >= 0) {
        mockSelectedRoleplays.splice(selectedIndex, 1);
        button.classList.remove('selected');
        button.setAttribute('aria-pressed', 'false');
    } else if (mockSelectedRoleplays.length < 3) {
        mockSelectedRoleplays.push(id);
        button.classList.add('selected');
        button.setAttribute('aria-pressed', 'true');
    }
    const count = document.getElementById('mockSelectionCount');
    const begin = document.getElementById('mockBeginBtn');
    count.innerText = mockSelectedRoleplays.length === 3 ? 'Three selected — ready to begin' : `Choose ${3 - mockSelectedRoleplays.length} more`;
    begin.disabled = mockSelectedRoleplays.length !== 3;
}

function beginMockConversation() {
    if (mockSelectedRoleplays.length !== 3) return;
    mockChosenRoleplay = mockSelectedRoleplays[Math.floor(Math.random() * mockSelectedRoleplays.length)];
    mockPhase = 'conversation';
    mockIndex = 0;
    mockAnswers = [];

    // Topics 12-15 already focus on holidays/past/future, so the four general
    // questions come from topics 1-11 to keep the time-frame questions distinct.
    const generalTopics = DATA.slice(0, 11).sort(() => Math.random() - 0.5).slice(0, 4);
    const pastPrompt = PAST_Q[Math.floor(Math.random() * PAST_Q.length)];
    const futurePrompt = FUT_Q[Math.floor(Math.random() * FUT_Q.length)];
    mockQuestions = generalTopics.map(topic => ({
        prompt: getExamPrompt(topic),
        guidance: getExamGuidance(topic),
        topic
    })).concat([
        { ...pastPrompt, guidance: currentLevel === 'HL' ? pastPrompt.guidance : [], label: 'PASADO' },
        { ...futurePrompt, guidance: currentLevel === 'HL' ? futurePrompt.guidance : [], label: 'FUTURO' }
    ]);
    showMockQuestion();
}

function renderMockProgress() {
    const panel = document.getElementById('mockPanel');
    panel.style.display = 'block';
    panel.innerHTML = `<div class="mock-progress-row"><strong>Conversation</strong><span>${Math.min(mockIndex + 1, 6)} of 6</span></div>
        <div class="mock-progress-track"><span style="width:${Math.min(((mockIndex + 1) / 6) * 100, 100)}%"></span></div>
        <p class="mock-small-note">Your selected role play will be revealed after the conversation.</p>`;
}

function showMockQuestion() {
    const item = mockQuestions[mockIndex];
    renderMockProgress();
    document.getElementById('exerciseArea').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('qDisplay').innerHTML = `<strong>Question ${mockIndex + 1}/6${item.label ? ` · ${escapeHTML(item.label)}` : ''}:</strong><br><br>${escapeHTML(item.prompt)}`;
    document.getElementById('userInput').value = '';
    showExamGuidance(item.guidance, item.topic ? getExamGuidanceBilingual(item.topic) : null);
    scrollToVisibleSection('exerciseArea');
}

function nextMockQuestion() {
    mockIndex++;
    showMockQuestion();
}

function calculateMockConversationScore() {
    if (!mockAnswers.length) return 0;
    const average = mockAnswers.reduce((sum, item) => sum + item.score, 0) / mockAnswers.length;
    return Math.max(0, Math.min(70, Math.round(average * 0.7)));
}

function finishMockConversation() {
    mockConversationScore = calculateMockConversationScore();
    mockPhase = 'transition';
    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    const panel = document.getElementById('mockPanel');
    const opinionOption = currentLevel === 'HL'
        ? `<div class="mock-opinion-card"><h4>⭐ Optional examiner extension</h4><p>When a conversation is going well, an examiner may explore a broader opinion. This extra question gives you that challenge, but it will not change your mark out of 70.</p><button class="btn-main mock-secondary" type="button" onclick="startMockOpinion()">Try an opinion question</button></div>`
        : '';
    panel.innerHTML = `<div class="mock-step-label">CONVERSATION COMPLETE</div>
        <div class="mock-score-preview"><strong>${mockConversationScore}/70</strong><span>Indicative conversation mark</span></div>
        ${opinionOption}
        <button class="btn-main" type="button" onclick="startMockRoleplay()">Continue to role play →</button>`;
}

function startMockOpinion() {
    mockPhase = 'opinion';
    mockOpinionQuestion = OPINION_Q[Math.floor(Math.random() * OPINION_Q.length)];
    document.getElementById('mockPanel').innerHTML = `<div class="mock-step-label">OPTIONAL EXTENSION</div><p class="mock-small-note">This question is extra practice and is not included in the conversation mark.</p>`;
    document.getElementById('exerciseArea').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('qDisplay').innerHTML = `<strong>Optional opinion question:</strong><br><br>${escapeHTML(mockOpinionQuestion.prompt)}`;
    document.getElementById('userInput').value = '';
    showExamGuidance(mockOpinionQuestion.guidance);
}

function startMockRoleplay() {
    mockPhase = 'roleplay';
    document.getElementById('mockPanel').style.display = 'none';
    switchTab('role');
    const selector = document.querySelector('.rp-selector');
    selector.style.display = 'none';
    const chosenButton = document.querySelector(`.rp-btn-select[data-rp-id="${mockChosenRoleplay}"]`);
    seleccionarRP(mockChosenRoleplay, chosenButton, true);
    document.getElementById('rpContext').insertAdjacentHTML('afterbegin', `<div class="mock-roleplay-reveal"><span>Your role play</span><strong>RP ${mockChosenRoleplay}: ${escapeHTML(ROLEPLAY_LABELS[mockChosenRoleplay])}</strong></div>`);
}

function restartMockExam() {
    document.querySelector('.rp-selector').style.display = '';
    switchTab('conv');
    startMockExam();
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('studyContainer').style.display = 'none'; 
    
    document.getElementById('qDisplay').innerText = getExamPrompt(currentTopic);
    document.getElementById('userInput').value = "";

    showExamGuidance(getExamGuidance(currentTopic), getExamGuidanceBilingual(currentTopic));
    scrollToVisibleSection('exerciseArea');
}

function showExamGuidance(points, bilingualPoints = null) {
    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    if (!hintBox || !btnHint) return;
    hintBox.style.display = 'none';
    btnHint.style.display = points && points.length ? 'inline-block' : 'none';
    if (!points || !points.length) {
        hintBox.innerHTML = '';
        return;
    }
    const displayPoints = bilingualPoints && bilingualPoints.length
        ? bilingualPoints
        : points.map(es => ({ es, en: '' }));
    hintBox.innerHTML = `<strong>💡 Ideas, no una lista obligatoria:</strong><p>Elige las ideas que te permitan desarrollar mejor tu respuesta:</p><ul class="bilingual-guidance">${displayPoints.map(point => `<li><span class="target-language">${escapeHTML(point.es)}</span>${point.en ? `<span class="english-support">${escapeHTML(point.en)}</span>` : ''}</li>`).join('')}</ul>`;
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    if(isMockExam) {
        resetMockState();
        document.getElementById('mockPanel').style.display = 'none';
        document.querySelector('.rp-selector').style.display = '';
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

  const optionalOpinion = isMockExam && mockPhase === 'opinion';
  const mockItem = optionalOpinion ? mockOpinionQuestion : (isMockExam && mockPhase === 'conversation' ? mockQuestions[mockIndex] : null);
  const questionContext = mockItem ? mockItem.prompt : getExamPrompt(currentTopic);
  const guidance = mockItem ? mockItem.guidance : getExamGuidance(currentTopic);
  const levelExpectation = currentLevel === 'HL'
      ? 'Expect a clear, autonomous and developed response with reasons, examples, a useful range of familiar vocabulary and some linking. A very strong H1-level response is excellent senior-cycle performance, not native-speaker or bilingual performance.'
      : 'Prioritise successful communication and a relevant response. Accept simple, accurate language and do not penalise the learner for limited complexity.';
  const scoreCalibration = currentLevel === 'HL' ? `
    HL OFFICIAL-BAND EXPERIMENT — GENERAL CONVERSATION /70:
    First decide which Leaving Certificate conversation band best matches the performance. Only then choose a mark within that band. Do NOT start from a percentage and convert it.

    Use these official-style band anchors:
    - BAND 1 — FLUENT — 65 or 70: pro-active; significant autonomy/spontaneity; expands and develops ideas with at most occasional prompting; grammatical inaccuracies are mostly slip-of-the-tongue type; self-correction may occur. From a transcript, judge only what is visible in the language and development; do not infer pronunciation, intonation or actual examiner prompting.
    - BAND 2 — EFFECTIVE / COMPETENT — 55 or 60: ready, effective communication; syntax and idiom generally sound; inaccuracies do not impede communication; awareness or attempted correction may be present.
    - BAND 3 — COMPETENT / ADEQUATE — 45 or 50: generally good comprehension/response; straightforward expression; some hesitation or increasing inaccuracies may be evident, but meaning remains clear.
    - BAND 4 — ADEQUATE / LIMITED — 30, 35 or 40: understandable in uncomplicated contexts but with noticeable syntactic lapses; inaccuracies impede at times but do not usually distort communication.
    - BAND 5 — LIMITED / DEFICIENT — 20 or 25: hesitant, disjointed or incomplete response; recurrent inaccuracies tend to distort meaning and substantially reduce coherent communication.
    - BAND 6 — MINIMAL — 10 or 15: very limited comprehensible language; often inadequate or incoherent; accuracy is scarcely relevant.
    - BAND 7 — NON-PERFORMING — 0 or 5.

    IMPORTANT:
    - A top-band mark does NOT require error-free, native-speaker or C1/C2 Spanish. The official top band explicitly allows grammatical inaccuracies, mainly slips.
    - Do not withhold Band 1 merely because extra idioms, rarer vocabulary, more tenses or more sophisticated structures could be added.
    - Evaluate what the learner successfully communicates and how securely they control it. Weigh inaccuracies by frequency, seriousness and effect on communication.
    - Because this is a transcript, do not assess pronunciation, intonation, pauses, real-time fluency or examiner support.
    - Return one of these marks only: 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70.
    - Also return the chosen band number (1-7). The numerical mark must belong to that band.` : '';

  const prompt = `
    ROLE: You are a supportive but realistic Leaving Certificate Spanish oral teacher in Ireland.
    TASK: Evaluate one uninterrupted spoken response to a broad conversation topic.
    TOPIC: ${JSON.stringify(questionContext)}
    STUDENT TRANSCRIPT: ${JSON.stringify(t)}
    LEVEL: ${currentLevel}
    LEVEL EXPECTATION: ${levelExpectation}
    POSSIBLE CONTENT: ${JSON.stringify(guidance)}

    IMPORTANT ASSESSMENT RULES:
    - POSSIBLE CONTENT is guidance, not a compulsory checklist. Do not deduct marks simply because an item is omitted.
    - Apply the LEVEL EXPECTATION above. Do not judge an OL response by HL expectations.
    - At HL, reward relevant development, reasons, examples, detail, varied vocabulary, connectors and appropriate use of time frames.
    - A high HL score does not require idioms, subjunctive, conditional forms, multiple tenses in every answer or native-like spontaneity. Advanced structures are optional evidence of extra control, not prerequisites for an H1-level performance.
    - At OL, reward clear communication and relevant basic information; suggestions must be simple and achievable.
    - Be encouraging and confidence-building, while identifying one or two realistic next steps.
    - This is raw speech-to-text. Ignore punctuation, capitalisation and accent marks. Never deduct for commas, full stops or question marks.
    - Do not assess pronunciation, intonation, pauses or fluency from a written transcript.
    - Only flag a grammar or vocabulary error when it is clearly a genuine language error and not a likely transcription artefact.
    - Avoid demanding memorised idioms or unnatural language.
    ${scoreCalibration}
    - Return valid JSON only, with no markdown.

    OUTPUT SCHEMA:
    ${currentLevel === 'HL' ? `{
      "band": 1-7,
      "score": "one allowed mark from the /70 band scale",
      "feedback_es": "Short encouraging overview in Spanish",
      "feedback_en": "Short clear overview in English",
      "strengths": ["up to 3 specific strengths"],
      "next_steps": ["up to 2 achievable improvements"],
      "connectors": ["up to 3 suitable Spanish connectors"],
      "vocabulary_suggestions": [{ "basic": "word or phrase used/repeated", "richer": "natural alternative" }],
      "errors": [{ "original": "...", "correction": "...", "explanation_en": "..." }]
    }` : `{
      "score": 0-100,
      "feedback_es": "Short encouraging overview in Spanish",
      "feedback_en": "Short clear overview in English",
      "strengths": ["up to 3 specific strengths"],
      "next_steps": ["up to 2 achievable improvements"],
      "connectors": ["up to 3 suitable Spanish connectors"],
      "vocabulary_suggestions": [{ "basic": "word or phrase used/repeated", "richer": "natural alternative" }],
      "errors": [{ "original": "...", "correction": "...", "explanation_en": "..." }]
    }`}

  `;

  try {
    const rawText = await callSmartAI(prompt);
    
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    const j = JSON.parse(cleanJson);
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    
    const s = document.getElementById('scoreDisplay');
    const rawScore = Number(j.score) || 0;
    const safeScore = currentLevel === 'HL'
        ? Math.max(0, Math.min(70, rawScore))
        : Math.max(0, Math.min(100, rawScore));
    const scorePercent = currentLevel === 'HL' ? (safeScore / 70) * 100 : safeScore;
    s.innerText = currentLevel === 'HL'
        ? (optionalOpinion ? `Optional practice: ${safeScore}/70` : `Score: ${safeScore}/70`)
        : (optionalOpinion ? `Optional practice: ${safeScore}%` : `Score: ${safeScore}%`);
    const positiveScoreThreshold = currentLevel === 'HL' ? (55 / 70 * 100) : 85;
    s.style.color = scorePercent >= positiveScoreThreshold ? "#166534" : (scorePercent >= 50 ? "#ca8a04" : "#991b1b");

    document.getElementById('fbES').innerText = "🇪🇸 " + j.feedback_es;
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    
    const l = document.getElementById('errorsList'); l.innerHTML = "";
    if (j.strengths && j.strengths.length) {
        l.innerHTML += `<div class="feedback-section-card feedback-strength"><strong>✅ What worked well</strong><ul>${j.strengths.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ul></div>`;
    }
    if (j.next_steps && j.next_steps.length) {
        l.innerHTML += `<div class="feedback-section-card feedback-next"><strong>🎯 Next steps</strong><ul>${j.next_steps.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ul></div>`;
    }
    if (j.connectors && j.connectors.length) {
        l.innerHTML += `<div class="feedback-section-card"><strong>🔗 Connectors to try</strong><p>${j.connectors.map(escapeHTML).join(' · ')}</p></div>`;
    }
    if (j.vocabulary_suggestions && j.vocabulary_suggestions.length) {
        l.innerHTML += `<div class="feedback-section-card"><strong>🧠 Richer vocabulary</strong><ul>${j.vocabulary_suggestions.map(v => `<li>${escapeHTML(v.basic)} → <b>${escapeHTML(v.richer)}</b></li>`).join('')}</ul></div>`;
    }
    if(j.errors && j.errors.length > 0) {
        l.innerHTML += '<div class="feedback-section-card"><strong>✍️ Language corrections</strong></div>';
        j.errors.forEach(e => { l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${escapeHTML(e.original)}</span> ➡️ <b>${escapeHTML(e.correction)}</b> (💡 ${escapeHTML(e.explanation_en)})</div>`; });
    } else {
        l.innerHTML += "<div style='color:#166534; font-weight:bold;'>✅ No significant language errors found in the transcript.</div>";
    }

    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockPhase === 'conversation') {
        mockAnswers.push({
            number: mockIndex + 1,
            label: mockItem.label || (mockItem.topic ? mockItem.topic.title : `Question ${mockIndex + 1}`),
            prompt: mockItem.prompt,
            score: currentLevel === 'HL' ? scorePercent : safeScore,
            feedback_es: j.feedback_es || ''
        });
        if (mockIndex < 5) {
            btnReset.innerText = "➡️ Next Question";
            btnReset.onclick = nextMockQuestion;
        } else {
            btnReset.innerText = "✅ Complete Conversation";
            btnReset.onclick = finishMockConversation;
        }
    } else if (optionalOpinion) {
        mockOpinionCompleted = true;
        btnReset.innerText = "Continue to role play →";
        btnReset.onclick = startMockRoleplay;
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
async function askAIConcept(concept, kind = 'language') {
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; 
    box.innerHTML = "⏳ <b>Consulting AI Teacher...</b>";

    const prompt = `
        ROLE: Supportive Leaving Certificate Spanish oral teacher in Ireland.
        TOPIC: ${JSON.stringify(currentTopic ? currentTopic.title : 'General')}
        LEVEL: ${currentLevel}
        LEVEL EXPECTATION: ${currentLevel === 'HL' ? 'Help the learner develop and extend a Higher Level response. Advanced language is optional enrichment, not a requirement for H1.' : 'Keep support simple, practical and suitable for Ordinary Level.'}
        STUDY ITEM TYPE: ${kind}
        STUDY ITEM: ${JSON.stringify(concept)}

        Help the learner prepare ideas for a natural spoken response. Do not write a long answer for memorisation.
        If this is a practice question, give a simple three-part speaking plan and useful language.
        If this is a content idea or language feature, explain how it can improve the oral answer.
        Use natural Peninsular Spanish suitable for a secondary-school learner.
        Keep the explanation in English and supportive. Return valid JSON only, with no markdown.

        OUTPUT SCHEMA:
        {
          "explanation_en": "maximum 70 words",
          "speaking_plan": ["up to 3 short steps"],
          "examples": [{ "es": "short natural Spanish phrase", "en": "English meaning" }],
          "challenge": "one optional sentence challenge"
        }
    `;

    try {
        const text = await callSmartAI(prompt);
        const cleanText = text.replace(/```json|```/g, "").trim();
        const result = JSON.parse(cleanText);
        const plan = Array.isArray(result.speaking_plan) && result.speaking_plan.length
            ? `<div class="ai-study-part"><strong>🗣️ Speaking plan</strong><ol>${result.speaking_plan.map(x => `<li>${escapeHTML(x)}</li>`).join('')}</ol></div>`
            : '';
        const examples = Array.isArray(result.examples) && result.examples.length
            ? `<div class="ai-study-part"><strong>💬 Useful Spanish</strong><ul>${result.examples.map(x => `<li><b>${escapeHTML(x.es)}</b> — ${escapeHTML(x.en)}</li>`).join('')}</ul></div>`
            : '';
        const challenge = result.challenge
            ? `<div class="study-challenge"><strong>⭐ Challenge:</strong> ${escapeHTML(result.challenge)}</div>`
            : '';
        
        box.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <strong>💡 ${kind === 'question' ? 'Practice question' : 'Study help'}: ${escapeHTML(concept)}</strong>
                <button onclick="this.parentElement.parentElement.style.display='none'" style="background:none;border:none;cursor:pointer;">✖️</button>
            </div>
            <hr>
            <p>${escapeHTML(result.explanation_en || '')}</p>
            ${plan}
            ${examples}
            ${challenge}
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

    const guide = getTopicGuide(currentTopic);
    const contentIdeas = [...guide.ideas, ...guide.hlIdeas];

    container.innerHTML = `
        <h3>📚 Study Mode: ${currentTopic.title}</h3>
        <p class="study-intro">${currentTopic.opinion
            ? 'Extra opinion training: these questions are not asked in every oral, but they help every learner practise giving a view, explaining reasons and supporting an answer with an example.'
            : (currentLevel === 'HL'
                ? 'Prepare ideas and useful language before you practise speaking. These are suggestions, not a script or a compulsory checklist.'
                : 'Review the essential language and prepare a few common questions before you practise speaking.')}</p>
        <div id="checkpointsList"></div> 
        <div id="aiExplanationBox" class="ai-box" style="display:none;"></div>
    `;

    const list = document.getElementById('checkpointsList');
    
    const createSection = (title, items, cssClass, kind = 'language', translations = null) => {
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
        
        items.forEach((point, index) => {
            const btn = document.createElement('button'); 
            btn.className = `check-btn ${cssClass}`; 
            const translation = translations && translations[index];
            btn.innerHTML = `${kind === 'question' ? '❓' : (kind === 'content' ? '💡' : '🗣️')} <span>${escapeHTML(point)}</span>${translation ? `<small class="english-support">${escapeHTML(translation)}</small>` : ''}`;
            btn.onclick = () => askAIConcept(point, kind);
            grid.appendChild(btn);
        });
        list.appendChild(grid);
    };

    if (currentLevel === 'HL') {
        const guideTranslations = TOPIC_GUIDE_TRANSLATIONS[DATA.indexOf(currentTopic)];
        const contentTranslations = guideTranslations ? [...guideTranslations.ideas, ...guideTranslations.hlIdeas] : null;
        createSection("💡 Ideas you could include", contentIdeas, "btn-content", "content", contentTranslations);
        createSection("❓ Questions to prepare", guide.questions, "btn-question", "question");
    } else {
        createSection("❓ Questions to prepare", guide.questions.slice(0, 3), "btn-question", "question");
    }
    if (currentTopic.checkpoints_OL) createSection("🧱 Language foundations", currentTopic.checkpoints_OL, "btn-ol");
    if (currentLevel === 'HL' && currentTopic.checkpoints_HL) {
        createSection("🔧 Develop your HL answer", currentTopic.checkpoints_HL, "btn-hl");
        if(currentTopic.checkpoints_TOP) {
            createSection("🚀 Optional stretch (not required for H1)", currentTopic.checkpoints_TOP, "btn-top");
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

function seleccionarRP(id, btn, fromMock = false) {
    if (!fromMock && isMockExam) {
        resetMockState();
        document.getElementById('mockPanel').style.display = 'none';
        document.querySelector('.rp-selector').style.display = '';
    }
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
- This is an oral exam evaluated from an automatic speech-to-text transcription. Ignore punctuation, capitalisation, missing or incorrect accent marks caused by transcription, and transcription artefacts or missing punctuation around pauses. Never deduct marks for commas, full stops, question marks or the way pauses have been transcribed.
- Do not assess pronunciation, intonation, hesitation or fluency from the text transcription.
- Assess grammar only when the wording clearly indicates a genuine grammatical error rather than an STT artefact.
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
    if (isMockExam && mockPhase === 'roleplay') {
        completeMockExam(Math.max(0, Math.min(30, total)));
    }
    document.getElementById('rpChat').scrollTop = document.getElementById('rpChat').scrollHeight;
}

function completeMockExam(roleplayScore) {
    mockRoleplayScore = Math.round(Number(roleplayScore) || 0);
    mockConversationScore = mockConversationScore ?? calculateMockConversationScore();
    mockPhase = 'complete';
    const totalScore = mockConversationScore + mockRoleplayScore;
    const breakdown = mockAnswers.map(item => `<li><span>${escapeHTML(item.label)}</span><strong>${Math.round(item.score)}%</strong></li>`).join('');
    const opinionNote = currentLevel === 'HL'
        ? `<p class="mock-small-note">Optional opinion extension: <strong>${mockOpinionCompleted ? 'completed' : 'not attempted'}</strong> (not included in the mark).</p>`
        : '';
    const summary = `<section class="mock-final-summary" aria-label="Mock exam final result">
        <div class="mock-step-label">FULL MOCK COMPLETE · ${escapeHTML(currentLevel)}</div>
        <h3>Final indicative result</h3>
        <div class="mock-total-score">${totalScore}<span>/100</span></div>
        <div class="mock-score-grid">
            <div><strong>${mockConversationScore}/70</strong><span>Conversation</span></div>
            <div><strong>${mockRoleplayScore}/30</strong><span>Role play</span></div>
        </div>
        <details class="mock-breakdown"><summary>View conversation breakdown</summary><ul>${breakdown}</ul></details>
        ${opinionNote}
        <p class="evaluation-note">This is supportive AI feedback based on written or transcribed answers. It is not an official SEC result, and pronunciation or live interaction cannot be fully assessed here.</p>
        <button class="btn-main" type="button" onclick="restartMockExam()">🎲 Start another full mock</button>
    </section>`;
    document.getElementById('rpChat').insertAdjacentHTML('beforeend', summary);
}

function mostrarSugerencia() {
    const sug = RP_DB[rpActual].sugerencias[pasoActual];
    if(sug) {
        const chat = document.getElementById('rpChat');
        chat.innerHTML += `<div class="feedback-rp">💡 <b>Model Answer:</b> ${sug}</div>`; chat.scrollTop = chat.scrollHeight;
    }
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    speakWithBrowserTTS(text);
}

// Inicialización
initConv();
