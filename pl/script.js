// ===========================================
// CONFIGURACIÓN (Usa tu misma API Key)
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// ===========================================
// DATOS EXAMEN POLACO 2026
// Temas basados en Circular S48/25
// ===========================================
const DATA = [
  // TEMA 1: VIDA COTIDIANA (Set Topic 2026)
  { 
    title: "1. Życie codzienne", 
    General: "Opowiedz mi, jak wygląda Twój typowy dzień. O której wstajesz i co robisz po szkole?", 
    Advanced: "Czym różni się Twoje życie w tygodniu od tego w weekendy? Co lubisz robić najbardziej?" 
  },
  // TEMA 2: MI CIUDAD/REGION (Set Topic 2026)
  { 
    title: "2. Moje miasto/region", 
    General: "Gdzie mieszkasz? Opowiedz mi trochę o swojej okolicy.", 
    Advanced: "Jakie są zalety i wady mieszkania w Twoim mieście? Czy chciałbyś tu zostać w przyszłości?" 
  },
  // TEMA 3: FUTURO (Set Topic 2026)
  { 
    title: "3. Plany na przyszłość", 
    General: "Co zamierzasz robić po maturze? Czy planujesz iść na studia?", 
    Advanced: "Jak wyobrażasz sobie swoją przyszłość za 10 lat? Czy chciałbyś pracować w Polsce czy w Irlandii?" 
  },
  // TEMA 4: PORTFOLIO (Obligatorio)
  { 
    title: "4. Portfolio Językowe", 
    General: "Opowiedz mi o jednym tekście z Twojego Portfolio, który Ci się podobał.", 
    Advanced: "Dlaczego wybrałeś ten tekst do swojego Portfolio? Czego się z niego nauczyłeś o polskiej kulturze?" 
  },
  // TEMA 5: FAMILIA Y AMIGOS (Wider variety)
  { 
    title: "5. Rodzina i Przyjaciele", 
    General: "Opowiedz mi o swojej rodzinie. Czy masz rodzeństwo?", 
    Advanced: "Kto jest Twoim najlepszym przyjacielem i dlaczego? Jakie cechy cenisz u ludzi?" 
  },
  // TEMA 6: HOBBIES (Wider variety)
  { 
    title: "6. Zainteresowania", 
    General: "Co lubisz robić w wolnym czasie? Czy uprawiasz jakiś sport?", 
    Advanced: "Dlaczego warto mieć hobby? Jak spędzasz czas ze znajomymi?" 
  }
];

let currentLevel = 'General';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0; 

function toggleInfo() { 
  const b = document.getElementById('infoBox'); 
  b.style.display = b.style.display === 'block' ? 'none' : 'block'; 
}

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
    if(currentTopic && !isMockExam) updateQuestion(); 
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerText = currentTopic[currentLevel]; 
}

// LÓGICA TTS (Text-to-Speech) PARA POLACO
function speakText() { 
    const t = document.getElementById('qDisplay').innerText; 
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = 'pl-PL'; // Forzamos polaco
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    } else {
        alert("Twoja przeglądarka nie obsługuje dźwięku.");
    }
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pl-PL'; // Forzamos polaco
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

// LÓGICA IA (Gemini)
async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Napisz więcej proszę... (Write more please)");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Sprawdzanie...";
  
  const q = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  // Prompt adaptado para corrección en POLACO
  const prompt = `ACT AS: Polish Language Examiner. QUESTION: "${q}". STUDENT ANSWER: "${t}". 
  TASK: Correct the student's Polish. 
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
    
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Świetnie! (Perfect!)";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { 
        btnReset.innerText = "➡️ Następne pytanie (Next)"; 
        btnReset.onclick = resetApp; 
    } else { 
        btnReset.innerText = "🔄 Inny temat (Another Topic)"; 
        btnReset.onclick = () => { isMockExam=false; resetApp(); }; 
    }
  } catch (e) { console.error(e); alert("Błąd połączenia."); } finally { b.disabled = false; b.innerText = "✨ Sprawdź"; }
}

function startMockExam() { 
    isMockExam = true; mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    // Seleccionamos 5 preguntas al azar de los datos
    let i = [...Array(DATA.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA[i[0]][currentLevel], 
        DATA[i[1]][currentLevel], 
        DATA[i[2]][currentLevel], 
        "Opowiedz mi o tym, co robiłeś wczoraj? (Past Tense)", 
        "Jakie masz plany na wakacje? (Future Tense)"
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
    if(isMockExam && mockIndex < 4) { 
        mockIndex++; showMockQuestion(); 
    } else { 
        isMockExam = false; 
        document.getElementById('userInput').value = ""; 
        document.getElementById('qDisplay').innerText = "Wybierz temat... (Select a topic)"; 
    }
}

// Arrancar
window.onload = initConv;
