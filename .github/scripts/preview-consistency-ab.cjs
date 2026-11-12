'use strict';
// A/B comparison on identical fictional prompts. No private student data.
// Compare relative judgements; no assumption that either provider is ground truth.
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('.github/scripts/preview-quality-audit.cjs','utf8');
const prefix=source.slice(0,source.indexOf('async function request(t)'));
if(!prefix.includes('function prompt(t)'))throw Error('AUDIT_PROMPT_NOT_FOUND');
const ctx={require,console};vm.runInNewContext(prefix+'\nthis.makePrompt=prompt;this.cases=cases;this.scoring=scoring;',ctx);
const caseById=Object.fromEntries(ctx.cases.map(t=>[t.id,t]));
const tasks=[
 ['es_hl_strong','luna','first'],['es_hl_strong','luna','repeat'],['es_hl_strong','gemini','compare'],
 ['es_hl_weak','luna','first'],['es_hl_weak','luna','repeat'],['es_hl_weak','gemini','compare'],
 ['fr_control_weak','luna','components'],['pl_gender_correct','luna','neutrality']
];
const urls={luna:'https://deploy-preview-27--lcorals.netlify.app/.netlify/functions/gemini',
 gemini:'https://lcorals.ie/.netlify/functions/gemini'};
const esRanges={1:[65,70],2:[55,60],3:[45,50],4:[30,40],5:[20,25],6:[10,15],7:[0,5]};
async function send(t,provider){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),60000);
 try{
  const r=await fetch(urls[provider],{method:'POST',headers:{'Content-Type':'application/json','X-LCorals-Age-Band':'18-plus'},body:JSON.stringify({contents:[{parts:[{text:ctx.makePrompt(t)}]}]}),signal:ctrl.signal});
  const d=await r.json();if(!r.ok)throw Error('HTTP_'+r.status+'_'+(d.error?.code||'unknown'));
  if(provider==='luna'&&r.headers.get('x-lcorals-provider')!=='openai-luna')throw Error('LUNA_HEADER_MISSING');
  const raw=d?.candidates?.[0]?.content?.parts?.[0]?.text;
  if(typeof raw!=='string')throw Error('NO_OUTPUT_TEXT');
  let j;try{j=JSON.parse(raw.replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,'').trim())}catch{throw Error('INVALID_JSON')}
  let total,breakdown=null;
  if(t.lang==='es'){
   total=j.score;
   if(!Number.isInteger(total)||!Number.isInteger(j.band)||!esRanges[j.band]||total<esRanges[j.band][0]||total>esRanges[j.band][1])throw Error('ES_BAND_MISMATCH');
  }else{
   const sc=ctx.scoring.read(t.lang,'conversation',j);
   total=sc.score;breakdown=sc.parts.map(p=>({criterion:p.key,score:p.score,max:p.max,band:p.band}));
  }
  if(typeof j['feedback_'+t.lang]!=='string'||typeof j.feedback_en!=='string'||!Array.isArray(j.errors))throw Error('BAD_FEEDBACK_SCHEMA');
  const errors=j.errors.map(e=>({original:e.original,correction:e.correction})).slice(0,5);
  if(t.lang==='pl'){
   // Correct feminine FIRST PERSON forms do not imply the identity of the learner.
   if(errors.length||/poszedłem|wróciłem|przeczytałem/i.test(JSON.stringify(j)))throw Error('POLISH_FALSE_CORRECTION');
  }
  return {score:total,band:j.band,breakdown,feedback:j['feedback_'+t.lang],feedback_en:j.feedback_en,errors,next_steps:j.next_steps};
 }finally{clearTimeout(timer)}
}
(async()=>{
 const out=[];for(const [i,[id,provider,label]] of tasks.entries()){
  if(i)await new Promise(resolve=>setTimeout(resolve,30000));
  try{const result=await send(caseById[id],provider);const x={id,provider,label,...result};out.push(x);console.log('CASE',JSON.stringify(x))}
  catch(e){const error=String(e.message||e).slice(0,130);out.push({id,provider,label,error});console.log('CASE_ERROR',JSON.stringify({id,provider,label,error}));if(error.includes('HTTP_429')){console.log('STOP','API rate limit; not retrying');break}}
 }
 const by=(id,p)=>out.filter(x=>x.id===id&&x.provider===p&&!x.error);
 const strong=by('es_hl_strong','luna'),weak=by('es_hl_weak','luna');
 const issues=[];
 for(const [label,series] of [['strong',strong],['weak',weak]])if(series.length===2&&Math.abs(series[0].score-series[1].score)>10)issues.push('LARGE_ES_VARIATION_'+label);
 if(strong.length&&weak.length&&Math.min(...strong.map(x=>x.score))<=Math.max(...weak.map(x=>x.score)))issues.push('SCORE_INVERSION');
 if(out.some(x=>x.error))issues.push('CASE_ERROR');
 if(out.length!==tasks.length)issues.push('INCOMPLETE');
 console.log('SUMMARY',JSON.stringify({completed:out.length,planned:tasks.length,issues,strongLuna:strong.map(x=>x.score),weakLuna:weak.map(x=>x.score),strongGemini:by('es_hl_strong','gemini').map(x=>x.score),weakGemini:by('es_hl_weak','gemini').map(x=>x.score),french:by('fr_control_weak','luna').map(x=>x.breakdown)}));
 if(issues.length)process.exitCode=1;
})().catch(e=>{console.log('HARNESS_ERROR',String(e.message||e));process.exitCode=1});
