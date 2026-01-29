// ===========================================
// CONFIGURACIÓN
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

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
  
  stopAudio();
}

// ===========================================
// 1. COMHRÁ (15 TEMAS)
// ===========================================
const DATA = [
  { id: 1, title: "1. Mé Féin", OL: "Cén t-ainm atá ort? Cén aois thú? Cathain a rugadh thú?", HL: "Déan cur síos ar do phearsantacht. Cad iad na buanna atá agat?" },
  { id: 2, title: "2. Mo Theaghlach", OL: "Cé mhéad duine atá i do theaghlach? An bhfuil deartháireacha agat?", HL: "An réitíonn tú go maith le do thuismitheoirí? Inis dom fúthu." },
  { id: 3, title: "3. Mo Cheantar", OL: "Cá bhfuil tú i do chónaí? An maith leat do cheantar?", HL: "Cad iad na fadhbanna sóisialta i do cheantar? (m.sh. dífhostaíocht)" },
  { id: 4, title: "4. An Scoil", OL: "Cén scoil a bhfuil tú ag freastal uirthi? An maith leat í?", HL: "Cad a cheapann tú faoin gcóras oideachais? An bhfuil an iomarca brú ann?" },
  { id: 5, title: "5. Caitheamh Aimsire", OL: "Cad a dhéanann tú i do chuid am saor? An imríonn tú spórt?", HL: "Cén tábhacht a bhaineann le spórt do dhaoine óga?" },
  { id: 6, title: "6. Laethanta Saoire", OL: "Cad a dhéanann tú sa samhradh? An dtéann tú ar laethanta saoire?", HL: "Inis dom faoi laethanta saoire a chuaigh i bhfeidhm ort." },
  { id: 7, title: "7. An Todhchaí", OL: "Cad a dhéanfaidh tú tar éis na hArdteiste?", HL: "Cén post ba mhaith leat a fháil? An bhfuil sé deacair post a fháil in Éirinn?" },
  { id: 8, title: "8. Obair Pháirtaimseartha", OL: "An bhfuil post agat? Cén sórt oibre a dhéanann tú?", HL: "An bhfuil sé go maith do dhaltaí scoile post a bheith acu?" },
  { id: 9, title: "9. An Ghaeilge", OL: "An maith leat an Ghaeilge? An raibh tú sa Ghaeltacht?", HL: "Stádas na Gaeilge. Cad is féidir linn a dhéanamh chun í a chur chun cinn?" },
  { id: 10, title: "10. Fadhbanna Sóisialta", OL: "An bhfuil fadhbanna ag daoine óga inniu?", HL: "Alcól, drugaí, agus tithíocht. Cad iad na dúshláin is mó?" },
  { id: 11, title: "11. Cúrsaí Reatha", OL: "An léann tú an nuacht? Cad atá sa nuacht?", HL: "Cogadh, athrú aeráide, nó polaitíocht. Scéal mór le déanaí." },
  { id: 12, title: "12. Ceol & Cultúr", OL: "An maith leat ceol? Cén cineál ceoil?", HL: "Tábhacht an chultúir agus an cheoil. An dtéann tú chuig ceolchoirmeacha?" },
  { id: 13, title: "13. Teicneolaíocht", OL: "An bhfuil fón póca agat? An úsáideann tú TikTok?", HL: "Buntáistí agus míbhuntáistí an idirlín agus na meáin shóisialta." },
  { id: 14, title: "14. Sláinte", OL: "An itheann tú bia sláintiúil? An ndéanann tú aclaíocht?", HL: "Fadhb na raimhre in Éirinn. Cén fáth a bhfuil sláinte intinne tábhachtach?" },
  { id: 15, title: "15. Daoine Cáiliúla", OL: "Cé hé/hí an duine is fearr leat?", HL: "An bhfuil tionchar maith nó olc ag daoine cáiliúla ar dhaoine óga?" }
];

let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0; 
let currentAudio = null;

// Preguntas Mock
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

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = currentTopic[currentLevel]; 
}

function startMockExam() { 
    isMockExam = true; mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    let i = [...Array(DATA.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [DATA[i[0]][currentLevel], DATA[i[1]][currentLevel], DATA[i[2]][currentLevel], PAST_Q[Math.floor(Math.random()*3)] + " (Aimsir Chaite)", FUT_Q[Math.floor(Math.random()*3)] + " (Aimsir Fháistineach)"];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Ceist ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
}

// 🔊 LÓGICA DE AUDIO HÍBRIDA (ELEVENLABS + FALLBACK)
function speakText() { 
    stopAudio();
    if(isMockExam) {
        // En mock exam usamos voz robótica porque es random
        const t = document.getElementById('qDisplay').innerText; 
        speakRobot(t);
        return;
    }

    // Nombre del archivo que esperamos (Ej: q_t1_ol.mp3)
    // t1 = tema 1, ol = ordinary level
    const filename = `audio/q_t${currentTopic.id}_${currentLevel.toLowerCase()}.mp3`;
    
    // Intentar reproducir el MP3
    currentAudio = new Audio(filename);
    
    // Si falla (no existe el archivo aún), usar Robot
    currentAudio.onerror = function() {
        console.log("Audio file not found ("+filename+"), using fallback.");
        speakRobot(document.getElementById('qDisplay').innerText);
    };
    
    currentAudio.play();
}

function speakRobot(text) {
    if ('speechSynthesis' in window) { 
        window.speechSynthesis.cancel(); 
        const u = new SpeechSynthesisUtterance(text); 
        // Intentar forzar voz irlandesa si existe, sino inglesa
        u.lang = 'ga-IE'; 
        u.rate = 0.9; 
        window.speechSynthesis.speak(u); 
    }
}

function stopAudio() {
    if(currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    window.speechSynthesis.cancel();
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    if(isMockExam && mockIndex < 4) { mockIndex++; showMockQuestion(); } else { isMockExam = false; document.getElementById('userInput').value = ""; document.getElementById('qDisplay').innerHTML = "Roghnaigh topaic..."; }
}

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 5) return alert("Scríobh níos mó le do thoil...");
  const b = document.getElementById('btnAction'); 
  b.disabled = true; b.innerText = "⏳ Ag ceartú...";
  const q = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
  
  // PROMPT MODIFICADO: ENFOQUE EN GRAMÁTICA Y ESCRITURA
  const prompt = `
  ACT AS: Irish Grammar Teacher. 
  QUESTION: "${q}". 
  STUDENT WROTE: "${t}". 
  TASK: Check grammar (Tuiseal Ginideach, verbs), spelling and structure.
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
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbGA').innerText = "🇮🇪 " + j.feedback_ga; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Gramadach foirfe!";
    
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { btnReset.innerText = "➡️ An Chéad Cheist Eile"; btnReset.onclick = resetApp; } else { btnReset.innerText = "🔄 Topaic Eile"; btnReset.onclick = () => { isMockExam=false; resetApp(); }; }
  } catch (e) { console.error(e); alert("Earráid."); } finally { b.disabled = false; b.innerText = "✨ Ceartaigh (Correct)"; }
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    speakRobot(text); // Usamos el robot para leer lo que escribe el alumno
}

// ===========================================
// 4. DATOS DE POEMAS (2026 & 2027)
// ===========================================
let currentPoemYear = 2026;
let currentPoemIndex = 0;

// SYLLABUS 2026 (ACTUAL 6th YEAR)
const POEMS_2026 = [
  { title: "Geibheann", author: "Caitlín Maude", text: "⚠️ Copyright Protected Text.\n\nTheme: Freedom vs. Captivity.\nThe poet compares her life to a wild animal in a zoo." },
  { title: "Colscaradh", author: "Pádraig Mac Suibhne", text: "⚠️ Copyright Protected Text.\n\nTheme: Separation/Divorce.\nA couple wants different things from life (Home vs. Travel)." },
  { title: "Mo Ghrá-sa", author: "Nuala Ní Dhomhnaill", text: "⚠️ Copyright Protected Text.\n\nTheme: Realistic Love.\nA funny, satirical poem mocking traditional love songs." },
  { title: "An tEarrach Thiar", author: "Máirtín Ó Direáin", text: "⚠️ Copyright Protected Text.\n\nTheme: Nostalgia.\nThe poet remembers the idyllic life on the Aran Islands." },
  { title: "An Spailpín Fánach", author: "Anaithnid (Traditional)", text: `Im spailpín fánach atáim le fada\nag seasamh ar mo shláinte,\nag siúl an drúchta go moch ar maidin\n's ag bailiú galair ráithe;\nach glacfad fees ó rí na gcroppies,\ncleith is píc chun sáite\n's go brách arís ní ghlaofar m'ainm\nsa tír seo, an spailpín fánach.\n\nBa mhinic mo thriall go Cluain gheal Meala\n's as san go Tiobraid Árann;\ni gCarraig na Siúire thíos do ghearrainn\ncúrsa leathan láidir;\ni gCallainn go dlúth 's mo shúiste im ghlaic\nag dul chun tosaigh ceard leo\n's nuair théim go Durlas 's é siúd bhíonn agam –\n'Sin chu'ibh an spailpín fánach!'\n\nGo deo deo arís ní raghad go Caiseal\nag díol ná ag reic mo shláinte\nná ar mhargadh na saoire im shuí cois balla,\nim scaoinse ar leataoibh sráide,\nbodairí na tíre ag tíocht ar a gcapaill\ná fhiafraí an bhfuilim hireálta;\n'téanam chun siúil, tá an cúrsa fada' –\nsiúd siúl ar an spailpín fánach.` }
];

// SYLLABUS 2027 (NEW FOR 5th YEAR)
const POEMS_2027 = [
  { title: "Dínit an Bhróin", author: "Máirtín Ó Direáin", text: "⚠️ Copyright Protected Text.\n\nTheme: Dignity in Grief.\nTraditional mourning on the Aran Islands." },
  { title: "Iníon", author: "Áine Durkin", text: "⚠️ Copyright Protected Text.\n\nTheme: Mother-Daughter relationship.\nGrowth and independence." },
  { title: "Glaoch Abhaile", author: "Áine Ní Ghlinn", text: "⚠️ Copyright Protected Text.\n\nTheme: Emigration & Communication.\nCalling home and the distance felt." },
  { title: "Deireadh na Feide", author: "Ailbhe Ní Ghearbhuigh", text: "⚠️ Copyright Protected Text.\n\nTheme: Language & Modernity.\nThe future of the Irish language." },
  { title: "Úirchill an Chreagáin", author: "Art Mac Cumhaigh", text: `Ag Úirchill an Chreagáin chodail mé aréir faoi bhrón...` }
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
    
    stopAudio(); 
    currentPoemIndex = index;
    const list = currentPoemYear === 2026 ? POEMS_2026 : POEMS_2027;
    const p = list[index];
    
    document.getElementById('poemArea').style.display = 'block';
    document.getElementById('poemTitle').innerText = p.title;
    document.getElementById('poemAuthor').innerText = "le " + p.author;
    document.getElementById('poemText').innerText = p.text;
}

function playPoemAudio() {
    stopAudio();
    let filename = "";
    if (currentPoemYear === 2026) {
        filename = `Poem${currentPoemIndex + 1}.mp3`;
    } else {
        filename = `Poem2027_${currentPoemIndex + 1}.mp3`;
    }
    currentAudio = new Audio(filename);
    currentAudio.onerror = function() { 
        alert("⚠️ Audio file not found: " + filename);
    };
    currentAudio.play();
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
  const prompt = `ACT AS: Irish Examiner. TASK: Sraith Pictiúr "${currentSraithTitle}". STUDENT WROTE: "${t}". CHECK GRAMMAR. OUTPUT JSON: { "score": (0-100), "feedback_ga": "Irish feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }`;

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
  } catch (e) { console.error(e); alert("Earráid."); } finally { b.disabled = false; b.innerText = "✨ Ceartaigh"; }
}

function resetSraith() {
    document.getElementById('resultSraith').style.display = 'none';
    document.getElementById('sraithArea').style.display = 'block';
    document.getElementById('userInputSraith').value = "";
}

window.onload = function() {
    initConv();
    initSraith();
    setPoemYear(2026);
};
