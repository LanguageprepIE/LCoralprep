// ===========================================
// CONFIGURACIÓN Y CLAVES (API KEY)
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// --- NAVEGACIÓN ---
function toggleInfo() { 
  const b = document.getElementById('infoBox'); 
  b.style.display = b.style.display === 'block' ? 'none' : 'block'; 
}

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabDoc').className = tab === 'doc' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionDocument').style.display = tab === 'doc' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: CONVERSATION (AI - GEMINI)
// ===========================================
let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// Base de datos de Conversación (15 Temas FRANCÉS)
const DATA = [
  { title: "1. Moi-même", OL: "Comment t'appelles-tu ? Quel âge as-tu ? Quelle est ta date de naissance ?", HL: "Parle-moi de toi. Décris ta personnalité et tes qualités principales." },
  { title: "2. Ma famille", OL: "Il y a combien de personnes dans ta famille ? Tu as des frères et sœurs ?", HL: "Parle-moi de ta famille. Est-ce que tu t'entends bien avec tes parents et tes frères et sœurs ?" },
  { title: "3. Les amis", OL: "Tu as beaucoup d'amis ? Comment s'appelle ton meilleur ami ?", HL: "Parle-moi de ton meilleur ami ou ta meilleure amie. Pourquoi est-ce qu'il/elle est important(e) pour toi ?" },
  { title: "4. Ma maison", OL: "Tu habites dans une maison ou un appartement ? Comment est ta chambre ?", HL: "Décris ta maison idéale. Si tu pouvais changer quelque chose chez toi, ce serait quoi ?" },
  { title: "5. Mon quartier", OL: "Est-ce qu'il y a des magasins près de chez toi ? Il y a un parc ?", HL: "Parle-moi de ton quartier. Est-ce qu'il y a des problèmes sociaux ou de la délinquance ?" },
  { title: "6. Ma ville/village", OL: "Tu aimes ta ville ? Qu'est-ce qu'il y a à faire pour les jeunes ?", HL: "Quels sont les avantages et les inconvénients de vivre en ville par rapport à la campagne ?" },
  { title: "7. L'école", OL: "Comment s'appelle ton école ? C'est une école mixte ? Il y a combien d'élèves ?", HL: "Parle-moi de ton lycée. Que penses-tu du système éducatif irlandais et des règles de l'école ?" },
  { title: "8. Les matières", OL: "Quelles matières étudies-tu ? Quelle est ta matière préférée ?", HL: "Parle-moi de tes matières. Penses-tu que le Leaving Cert est un bon système d'évaluation ?" },
  { title: "9. La routine", OL: "À quelle heure tu te lèves le matin ? À quelle heure tu rentres chez toi ?", HL: "Décris ta journée typique. Est-ce que tu trouves tes journées stressantes en ce moment ?" },
  { title: "10. Les passe-temps", OL: "Qu'est-ce que tu fais pendant ton temps libre ? Tu fais du sport ?", HL: "Parle-moi de tes loisirs. Pourquoi est-il important d'avoir des passe-temps pour la santé mentale ?" },
  { title: "11. Tâches ménagères", OL: "Est-ce que tu aides à la maison ? Tu fais ton lit ?", HL: "Parle-moi du partage des tâches ménagères chez toi. Est-ce que c'est équitable ?" },
  { title: "12. Les vacances", OL: "Où es-tu allé en vacances l'année dernière ? Tu aimes la France ?", HL: "Parle-moi de tes vacances. Préfères-tu partir à l'étranger ou rester en Irlande ? Pourquoi ?" },
  { title: "13. L'avenir", OL: "Qu'est-ce que tu vas faire l'année prochaine ? Tu veux aller à l'université ?", HL: "Quels sont tes projets pour l'avenir ? Quel métier aimerais-tu faire et pourquoi ?" },
  { title: "14. Week-end dernier", OL: "Qu'est-ce que tu as fait le week-end dernier ? Tu es sorti ?", HL: "Raconte-moi ce que tu as fait le week-end dernier. C'était un bon week-end ?" },
  { title: "15. Week-end prochain", OL: "Qu'est-ce que tu feras le week-end prochain ?", HL: "Quels sont tes projets pour le week-end prochain ? Tu as prévu quelque chose de spécial ?" }
];

// Preguntas Aleatorias de Tiempo (Pasado / Futuro)
const PAST_Q = ["Qu'est-ce que tu as fait le week-end dernier ?", "Où es-tu allé l'été dernier ?", "Qu'est-ce que tu as fait hier soir ?"];
const FUT_Q = ["Qu'est-ce que tu feras demain ?", "Quels sont tes projets pour l'été ?", "Qu'est-ce que tu feras après les examens ?"];

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
    // Limpieza de texto para el TTS
    const t = rawHTML.replace(/<[^>]*>/g, " ").replace(/\(PASSÉ\)|\(FUTUR\)/g, "").replace(/HL|OL/g, "").replace(/[0-9]\./g, ""); 
    
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'fr-FR'; 
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
        PAST_Q[Math.floor(Math.random()*3)] + " (PASSÉ)",
        FUT_Q[Math.floor(Math.random()*3)] + " (FUTUR)"
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
  if(t.length < 3) return alert("S'il te plaît, écris ou dis quelque chose...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; 
  b.innerText = "⏳ Grading...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

  const prompt = `ACT AS: French Leaving Cert Oral Examiner.
    QUESTION ASKED: "${questionContext}"
    STUDENT ANSWER: "${t}"
    TASK: Evaluate the student's answer.
    OUTPUT JSON ONLY:
    {
      "score": (0-100),
      "feedback_fr": "Feedback in French",
      "feedback_en": "Feedback in English",
      "errors": [
        { "original": "error", "correction": "fix", "explanation_en": "reason" }
      ]
    }`;

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

    document.getElementById('fbFR').innerText = "🇫🇷 " + j.feedback_fr; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    
    const l = document.getElementById('errorsList'); 
    l.innerHTML = "";
    if(j.errors && j.errors.length > 0) {
        j.errors.forEach(e => { l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`; });
    } else {
        l.innerHTML = "<div style='color:#166534; font-weight:bold;'>✅ Très bien !</div>";
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
        btnReset.innerText = "🔄 Nouveau sujet";
        btnReset.onclick = resetApp;
    }

  } catch (e) { console.error(e); alert("Erreur."); } finally { b.disabled = false; b.innerText = "✨ Vérifier"; }
}

// === LÓGICA DEL DOCUMENT (Option 2) ===
let currentDocType = "";
let currentQuestionsText = "";

function setDocType(type) {
  currentDocType = type;
  document.getElementById('docStep2').style.display = 'block';
  document.getElementById('docDescription').focus();
}

async function generateDocQuestions() {
  const desc = document.getElementById('docDescription').value;
  if(desc.length < 5) return alert("Please describe your document.");
  const b = document.querySelector('#docStep2 button'); b.disabled = true; b.innerText = "🤔 Génération...";

  const prompt = `ACT AS: Leaving Cert French Examiner. CONTEXT: Document about "${currentDocType}". DESC: "${desc}".
  TASK: Generate 5 questions. 1-3 specific, 4-5 general themes. OUTPUT: List 1-5.`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const d = await r.json();
    currentQuestionsText = d.candidates[0].content.parts[0].text;
    document.getElementById('docStep1').style.display = 'none';
    document.getElementById('docStep2').style.display = 'none';
    document.getElementById('docStep3').style.display = 'block';
    document.getElementById('aiQuestions').innerText = currentQuestionsText;
  } catch(e) { console.error(e); } finally { b.disabled = false; b.innerText = "🔮 Générer Questions"; }
}

function speakQuestions() {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(currentQuestionsText);
    u.lang = 'fr-FR'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

async function analyzeDoc() {
  const t = document.getElementById('userInputDoc').value;
  if(t.length < 3) return alert("Répondez s'il vous plaît.");
  const b = document.getElementById('btnActionDoc'); b.disabled = true; b.innerText = "⏳ Correction...";

  const prompt = `ACT AS: French Examiner. CONTEXT: Questions: ${currentQuestionsText}. ANSWER: "${t}".
  OUTPUT JSON: { "score": (0-100), "feedback_fr": "Feedback", "feedback_en": "Advice", "errors": [{"original":"x","correction":"y","explanation_en":"z"}] }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());

    document.getElementById('docStep3').style.display='none';
    document.getElementById('resultDoc').style.display='block';
    document.getElementById('userResponseTextDoc').innerText = t;
    document.getElementById('scoreDisplayDoc').innerText = `Note: ${j.score}%`;
    document.getElementById('scoreDisplayDoc').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbFRDoc').innerText = "🇫🇷 " + j.feedback_fr;
    document.getElementById('fbENDoc').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListDoc').innerHTML = j.errors?.map(e=>`<div class="error-item"><span style="text-decoration:line-through">${e.original}</span> ➡️ <b>${e.correction}</b> (${e.explanation_en})</div>`).join('') || "✅ Très bien!";
  } catch(e) { console.error(e); } finally { b.disabled=false; b.innerText="✨ Vérifier"; }
}

function resetDoc() {
  document.getElementById('resultDoc').style.display = 'none';
  document.getElementById('docStep1').style.display = 'block';
  document.getElementById('docStep2').style.display = 'none';
  document.getElementById('docStep3').style.display = 'none';
  document.getElementById('docDescription').value = "";
  document.getElementById('userInputDoc').value = "";
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

// Inicialización
window.onload = initConv;
