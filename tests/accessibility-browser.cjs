/* Optional local Chromium regression runner. It never reaches Gemini or third parties.
   See docs/work02-accessibility.md for test-only dependency/environment setup. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.LCORALS_PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  const resolved = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) { response.writeHead(404).end(); return; }
  const type = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.PNG':'image/png', '.mp3':'audio/mpeg' }[path.extname(resolved)] || 'application/octet-stream';
  response.writeHead(200, {'Content-Type': type}); fs.createReadStream(resolved).pipe(response);
});
const languages = ['es','fr','de','it','pl','ga','eal'];
let browser;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless:true,
    ...(process.env.LCORALS_CHROMIUM_EXECUTABLE ? { executablePath:process.env.LCORALS_CHROMIUM_EXECUTABLE,
      args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] } : {}) });
  const page = await browser.newPage({ viewport: {width:1280, height:900} });
  const errors = []; page.on('pageerror', error => errors.push(String(error)));
  let lang, requests = 0, checks = 0;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (url.pathname === '/.netlify/functions/gemini') {
      requests++;
      const data = { band:'excellent', score:{es:70,it:50,de:40,pl:100,ga:100,eal:100}[lang],
        feedback_es:'Synthetic feedback.', feedback_it:'Synthetic feedback.', feedback_de:'Synthetic feedback.', feedback_pl:'Synthetic feedback.', feedback_fr:'Synthetic feedback.', feedback_ga:'Synthetic feedback.', feedback_native:'Synthetic feedback.', feedback_en:'Synthetic feedback.', errors:[], strengths:[], next_steps:[] };
      if (lang === 'fr') for(const [key,score] of [['communication',30],['structures',30],['vocabulary',20]]) data[key]={band:'excellent',score};
      await new Promise(resolve => setTimeout(resolve, 80));
      return route.fulfill({json:{candidates:[{content:{parts:[{text:JSON.stringify(data)}]}}]}});
    }
    return route.continue();
  });
  const noOverflow = async label => {
    const result = await page.evaluate(() => ({ width:innerWidth, scroll:document.documentElement.scrollWidth }));
    assert.ok(result.scroll <= result.width + 1, `${label}: ${JSON.stringify(result)}`); checks++;
  };
  for (lang of languages) {
    await page.setViewportSize({width:1280,height:900});
    await page.goto(`${base}/${lang}/`); await page.locator('#topicGrid button').first().waitFor();
    const defaultId = lang === 'eal' ? 'btnBasic' : lang === 'ga' ? 'btnOL' : 'btnHL';
    assert.equal(await page.locator('#'+defaultId).getAttribute('aria-pressed'),'true'); checks++;
    for (const level of lang === 'eal' ? ['btnBasic','btnAdvanced'] : ['btnOL','btnHL']) {
      await page.locator('#'+level).press('Enter');
      assert.equal(await page.locator('#'+level).getAttribute('aria-pressed'),'true'); checks++;
    }
    await page.locator('#topicGrid button').first().press('Enter');
    await page.waitForFunction(() => document.activeElement.id === 'qDisplay'); checks++;
    assert.equal(await page.getByLabel('Your answer', {exact:true}).count(),1); checks++;
    assert.equal(await page.locator('#qDisplay').evaluate(e=>getComputedStyle(e).outlineWidth),'3px'); checks++;
    for (const width of [320,375,768,1024]) {
      await page.setViewportSize({width,height:900}); await noOverflow(lang+' question '+width);
    }
    // Back to desktop so headless tests do not claim native mobile input support.
    await page.setViewportSize({width:1280,height:900});
    const hint = page.locator('#btnHint');
    if (await hint.isVisible()) {
      await hint.press('Space'); assert.equal(await hint.getAttribute('aria-expanded'),'true'); checks++;
      await hint.press('Space'); assert.equal(await hint.getAttribute('aria-expanded'),'false'); checks++;
    }
    await page.getByLabel('Your answer', {exact:true}).fill('Synthetic response for browser regression.');
    await page.locator('#btnAction').press('Enter');
    await page.waitForFunction(() => document.querySelector('#exerciseArea').getAttribute('aria-busy') === 'true'); checks++;
    await page.waitForFunction(() => document.querySelector('#scoreDisplay').textContent.trim().length > 0);
    await page.waitForFunction(() => document.activeElement.id === 'scoreDisplay'); checks++;
    assert.equal(await page.locator('#exerciseArea').getAttribute('aria-busy'),'false'); checks++;
    if (['es','de','it','eal'].includes(lang)) {
      await page.locator('#tabRole').press('Enter');
      await page.locator('#tabRole').press('Tab');
      const first = page.locator('#sectionRoleplay .rp-btn-select').first();
      // German/Italian also have a Pictures tab after Roleplays.
      for (let i=0;i<3 && !(await first.evaluate(e=>e===document.activeElement));i++) await page.keyboard.press('Tab');
      assert.equal(await first.evaluate(e=>e===document.activeElement),true); checks++;
      await first.press('Enter'); assert.equal(await first.getAttribute('aria-pressed'),'true'); checks++;
      const second = page.locator('#sectionRoleplay .rp-btn-select').nth(1);
      await second.press('Space'); assert.equal(await second.getAttribute('aria-pressed'),'true'); checks++;
      for (const width of [320,375,768]) { await page.setViewportSize({width,height:900}); await noOverflow(lang+' roleplay '+width); }
    }
    if (['it','de'].includes(lang)) {
      await page.locator('#tabStory').press('Enter');
      await page.locator('#sectionStory .rp-btn-select').first().press('Space');
      assert.equal(await page.locator('#sectionStory .rp-btn-select').first().getAttribute('aria-pressed'),'true'); checks++;
      await noOverflow(lang+' pictures 768');
    }
    if (lang === 'ga') {
      for(const [tab,selector] of [['tabPoem','#poemButtonsContainer'],['tabSraith','#sraithSelector']]) {
        await page.locator('#'+tab).press('Enter');
        await page.locator(selector+' button').first().press('Space');
        assert.equal(await page.locator(selector+' button').first().getAttribute('aria-pressed'),'true'); checks++;
        await page.setViewportSize({width:320,height:900}); await noOverflow('ga '+tab);
      }
    }
    assert.deepEqual(errors,[],lang);
    console.log(`PASS ${lang}: native keyboard, accessible states, labels, synthetic result and responsive layouts`);
  }
  // Check narrow full-mock setup layouts without advancing to any AI-generated content.
  for(lang of ['es','fr','de','it','pl','ga']) {
    await page.goto(`${base}/${lang}/`); await page.locator('#topicGrid button').first().waitFor();
    if(lang==='de') await page.locator('.full-mock-btn').click();
    else await page.locator('.mock-btn').first().click();
    for (const width of [320,375,768]) { await page.setViewportSize({width,height:900}); await noOverflow(lang+' mock setup '+width); }
  }
  await page.goto(`${base}/es/`); await page.locator('#topicGrid button').first().press('Enter');
  await page.screenshot({path:process.env.LCORALS_SCREENSHOT || '/tmp/lcorals-work02-browser.png',fullPage:true});
  console.log(JSON.stringify({checks,syntheticRequests:requests,realAIRequests:0,pageErrors:errors.length}));
})().catch(error => { console.error(error); process.exitCode=1; }).finally(async()=>{
  await browser?.close(); await new Promise(resolve=>server.close(resolve));
});
