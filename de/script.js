// ===========================================
// CONFIGURACIÓN Y CLAVES
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// --- NAVEGACIÓN ---
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  // Botones
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabStory').className = tab === 'story' ? 'tab-btn active' : 'tab-btn';
  
  // Secciones
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
  document.getElementById('sectionStory').style.display = tab === 'story' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: KONVERSATION (General)
// ===========================================
let currentTopic = null;

const DATA = [
  { title: "1. Meine Familie", q: "Erzähl mir bitte etwas über deine Familie. Hast du Geschwister?" },
  { title: "2. Hobbys", q: "Was machst du in deiner Freizeit? Hast du besondere Hobbys?" },
  { title: "3. Schule", q: "Wie findest du deine Schule? Was sind deine Lieblingsfächer?" },
  { title: "4. Wohnort", q: "Wo wohnst du? Beschreibe deine Gegend ein bisschen." },
  { title: "5. Zukunft", q: "Was möchtest du nach dem Abitur (Leaving Cert) machen?" },
  { title: "6. Sommerjobs", q: "Hast du einen Nebenjob oder arbeitest du in den Ferien?" },
  { title: "7. Reisen", q: "Warst du schon mal in Deutschland? Reist du gerne?" },
  { title: "8. Alltag", q: "Wie sieht ein normaler Schultag bei dir aus?" },
  { title: "9. Musik/Film", q: "Welche Musik hörst du gern? Hast du einen deutschen Film gesehen?" },
  { title: "10. Gesundheit", q: "Lebst du gesund? Treibst du Sport oder isst du gesund?" }
];

function initConv() { 
    const g = document.getElementById('topicGrid'); 
    g.innerHTML = "";
    DATA.forEach((item) => { 
        const b = document.createElement('button'); 
        b.className = 'topic-btn'; 
        b.innerText = item.title; 
        b.onclick = () => { 
            document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
            b.classList.add('active'); 
            currentTopic = item; 
            updateQuestion(); 
        }; 
        g.appendChild(b); 
    }); 
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerText = currentTopic.q; 
}

function speakText() { 
    const t = document.getElementById('qDisplay').innerText; 
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'de-DE'; u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } 
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE'; utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Bitte sag etwas mehr...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Korrigiere...";

  const prompt = `
    ACT AS: German Leaving Cert Examiner.
    TASK: Evaluate student answer.
    QUESTION: "${currentTopic.q}"
    STUDENT ANSWER: "${t}"
    INSTRUCTIONS: Check grammar (cases, gender, word order) and vocabulary. Ignore punctuation.
    OUTPUT JSON ONLY: { "score": (0-100), "feedback_de": "German feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
  `;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Note: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbDE').innerText = "🇩🇪 " + j.feedback_de; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Sehr gut!";
  } catch (e) { console.error(e); alert("Fehler bei der Verbindung."); } finally { b.disabled = false; b.innerText = "✨ Bewerten"; }
}

function resetApp() {
    document.getElementById('result').style.display = 'none';
    document.getElementById('exerciseArea').style.display = 'block';
    document.getElementById('userInput').value = "";
}

// ===========================================
// PARTE 2: ROLLENSPIELE (ROLEPLAYS)
// ===========================================
let rpActual = null; 
let pasoActual = 0; 
let speaking = false;

const RP_DB = {
    1: { 
        context: "Hund verloren (Lost Dog). You are staying with the Vogler family in Berlin. Their dog Otto ran away while you were walking him (wild boar incident). You are at the police station.", 
        dialogs: [
            "Guten Tag. Bitte nehmen Sie Platz. Wie kann ich Ihnen helfen?", 
            "Verstehe. Das ist ja unangenehm. Wann genau ist das passiert und wo?", 
            "Können Sie den Hund bitte genauer beschreiben? Rasse, Farbe, Besonderheiten?", 
            "Trägt der Hund ein Halsband oder hat er einen Chip?", 
            ["Gut, wir nehmen das auf. Ich rate Ihnen, auch beim Tierschutz anzurufen.", "Hängen Sie am besten Zettel in der Nachbarschaft auf. Wir melden uns."]
        ], 
        sugerencias: [
            "Guten Tag. Mein Name ist [Name]. Ich wohne bei Familie Vogler. Ich habe ein Problem: Der Hund Otto ist weggelaufen.", 
            "Es ist vor einer Stunde im Grunewald passiert. Ein Wildschwein kam und Otto hat sich losgerissen.", 
            "Er ist ein kleiner Terrier, schwarz-weiß gefleckt und sehr freundlich.", 
            "Einen Chip hat er nicht, aber er trägt ein rotes Halsband mit der Telefonnummer der Familie.", 
            "Vielen Dank, das werde ich machen. Ich bin schrecklich nervös, hoffentlich finden wir ihn." 
        ] 
    },
    2: { 
        context: "Anruf bei der Redaktion (Call to Magazine). You are doing a project on 'Food in Germany & Ireland'. You call 'Essen & Trinken' magazine in Hamburg.", 
        dialogs: [
            "Redaktion 'Essen & Trinken', Müller am Apparat. Was kann ich für Sie tun?", 
            "Ja, natürlich. Worum geht es denn bei Ihrem Projekt genau?", 
            "Interessant. Und was möchten Sie genau wissen? Ist deutsches Essen noch typisch?", 
            "Und wie sieht es mit irischen Produkten aus? Was ist hier in Deutschland bekannt?", 
            ["Gut, ich kann Ihnen gerne ein paar alte Ausgaben zuschicken.", "Schicken Sie mir Ihre Adresse per E-Mail, dann sende ich Ihnen Material."]
        ], 
        sugerencias: [
            "Guten Tag. Ich mache ein Schulprojekt über Essen und Trinken. Kann ich bitte mit einem Journalisten sprechen?", 
            "Ich vergleiche die Essgewohnheiten in Irland und Deutschland. Ich habe schon viel im Internet recherchiert.", 
            "Ja, ich wollte fragen: Ist traditionelles Essen noch beliebt oder essen alle nur noch Fastfood?", 
            "Irische Butter und irisches Rindfleisch sind in Deutschland sehr bekannt und beliebt.", 
            "Das wäre super! Ich möchte ein paar deutsche Rezepte ausprobieren. Ich schicke Ihnen sofort eine E-Mail." 
        ] 
    },
    3: { 
        context: "Interview fürs Fernsehen (TV Interview). You are an Erasmus student in Leipzig. The MDR TV station is interviewing you.", 
        dialogs: [
            "Hallo! Toll, dass Sie Zeit für uns haben. Stellen Sie sich und Ihre Erasmus-Gruppe doch kurz vor.", 
            "Warum haben Sie sich eigentlich für ein Erasmus-Jahr entschieden, und warum ausgerechnet Leipzig?", 
            "Wie finden Sie das irische Punktesystem im Vergleich zu Deutschland? Ist es fair?", 
            "Erzählen Sie uns von Ihrer Unterkunft. Wo wohnen Sie hier in Leipzig?", 
            ["Vielen Dank für das Gespräch. Genießen Sie Ihre Zeit in Leipzig noch!", "Das klingt spannend. Alles Gute für Ihr Studium!"]
        ], 
        sugerencias: [
            "Hallo. Wir sind eine Gruppe aus Irland, Spanien und Frankreich. Ich bin der Sprecher, weil ich gut Deutsch spreche.", 
            "Ich wollte mein Deutsch verbessern und Leipzig ist eine sehr coole, junge Stadt mit viel Kultur.", 
            "Das System in Irland ist sehr stressig. In Deutschland finde ich es besser, dass man nicht nur Punkte zählt.", 
            "Ich wohne in einer WG (Wohngemeinschaft) im Zentrum. Es ist billig und wir haben viel Spaß.", 
            "Danke schön! Wir werden sicher noch viel im Nachtleben von Leipzig erleben." 
        ] 
    },
    4: { 
        context: "Einladung zum Festival (Inviting a friend). You want an Austrian friend to come to an Irish festival. You are skyping their strict parent.", 
        dialogs: [
            "Guten Tag. Hier spricht Herr/Frau Hofer. Sie wollen also, dass mein Kind nach Irland kommt?", 
            "Das klingt ja ganz nett, aber ist so ein Festival nicht gefährlich? Drogen, Alkohol...?", 
            "Und wo soll mein Kind schlafen? Zelten finde ich bei dem irischen Wetter keine gute Idee.", 
            "Ich weiß nicht... Die Reise ist auch sehr teuer, finden Sie nicht?", 
            ["Na gut, wenn Sie so gut aufpassen, erlaube ich es vielleicht.", "Okay, Ihr Argument hat mich überzeugt. Ich vertraue Ihnen."]
        ], 
        sugerencias: [
            "Guten Tag. Ja, ich würde mich sehr freuen. Wir verstehen uns super und das Festival ist berühmt.", 
            "Machen Sie sich keine Sorgen. Wir passen gut auf. Es ist ein sehr friedliches Musikfestival.", 
            "Wir haben ein großes, wasserdichtes Zelt. Und wenn es zu viel regnet, kann er/sie bei uns im Haus schlafen.", 
            "Die Flüge sind im Moment sehr billig, wenn man früh bucht. Es ist eine tolle Chance.", 
            "Vielen Dank für Ihr Vertrauen! Wir werden uns jeden Tag bei Ihnen melden." 
        ] 
    },
    5: { 
        context: "Problem mit Touristen (Problem Tourist). You are a tour guide. A tourist is complaining about delays and weather.", 
        dialogs: [
            "Sagen Sie mal! Wir warten hier schon ewig. Das ist ja eine Unverschämtheit!", 
            "Und dieses Wetter! Im Prospekt stand 'Grüne Insel', nicht 'Nasse Insel'.", 
            "Das Essen gestern im Hotel war auch kalt. Ich will mein Geld zurück!", 
            "Morgen müssen wir aber pünktlich losfahren, sonst beschwere ich mich beim Chef.", 
            ["Na gut, hoffen wir, dass der Rest der Reise besser wird.", "Ich nehme Sie beim Wort. Zeigen Sie uns jetzt die Sehenswürdigkeiten."]
        ], 
        sugerencias: [
            "Es tut mir sehr leid. Der Bus hatte leider einen platten Reifen. Wir fahren jetzt sofort los.", 
            "Das Wetter in Irland wechselt schnell. Gleich kommt sicher die Sonne wieder raus.", 
            "Ich werde mit dem Hotelmanager sprechen, damit das heute Abend nicht mehr passiert.", 
            "Versprochen. Ab morgen läuft alles nach Plan. Wir haben ein tolles Programm.", 
            "Vielen Dank für Ihre Geduld. Bitte entspannen Sie sich, Sie sind im Urlaub!" 
        ] 
    }
};

function selectRP(id, btn) {
    rpActual = id; pasoActual = 0; speaking = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DB[id].context;
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Drücke 'Audio abspielen' um zu starten.</div>`;
    document.getElementById('nextAudioBtn').style.display = "block";
    document.getElementById('rpInput').disabled = true; document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

function playAudio(text) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE'; u.rate = 0.9;
    u.onend = enableInput;
    window.speechSynthesis.speak(u);
}

function enableInput() {
    speaking = false;
    if(pasoActual < RP_DB[rpActual].dialogs.length) { 
        document.getElementById('rpInput').disabled = false;
        document.getElementById('rpSendBtn').disabled = false;
        document.getElementById('rpInput').focus();
        document.getElementById('hintBtn').style.display = "block";
        document.getElementById('rpInput').placeholder = "Deine Antwort...";
    }
}

function nextStep() {
    if (!rpActual || speaking) return;
    document.getElementById('nextAudioBtn').style.display = "none";
    speaking = true;
    
    if (pasoActual >= 5) {
        document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Rollenspiel beendet! Gut gemacht.</div>`;
        return;
    }

    let dialogText = RP_DB[rpActual].dialogs[pasoActual];
    if (Array.isArray(dialogText)) dialogText = dialogText[Math.floor(Math.random() * dialogText.length)];

    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble ex"><b>Prüfer:</b> ${dialogText}</div>`;
    chat.scrollTop = chat.scrollHeight;
    playAudio(dialogText);
}

function sendRP() {
    const inp = document.getElementById('rpInput');
    const txt = inp.value.trim(); if(!txt) return;
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble st">${txt}</div>`;
    chat.scrollTop = chat.scrollHeight;
    inp.value = ""; inp.disabled = true; document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
    pasoActual++;
    setTimeout(() => { 
        if(pasoActual < 5) { document.getElementById('nextAudioBtn').style.display = "block"; } else { document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Rollenspiel beendet!</div>`; }
    }, 500);
}

function showHint() {
    const sug = RP_DB[rpActual].sugerencias[pasoActual];
    if(sug) {
        const chat = document.getElementById('rpChat');
        chat.innerHTML += `<div class="feedback-rp">💡 <b>Vorschlag:</b> ${sug}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
}

// ===========================================
// PARTE 3: BILDERGESCHICHTEN (PICTURE SEQUENCES)
// ===========================================
let currentStoryTitle = "";

const STORIES = [
  "1. Handy Mobbing (Cyberbullying)",
  "2. Chancen durch Deutsch (Career Fair)",
  "3. Die Abi-Tour (School Trip Plan)",
  "4. Die Geburtstagsüberraschung (18th Birthday)",
  "5. Mehr Windkraft? (Wind Energy Protest)"
];

function selectStory(index, btn) {
    document.querySelectorAll('#sectionStory .rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentStoryTitle = STORIES[index];
    document.getElementById('storyArea').style.display = 'block';
    document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyTitle').innerText = currentStoryTitle;
    document.getElementById('userInputStory').value = "";
}

function speakStoryPrompt() {
    const text = "Erzähl mir bitte, was auf den Bildern passiert. Was ist die Geschichte?";
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'de-DE'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }
}

function readMyStoryInput() {
    const text = document.getElementById("userInputStory").value;
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

async function analyzeStory() {
  const t = document.getElementById('userInputStory').value;
  if(t.length < 5) return alert("Bitte erzähl etwas mehr...");
  
  const b = document.getElementById('btnActionStory'); 
  b.disabled = true; b.innerText = "⏳ Korrigiere...";

  const prompt = `
    ACT AS: German Leaving Cert Examiner.
    TASK: Evaluate Picture Sequence description: "${currentStoryTitle}".
    STUDENT INPUT: "${t}"
    INSTRUCTIONS: Check Past Tense usage (Präteritum/Perfekt) and specific vocabulary.
    OUTPUT JSON ONLY: { "score": (0-100), "feedback_de": "German feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
  `;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('storyArea').style.display = 'none'; 
    document.getElementById('resultStory').style.display = 'block';
    document.getElementById('userResponseTextStory').innerText = t;
    document.getElementById('scoreDisplayStory').innerText = `Note: ${j.score}%`;
    document.getElementById('scoreDisplayStory').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbDEStory').innerText = "🇩🇪 " + j.feedback_de; 
    document.getElementById('fbENStory').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListStory').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Fantastisch!";

  } catch (e) { console.error(e); alert("Fehler."); } finally { b.disabled = false; b.innerText = "✨ Bewerten"; }
}

function resetStory() {
    document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyArea').style.display = 'block';
    document.getElementById('userInputStory').value = "";
}

// INICIO
initConv();
