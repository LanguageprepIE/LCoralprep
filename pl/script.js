// ===========================================
// CONFIGURACIÓN
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// ===========================================
// DATOS EXAMEN POLACO 2026 (AMPLIADO)
// General = Nivel Básico/OL | Advanced = Nivel Alto/HL
// ===========================================
const DATA = [
  // --- TEMAS OBLIGATORIOS 2026 ---
  { 
    title: "⭐ 1. Życie codzienne", 
    General: "Opowiedz mi, jak wygląda Twój typowy dzień. O której wstajesz i co robisz po szkole?", 
    Advanced: "Jak wygląda podział obowiązków w Twoim domu? Czy uważasz, że młodzież ma teraz wystarczająco dużo czasu wolnego?" 
  },
  { 
    title: "⭐ 2. Moje miasto", 
    General: "Gdzie mieszkasz? Opowiedz mi trochę o swojej okolicy. Co tam można robić?", 
    Advanced: "Porównaj życie na wsi i w mieście. Jakie są wady i zalety Twojej okolicy? Gdzie wolałbyś mieszkać w przyszłości?" 
  },
  { 
    title: "⭐ 3. Przyszłość", 
    General: "Co zamierzasz robić po maturze? Czy planujesz iść na studia czy do pracy?", 
    Advanced: "Czy chciałbyś pracować w Polsce czy w Irlandii? Jak wyobrażasz sobie swoją karierę zawodową za 10 lat?" 
  },
  
  // --- TEMAS GENERALES ---
  { 
    title: "4. Rodzina", 
    General: "Opowiedz mi o swojej rodzinie. Czy masz rodzeństwo? Jak spędzacie czas razem?", 
    Advanced: "Konflikt pokoleń – czy często kłócisz się z rodzicami? Jak zmieniają się relacje rodzinne w dzisiejszym świecie?" 
  },
  { 
    title: "5. Szkoła", 
    General: "Jakie przedmioty lubisz najbardziej? Co sądzisz o mundurkach szkolnych?", 
    Advanced: "Porównaj system edukacji w Polsce i w Irlandii. Co byś zmienił w swojej szkole, gdybyś był dyrektorem?" 
  },
  { 
    title: "6. Hobby i Sport", 
    General: "Co robisz w wolnym czasie? Czy uprawiasz jakiś sport w weekendy?", 
    Advanced: "Dlaczego aktywność fizyczna jest ważna dla zdrowia psychicznego? Opowiedz o swojej największej pasji." 
  },
  { 
    title: "7. Wakacje", 
    General: "Gdzie byłeś na ostatnich wakacjach? Czy lubisz podróżować samolotem?", 
    Advanced: "Czy wolisz wakacje zorganizowane czy podróżowanie 'na dziko'? Jak podróże kształcą człowieka?" 
  },
  { 
    title: "8. Święta i Tradycje", 
    General: "Jak obchodzisz Święta Bożego Narodzenia? Jakie jest Twoje ulubione danie?", 
    Advanced: "Różnice w obchodzeniu świąt w Polsce i w Irlandii. Czy ważne jest kultywowanie tradycji na emigracji?" 
  },
  { 
    title: "9. Problemy Społeczne", 
    General: "Czy życie nastolatków dzisiaj jest trudne? Co Cię stresuje?", 
    Advanced: "Uzależnienia, bezdomność i presja rówieśników. Jaki jest największy problem społeczny w Irlandii dzisiaj?" 
  },
  { 
    title: "10. Technologia", 
    General: "Czy masz telefon? Do czego używasz internetu na co dzień?", 
    Advanced: "Sztuczna inteligencja i media społecznościowe – szansa czy zagrożenie dla ludzkości? Uzasadnij swoją opinię." 
  },
  { 
    title: "11. Praca dorywcza", 
    General: "Czy masz pracę dorywczą (part-time job)? Co robisz?", 
    Advanced: "Wady i zalety łączenia nauki z pracą. Czy doświadczenie zawodowe jest ważniejsze niż stopnie w szkole?" 
  },
  { 
    title: "12. Portfolio Językowe", 
    General: "Opowiedz mi o jednym tekście ze swojego Portfolio, który Ci się podobał.", 
    Advanced: "Dlaczego wybrałeś ten konkretny tekst do Portfolio? Czego nauczył Cię on o polskiej kulturze lub historii?" 
  }
];

let currentLevel = 'General'; // Por defecto nivel "Fácil"
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
    // Actualizar botones visualmente
    document.getElementById('btnOL').className = lvl === 'General' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'Advanced' ? 'level-btn hl active' : 'level-btn'; 
    
    // IMPORTANTE: Si ya hay un tema seleccionado, actualizar el texto al instante
    if(currentTopic && !isMockExam) {
        updateQuestion(); 
    }
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    // Aquí es donde cambia el texto dependiendo del nivel
    document.getElementById('qDisplay').innerText = currentTopic[currentLevel]; 
}

// TTS Polaco (Funciona muy bien en Chrome/Safari)
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
  
  const prompt = `ACT AS: Polish Leaving Cert Examiner. QUESTION: "${q}". STUDENT ANSWER: "${t}". 
  TASK: Correct the Polish grammar and vocabulary. Provide feedback in Polish and English.
  OUTPUT JSON: { "score": (0-100), "feedback_pl": "Feedback in Polish", "feedback_en": "Feedback in English", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Wynik: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbPL').innerText = "🇵🇱 " + j.feedback_pl; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Świetnie! (Perfect)";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { btnReset.innerText = "➡️ Następne pytanie"; btnReset.onclick = resetApp; } else { btnReset.innerText = "🔄 Inny temat"; btnReset.onclick = () => { isMockExam=false; resetApp(); }; }
  } catch (e) { console.error(e); alert("Error de conexión."); } finally { b.disabled = false; b.innerText = "✨ Sprawdź (Evaluate)"; }
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
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    if(isMockExam && mockIndex < 4) { mockIndex++; showMockQuestion(); } else { isMockExam = false; document.getElementById('userInput').value = ""; document.getElementById('qDisplay').innerText = "Wybierz temat..."; }
}

window.onload = initConv;
