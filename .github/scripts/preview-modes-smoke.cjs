'use strict';
// Four fixed, fictional cases. Never print student text or model feedback to CI logs.
const url='https://deploy-preview-27--lcorals.netlify.app/.netlify/functions/gemini';
const cases=[
{id:'es_study',type:'study-es',prompt:`Act as a supportive Spanish oral tutor for Irish Leaving Certificate Higher Level Study Mode. Learner needs ideas to answer: "¿Qué harás después del instituto?" Explain in English, with feasible spoken Spanish examples. Do not demand advanced constructions, memorized idioms, or all suggested points. Return valid JSON only, exactly this schema: {"explanation_en":"maximum 70 words","speaking_plan":["up to 3 short steps"],"examples":[{"es":"short natural Spanish phrase","en":"English meaning"}],"challenge":"one optional sentence challenge"}.`},
{id:'de_study',type:'study-de',prompt:`Act as a German Leaving Certificate oral tutor. Help a learner prepare "Was machen Sie in Ihrer Freizeit?" Use formal Sie in examiner-style questions. No mandatory checklist. Keep German examples short, correct and useful, with English explanations. Return valid JSON only: {"explanation_en":"...","speaking_plan":["..."],"examples":[{"target":"...","en":"..."}],"optional_challenge":"..."}.`},
{id:'es_roleplay',type:'roleplay',prompt:`ACT AS: A fair Leaving Certificate Spanish oral examiner in Ireland. Evaluate this completed fictional role play (5 candidate turns, each worth 0-6 points, /30 total). CONTEXT: A student phones a university about accommodation. The 5 candidate instructions and responses are: 1 Introduce yourself and explain reason for call: "Hola, soy estudiante de Irlanda y busco alojamiento para el curso." 2 Say where you prefer to live: "Prefiero vivir cerca de la universidad porque no tengo coche." 3 Explain why: "Así puedo ir andando a clase y ahorrar dinero." 4 Ask about prices: "¿Cuánto cuesta una habitación por mes?" 5 Thank the adviser: "Muchas gracias por su ayuda. Hasta luego." Reward relevant comprehensible task completion. Ignore punctuation and pronunciation; never invent errors. Return ONLY valid JSON with exactly five turns: {"total_score":0,"overall_es":"...","overall_en":"...","turns":[{"turn":1,"score":0,"feedback_es":"...","feedback_en":"...","missing":"...","errors":[],"improved_answer":"..."}]}. Each turn score integer 0-6 and total must equal their sum. No markdown.`},
{id:'pl_gender',type:'polish',prompt:`You are a Polish oral practice tutor for an Irish Leaving Certificate learner. Student's written/transcribed answer: "W zeszłą sobotę poszłam do kina z koleżankami. Potem wróciłam do domu." This answer correctly uses feminine first-person past-tense forms. Give supportive feedback in Polish, in polite gender-neutral impersonal form; do NOT invent a grammar error or suggest changing "poszłam" to "poszedłem" or "wróciłam" to "wróciłem". Return valid JSON only: {"feedback_pl":"...","feedback_en":"...","errors":[{"original":"...","correction":"...","explanation_en":"..."}],"strengths":["..."]}. Use empty errors array if there are no real errors.`}
];
async function run(c){
const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),55000);
try{
const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:c.prompt}]}]}),signal:ctrl.signal});
const body=await r.json();if(!r.ok)throw Error('HTTP_'+r.status+'_'+(body?.error?.code||'unknown'));
if(r.headers.get('x-lcorals-provider')!=='openai-luna')throw Error('wrong-provider');
const raw=body?.candidates?.[0]?.content?.parts?.[0]?.text;
if(typeof raw!=='string')throw Error('missing-model-text');
let j;try{j=JSON.parse(raw.replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,'').trim())}catch{throw Error('invalid-JSON')}
if(c.type.startsWith('study')){
if(typeof j.explanation_en!=='string'||!Array.isArray(j.speaking_plan)||!Array.isArray(j.examples)||!j.examples.length)throw Error('study-format');
const field=c.type==='study-es'?'es':'target';if(j.examples.some(e=>typeof e[field]!=='string'||typeof e.en!=='string'))throw Error('study-examples');
}else if(c.type==='roleplay'){
if(!Array.isArray(j.turns)||j.turns.length!==5||!Number.isInteger(j.total_score))throw Error('roleplay-shape');
let sum=0;for(let i=0;i<5;i++){const t=j.turns[i];if(t.turn!==i+1||!Number.isInteger(t.score)||t.score<0||t.score>6||typeof t.feedback_es!=='string')throw Error('roleplay-turn');sum+=t.score}
if(j.total_score!==sum)throw Error('roleplay-total-mismatch');
}else if(c.type==='polish'){
if(typeof j.feedback_pl!=='string'||typeof j.feedback_en!=='string'||!Array.isArray(j.errors))throw Error('polish-format');
const combined=JSON.stringify(j).toLowerCase();
if(/poszedłem|wróciłem/.test(combined))throw Error('polish-invented-gender-correction');
if(j.errors.length)throw Error('polish-invented-errors');
}
return 'PASS';
}finally{clearTimeout(timer)}
}
(async()=>{const fails=[];for(const [index,c] of cases.entries()){if(index) await new Promise(resolve=>setTimeout(resolve,18000));try{console.log('PASS',c.id,await run(c))}catch(e){console.log('FAIL',c.id,String(e.message||e).slice(0,100));fails.push(c.id)}}console.log('SUMMARY',JSON.stringify({passed:cases.length-fails.length,total:cases.length,failedIds:fails}));if(fails.length)process.exitCode=1})().catch(e=>{console.log('HARNESS-ERROR',e.message);process.exitCode=1});
