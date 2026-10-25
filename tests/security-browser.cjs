/* Isolated Chromium security regressions. Every request is fulfilled locally or
   aborted: no real Gemini endpoint, credentials, students or third parties. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.LCORALS_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const payload='<img src="x" onerror="window.__xss=1">\n<script>window.__xss=2</script><svg onload="window.__xss=3"></svg>';
let browser;
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.LCORALS_CHROMIUM_EXECUTABLE?{executablePath:process.env.LCORALS_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}:{} )});
 const page=await browser.newPage();let reply,status=200,abort=false,requests=0,checks=0;
 const errors=[],dialogs=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
 await page.addInitScript(()=>{window.__xss=0;});
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!=='https://lc-security.invalid')return route.abort();
  if(u.pathname==='/.netlify/functions/gemini'){
   requests++;if(abort)return route.abort();
   return route.fulfill({status,json:status!==200?{error:{message:'PRIVATE_TEST_DETAIL'}}:
    typeof reply==='string'?{candidates:[{content:{parts:[{text:reply}]}}]}:reply});
  }
  let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));
  if(file!==root&&!file.startsWith(root+path.sep))return route.fulfill({status:403,body:''});
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
  const contentType={'.html':'text/html','.js':'text/javascript','.css':'text/css','.PNG':'image/png','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
  return route.fulfill({contentType,body:fs.readFileSync(file)});
 });
 const open=async lang=>{status=200;abort=false;await page.goto('https://lc-security.invalid/'+lang+'/');await page.locator('#topicGrid button').first().waitFor();};
 const clean=async selector=>{
  assert.equal(await page.locator(selector+' img, '+selector+' script, '+selector+' svg').count(),0);
  assert.equal(await page.evaluate(()=>window.__xss),0);
  assert.ok((await page.locator(selector).textContent()).includes('<img'));checks+=3;
 };
 const data=(lang,score=90)=>({band:'excellent',score,feedback_native:payload,feedback_ga:payload,feedback_en:'Line one\n'+payload,feedback_fr:payload,feedback_de:payload,
  errors:[{original:payload,correction:payload+' safe',explanation_en:'Genuine correction '+payload,explanation_native:payload}]});
 for(const lang of ['de','eal']){
  await open(lang);await page.locator('#tabRole').click();await page.locator('#sectionRoleplay .rp-btn-select').first().click();
  // Audio readiness is simulated; no microphone or speech service is invoked.
  await page.evaluate(()=>habilitarInput());await page.locator('#rpInput').fill(payload);await page.locator('#rpSendBtn').click();
  await clean('#rpChat');assert.ok((await page.locator('.bubble.st').textContent()).includes('\n'));checks++;
 }
 for(const lang of ['ga','eal']){
  await open(lang);reply=JSON.stringify(data(lang));await page.locator('#topicGrid button').first().click();
  await page.locator('#userInput').fill(payload);await page.locator('#btnAction').click();await page.locator('#result').waitFor({state:'visible'});
  await clean('#errorsList');if(lang==='eal')await clean('#fbNative');
  if(lang==='ga'){
   await page.locator('#tabSraith').click();await page.locator('#sraithSelector button').first().click();await page.locator('#userInputSraith').fill(payload);
   await page.locator('#btnActionSraith').click();await page.locator('#resultSraith').waitFor({state:'visible'});await clean('#errorsListSraith');
  }
 }
 for(const lang of ['ga','eal']){
  await open(lang);if(lang==='eal')await page.locator('#nativeLang').selectOption('Spanish');
  await page.locator('#modeStudy').click();await page.locator('#topicGrid button').first().click();
  reply='<p onclick="window.__xss=4"><b>Explanation:</b> A &amp; B\nSecond line</p><ul><li>Useful example</li></ul>'+payload;
  await page.locator('.check-btn').first().click();await page.locator('.safe-study-output').waitFor();await clean('#aiExplanationBox');
  assert.equal(await page.locator('.safe-study-output [onclick]').count(),0);assert.equal(await page.locator('.safe-study-output b').textContent(),'Explanation:');checks+=2;
 }
 await open('fr');await page.locator('#tabDoc').click();await page.locator('#docStep1 button').first().click();
 await page.locator('#docDescription').fill('Fictional photo');reply='Question one?';await page.locator('#docStep2 button').click();
 const fr=data('fr');for(const [key,score]of [['communication',30],['structures',30],['vocabulary',20]])fr[key]={band:'excellent',score};
 reply=JSON.stringify(fr);await page.locator('#userInputDoc').fill(payload);await page.locator('#btnActionDoc').click();await page.locator('#resultDoc').waitFor({state:'visible'});await clean('#errorsListDoc');
 await open('de');await page.locator('#tabStory').click();await page.locator('#sectionStory .rp-btn-select').first().click();
 reply=JSON.stringify(data('de',30));await page.locator('#userInputStory').fill(payload);await page.locator('#btnActionStory').click();await page.locator('#resultStory').waitFor({state:'visible'});await clean('#errorsListStory');
 // Malformed HTML, foreign namespaces, encoded tags and active attributes.
 const vectors=[payload,'<math><mtext><img src=x onerror="window.__xss=5"></mtext></math>',
  '<template><img src=x onerror="window.__xss=6"></template>','&lt;img src=x onerror="window.__xss=7"&gt;',
  '<p style="background:url(x)" onmouseover="window.__xss=8">Text</p>',
  '<svg><foreignObject><p onload="window.__xss=9">text</p></foreignObject></svg>',
  '<form><input name=__proto__></form>','<iframe srcdoc="<script>parent.__xss=10</script>"></iframe>'];
 const safe=await page.evaluate(inputs=>inputs.map(source=>{
  const e=document.createElement('div');e.innerHTML=LCSecurity.studyHTML(source);document.body.append(e);
  const bad=e.querySelector('img,script,svg,math,iframe,template,form,input,[style],[onerror],[onclick],[onload],[onmouseover]');
  e.remove();return !bad;
 }),vectors);
 assert.ok(safe.every(Boolean));assert.equal(await page.evaluate(()=>window.__xss),0);checks+=vectors.length+1;
 // Exercise real browser fetch rejection/HTTP and malformed-success handling.
 await open('es');await page.locator('#topicGrid button').first().click();
 const answer='Legitimate response that must remain after failure.';
 for(const outcome of [429,403,504,500,'network','empty','incomplete','bad-json']){
  status=typeof outcome==='number'?outcome:200;abort=outcome==='network';
  reply=outcome==='empty'?{candidates:[]}:outcome==='incomplete'?{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'partial'}]}}]}:'not valid JSON';
  await page.locator('#userInput').fill(answer);const before=requests;await page.locator('#btnAction').click();
  await page.waitForFunction(()=>!document.querySelector('#btnAction').disabled);
  assert.equal(await page.locator('#userInput').inputValue(),answer);assert.equal(await page.locator('#exerciseArea').isVisible(),true);
  assert.equal(await page.locator('#scoreDisplay').textContent(),'');assert.equal(requests-before,1);checks+=4;
 }
 assert.ok(dialogs.length>=8);assert.ok(dialogs.every(x=>!x.includes('PRIVATE_TEST_DETAIL')));assert.deepEqual(errors,[]);checks+=3;
 console.log(JSON.stringify({checks,syntheticRequests:requests,realAIRequests:0,pageErrors:errors.length,xssExecuted:await page.evaluate(()=>window.__xss)}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
