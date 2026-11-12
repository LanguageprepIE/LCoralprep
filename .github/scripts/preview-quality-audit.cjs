'use strict';
// Fictional student answers only. This is an exploratory pedagogical audit, not a
// validated benchmark of official SEC marks. Results are intentionally logged
// for human inspection; no user or student data is included.
const fs=require('node:fs'),vm=require('node:vm');
const c={};vm.runInNewContext(fs.readFileSync('oral-scoring.js','utf8')+'\nthis.oral=LCOralScoring;',c);
const scoring=c.oral;
const cases=[
 {id:'es_hl_strong',lang:'es',tier:'strong',q:'¿Qué planes tienes después del Leaving Certificate?',a:'Cuando termine los exámenes, me gustaría estudiar ingeniería porque me interesa la tecnología desde pequeño. Sin embargo, antes de empezar la universidad, quiero trabajar durante el verano para ahorrar dinero. Si tengo la oportunidad, también viajaré a Italia, donde vive una amiga, y así podré mejorar mi italiano. Aunque sé que la carrera será exigente, tengo muchas ganas de comenzar esta nueva etapa.'},
 {id:'es_hl_weak',lang:'es',tier:'weak',q:'¿Qué planes tienes después del Leaving Certificate?',a:'Yo estudiar ingeniería. Yo no gusta escuela. Después examen yo trabajar y yo ir Italia porque yo gusta. No sé.'},
 {id:'fr_control_weak',lang:'fr',tier:'weak',q:'Parlez-moi de votre famille et de vos loisirs.',a:'Moi avoir deux soeur. Nous habiter à Dublin. Je jouer foot samedi et ma mère travailler école. Nous être content.'},
 {id:'pl_gender_correct',lang:'pl',tier:'correct',q:'Co robiła Pani w zeszłą sobotę?',a:'W zeszłą sobotę poszłam do kina z koleżankami. Potem wróciłam do domu i przeczytałam książkę, ponieważ chciałam odpocząć.'}
];
const bands={1:[65,70],2:[55,60],3:[45,50],4:[30,40],5:[20,25],6:[10,15],7:[0,5]};
function prompt(t){
if(t.lang==='es') return `ROLE: You are a fair Leaving Certificate Higher Level Spanish oral teacher in Ireland. Evaluate a transcript-based practice answer to a single question, with no evidence of accent, fluency or pronunciation. Band-first calibrated conversation /70. Bands and available marks: 1 excellent autonomous effective developed response 65-70 (minor slips permitted); 2 effective competent 55-60; 3 competent adequate 45-50; 4 adequate limited 30-40; 5 limited deficient 20-25; 6 minimal 10-15; 7 non-performing 0-5. Do not award gap values. Do not demand subjunctives, fancy idioms, C1/C2, extra tenses or invented detail. Correct only clear genuine errors; do not invent corrections for natural Spanish. Do not penalise absent punctuation from dictation. Explain material limitations and ensure mark matches feedback. Question: ${JSON.stringify(t.q)}. Learner transcription: ${JSON.stringify(t.a)}. Return ONLY JSON: {"band":1,"score":0,"feedback_es":"...","feedback_en":"...","strengths":[{"es":"...","en":"..."}],"next_steps":[{"es":"...","en":"..."}],"connectors":[],"vocabulary_suggestions":[],"errors":[{"original":"...","correction":"...","explanation_en":"..."}]}. No markdown.`;
return `Act as a fair Leaving Certificate ${t.lang==='fr'?'French':'Polish'} oral examiner in Ireland. Question ${JSON.stringify(t.q)}. Student transcription ${JSON.stringify(t.a)}. Do not penalise speech-to-text punctuation, accent marks, pauses or imaginary pronunciation. Be specific and evidence-based, do not invent errors or infer gender. ${t.lang==='pl'?'Correct first-person feminine Polish forms (poszłam, wróciłam, przeczytałam) must not be changed into masculine forms. Feedback should avoid making assumptions about the learner’s gender.':''}\n${scoring.instructions(t.lang,'conversation')}\nReturn JSON ONLY: {${JSON.stringify(scoring.schema(t.lang,'conversation')).slice(1,-1)},"feedback_${t.lang}":"...","feedback_en":"...","strengths":["..."],"next_steps":["..."],"connectors":[],"vocabulary_suggestions":[],"errors":[{"original":"...","correction":"...","explanation_en":"..."}]}. Nothing outside JSON.`;
}
async function request(t) {
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),55000);
 try {
  const r=await fetch('https://deploy-preview-27--lcorals.netlify.app/.netlify/functions/gemini',
   {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt(t)}]}]}),signal:controller.signal});
  const d=await r.json();if(!r.ok)throw Error('HTTP_'+r.status+'_'+(d.error?.code||'unknown'));
  if(r.headers.get('x-lcorals-provider')!=='openai-luna')throw Error('PROVIDER_NOT_LUNA');
  const raw=d.candidates?.[0]?.content?.parts?.[0]?.text;
  if(typeof raw!=='string')throw Error('MISSING_TEXT');
  try{return JSON.parse(raw.replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,'').trim())}catch{throw Error('INVALID_JSON')}
 } finally {clearTimeout(timeout)}
}
(async()=>{
 let results=[],rateLimited=false;
 for(const [i,t] of cases.entries()){
  if(i) await new Promise(resolve=>setTimeout(resolve,35000));
  try{
   const j=await request(t);
   let score,band;
   if(t.lang==='es'){
    if(!Number.isInteger(j.band)||!Number.isInteger(j.score)||!bands[j.band]||j.score<bands[j.band][0]||j.score>bands[j.band][1])throw Error('INVALID_ES_BAND');
    score=j.score;band=j.band;
   }else{
    const v=scoring.read(t.lang,'conversation',j);
    score=v.score;band=j.band;
   }
   if(typeof j['feedback_'+t.lang]!=='string'||typeof j.feedback_en!=='string'||!Array.isArray(j.errors)||!Array.isArray(j.next_steps))throw Error('INVALID_FEEDBACK_FIELDS');
   const errors=j.errors.map(e=>({original:e.original,correction:e.correction,explanation_en:e.explanation_en})).slice(0,4);
   // Only fictional text is logged. This supports actual manual review, not just schema checks.
   const result={id:t.id,score,band,feedback:j['feedback_'+t.lang],feedback_en:j.feedback_en,next_steps:j.next_steps,errors};
   if(t.lang==='pl'&&/poszedłem|wróciłem|przeczytałem/i.test(JSON.stringify(result)))throw Error('FALSE_GENDER_CORRECTION');
   if(t.lang==='pl'&&errors.length>0)throw Error('FALSE_POLISH_ERROR');
   results.push(result);
   console.log('RESULT',JSON.stringify(result));
  }catch(e){
   console.log('CASE_ERROR',t.id,String(e.message||e).slice(0,140));
   if(/HTTP_429/.test(String(e.message||e))){rateLimited=true;break}
   results.push({id:t.id,error:String(e.message||e).slice(0,140)});
  }
 }
 const high=results.find(x=>x.id==='es_hl_strong'),low=results.find(x=>x.id==='es_hl_weak');
 const issues=[];
 if(high&&low&&typeof high.score==='number'&&typeof low.score==='number'&&high.score<=low.score+10)issues.push('ES_SCORE_INVERSION_OR_TOO_SMALL_GAP');
 if(rateLimited)issues.push('RATE_LIMIT_INTERRUPTED');
 if(results.length!==cases.length)issues.push('INCOMPLETE_TEST_CASES');
 if(results.some(x=>x.error))issues.push('CASE_ERROR');
 console.log('AUDIT_SUMMARY',JSON.stringify({completed:results.length,planned:cases.length,issues,relativeSpanishGap:high?.score-low?.score}));
 if(issues.length)process.exitCode=1;
})().catch(e=>{console.log('HARNESS_ERROR',e.message);process.exitCode=1});
