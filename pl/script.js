// ===========================================
// CONFIGURACIÓN
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// ===========================================
// DATOS EXAMEN POLACO 2026 (EXPANDED)
// ===========================================
const DATA = [
  // --- SET TOPICS 2026 (MANDATORY) ---
  { 
    title: "⭐ 1. Życie codzienne", 
    General: "Opowiedz mi, jak wygląda Twój typowy dzień. O której wstajesz i co robisz po szkole?", 
    Advanced: "Jak wygląda podział obowiązków w Twoim domu? Czy uważasz, że masz wystarczająco dużo czasu wolnego?" 
  },
  { 
    title: "⭐ 2. Moje miasto", 
    General: "Gdzie mieszkasz? Opowiedz mi trochę o swojej okolicy i sąsiadach.", 
    Advanced: "Porównaj życie na wsi i w mieście. Gdzie wolałbyś mieszkać w przyszłości i dlaczego?" 
  },
  { 
    title: "⭐ 3. Przyszłość", 
    General: "Co zamierzasz robić po maturze? Czy planujesz iść na studia?", 
    Advanced: "Czy chciałbyś pracować w Polsce czy w Irlandii? Jak wyobrażasz sobie swoją karierę zawodową?" 
  },
  
  // --- GENERAL CONVERSATION (WIDER VARIETY) ---
  { 
    title: "4. Rodzina", 
    General: "Opowiedz mi o swojej rodzinie. Czy masz rodzeństwo?", 
    Advanced: "Konflikt pokoleń – czy często kłócisz się z rodzicami? Jakie są relacje w Twojej rodzinie?" 
  },
  { 
    title: "5. Szkoła (PL vs IE)", 
    General: "Jakie przedmioty lubisz najbardziej? Co sądzisz o mundurkach szkolnych?", 
    Advanced: "Porównaj system edukacji w Polsce i w Irlandii. Który wolisz i dlaczego?" 
  },
  { 
    title: "6. Hobby i Sport", 
    General: "Co robisz w wolnym czasie? Czy uprawiasz jakiś sport?", 
    Advanced: "Dlaczego aktywność fizyczna jest ważna dla młodzieży? Czy masz jakieś pasje?" 
  },
  { 
    title: "7. Wakacje", 
    General: "Gdzie byłeś na ostatnich wakacjach? Czy lubisz podróżować?", 
    Advanced: "Czy wolisz wakacje zorganizowane czy na własną rękę? Opowiedz o podróży marzeń." 
  },
  { 
    title: "8. Tradycje", 
    General: "Jak obchodzisz Święta Bożego Narodzenia? Jakie polskie tradycje lubisz?", 
    Advanced: "Różnice w obchodzeniu świąt w Polsce i w Irlandii. Czy kultywujesz polskie tradycje na emigracji?" 
  },
  { 
    title: "9. Problemy Społeczne", 
    General: "Jakie problemy ma dzisiaj młodzież? (stres, szkoła)", 
    Advanced: "Uzależnienia (alkohol, narkotyki, internet) wśród młodych ludzi. Jak im zapobiegać?" 
  },
  { 
    title: "10. Technologia", 
    General: "Czy często używasz telefonu? Do czego służy Ci internet?", 
    Advanced: "Czy media społecznościowe to szansa czy zagrożenie? Wpływ technologii na relacje międzyludzkie." 
  },
  { 
    title: "11. Portfolio", 
    General: "Opowiedz mi o jednym tekście ze swojego Portfolio Językowego.", 
    Advanced: "Dlaczego wybrałeś ten tekst do Portfolio? Czego nauczył Cię o kulturze polskiej?" 
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
    if(currentTopic && !isMockExam) updateQuestion(); 
}

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerText = currentTopic[currentLevel]; 
}

// TTS Polaco
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

// IA Polaco
async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Write more please / Napisz więcej...");
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Sprawdzanie...";
  const q = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  
  const prompt = `ACT AS: Polish Leaving Cert Examiner. QUESTION: "${q}". STUDENT ANSWER: "${t}". 
  TASK: Correct the Polish grammar and vocabulary suitable for a high school student.
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
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Świetnie!";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { btnReset.innerText = "➡️ Następne pytanie"; btnReset.onclick = resetApp; } else { btnReset.innerText = "🔄 Inny temat"; btnReset.onclick = () => { isMockExam=false; resetApp(); }; }
  } catch (e) { console.error(e); alert("Error."); } finally { b.disabled = false; b.innerText = "✨ Sprawdź"; }
}

function startMockExam() { 
    isMockExam = true; mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    let i = [...Array(DATA.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA[i[0]][currentLevel], 
        DATA[i[1]][currentLevel], 
        DATA[i[2]][currentLevel], 
        "Co robiłeś wczoraj? (Czas przeszły)", 
        "Jakie masz plany na wakacje? (Czas przyszły)"
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
