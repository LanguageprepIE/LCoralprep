// ===========================================
// CONFIGURACIÓN (BACKEND NETLIFY ACTIVADO 🔒)
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
// EAL DATA (IRISH CONTEXT)
// ===========================================
const EAL_DATA = [
  { 
    title: "1. Myself & Background", 
    Basic: "What is your name? Where are you from? When did you come to Ireland?", 
    Advanced: "Tell me about yourself and your home country. How is life in Ireland different from your home country?",
    check_Advanced: "Name, Age, Country of origin, Comparison of cultures/weather, Use of Past Simple (I moved...) and Present Perfect (I have lived here for...).",
    checkpoints_Basic: ["Basic details (I am from...)", "Arrival in Ireland (I came in...)", "Family members"],
    checkpoints_Advanced: ["Cultural differences (Weather, food)", "Missing home (I miss...)", "Adapting to Ireland (At first it was hard, but...)"],
    checkpoints_TOP: ["✨ Idiom: To feel homesick", "✨ Grammar: Used to + infinitive (I used to live...)", "✨ Vocab: Culture shock"]
  },
  { 
    title: "2. School in Ireland", 
    Basic: "Do you like your school? What subjects do you study?", 
    Advanced: "Tell me about your school experience in Ireland. How does the educational system compare to your country?",
    check_Advanced: "Opinion on the school, Uniforms, Subjects, Differences in teaching style, Rules.",
    checkpoints_Basic: ["Subjects (Maths, English...)", "The Uniform (I have to wear...)", "Favourite teacher"],
    checkpoints_Advanced: ["The Leaving Cert / Points system", "Transition Year (TY)", "Strict vs Relaxed rules"],
    checkpoints_TOP: ["✨ Idiom: To learn by heart", "✨ Grammar: Conditional (If I could change the rules...)", "✨ Vocab: Continuous assessment"]
  },
  { 
    title: "3. Hobbies & Free Time", 
    Basic: "What do you do in your free time? Do you play sports?", 
    Advanced: "What are your main hobbies? Do you think teenagers spend too much time on screens nowadays?",
    check_Advanced: "Types of hobbies, Frequency, Opinion on technology/social media, Benefits of sports.",
    checkpoints_Basic: ["Sports & Games (I play...)", "Weekends (I go to the cinema)", "Music & Movies"],
    checkpoints_Advanced: ["Irish sports (GAA, Hurling, Gaelic football)", "Screen time limits", "Mental health benefits of hobbies"],
    checkpoints_TOP: ["✨ Idiom: To be a couch potato", "✨ Grammar: I have been playing [sport] for X years", "✨ Vocab: To unwind"]
  },
  { 
    title: "4. My Area & Town", 
    Basic: "Where do you live in Ireland? Is there a park or shops near your house?", 
    Advanced: "Describe your local area. What facilities are there for young people? Is public transport good?",
    check_Advanced: "Location, Facilities (youth clubs, pitches), Public transport (Leap card, buses), Advantages and Disadvantages.",
    checkpoints_Basic: ["Location (I live in...)", "Places (Supermarket, park, pharmacy)", "Opinion (It is quiet/noisy)"],
    checkpoints_Advanced: ["Public transport reliability", "Anti-social behaviour", "What the council could improve"],
    checkpoints_TOP: ["✨ Idiom: In the middle of nowhere", "✨ Grammar: There should be more...", "✨ Vocab: Amenities / Facilities"]
  },
  { 
    title: "5. Food & Diet", 
    Basic: "What is your favourite food? Do you bring a packed lunch to school?", 
    Advanced: "Tell me about your diet. Have you tried any typical Irish food? How does it compare to food from your country?",
    check_Advanced: "School lunches, Healthy vs Unhealthy eating, Irish food (stew, chicken fillet rolls), Home-cooked meals.",
    checkpoints_Basic: ["Breakfast & Lunch (I eat...)", "Snacks at the break", "Favourite meals"],
    checkpoints_Advanced: ["The deli counter culture (Chicken fillet rolls)", "Traditional dishes from my country", "Eating a balanced diet"],
    checkpoints_TOP: ["✨ Idiom: I have a sweet tooth", "✨ Grammar: I prefer cooking rather than ordering", "✨ Vocab: Processed food"]
  },
  { 
    title: "6. Future Plans", 
    Basic: "What do you want to be when you finish school? Do you want to go to college?", 
    Advanced: "What are your plans for after the Leaving Cert? Would you like to stay in Ireland or travel?",
    check_Advanced: "Future simple (I will study...), Conditional (I would like to...), College/Apprenticeship, Career goals.",
    checkpoints_Basic: ["Jobs (Doctor, Mechanic, IT...)", "Going to University", "Living in Ireland"],
    checkpoints_Advanced: ["CAO points pressure", "Doing a PLC (Post Leaving Cert course)", "Taking a Gap Year"],
    checkpoints_TOP: ["✨ Idiom: The world is your oyster", "✨ Grammar: When I finish school, I will...", "✨ Vocab: Work experience"]
  }
];

// ===========================================
// ROLEPLAYS DATA (IRISH CONTEXT)
// ===========================================
const RP_DB = {
    1: { 
        context: "Situation: The Deli Counter. You are in a Spar or Centra during lunchtime.", 
        dialogs: ["Hiya! Who's next? What can I get for you?", "No problem. Do you want butter or mayo on that?", "Right. Plain or spicy chicken?", "Grand. Do you want cheese or lettuce with that?", "Here you go. Do you want that cut in half?"], 
        instructions: [
            "Say hello and ask for a chicken fillet roll, please.",
            "Say you would like mayonnaise.",
            "Say spicy chicken, please.",
            "Say just lettuce, no cheese.",
            "Say yes, please, and say thank you."
        ],
        sugerencias: ["Hi, can I have a chicken fillet roll, please?", "Mayo, please.", "Spicy, please.", "Just lettuce, no cheese.", "Yes, please. Thanks a million!"] 
    },
    2: { 
        context: "Situation: The Bus. You are getting on the bus but your Leap Card isn't working.", 
        dialogs: ["Where are you heading to?", "That's two euros, tap your Leap Card there on the right.", "It says 'Card Invalid'. Have you got any credit left?", "You have to pay with coins then. Exact fare only, I can't give change.", "Just drop the two euros in the machine there and grab your ticket."], 
        instructions: [
            "Tell the driver you are going to the City Centre.",
            "Tap your card (simulate) and say 'Okay'.",
            "Say you topped it up yesterday on your phone, so you don't understand why it's not working.",
            "Say you only have a 5 euro note, ask if that is okay.",
            "Say thank you and take your ticket."
        ],
        sugerencias: ["City centre, please.", "Okay.", "I topped it up yesterday on my phone, I don't know why it's not working.", "I only have a 5 euro note, is that okay? I don't have coins.", "Thanks, cheers."] 
    },
    3: { 
        context: "Situation: The Year Head. You missed school yesterday and didn't bring a note.", 
        dialogs: ["Come in. I noticed you were absent yesterday. Have you got a note from your parents?", "You know the school rules. Why didn't they write it?", "I understand. But we need a record. Can they email the office?", "That's fine. What was wrong with you yesterday anyway?", "Well, make sure you catch up on the homework you missed."], 
        instructions: [
            "Say sorry, you don't have a note today.",
            "Explain that your parents don't speak English very well and they couldn't write it.",
            "Say yes, you will ask your older sister to help them send an email tonight.",
            "Say you had a bad stomach ache and a fever.",
            "Say you will ask your friends for the notes. Thank the teacher."
        ],
        sugerencias: ["I'm sorry, I don't have a note with me today.", "My parents don't speak much English, so they couldn't write it for me.", "Yes, my older sister can help them write an email tonight.", "I had a really bad stomach ache and a fever.", "I will ask my friends for the notes. Thank you."] 
    },
    4: { 
        context: "Situation: Buying Uniform. You are in the local uniform shop buying PE gear.", 
        dialogs: ["Hi there, do you need a hand finding anything?", "Sure. What year are you in? The Junior and Senior tracksuits are different.", "Okay, here is the Junior half-zip. What size are you looking for?", "The changing rooms are just over there in the corner.", "No problem. If it's too small, keep the receipt and you can exchange it within 14 days."], 
        instructions: [
            "Say yes, you are looking for the school P.E. tracksuit.",
            "Say you are in 2nd Year (Junior Cycle).",
            "Say you think you are a size Medium. Ask if you can try it on.",
            "Say thank you. (Imagine you tried it on). Tell the assistant you will take it.",
            "Say perfect, thank you very much for your help."
        ],
        sugerencias: ["Yes, please. I'm looking for the school P.E. tracksuit.", "I'm in 2nd Year.", "I think I need a size Medium. Can I try it on, please?", "Thank you. It fits perfectly, I'll take it.", "Perfect, thank you very much for your help."] 
    }
};


// ===========================================
// VARIABLES GLOBALES
// ===========================================
let userLanguage = "English"; 
let currentLevel = 'Basic';
let currentMode = 'exam'; 
let currentTopic = null;
let rpActual = null; 
let pasoActual = 0; 

// ===========================================
// INTERFAZ Y NAVEGACIÓN
// ===========================================
function updateInterfaceLang() {
  const sel = document.getElementById('nativeLang');
  userLanguage = sel.value;
}

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
}

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnBasic').className = lvl === 'Basic' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnAdvanced').className = lvl === 'Advanced' ? 'level-btn active' : 'level-btn'; 
    if(currentMode === 'exam' && currentTopic) updateQuestion(); 
    if(currentMode === 'study' && currentTopic) renderCheckpoints(); 
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('modeExam').className = mode === 'exam' ? 'mode-btn active' : 'mode-btn';
    document.getElementById('modeStudy').className = mode === 'study' ? 'mode-btn active' : 'mode-btn';

    if (mode === 'exam') {
        document.getElementById('studyContainer').style.display = 'none';
        if (document.getElementById('scoreDisplay').innerText !== "") {
             document.getElementById('result').style.display = 'block';
             document.getElementById('exerciseArea').style.display = 'none';
        } else {
             document.getElementById('exerciseArea').style.display = 'block';
             document.getElementById('result').style.display = 'none';
        }
    } else {
        document.getElementById('studyContainer').style.display = 'block';
        document.getElementById('exerciseArea').style.display = 'none';
        document.getElementById('result').style.display = 'none';
        renderCheckpoints(); 
    }
}

function initConv() { 
    const g = document.getElementById('topicGrid'); 
    g.innerHTML = "";
    EAL_DATA.forEach((item) => { 
        const b = document.createElement('button'); 
        b.className = 'topic-btn'; 
        b.innerText = item.title; 
        b.onclick = () => { 
            document.querySelectorAll('#topicGrid .topic-btn').forEach(x => x.classList.remove('active')); 
            b.classList.add('active'); 
            currentTopic = item; 
            if(currentMode === 'study') renderCheckpoints();
            else updateQuestion(); 
        }; 
        g.appendChild(b); 
    }); 
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('studyContainer').style.display = 'none'; 
    document.getElementById('qTranslation').style.display = 'none';
    
    document.getElementById('qTitle').innerText = currentTopic.title;
    document.getElementById('qDisplay').innerText = currentTopic[currentLevel]; 
    document.getElementById('userInput').value = "";

    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    hintBox.style.display = 'none'; 
    if (currentLevel === 'Advanced' && currentTopic.check_Advanced) {
        btnHint.style.display = 'block';
        hintBox.innerHTML = "<strong>📝 What to include (Checkpoints):</strong><br>" + currentTopic.check_Advanced;
    } else {
        btnHint.style.display = 'none'; 
    }
}

function toggleHint() {
    const box = document.getElementById('hintBox');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('userInput').value = "";
}

// ===========================================
// TEXT TO SPEECH & TRANSLATION
// ===========================================
function speakText() { 
    const t = document.getElementById('qDisplay').innerText; 
    window.speechSynthesis.cancel(); 
    const u = new SpeechSynthesisUtterance(t); 
    u.lang = 'en-IE'; // Irish English Voice
    u.rate = 0.9; 
    window.speechSynthesis.speak(u); 
}

function readInput() {
    const text = document.getElementById("userInput").value; if (!text) return; 
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-IE'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

async function translateQuestion() {
  if(userLanguage === "English") return alert("Please select your native language at the top first.");
  const box = document.getElementById('qTranslation');
  box.style.display = 'block'; box.innerText = "🔄 Translating...";
  const prompt = `TRANSLATE this text: "${currentTopic[currentLevel]}" into ${userLanguage}. OUTPUT ONLY THE TRANSLATION.`;
  
  try {
    const text = await callSmartAI(prompt);
    box.innerText = text;
  } catch(e) { box.innerText = "⚠️ AI is busy. Please try again."; }
}

// ===========================================
// AI ANALYSIS (EXAM MODE)
// ===========================================
async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Please write a longer answer.");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Checking...";

  let criteria = "Correct English grammar and vocabulary."; 
  if (currentLevel === 'Advanced' && currentTopic.check_Advanced) criteria = currentTopic.check_Advanced;

  const prompt = `
    ACT AS: Sympathetic EAL English Teacher in Ireland.
    STUDENT NATIVE LANGUAGE: ${userLanguage}.
    QUESTION: "${currentTopic[currentLevel]}"
    ANSWER: "${t}"
    LEVEL: ${currentLevel}.
    CHECKPOINTS: [ ${criteria} ].
    INSTRUCTIONS: 
    1. Ignore minor punctuation errors.
    2. PROVIDE THE MAIN FEEDBACK IN THE STUDENT'S NATIVE LANGUAGE (${userLanguage}) so they understand.
    3. Provide a short encouraging English feedback.
    OUTPUT JSON ONLY: { "score": 0-100, "feedback_native": "...", "feedback_en": "...", "errors": [{ "original": "...", "correction": "...", "explanation_native": "..." }] }
  `;

  try {
    const rawText = await callSmartAI(prompt);
    const j = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = `"${t}"`;
    
    const s = document.getElementById('scoreDisplay');
    s.innerText = `Score: ${j.score}%`;
    s.style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");

    document.getElementById('fbNative').innerHTML = `<strong>Teacher:</strong> ${j.feedback_native}`; 
    document.getElementById('fbEN').innerText = j.feedback_en;
    
    const l = document.getElementById('errorsList'); l.innerHTML = "";
    if(j.errors && j.errors.length > 0) {
        j.errors.forEach(e => { l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> <br><small style="color:#475569;">💡 ${e.explanation_native}</small></div>`; });
    } else {
        l.innerHTML = "<div style='color:#166534; font-weight:bold;'>✅ Perfect! No major errors found.</div>";
    }

  } catch (e) { 
    console.error(e); alert(`⚠️ Error: Could not check answer right now.`);
  } finally { 
    b.disabled = false; b.innerText = "✨ Check my English"; 
  }
}

// ===========================================
// AI STUDY MODE
// ===========================================
async function askAIConcept(concept) {
    if(userLanguage === "English") return alert("Please select your native language at the top for explanations.");
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; box.innerHTML = "⏳ <b>Consulting AI Teacher...</b>";

    const prompt = `
        ACT AS: EAL English Teacher.
        CONCEPT: "${concept}".
        STUDENT NATIVE LANGUAGE: ${userLanguage}.
        INSTRUCTIONS: Explain what this means in ${userLanguage} (max 50 words). Provide 1 clear English example.
        OUTPUT HTML: <p><b>Explanation:</b> ...</p><ul><li>...</li></ul>
    `;

    try {
        const text = await callSmartAI(prompt);
        box.innerHTML = `<div style="display:flex; justify-content:space-between;"><strong>💡 Concept: ${concept}</strong><button onclick="this.parentElement.parentElement.style.display='none'" style="background:none;border:none;cursor:pointer;">✖️</button></div><hr>${text.replace(/```html|```/g, "").trim()}`;
    } catch (e) {
        box.innerHTML = `<div style="color:#dc2626;">⚠️ Error connecting to AI.</div>`;
    }
}

function renderCheckpoints() {
    const container = document.getElementById('studyContainer');
    if (!currentTopic) { container.innerHTML = "<p>👈 Please select a topic.</p>"; return; }

    container.innerHTML = `
        <h3>📚 Study Mode: ${currentTopic.title}</h3>
        <p style="color:#64748b; font-size:0.9rem;">Click a concept to get an explanation in your language.</p>
        <div id="checkpointsList"></div> 
        <div id="aiExplanationBox" class="ai-box" style="display:none;"></div>
    `;

    const list = document.getElementById('checkpointsList');
    const createSection = (title, items, cssClass) => {
        if(!items || items.length === 0) return;
        const h = document.createElement('h4'); h.innerText = title; 
        h.style.margin = "15px 0 5px 0"; h.style.borderBottom = "1px solid #e5e7eb"; 
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

    if (currentTopic.checkpoints_Basic) createSection("🌱 Basic Vocabulary", currentTopic.checkpoints_Basic, "btn-ol");
    if (currentLevel === 'Advanced' && currentTopic.checkpoints_Advanced) {
        createSection("🚀 Advanced Ideas", currentTopic.checkpoints_Advanced, "btn-hl");
        if(currentTopic.checkpoints_TOP) createSection("✨ Top Phrases & Idioms", currentTopic.checkpoints_TOP, "btn-top");
    }
}

// ===========================================
// ROLEPLAYS LOGIC
// ===========================================
function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; 
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = RP_DB[id].context;
    
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Conversation" to begin.</div>`;
    document.getElementById('rpInstructionBox').style.display = 'none';
    
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block"; nextBtn.innerText = "▶️ Start Conversation"; nextBtn.onclick = reproducirSiguienteAudio;
    
    document.getElementById('rpInput').disabled = true; document.getElementById('rpInput').value = "";
    document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

function reproducirSiguienteAudio() {
    document.getElementById('nextAudioBtn').style.display = "none";
    if (pasoActual >= 5) {
        document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`;
        return;
    }

    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble ex"><b>Person:</b> ${dialogText}</div>`; 
    chat.scrollTop = chat.scrollHeight;
    
    window.speechSynthesis.cancel();
    window.utterance = new SpeechSynthesisUtterance(dialogText); 
    window.utterance.lang = 'en-IE'; // English Ireland
    window.utterance.rate = 0.9;
    window.utterance.onend = habilitarInput;
    window.utterance.onerror = habilitarInput; 
    window.speechSynthesis.speak(window.utterance);
}

function habilitarInput() {
    if(pasoActual < 5) { 
        document.getElementById('rpInput').disabled = false; 
        document.getElementById('rpSendBtn').disabled = false;
        document.getElementById('rpInput').focus(); 
        document.getElementById('hintBtn').style.display = "block";
        document.getElementById('rpInput').placeholder = "Type your reply...";
        
        const instructionBox = document.getElementById('rpInstructionBox');
        instructionBox.innerHTML = `<span class="instruction-label">YOUR TASK:</span>${RP_DB[rpActual].instructions[pasoActual]}`;
        instructionBox.style.display = 'block';
    }
}

function enviarRespuestaRP() {
    const inp = document.getElementById('rpInput'); const txt = inp.value.trim(); if(!txt) return;
    const chat = document.getElementById('rpChat'); chat.innerHTML += `<div class="bubble st">${txt}</div>`; chat.scrollTop = chat.scrollHeight;
    
    inp.value = ""; inp.disabled = true; 
    document.getElementById('rpSendBtn').disabled = true; 
    document.getElementById('hintBtn').style.display = "none";
    document.getElementById('rpInstructionBox').style.display = 'none'; 
    
    pasoActual++;
    setTimeout(() => { 
        if(pasoActual < 5) { 
            const nextBtn = document.getElementById('nextAudioBtn');
            nextBtn.style.display = "block"; nextBtn.innerText = "🔊 Listen to Person"; nextBtn.onclick = reproducirSiguienteAudio;
        } else { 
            document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed! Well done.</div>`; 
        }
    }, 500);
}

function mostrarSugerencia() {
    const sug = RP_DB[rpActual].sugerencias[pasoActual];
    if(sug) {
        const chat = document.getElementById('rpChat');
        chat.innerHTML += `<div class="feedback-rp">💡 <b>Hint:</b> ${sug}</div>`; chat.scrollTop = chat.scrollHeight;
    }
}

window.onload = initConv;
