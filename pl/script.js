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
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
}

// ===========================================
// PARTE 1: ROZMOWA (15 TEMATÓW + STUDY MODE)
// ===========================================
let currentLevel = 'General';
let currentMode = 'exam';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

const DATA = [
  { 
    title: "1. O sobie (Myself)", 
    General: "Jak masz na imię? Ile masz lat? Skąd jesteś?", 
    Advanced: "Opowiedz mi o sobie. Jakie są twoje mocne i słabe strony?",
    check_HL: "Imię, Wiek, Pochodzenie (Jestem z...), Cechy charakteru, Zainteresowania (Interesuję się + Narzędnik).",
    checkpoints_OL: ["Nazywam się... (Mianownik)", "Mam X lat (Dopełniacz)", "Mieszkam w... (Miejscownik)"],
    checkpoints_HL: ["Cechy charakteru (Ambitny, Otwarty)", "Interesuję się... (Narzędnik)", "Moje wady i zalety"],
    checkpoints_TOP: ["✨ Idiom: Mieć głowę na karku", "✨ Grammar: Zaimki zwrotne (Się)", "✨ Vocab: Tożsamość"]
  },
  { 
    title: "2. Rodzina (Family)", 
    General: "Masz rodzeństwo? Czym zajmują się twoi rodzice?", 
    Advanced: "Opisz swoją rodzinę. Czy dobrze dogadujesz się z rodzicami? Czy istnieje konflikt pokoleń?",
    check_HL: "Liczba osób, Zawody rodziców, Rodzeństwo, Relacje (Dogaduję się z...), Konflikt pokoleń.",
    checkpoints_OL: ["Mam brata/siostrę (Biernik)", "Moi rodzice pracują jako...", "Moja rodzina jest duża"],
    checkpoints_HL: ["Relacje (Kłócić się z...)", "Konflikt pokoleń", "Wspieramy się nawzajem"],
    checkpoints_TOP: ["✨ Idiom: Niedaleko pada jabłko od jabłoni", "✨ Grammar: Dopełniacz (Nie mam brata)", "✨ Vocab: Więzi rodzinne"]
  },
  { 
    title: "3. Dom i Okolica", 
    General: "Gdzie mieszkasz? Opisz swój dom lub mieszkanie.", 
    Advanced: "Wolisz życie w mieście czy na wsi? Uzasadnij swoją opinię.",
    check_HL: "Opis domu, Lokalizacja (Na przedmieściach), Miasto vs Wieś, Zalety/Wady.",
    checkpoints_OL: ["Mieszkam w domu jednorodzinnym", "Mój pokój jest...", "W okolicy jest park"],
    checkpoints_HL: ["Zalety życia w mieście", "Infrastruktura i korki", "Spokój na wsi"],
    checkpoints_TOP: ["✨ Idiom: Czuć się jak u siebie w domu", "✨ Grammar: Miejscownik (W domu, W bloku)", "✨ Vocab: Wynajem mieszkania"]
  },
  { 
    title: "4. Szkoła (School)", 
    General: "Do jakiej szkoły chodzisz? Jakie przedmioty lubisz?", 
    Advanced: "Co sądzisz o systemie edukacji w Irlandii? Czy matura (Leaving Cert) to sprawiedliwy egzamin?",
    check_HL: "Nazwa szkoły, Przedmioty (Uczę się...), System punktowy (CAO), Stres egzaminacyjny.",
    checkpoints_OL: ["Chodzę do szkoły średniej", "Moim ulubionym przedmiotem jest...", "Nie lubię matematyki"],
    checkpoints_HL: ["System punktowy (CAO)", "Presja egzaminacyjna", "Zajęcia pozalekcyjne"],
    checkpoints_TOP: ["✨ Idiom: Wkuwać na pamięć", "✨ Grammar: Uczę się + Dopełniacz", "✨ Vocab: Egzamin dojrzałości"]
  },
  { 
    title: "5. Czas wolny (Hobbies)", 
    General: "Co robisz w wolnym czasie? Uprawiasz jakiś sport?", 
    Advanced: "Dlaczego warto mieć hobby? Jak spędzasz czas ze znajomymi?",
    check_HL: "Zainteresowania (Lubię + Bezokolicznik), Sport, Znaczenie relaksu, Balans szkoła-życie.",
    checkpoints_OL: ["Gram w piłkę nożną", "Słucham muzyki", "Spotykam się z przyjaciółmi"],
    checkpoints_HL: ["Zdrowie psychiczne", "Sporty drużynowe", "Oderwać się od nauki"],
    checkpoints_TOP: ["✨ Idiom: Zabijać czas", "✨ Grammar: Grać w + Biernik (Sport)", "✨ Vocab: Pasja"]
  },
  { 
    title: "6. Polska vs Irlandia", 
    General: "Byłeś kiedyś w Polsce? Co ci się tam podoba?", 
    Advanced: "Porównaj życie w Polsce i w Irlandii. Gdzie wolisz mieszkać i dlaczego?",
    check_HL: "Podobieństwa/Różnice, Kultura, Pogoda, Mentalność ludzi, Emigracja.",
    checkpoints_OL: ["Polska jest piękna", "Jedzenie jest smaczne", "Irlandia jest zielona"],
    checkpoints_HL: ["Polonia w Irlandii", "Różnice kulturowe", "Tęsknota za krajem"],
    checkpoints_TOP: ["✨ Idiom: Co kraj, to obyczaj", "✨ Grammar: Stopień wyższy (Lepszy niż...)", "✨ Vocab: Dziedzictwo narodowe"]
  },
  { 
    title: "7. Plany na przyszłość", 
    OL: "Co zamierzasz robić po maturze? Chcesz iść na studia?", 
    HL: "Kim chciałbyś zostać w przyszłości? Czy studia są dzisiaj konieczne do sukcesu?",
    check_HL: "Studia (Uniwersytet), Praca, Podróże (Gap Year), Marzenia zawodowe.",
    checkpoints_OL: ["Chcę iść na studia", "Będę pracować", "Chcę zostać lekarzem (Narzędnik)"],
    checkpoints_HL: ["Rynek pracy", "Kariera zawodowa", "Niezależność finansowa"],
    checkpoints_TOP: ["✨ Idiom: Mieć świat u stóp", "✨ Grammar: Czas Przyszły (Będę robić)", "✨ Vocab: Wykształcenie wyższe"]
  },
  { 
    title: "8. Praca (Work)", 
    OL: "Masz pracę dorywczą? Co robisz?", 
    HL: "Czy łączenie nauki z pracą to dobry pomysł? Jakie są zalety i wady?",
    check_HL: "Rodzaj pracy (Pracuję w...), Zarobki, Doświadczenie, Wpływ na naukę.",
    checkpoints_OL: ["Pracuję w weekendy", "Jestem kelnerem", "Zarabiam pieniądze"],
    checkpoints_HL: ["Niezależność finansowa", "Zdobywanie doświadczenia", "Brak czasu na naukę"],
    checkpoints_TOP: ["✨ Idiom: Ciężka praca popłaca", "✨ Grammar: Pracować jako + Mianownik", "✨ Vocab: Praca dorywcza"]
  },
  { 
    title: "9. Podróże (Travel)", 
    OL: "Gdzie byłeś na wakacjach w zeszłym roku? Lubisz podróżować?", 
    HL: "Dlaczego ludzie podróżują? Opowiedz o swojej podróży marzeń.",
    check_HL: "Opis wakacji (Byłem w...), Sposób podróżowania, Znaczenie podróży (Poznawanie kultur).",
    checkpoints_OL: ["Byłem we Włoszech", "Jechałem pociągiem", "Było słonecznie"],
    checkpoints_HL: ["Turystyka masowa", "Poznawanie nowych kultur", "Bariera językowa"],
    checkpoints_TOP: ["✨ Idiom: Podróże kształcą", "✨ Grammar: Czas Przeszły (Byłem/Byłam)", "✨ Vocab: Zakwaterowanie"]
  },
  { 
    title: "10. Problemy społeczne", 
    OL: "Czy życie młodych ludzi jest trudne?", 
    HL: "Jakie są największe problemy młodzieży w dzisiejszych czasach? (np. stres, uzależnienia).",
    check_HL: "Problemy (Alkohol/Narkotyki), Presja rówieśników, Media społecznościowe, Rozwiązania.",
    checkpoints_OL: ["Jest dużo stresu", "Problemy z alkoholem", "Brak pieniędzy"],
    checkpoints_HL: ["Uzależnienia", "Presja rówieśnicza", "Zdrowie psychiczne"],
    checkpoints_TOP: ["✨ Idiom: Błędne koło", "✨ Grammar: Powinniśmy + Bezokolicznik", "✨ Vocab: Bezdomność"]
  },
  { 
    title: "11. Nowoczesne technologie", 
    OL: "Masz telefon? Jak często korzystasz z internetu?", 
    HL: "Czy technologia ułatwia czy utrudnia życie? Opowiedz o zagrożeniach w sieci.",
    check_HL: "Zalety (Komunikacja), Wady (Uzależnienie/Cyberprzemoc), Rola AI, Przyszłość.",
    checkpoints_OL: ["Używam Instagrama", "Gram w gry", "Internet jest przydatny"],
    checkpoints_HL: ["Cyberprzemoc (Cyberbullying)", "Media społecznościowe", "Fake news"],
    checkpoints_TOP: ["✨ Idiom: Być on-line", "✨ Grammar: Korzystać z + Dopełniacz", "✨ Vocab: Sztuczna inteligencja"]
  },
  { 
    title: "12. Portfolio / Teksty", 
    OL: "Jaki tekst omawiałeś w szkole? O czym on jest?", 
    HL: "Wybierz jeden tekst ze swojego Portfolio. Omów głównego bohatera i przesłanie utworu.",
    check_HL: "Tytuł/Autor, Streszczenie (O czym?), Bohaterowie, Tematyka (Miłość/Wojna/Emigracja).",
    checkpoints_OL: ["Przeczytałem książkę...", "Główny bohater to...", "Podobało mi się, bo..."],
    checkpoints_HL: ["Analiza postaci", "Motyw emigracji", "Przesłanie autora"],
    checkpoints_TOP: ["✨ Idiom: Czytać między wierszami", "✨ Grammar: Mowa zależna", "✨ Vocab: Literatura faktu"]
  },
  { 
    title: "13. Święta i Tradycje", 
    OL: "Jak obchodzisz Boże Narodzenie? Co jesz w Wigilię?", 
    HL: "Porównaj tradycje polskie i irlandzkie. Czy młodzi ludzie wciąż kultywują tradycje?",
    check_HL: "Opis świąt (Wigilia/Wielkanoc), Potrawy (Pierogi/Opłatek), Zwyczaje, Zmiany w tradycji.",
    checkpoints_OL: ["Dzielimy się opłatkiem", "Jemy karpia", "Dostaję prezenty"],
    checkpoints_HL: ["Zanikanie tradycji", "Święta komercyjne", "Rodzinna atmosfera"],
    checkpoints_TOP: ["✨ Idiom: Czuć magię świąt", "✨ Grammar: W czasie świąt...", "✨ Vocab: Zwyczaje ludowe"]
  },
  { 
    title: "14. Zdrowy styl życia", 
    OL: "Czy zdrowo się odżywiasz? Lubisz owoce i warzywa?", 
    HL: "Dlaczego otyłość jest problemem? Co robisz, żeby dbać o zdrowie?",
    check_HL: "Dieta, Sport, Fast food, Konsekwencje złego odżywiania, Rady.",
    checkpoints_OL: ["Jem dużo warzyw", "Piję wodę", "Nie palę papierosów"],
    checkpoints_HL: ["Zbilansowana dieta", "Choroby cywilizacyjne", "Aktywność fizyczna"],
    checkpoints_TOP: ["✨ Idiom: W zdrowym ciele zdrowy duch", "✨ Grammar: Unikać + Dopełniacz", "✨ Vocab: Wegetarianizm"]
  },
  { 
    title: "15. Autorytet / Idol", 
    OL: "Kto jest twoim idolem? Dlaczego go lubisz?", 
    HL: "Kto jest autorytetem dla młodych ludzi? Czy celebryci to dobre wzorce do naśladowania?",
    check_HL: "Osoba (Papież/Piłkarz/Rodzic), Cechy, Wpływ na ludzi, Różnica Idol vs Autorytet.",
    checkpoints_OL: ["Moim idolem jest...", "On jest utalentowany", "Pomaga ludziom"],
    checkpoints_HL: ["Wzór do naśladowania", "Wpływ influencerów", "Prawdziwe wartości"],
    checkpoints_TOP: ["✨ Idiom: Brać z kogoś przykład", "✨ Grammar: Podziwiać kogoś (Biernik)", "✨ Vocab: Charyzma"]
  }
];

const PAST_Q = ["Co robiłeś wczoraj?", "Gdzie byłeś w zeszłe wakacje?", "Jak spędziłeś ostatni weekend?"];
const FUT_Q = ["Co będziesz robić jutro?", "Gdzie pojedziesz w przyszłym roku?", "Kim chcesz zostać w przyszłości?"];

// ===========================================
// LÓGICA DE CONTROL (NIVEL Y MODO)
// ===========================================

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'General' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'Advanced' ? 'level-btn hl active' : 'level-btn'; 
    
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
    const t = rawHTML.replace(/<[^>]*>/g, " ").replace(/\(General\)|\(Advanced\)/g, ""); 
    
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'pl-PL'; 
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
        PAST_Q[Math.floor(Math.random()*3)] + " (Czas Przeszły)",
        FUT_Q[Math.floor(Math.random()*3)] + " (Czas Przyszły)"
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Pytanie ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
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
        if (currentLevel === 'Advanced' && currentTopic.check_HL) {
            btnHint.style.display = 'inline-block';
            hintBox.innerHTML = "<strong>📝 Kluczowe punkty (Key Points):</strong><br>" + currentTopic.check_HL;
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
        document.getElementById('qDisplay').innerHTML = "Wybierz temat (Select a topic)...";
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
  if(t.length < 5) return alert("Proszę napisać więcej...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Sprawdzam...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  let criteria = "Poprawna gramatyka (Przypadki) i słownictwo."; 
  if (currentLevel === 'Advanced' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Strict Polish Examiner (Leaving Cert Ireland).
    CONTEXT: RAW TEXT (No punctuation).
    QUESTION: "${questionContext}"
    LEVEL: ${currentLevel}.
    STUDENT ANSWER: "${t}"
    CHECKPOINTS: [ ${criteria} ].
    INSTRUCTIONS: Check Grammar carefully (Cases/Przypadki, Gender/Rodzaje, Aspect/Aspekt).
    OUTPUT JSON: { "score": 0-100, "feedback_pl": "Polish feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
  `;

  try {
    const rawText = await callSmartAI(prompt);
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    const j = JSON.parse(cleanJson);
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    
    const s = document.getElementById('scoreDisplay');
    s.innerText = `Wynik: ${j.score}%`;
    s.style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbPL').innerText = "🇵🇱 " + j.feedback_pl; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    
    const l = document.getElementById('errorsList'); l.innerHTML = "";
    if(j.errors && j.errors.length > 0) {
        j.errors.forEach(e => { l.innerHTML += `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`; });
    } else {
        l.innerHTML = "<div style='color:#166534; font-weight:bold;'>✅ Świetnie! (Excellent!)</div>";
    }

    const btnReset = document.getElementById('btnReset');
    if (isMockExam) {
        if (mockIndex < 4) {
            btnReset.innerText = "➡️ Następne pytanie"; btnReset.onclick = nextMockQuestion; 
        } else {
            btnReset.innerText = "🏁 Zakończ test"; btnReset.onclick = resetApp; 
        }
    } else {
        btnReset.innerText = "🔄 Inny temat"; btnReset.onclick = resetApp; 
    }
  } catch (e) { 
      console.error(e); 
      alert("⚠️ Błąd: " + e.message); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Sprawdź"; 
  }
}

// ===========================================
// MODO FORMACIÓN (STUDY MODE AI)
// ===========================================

function initStudyHTML() {
    // El contenedor ya está en HTML
}

function renderCheckpoints() {
    const container = document.getElementById('studyContainer');
    if (!container) return;

    if (!currentTopic) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#64748b; font-weight:bold;'>👈 Proszę wybrać temat.</p>";
        return;
    }
    
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

    if (currentTopic.checkpoints_OL) createSection("🧱 Podstawy (Basic)", currentTopic.checkpoints_OL, "btn-ol");
    if (currentLevel === 'Advanced' && currentTopic.checkpoints_HL) {
        createSection("🔧 Rozszerzenie (Advanced)", currentTopic.checkpoints_HL, "btn-hl");
        if(currentTopic.checkpoints_TOP) {
            createSection("🚀 Przydatne zwroty (Phrases)", currentTopic.checkpoints_TOP, "btn-top");
        }
    }
}

async function askAIConcept(concept) {
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; 
    box.innerHTML = "⏳ <b>Pytam nauczyciela AI...</b>";

    const prompt = `
        ACT AS: Polish Teacher.
        TOPIC: "${currentTopic ? currentTopic.title : 'General'}".
        CONCEPT: "${concept}".
        INSTRUCTIONS: Explain in English (max 50 words). Provide 2 Polish examples with English translation.
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

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pl-PL'; 
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

// Inicialización
window.onload = initConv;
