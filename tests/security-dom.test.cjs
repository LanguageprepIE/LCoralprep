const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const JSDOM=process.env.LCORALS_JSDOM_PATH?require(process.env.LCORALS_JSDOM_PATH).JSDOM:null;
const payload='<img src="x" onerror="window.__xss=1">\n<script>window.__xss=2</script><svg onload="window.__xss=3"></svg>';
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function fixture(lang){
 const dom=new JSDOM(read(`${lang}/index.html`).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''),{runScripts:'dangerously',url:`https://fixture.invalid/${lang}/`,pretendToBeVisual:true});
 const w=dom.window,d=w.document,errors=[];
 dom.virtualConsole.on('jsdomError',e=>errors.push(String(e)));
 w.__xss=0;w.alert=s=>errors.push('alert: '+s);w.console.error=(...a)=>errors.push(a.map(String).join(' '));
 w.fetch=()=>{throw Error('NETWORK DISABLED');};w.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;},set(v){this.textContent=v;}});
 w.HTMLElement.prototype.getClientRects=function(){for(let e=this;e;e=e.parentElement)if(e.hidden||e.style.display==='none')return [];return [{}];};
 Object.defineProperty(w,'speechSynthesis',{value:{cancel(){},getVoices:()=>[],speak(){}}});
 w.eval(read('security.js')+'\n'+read('oral-scoring.js')+'\n'+read(`${lang}/script.js`)+'\n'+read('accessibility.js'));
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));await tick();
 return {w,d,errors,close:()=>w.close()};
}
function clean(f,element){
 assert.ok(element);assert.equal(element.querySelectorAll('img,script,svg,iframe,object').length,0);
 assert.equal(f.w.__xss,0);assert.ok(element.textContent.includes('<img'),element.textContent);
}
const feedback=(lang,score=90)=>({band:'excellent',score,feedback_ga:payload,feedback_en:'Line one\n'+payload,feedback_native:payload,feedback_de:payload,feedback_fr:payload,feedback_it:payload,
 errors:[{original:payload,correction:payload+' safe',explanation_en:'A genuine conjugation correction. '+payload,explanation_native:payload}]});

test('XSS: DE/EAL student roleplay replies remain literal text with line breaks', {skip:!JSDOM},async()=>{
 for(const lang of ['de','eal']){
  const f=await fixture(lang);try{
   const button=f.d.querySelector('#sectionRoleplay .rp-btn-select');f.w.seleccionarRP(1,button);
   f.w.habilitarInput();f.d.querySelector('#rpInput').value=payload;f.w.enviarRespuestaRP();
   clean(f,f.d.querySelector('#rpChat'));assert.ok(f.d.querySelector('.bubble.st').textContent.includes('\n'));
  }finally{f.close();}
 }
});

test('XSS: Irish conversation and Sraith AI corrections and EAL feedback are escaped', {skip:!JSDOM},async()=>{
 for(const lang of ['ga','eal']){
  const f=await fixture(lang);try{
   f.d.querySelector('#topicGrid button').click();f.d.querySelector('#userInput').value=payload;
   f.w.callSmartAI=async()=>JSON.stringify(feedback(lang));await f.w.analyze();
   clean(f,f.d.querySelector('#errorsList'));
   if(lang==='eal')clean(f,f.d.querySelector('#fbNative'));
   if(lang==='ga'){
    f.w.selectSraith(0,f.d.querySelector('#sraithSelector button'));f.d.querySelector('#userInputSraith').value=payload;
    await f.w.analyzeSraith();clean(f,f.d.querySelector('#errorsListSraith'));
   }
   assert.deepEqual(f.errors,[]);
  }finally{f.close();}
 }
});

test('XSS: French document and German/Italian picture corrections render without active markup', {skip:!JSDOM},async()=>{
 for(const lang of ['fr','de','it']){
  const f=await fixture(lang);try{
   if(lang==='fr'){
    f.w.setDocType('Sport');f.d.querySelector('#docDescription').value='Fictional photo';
    f.w.callSmartAI=async()=>'Question one?';await f.w.generateDocQuestions();f.d.querySelector('#userInputDoc').value=payload;
    const data=feedback(lang);for(const [key,score]of [['communication',30],['structures',30],['vocabulary',20]])data[key]={band:'excellent',score};
    f.w.callSmartAI=async()=>JSON.stringify(data);await f.w.analyzeDoc();clean(f,f.d.querySelector('#errorsListDoc'));
   }else{
    f.w.selectStory(0,f.d.querySelector('#sectionStory .rp-btn-select'));f.d.querySelector('#userInputStory').value=payload;
    f.w.callSmartAI=async()=>JSON.stringify(feedback(lang,lang==='de'?30:25));await f.w.analyzeStory();clean(f,f.d.querySelector('#errorsListStory'));
   }
   assert.deepEqual(f.errors,[]);
  }finally{f.close();}
 }
});

test('XSS: GA/EAL study help preserves necessary formatting but never adopts attributes or executable tags', {skip:!JSDOM},async()=>{
 for(const lang of ['ga','eal']){
  const f=await fixture(lang);try{
   f.d.querySelector('#topicGrid button').click();f.w.setMode('study');
   if(lang==='eal'){f.d.querySelector('#nativeLang').value='Spanish';f.w.updateInterfaceLang();}
   f.w.callSmartAI=async()=>'<p onclick="window.__xss=4"><b>Explanation:</b> A &amp; B\nSecond line</p><ul><li>Useful example</li></ul>'+payload;
   await f.w.askAIConcept('Synthetic concept '+payload);
   const box=f.d.querySelector('#aiExplanationBox');clean(f,box);
   assert.equal(box.querySelector('.safe-study-output b').textContent,'Explanation:');
   assert.equal(box.querySelector('.safe-study-output li').textContent,'Useful example');
   assert.equal(box.querySelector('.safe-study-output [onclick]'),null);
   assert.ok(box.querySelector('.safe-study-output').textContent.includes('A & B\nSecond line'));
   // Disallowed markup is shown literally, never removed as if it were feedback.
   assert.ok(box.textContent.includes('<script>'));
   assert.deepEqual(f.errors,[]);
  }finally{f.close();}
 }
});

test('malformed AI JSON cannot hide a legacy answer or manufacture a zero mark', {skip:!JSDOM},async()=>{
 for(const lang of ['es','ga','eal']){
  const f=await fixture(lang);try{
   f.d.querySelector('#topicGrid button').click();const input=f.d.querySelector('#userInput');input.value='A legitimate long student response.';
   for(const data of ['null','[]','{}','{"score":"90","errors":[],"feedback_en":"incomplete"}','{"score":90,"errors":"bad"}']){
    f.w.callSmartAI=async()=>data;await f.w.analyze();
    assert.equal(input.value,'A legitimate long student response.');assert.notEqual(f.d.querySelector('#exerciseArea').style.display,'none');
    assert.equal(f.d.querySelector('#btnAction').disabled,false);assert.equal(f.d.querySelector('#scoreDisplay').textContent,'');
   }
  }finally{f.close();}
 }
});
