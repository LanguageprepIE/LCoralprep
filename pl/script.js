function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

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

let speechRequestId = 0;

function scrollToVisibleSection(id) {
    const element = document.getElementById(id);
    if (!element) return;
    window.requestAnimationFrame(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function speakWithBrowserTTS(text) {
    const synth = window.speechSynthesis;
    if (!synth || !text || !text.trim()) return;
    const requestId = ++speechRequestId;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = 'pl-PL';
    utterance.rate = 0.9;
    utterance.onerror = event => console.warn('Speech playback failed:', event.error);
    window.setTimeout(() => {
        if (requestId === speechRequestId) synth.speak(utterance);
    }, 120);
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
    General: "Jak ma Pan/Pani na imię? Ile ma Pan/Pani lat? Skąd Pan/Pani jest?", 
    Advanced: "Proszę mi opowiedzieć o sobie. Jakie są Pana/Pani mocne i słabe strony?",
    check_HL: "Imię, Wiek, Pochodzenie (Jestem z...), Cechy charakteru, Zainteresowania (Interesuję się + Narzędnik).",
    checkpoints_OL: ["Nazywam się... (Mianownik)", "Mam X lat (Dopełniacz)", "Mieszkam w... (Miejscownik)"],
    checkpoints_HL: ["Cechy charakteru (Ambitny, Otwarty)", "Interesuję się... (Narzędnik)", "Moje wady i zalety"],
    checkpoints_TOP: ["✨ Idiom: Mieć głowę na karku", "✨ Grammar: Zaimki zwrotne (Się)", "✨ Vocab: Tożsamość"]
  },
  { 
    title: "2. Rodzina (Family)", 
    General: "Czy ma Pan/Pani rodzeństwo? Czym zajmują się Pana/Pani rodzice?", 
    Advanced: "Proszę opisać swoją rodzinę. Czy dobrze dogaduje się Pan/Pani z rodzicami? Czy istnieje konflikt pokoleń?",
    check_HL: "Liczba osób, Zawody rodziców, Rodzeństwo, Relacje (Dogaduję się z...), Konflikt pokoleń.",
    checkpoints_OL: ["Mam brata/siostrę (Biernik)", "Moi rodzice pracują jako...", "Moja rodzina jest duża"],
    checkpoints_HL: ["Relacje (Kłócić się z...)", "Konflikt pokoleń", "Wspieramy się nawzajem"],
    checkpoints_TOP: ["✨ Idiom: Niedaleko pada jabłko od jabłoni", "✨ Grammar: Dopełniacz (Nie mam brata)", "✨ Vocab: Więzi rodzinne"]
  },
  { 
    title: "3. Dom i Okolica", 
    General: "Gdzie Pan/Pani mieszka? Proszę opisać swój dom lub mieszkanie.", 
    Advanced: "Woli Pan/Pani życie w mieście czy na wsi? Proszę uzasadnić swoją opinię.",
    check_HL: "Opis domu, Lokalizacja (Na przedmieściach), Miasto vs Wieś, Zalety/Wady.",
    checkpoints_OL: ["Mieszkam w domu jednorodzinnym", "Mój pokój jest...", "W okolicy jest park"],
    checkpoints_HL: ["Zalety życia w mieście", "Infrastruktura i korki", "Spokój na wsi"],
    checkpoints_TOP: ["✨ Idiom: Czuć się jak u siebie w domu", "✨ Grammar: Miejscownik (W domu, W bloku)", "✨ Vocab: Wynajem mieszkania"]
  },
  { 
    title: "4. Szkoła (School)", 
    General: "Do jakiej szkoły Pan/Pani chodzi? Jakie przedmioty Pan/Pani lubi?", 
    Advanced: "Co sądzi Pan/Pani o systemie edukacji w Irlandii? Czy matura (Leaving Cert) to sprawiedliwy egzamin?",
    check_HL: "Nazwa szkoły, Przedmioty (Uczę się...), System punktowy (CAO), Stres egzaminacyjny.",
    checkpoints_OL: ["Chodzę do szkoły średniej", "Moim ulubionym przedmiotem jest...", "Nie lubię matematyki"],
    checkpoints_HL: ["System punktowy (CAO)", "Presja egzaminacyjna", "Zajęcia pozalekcyjne"],
    checkpoints_TOP: ["✨ Idiom: Wkuwać na pamięć", "✨ Grammar: Uczę się + Dopełniacz", "✨ Vocab: Egzamin dojrzałości"]
  },
  { 
    title: "5. Czas wolny (Hobbies)", 
    General: "Co robi Pan/Pani w wolnym czasie? Czy uprawia Pan/Pani jakiś sport?", 
    Advanced: "Dlaczego warto mieć hobby? Jak spędza Pan/Pani czas ze znajomymi?",
    check_HL: "Zainteresowania (Lubię + Bezokolicznik), Sport, Znaczenie relaksu, Balans szkoła-życie.",
    checkpoints_OL: ["Gram w piłkę nożną", "Słucham muzyki", "Spotykam się z przyjaciółmi"],
    checkpoints_HL: ["Zdrowie psychiczne", "Sporty drużynowe", "Oderwać się od nauki"],
    checkpoints_TOP: ["✨ Idiom: Zabijać czas", "✨ Grammar: Grać w + Biernik (Sport)", "✨ Vocab: Pasja"]
  },
  { 
    title: "6. Polska vs Irlandia", 
    General: "Czy był Pan / była Pani kiedyś w Polsce? Co się Panu/Pani tam podoba?", 
    Advanced: "Proszę porównać życie w Polsce i w Irlandii. Gdzie woli Pan/Pani mieszkać i dlaczego?",
    check_HL: "Podobieństwa/Różnice, Kultura, Pogoda, Mentalność ludzi, Emigracja.",
    checkpoints_OL: ["Polska jest piękna", "Jedzenie jest smaczne", "Irlandia jest zielona"],
    checkpoints_HL: ["Polonia w Irlandii", "Różnice kulturowe", "Tęsknota za krajem"],
    checkpoints_TOP: ["✨ Idiom: Co kraj, to obyczaj", "✨ Grammar: Stopień wyższy (Lepszy niż...)", "✨ Vocab: Dziedzictwo narodowe"]
  },
  { 
    title: "7. Plany na przyszłość", 
    General: "Co zamierza Pan/Pani robić po maturze? Czy chce Pan/Pani iść na studia?", 
    Advanced: "Kim chciałby Pan / chciałaby Pani zostać w przyszłości? Czy studia są dzisiaj konieczne do sukcesu?",
    check_HL: "Studia (Uniwersytet), Praca, Podróże (Gap Year), Marzenia zawodowe.",
    checkpoints_OL: ["Chcę iść na studia", "Będę pracować", "Chcę zostać lekarzem (Narzędnik)"],
    checkpoints_HL: ["Rynek pracy", "Kariera zawodowa", "Niezależność finansowa"],
    checkpoints_TOP: ["✨ Idiom: Mieć świat u stóp", "✨ Grammar: Czas Przyszły (Będę robić)", "✨ Vocab: Wykształcenie wyższe"]
  },
  { 
    title: "8. Praca (Work)", 
    General: "Czy ma Pan/Pani pracę dorywczą? Co Pan/Pani robi?", 
    Advanced: "Czy łączenie nauki z pracą to dobry pomysł? Jakie są zalety i wady?",
    check_HL: "Rodzaj pracy (Pracuję w...), Zarobki, Doświadczenie, Wpływ na naukę.",
    checkpoints_OL: ["Pracuję w weekendy", "Jestem kelnerem", "Zarabiam pieniądze"],
    checkpoints_HL: ["Niezależność finansowa", "Zdobywanie doświadczenia", "Brak czasu na naukę"],
    checkpoints_TOP: ["✨ Idiom: Ciężka praca popłaca", "✨ Grammar: Pracować jako + Mianownik", "✨ Vocab: Praca dorywcza"]
  },
  { 
    title: "9. Podróże (Travel)", 
    General: "Gdzie był Pan / była Pani na wakacjach w zeszłym roku? Czy lubi Pan/Pani podróżować?", 
    Advanced: "Dlaczego ludzie podróżują? Proszę opowiedzieć o swojej podróży marzeń.",
    check_HL: "Opis wakacji (Byłem w...), Sposób podróżowania, Znaczenie podróży (Poznawanie kultur).",
    checkpoints_OL: ["Byłem we Włoszech", "Jechałem pociągiem", "Było słonecznie"],
    checkpoints_HL: ["Turystyka masowa", "Poznawanie nowych kultur", "Bariera językowa"],
    checkpoints_TOP: ["✨ Idiom: Podróże kształcą", "✨ Grammar: Czas Przeszły (Byłem/Byłam)", "✨ Vocab: Zakwaterowanie"]
  },
  { 
    title: "10. Problemy społeczne", 
    General: "Czy życie młodych ludzi jest trudne?", 
    Advanced: "Jakie są największe problemy młodzieży w dzisiejszych czasach? (np. stres, uzależnienia).",
    check_HL: "Problemy (Alkohol/Narkotyki), Presja rówieśników, Media społecznościowe, Rozwiązania.",
    checkpoints_OL: ["Jest dużo stresu", "Problemy z alkoholem", "Brak pieniędzy"],
    checkpoints_HL: ["Uzależnienia", "Presja rówieśnicza", "Zdrowie psychiczne"],
    checkpoints_TOP: ["✨ Idiom: Błędne koło", "✨ Grammar: Powinniśmy + Bezokolicznik", "✨ Vocab: Bezdomność"]
  },
  { 
    title: "11. Nowoczesne technologie", 
    General: "Czy ma Pan/Pani telefon? Jak często korzysta Pan/Pani z internetu?", 
    Advanced: "Czy technologia ułatwia czy utrudnia życie? Proszę opowiedzieć o zagrożeniach w sieci.",
    check_HL: "Zalety (Komunikacja), Wady (Uzależnienie/Cyberprzemoc), Rola AI, Przyszłość.",
    checkpoints_OL: ["Używam Instagrama", "Gram w gry", "Internet jest przydatny"],
    checkpoints_HL: ["Cyberprzemoc (Cyberbullying)", "Media społecznościowe", "Fake news"],
    checkpoints_TOP: ["✨ Idiom: Być on-line", "✨ Grammar: Korzystać z + Dopełniacz", "✨ Vocab: Sztuczna inteligencja"]
  },
  { 
    title: "12. Portfolio / Teksty", 
    General: "Jaki tekst omawiał Pan / omawiała Pani w szkole? O czym on jest?", 
    Advanced: "Proszę wybrać jeden tekst ze swojego Portfolio. Proszę omówić głównego bohatera i przesłanie utworu.",
    check_HL: "Tytuł/Autor, Streszczenie (O czym?), Bohaterowie, Tematyka (Miłość/Wojna/Emigracja).",
    checkpoints_OL: ["Przeczytałem książkę...", "Główny bohater to...", "Podobało mi się, bo..."],
    checkpoints_HL: ["Analiza postaci", "Motyw emigracji", "Przesłanie autora"],
    checkpoints_TOP: ["✨ Idiom: Czytać między wierszami", "✨ Grammar: Mowa zależna", "✨ Vocab: Literatura faktu"]
  },
  { 
    title: "13. Święta i Tradycje", 
    General: "Jak obchodzi Pan/Pani Boże Narodzenie? Co je Pan/Pani w Wigilię?", 
    Advanced: "Proszę porównać tradycje polskie i irlandzkie. Czy młodzi ludzie wciąż kultywują tradycje?",
    check_HL: "Opis świąt (Wigilia/Wielkanoc), Potrawy (Pierogi/Opłatek), Zwyczaje, Zmiany w tradycji.",
    checkpoints_OL: ["Dzielimy się opłatkiem", "Jemy karpia", "Dostaję prezenty"],
    checkpoints_HL: ["Zanikanie tradycji", "Święta komercyjne", "Rodzinna atmosfera"],
    checkpoints_TOP: ["✨ Idiom: Czuć magię świąt", "✨ Grammar: W czasie świąt...", "✨ Vocab: Zwyczaje ludowe"]
  },
  { 
    title: "14. Zdrowy styl życia", 
    General: "Czy zdrowo się Pan/Pani odżywia? Czy lubi Pan/Pani owoce i warzywa?", 
    Advanced: "Dlaczego otyłość jest problemem? Co robi Pan/Pani, żeby dbać o zdrowie?",
    check_HL: "Dieta, Sport, Fast food, Konsekwencje złego odżywiania, Rady.",
    checkpoints_OL: ["Jem dużo warzyw", "Piję wodę", "Nie palę papierosów"],
    checkpoints_HL: ["Zbilansowana dieta", "Choroby cywilizacyjne", "Aktywność fizyczna"],
    checkpoints_TOP: ["✨ Idiom: W zdrowym ciele zdrowy duch", "✨ Grammar: Unikać + Dopełniacz", "✨ Vocab: Wegetarianizm"]
  },
  { 
    title: "15. Autorytet / Idol", 
    General: "Kto jest Pana/Pani idolem? Dlaczego go Pan/Pani lubi?", 
    Advanced: "Kto jest autorytetem dla młodych ludzi? Czy celebryci to dobre wzorce do naśladowania?",
    check_HL: "Osoba (Papież/Piłkarz/Rodzic), Cechy, Wpływ na ludzi, Różnica Idol vs Autorytet.",
    checkpoints_OL: ["Moim idolem jest...", "On jest utalentowany", "Pomaga ludziom"],
    checkpoints_HL: ["Wzór do naśladowania", "Wpływ influencerów", "Prawdziwe wartości"],
    checkpoints_TOP: ["✨ Idiom: Brać z kogoś przykład", "✨ Grammar: Podziwiać kogoś (Biernik)", "✨ Vocab: Charyzma"]
  }
];

const PAST_Q = ["Co robił Pan / robiła Pani wczoraj?", "Gdzie był Pan / była Pani w zeszłe wakacje?", "Jak spędził Pan / spędziła Pani ostatni weekend?"];
const FUT_Q = ["Co będzie Pan/Pani robić jutro?", "Gdzie pojedzie Pan/Pani w przyszłym roku?", "Kim chce Pan/Pani zostać w przyszłości?"];

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
    const prompt = isMockExam ? mockQuestions[mockIndex] : (currentTopic ? currentTopic[currentLevel] : '');
    const text = String(prompt || '')
        .replace(/\s*\((?:CZAS PRZESZŁY|CZAS PRZYSZŁY|GENERAL|ADVANCED)\)\s*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    speakWithBrowserTTS(text);
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
    scrollToVisibleSection('exerciseArea');
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
  const t = document.getElementById('userInput').value.trim();
  if (t.length < 5) return alert("Proszę napisać więcej...");
  const b = document.getElementById('btnAction');
  b.disabled = true;
  const originalButtonText = b.innerText;
  b.innerText = "⏳ Evaluating...";
  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic?.[currentLevel];
  const criteria = currentLevel === 'Advanced' || currentLevel === 'Advanced'
    ? (currentTopic?.check_HL || currentTopic?.checkpoints_HL || '')
    : '';
  const advanced = (currentLevel === 'Advanced');
  const prompt = `
    Act as a fair Leaving Certificate Polish oral examiner in Ireland.
    Assess communicative success, relevance to the question, development, range, accuracy and comprehensibility at the stated level.
    Level: ${currentLevel}. Question: ${questionContext}
    Learner response (raw speech transcription): ${t}
    Study guidance (optional support, never a compulsory checklist): ${criteria}
    Apply level-appropriate expectations. Ordinary/OL answers should be judged for clear basic communication; HL/Advanced answers can show more development and range, but do not expect native-speaker performance. Do not require every suggested content point.
    Ignore punctuation, capitalization and accent-mark differences that may be transcription artifacts. Do not assess pronunciation, accent or prosody from text. Penalize only clear, meaningful language errors; distinguish errors from likely speech-recognition artifacts.
    Address the learner consistently using Polish formal Pan/Pani; never switch to informal address.
    Calibrate scores: 90-100 exceptional; 82-89 excellent; 75-81 very good; 65-74 competent; 50-64 adequate; below 50 needs substantial development. Reserve high scores for relevant, developed answers with generally effective language. Return feedback in Polish and concise English.
    Return valid JSON only: {"score":0,"feedback_pl":"...","feedback_en":"...","strengths":["..."],"next_steps":["..."],"connectors":["..."],"vocabulary_suggestions":[{"basic":"...","richer":"..."}],"errors":[{"original":"...","correction":"...","explanation_en":"..."}]}.
    Keep arrays concise (max 3 items each). Do not invent errors; use empty arrays when none are clear.
  `;
  try {
    const raw = await callSmartAI(prompt);
    const j = JSON.parse(raw.replace(/```json|```/g, '').trim());
    const score = Math.max(0, Math.min(100, Number(j.score) || 0));
    document.getElementById('exerciseArea').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    const scoreDisplay = document.getElementById('scoreDisplay');
    scoreDisplay.innerText = `Wynik: ${score}%`;
    scoreDisplay.style.color = score >= (advanced ? 75 : 85) ? '#166534' : (score >= 50 ? '#ca8a04' : '#991b1b');
    document.getElementById('fbPL').innerText = '🌍 ' + (j.feedback_pl || '');
    document.getElementById('fbEN').innerText = '🇬🇧 ' + (j.feedback_en || '');
    const list = document.getElementById('errorsList');
    list.replaceChildren();
    const addGroup = (heading, items, render) => {
      if (!Array.isArray(items) || !items.length) return;
      const section = document.createElement('section');
      const title = document.createElement('strong'); title.textContent = heading; section.appendChild(title);
      items.slice(0, 3).forEach(item => { const row = document.createElement('div'); row.className = 'error-item'; render(row, item); section.appendChild(row); });
      list.appendChild(section);
    };
    addGroup('Strengths', j.strengths, (row, item) => row.textContent = item);
    addGroup('Next steps', j.next_steps, (row, item) => row.textContent = item);
    addGroup('Useful connectors', j.connectors, (row, item) => row.textContent = item);
    addGroup('Vocabulary upgrades', j.vocabulary_suggestions, (row, item) => row.textContent = (item.basic || '') + ' → ' + (item.richer || ''));
    addGroup('Corrections', j.errors, (row, item) => row.textContent = (item.original || '') + ' → ' + (item.correction || '') + ' (💡 ' + (item.explanation_en || '') + ')');
    if (!list.childElementCount) list.textContent = '✅ No clear corrections needed.';
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) {
      btnReset.innerText = "➡️ Następne pytanie";
      btnReset.onclick = nextMockQuestion;
    } else {
      btnReset.innerText = isMockExam ? "🏁 Zakończ test" : "🔄 Inny temat";
      btnReset.onclick = resetApp;
    }
  } catch (e) {
    console.error(e);
    alert('⚠️ Evaluation failed: ' + e.message);
  } finally {
    b.disabled = false;
    b.innerText = originalButtonText;
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
  if (!currentTopic) { container.textContent = 'Please select a topic to study.'; return; }
  container.replaceChildren();
  const title = document.createElement('h3'); title.textContent = '📚 Study Mode: ' + currentTopic.title; container.appendChild(title);
  const intro = document.createElement('p'); intro.className = 'small-text'; intro.textContent = 'Use these prompts as optional practice. Study points are guidance, not a checklist.'; container.appendChild(intro);
  const list = document.createElement('div'); list.id = 'checkpointsList'; container.appendChild(list);
  const box = document.createElement('div'); box.id = 'aiExplanationBox'; box.className = 'ai-box'; box.style.display = 'none'; container.appendChild(box);
  const groups = [
    ['Practice question', [currentTopic[currentLevel]], 'question'],
    ['Language foundations', currentTopic.checkpoints_OL || currentTopic.checkpoints_TOP, 'language'],
    ['Develop your answer', currentTopic.checkpoints_HL || currentTopic.check_HL, 'language']
  ];
  groups.forEach(([heading, items, kind]) => {
    const values = (Array.isArray(items) ? items : items ? [items] : []).filter(Boolean);
    if (!values.length) return;
    const h = document.createElement('h4'); h.textContent = heading; list.appendChild(h);
    values.forEach(value => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'checkpoint-btn'; button.textContent = value;
      button.addEventListener('click', () => askAIConcept(value, kind)); list.appendChild(button);
    });
  });
}

async function askAIConcept(concept, kind = 'language') {
  const box = document.getElementById('aiExplanationBox');
  if (!box) return;
  box.style.display = 'block'; box.textContent = '⏳ Preparing a guided study plan...';
  const prompt = `
    You are a supportive Polish oral-exam tutor. Topic: ${currentTopic?.title || 'General'}.
    Learner level: ${currentLevel}. Practice item: ${concept}. Type: ${kind}.
    Explain the idea briefly in English, then provide a 3-step speaking plan (keywords, not a memorised script) and up to two natural Polish examples with English translations.
    Keep Polish formal Pan/Pani register throughout all target-language examples and never use informal address. Treat topic guidance as optional; do not imply that every bullet is required.
    Return valid JSON only: {"explanation_en":"...","speaking_plan":["..."],"examples":[{"target":"...","en":"..."}],"optional_challenge":"..."}.
  `;
  try {
    const raw = await callSmartAI(prompt);
    const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
    box.replaceChildren();
    const heading = document.createElement('strong'); heading.textContent = '💡 ' + concept; box.appendChild(heading);
    const explanation = document.createElement('p'); explanation.textContent = data.explanation_en || ''; box.appendChild(explanation);
    const planTitle = document.createElement('strong'); planTitle.textContent = 'Speaking plan'; box.appendChild(planTitle);
    const plan = document.createElement('ol');
    (Array.isArray(data.speaking_plan) ? data.speaking_plan : []).slice(0,3).forEach(item => { const li=document.createElement('li'); li.textContent=item; plan.appendChild(li); });
    box.appendChild(plan);
    (Array.isArray(data.examples) ? data.examples : []).slice(0,2).forEach(item => { const p=document.createElement('p'); p.textContent=(item.target || '') + ' — ' + (item.en || ''); box.appendChild(p); });
    if (data.optional_challenge) { const p=document.createElement('p'); p.textContent='Optional challenge: ' + data.optional_challenge; box.appendChild(p); }
  } catch (e) {
    console.error(e); box.textContent = '⚠️ Could not load the study guidance: ' + e.message;
  }
}

function readMyInput() {
    const text = document.getElementById('userInput').value;
    speakWithBrowserTTS(text);
}

// Inicialización
window.onload = initConv;
