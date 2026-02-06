// ===========================================
// CONFIGURACIÓN
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// --- DETECCIÓN DE VOZ IRLANDESA (TTS) ---
let irishVoiceAvailable = null;

function initVoiceCheck() {
    const check = () => {
        const voices = window.speechSynthesis.getVoices();
        irishVoiceAvailable = voices.find(v => v.lang.includes('ga') || v.name.includes('Irish') || v.name.includes('Gaeilge'));
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = check;
    }
    check();
}

// --- REPRODUCTOR DE YOUTUBE (MODO SEGURO) ---
function setupYouTubePlayer(videoId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Inyectamos iframe de YouTube (legal y externo)
    container.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; border: 1px solid #e2e8f0; background: #000;">
            <iframe 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                src="https://www.youtube.com/embed/${videoId}?rel=0" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
        <p style="font-size: 0.8rem; color: #64748b; text-align: center; margin-top: 8px;">
            ℹ️ Video sourced from YouTube (Educational Use). <br>
            Please open your textbook to read the text.
        </p>
    `;
    container.style.display = "block";
}

// ===========================================
// NAVEGACIÓN
// ===========================================
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tab === 'conv' ? 'tabConv' : (tab === 'poem' ? 'tabPoem' : 'tabSraith')).classList.add('active');

  document.getElementById('sectionConversation').style.display = 'none';
  document.getElementById('sectionPoetry').style.display = 'none';
  document.getElementById('sectionSraith').style.display = 'none';

  if(tab === 'conv') document.getElementById('sectionConversation').style.display = 'block';
  if(tab === 'poem') document.getElementById('sectionPoetry').style.display = 'block';
  if(tab === 'sraith') document.getElementById('sectionSraith').style.display = 'block';
  
  // Limpiar YouTube al cambiar de pestaña para que no siga sonando
  const player = document.getElementById('audioPlayerContainer');
  if(player) player.innerHTML = "";
}

// ===========================================
// 1. COMHRÁ (15 TEMAS)
// ===========================================
const DATA = [
  { 
    id: 1, 
    title: "1. Mé Féin", 
    OL: "Cén t-ainm atá ort? Cén aois thú? Cathain a rugadh thú?", 
    HL: "Déan cur síos ar do phearsantacht. Cad iad na buanna atá agat?",
    check_HL: "Tuiseal Ginideach (m.sh. Ainm mo mháthar...), Aidiachtaí sealbhacha (Mo/Do/A + Séimhiú), Cur síos fisiciúil & Pearsantacht."
  },
  { 
    id: 2, 
    title: "2. Mo Theaghlach", 
    OL: "Cé mhéad duine atá i do theaghlach? An bhfuil deartháireacha agat?", 
    HL: "An réitíonn tú go maith le do thuismitheoirí? Inis dom fúthu.",
    check_HL: "Uimhreacha (Beirt/Triúr/Ceathrar...), Réimír (Ag réiteach le...), Tuiseal Ginideach (Post m'athar), Nathanna cainte (Is duine lách í)."
  },
  { 
    id: 3, 
    title: "3. Mo Cheantar", 
    OL: "Cá bhfuil tú i do chónaí? An maith leat do cheantar?", 
    HL: "Cad iad na fadhbanna sóisialta i do cheantar? (m.sh. dífhostaíocht)",
    check_HL: "Áiseanna (Tá leabharlann/páirc ann), Fadhbanna (Dífhostaíocht/Drugaí), Tuiseal Ginideach (Lár an bhaile/muintir na háite)."
  },
  { 
    id: 4, 
    title: "4. An Scoil", 
    OL: "Cén scoil a bhfuil tú ag freastal uirthi? An maith leat í?", 
    HL: "Cad a cheapann tú faoin gcóras oideachais? An bhfuil an iomarca brú ann?",
    check_HL: "Ainm na scoile (TG), Ábhair (Stair/Tíreolaíocht), An Córas Pointí, Modh Coinníollach (Dá mbeinn i mo phríomhoide...)."
  },
  { 
    id: 5, 
    title: "5. Caitheamh Aimsire", 
    OL: "Cad a dhéanann tú i do chuid am saor? An imríonn tú spórt?", 
    HL: "Cén tábhacht a bhaineann le spórt do dhaoine óga?",
    check_HL: "Ainm briathartha (Ag imirt/Ag léamh), TG (Cumann Peile), Sláinte intinne & choirp, Buntáistí an spóirt."
  },
  { 
    id: 6, 
    title: "6. Laethanta Saoire", 
    OL: "Cad a dhéanann tú sa samhradh? An dtéann tú ar laethanta saoire?", 
    HL: "Inis dom faoi laethanta saoire a chuaigh i bhfeidhm ort.",
    check_HL: "Aimsir Chaite (Chuaigh mé/D'fhan mé), Aimsir Ghnáthchaite (Théinn/Bhínn), TG (Lár na cathrach/Bia na háite)."
  },
  { 
    id: 7, 
    title: "7. An Todhchaí", 
    OL: "Cad a dhéanfaidh tú tar éis na hArdteiste?", 
    HL: "Cén post ba mhaith leat a fháil? An bhfuil sé deacair post a fháil in Éirinn?",
    check_HL: "Aimsir Fháistineach (Déanfaidh mé/Rachaidh mé), Modh Coinníollach (Ba mhaith liom...), An Ollscoil/Gairm."
  },
  { 
    id: 8, 
    title: "8. Obair Pháirtaimseartha", 
    OL: "An bhfuil post agat? Cén sórt oibre a dhéanann tú?", 
    HL: "An bhfuil sé go maith do dhaltaí scoile post a bheith acu?",
    check_HL: "Cur síos ar an obair (Ag obair i siopa/bialann), Pá/Airgead, Buntáistí & Míbhuntáistí (Brú staidéir vs Airgead)."
  },
  { 
    id: 9, 
    title: "9. An Ghaeilge", 
    OL: "An maith leat an Ghaeilge? An raibh tú sa Ghaeltacht?", 
    HL: "Stádas na Gaeilge. Cad is féidir linn a dhéanamh chun í a chur chun cinn?",
    check_HL: "An Ghaeltacht, Seachtain na Gaeilge, TG4, Tábhacht an chultúir, Modh Coinníollach (Ba cheart dúinn...)."
  },
  { 
    id: 10, 
    title: "10. Fadhbanna Sóisialta", 
    OL: "An bhfuil fadhbanna ag daoine óga inniu?", 
    HL: "Alcól, drugaí, agus tithíocht. Cad iad na dúshláin is mó?",
    check_HL: "Fadhbanna (Alcól/Drugaí/Tithíocht), Brú na bpiaraí, TG (Fadhb na dtiarnaí talún), Réiteach (Ba chóir don rialtas...)."
  },
  { 
    id: 11, 
    title: "11. Cúrsaí Reatha", 
    OL: "An léann tú an nuacht? Cad atá sa nuacht?", 
    HL: "Cogadh, athrú aeráide, nó polaitíocht. Scéal mór le déanaí.",
    check_HL: "Scéal nuachta sonrach, Athrú Aeráide (Téamh domhanda), Tuairim phearsanta (Cuireann sé imní orm...)."
  },
  { 
    id: 12, 
    title: "12. Ceol & Cultúr", 
    OL: "An maith leat ceol? Cén cineál ceoil?", 
    HL: "Tábhacht an chultúir agus an cheoil. An dtéann tú chuig ceolchoirmeacha?",
    check_HL: "Uirlisí ceoil (Ag seinm...), Ceolchoirmeacha (Electric Picnic etc.), Tábhacht an chultúir Ghaelaigh."
  },
  { 
    id: 13, 
    title: "13. Teicneolaíocht", 
    OL: "An bhfuil fón póca agat? An úsáideann tú TikTok?", 
    HL: "Buntáistí agus míbhuntáistí an idirlín agus na meáin shóisialta.",
    check_HL: "Aipeanna (Apps), Buntáistí (Eolas/Cumarsáid), Míbhuntáistí (Cibearbhulaíocht/Andúil), TG (Suíomhanna sóisialta)."
  },
  { 
    id: 14, 
    title: "14. Sláinte", 
    OL: "An itheann tú bia sláintiúil? An ndéanann tú aclaíocht?", 
    HL: "Fadhb na raimhre in Éirinn. Cén fáth a bhfuil sláinte intinne tábhachtach?",
    check_HL: "Bia folláin vs Mí-fhalláin, Aclaíocht, Sláinte intinne (Strus/Imní), TG (Fadhb na raimhre)."
  },
  { 
    id: 15, 
    title: "15. Daoine Cáiliúla", 
    OL: "Cé hé/hí an duine is fearr leat?", 
    HL: "An bhfuil tionchar maith nó olc ag daoine cáiliúla ar dhaoine óga?",
    check_HL: "Tionchar (Influence), Eiseamláirí (Role models), Na Meáin (The media), Tuairim."
  }
];

let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0; 
let currentAudio = null;

const PAST_Q = ["Cad a rinne tú inné?", "Ar ndeachaigh tú amach?", "Cén chaoi ar chaith tú do bhreithlá?"];
const FUT_Q = ["Cad a dhéanfaidh tú amárach?", "Cá rachaidh tú?", "Cad a dhéanfaidh tú tar éis na scrúduithe?"];

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
    document.getElementById('btnOL').className = lvl === 'OL' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'HL' ? 'level-btn hl active' : 'level-btn'; 
    if(currentTopic && !isMockExam) updateQuestion(); 
}

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
    document.getElementById('qDisplay').innerHTML = currentTopic[currentLevel]; 
    document.getElementById('userInput').value = "";

    const hintBox = document.getElementById('hintBox');
    const btnHint = document.getElementById('btnHint');
    
    if (hintBox && btnHint) {
        hintBox.style.display = 'none'; 
        if (currentLevel === 'HL' && currentTopic.check_HL) {
            btnHint.style.display = 'inline-block';
            hintBox.innerHTML = "<strong>📝 Pointí Tábhachtacha (HL):</strong><br>" + currentTopic.check_HL;
        } else {
            btnHint.style.display = 'none'; 
        }
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
        PAST_Q[Math.floor(Math.random()*3)] + " (Aimsir Chaite)", 
        FUT_Q[Math.floor(Math.random()*3)] + " (Aimsir Fháistineach)"
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Ceist ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
    
    const btnHint = document.getElementById('btnHint');
    const hintBox = document.getElementById('hintBox');
    if(btnHint) btnHint.style.display = 'none';
    if(hintBox) hintBox.style.display = 'none';
}

function speakText() { 
    if(currentAudio) { currentAudio.pause(); }
    
    if(isMockExam) {
        speakRobot(document.getElementById('qDisplay').innerText);
        return;
    }

    const filename = `audio/q_t${currentTopic.id}_${currentLevel.toLowerCase()}.mp3`;
    
    // Intentamos reproducir archivo local, si falla usamos TTS
    currentAudio = new Audio(filename);
    currentAudio.onerror = function() {
        console.log("Audio file not found, using TTS.");
        speakRobot(document.getElementById('qDisplay').innerText);
    };
    currentAudio.play();
}

function speakRobot(text) {
    if ('speechSynthesis' in window) { 
        if (!irishVoiceAvailable) {
            alert("⚠️ No Irish voice detected on this device.\n(Níl guth Gaeilge ar fáil).");
            return;
        }
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text); 
        u.lang = 'ga-IE'; 
        u.voice = irishVoiceAvailable;
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    }
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
        document.getElementById('qDisplay').innerHTML = "Roghnaigh topaic..."; 
        const btnHint = document.getElementById('btnHint');
        if(btnHint) btnHint.style.display = 'none';
    }
}

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Scríobh níos mó le do thoil...");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Ag ceartú...";
  
  const q = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  
  let criteria = "Gramadach cruinn (Accurate grammar) and vocabulary."; 
  if (currentLevel === 'HL' && currentTopic && currentTopic.check_HL && !isMockExam) {
      criteria = currentTopic.check_HL;
  }

  const prompt = `
  ACT AS: Strict Leaving Cert Irish (Gaeilge) Grammar Teacher. 
  QUESTION: "${q}". 
  STUDENT WROTE: "${t}". 
  LEVEL: ${currentLevel}.
  
  CRITICAL INSTRUCTIONS:
  1. CHECK GRAMMAR STRICTLY: Focus on 'Tuiseal Ginideach' (Genitive Case), 'Séimhiú' (Lenition), 'Urú' (Eclipsis) and Verb Tenses.
  2. CHECK CONTENT: Student MUST mention: [ ${criteria} ].
  
  OUTPUT JSON ONLY: { 
    "score": (0-100), 
    "feedback_ga": "Moladh (Praise) & Comhairle (Advice) i nGaeilge", 
    "feedback_en": "Explain the grammar mistakes simply in English", 
    "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] 
  }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Scór Gramadaí: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbGA').innerText = "🇮🇪 " + j.feedback_ga; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Gramadach foirfe!";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { 
        btnReset.innerText = "➡️ An Chéad Cheist Eile"; 
        btnReset.onclick = resetApp; 
    } else { 
        btnReset.innerText = "🔄 Topaic Eile"; 
        btnReset.onclick = () => { isMockExam=false; resetApp(); }; 
    }
  } catch (e) { 
      console.error(e); 
      alert("⚠️ The AI is a bit busy right now. Please wait."); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Ceartaigh (Correct)"; 
  }
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    speakRobot(text); 
}

// ===========================================
// 4. DATOS DE POEMAS (YOUTUBE EDITION)
// ===========================================
let currentPoemYear = 2026;
let currentPoemIndex = 0;

const POEMS_2026 = [
  { title: "Géibheann", author: "Caitlín Maude", youtubeId: "8t15UbhCYHo" }, // Teacher reading
  { title: "Colscaradh", author: "Pádraig Mac Suibhne", youtubeId: "kJE3N7Z2pWw" }, // Leaving Cert Irish Channel
  { title: "Mo Ghrá-sa", author: "Nuala Ní Dhomhnaill", youtubeId: "m9AyCD7XLn4" }, // Irish Teacher
  { title: "An tEarrach Thiar", author: "Máirtín Ó Direáin", youtubeId: "eT1Y9tdZ898" }, // Leaving Cert Irish Channel
  { title: "An Spailpín Fánach", author: "Anaithnid (Traditional)", youtubeId: "hrUGsTFIO3w" } // Poetry Reading Section
];

const POEMS_2027 = [
  { title: "Dínit an Bhróin", author: "Máirtín Ó Direáin", youtubeId: "7lQsS-EupoE" }, // Leaving Cert Irish Channel
  { title: "Iníon", author: "Áine Durkin", youtubeId: "1vGv9aDxeoI" }, // Foghlaim TG4 (Canal Oficial)
  { title: "Glaoch Abhaile", author: "Áine Ní Ghlinn", youtubeId: "_eNdbzJdkmw" }, // Teacher Reading
  { title: "Deireadh na Feide", author: "Ailbhe Ní Ghearbhuigh", youtubeId: "GnbBxuiuhNI" }, // Leaving Cert Irish Channel
  { title: "Úirchill an Chreagáin", author: "Art Mac Cumhaigh", youtubeId: "WaHQNmqj9g0" } // Traditional Song with Lyrics
];

function setPoemYear(year) {
    currentPoemYear = year;
    document.getElementById('btn2026').className = year === 2026 ? 'level-btn active' : 'level-btn';
    document.getElementById('btn2027').className = year === 2027 ? 'level-btn active' : 'level-btn';
    renderPoemButtons();
}

function renderPoemButtons() {
    const list = currentPoemYear === 2026 ? POEMS_2026 : POEMS_2027;
    const container = document.getElementById('poemButtonsContainer');
    if(!container) return;
    
    container.innerHTML = "";
    list.forEach((poem, index) => {
        const btn = document.createElement('div');
        btn.className = 'rp-btn-select';
        btn.innerText = poem.title.split(" (")[0]; 
        btn.onclick = () => selectPoem(index, btn);
        container.appendChild(btn);
    });
    selectPoem(0, container.children[0]);
}

function selectPoem(index, btn) {
    document.querySelectorAll('#sectionPoetry .rp-btn-select').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    currentPoemIndex = index;
    const list = currentPoemYear === 2026 ? POEMS_2026 : POEMS_2027;
    const p = list[index];
    
    document.getElementById('poemArea').style.display = 'block';
    document.getElementById('poemTitle').innerText = p.title;
    document.getElementById('poemAuthor').innerText = "le " + p.author;
    
    // Mostramos aviso en lugar del texto
    document.getElementById('poemText').innerHTML = "<em>Due to copyright restrictions, please follow the text in your official textbook or exam papers.</em>";

    // Llamamos a YouTube
    setupYouTubePlayer(p.youtubeId, 'audioPlayerContainer');
}

// ===========================================
// 5. DATOS SRAITH PICTIÚR
// ===========================================
let currentSraithTitle = "";
const SRAITH_TITLES = [
  "1. Cuairt ar Aintín i Nua-Eabhrac", "2. Imreoir Gortaithe", "3. Bua sa chomórtas díospóireachta", 
  "4. Ná húsáid an cárta creidmheasa gan chead", "5. Ag toghadh scoláire na bliana", "6. An Ghaeilge - seoid luachmhar agus cuid dár gcultúr", 
  "7. Obair dhian: torthaí maithe san Ardteistiméireacht", "8. Comhoibriú an Phobail", "9. Samhradh Iontach", 
  "10. Drochaimsir an Gheimhridh - Athrú Aeráide", "11. Timpiste sa Choláiste Samhraidh", "12. Sláinte na nóg - Seachtain na Sláinte", 
  "13. Bua ag Cór na Scoile", "14. Teip sa Scrúdú Tiomána", "15. Breoite ar Scoil", 
  "16. Agallamh do nuacht TG4@7", "17. Madra ar Strae", "18. Na Déagóirí Cróga", 
  "19. Rialacha na Scoile", "20. Gaeilge: Teanga Bheo"
];

function initSraith() {
    const s = document.getElementById('sraithSelector');
    if (!s) return;
    s.innerHTML = "";
    SRAITH_TITLES.forEach((title, index) => {
        const d = document.createElement('div');
        d.className = 'rp-btn-select';
        d.innerText = title;
        d.onclick = () => selectSraith(index, d);
        s.appendChild(d);
    });
}

function selectSraith(index, btn) {
    document.querySelectorAll('#sraithSelector .rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSraithTitle = SRAITH_TITLES[index];
    document.getElementById('sraithArea').style.display = 'block';
    document.getElementById('resultSraith').style.display = 'none';
    document.getElementById('sraithTitle').innerText = currentSraithTitle;
    document.getElementById('userInputSraith').value = "";
}

function speakSraithPrompt() {
    speakRobot("Inis dom an scéal. Cad atá ag tarlú sna pictiúir?");
}

function readMySraithInput() {
    const text = document.getElementById("userInputSraith").value;
    if (!text) return;
    speakRobot(text);
}

async function analyzeSraith() {
  const t = document.getElementById('userInputSraith').value;
  if(t.length < 5) return alert("Scríobh níos mó le do thoil...");
  const b = document.getElementById('btnActionSraith'); 
  b.disabled = true; b.innerText = "⏳ Ag ceartú...";
  
  const prompt = `
  ACT AS: Irish Examiner. 
  TASK: Sraith Pictiúr "${currentSraithTitle}". 
  STUDENT WROTE: "${t}". 
  CHECK GRAMMAR: Focus on Past Tense (Aimsir Chaite) and Vocabulary.
  OUTPUT JSON: { 
    "score": (0-100), 
    "feedback_ga": "Irish feedback", 
    "feedback_en": "English feedback", 
    "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] 
  }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    document.getElementById('sraithArea').style.display = 'none'; 
    document.getElementById('resultSraith').style.display = 'block';
    document.getElementById('userResponseTextSraith').innerText = t;
    document.getElementById('scoreDisplaySraith').innerText = `Scór Gramadaí: ${j.score}%`;
    document.getElementById('scoreDisplaySraith').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbGASraith').innerText = "🇮🇪 " + j.feedback_ga; 
    document.getElementById('fbENSraith').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListSraith').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Ar fheabhas!";
  } catch (e) { 
      console.error(e); 
      alert("⚠️ The AI is a bit busy right now. Please wait."); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Ceartaigh"; 
  }
}

function resetSraith() {
    document.getElementById('resultSraith').style.display = 'none';
    document.getElementById('sraithArea').style.display = 'block';
    document.getElementById('userInputSraith').value = "";
}

window.onload = function() {
    initVoiceCheck(); 
    initConv();
    initSraith();
    setPoemYear(2026);
};
