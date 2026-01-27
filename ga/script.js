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
  { title: "1. Mé Féin", OL: "Cén t-ainm atá ort? Cén aois thú? Cathain a rugadh thú?", HL: "Déan cur síos ar do phearsantacht. Cad iad na buanna atá agat?" },
  { title: "2. Mo Theaghlach", OL: "Cé mhéad duine atá i do theaghlach? An bhfuil deartháireacha agat?", HL: "An réitíonn tú go maith le do thuismitheoirí? Inis dom fúthu." },
  { title: "3. Mo Cheantar", OL: "Cá bhfuil tú i do chónaí? An maith leat do cheantar?", HL: "Cad iad na fadhbanna sóisialta i do cheantar? (m.sh. dífhostaíocht)" },
  { title: "4. An Scoil", OL: "Cén scoil a bhfuil tú ag freastal uirthi? An maith leat í?", HL: "Cad a cheapann tú faoin gcóras oideachais? An bhfuil an iomarca brú ann?" },
  { title: "5. Caitheamh Aimsire", OL: "Cad a dhéanann tú i do chuid am saor? An imríonn tú spórt?", HL: "Cén tábhacht a bhaineann le spórt do dhaoine óga?" },
  { title: "6. Laethanta Saoire", OL: "Cad a dhéanann tú sa samhradh? An dtéann tú ar laethanta saoire?", HL: "Inis dom faoi laethanta saoire a chuaigh i bhfeidhm ort." },
  { title: "7. An Todhchaí", OL: "Cad a dhéanfaidh tú tar éis na hArdteiste?", HL: "Cén post ba mhaith leat a fháil? An bhfuil sé deacair post a fháil in Éirinn?" },
  { title: "8. Obair Pháirtaimseartha", OL: "An bhfuil post agat? Cén sórt oibre a dhéanann tú?", HL: "An bhfuil sé go maith do dhaltaí scoile post a bheith acu?" },
  { title: "9. An Ghaeilge", OL: "An maith leat an Ghaeilge? An raibh tú sa Ghaeltacht?", HL: "Stádas na Gaeilge. Cad is féidir linn a dhéanamh chun í a chur chun cinn?" },
  { title: "10. Fadhbanna Sóisialta", OL: "An bhfuil fadhbanna ag daoine óga inniu?", HL: "Alcól, drugaí, agus tithíocht. Cad iad na dúshláin is mó?" },
  { title: "11. Cúrsaí Reatha", OL: "An léann tú an nuacht? Cad atá sa nuacht?", HL: "Cogadh, athrú aeráide, nó polaitíocht. Scéal mór le déanaí." },
  { title: "12. Ceol & Cultúr", OL: "An maith leat ceol? Cén cineál ceoil?", HL: "Tábhacht an chultúir agus an cheoil. An dtéann tú chuig ceolchoirmeacha?" },
  { title: "13. Teicneolaíocht", OL: "An bhfuil fón póca agat? An úsáideann tú TikTok?", HL: "Buntáistí agus míbhuntáistí an idirlín agus na meáin shóisialta." },
  { title: "14. Sláinte", OL: "An itheann tú bia sláintiúil? An ndéanann tú aclaíocht?", HL: "Fadhb na raimhre in Éirinn. Cén fáth a bhfuil sláinte intinne tábhachtach?" },
  { title: "15. Daoine Cáiliúla", OL: "Cé hé/hí an duine is fearr leat?", HL: "An bhfuil tionchar maith nó olc ag daoine cáiliúla ar dhaoine óga?" }
];

let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0; 
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

function speakText() { 
    const t = document.getElementById('qDisplay').innerText; 
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = 0.9; window.speechSynthesis.speak(u); } 
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
  const prompt = `ACT AS: Irish Examiner. QUESTION: "${q}". STUDENT: "${t}". OUTPUT JSON: { "score": (0-100), "feedback_ga": "Irish feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    document.getElementById('scoreDisplay').innerText = `Scór: ${j.score}%`;
    document.getElementById('scoreDisplay').style.color = j.score >= 85 ? "#166534" : "#ca8a04";
    document.getElementById('fbGA').innerText = "🇮🇪 " + j.feedback_ga; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "✅ Ar fheabhas!";
    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) { btnReset.innerText = "➡️ An Chéad Cheist Eile"; btnReset.onclick = resetApp; } else { btnReset.innerText = "🔄 Topaic Eile"; btnReset.onclick = () => { isMockExam=false; resetApp(); }; }
  } catch (e) { console.error(e); alert("Earráid."); } finally { b.disabled = false; b.innerText = "✨ Ceartaigh"; }
}

function readMyInput() {
    const text = document.getElementById("userInput").value;
    if (!text) return; 
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

// ===========================================
// 4. DATOS DE POEMAS (COPYRIGHT SAFE)
// ===========================================
let currentPoemIndex = 0;
let currentAudio = null;

const POEMS = [
  // POEMAS MODERNOS (SOLO INFO, SIN TEXTO ENTERO)
  { 
    title: "Geibheann", 
    author: "Caitlín Maude", 
    text: "⚠️ Copyright Protected Text.\n\nOpen your textbook to read the full poem.\n\nTheme: Freedom vs. Captivity.\nThe poet compares her life to a wild animal in a zoo." 
  },
  { 
    title: "Colscaradh", 
    author: "Pádraig Mac Suibhne", 
    text: "⚠️ Copyright Protected Text.\n\nOpen your textbook to read the full poem.\n\nTheme: Separation/Divorce.\nA couple wants different things from life (Home vs. Travel)." 
  },
  { 
    title: "Mo Ghrá-sa (idir lúibíní)", 
    author: "Nuala Ní Dhomhnaill", 
    text: "⚠️ Copyright Protected Text.\n\nOpen your textbook to read the full poem.\n\nTheme: Realistic Love.\nA funny, satirical poem mocking traditional love songs. She loves him despite his faults." 
  },
  { 
    title: "An tEarrach Thiar", 
    author: "Máirtín Ó Direáin", 
    text: "⚠️ Copyright Protected Text.\n\nOpen your textbook to read the full poem.\n\nTheme: Nostalgia.\nThe poet remembers the idyllic, peaceful life on the Aran Islands in Spring." 
  },
  // POEMAS TRADICIONALES (TEXTO COMPLETO PERMITIDO)
  { 
    title: "An Spailpín Fánach", 
    author: "Anaithnid (Traditional)", 
    text: `Im spailpín fánach atáim le fada
ag seasamh ar mo shláinte,
ag siúl an drúchta go moch ar maidin
's ag bailiú galair ráithe;
ach glacfad fees ó rí na gcroppies,
cleith is píc chun sáite
's go brách arís ní ghlaofar m'ainm
sa tír seo, an spailpín fánach.

Ba mhinic mo thriall go Cluain gheal Meala
's as san go Tiobraid Árann;
i gCarraig na Siúire thíos do ghearrainn
cúrsa leathan láidir;
i gCallainn go dlúth 's mo shúiste im ghlaic
ag dul chun tosaigh ceard leo
's nuair théim go Durlas 's é siúd bhíonn agam –
'Sin chu'ibh an spailpín fánach!'

Go deo deo arís ní raghad go Caiseal
ag díol ná ag reic mo shláinte
ná ar mhargadh na saoire im shuí cois balla,
im scaoinse ar leataoibh sráide,
bodairí na tíre ag tíocht ar a gcapaill
á fhiafraí an bhfuilim hireálta;
'téanam chun siúil, tá an cúrsa fada' –
siúd siúl ar an spailpín fánach.` 
  },
  { 
    title: "Iníon an Bhaoilligh", 
    author: "Amhrán Traidisiúnta", 
    text: `Bhí mé oíche taobh istigh ‘Fhéil’ Bríde
Ar faire thíos ar an Mhullach Mhór,
Is tharla naí dom a dtug mé gnaoi dí
Mar bhí sí caíúil lách álainn óg.

Sí go cinnte a mhearaigh m’intinn,
Agus lia na bhfiann, ó, ní leigheasfadh mé,
Is tá mo chroí istigh ina mhíle píosa
Mura bhfaighim cead síneadh lena brollach glégheal.

Is fada an lá breá ó thug mé grá duit,
Is mé i mo pháiste beag óg gan chiall,
Is dá mbíodh mo mhuintir uilig i bhfeirg liom
Nár chuma liom, a mhíle stór?

A mhíle grá, tá cách ag rá liom
Gur den ghrá ort a gheobhaidh mé bás,
Is níl an lá margaidh dá mbeadh ins na Gearailtigh
Nach mbeadh cúl fathmhainneach is mise ag ól.

‘S a chailín donn deas a chuaigh i gcontúirt,
Druid anall liom agus tabhair domh póg
Is gur leatsa a shiúlfainn cnoic is gleanntáin,
Is go Baile an Teampaill dá mbíodh sé romhainn;

Ach anois ó tá mise curtha cráite,
Is gur lig mé páirt mhór de mo rún le gaoth,\nA Rí atá i bParrthas, déan dom fáras,
I ngleanntáin áilne lena taobh.` 
  }
];

function selectPoem(index, btn) {
    document.querySelectorAll('#sectionPoetry .rp-btn-select').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    stopAudio(); 
    currentPoemIndex = index;
    const p = POEMS[index];
    document.getElementById('poemArea').style.display = 'block';
    document.getElementById('poemTitle').innerText = p.title;
    document.getElementById('poemAuthor').innerText = "le " + p.author;
    document.getElementById('poemText').innerText = p.text;
}

function playPoemAudio() {
    stopAudio();
    const filename = `Poem${currentPoemIndex + 1}.mp3`;
    currentAudio = new Audio(filename);
    currentAudio.onerror = function() { alert("⚠️ Níor aimsíodh: " + filename); };
    currentAudio.play();
}

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
}

// ===========================================
// 5. DATOS SRAITH PICTIÚR (20 TÍTULOS OFICIALES)
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
    const text = "Inis dom an scéal. Cad atá ag tarlú sna pictiúir?";
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.9; window.speechSynthesis.speak(u); }
}

function readMySraithInput() {
    const text = document.getElementById("userInputSraith").value;
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

async function analyzeSraith() {
  const t = document.getElementById('userInputSraith').value;
  if(t.length < 5) return alert("Scríobh níos mó le do thoil...");
  const b = document.getElementById('btnActionSraith'); 
  b.disabled = true; b.innerText = "⏳ Ag ceartú...";
  const prompt = `ACT AS: Irish Examiner. TASK: Sraith Pictiúr "${currentSraithTitle}". STUDENT: "${t}". OUTPUT JSON: { "score": (0-100), "feedback_ga": "Irish feedback", "feedback_en": "English feedback", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    document.getElementById('sraithArea').style.display = 'none'; 
    document.getElementById('resultSraith').style.display = 'block';
    document.getElementById('userResponseTextSraith').innerText = t;
    document.getElementById('scoreDisplaySraith').innerText = `Scór: ${j.score}%`;
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

// ===========================================
// ¡ARRANCAR MOTOR!
// ===========================================
window.onload = function() {
    initConv();
    initSraith();
};
