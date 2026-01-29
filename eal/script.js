// ===========================================
// CONFIGURACIÓN (API KEY)
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// ===========================================
// DATOS EAL (SURVIVAL ENGLISH)
// ===========================================
const TOPICS = {
  newcomer: [
    { t: "👋 Introduction", q: "Hello! What is your name and where are you from?" },
    { t: "🏫 The Office", q: "You are in the school office. Ask for your timetable." },
    { t: "🤢 Feeling Sick", q: "You don't feel well. Tell the teacher what is wrong." },
    { t: "🚽 Toilet", q: "Ask the teacher if you can go to the toilet." },
    { t: "🛒 Shopping", q: "You are in a shop. Ask how much a sandwich costs." },
    { t: "🗺️ Directions", q: "You are lost in the corridor. Ask where Room 23 is." }
  ],
  social: [
    { t: "⚽ Hobbies", q: "What do you like to do? Do you play football?" },
    { t: "🤔 Homework", q: "You don't understand the homework. Ask the teacher for help." },
    { t: "🍔 Canteen", q: "You are in the canteen. Ask a student if you can sit with them." },
    { t: "🎮 Weekend", q: "What are you going to do this weekend?" },
    { t: "📱 Social Media", q: "Do you use TikTok or Instagram? Who do you follow?" }
  ]
};

let currentCat = 'newcomer';
let currentQ = "";
let userLanguage = "English"; // Idioma por defecto

// Detectar cambio de idioma
function updateInterfaceLang() {
  const sel = document.getElementById('nativeLang');
  userLanguage = sel.value;
  // Si quisiéramos, aquí podríamos cambiar los textos de la interfaz, 
  // pero de momento solo afecta a la IA.
}

function init() {
  const g = document.getElementById('topicGrid');
  if(!g) return;
  g.innerHTML = "";
  TOPICS[currentCat].forEach(item => {
    const b = document.createElement('button');
    b.className = 'topic-btn';
    b.innerHTML = item.t; 
    b.onclick = () => loadQ(item);
    g.appendChild(b);
  });
}

function setTopic(cat) {
  currentCat = cat;
  // Actualizar visualmente los botones
  const btns = document.querySelectorAll('.level-btn');
  btns[0].className = cat === 'newcomer' ? 'level-btn active' : 'level-btn';
  btns[1].className = cat === 'social' ? 'level-btn active' : 'level-btn';
  init();
}

function loadQ(item) {
  currentQ = item.q;
  document.getElementById('qTitle').innerText = item.t;
  document.getElementById('qDisplay').innerText = item.q;
  
  // Resetear la traducción
  document.getElementById('qTranslation').style.display = 'none';
  document.getElementById('qTranslation').innerText = "";
  
  document.getElementById('exerciseArea').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  document.getElementById('userInput').value = "";
}

// TTS (Inglés de Irlanda)
function speakText() {
  const u = new SpeechSynthesisUtterance(currentQ);
  u.lang = 'en-IE'; 
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function readInput() {
  const t = document.getElementById('userInput').value;
  if(!t) return;
  const u = new SpeechSynthesisUtterance(t);
  u.lang = 'en-IE';
  window.speechSynthesis.speak(u);
}

// --- TRADUCCIÓN SIMULTÁNEA ---
async function translateQuestion() {
  if(userLanguage === "English") return alert("Please select your native language at the top first.");
  
  const box = document.getElementById('qTranslation');
  box.style.display = 'block';
  box.innerText = "🔄 Translating...";

  const prompt = `TRANSLATE this text: "${currentQ}" into ${userLanguage}. OUTPUT ONLY THE TRANSLATION.`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const d = await r.json();
    const translation = d.candidates[0].content.parts[0].text;
    box.innerText = translation;
  } catch(e) { 
    box.innerText = "Error translating. Please try again."; 
    console.error(e);
  }
}

// --- CORRECCIÓN INTELIGENTE ---
async function analyze() {
  const t = document.getElementById('userInput').value;
  if(t.length < 2) return alert("Please write an answer first.");
  
  const btn = document.getElementById('btnAction');
  btn.disabled = true; btn.innerText = "⏳ Checking...";

  // PROMPT EAL ESPECIAL: Explica en el idioma del alumno
  const prompt = `
  ACT AS: Kind EAL English Teacher.
  STUDENT NATIVE LANGUAGE: ${userLanguage}.
  QUESTION: "${currentQ}"
  STUDENT ANSWER: "${t}"
  
  TASK: 
  1. Correct the English grammar/vocabulary.
  2. Provide simple feedback. 
  3. IMPORTANT: If the student selected a native language (not English), PROVIDE THE EXPLANATION/FEEDBACK IN THAT NATIVE LANGUAGE so they understand the correction.
  
  OUTPUT JSON ONLY: { "feedback": "Feedback in ${userLanguage}", "corrections": [{"original":"x", "fix":"y"}] }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const d = await r.json();
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());

    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    
    document.getElementById('fbText').innerHTML = `<strong>Teacher:</strong> ${j.feedback}`;
    document.getElementById('errorsList').innerHTML = j.corrections.map(c => 
      `<div class="error-item">${c.original} ➡️ <b>${c.fix}</b></div>`
    ).join('');

  } catch(e) { 
    console.log(e); 
    alert("Error connecting to AI."); 
  } 
  finally { 
    btn.disabled = false; 
    btn.innerText = "✨ Check my English"; 
  }
}

function reset() {
  document.getElementById('exerciseArea').style.display = 'none';
  document.getElementById('result').style.display = 'none';
}

window.onload = init;
