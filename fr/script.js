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
let currentMode = 'exam';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// Base de datos de Conversación (15 Temas) + STUDY MODE CHECKPOINTS
const DATA = [
  { 
    title: "1. Moi-même", 
    OL: "Comment vous appelez-vous ? Quel âge avez-vous ? Quelle est votre date de naissance ?", 
    HL: "Parlez-moi de vous. Décrivez votre personnalité et vos qualités principales.",
    check_HL: "Nom (Name), Âge (Age), Anniversaire (Birthday - full date), Physique (Physical - Yeux/Cheveux + Adjectifs), Caractère (Personality - 3 adjectives).",
    checkpoints_OL: ["Je m'appelle... (Name)", "J'ai X ans (Age)", "Mon anniversaire est le... (Date)"],
    checkpoints_HL: ["Les yeux et les cheveux (Adjectives agreement)", "Caractère (Je suis sympa/timide)", "Nationalité (Je suis irlandais/e)"],
    checkpoints_TOP: ["✨ Idiom: Avoir la tête sur les épaules", "✨ Grammar: Depuis (Since/For)", "✨ Vocab: Qualités et défauts"]
  },
  { 
    title: "2. Ma famille", 
    OL: "Il y a combien de personnes dans votre famille ? Vous avez des frères et sœurs ?", 
    HL: "Parlez-moi de votre famille. Est-ce que vous vous entendez bien avec vos parents et vos frères et sœurs ?",
    check_HL: "Nombre de personnes (Number of people), Professions (Parents' jobs), Description frères/sœurs (Siblings), Relations (Getting on well/badly - s'entendre bien/mal).",
    checkpoints_OL: ["Nous sommes cinq... (Numbers)", "J'ai un frère / une sœur", "Mon père est médecin... (Jobs)"],
    checkpoints_HL: ["S'entendre bien/mal avec...", "Se disputer (Argue)", "Description physique des parents"],
    checkpoints_TOP: ["✨ Idiom: C'est le chouchou (Teacher's pet)", "✨ Grammar: C'est + Adjectif (C'est génial)", "✨ Vocab: Famille recomposée"]
  },
  { 
    title: "3. Les amis", 
    OL: "Vous avez beaucoup d'amis ? Comment s'appelle votre meilleur ami ?", 
    HL: "Parlez-moi de votre meilleur ami ou votre meilleure amie. Pourquoi est-ce qu'il/elle est important(e) pour vous ?",
    check_HL: "Nom (Name), Description, Points communs (Shared interests), Pourquoi (Why special - loyal/drôle).",
    checkpoints_OL: ["Mon meilleur ami s'appelle...", "Il est grand et sportif", "On joue au foot ensemble"],
    checkpoints_HL: ["Les qualités d'un bon ami", "On a les mêmes goûts", "On se connaît depuis..."],
    checkpoints_TOP: ["✨ Idiom: Être comme les deux doigts de la main", "✨ Grammar: Si j'avais le choix...", "✨ Vocab: La confiance"]
  },
  { 
    title: "4. Ma maison", 
    OL: "Vous habitez dans une maison ou un appartement ? Comment est votre chambre ?", 
    HL: "Décrivez votre maison idéale. Si vous pouviez changer quelque chose chez vous, ce serait quoi ?",
    check_HL: "Type de logement (House/Apartment), Ma chambre (My bedroom - meubles/prepositions), Pièce préférée (Fav room), Conditionnel (Je voudrais changerais...).",
    checkpoints_OL: ["J'habite dans une maison...", "Ma chambre est petite/grande", "Il y a un lit et un bureau"],
    checkpoints_HL: ["Les tâches ménagères (Chores)", "Ma pièce préférée (My favorite room)", "Les prépositions (Sur, sous, à côté)"],
    checkpoints_TOP: ["✨ Idiom: Home sweet home (Foyer, doux foyer)", "✨ Grammar: Conditionnel (Je voudrais...)", "✨ Vocab: Le jardin / Le quartier"]
  },
  { 
    title: "5. Mon quartier", 
    OL: "Est-ce qu'il y a des magasins près de chez vous ? Il y a un parc ?", 
    HL: "Parlez-moi de votre quartier. Est-ce qu'il y a des problèmes sociaux ou de la délinquance ?",
    check_HL: "Installations (Facilities - Il y a...), Avantages/Inconvénients (Pros/Cons - calme/bruyant), Problèmes sociaux (Social issues).",
    checkpoints_OL: ["Il y a un parc / une école", "C'est tranquille / bruyant", "C'est près de la mer"],
    checkpoints_HL: ["Les installations sportives", "Les problèmes (Déchets, Bruit)", "Les transports en commun"],
    checkpoints_TOP: ["✨ Idiom: Il n'y a pas un chat (It's empty)", "✨ Grammar: Ce que j'aime, c'est...", "✨ Vocab: La délinquance juvénile"]
  },
  { 
    title: "6. Ma ville/village", 
    OL: "Vous aimez votre ville ? Qu'est-ce qu'il y a à faire pour les jeunes ?", 
    HL: "Quels sont les avantages et les inconvénients de vivre en ville par rapport à la campagne ?",
    check_HL: "Comparaison (Plus calme que... / Moins stressant que...), Avantages Ville (Transports/Magasins), Avantages Campagne (Nature/Air pur).",
    checkpoints_OL: ["J'habite à Dublin", "C'est une grande ville", "On peut aller au cinéma"],
    checkpoints_HL: ["Ville vs Campagne (Comparatifs)", "La pollution et le trafic", "L'accès aux services"],
    checkpoints_TOP: ["✨ Idiom: C'est mort (It's boring)", "✨ Grammar: Plus... que / Moins... que", "✨ Vocab: L'ennui / L'animation"]
  },
  { 
    title: "7. L'école", 
    OL: "Comment s'appelle votre école ? C'est une école mixte ? Il y a combien d'élèves ?", 
    HL: "Parlez-moi de votre lycée. Que pensez-vous du système éducatif irlandais et des règles de l'école ?",
    check_HL: "Description (Mixte/Publique), Uniforme (Description), Règles (Rules - Il est interdit de...), Opinion Système (Points system/Stress).",
    checkpoints_OL: ["Mon école est mixte", "Je porte un uniforme (Pull, Pantalon)", "Il y a 500 élèves"],
    checkpoints_HL: ["Le règlement scolaire (Interdictions)", "Les installations (Cantine, Gymnase)", "Les professeurs"],
    checkpoints_TOP: ["✨ Idiom: Passer un examen (Sit an exam)", "✨ Grammar: Il faut + Infinitif", "✨ Vocab: Le harcèlement scolaire"]
  },
  { 
    title: "8. Les matières", 
    OL: "Quelles matières étudiez-vous ? Quelle est votre matière préférée ?", 
    HL: "Parlez-moi de vos matières. Pensez-vous que le Leaving Cert est un bon système d'évaluation ?",
    check_HL: "Liste de matières (Subjects), Matière préférée (Fav subject - J'aime...), Difficile (Hard - Je suis nul en...), Opinion Leaving Cert (Pression/Juste).",
    checkpoints_OL: ["J'étudie le français, les maths...", "J'aime l'histoire", "Je déteste la géo"],
    checkpoints_HL: ["Matières obligatoires vs optionnelles", "La pression du Leaving Cert", "Système de points (CAO)"],
    checkpoints_TOP: ["✨ Idiom: Bosser dur (Work hard)", "✨ Grammar: Après avoir fini...", "✨ Vocab: L'apprentissage par cœur"]
  },
  { 
    title: "9. La routine", 
    OL: "À quelle heure vous vous levez le matin ? À quelle heure vous rentrez chez vous ?", 
    HL: "Décrivez votre journée typique. Est-ce que vous trouvez vos journées stressantes en ce moment ?",
    check_HL: "Verbes Pronominaux (Je me lève, Je m'habille...), Horaires (À huit heures...), Transport, Devoirs/Études (Homework/Study).",
    checkpoints_OL: ["Je me lève à 7h (Reflexive)", "Je prends le petit déjeuner", "Je vais à l'école en bus"],
    checkpoints_HL: ["La journée scolaire (Emploi du temps)", "Le soir (Devoirs, Dîner)", "Le week-end (Grasse matinée)"],
    checkpoints_TOP: ["✨ Idiom: Metro, boulot, dodo", "✨ Grammar: Avant de + Infinitif", "✨ Vocab: Un emploi du temps chargé"]
  },
  { 
    title: "10. Les passe-temps", 
    OL: "Qu'est-ce que vous faites pendant votre temps libre ? Vous faites du sport ?", 
    HL: "Parlez-moi de vos loisirs. Pourquoi est-il important d'avoir des passe-temps pour la santé mentale ?",
    check_HL: "Sport (Je joue au...), Musique/Lecture (Music/Reading), Fréquence (Souvent/Le samedi), Importance (Santé mentale/Décompresser).",
    checkpoints_OL: ["Je joue au foot / rugby", "J'écoute de la musique", "Je regarde Netflix"],
    checkpoints_HL: ["Sport individuel vs équipe", "Bienfaits pour la santé", "L'importance de décompresser"],
    checkpoints_TOP: ["✨ Idiom: Avoir l'esprit d'équipe", "✨ Grammar: Jouer à / Jouer de", "✨ Vocab: Une vie équilibrée"]
  },
  { 
    title: "11. Tâches ménagères", 
    OL: "Est-ce que vous aidez à la maison ? Vous faites votre lit ?", 
    HL: "Parlez-moi du partage des tâches ménagères chez vous. Est-ce que c'est équitable ?",
    check_HL: "Tâches spécifiques (Je fais la vaisselle/mon lit...), Argent de poche (Pocket money), Opinion (C'est juste/injuste).",
    checkpoints_OL: ["Je fais mon lit", "Je mets la table", "Je range ma chambre"],
    checkpoints_HL: ["L'argent de poche", "Partage des tâches (Juste/Injuste)", "Conflits avec les parents"],
    checkpoints_TOP: ["✨ Idiom: Donner un coup de main", "✨ Grammar: En faisant...", "✨ Vocab: L'égalité hommes-femmes"]
  },
  { 
    title: "12. Les vacances (Passé)", 
    OL: "Où êtes-vous allé en vacances l'année dernière ? Vous aimez la France ?", 
    HL: "Parlez-moi de vos vacances. Préfériez-vous partir à l'étranger ou rester en Irlande ? Pourquoi ?",
    check_HL: "Passé Composé (Actions: Je suis allé, J'ai visité...), Imparfait (Météo/Description: Il faisait beau, C'était super), Préférence (Voyager vs Rester).",
    checkpoints_OL: ["Je suis allé en Espagne (Passé)", "J'ai voyagé en avion", "C'était super !"],
    checkpoints_HL: ["Passé Composé vs Imparfait", "Logement (Hôtel, Camping)", "Activités (Bronzer, Nager)"],
    checkpoints_TOP: ["✨ Idiom: Changer d'air", "✨ Grammar: Venir de + Infinitif", "✨ Vocab: Le tourisme de masse"]
  },
  { 
    title: "13. L'avenir (Futur)", 
    OL: "Qu'est-ce que vous allez faire l'année prochaine ? Vous voulez aller à l'université ?", 
    HL: "Quels sont vos projets pour l'avenir ? Quel métier aimeriez-vous faire et pourquoi ?",
    check_HL: "Futur Simple (J'irai, Je ferai...), Conditionnel (J'aimerais être...), Université/Fac, Année sabbatique (Gap Year).",
    checkpoints_OL: ["Je vais aller à l'université", "Je veux étudier le commerce", "Je voudrais être riche"],
    checkpoints_HL: ["L'année sabbatique (Gap Year)", "Le logement étudiant", "Projets de carrière"],
    checkpoints_TOP: ["✨ Idiom: Avoir le monde à ses pieds", "✨ Grammar: Quand je serai grand...", "✨ Vocab: L'indépendance financière"]
  },
  { 
    title: "14. Week-end dernier", 
    OL: "Qu'est-ce que vous avez fait le week-end dernier ? Vous êtes sorti ?", 
    HL: "Racontez-moi ce que vous avez fait le week-end dernier. C'était un bon week-end ?",
    check_HL: "Passé Composé avec AVOIR (J'ai regardé, J'ai joué), Passé Composé avec ÊTRE (Je suis sorti(e), Je suis allé(e)), Activités sociales.",
    checkpoints_OL: ["J'ai regardé un match", "Je suis allé au cinéma", "J'ai mangé une pizza"],
    checkpoints_HL: ["Sorties entre amis", "Réviser pour les examens", "Événements spéciaux"],
    checkpoints_TOP: ["✨ Idiom: Faire la grasse matinée", "✨ Grammar: Passé Composé (Être/Avoir)", "✨ Vocab: Se détendre"]
  },
  { 
    title: "15. Week-end prochain", 
    OL: "Qu'est-ce que vous ferez le week-end prochain ?", 
    HL: "Quels sont vos projets pour le week-end prochain ? Vous avez prévu quelque chose de spécial ?",
    check_HL: "Futur Proche (Je vais aller...), Futur Simple (Je sortirai...), Projets spécifiques (Specific plans - amis/sport/devoirs).",
    checkpoints_OL: ["Je vais jouer au foot", "Je vais étudier", "Je vais voir mes amis"],
    checkpoints_HL: ["Futur Proche (Aller + Infinitif)", "Compétitions sportives", "Repas de famille"],
    checkpoints_TOP: ["✨ Idiom: Ça va être génial", "✨ Grammar: J'ai l'intention de...", "✨ Vocab: Prévoir / Organiser"]
  }
];

const PAST_Q = ["Qu'est-ce que vous avez fait le week-end dernier ?", "Où êtes-vous allé l'été dernier ?", "Qu'est-ce que vous avez fait hier soir ?"];
const FUT_Q = ["Qu'est-ce que vous ferez demain ?", "Quels sont vos projets pour l'été ?", "Qu'est-ce que vous ferez après les examens ?"];

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
    const t = rawHTML.replace(/<[^>]*>/g, " ").replace(/\(PASSÉ\)|\(FUTUR\)/g, "").replace(/HL|OL/g, "").replace(/[0-9]\./g, ""); 
    
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'fr-FR'; 
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
            hintBox.innerHTML = "<strong>📝 Points Clés / Key Points (HL):</strong><br>" + currentTopic.check_HL;
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
  if(t.length < 3) return alert("S'il vous plaît, écrivez ou dites quelque chose...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Grading...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  let criteria = "Correct grammar and vocabulary."; 
  if (currentLevel === 'HL' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Strict Leaving Cert French Oral Examiner (Ireland).
    CONTEXT: RAW VOICE TRANSCRIPTION (NO PUNCTUATION).
    QUESTION: "${questionContext}"
    ANSWER: "${t}"
    LEVEL: ${currentLevel}.
    CHECKPOINTS: [ ${criteria} ].
    INSTRUCTIONS: Ignore punctuation errors. Maintain formal 'vous' perspective when addressing the student in feedback.
    OUTPUT JSON: { "score": 0-100, "feedback_fr": "...", "feedback_en": "...", "errors": [{ "original": "...", "correction": "...", "explanation_en": "..." }] }
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

    document.getElementById('fbFR').innerHTML = "🇫🇷 " + j.feedback_fr; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    
    const l = document.getElementById('errorsList'); l.innerHTML = "";
    if(j.errors && j.errors.length > 0) {
        j.errors.forEach(e => { l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`; });
    } else {
        l.innerHTML = "<div style='color:#166534; font-weight:bold;'>✅ Très bien !</div>";
    }

    const btnReset = document.getElementById('btnReset');
    if (isMockExam) {
        if (mockIndex < 4) {
            btnReset.innerText = "➡️ Next Question"; btnReset.onclick = nextMockQuestion; 
        } else {
            btnReset.innerText = "🏁 Finish Exam"; btnReset.onclick = resetApp; 
        }
    } else {
        btnReset.innerText = "🔄 Nouveau sujet"; btnReset.onclick = resetApp; 
    }

  } catch (e) { 
    console.error(e); 
    alert(`⚠️ Error: ${e.message}`);
  } finally { 
    b.disabled = false; b.innerText = "✨ Vérifier"; 
  }
}

// ===========================================
// MODO FORMACIÓN (STUDY MODE AI)
// ===========================================

function initStudyHTML() {
    // Ya no es necesario crear el contenedor dinámicamente si existe en HTML
}

function renderCheckpoints() {
    const container = document.getElementById('studyContainer');
    if (!container) return; 

    if (!currentTopic) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#64748b; font-weight:bold;'>👈 Please select a topic from the grid above to start studying.</p>";
        return;
    }
    
    // RELLENAR LA CAJA EXISTENTE
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

    createSection("🧱 Les Bases (Foundations)", currentTopic.checkpoints_OL, "btn-ol");
    if (currentLevel === 'HL') {
        createSection("🔧 Niveau Supérieur (Higher Level)", currentTopic.checkpoints_HL, "btn-hl");
        if(currentTopic.checkpoints_TOP) {
            createSection("🚀 Phrases Clés (Top Marks)", currentTopic.checkpoints_TOP, "btn-top");
        }
    }
}

async function askAIConcept(concept) {
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; 
    box.innerHTML = "⏳ <b>Consultation du Professeur IA...</b>";

    const prompt = `
        ACT AS: French Teacher.
        TOPIC: "${currentTopic ? currentTopic.title : 'General'}".
        CONCEPT: "${concept}".
        INSTRUCTIONS: Explain in English (max 50 words). Provide 2 French examples with English translation.
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

// === LÓGICA DEL DOCUMENT (Option 2) - INTACTA ===
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
  TASK: Generate 5 questions. 1-3 specific, 4-5 general themes. INSTRUCTIONS: Always formulate questions using the formal 'vous' form. OUTPUT: List 1-5.`;

  try {
    const text = await callSmartAI(prompt);
    currentQuestionsText = text;
    document.getElementById('docStep1').style.display = 'none';
    document.getElementById('docStep2').style.display = 'none';
    document.getElementById('docStep3').style.display = 'block';
    document.getElementById('aiQuestions').innerText = currentQuestionsText;
  } catch(e) { 
      console.error(e); 
      alert("⚠️ Erreur: " + e.message);
  } finally { b.disabled = false; b.innerText = "🔮 Générer Questions"; }
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
  INSTRUCTIONS: Maintain formal 'vous' perspective when addressing the student in feedback.
  OUTPUT JSON: { "score": (0-100), "feedback_fr": "Feedback", "feedback_en": "Advice", "errors": [{"original":"x","correction":"y","explanation_en":"z"}] }`;

  try {
    const rawText = await callSmartAI(prompt);
    const j = JSON.parse(rawText.replace(/```json|```/g, "").trim());

    document.getElementById('docStep3').style.display='none';
    document.getElementById('resultDoc').style.display='block';
    document.getElementById('userResponseTextDoc').innerText = t;
    document.getElementById('scoreDisplayDoc').innerText = `Note: ${j.score}%`;
    document.getElementById('scoreDisplayDoc').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbFRDoc').innerText = "🇫🇷 " + j.feedback_fr;
    document.getElementById('fbENDoc').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListDoc').innerHTML = j.errors?.map(e=>`<div class="error-item"><span style="text-decoration:line-through">${e.original}</span> ➡️ <b>${e.correction}</b> (${e.explanation_en})</div>`).join('') || "✅ Très bien!";
  } catch(e) { 
      console.error(e); 
      alert("⚠️ Erreur: " + e.message);
  } finally { b.disabled=false; b.innerText="✨ Vérifier"; }
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
