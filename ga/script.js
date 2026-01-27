// ===========================================
// CONFIGURACIÓN Y CLAVES (API KEY)
// ===========================================
const parteA = "AIzaSyASf_PIq7es0iPVt"; 
const parteB = "VUMt8Kn1Ll3qSpQQxg"; 
const API_KEY = parteA + parteB;

// --- NAVEGACIÓN ---
function toggleInfo() { const b = document.getElementById('infoBox'); b.style.display = b.style.display === 'block' ? 'none' : 'block'; }

function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabPoem').className = tab === 'poem' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionPoetry').style.display = tab === 'poem' ? 'block' : 'none';
}

// ===========================================
// PARTE: CONVERSATION (Gaeilge Logic)
// ===========================================
let currentLevel = 'OL';
let currentTopic = null;
let isMockExam = false; 
let mockQuestions = []; 
let mockIndex = 0;      

// DATA CURATED BY EXPERT LEAVING CERT EXAMINER
const DATA = [
  { title: "1. Mé Féin", OL: "Cén t-ainm atá ort? Cén aois thú? Inis dom fút féin (dath na súl, gruaig).", HL: "Inis dom fút féin. Cén saghas duine thú? Cad iad na buanna agus na laigí atá agat?" },
  { title: "2. Mo Chlann", OL: "Cé mhéad duine atá i do theaghlach? An bhfuil deartháireacha nó deirfiúracha agat?", HL: "An réitíonn tú go maith le do thuismitheoirí i gcónaí? Inis dom faoin duine is sine sa chlann." },
  { title: "3. An Scoil", OL: "Cén t-ábhar is fearr leat? An maith leat an éide scoile?", HL: "Déan cur síos ar na háiseanna sa scoil seo. Cad a dhéanfá chun an scoil a fheabhsú?" },
  { title: "4. Caitheamh Aimsire", OL: "Cad a dhéanann tú ag an deireadh seachtaine? An imríonn tú spórt?", HL: "Cén tábhacht a bhaineann leis an spórt do dhaoine óga? An bhfuil an iomarca brú ar dhaoine óga?" },
  { title: "5. Mo Cheantar", OL: "Cá bhfuil tú i do chónaí? An bhfuil pictiúrlann nó páirc in aice láimhe?", HL: "Déan cur síos ar d’áit chónaithe. Cad iad na fadhbanna sóisialta atá i do cheantar féin?" },
  { title: "6. Laethanta Saoire", OL: "Cá ndeachaigh tú ar laethanta saoire anuraidh? Ar thaitin an bia leat?", HL: "An fearr leat laethanta saoire in Éirinn nó thar lear? Dá mbuafá an Crannchur Náisiúnta, cá rachfá?" },
  { title: "7. Obair Bhaile", OL: "Cé mhéad ama a chaitheann tú ar obair bhaile gach oíche?", HL: "An gceapann tú go bhfuil an córas pointí san Ardteist cothrom? Cad é do thuairim faoin mbrú scoile?" },
  { title: "8. An Ghaeltacht", OL: "An raibh tú riamh sa Ghaeltacht? Ar fhan tú i dteach an choláiste?", HL: "Cad é do thuairim faoi staid na Gaeilge? Cad is féidir linn a dhéanamh chun an teanga a chur chun cinn?" },
  { title: "9. Fadhbanna Sóisialta", OL: "Cad iad na fadhbanna atá ag déagóirí? (Alcól, drugaí, bulaíocht)", HL: "Tá fadhb na tithíochta agus na dtimpeallachta go dona. Cad a dhéanfadh an rialtas dá mbeadh an t-airgead acu?" },
  { title: "10. An Todhchaí", OL: "Cad a dhéanfaidh tú tar éis na scoile? An rachaidh tú go dtí an coláiste?", HL: "Cén post ba mhaith leat a fháil sa todhchaí agus cén fáth? An rachaidh tú ar imirce, dar leat?" },
  { title: "11. An Aimsir", OL: "Cén sort aimsire atá againn inniu? An maith leat an samhradh?", HL: "Is breá leis na Gaeil a bheith ag caint faoin aimsir. Cad é do thuairim faoin athrú aeráide agus téamh domhanda?" },
  { title: "12. Obair Pháirtaimseartha", OL: "An bhfuil post páirtaimseartha agat? An bhfaigheann tú airgead póca?", HL: "An bhfuil sé deacair staidéar agus obair a dhéanamh ag an am céanna? Cad iad na buntáistí a bhaineann le post a bheith agat?" },
  { title: "13. Sláinte", OL: "Cad a itheann tú don lón de ghnáth? An bhfuil tú sláintiúil?", HL: "An gceapann tú go bhfuil fadhb an otrachta in Éirinn? Cén fáth a bhfuil bia mear chomh coitianta?" },
  { title: "14. Teicneolaíocht", OL: "An bhfuil fón póca agat? Cén aip is fearr leat?", HL: "An bhfuilimid ró-spleách ar an teicneolaíocht? Pléigh an tionchar atá ag na meáin shóisialta." },
  { title: "15. Ceol & Féilte", OL: "An maith leat ceol? An raibh tú ag ceolchoirm riamh?", HL: "Is tír chultúrtha í Éire. An bhfuil suim agat i gceol Gaelach nó i bhféilte mar Electric Picnic?" }
];

const PAST_Q = ["Cad a rinne tú an deireadh seachtaine seo caite?", "Cá ndeachaigh tú an samhradh seo caite?", "Cad a rinne tú inné tar éis na scoile?"];
const FUT_Q = ["Cad a dhéanfaidh tú an deireadh seachtaine seo chugainn?", "Cad a dhéanfaidh tú an samhradh seo chugainn?", "Cad iad na pleananna atá agat don bhliain seo chugainn?"];

function setLevel(lvl) { 
    currentLevel = lvl; 
    document.getElementById('btnOL').className = lvl === 'OL' ? 'level-btn active' : 'level-btn'; 
    document.getElementById('btnHL').className = lvl === 'HL' ? 'level-btn hl active' : 'level-btn'; 
    if(currentTopic && !isMockExam) updateQuestion(); 
}
// ===========================================
// LÓGICA DE SRAITH PICTIÚR
// ===========================================
let currentSraithTitle = "";

const SRAITH_TITLES = [
  "Sraith 1: An Timpiste (The Accident)",
  "Sraith 2: Staidéar vs Caitheamh Aimsire (Study vs Hobbies)",
  "Sraith 3: Gadaíocht ar an Traein (Theft on the train)",
  "Sraith 4: Cluiche Ceannais na hÉireann (All Ireland Final)",
  "Sraith 5: Drochaimsir / Tuilte (Bad Weather / Floods)",
  "Sraith 6: Ceolchoirm / Ticéid (The Concert)",
  "Sraith 7: An Tionscadal Scoile (School Project)",
  "Sraith 8: Cúrsa Gaeilge sa Ghaeltacht (Gaeltacht Course)",
  "Sraith 9: Obair Bhaile vs Glanadh (Homework vs Cleaning)",
  "Sraith 10: Saoire sa Spáinn (Holiday in Spain)",
  "Sraith 11: Ag Campáil / An Phicnic (Camping/Picnic)",
  "Sraith 12: An tAgallamh Poist (Job Interview)",
  "Sraith 13: Fadhbanna leis an bhFón (Phone Problems)",
  "Sraith 14: An Cóisir / Breithlá (The Party/Birthday)",
  "Sraith 15: Tinneas / An tOspidéal (Illness/Hospital)",
  "Sraith 16: Madra ar Strae (Lost Dog)",
  "Sraith 17: Ag cailleadh an bhus (Missing the bus)",
  "Sraith 18: An Bhialann / Bia Míshláintiúil (Restaurant)",
  "Sraith 19: Glanadh na hÁite (Cleaning up the area)",
  "Sraith 20: Robáil sa Bhanc (Bank Robbery)"
];

// Actualizar la función switchTab para incluir la nueva pestaña
function switchTab(tab) {
  document.getElementById('tabConv').className = tab === 'conv' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabPoem').className = tab === 'poem' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabSraith').className = tab === 'sraith' ? 'tab-btn active' : 'tab-btn';
  
  document.getElementById('sectionConversation').style.display = tab === 'conv' ? 'block' : 'none';
  document.getElementById('sectionPoetry').style.display = tab === 'poem' ? 'block' : 'none';
  document.getElementById('sectionSraith').style.display = tab === 'sraith' ? 'block' : 'none';
}

function selectSraith(index, btn) {
    // Quitar active de los otros botones sraith (reusamos la clase poem-btn para diseño rápido)
    document.querySelectorAll('#sectionSraith .poem-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    currentSraithTitle = SRAITH_TITLES[index];
    document.getElementById('sraithArea').style.display = 'block';
    document.getElementById('resultSraith').style.display = 'none';
    document.getElementById('sraithTitle').innerText = currentSraithTitle;
    document.getElementById('userInputSraith').value = "";
}

function speakSraith() {
    const text = "Inis dom an scéal. Cad atá ag tarlú sna pictiúir?";
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        const irishVoice = voices.find(voice => voice.lang.includes('ga') || voice.name.includes('Gaeilge'));
        if (irishVoice) {
            const u = new SpeechSynthesisUtterance(text);
            u.voice = irishVoice; u.lang = 'ga-IE'; u.rate = 0.9;
            window.speechSynthesis.speak(u);
        } else {
            alert("No Irish voice found / Níor aimsíodh guth Gaeilge.");
        }
    }
}

async function analyzeSraith() {
  const t = document.getElementById('userInputSraith').value;
  if(t.length < 5) return alert("Scríobh níos mó le do thoil.");
  
  const b = document.getElementById('btnActionSraith'); 
  b.disabled = true; b.innerText = "⏳ Ag ceartú...";

  const prompt = `
    ACT AS: Sympathetic Leaving Cert Irish Examiner.
    TASK: The student is describing a Picture Series (Sraith Pictiúr): "${currentSraithTitle}".
    STUDENT INPUT: "${t}"
    
    INSTRUCTIONS:
    1. Check if the Irish grammar and vocabulary are correct for describing this story.
    2. Ignore spelling mistakes if phonetically close.
    3. Be encouraging.
    
    OUTPUT JSON ONLY:
    { "score": (0-100), "feedback_ga": "Feedback in Irish", "feedback_en": "Feedback in English", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
  `;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('sraithArea').style.display = 'none'; 
    document.getElementById('resultSraith').style.display = 'block';
    
    document.getElementById('userResponseTextSraith').innerText = t;
    document.getElementById('scoreDisplaySraith').innerText = `Scór: ${j.score}%`;
    document.getElementById('scoreDisplaySraith').style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");
    document.getElementById('fbGASraith').innerText = "🇮🇪 " + j.feedback_ga; 
    document.getElementById('fbENSraith').innerText = "🇬🇧 " + j.feedback_en;
    document.getElementById('errorsListSraith').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (${e.explanation_en})</div>`).join('') || "✅ Ar fheabhas!";

  } catch (e) { console.error(e); alert("Error."); } finally { b.disabled = false; b.innerText = "✨ Evaluate / Ceartaigh"; }
}

function resetSraith() {
    document.getElementById('resultSraith').style.display = 'none';
    document.getElementById('sraithArea').style.display = 'block';
    document.getElementById('userInputSraith').value = "";
}
function initConv() { 
    const g = document.getElementById('topicGrid'); 
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

function speakText() {
    let textToRead = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        // Intentar encontrar voz irlandesa
        const irishVoice = voices.find(voice => voice.lang.includes('ga') || voice.name.includes('Gaeilge'));

        if (irishVoice) {
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.voice = irishVoice;
            utterance.lang = 'ga-IE';
            utterance.rate = 0.9; 
            window.speechSynthesis.speak(utterance);
        } else {
            // SI NO HAY VOZ, AVISO AL USUARIO
            alert("No Irish voice found on this device / Níor aimsíodh guth Gaeilge ar an ngléas seo.");
        }
    }
}

// === LÓGICA DEL MOCK EXAM ===
function startMockExam() { 
    isMockExam = true; 
    mockIndex = 0; 
    document.querySelectorAll('.topic-btn').forEach(x => x.classList.remove('active')); 
    
    let i = [...Array(DATA.length).keys()].sort(() => Math.random() - 0.5); 
    mockQuestions = [
        DATA[i[0]][currentLevel],
        DATA[i[1]][currentLevel],
        DATA[i[2]][currentLevel],
        PAST_Q[Math.floor(Math.random()*PAST_Q.length)],
        FUT_Q[Math.floor(Math.random()*FUT_Q.length)]
    ];
    showMockQuestion();
}

function showMockQuestion() {
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = `<strong>Ceist ${mockIndex + 1}/5:</strong><br><br>${mockQuestions[mockIndex]}`;
    document.getElementById('userInput').value = "";
}

function nextMockQuestion() { mockIndex++; showMockQuestion(); }

function updateQuestion() { 
    document.getElementById('exerciseArea').style.display = 'block'; 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('qDisplay').innerHTML = currentTopic[currentLevel]; 
}

function resetApp() { 
    document.getElementById('result').style.display = 'none'; 
    document.getElementById('exerciseArea').style.display = 'block'; 
    if(isMockExam) {
        isMockExam = false;
        document.getElementById('userInput').value = "";
        document.getElementById('qDisplay').innerHTML = "Select a topic above to start.";
    } else {
        document.getElementById('userInput').value = "";
    }
}

async function analyze() {
  const t = document.getElementById('userInput').value; 
  if(t.length < 3) return alert("Scríobh freagra le do thoil.");
  
  const b = document.getElementById('btnAction'); 
  b.disabled = true; 
  b.innerText = "⏳ Ag ceartú...";

  const questionContext = isMockExam ? mockQuestions[mockIndex] : currentTopic[currentLevel];

  const prompt = `
    ACT AS: Sympathetic Leaving Cert Irish Examiner (Gaeilge).
    CONTEXT: The input is RAW VOICE TRANSCRIPTION or TYPED TEXT. IGNORE lack of punctuation.
    QUESTION ASKED: "${questionContext}"
    LEVEL: ${currentLevel}.
    TASK: Evaluate the student's answer: "${t}".
    OUTPUT JSON ONLY: { "score": (0-100), "feedback_ga": "Irish feedback", "feedback_en": "English explanation", "errors": [{ "original": "x", "correction": "y", "explanation_en": "z" }] }
  `;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const d = await r.json(); 
    const j = JSON.parse(d.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
    
    document.getElementById('exerciseArea').style.display = 'none'; 
    document.getElementById('result').style.display = 'block';
    document.getElementById('userResponseText').innerText = t;
    
    const s = document.getElementById('scoreDisplay');
    s.innerText = `Scór: ${j.score}%`;
    s.style.color = j.score >= 85 ? "#166534" : (j.score >= 50 ? "#ca8a04" : "#991b1b");

    document.getElementById('fbGA').innerText = "🇮🇪 " + j.feedback_ga; 
    document.getElementById('fbEN').innerText = "🇬🇧 " + j.feedback_en;
    
    document.getElementById('errorsList').innerHTML = j.errors?.map(e => `<div class="error-item"><span style="text-decoration: line-through;">${e.original}</span> ➡️ <b>${e.correction}</b> (💡 ${e.explanation_en})</div>`).join('') || "<div style='color:#166534; font-weight:bold;'>✅ Ar fheabhas!</div>";

    const btnReset = document.getElementById('btnReset');
    if (isMockExam && mockIndex < 4) {
        btnReset.innerText = "➡️ Next Question / An Chéad Cheist Eile";
        btnReset.onclick = nextMockQuestion; 
    } else {
        btnReset.innerText = "🔄 Try another topic";
        btnReset.onclick = resetApp;
    }

  } catch (e) { console.error(e); alert("Error communicating with AI."); } finally { b.disabled = false; b.innerText = "✨ Evaluate / Ceartaigh"; }
}

// ===========================================
// DATOS DE POESÍA (LOS 5 CLÁSICOS + INÍON)
// ===========================================
const POEMS = [
  {
    title: "Géibheann (Caitlín Maude)",
    text: `Ainmhí mé\nainmhí allta\nas na teochreasa\na bhfuil clú agus cáil\nar mo scéimh\nchroithfinn crainnte na coille\ntráth\nle mo gháir\nach anois\nluím síos\nagus breathnaím trí leathshúil\nar an gcrann aonraic sin thall\ntagann na céadta daoine\nchuile lá\na dhéanfadh rud ar bith\ndom\nach mé a ligean amach`
  },
  {
    title: "Colscaradh (Pádraig Mac Suibhne)",
    text: `Shantaigh sé bean\ni nead a chine,\nfaoiseamh is gean\nar leac a thine,\naiteas is greann\ni dtógáil clainne.\n\nShantaigh sí fear\nis taobh den bhríste,\ndídean is searc\nis leath den chíste,\nsaoire thar lear\nis meas na mílte.\n\nThángthas ar réiteach.\nScaradar.`
  },
  {
    title: "Mo Ghrá-sa (idir lúibíní) (Nuala Ní Dhomhnaill)",
    text: `Níl mo ghrá-sa\nmar bhláth na n-airní\na bhíonn i ngairdín\n(nó ar chrann ar bith).\n\nIs má tá aon ghaol aige\nle nóiníní\nis as a chluasa a fhásfaidh siad\n(nuair a bheidh sé ocht dtroigh síos).\n\nNí haon ghlaise cheolmhar\niad a shúile\n(táid róchóngarach dá chéile\nar an gcéad dul síos).\n\nIs más slim é síoda\ntá ribí a ghruaige\n(mar bhean dhubh Shakespeare)\nina wire deilgní.\n\nAch is cuma sin.\nTugann sé dom úlla\n(is nuair a bhíonn sé i ndea-ghiúmar\ncaora fíniúna).`
  },
  {
    title: "An tEarrach Thiar (Máirtín Ó Direáin)",
    text: `Fear ag glanadh cré\nde ghimseán spáide\nsa gciúnas séimh\ni mbrothall lae:\nBinn an fhuaim\nsan Earrach thiar.\n\nFear ag caitheamh\ncliabh dhá dhroim\nis an fheamainn dhearg\nag lonrú\ni dtaitneamh gréine\nar dhuirling bhán:\nNiamhrach an radharc\nsan Earrach thiar.\n\nFear i ndiaidh\ncliabh aar a dhroim\nsa gciúnas séimh\nis an fheamainn dhearg\nag lonrú\ni dtaitneamh gréine\nar dhuirling bhán.`
  },
  {
    title: "An Spailpín Fánach (Anaithnid)",
    text: `Is spailpín fánach atáim\nLe fada ag siúl na drúchta,\nAgus ní bhfaighinn i gCorcaigh\nAon fháilte ná i gCluain Meala.\n\nMo léan is mo chrá\nMar a d'imigh mo shláinte\nIs nach bhfuair mé bás\nSula ndearnadh spailpín díom.\n\nAg dul go Caiseal dom\nba chráite an turas é,\ngach bodaire leath-mhagadh\nfúm is a shúile ar leathadh aige.\n\nGo deo deo arís\nní rachad go Caiseal\nag díol ná ag reic mo shláinte\nar mhargadh na saoire.`
  },
  {
    title: "Iníon (Áine Durkin)",
    text: `'Níl clue a'd, Mom!' a dúirt tú liom\n's tú ag iompú uaim le fearg,\ntá deora i do shúile anois\nag do ráiteas gontach searbh.\n\nBhí mise freisin i d'aois tráth\ni mo dhéagóir meidhreach cool,\na cheap gur óinseach cheart an bhean\na chuir cosa i dtaca romham.\n\nAnois tuigim ciall na máthar sin\nagus iníon óg agam féin,\nis déanaim mar a mhol sí dom\nlena comhairle láidir thréan.\n\nIs ceapann tú go dteipim ort\nbhuel, tuigim duit, a chroí,\nach níl aon lá nár mhéadaigh mo ghrá\nó tháinig tú i mo shaol.`
  }
];

function selectPoem(index, btn) {
    document.querySelectorAll('.poem-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.getElementById('poemArea').style.display = 'block';
    document.getElementById('poemText').innerHTML = `<strong>${POEMS[index].title}</strong><br><br>${POEMS[index].text}`;
    
    const audio = document.getElementById('poemAudio');
    const source = document.getElementById('audioSource');
    
    // Archivos: Poem1.mp3, Poem2.mp3, etc.
    source.src = `Poem${index + 1}.mp3`; 
    audio.load();
}

// Inicializar botones de conversación
initConv();
