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

// --- DETECCIÓN DE VOZ IRLANDESA (TTS) ---
let irishVoiceAvailable = null;

function initVoiceCheck() {
    const check = () => {
        const voices = window.speechSynthesis.getVoices();
        // Intentar encontrar 'ga-IE', si no, buscar algo que diga Irish/Gaeilge
        irishVoiceAvailable = voices.find(v => v.lang.includes('ga') || v.name.includes('Irish') || v.name.includes('Gaeilge'));
    };
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = check;
    }
    check();
}

// --- DICTADO DE VOZ (SPEECH-TO-TEXT) ---
function startDictation(inputId, btnElement) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("⚠️ Ní thacaíonn do bhrabhsálaí leis seo. (Bain úsáid as Chrome nó Safari).");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'ga-IE'; 
    recognition.interimResults = true; 
    recognition.maxAlternatives = 1;

    const originalText = btnElement.innerHTML;
    const inputField = document.getElementById(inputId);
    
    // Guardar lo que ya estuviera escrito antes de empezar a hablar
    const currentText = inputField.value;

    btnElement.innerHTML = "🔴 Ag éisteacht...";
    btnElement.style.backgroundColor = "#fee2e2";
    btnElement.style.color = "#dc2626";

    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        // Añadir el texto nuevo al texto que ya existía
        inputField.value = currentText + (currentText ? " " : "") + finalTranscript + interimTranscript;
    };

    recognition.onerror = function(event) {
        console.error("Aitheantas gutha earráid: ", event.error);
        if(event.error === 'no-speech') {
            alert("⚠️ Níor chuala mé aon rud. Déan iarracht arís!");
        }
    };

    recognition.onend = function() {
        btnElement.innerHTML = originalText;
        btnElement.style.backgroundColor = "";
        btnElement.style.color = "";
    };

    recognition.start();
}

// --- REPRODUCTOR DE YOUTUBE (MODO SEGURO) ---
function setupYouTubePlayer(videoId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; border: 1px solid #16a34a; background: #000;">
            <iframe 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                src="https://www.youtube.com/embed/${videoId}?rel=0" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
        <p style="font-size: 0.8rem; color: #166534; text-align: center; margin-top: 8px;">
            ℹ️ Físeán ó YouTube (Educational Use). <br>
            Oscail do leabhar chun an dán a léamh.
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
}

// ===========================================
// 1. COMHRÁ (15 TEMAS - ENRIQUECIDOS PARA STUDY MODE)
// ===========================================
const DATA = [
  { 
    id: 1, title: "1. Mé Féin", 
    OL: "Cén t-ainm atá ort? Cén aois thú? Cathain a rugadh thú?", 
    HL: "Déan cur síos ar do phearsantacht. Cad iad na buanna atá agat?",
    check_HL: "Tuiseal Ginideach, Aidiachtaí sealbhacha, Cur síos fisiciúil & Pearsantacht.",
    checkpoints_OL: ["Is mise... (Ainm)", "Tá mé X bliain d'aois", "Rugadh mé ar an..."],
    checkpoints_HL: ["Agam vs Orm (Physical vs Emotion)", "Is duine... mé (Copaail)", "Gruaig/Súile (Aidiachtaí)"],
    checkpoints_TOP: ["✨ Nath: I mbarr na sláinte", "✨ Gramadach: Aidiachtaí Sealbhacha (Mo/Do/A)", "✨ Vocab: Tréithe Pearsanta"]
  },
  { 
    id: 2, title: "2. Mo Theaghlach", 
    OL: "Cé mhéad duine atá i do simple deaghlach? An bhfuil deartháireacha agat?", 
    HL: "An réitíonn tú go maith le do thuismitheoirí? Inis dom fúthu.",
    check_HL: "Uimhreacha, Réimír, Tuiseal Ginideach (Post m'athar), Nathanna cainte.",
    checkpoints_OL: ["Tá cúigear againn sa chlann", "Tá deartháir amháin agam", "Is múinteoir í mo mham"],
    checkpoints_HL: ["Réitím go maith le...", "An duine is sine/óige", "Bíonn argóintí againn"],
    checkpoints_TOP: ["✨ Nath: Ní bhíonn saoi gan locht", "✨ Gramadach: Tuiseal Ginideach (Teach an athar)", "✨ Vocab: Clann mhór/bheag"]
  },
  { 
    id: 3, title: "3. Mo Cheantar", 
    OL: "Cá bhfuil tú i do chónaí? An maith leat do cheantar?", 
    HL: "Cad iad na fadhbanna sóisialta i do cheantar? (m.sh. dífhostaíocht)",
    check_HL: "Áiseanna, Fadhbanna, Tuiseal Ginideach (Lár an bhaile/muintir na háite).",
    checkpoints_OL: ["Tá mé i mo chónaí i...", "Tá sé suite in aice le...", "Tá páirc/siopa ann"],
    checkpoints_HL: ["Fadhbanna sóisialta", "Easpa áiseanna", "Tá sé ciúin/plódaithe"],
    checkpoints_TOP: ["✨ Nath: Níl aon tinteán mar do thinteán féin", "✨ Gramadach: Sa + Séimhiú (Sa chathair)", "✨ Vocab: Bruachbhaile"]
  },
  { 
    id: 4, title: "4. An Scoil", 
    OL: "Cén scoil a bhfuil tú ag freastal uirthi? An maith leat í?", 
    HL: "Cad a cheapann tú faoin gcóras oideachais? An bhfuil an iomarca brú ann?",
    check_HL: "Ainm na scoile, Ábhair, An Córas Pointí, Modh Coinníollach.",
    checkpoints_OL: ["Freastalaím ar scoil mheasctha", "Caithim éide scoile", "Déanaim seacht n-ábhar"],
    checkpoints_HL: ["An Ardteist", "Brú na bpointí", "Rialacha na scoile"],
    checkpoints_TOP: ["✨ Nath: Is maith an t-anlann an t-ocras", "✨ Gramadach: Dá mbeinn i mo phríomhoide...", "✨ Vocab: Idirbhliain"]
  },
  { 
    id: 5, title: "5. Caitheamh Aimsire", 
    OL: "Cad a dhéanann tú i do chuid am saor? An imríonn tú spórt?", 
    HL: "Cén tábhacht a bhaineann le spórt do dhaoine óga?",
    check_HL: "Ainm briathartha, TG (Cumann Peile), Sláinte intinne & choirp.",
    checkpoints_OL: ["Imrím peil", "Éistim le ceol", "Is maith liom Netflix"],
    checkpoints_HL: ["Buntáistí an spóirt", "Sláinte mheabhrach", "Caitheamh aimsire ciúin"],
    checkpoints_TOP: ["✨ Nath: Tír gan teanga, tír gan anam", "✨ Gramadach: Ainm Briathartha (Ag imirt)", "✨ Vocab: Aclaíocht"]
  },
  { 
    id: 6, title: "6. Laethanta Saoire", 
    OL: "Cad a dhéanann tú sa samhradh? An dtéann tú ar laethanta saoire?", 
    HL: "Inis dom faoi laethanta saoire a chuaigh i bhfeidhm ort.",
    check_HL: "Aimsir Chaite, Aimsir Ghnáthchaite, TG (Lár na cathrach).",
    checkpoints_OL: ["Rachaidh mé go dtí an Spáinn", "Beidh mé ag obair", "Gheobhaidh mé post"],
    checkpoints_HL: ["Ag taisteal", "Ag sábháil airgid", "An tSraith Shóisearach"],
    checkpoints_TOP: ["✨ Nath: Beidh an ghrian ag taitneamh", "✨ Gramadach: Aimsir Fháistineach (Beidh mé)", "✨ Vocab: Thar lear"]
  },
  { 
    id: 7, title: "7. An Todhchaí", 
    OL: "Cad a dhéanfaidh tú tar éis na hArdteiste?", 
    HL: "Cén post ba mhaith leat a fháil? An bhfuil sé deacair post a fháil in Éirinn?",
    check_HL: "Aimsir Fháistineach, Modh Coinníollach (Ba mhaith liom...), An Ollscoil.",
    checkpoints_OL: ["Rachaidh mé go dtí an ollscoil", "Ba mhaith liom staidéar a dhéanamh", "Beidh mé sásta"],
    checkpoints_HL: ["An bhliain seo chugainn", "Gairm bheatha", "Lóistín mic léinn"],
    checkpoints_TOP: ["✨ Nath: Ní neart go cur le chéile", "✨ Gramadach: Modh Coinníollach", "✨ Vocab: Neamhspleáchas"]
  },
  { 
    id: 8, title: "8. Obair Pháirtaimseartha", 
    OL: "An bhfuil post agat? Cén sórt oibre a dhéanann tú?", 
    HL: "An bhfuil sé go maith do dhaltaí scoile post a bheith acu?",
    check_HL: "Cur síos ar an obair, Pá, Buntáistí & Míbhuntáistí.",
    checkpoints_OL: ["Oibrím i siopa", "Faighim deich euro san uair", "Is maith liom an t-airgead"],
    checkpoints_HL: ["Cothromaíocht (Balance)", "Brú staidéir", "Taithí oibre"],
    checkpoints_TOP: ["✨ Nath: Is fearr an tsláinte ná na táinte", "✨ Gramadach: Dá mbeadh post agam...", "✨ Vocab: Airgead póca"]
  },
  { 
    id: 9, title: "9. An Ghaeilge", 
    OL: "An maith leat an Ghaeilge? An raibh tú sa Ghaeltacht?", 
    HL: "Stádas na Gaeilge. Cad is féidir linn a dhéanamh chun í a chur chun cinn?",
    check_HL: "An Ghaeltacht, Seachtain na Gaeilge, TG4, Modh Coinníollach.",
    checkpoints_OL: ["Is maith liom an teanga", "Bhí mé sa Ghaeltacht", "Tá sé tábhachtach"],
    checkpoints_HL: ["Todhchaí na Gaeilge", "An cultúr Gaelach", "Ag cur na teanga chun cinn"],
    checkpoints_TOP: ["✨ Nath: Beatha teanga í a labhairt", "✨ Gramadach: An Aimsir Láithreach", "✨ Vocab: Oidhreacht"]
  },
  { 
    id: 10, title: "10. Fadhbanna Sóisialta", 
    OL: "An bhfuil fadhbanna ag daoine óga inniu?", 
    HL: "Alcól, drugaí, agus tithíocht. Cad iad na dúshláin is mó?",
    check_HL: "Fadhbanna, Brú na bpiaraí, TG (Fadhb na dtiarnaí talún), Réiteach.",
    checkpoints_OL: ["Tá fadhb an óil ann", "Tá drugaí ann", "Tá brú mór ar dhaoine óga"],
    checkpoints_HL: ["Géarchéim na tithíochta", "Daoine gan dídean", "An córas sláinte"],
    checkpoints_TOP: ["✨ Nath: Is maith an scéalaí an aimsir", "✨ Gramadach: Ba chóir don rialtas...", "✨ Vocab: Bochtaineacht"]
  },
  { 
    id: 11, title: "11. Cúrsaí Reatha", 
    OL: "An léann tú an nuacht? Cad atá sa nuacht?", 
    HL: "Cogadh, athrú aeráide, nó polaitíocht. Scéal mór le déanaí.",
    check_HL: "Scéal nuachta sonrach, Athrú Aeráide (Téamh domhanda), Tuairim phearsanta.",
    checkpoints_OL: ["Léim an nuacht ar líne", "Tá cogadh ar siúl", "Tá an aimsir go dona"],
    checkpoints_HL: ["Téamh domhanda", "An timpeallacht", "Cúrsaí polaitíochta"],
    checkpoints_TOP: ["✨ Nath: Níorhaon lae é an domhan", "✨ Gramadach: An Aimsir Láithreach", "✨ Vocab: Athrú aeráide"]
  },
  { 
    id: 12, title: "12. Ceol & Cultúr", 
    OL: "An maith leat ceol? Cén cineál ceoil?", 
    HL: "Tábhacht an chultúir agus an cheoil. An dtéann tú chuig ceolchoirmeacha?",
    check_HL: "Uirlisí ceoil, Ceolchoirmeacha, Tábhacht an chultúir Ghaelaigh.",
    checkpoints_OL: ["Is maith liom popcheol", "Seinim an giotár", "Rachaidh mé go dtí ceolchoirm"],
    checkpoints_HL: ["Ceol traidisiúnta", "Fleadh Cheoil", "Tionchar an cheoil"],
    checkpoints_TOP: ["✨ Nath: Ceol na n-éan", "✨ Gramadach: Ag seinm (Ainm Briathartha)", "✨ Vocab: Cultúr Gaelach"]
  },
  { 
    id: 13, title: "13. Teicneolaíocht", 
    OL: "An bhfuil fón póca agat? An úsáideann tú TikTok?", 
    HL: "Buntáistí agus míbhuntáistí an idirlín agus na meáin shóisialta.",
    check_HL: "Aipeanna, Buntáistí/Míbhuntáistí, Cibearbhulaíocht, TG (Suíomhanna sóisialta).",
    checkpoints_OL: ["Úsáidim Instagram", "Bím ar líne gach lá", "Tá fón póca agam"],
    checkpoints_HL: ["Cibearbhulaíocht", "Bréagnuacht (Fake news)", "Andúil sa teicneolaíocht"],
    checkpoints_TOP: ["✨ Nath: Ar scáth a chéile a mhaireann na daoine", "✨ Gramadach: Buntáistí vs Míbhuntáistí", "✨ Vocab: Meáin shóisialta"]
  },
  { 
    id: 14, title: "14. Sláinte", 
    OL: "An itheann tú bia sláintiúil? An ndéanann tú aclaíocht?", 
    HL: "Fadhb na raimhre in Éirinn. Cén fáth a bhfuil sláinte intinne tábhachtach?",
    check_HL: "Bia folláin vs Mí-fhalláin, Aclaíocht, Sláinte intinne, TG (Fadhb na raimhre).",
    checkpoints_OL: ["Ithim torthaí agus glasraí", "Ólaim uisce", "Déanaim aclaíocht"],
    checkpoints_HL: ["Fadhb na raimhre", "Sláinte mheabhrach", "Bia junk (Bia gasta)"],
    checkpoints_TOP: ["✨ Nath: Sláinte an bhradáin", "✨ Gramadach: Ba cheart dúinn...", "✨ Vocab: Folláine"]
  },
  { 
    id: 15, title: "15. Daoine Cáiliúla", 
    OL: "Cé hé/hí an duine is fearr leat?", 
    HL: "An bhfuil tionchar maith nó olc ag daoine cáiliúla ar dhaoine óga?",
    check_HL: "Tionchar, Eiseamláirí, Na Meáin, Tuairim.",
    checkpoints_OL: ["Is maith liom Taylor Swift", "Is aisteoir maith é", "Tá sé cáiliúil"],
    checkpoints_HL: ["Tionchar na meán", "Eiseamláirí maithe/olca", "Brú ar dhaoine óga"],
    checkpoints_TOP: ["✨ Nath: Laoch na himeartha", "✨ Gramadach: An Aimsir Láithreach", "✨ Vocab: Tionchar"]
  }
];

let currentLevel = 'OL';
let currentMode = 'exam';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0; 

const PAST_Q = ["Cad a rinne tú inné?", "Ar ndeachaigh tú amach?", "Cén chaoi ar chaith tú do bhreithlá?"];
const FUT_Q = ["Cad a dhéanfaidh tú amárach?", "Cá rachaidh tú?", "Cad a dhéanfaidh tú tar éis na scrúduithe?"];

// ===========================================
// LÓGICA DE CONTROL (SET MODE / SET LEVEL)
// ===========================================

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
            
            if(currentMode === 'study') {
                renderCheckpoints();
            } else {
                updateQuestion(); 
            }
        }; 
        g.appendChild(b); 
    }); 
}

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
// MODO FORMACIÓN (STUDY MODE AI)
// ===========================================

function initStudyHTML() {
    // El contenedor ya está en HTML
}

function renderCheckpoints() {
    const container = document.getElementById('studyContainer');
    if (!container) return;

    if (!currentTopic) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#64748b; font-weight:bold;'>👈 Roghnaigh topaic le do thoil.</p>";
        return;
    }
    
    container.innerHTML = `
        <h3 style="color:#166534;">📚 Study Mode: ${currentTopic.title}</h3>
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

    if (currentTopic.checkpoints_OL) createSection("🧱 Bunús (Foundations)", currentTopic.checkpoints_OL, "btn-ol");
    if (currentLevel === 'HL' && currentTopic.checkpoints_HL) {
        createSection("🔧 Ardleibhéal (HL)", currentTopic.checkpoints_HL, "btn-hl");
        if(currentTopic.checkpoints_TOP) {
            createSection("🚀 Nathanna Cainte (Top Marks)", currentTopic.checkpoints_TOP, "btn-top");
        }
    }
}

async function askAIConcept(concept) {
    const box = document.getElementById('aiExplanationBox');
    box.style.display = 'block'; 
    box.innerHTML = "⏳ <b>Ag fiafraí den mhúinteoir AI...</b>";

    const prompt = `
        ACT AS: Irish Grammar Teacher.
        TOPIC: "${currentTopic ? currentTopic.title : 'General'}".
        CONCEPT: "${concept}".
        INSTRUCTIONS: Explain in English (max 50 words). Provide 2 Irish examples with English translation.
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

// ===========================================
// FUNCIÓN ANALYZE (EXAM MODE)
// ===========================================
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
  ACT AS: Strict Leaving Cert Irish Examiner.
  CONTEXT: RAW TEXT (No punctuation).
  QUESTION: "${q}". 
  STUDENT WROTE: "${t}". 
  LEVEL: ${currentLevel}.
  CHECKPOINTS: [ ${criteria} ].
  INSTRUCTIONS: Check Grammar (Tuiseal Ginideach, Séimhiú/Urú, Briathra).
  OUTPUT JSON: { 
    "score": 0-100, 
    "feedback_ga": "Moladh & Comhairle i nGaeilge", 
    "feedback_en": "Explain grammar mistakes simply in English", 
    "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] 
  }`;

  try {
    const rawText = await callSmartAI(prompt);
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    const j = JSON.parse(cleanJson);
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    
    const s = document.getElementById('scoreDisplay');
    s.innerText = `Scór: ${j.score}%`;
    s.style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbGA').innerText = "🇮🇪 " + j.feedback_ga; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Ar fheabhas!";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { 
        btnReset.innerText = "➡️ An Chéad Cheist Eile"; 
        btnReset.onclick = nextMockQuestion; 
    } else { 
        btnReset.innerText = "🔄 Topaic Eile"; 
        btnReset.onclick = () => { isMockExam=false; resetApp(); }; 
    }
  } catch (e) { 
      console.error(e); 
      alert("⚠️ The AI is a bit busy right now. (" + e.message + ")"); 
  } finally { 
      b.disabled = false; b.innerText = "✨ Ceartaigh"; 
  }
}

// ===========================================
// MOCK EXAM & UTILS
// ===========================================
function startMockExam() { 
    setMode('exam');
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

function nextMockQuestion() { mockIndex++; showMockQuestion(); }

function speakText() { 
    const rawHTML = document.getElementById('qDisplay').innerHTML;
    const t = rawHTML.replace(/<[^>]*>/g, "").replace(/\(OL\)|\(HL\)/g, ""); 
    speakRobot(t);
}

function speakRobot(text) {
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text); 
        u.lang = 'ga-IE'; 
        if (irishVoiceAvailable) u.voice = irishVoiceAvailable;
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    }
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    speakRobot(text); 
}

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
            hintBox.innerHTML = "<strong>📝 Pointí Tábhachtacha (HL):</strong><br>" + currentTopic.check_HL;
        } else {
            btnHint.style.display = 'none'; 
        }
    }
}

// ===========================================
// 4. FILÍOCHT (POETRY YOUTUBE)
// ===========================================
let currentPoemYear = 2026;
let currentPoemIndex = 0;

const POEMS_2026 = [
  { title: "Géibheann", author: "Caitlín Maude", youtubeId: "8t15UbhCYHo" }, 
  { title: "Colscaradh", author: "Pádraig Mac Suibhne", youtubeId: "kJE3N7Z2pWw" }, 
  { title: "Mo Ghrá-sa", author: "Nuala Ní Dhomhnaill", youtubeId: "m9AyCD7XLn4" }, 
  { title: "An tEarrach Thiar", author: "Máirtín Ó Direáin", youtubeId: "eT1Y9tdZ898" }, 
  { title: "An Spailpín Fánach", author: "Anaithnid (Traditional)", youtubeId: "hrUGsTFIO3w" } 
];

const POEMS_2027 = [
  { title: "Dínit an Bhróin", author: "Máirtín Ó Direáin", youtubeId: "7lQsS-EupoE" }, 
  { title: "Iníon", author: "Áine Durkin", youtubeId: "1vGv9aDxeoI" }, 
  { title: "Glaoch Abhaile", author: "Áine Ní Ghlinn", youtubeId: "_eNdbzJdkmw" }, 
  { title: "Deireadh na Feide", author: "Ailbhe Ní Ghearbhuigh", youtubeId: "GnbBxuiuhNI" }, 
  { title: "Úirchill an Chreagáin", author: "Art Mac Cumhaigh", youtubeId: "WaHQNmqj9g0" } 
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
    // Seleccionar el primero por defecto si no hay activo
    if (!document.querySelector('#poemButtonsContainer .active')) {
        selectPoem(0, container.children[0]);
    }
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
    document.getElementById('poemText').innerHTML = "<em>Due to copyright restrictions, please follow the text in your official textbook.</em>";

    setupYouTubePlayer(p.youtubeId, 'audioPlayerContainer');
}

// ===========================================
// 5. SRAITH PICTIÚR
// ===========================================
let currentSraithTitle = "";
const SRAITH_TITLES = [
  "1. Cuairt ar Aintín i Nua-Eabhrac", "2. Imreoir Gortaithe", "3. Bua sa chomórtas díospóireachta", 
  "4. Ná húsáid an cárta creidmheasa gan chead", "5. Ag toghadh scoláire na bliana", "6. An Ghaeilge - seoid luachmhar", 
  "7. Obair dhian: torthaí maithe", "8. Comhoibriú an Phobail", "9. Samhradh Iontach", 
  "10. Drochaimsir - Athrú Aeráide", "11. Timpiste sa Choláiste Samhraidh", "12. Sláinte na nóg", 
  "13. Bua ag Cór na Scoile", "14. Teip sa Scrúdú Tiomána", "15. Breoite ar Scoil", 
  "16. Agallamh do nuacht TG4", "17. Madra ar Strae", "18. Na Déagóirí Cróga", 
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
  
  const prompt = `ACT AS: Irish Examiner. TASK: Sraith Pictiúr "${currentSraithTitle}". STUDENT WROTE: "${t}". CHECK GRAMMAR: Focus on Past Tense (Aimsir Chaite). OUTPUT JSON: { "score": 0-100, "feedback_ga": "Irish feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }`;

  try {
    const rawText = await callSmartAI(prompt);
    const j = JSON.parse(rawText.replace(/```json|```/g, "").trim());
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
      alert("⚠️ Earráid: " + e.message); 
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
