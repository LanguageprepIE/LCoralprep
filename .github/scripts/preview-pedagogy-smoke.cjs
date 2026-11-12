'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const scoringCode = fs.readFileSync('oral-scoring.js', 'utf8');
const ctx = {};
vm.runInNewContext(scoringCode + '\nthis.scoreContract = LCOralScoring;', ctx);
const score = ctx.scoreContract;
const url = 'https://deploy-preview-27--lcorals.netlify.app/.netlify/functions/gemini';
const tests = [
  { id:'es_hl_conversation',lang:'es',task:'conversation',question:'¿Qué planes tienes después del Leaving Certificate?',answer:'Cuando termine los exámenes, me gustaría estudiar ingeniería porque me interesa la tecnología. Además, quiero viajar por Europa para conocer otras culturas. Si consigo un trabajo de verano, ahorraré dinero para el viaje.' },
  { id:'fr_conversation',lang:'fr',task:'conversation',question:'Parlez-moi de votre famille et de vos loisirs.',answer:"Dans ma famille, nous sommes quatre. Je m'entends bien avec ma sœur parce qu'elle est gentille. Le weekend, je joue au foot avec mes amis."},
  { id:'de_conversation',lang:'de',task:'conversation',question:'Was machen Sie am Wochenende?',answer:'Am Samstag spiele ich Fußball mit meinen Freunden. Danach gehe ich ins Kino. Letztes Wochenende habe ich meine Großeltern besucht.'},
  { id:'it_conversation',lang:'it',task:'conversation',question:'Mi parli della Sua scuola.',answer:'La mia scuola è abbastanza grande e mi piacciono le lingue. Studio italiano perché vorrei lavorare all’estero in futuro. Tuttavia, la matematica è difficile per me.'},
  { id:'pl_conversation',lang:'pl',task:'conversation',question:'Proszę opowiedzieć o swojej rodzinie.',answer:'Mam dwie siostry i mieszkam z rodzicami. Lubię spędzać czas z rodziną, ponieważ razem gotujemy i oglądamy filmy. W zeszłą sobotę odwiedziliśmy babcię.'},
  { id:'de_full_mock',lang:'de',task:'mock',question:'Assess a complete oral: general conversation /40, picture/project /30 and roleplay /30.',answer:'Conversation: Ich wohne in Dublin und lerne Deutsch seit drei Jahren. Project: Mein Projekt handelt von Berlin, einer interessanten Stadt mit vielen Museen. Roleplay: Guten Tag, ich möchte ein Einzelzimmer für zwei Nächte buchen. Wie viel kostet das?'},
  { id:'pl_mock',lang:'pl',task:'mock',question:'Evaluate an integrated Polish LC oral mock without inventing subweights.',answer:'Conversation: Lubię uczyć się języków. Portfolio discussion: Przygotowałem projekt o polskich tradycjach. Wybrałem Wigilię, ponieważ moja rodzina obchodzi to święto co roku. Najbardziej lubię wspólną kolację.'}
];
const range = {1:[65,70],2:[55,60],3:[45,50],4:[30,40],5:[20,25],6:[10,15],7:[0,5]};
const requiredFeedback = (lang,task)=>task==='mock'&&lang==='de'?['summary_de','summary_en']:task==='mock'&&lang==='pl'?['feedback_pl','feedback_en']:[`feedback_${lang}`,'feedback_en'];
function promptFor(t) {
  if(t.lang==='es') return `You are a supportive but realistic Leaving Certificate Spanish Higher Level oral examiner in Ireland. Evaluate the following transcription only; never assess accent, speed, or pronunciation. First choose the appropriate band then score within its exact range: band 1=65-70, band 2=55-60, band 3=45-50, band 4=30-40, band 5=20-25, band 6=10-15, band 7=0-5. Do not fill gaps between bands. Do not demand idioms, subjunctive or C1 Spanish. Give only evidence-based corrections; never invent errors. Question: ${JSON.stringify(t.question)}. Learner transcription: ${JSON.stringify(t.answer)}. Return ONLY a JSON object with numeric integer band (1-7), numeric integer score (/70), feedback_es string, feedback_en string, strengths array of objects each with es/en strings, next_steps array of objects with es/en strings, connectors string array, vocabulary_suggestions array with basic/richer, errors array with original/correction/explanation_en. Do not reveal private information or include Markdown.`;
  const schema = JSON.stringify(score.schema(t.lang,t.task));
  const rules = score.instructions(t.lang,t.task);
  const extra=t.lang==='pl'?'Use gender-neutral, polite Polish for feedback; never infer student gender, do not correct grammatically valid first-person gendered forms.':'Use formal examiner address in German (Sie), French (vous) or Italian (Lei) as appropriate.';
  const feedback=requiredFeedback(t.lang,t.task);
  const extraFields=t.lang==='de'&&t.task==='mock'?',"strengths":[],"next_steps":[],"corrections":[]':',"strengths":[],"next_steps":[],"connectors":[],"vocabulary_suggestions":[],"errors":[]';
  return `You are a fair Leaving Certificate oral teacher in Ireland. Evaluate this ${t.task} transcript; do not invent pronunciation information. Use the actual LCorals scoring rules below. ${rules}\n${extra}\nTask: ${JSON.stringify(t.question)}\nLearner transcript: ${JSON.stringify(t.answer)}\nReturn valid JSON only. Schema template: {${schema.slice(1,-1)},${feedback.map(k=>JSON.stringify(k)+':"..."').join(',')}${extraFields}}. Concise feedback in the target language and English, based only on evidence; avoid invented errors. No Markdown.`;
}
async function send(text){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),55000);
 try {
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text}]}]}),signal:controller.signal});
  const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{throw Error('non_json_http_'+r.status)}
  if(!r.ok)throw Error(`HTTP_${r.status}_${data?.error?.code||'unknown'}`);
  if(r.headers.get('x-lcorals-provider')!=='openai-luna')throw Error('provider_header_not_luna');
  const textOut=data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if(typeof textOut!=='string')throw Error('gemini_compatible_response_missing');
  return textOut;
 }finally{clearTimeout(timer)}
}
async function main(){
const problems=[];let passed=0;for(const t of tests){
 try{
   const raw=await send(promptFor(t));
   let data;try{data=JSON.parse(raw.replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,'').trim())}catch{throw Error('invalid_model_json')}
   if(t.lang==='es'){
      if(!Number.isInteger(data.score)||!Number.isInteger(data.band)||!range[data.band]||data.score<range[data.band][0]||data.score>range[data.band][1])throw Error('spanish_band_mismatch');
   } else {
      const parts=score.schema(t.lang,t.task);
      for (const [key,value] of Object.entries(parts)){
       const item= typeof value==='object'?data[key]:data;
       if(!item || !['excellent','strong','competent','developing','basic','limited'].includes(item.band)||!Number.isInteger(item.score))throw Error('invalid_band_score_'+key);
      }
      try {score.read(t.lang,t.task,data)}catch(e){throw Error('real_scoring_validator_'+String(e.message).slice(0,80))}
   }
   for(const field of requiredFeedback(t.lang,t.task)){
      if(typeof data[field]!=='string'||!data[field].trim())throw Error('feedback_field_missing_'+field);
   }
   console.log('PASS',t.id,'mark',t.lang==='es'?data.score:typeof data.score==='number'?data.score:'components');
   passed++;
 }catch(e){const code=String(e.message||e).slice(0,140);console.log('FAIL',t.id,code);problems.push({id:t.id,error:code})}
}
console.log('SUMMARY',JSON.stringify({passed,total:tests.length,failures:problems}));
if(problems.length)process.exitCode=1;

}
main().catch(e=>{console.error('TEST_HARNESS_ERROR',e.message);process.exitCode=1;});
