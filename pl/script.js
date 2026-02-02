// ===========================================
// CONFIGURACIÓN
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// ===========================================
// DATOS EXAMEN POLACO 2026 (15 TEMAS - COMPLETO)
// ===========================================
const DATA = [
  // --- TEMAS OBLIGATORIOS 2026 ---
  { 
    title: "⭐ 1. Życie codzienne", 
    General: "Opowiedz mi, jak wygląda Twój typowy dzień. O której wstajesz i co robisz po szkole?", 
    Advanced: "Jak wygląda podział obowiązków w Twoim domu? Czy uważasz, że młodzież ma teraz wystarczająco dużo czasu wolnego?",
    check_HL: "Czasowniki zwrotne (Reflexive verbs: myję się, ubieram się), Godziny (Time: o siódmej...), Obowiązki (Chores: sprzątam, odkurzam), Opinia (Opinion)."
  },
  { 
    title: "⭐ 2. Moje miasto", 
    General: "Gdzie mieszkasz? Opowiedz mi trochę o swojej okolicy. Co tam można robić?", 
    Advanced: "Porównaj życie na wsi i w mieście. Jakie są wady i zalety Twojej okolicy? Gdzie wolałbyś mieszkać w przyszłości?",
    check_HL: "Miejscownik (Locative Case: w mieście, na wsi), Opis (Description: jest bezpiecznie/głośno), Porównanie (Stopień wyższy: lepsze niż...), Tryb przypuszczający (Conditional: wolałbym)."
  },
  { 
    title: "⭐ 3. Przyszłość", 
    General: "Co zamierzasz robić po maturze? Czy planujesz iść na studia czy do pracy?", 
    Advanced: "Czy chciałbyś pracować w Polsce czy w Irlandii? Jak wyobrażasz sobie swoją karierę zawodową za 10 lat?",
    check_HL: "Czas przyszły (Future Tense: będę studiować / pójdę), Czasowniki modalne (Modal verbs: chcę, zamierzam, planuję), Praca/Studia (Vocabulary: kierunek studiów, kariera)."
  },
  
  // --- TEMAS GENERALES ---
  { 
    title: "4. Rodzina", 
    General: "Opowiedz mi o swojej rodzinie. Czy masz rodzeństwo? Jak spędzacie czas razem?", 
    Advanced: "Konflikt pokoleń – czy często kłócisz się z rodzicami? Jak zmieniają się relacje rodzinne w dzisiejszym świecie?",
    check_HL: "Biernik/Dopełniacz (Cases for people), Opis charakteru (Personality adjectives), Relacje (Relationships: kłócimy się, wspieramy się), Zmiany społeczne."
  },
  { 
    title: "5. Szkoła", 
    General: "Jakie przedmioty lubisz najbardziej? Co sądzisz o mundurkach szkolnych?", 
    Advanced: "Porównaj system edukacji w Polsce i w Irlandii. Co byś zmienił w swojej szkole, gdybyś był dyrektorem?",
    check_HL: "Narzędnik (Instrumental Case: interesuję się historią), Opinia (Sądzę, że...), Porównanie systemów (Matura vs Leaving Cert), Tryb warunkowy (Gdybym był...)."
  },
  { 
    title: "6. Hobby i Sport", 
    General: "Co robisz w wolnym czasie? Czy uprawiasz jakiś sport w weekendy?", 
    Advanced: "Dlaczego aktywność fizyczna jest ważna dla zdrowia psychicznego? Opowiedz o swojej największej pasji.",
    check_HL: "Narzędnik (Instrumental Case: interesuję się sportem/muzyką), Czasowniki (Verbs: gram w..., uprawiam...), Zdrowie (Health benefits: stres, kondycja)."
  },
  { 
    title: "7. Wakacje", 
    General: "Gdzie byłeś na ostatnich wakacjach? Czy lubisz podróżować samolotem?", 
    Advanced: "Czy wolisz wakacje zorganizowane czy podróżowanie 'na dziko'? Jak podróże kształcą człowieka?",
    check_HL: "Czas przeszły (Past Tense: byłem, widziałem), Miejscownik (Locative: w Hiszpanii), Czasowniki ruchu (Motion verbs: jechać/lecieć), Preferencje."
  },
  { 
    title: "8. Święta i Tradycje", 
    General: "Jak obchodzisz Święta Bożego Narodzenia? Jakie jest Twoje ulubione danie?", 
    Advanced: "Różnice w obchodzeniu świąt w Polsce i w Irlandii. Czy ważne jest kultywowanie tradycji na emigracji?",
    check_HL: "Słownictwo świąteczne (Vocabulary: Wigilia, opłatek, prezenty), Tradycje (Traditions), Porównanie kultur (Polska vs Irlandia), Emigracja."
  },
  { 
    title: "9. Problemy Społeczne", 
    General: "Czy życie nastolatków dzisiaj jest trudne? Co Cię stresuje?", 
    Advanced: "Uzależnienia, bezdomność i presja rówieśników. Jaki jest największy problem społeczny w Irlandii dzisiaj?",
    check_HL: "Dopełniacz (Genitive: brak pracy, problemu), Słownictwo społeczne (Social issues: stres, alkohol, bezdomność), Argumentacja (Argumentation)."
  },
  { 
    title: "10. Technologia", 
    General: "Czy masz telefon? Do czego używasz internetu na co dzień?", 
    Advanced: "Sztuczna inteligencja i media społecznościowe – szansa czy zagrożenie dla ludzkości? Uzasadnij swoją opinię.",
    check_HL: "Narzędnik (Instrumental: używam telefonu), Zalety/Wady (Pros/Cons), Media społecznościowe, Opinia (Zagrożenie vs Szansa)."
  },
  { 
    title: "11. Praca dorywcza", 
    General: "Czy masz pracę dorywczą (part-time job)? Co robisz?", 
    Advanced: "Wady i zalety łączenia nauki z pracą. Czy doświadczenie zawodowe jest ważniejsze niż stopnie w szkole?",
    check_HL: "Słownictwo praca (Job vocab: zarabiać, doświadczenie), Balans (Work-life balance), Opinia (Warto pracować, bo...)."
  },
  { 
    title: "12. Portfolio Językowe", 
    General: "Opowiedz mi o jednym tekście ze swojego Portfolio, który Ci się podobał.", 
    Advanced: "Dlaczego wybrałeś ten konkretny tekst do Portfolio? Czego nauczył Cię on o polskiej kulturze lub historii?",
    check_HL: "Czas przeszły (Past tense: wybrałem, przeczytałem), Analiza tekstu (Text analysis: bohater, temat), Kultura/Historia (Cultural reference), Uzasadnienie."
  },
  // --- TEMAS NUEVOS (13-15) ---
  { 
    title: "13. Zeszły weekend", 
    General: "Co robiłeś w zeszły weekend? Czy odpocząłeś?", 
    Advanced: "Opisz dokładnie miniony weekend. Czy udało Ci się zrealizować wszystkie plany?",
    check_HL: "Czas przeszły (Past verbs: byłem, robiłem), Aspekt dokonany/niedokonany (Aspect), Czasowniki ruchu (Motion verbs)."
  },
  { 
    title: "14. Przyszły weekend", 
    General: "Jakie masz plany na następny weekend?", 
    Advanced: "Co będziesz robić w przyszły weekend? Wolisz spędzać czas aktywnie czy pasywnie?",
    check_HL: "Czas przyszły (Future: będę robić / zrobię), Plany i zamiary (Intentions: zamierzam, planuję), Tryb przypuszczający (Chciałbym...)."
  },
  { 
    title: "15. Kultura i Media", 
    General: "Jaki jest Twój ulubiony film lub książka? Dlaczego?", 
    Advanced: "Czy uważasz, że młodzi ludzie czytają teraz mniej książek? Jaka jest rola kultury w życiu człowieka?",
    check_HL: "Słownictwo (Genres: komedia, dramat), Opis (Plot/Characters), Opinia i Argumentacja (Reading habits)."
  }
];

let currentLevel = 'General'; 
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0; 

function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function initConv() { 
    const g = document.getElementById('topicGrid'); 
    if(!g) return;
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
            updateQuestion(); 
        }; 
        g.appendChild(b); 
    }); 
}

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'General' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'Advanced' ? 'level-btn hl active' : 'level-btn'; 
    
    if(currentTopic && !isMockExam) {
        updateQuestion(); 
    }
}

// --- FUNKCJA: PISTAS (SCAFFOLDING) ---
function toggleHint() {
    const box = document.getElementById('hintBox');
    if (box.style.display === 'none') {
        box.style.display = 'block';
    } else {
        box.style.display = 'none';
    }
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerText = currentTopic[currentLevel]; 

    // LÓGICA DE PISTAS (POLACO)
    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    if (hintBox && btnHint) {
        hintBox.style.display = 'none'; 
        
        // Mostrar pista solo en Advanced/HL
        if (currentLevel === 'Advanced' && currentTopic.check_HL) {
            btnHint.style.display = 'inline-block';
            hintBox.innerHTML = "<strong>📝 Kluczowe punkty / Key Points (HL):</strong><br>" + currentTopic.check_HL;
        } else {
            btnHint.style.display = 'none'; 
        }
    }
}

function speakText() { 
    const t = document.getElementById('qDisplay').innerText; 
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'pl-PL'; 
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } else { alert("Audio not supported."); }
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

// IA Gemini (Corrección en Polaco)
async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Proszę napisać więcej... (Write more please)");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Sprawdzanie...";
  
  const q = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  
  // Recoger criterios HL
  let criteria = "Gramatyka i słownictwo (Grammar and Vocabulary)."; 
  if (currentLevel === 'Advanced' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
    ACT AS: Strict Polish Leaving Cert Examiner (Ireland).
    QUESTION: "${q}". 
    STUDENT ANSWER: "${t}". 
    
    CRITICAL INSTRUCTIONS:
    1. IGNORE punctuation/capitalization errors.
    2. CHECK GRAMMAR: Focus on CASES (Mianownik, Dopełniacz, Narzędnik, etc.), Verb Aspects (Dokonany/Niedokonany) and Gender agreement.
    3. CHECK CONTENT: Student MUST mention: [ ${criteria} ].
       - If General/OL: Be encouraging.
       - If Advanced/HL: Be strict. If they use wrong cases (e.g. 'Lubię sport' instead of 'Interesuję się sportem') or miss content, TELL THEM.
  
    OUTPUT JSON ONLY: 
    { 
      "score": (0-100), 
      "feedback_pl": "Feedback in Polish", 
      "feedback_en": "Feedback in English (Explain case/grammar mistakes clearly)", 
      "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] 
    }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Wynik: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbPL').innerText = "🇵🇱 " + j.feedback_pl; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Świetnie! (Perfect)";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { 
        btnReset.innerText = "➡️ Następne pytanie"; 
        btnReset.onclick = resetApp; // Llama a resetApp que maneja el siguiente paso
    } else { 
        btnReset.innerText = "🔄 Inny temat"; 
        btnReset.onclick = () => { isMockExam=false; resetApp(); }; 
    }
  } catch (e) { 
      console.error(e); 
      // ERROR AMABLE HIGH TRAFFIC
      alert("⚠️ The AI is a bit busy right now (High Traffic).\nPlease wait 10 seconds and try again!\n\n(Serwer zajęty, spróbuj za 10 sekund)."); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Sprawdź (Evaluate)"; 
  }
}

function startMockExam() { 
    isMockExam = true; mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    let i = [...Array(DATA.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA[i[0]][currentLevel], 
        DATA[i[1]][currentLevel], 
        DATA[i[2]][currentLevel], 
        "Co robiłeś wczoraj wieczorem? (Czas przeszły)", 
        "Gdzie chciałbyś pojechać w przyszłości? (Czas przyszły)"
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Pytanie ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
    
    // Ocultar pistas en Mock
    const btnHint = document.getElementById('btnHint');
    const hintBox = document.getElementById('hintBox');
    if(btnHint) btnHint.style.display = 'none';
    if(hintBox) hintBox.style.display = 'none';
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    
    if(isMockExam && mockIndex < 4) { 
        mockIndex++; 
        showMockQuestion(); 
    } else { 
        isMockExam = false; 
        document.getElementById('userInput').value = ""; 
        document.getElementById('qDisplay').innerText = "Wybierz temat..."; 
        // Ocultar botón al resetear
        const btnHint = document.getElementById('btnHint');
        if(btnHint) btnHint.style.display = 'none';
    }
}

window.onload = initConv;
