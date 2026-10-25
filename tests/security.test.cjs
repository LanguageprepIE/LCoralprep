const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const valid = text => ({ httpMethod:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({contents:[{parts:[{text}]}]}) });
function backend(fetch, key = 'test-only-dummy-key') {
  let timer, calls = 0, cleared = 0;
  const context = vm.createContext({ Buffer, AbortController, process:{env:{GEMINI_API_KEY:key}},
    fetch:async (...args) => { calls++; return fetch(...args); },
    setTimeout:callback => { timer=callback; return 1; }, clearTimeout:()=>cleared++ });
  vm.runInContext(read('netlify/functions/gemini.js').replace('export const handler', 'const handler')+'\nglobalThis.handler=handler;', context);
  return { run:context.handler, timeout:()=>timer(), calls:()=>calls, cleared:()=>cleared };
}
const generated = (text='Synthetic reply\nSecond line', extra={}) => ({ candidates:[{content:{parts:[{text}]},...extra}] });
const upstream = (data,status=200) => ({ok:status>=200&&status<300,status,json:async()=>data});

test('server rejects malformed/oversized/unsupported requests without calling Gemini', async () => {
  const b = backend(()=>{ throw Error('must not fetch'); });
  for(const event of [
    {...valid('text'),httpMethod:'GET'}, {...valid('text'),headers:{}}, {...valid('text'),body:'{'},
    {...valid('text'),body:'null'}, {...valid('text'),body:'[]'}, {...valid('text'),body:'{"contents":[]}'},
    {...valid('text'),body:JSON.stringify({contents:[{parts:[{text:42}]}]})},
    {...valid('text'),body:JSON.stringify({contents:[{role:'system',parts:[{text:'text'}]}]})},
    {...valid('text'),body:JSON.stringify({contents:[{parts:[{inlineData:'not a text request'}]}]})},
    {...valid('text'),body:JSON.stringify({contents:[{parts:[{text:' '}]}]})},
    {...valid('text'),body:JSON.stringify({contents:[{parts:[{text:'text'}]}],generationConfig:{model:'other'}})},
    {...valid('text'),isBase64Encoded:true},valid('x'.repeat(1024*1024))
  ]) assert.ok((await b.run(event)).statusCode>=400);
  assert.equal(b.calls(),0);
});

test('server accepts a long HL/mock prompt verbatim with the unchanged model and payload', async () => {
  const long='Higher Level mock\n'+('Respuesta extensa en español.\n'.repeat(12000));
  const b=backend((url,options)=>{
    assert.match(url,/models\/gemini-3\.5-flash-lite:generateContent\?key=/);
    assert.deepEqual(JSON.parse(options.body),JSON.parse(valid(long).body));
    assert.deepEqual(Object.keys(JSON.parse(options.body)),['contents']);
    return upstream(generated());
  });
  const result=await b.run(valid(long));assert.equal(result.statusCode,200);assert.equal(b.calls(),1);
  assert.equal(JSON.parse(result.body).candidates[0].content.parts[0].text,'Synthetic reply\nSecond line');
  assert.equal(result.headers['Cache-Control'],'no-store');assert.equal(b.cleared(),1);
});

test('server normalizes quota, billing/permissions, network and provider failures without leaking internals', async () => {
  for(const [status,expected] of [[429,429],[402,503],[403,503],[401,503],[400,502],[500,503],[503,503]]) {
    const b=backend(()=>upstream({error:{message:'INTERNAL test-only-dummy-key provider stack'}},status));
    const result=await b.run(valid('Legitimate answer'));
    assert.equal(result.statusCode,expected);assert.doesNotMatch(result.body,/INTERNAL|dummy-key|stack/);assert.equal(b.calls(),1);
  }
  const b=backend(()=>{throw Error('INTERNAL test-only-dummy-key stack');});
  assert.equal((await b.run(valid('answer'))).statusCode,503);
  assert.doesNotMatch((await b.run(valid('answer'))).body,/INTERNAL|dummy-key|stack/);
  const absent=backend(()=>{throw Error('no fetch');},'');assert.equal((await absent.run(valid('answer'))).statusCode,503);assert.equal(absent.calls(),0);
});

test('server rejects empty, blocked, incomplete and malformed provider replies', async () => {
  for(const data of [null,{}, {candidates:[]}, generated(' '), generated('partial',{finishReason:'MAX_TOKENS'}),
    generated('blocked',{finishReason:'SAFETY'}),{promptFeedback:{blockReason:'SAFETY'}},
    {candidates:[{content:{parts:[{text:3}]}}]}, {candidates:{0:{content:{parts:[{text:'wrong array'}]}}}},
    {error:{message:'private provider error'}}]) {
    const result=await backend(()=>upstream(data)).run(valid('answer'));assert.equal(result.statusCode,502);
  }
  const badJSON=backend(()=>({ok:true,status:200,json:async()=>{throw Error('private parse error');}}));
  assert.equal((await badJSON.run(valid('answer'))).statusCode,502);
  const multi=backend(()=>upstream({candidates:[{finishReason:'STOP',content:{parts:[{text:'one\n'},{text:'two'}]}}]}));
  assert.equal(JSON.parse((await multi.run(valid('answer'))).body).candidates[0].content.parts[0].text,'one\ntwo');
});

test('server aborts a stalled request once; no automatic retry or trace exposure', async () => {
  const b=backend((url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('private timeout detail')))));
  const pending=b.run(valid('answer'));b.timeout();const result=await pending;
  assert.equal(result.statusCode,504);assert.equal(b.calls(),1);assert.equal(b.cleared(),1);assert.doesNotMatch(result.body,/private/);
});

function client(fetch) {
  let timer, calls=0;
  const context=vm.createContext({AbortController,fetch:async(...args)=>{calls++;return fetch(...args);},
    setTimeout:callback=>{timer=callback;return 1;},clearTimeout(){} });
  vm.runInContext(read('security.js')+'\nglobalThis.api=LCSecurity;',context);
  return {api:context.api,timeout:()=>timer(),calls:()=>calls};
}
test('client preserves text and turns transport/shape errors into safe actionable messages', async () => {
  const c=client(()=>upstream(generated()));assert.equal(await c.api.request('original prompt'),'Synthetic reply\nSecond line');
  for(const status of [429,403,402,500,503,504,413]) {
    const c=client(()=>upstream({error:{message:'private provider details'}},status));
    await assert.rejects(c.api.request('answer'),e=>/Your answer/.test(e.message)&&!e.message.includes('private'));
    assert.equal(c.calls(),1);
  }
  for(const data of [null,{},generated(''),generated('partial',{finishReason:'MAX_TOKENS'})]) {
    const c=client(()=>upstream(data));await assert.rejects(c.api.request('answer'),e=>e.code==='INVALID_RESPONSE');
  }
  const broken=client(()=>{throw Error('private network trace');});await assert.rejects(broken.api.request('answer'),e=>e.code==='NETWORK'&&!e.message.includes('private'));
  const slow=client((url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('private')))));
  const pending=slow.api.request('answer');slow.timeout();await assert.rejects(pending,e=>e.code==='TIMEOUT');assert.equal(slow.calls(),1);
});

test('invalid structured feedback is rejected rather than displayed as a zero or broken result', () => {
  const {api}=client(()=>{});
  for(const data of [null,[],{errors:'bad'},{errors:[null]},{errors:[{}]},{corrections:[{original:42,correction:'text'}]},{feedback_en:{}},{corrections:[[]]}]) assert.throws(()=>api.object(data));
  for(const data of [{},{score:'90',errors:[],feedback_en:'Good'},{score:90,errors:[],feedback_en:null}]) assert.throws(()=>api.feedback(data,['feedback_en']));
  const good={score:90,errors:[],feedback_en:'Line one\nLine two'};assert.equal(api.feedback(good,['feedback_en']),good);
  assert.throws(()=>api.roleplay({total_score:30,turns:[]}));
});

const {hash,protectedContent}=require('./helpers/protected-content.cjs');
const protectedBaseline=JSON.parse(read('tests/fixtures/work03-protected-content.json'));
test('shared scoring/rubrics, accessibility logic and privacy are byte-identical to merged Work 02',()=>{
 for(const [file,expected]of Object.entries(protectedBaseline.files))assert.equal(hash(read(file)),expected,file);
});
test('all seven modules retain their exact prompts, assessment builders and educational data', {skip:!process.env.LCORALS_ACORN_PATH},()=>{
 const acorn=require(process.env.LCORALS_ACORN_PATH);
 for(const [lang,expected]of Object.entries(protectedBaseline.modules))assert.deepEqual(protectedContent(read(`${lang}/script.js`),acorn),expected,lang);
});
