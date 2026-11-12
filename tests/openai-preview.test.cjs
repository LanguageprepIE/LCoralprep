const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('netlify/functions/gemini.js', 'utf8');
const event = text => ({ httpMethod: 'POST', headers: { 'content-type': 'application/json', 'x-lcorals-age-band':'18-plus', host:'deploy-preview-27--lcorals.netlify.app' },
  body: JSON.stringify({ contents: [{ parts: [{ text }] }] }) });
function setup(fetcher, env = { CONTEXT: 'deploy-preview', OPENAI_API_KEY: 'synthetic-key' }) {
  const calls = [];
  const ctx = vm.createContext({ Buffer, AbortController, process: { env },
    console: { warn() {} }, fetch: async (...args) => { calls.push(args); return fetcher(...args); },
    setTimeout: () => 1, clearTimeout() {} });
  vm.runInContext(source.replace('export const handler', 'const handler') + '\nglobalThis.run=handler;', ctx);
  return { run: ctx.run, calls };
}
const success = text => ({ ok: true, status: 200, json: async () => ({ status: 'completed',
  output: [{ type: 'message', content: [{ type: 'output_text', text }] }] }) });

test('Deploy Preview uses Luna with a bounded, non-stored request and original frontend response shape', async () => {
  const b = setup(() => success('{"score": 55}'));
  const result = await b.run(event('Evaluate this response'));
  assert.equal(result.statusCode, 200);
  assert.equal(result.headers['X-LCorals-Provider'], 'openai-luna');
  assert.equal(JSON.parse(result.body).candidates[0].content.parts[0].text, '{"score": 55}');
  assert.equal(b.calls[0][0], 'https://api.openai.com/v1/responses');
  const payload = JSON.parse(b.calls[0][1].body);
  assert.equal(payload.model, 'gpt-6-luna');
  assert.equal(payload.input, 'Evaluate this response');
  assert.equal(payload.store, false);
  assert.equal(payload.max_output_tokens, 3000);
  assert.equal(b.calls[0][1].headers.Authorization, 'Bearer synthetic-key');
});

test('No secret on Deploy Preview fails closed without accessing Gemini', async () => {
  const b = setup(() => { throw Error('unexpected network access'); }, { CONTEXT: 'deploy-preview', GEMINI_API_KEY: 'synthetic-gemini' });
  assert.equal((await b.run(event('Hello'))).statusCode, 503);
  assert.equal(b.calls.length, 0);
});

test('Production hostname remains on Gemini even if an OpenAI key exists', async () => {
  const b = setup(() => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hola' }] } }] }) }),
    { CONTEXT: 'production', GEMINI_API_KEY: 'synthetic-gemini', OPENAI_API_KEY: 'synthetic-openai' });
  assert.equal((await b.run({...event('Hola'),headers:{...event('Hola').headers,host:'lcorals.ie'}})).statusCode, 200);
  assert.match(b.calls[0][0], /generativelanguage\.googleapis\.com/);
});

test('Rejects expensive inputs and incomplete or failed OpenAI outputs', async () => {
  const b = setup(() => success('unused'));
  assert.equal((await b.run(event('x'.repeat(180001)))).statusCode, 413);
  assert.equal(b.calls.length, 0);
  for (const data of [{status:'incomplete',output:[{type:'message',content:[{type:'output_text',text:'partial'}]}]},
    {status:'completed',output:[]}, {status:'failed'}]) {
    const x = setup(() => ({ok:true,status:200,json:async()=>data}));
    assert.equal((await x.run(event('hello'))).statusCode,502);
  }
  const quota = setup(() => ({ok:false,status:429}));
  assert.equal((await quota.run(event('hello'))).statusCode,429);
});

test('Preview rejects missing or underage declaration before calling a provider', async () => {
  const b=setup(() => { throw Error('unexpected network access'); });
  const original=event('Test');
  for(const value of [undefined,'under-16','16-17','16-17-parent-declared','18-plus ']) {
    const headers={...original.headers};
    if(value===undefined)delete headers['x-lcorals-age-band'];
    else headers['x-lcorals-age-band']=value;
    const result=await b.run({...original,headers});
    assert.equal(result.statusCode,403);
    assert.equal(JSON.parse(result.body).error.code,'AGE_RESTRICTED');
  }
  assert.equal(b.calls.length,0);
});

test('The under-18 guardian flow is preview-only and cannot grant API access by itself', () => {
  const ui=fs.readFileSync('security.js','utf8');
  assert.ok(ui.includes('Parent or guardian permission'));
  assert.ok(ui.includes('Confirm permission (preview only)'));
  assert.ok(ui.includes('AI practice remains unavailable for ages 16–17'));
  assert.ok(ui.includes("ageBand !== '18-plus'"));
  assert.ok(!ui.includes('localStorage') && !ui.includes('sessionStorage') && !ui.includes('document.cookie'));
});
