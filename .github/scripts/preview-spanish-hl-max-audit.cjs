'use strict';
// Two controlled, synthetic HL oral evaluations using the ACTUAL Spanish
// front-end assessment prompt, rather than a simplified "award 70" prompt.
// No real student answers, no transcripts/credentials written to logs.
const fs=require('node:fs');
const {JSDOM}=require(process.env.LCORALS_JSDOM_PATH || 'jsdom');
const url='https://deploy-preview-27--lcorals.netlify.app/.netlify/functions/gemini';
const answer="El verano pasado fui de vacaciones a España con mi familia y pasamos dos semanas en Cádiz, una ciudad preciosa del sur del país. Nos alojamos en un apartamento cerca de la playa y, aunque hacía muchísimo calor, lo pasamos fenomenal. Por las mañanas solíamos ir a la playa para nadar y tomar el sol, mientras que por las tardes visitábamos diferentes pueblos y probábamos la comida típica de la región. Lo que más me gustó fue pasar tiempo con mi familia y desconectar de la rutina escolar. Sin embargo, un día llovió tanto que tuvimos que quedarnos en el apartamento, pero aprovechamos para ver una película juntos. El próximo verano me gustaría volver a España porque creo que es un país que tiene mucho que ofrecer. Si tuviera la oportunidad, también visitaría Granada, ya que siempre he querido conocer la Alhambra. En mi opinión, viajar es una de las mejores maneras de conocer otras culturas y aprender a ser más independiente.";
function read(path){return fs.readFileSync(path,'utf8')}
async function realPrompt(){
 const html=read('es/index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://fixture.invalid/es/',pretendToBeVisual:true});
 const w=dom.window;
 w.alert=()=>{};
 w.fetch=()=>{throw Error('NO NETWORK IN DOM FIXTURE')};
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(w.HTMLElement.prototype,'innerText',{configurable:true,get(){return this.textContent},set(v){this.textContent=v}});
 w.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 Object.defineProperty(w,'speechSynthesis',{value:{cancel(){},getVoices(){return[]},speak(){}}});
 w.Audio=class{play(){return Promise.resolve()}};
 w.eval(read('security.js')+'\n'+read('oral-scoring.js')+'\n'+read('es/script.js')+'\n'+read('accessibility.js'));
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 await new Promise(resolve=>setTimeout(resolve,30));
 const topics=[...w.document.querySelectorAll('#topicGrid button')];
 const vacations=topics.find(x=>/vacaciones/i.test(x.textContent));
 if(!vacations)throw Error('VACATIONS_TOPIC_NOT_FOUND');
 w.document.querySelector('#btnHL').click();
 vacations.click();
 const input=w.document.getElementById('userInput');
 if(!input || input.disabled)throw Error('INPUT_NOT_AVAILABLE');
 input.value=answer;
 let captured=null;
 w.callSmartAI=async prompt=>{
  captured=prompt;
  return JSON.stringify({band:1,score:70,feedback_es:'Respuesta excelente, pertinente y desarrollada.',feedback_en:'Excellent, relevant and developed answer.',errors:[],strengths:[],next_steps:[],connectors:[],vocabulary_suggestions:[]});
 };
 await w.analyze();
 dom.window.close();
 if(!captured||!captured.includes('LEVEL: HL')||!captured.includes('El verano pasado'))throw Error('PROMPT_CAPTURE_FAILED');
 return captured;
}
async function evaluate(prompt,index){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),65000);
 try{
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-LCorals-Age-Band':'18-plus'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]}),signal:abort.signal});
  const data=await r.json();
  const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if(!r.ok || !raw){console.log('HL_MAX_CASE',JSON.stringify({index,status:r.status,code:data?.error?.code||'NO_RESPONSE'}));return false}
  let result;try{result=JSON.parse(raw.replace(/\x60{3}json|\x60{3}/g,'').trim())}catch{
    console.log('HL_MAX_CASE',JSON.stringify({index,status:r.status,parse:'invalid_json'}));return false;
  }
  const valid=Number.isInteger(result.score)&&result.score>=0&&result.score<=70&&result.band===1&&result.score>=65;
  console.log('HL_MAX_CASE',JSON.stringify({index,status:r.status,provider:r.headers.get('x-lcorals-provider'),score:result.score,band:result.band,valid,feedback_es:String(result.feedback_es||'').slice(0,520),next_steps:(result.next_steps||[]).slice(0,2)}));
  return valid;
 }catch(e){console.log('HL_MAX_ERROR',JSON.stringify({index,error:String(e.message||e).slice(0,130)}));return false}
 finally{clearTimeout(timer)}
}
(async()=>{
 const prompt=await realPrompt();
 console.log('HL_MAX_FIXTURE',JSON.stringify({actualFrontendPrompt:true,topic:'Vacaciones',level:'HL',answerChars:answer.length,promptChars:prompt.length,actualPromptIncludesNewCalibration:prompt.includes('LEVEL REFERENCE (not a formal exam-to-CEFR equivalence)')}));
 let valid=0;for(let index=1;index<=2;index++){if(index===2)await new Promise(r=>setTimeout(r,13000));if(await evaluate(prompt,index))valid++}
 console.log('HL_MAX_SUMMARY',JSON.stringify({valid,attempts:2}));
 if(valid!==2)process.exitCode=1;
})().catch(e=>{console.error('HL_MAX_HARNESS_ERROR',String(e.message||e).slice(0,200));process.exitCode=1});
