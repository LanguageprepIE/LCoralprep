const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('netlify/functions/gemini.js','utf8');
const event=(text,headers={})=>({
 httpMethod:'POST',headers:{'content-type':'application/json',host:'deploy-preview-27--lcorals.netlify.app','x-lcorals-age-band':'18-plus',...headers},
 body:JSON.stringify({contents:[{parts:[{text}]}]})
});
const mod=(categories={})=>({type:'moderation_result',flagged:Object.values(categories).some(Boolean),categories});
const success=(text='Bien.',input=mod(),output=mod())=>({ok:true,status:200,json:async()=>({
 status:'completed',moderation:{input,output},
 output:[{type:'message',content:[{type:'output_text',text}]}]
})});
function setup(fetcher,env={OPENAI_API_KEY:'synthetic-openai',GEMINI_API_KEY:'synthetic-gemini'}){
 const calls=[];
 const ctx=vm.createContext({Buffer,AbortController,process:{env},console:{warn(){}},
 fetch:async(...args)=>{calls.push(args);return fetcher(...args)},setTimeout:()=>1,clearTimeout(){}});
 vm.runInContext(code.replace('export const handler','const handler')+'\nglobalThis.run=handler;',ctx);
 return {run:ctx.run,calls};
}
test('Preview requests Luna, inline moderation and store:false, preserving frontend response shape',async()=>{
 const b=setup(()=>success('Hola'));
 const r=await b.run(event('Weather practice'));
 assert.equal(r.statusCode,200);
 assert.equal(r.headers['X-LCorals-Provider'],'openai-luna');
 assert.equal(JSON.parse(r.body).candidates[0].content.parts[0].text,'Hola');
 assert.equal(b.calls.length,1);
 assert.equal(b.calls[0][0],'https://api.openai.com/v1/responses');
 const payload=JSON.parse(b.calls[0][1].body);
 assert.equal(payload.model,'gpt-6-luna');
 assert.equal(payload.store,false);
 assert.equal(payload.max_output_tokens,3000);
 assert.equal(payload.moderation.model,'omni-moderation-latest');
});
test('Preview blocks underage or missing declarations before provider calls',async()=>{
 const b=setup(()=>{throw Error('must not call')});
 for(const age of [undefined,'under-16','16-17','16-17-parent-declared']){
   const h={...event('Hello').headers};
   if(age===undefined)delete h['x-lcorals-age-band'];
   else h['x-lcorals-age-band']=age;
   const r=await b.run({...event('Hello'),headers:h});
   assert.equal(r.statusCode,403);
   assert.equal(JSON.parse(r.body).error.code,'AGE_RESTRICTED');
 }
 assert.equal(b.calls.length,0);
});
test('Missing OpenAI key fails closed without Gemini fallback',async()=>{
 const b=setup(()=>{throw Error('must not call')},{GEMINI_API_KEY:'fake'});
 assert.equal((await b.run(event('Hello'))).statusCode,503);
 assert.equal(b.calls.length,0);
});
test('Production hostname still uses Gemini',async()=>{
 const b=setup(()=>({ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'Hola'}]}}]})}));
 const r=await b.run(event('Hello',{host:'lcorals.ie'}));
 assert.equal(r.statusCode,200);
 assert.match(b.calls[0][0],/generativelanguage\.googleapis\.com/);
});
test('Missing or failed inline moderation never releases content',async()=>{
 for(const bad of [null,{type:'error',message:'unavailable'}]){
  const b=setup(()=>success('Hola',bad,mod()));
  const r=await b.run(event('Practice'));
  assert.equal(r.statusCode,503);
  assert.equal(JSON.parse(r.body).error.code,'SAFETY_UNAVAILABLE');
 }
});
test('Self-harm intent leads to human support instead of exam feedback',async()=>{
 const b=setup(()=>success('Unsent output',mod({'self-harm/intent':true}),mod()));
 const r=await b.run(event('Synthetic risk text'));
 assert.equal(r.statusCode,422);
 assert.equal(JSON.parse(r.body).error.code,'SAFETY_SUPPORT');
});
test('Other high risk input and unsafe output are withheld',async()=>{
 for(const [input,output] of [[mod({'illicit/violent':true}),mod()],[mod(),mod({'sexual/minors':true})]]){
  const b=setup(()=>success('not returned',input,output));
  const r=await b.run(event('Synthetic case'));
  assert.equal(r.statusCode,422);
  assert.equal(JSON.parse(r.body).error.code,'SAFETY_BLOCKED');
  assert.ok(!r.body.includes('not returned'));
 }
});
test('Legitimate bullying or mental-health education is not blanket-blocked',async()=>{
 const b=setup(()=>success('Useful school feedback',mod({harassment:true,'self-harm':true}),mod()));
 const r=await b.run(event('Discussion of bullying and wellbeing in a school'));
 assert.equal(r.statusCode,200);
});
test('Bounded prompts and incomplete model outputs are rejected',async()=>{
 const b=setup(()=>success());
 assert.equal((await b.run(event('x'.repeat(180001)))).statusCode,413);
 assert.equal(b.calls.length,0);
 const incomplete=setup(()=>({ok:true,status:200,json:async()=>({status:'incomplete',output:[],moderation:{input:mod(),output:mod()}})}));
 assert.equal((await incomplete.run(event('OK'))).statusCode,502);
});
test('Age choice is session-scoped across same-tab navigation; guardian prototype does not enable teens',()=>{
 const ui=fs.readFileSync('security.js','utf8');
 assert.ok(ui.includes("sessionStorage.getItem('lcorals-preview-age-band-v1')"));
 assert.ok(ui.includes("sessionStorage.setItem('lcorals-preview-age-band-v1','18-plus')"));
 assert.ok(ui.includes('Parent or guardian permission'));
 assert.ok(ui.includes('AI practice remains unavailable for ages 16–17'));
 assert.ok(!ui.includes('localStorage'));
});
