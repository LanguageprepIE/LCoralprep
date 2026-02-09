// ===========================================
// CONFIGURACIÓN (BACKEND ACTIVADO 🔒)
// ===========================================
// La clave API ha sido eliminada. 
// Ahora nos conectamos a través de Netlify Functions.

// --- NAVEGACIÓN ---
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabRole').className = tab === 'role' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabStory').className = tab === 'story' ? 'tab-btn active' : 'tab-btn';
  
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionRoleplay').style.display = tab === 'role' ? 'block' : 'none';
  
  const sectionStory = document.getElementById('sectionStory');
  if (sectionStory) sectionStory.style.display = tab === 'story' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: CONVERSATION
// ===========================================
let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

const DATA_CONV = [
  { 
    title: "1. Sich vorstellen", 
    OL: "Wie heißt du und wie alt bist du? Wann hast du Geburtstag?", 
    HL: "Erzähl mir ein bisschen über dich selbst. Wie würdest du deinen Charakter beschreiben?",
    check_HL: "Name, Alter, Geburtstag (Datum), Aussehen (Ich habe... Augen/Haare), Charakter (Ich bin... + 3 Adjektive)."
  },
  { 
    title: "2. Familie", 
    OL: "Hast du Geschwister? Wie heißen sie?", 
    HL: "Verstehst du dich gut mit deinen Eltern? Gibt es oft Streit zu Hause?",
    check_HL: "Personenzahl (Wir sind... Personen), Berufe der Eltern, Geschwister (Beschreibung), Verhältnis (Ich verstehe mich gut/schlecht mit...), Streitgründe."
  },
  { 
    title: "3. Wohnort", 
    OL: "Wo wohnst du? Wohnst du gern dort?", 
    HL: "Beschreibe deine Gegend. Was sind die Vor- und Nachteile vom Leben auf dem Land/in der Stadt?",
    check_HL: "Wohnort (Ich wohne in...), Beschreibung (Es gibt...), Vorteile/Nachteile (Es ist ruhig/langweilig), Stadt vs Land Vergleich."
  },
  { 
    title: "4. Schule", 
    OL: "Wie viele Fächer lernst du? Was ist dein Lieblingsfach?", 
    HL: "Was hältst du vom irischen Schulsystem? Ist der Druck für das Leaving Cert zu hoch?",
    check_HL: "Schulart, Fächer (Ich lerne...), Lieblingsfach (Mein Lieblingsfach ist... weil...), Meinung zum System (Punkte, Druck, Uniform)."
  },
  { 
    title: "5. Freizeit & Hobbys", 
    OL: "Was machst du in deiner Freizeit? Spielst du ein Instrument?", 
    HL: "Warum ist Sport wichtig für Jugendliche? Erzähl mir von deinen Interessen.",
    check_HL: "Sportart (Ich spiele...), Musik/Lesen, Häufigkeit (Oft, Jeden Tag), Wichtigkeit (Gesundheit, Stressabbau), Wortstellung."
  },
  { 
    title: "6. Alltag", 
    OL: "Wann stehst du auf? Was isst du zum Frühstück?", 
    HL: "Wie sieht ein typischer Samstag bei dir aus? Hilfst du im Haushalt?",
    check_HL: "Trennbare Verben (Ich stehe... auf), Uhrzeiten, Mahlzeiten, Hausarbeit (Ich muss...)."
  },
  { 
    title: "7. Ferien & Reisen", 
    OL: "Was hast du letzten Sommer gemacht? Warst du im Ausland?", 
    HL: "Fährst du lieber mit der Familie oder mit Freunden in den Urlaub? Warum?",
    check_HL: "Perfekt Form (Ich bin... gefahren), Reiseziel, Wetter, Präferenz (Lieber mit Freunden, weil...)."
  },
  { 
    title: "8. Zukunftspläne", 
    OL: "Was möchtest du nach der Schule machen? Willst du studieren?", 
    HL: "Welchen Beruf möchtest du später ausüben? Ist es schwer, heutzutage einen Job zu finden?",
    check_HL: "Futur I (Ich werde...), Modalverben (Ich möchte...), Studium/Ausbildung, Gap Year, Berufswunsch."
  },
  { 
    title: "9. Arbeit (Nebenjob)", 
    OL: "Hast du einen Nebenjob? Wo arbeitest du?", 
    HL: "Sollten Schüler neben der Schule arbeiten? Was sind die Vor- und Nachteile?",
    check_HL: "Jobbeschreibung (Ich arbeite als...), Stundenlohn/Zeiten, Meinung (Geld vs Zeit für Schule), Vor-/Nachteile."
  },
  { 
    title: "10. Deutsch & Sprachen", 
    OL: "Warum lernst du Deutsch? Warst du schon mal in Deutschland?", 
    HL: "Warum ist es wichtig, Fremdsprachen zu lernen? Was gefällt dir an der deutschen Kultur?",
    check_HL: "Gründe (Jobchancen, Reisen), Erfahrung in Deutschland, Meinung (Deutsch ist schwer/logisch), Nebensätze."
  },
  { 
    title: "11. Soziale Probleme", 
    OL: "Ist das Leben für Jugendliche heute schwer?", 
    HL: "Alkohol, Drogen und Obdachlosigkeit. Was sind die größten Probleme in Irland heute?",
    check_HL: "Spezifisches Problem (Obdachlosigkeit, Alkohol), Ursachen, Lösungen (Die Regierung sollte...), Eigene Meinung."
  },
  { 
    title: "12. Technologie", 
    OL: "Hast du ein Handy? Wie oft benutzt du das Internet?", 
    HL: "Welche Rolle spielen soziale Medien in deinem Leben? Fluch oder Segen?",
    check_HL: "Nutzung (Ich benutze...), Soziale Medien, Gefahren (Cybermobbing), Vorteile (Kontakt bleiben)."
  },
  { 
    title: "13. Letztes Wochenende", 
    OL: "Was hast du letztes Wochenende gemacht? Bist du ausgegangen?", 
    HL: "Erzähl mir genau, was du letztes Wochenende gemacht hast. War es ein typisches Wochenende?",
    check_HL: "Perfekt (Ich habe gelernt, Ich bin gegangen), Präteritum (Es war lustig), Zeitangaben."
  },
  { 
    title: "14. Nächstes Wochenende", 
    OL: "Was wirst du nächstes Wochenende machen?", 
    HL: "Was sind deine Pläne für das nächste Wochenende? Wirst du lernen oder dich entspannen?",
    check_HL: "Futur I (Ich werde... gehen), Pläne (Ich habe vor, zu...), Modalverben (Ich möchte...), Aktivitäten."
  },
  { 
    title: "15. Feste & Feiern", 
    OL: "Wie feierst du deinen Geburtstag? Was machst du an Weihnachten?", 
    HL: "Welches ist dein Lieblingsfest? Wie feiern die Iren im Vergleich zu den Deutschen?",
    check_HL: "Feiertage, Traditionen (Geschenke, Essen), Vergleich (In Irland...), Meinung."
  }
];

const PAST_Q = ["Was hast du gestern gemacht?", "Was hast du letzten Sommer gemacht?", "Wie hast du deinen letzten Geburtstag gefeiert?"];
const FUT_Q = ["Was wirst du morgen machen?", "Was sind deine Pläne für den Sommer?", "Was wirst du nach den Prüfungen machen?"];

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'OL' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'HL' ? 'level-btn hl active' : 'level-btn'; 
    if(currentTopic && !isMockExam) updateQuestion(); 
}

function initConv() { 
    const g = document.getElementById('topicGrid'); 
    g.innerHTML = ""; 
    DATA_CONV.forEach((item) => { 
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
    const t = rawHTML.replace(/<[^>]*>/g, " ").replace(/\(OL\)|\(HL\)/g, "").replace(/OL|HL/g, "").replace(/[0-9]\./g, ""); 
    
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'de-DE'; 
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } 
}

function startMockExam() { 
    isMockExam = true; 
    mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    
    let i = [...Array(DATA_CONV.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA_CONV[i[0]][currentLevel],
        DATA_CONV[i[1]][currentLevel],
        DATA_CONV[i[2]][currentLevel],
        PAST_Q[Math.floor(Math.random()*3)],
        FUT_Q[Math.floor(Math.random()*3)]
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Frage ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
    
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

    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    if (hintBox && btnHint) {
        hintBox.style.display = 'none'; 
        if (currentLevel === 'HL' && currentTopic.check_HL) {
            btnHint.style.display = 'inline-block';
            hintBox.innerHTML = "<strong>📝 Wichtige Punkte / Key Points (HL):</strong><br>" + currentTopic.check_HL;
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
        document.getElementById('qDisplay').innerHTML = "Wähle ein Thema oder starte den Mock Exam.";
        const btnHint = document.getElementById('btnHint');
        if(btnHint) btnHint.style.display = 'none';
    } else {
        document.getElementById('userInput').value = "";
    }
}

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Bitte sag etwas mehr...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Korrigiere...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

  let criteria = "Correct grammar (Wortstellung!) and vocabulary."; 
  if (currentLevel === 'HL' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Strict Leaving Cert German Oral Examiner (Ireland).
    CONTEXT: RAW VOICE TRANSCRIPTION (No punctuation).
    QUESTION: "${questionContext}"
    LEVEL: ${currentLevel}.
    STUDENT ANSWER: "${t}"
    
    CRITICAL INSTRUCTIONS:
    1. IGNORE punctuation/capitalization errors.
    2. CHECK GRAMMAR: Verb position (Wortstellung), Cases (Akkusativ/Dativ), Tenses.
    3. CHECK CONTENT: The student MUST mention: [ ${criteria} ].
       - If HL: Be strict on content and grammar.
    
    OUTPUT JSON ONLY: { 
        "score": (0-100), 
        "feedback_de": "German feedback. Mention missing points.", 
        "feedback_en": "English feedback explaining grammar mistakes.", 
        "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] 
    }
  `;

  try {
    // CONEXIÓN AL BACKEND (NETLIFY)
    const r = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!r.ok) throw new Error("Backend Fehler");
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);

    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Ergebnis: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbDE').innerText = "🇩🇪 " + j.feedback_de; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "<div style='color:#166534; font-weight:bold;'>✅ Sehr gut!</div>";

    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) {
        btnReset.innerText = "➡️ Nächste Frage";
        btnReset.onclick = nextMockQuestion; 
    } else {
        btnReset.innerText = "🔄 Anderes Thema";
        btnReset.onclick = resetApp; 
    }
  } catch (e) { 
      console.error(e); 
      alert("⚠️ Fehler: " + e.message); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Prüfen"; 
  }
}

// ===========================================
// PARTE 2: ROLEPLAYS
// ===========================================
let rpActual = null; 
let pasoActual = 0; 
let speaking = false;

// Datos limpios y corregidos
const RP_DATA = {
    1: { 
        context: "Hund verloren (Missing Dog). You are staying with the Vogler family in Berlin. You lost their dog Otto in Grunewald after seeing a wild boar. You are at the police station.", 
        dialogs: [
            "Guten Tag. Bitte setzen Sie sich. Wie kann ich Ihnen helfen?", 
            "Verstehe. Um wann genau ist das passiert und wo im Grunewald waren Sie?", 
            "Können Sie den Hund genauer beschreiben? Rasse, Aussehen, Charakter?", 
            "Das ist hilfreich. Haben Sie schon etwas unternommen, um ihn zu finden?", 
            ["Ich rate Ihnen, den Tierschutzverein anzurufen. Hier ist die Nummer.", "Hängen Sie auch Zettel in der Nachbarschaft auf. Wir melden uns, wenn wir etwas hören."]
        ], 
        sugerencias: [
            "Guten Tag. Ich heiße [Name] und wohne bei Familie Vogler. Ich muss einen Verlust melden: Der Hund der Familie ist weggelaufen.", 
            "Es ist heute Morgen gegen 10 Uhr passiert. Ich war im Grunewald spazieren, als wir plötzlich einem Wildschwein begegnet sind.", 
            "Otto ist ein kleiner Terrier-Mischling. Er hat braunes Fell und ist sehr freundlich, aber er hat keinen Mikrochip. Er trägt ein rotes Halsband.", 
            "Ja, ich habe laut nach ihm gerufen und lange gewartet, aber er kam nicht zurück. Ich mache mir große Sorgen.", 
            "Vielen Dank, Herr Wachtmeister. Das mache ich sofort. Ich bin immer noch ganz zittrig... ein Wildschwein mitten in Berlin! Das ist doch gefährlich!"
        ] 
    },
    2: { 
        context: "Anruf bei der Redaktion (Editorial Office). You are doing a project on 'Food & Drink'. You call 'Essen & Trinken' magazine in Hamburg.", 
        dialogs: [
            "Redaktion 'Essen & Trinken', guten Tag. Was kann ich für Sie tun?", 
            "Moment bitte... Hier spricht Müller von der Redaktion. Wie war Ihr Name noch einmal?", 
            "Aha. Und was genau möchten Sie wissen? Geht es um deutsche Küche?", 
            "Interessant. Und wie ist das bei Ihnen in Irland? Welche deutschen Produkte sind dort beliebt?", 
            ["Gut, ich kann Ihnen gerne einige alte Ausgaben zuschicken.", "Schicken Sie mir einfach eine E-Mail mit Ihrer Adresse. Auf Wiederhören."]
        ], 
        sugerencias: [
            "Guten Tag, hier spricht [Name] aus Irland. Ich mache ein Schulprojekt über Essen und Trinken und würde gerne mit einem Journalisten sprechen.", 
            "Entschuldigung, ich habe Ihren Namen akustisch nicht verstanden. Könnten Sie ihn bitte buchstabieren? Ich habe schon viel im Internet recherchiert.", 
            "Ich möchte wissen: Ist typisch deutsches Essen immer noch beliebt oder gibt es neue Trends? Essen die Deutschen heute gesünder?", 
            "Also, in Irland kaufen viele Leute bei Lidl und Aldi ein. Deutsches Brot und deutsche Wurst sind sehr beliebt, aber Sauerkraut mag fast niemand.", 
            "Das wäre fantastisch! Ich brauche Material für meine Collage. Ich schicke Ihnen meine Adresse sofort per E-Mail. Haben Sie eine direkte E-Mail-Adresse?"
        ] 
    },
    3: { 
        context: "Interview fürs Fernsehen (TV Interview). You are an Erasmus student in Leipzig. MDR TV interviews you.", 
        dialogs: [
            "Hallo! Wir sind vom MDR Fernsehen. Dürfen wir Ihnen ein paar Fragen zu Ihrem Aufenthalt hier stellen?", 
            "Toll, dass Sie so gut Deutsch sprechen! Warum haben Sie sich eigentlich für ein Erasmus-Jahr entschieden?", 
            "Und warum ausgerechnet Leipzig? Was gefällt Ihnen hier?", 
            "Wie finden Sie das Studium hier im Vergleich zu Irland? Sind die Studiengebühren ein Thema?", 
            ["Vielen Dank für das Interview. Viel Erfolg noch!", "Das war sehr interessant. Genießen Sie Ihre Zeit in Leipzig!"]
        ], 
        sugerencias: [
            "Ja, natürlich. Ich heiße [Name] und das ist meine Gruppe. Wir kommen aus Irland, Spanien und Frankreich. Ich bin seit Oktober hier und studiere Germanistik.", 
            "Ich wollte unbedingt meine Deutschkenntnisse verbessern und neue Leute kennenlernen. Außerdem macht sich Auslandserfahrung gut im Lebenslauf.", 
            "Leipzig ist eine wunderschöne Stadt mit viel Kultur und Geschichte. Außerdem sind die Mieten hier billiger als in München oder Berlin.", 
            "Das Punktesystem in Irland ist sehr stressig. Hier in Deutschland finde ich es gut, dass es keine Studiengebühren gibt. Das ist viel fairer.", 
            "Danke schön! Wir haben das Nachtleben schon getestet und es ist super. Auf Wiedersehen!"
        ] 
    },
    4: { 
        context: "Eltern überreden (Persuading Parents). Inviting an Austrian friend to a festival in Ireland. Parents are worried.", 
        dialogs: [
            "Hallo! Hier ist der Vater von Thomas. Schön, dich kennenzulernen.", 
            "Thomas hat erzählt, du hast ihn zu einem Festival eingeladen. Wann und wo ist das genau?", 
            "Ich weiß nicht recht. Ist Thomas nicht noch zu jung für so eine weite Reise allein?", 
            "Aber auf solchen Festivals gibt es doch immer viel Alkohol und Drogen. Ich mache mir Sorgen.", 
            ["Na gut, wenn du meinst, dass ihr vernünftig seid...", "Okay, wir überlegen es uns noch einmal. Danke für den Anruf."]
        ], 
        sugerencias: [
            "Guten Tag, Herr Hofer. Ich freue mich auch sehr. Thomas und ich verstehen uns super über das Internet.", 
            "Ja, genau! Es ist das 'Electric Picnic' Festival. Es findet im September in Stradbally statt. Es kommen viele bekannte Bands!", 
            "Ach, keine Sorge! Thomas ist fast 18 und sehr vernünftig. Außerdem hole ich ihn vom Flughafen ab und er wohnt bei uns.", 
            "Ich verstehe Ihre Sorgen, aber wir passen gut auf uns auf. Letztes Jahr war ich auch dort und es war alles sehr sicher und friedlich.", 
            "Vielen Dank für Ihr Vertrauen, Herr Hofer! Meine Eltern sind auch einverstanden. Wir werden uns regelmäßig bei Ihnen melden."
        ] 
    },
    5: { 
        context: "Ferienjob (Problem mit Touristen). Tour guide in Ireland. Difficult tourist complaining about delay.", 
        dialogs: [
            "Endlich! Wir warten schon seit einer Ewigkeit. Das geht ja gut los!", 
            "Das Wetter ist auch furchtbar. Regnet es hier eigentlich immer?", 
            "Und was steht jetzt auf dem Programm? Ich hoffe, nicht wieder stundenlang Busfahren.", 
            "Ich habe viel Geld für diese Reise bezahlt und erwarte erstklassigen Service!", 
            ["Na gut, hoffentlich wird das Hotel wenigstens besser sein.", "Wir werden sehen. Fahren wir jetzt endlich los?"]
        ], 
        sugerencias: [
            "Guten Tag und herzlich willkommen in Irland. Es tut mir wahnsinnig leid, dass ich zu spät bin. Der Bus hatte leider eine Panne.", 
            "Haha, das ist eben Irland! Aber keine Sorge, das Wetter wechselt hier schnell. Morgen soll die Sonne scheinen.", 
            "Nein, keine Sorge. Heute fahren wir nur kurz zum Hotel, essen zu Abend und Sie können sich entspannen. Morgen geht es zu den Cliffs of Moher.", 
            "Ich verstehe Ihren Ärger, aber wir haben ein tolles Programm für Sie zusammengestellt. Alle Eintrittsgelder sind im Preis inklusive.", 
            "Das Hotel ist ausgezeichnet und das Essen dort ist fantastisch. Bitte steigen Sie ein, wir fahren sofort los. Danke für Ihre Geduld!"
        ] 
    }
};

function seleccionarRP(id, btn) {
    rpActual = id; pasoActual = 0; speaking = false;
    document.querySelectorAll('.rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('rpArea').style.display = "block";
    document.getElementById('rpContext').innerHTML = "Situation: " + RP_DATA[id].context;
    
    // Aquí es donde se generaba el error si la data no cargaba. Ahora debería funcionar.
    document.getElementById('rpChat').innerHTML = `<div class="bubble ex"><b>System:</b> Press "Start Examiner" to begin.</div>`;
    
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "▶️ Start Examiner";
    nextBtn.className = "audio-btn"; 
    nextBtn.style.background = "#D32F2F"; 
    nextBtn.style.color = "white";
    nextBtn.onclick = reproducirInterventoExaminer; 
    
    document.getElementById('rpInput').disabled = true; 
    document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
}

function reproducirInterventoExaminer() {
    let dialogText = RP_DATA[rpActual].dialogs[pasoActual];
    if (Array.isArray(dialogText)) dialogText = dialogText[Math.floor(Math.random() * dialogText.length)];

    const chat = document.getElementById('rpChat');
    const lastMsg = chat.lastElementChild;
    const isReplay = lastMsg && lastMsg.classList.contains('ex') && lastMsg.innerText.includes(dialogText);

    if (!isReplay) {
        if (pasoActual >= 5) {
            chat.innerHTML += `<div class="bubble ex" style="background:#dcfce7; border-color:#86efac;"><b>System:</b> Roleplay Completed!</div>`;
            document.getElementById('nextAudioBtn').style.display = "none";
            return;
        }
        chat.innerHTML += `<div class="bubble ex"><b>Examiner:</b> ${dialogText}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }

    reproducirAudio(dialogText);

    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "🔄 Noch einmal hören / Replay";
    nextBtn.style.background = "#fbbf24"; 
    nextBtn.style.color = "black";
    nextBtn.onclick = () => reproducirAudio(dialogText);
}

function reproducirAudio(texto) {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'de-DE'; u.rate = 0.9;
    u.onend = habilitarInput;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
}

function habilitarInput() {
    speaking = false;
    if(pasoActual < 5) { 
        document.getElementById('rpInput').disabled = false;
        document.getElementById('rpSendBtn').disabled = false;
        if(!(/iPad|iPhone|iPod/.test(navigator.userAgent))) document.getElementById('rpInput').focus();
        document.getElementById('hintBtn').style.display = "block";
        document.getElementById('rpInput').placeholder = "Type your reply...";
    }
}

function enviarRespuestaRP() {
    const inp = document.getElementById('rpInput');
    const txt = inp.value.trim(); if(!txt) return;
    
    const chat = document.getElementById('rpChat');
    chat.innerHTML += `<div class="bubble st">${txt}</div>`;
    chat.scrollTop = chat.scrollHeight;
    
    inp.value = ""; inp.disabled = true; document.getElementById('rpSendBtn').disabled = true;
    document.getElementById('hintBtn').style.display = "none";
    
    const nextBtn = document.getElementById('nextAudioBtn');
    nextBtn.style.display = "none";

    pasoActual++;
    
    setTimeout(() => { 
        if(pasoActual < 5) { 
            nextBtn.style.display = "block";
            nextBtn.innerText = "🔊 Weiter / Listen Next";
            nextBtn.style.background = "#D32F2F"; 
            nextBtn.style.color = "white";
            nextBtn.onclick = reproducirInterventoExaminer;
        } else { 
            document.getElementById('rpChat').innerHTML += `<div class="bubble ex" style="background:#dcfce7;"><b>System:</b> Roleplay Completed!</div>`; 
        }
    }, 500);
}

function mostrarSugerencia() {
    const sug = RP_DATA[rpActual].sugerencias[pasoActual];
    if(sug) {
        const chat = document.getElementById('rpChat');
        chat.innerHTML += `<div class="feedback-rp">💡 <b>Model Answer:</b> ${sug}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
}

// ===========================================
// PARTE 3: BILDERSERIEN (STORIES - OFFICIAL)
// ===========================================
let currentStoryTitle = "";

const STORIE_DATA = [
  { title: "1. Handy Mobbing (Bullying)", context: "A girl gets bullied online because of a photo." },
  { title: "2. Chancen durch Deutsch (Careers)", context: "Students visit a career fair and learn about German." },
  { title: "3. Die Abi-Tour (School Trip)", context: "Class voting on a trip: Mallorca vs Ireland." },
  { title: "4. Die Geburtstagsüberraschung", context: "A girl turns 18 and gets a tattoo instead of driving lessons." },
  { title: "5. Mehr Windkraft (Wind Energy)", context: "Town meeting about building wind turbines." }
];

function selectStory(index, btn) {
    document.querySelectorAll('#sectionStory .rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentStoryTitle = STORIE_DATA[index].title;
    document.getElementById('storyArea').style.display = 'block';
    document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyTitle').innerText = currentStoryTitle;
    document.getElementById('userInputStory').value = "";
}

function speakStoryPrompt() {
    const text = "Schauen wir uns diese Bildergeschichte an. Erzähl mir bitte, was hier passiert.";
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
  if(t.length < 5) return alert("Bitte schreib etwas mehr...");
  
  const b = document.getElementById('btnActionStory'); 
  b.disabled = true; b.innerText = "⏳ Korrigiere...";

  const prompt = `
    ACT AS: German Leaving Cert Examiner.
    TASK: The student is describing a Picture Sequence (Bilderserie): "${currentStoryTitle}".
    STUDENT INPUT: "${t}"
    OUTPUT JSON ONLY: { "score": (0-100), "feedback_de": "German feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
  `;

  try {
    // CONEXIÓN AL BACKEND (NETLIFY)
    const r = await fetch('/.netlify/functions/gemini', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!r.ok) throw new Error("Backend Fehler");
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);

    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('storyArea').style.display = 'none'; 
    document.getElementById('resultStory').style.display = 'block';
    document.getElementById('userResponseTextStory').innerText = t;
    document.getElementById('scoreDisplayStory').innerText = `Ergebnis: ${j.score}%`;
    document.getElementById('scoreDisplayStory').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbDEStory').innerText = "🇩🇪 " + j.feedback_de; 
    document.getElementById('fbENStory').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListStory').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Super!";

  } catch (e) { 
      console.error(e); 
      alert("⚠️ Fehler: " + e.message); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Prüfen"; 
  }
}

function resetStory() {
    document.getElementById('resultStory').style.display = 'none';
    document.getElementById('storyArea').style.display = 'block';
    document.getElementById('userInputStory').value = "";
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE'; 
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

// Inicialización
window.onload = initConv;
