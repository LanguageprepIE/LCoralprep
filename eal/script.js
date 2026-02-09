// ===========================================
// CONFIGURACIÓN (BACKEND ACTIVADO 🔒)
// ===========================================
// La clave API ha sido eliminada. 
// Ahora nos conectamos a través de Netlify Functions.

// ===========================================
// DATOS EAL (11 TEMAS)
// ===========================================
const TOPICS = {
  newcomer: [
    { 
      t: "👋 Introduction", 
      q: "Hello! What is your name and where are you from?",
      sentences: {
        basic: ["My name is [Name].", "I am from Ukraine.", "I am 16 years old."],
        advanced: ["Hello, my name is [Name] and I come from Kyiv, Ukraine.", "I moved to Ireland two months ago.", "Nice to meet you."]
      }
    },
    { 
      t: "🏫 The Office", 
      q: "You are in the school office. Ask for your timetable.",
      sentences: {
        basic: ["Timetable, please.", "I lost my journal.", "Where is Room 23?"],
        advanced: ["Excuse me, could I please have a copy of my timetable?", "I think I lost my locker key, can you help me?", "Could you tell me where the science lab is?"]
      }
    },
    { 
      t: "🤢 Feeling Sick", 
      q: "You don't feel well. Tell the teacher what is wrong.",
      sentences: {
        basic: ["I feel sick.", "My head hurts.", "Bathroom, please."],
        advanced: ["Excuse me sir, I don't feel well. Can I go to the nurse?", "I have a bad headache and I feel dizzy.", "May I please call my parents?"]
      }
    },
    { 
      t: "🚽 Toilet", 
      q: "Ask the teacher if you can go to the toilet.",
      sentences: {
        basic: ["Toilet, please?", "Can I go?", "Emergency."],
        advanced: ["Excuse me, may I go to the bathroom?", "Is it okay if I step out for a minute?", "Where are the toilets located?"]
      }
    },
    { 
      t: "🛒 Shopping", 
      q: "You are in a shop. Ask how much a sandwich costs.",
      sentences: {
        basic: ["How much is this?", "Chicken sandwich, please.", "Here is 5 euro."],
        advanced: ["Excuse me, how much does this sandwich cost?", "Do you take card or cash only?", "Could I have a receipt, please?"]
      }
    },
    { 
      t: "🗺️ Directions", 
      q: "You are lost in the corridor. Ask where Room 23 is.",
      sentences: {
        basic: ["Where is Room 23?", "I am lost.", "Library?"],
        advanced: ["Excuse me, I'm looking for the Maths room.", "Could you show me the way to the office?", "I think I'm in the wrong building."]
      }
    }
  ],
  social: [
    { 
      t: "⚽ Hobbies", 
      q: "What do you like to do? Do you play football?",
      sentences: {
        basic: ["I like football.", "I play video games.", "I like music."],
        advanced: ["In my free time, I love playing basketball with my friends.", "I am really into drawing and listening to music.", "I used to play in a club in my country."]
      }
    },
    { 
      t: "🤔 Homework", 
      q: "You don't understand the homework. Ask the teacher for help.",
      sentences: {
        basic: ["I don't understand.", "Help me, please.", "Repeat, please."],
        advanced: ["Sorry miss, I don't understand this exercise.", "Could you explain that again, please?", "Do we have to finish this for tomorrow?"]
      }
    },
    { 
      t: "🍔 Canteen", 
      q: "You are in the canteen. Ask a student if you can sit with them.",
      sentences: {
        basic: ["Can I sit here?", "Is this free?", "My name is [Name]."],
        advanced: ["Hi! Is this seat taken?", "Do you mind if I sit with you?", "What are you eating? It looks good!"]
      }
    },
    { 
      t: "🎮 Weekend", 
      q: "What are you going to do this weekend?",
      sentences: {
        basic: ["I sleep.", "I play football.", "I watch TV."],
        advanced: ["I'm planning to go to the cinema with friends.", "I have a match on Saturday morning.", "Just relaxing and doing some homework."]
      }
    },
    { 
      t: "📱 Social Media", 
      q: "Do you use TikTok or Instagram? Who do you follow?",
      sentences: {
        basic: ["I use TikTok.", "I like funny videos.", "I send messages."],
        advanced: ["I spend a lot of time on TikTok watching funny videos.", "I use Instagram to chat with my friends back home.", "I don't really like social media, I prefer playing games."]
      }
    }
  ]
};

let currentCat = 'newcomer';
let currentItem = null;
let userLanguage = "English"; 

function updateInterfaceLang() {
  const sel = document.getElementById('nativeLang');
  userLanguage = sel.value;
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
  const btnNewcomer = document.getElementById('btnNewcomer');
  const btnSocial = document.getElementById('btnSocial');
  
  if (cat === 'newcomer') {
      btnNewcomer.classList.add('active');
      btnSocial.classList.remove('active');
  } else {
      btnSocial.classList.add('active');
      btnNewcomer.classList.remove('active');
  }
  init();
}

function loadQ(item) {
  currentItem = item;
  document.getElementById('qTitle').innerText = item.t;
  document.getElementById('qDisplay').innerText = item.q;
  
  // Resetear interfaz
  document.getElementById('qTranslation').style.display = 'none';
  document.getElementById('qTranslation').innerText = "";
  document.getElementById('helperArea').style.display = 'none'; 
  
  document.getElementById('exerciseArea').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  document.getElementById('userInput').value = "";
}

// --- FUNCIÓN DE FRASES DE AYUDA ---
function toggleHelpers() {
  const area = document.getElementById('helperArea');
  if(area.style.display === 'block') {
    area.style.display = 'none';
    return;
  }
  
  area.style.display = 'block';
  const basicList = document.getElementById('basicSentences');
  const advList = document.getElementById('advSentences');
  
  basicList.innerHTML = "";
  advList.innerHTML = "";

  currentItem.sentences.basic.forEach(s => {
    const safeText = s.replace(/'/g, "\\'");
    basicList.innerHTML += `<div class="helper-item" onclick="useHelper('${safeText}')">🟢 ${s}</div>`;
  });

  currentItem.sentences.advanced.forEach(s => {
    const safeText = s.replace(/'/g, "\\'");
    advList.innerHTML += `<div class="helper-item" onclick="useHelper('${safeText}')">🔵 ${s}</div>`;
  });
}

function useHelper(text) {
  document.getElementById('userInput').value = text;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-IE';
  window.speechSynthesis.speak(u);
}

// TTS (Inglés de Irlanda)
function speakText() {
  const u = new SpeechSynthesisUtterance(currentItem.q);
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

// Traducción Simultánea (VÍA BACKEND)
async function translateQuestion() {
  if(userLanguage === "English") return alert("Please select your native language at the top first.");
  const box = document.getElementById('qTranslation');
  box.style.display = 'block';
  box.innerText = "🔄 Translating...";
  const prompt = `TRANSLATE this text: "${currentItem.q}" into ${userLanguage}. OUTPUT ONLY THE TRANSLATION.`;
  
  try {
    const r = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!r.ok) throw new Error("Backend Error");
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    
    box.innerText = d.candidates[0].content.parts[0].text;
  } catch(e) { 
      console.error(e);
      box.innerText = "⚠️ The AI is a bit busy. Please try again."; 
  }
}

// Corrección Inteligente (EAL) (VÍA BACKEND)
async function analyze() {
  const t = document.getElementById('userInput').value;
  if(t.length < 2) return alert("Please write an answer first.");
  const btn = document.getElementById('btnAction');
  btn.disabled = true; btn.innerText = "⏳ Checking...";

  const prompt = `
  ACT AS: Kind EAL English Teacher.
  STUDENT NATIVE LANGUAGE: ${userLanguage}.
  QUESTION: "${currentItem.q}"
  STUDENT ANSWER: "${t}"
  TASK: Correct the English grammar/vocabulary. Provide simple feedback. 
  IMPORTANT: If the student's native language is NOT English, PROVIDE THE MAIN FEEDBACK IN THAT NATIVE LANGUAGE (${userLanguage}) so they understand.
  OUTPUT JSON ONLY: { "feedback": "Feedback string (in native lang if possible)", "corrections": [{"original":"x", "fix":"y"}] }`;

  try {
    const r = await fetch('/.netlify/functions/gemini', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!r.ok) throw new Error("Backend Error");
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);

    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('fbText').innerHTML = `<strong>Teacher:</strong> ${j.feedback}`;
    document.getElementById('errorsList').innerHTML = j.corrections.map(c => `<div class="error-item">${c.original} ➡️ <b>${c.fix}</b></div>`).join('');
  } catch(e) { 
      console.log(e); 
      alert("⚠️ The AI is a bit busy right now (High Traffic). Please wait 10 seconds and try again!"); 
  } 
  finally { btn.disabled = false; btn.innerText = "✨ Check my English"; }
}

function reset() {
  document.getElementById('exerciseArea').style.display = 'none';
  document.getElementById('result').style.display = 'none';
}

window.onload = init;
