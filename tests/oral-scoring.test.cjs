const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('oral-scoring.js','utf8')+'\nglobalThis.scoring = LCOralScoring;', context);
const S = context.scoring;
const bands = ['limited','basic','developing','competent','strong','excellent'];
const contracts = [['it','conversation',50],['it','picture',25],['it','roleplay',25],['de','conversation',40],['de','picture',30],['pl','conversation',100],['pl','mock',100]];
for (const [lang,task,max] of contracts) {
  // Every integer has exactly one acceptable band; decimal/out-of-range output is rejected.
  for(let score=0;score<=max;score++) {
    let accepted=0;
    for(const band of bands) { try { assert.equal(S.read(lang,task,{band,score}).score,score); accepted++; } catch(e) { if(e.code) throw e; } }
    assert.equal(accepted,1,`${lang}/${task}: ${score}`);
  }
  for(const score of [-1,max+1,NaN,3.5,'40',null]) assert.throws(()=>S.read(lang,task,{band:'excellent',score}));
}
const french = S.read('fr','conversation',{communication:{band:'excellent',score:29},structures:{band:'strong',score:25},vocabulary:{band:'excellent',score:19},score:100,pronunciation:20});
assert.equal(french.score,73); assert.equal(french.max,80); // Ignore invented totals/pronunciation.
const italian = S.read('it','mock',{conversation:{band:'excellent',score:49},roleplay:{band:'strong',score:22},picture:{band:'competent',score:19}});
assert.equal(italian.score,90); assert.equal(italian.max,100);
const german = S.read('de','mock',{conversation:{band:'excellent',score:40},part_two:{band:'excellent',score:30},roleplay:{band:'excellent',score:30}});
assert.equal(german.score,100);
assert.throws(()=>S.read('it','mock',{band:'excellent',score:100}));
assert.throws(()=>S.read('es','conversation',{band:'excellent',score:70}));
const filtered = S.suggestions({connectors:['Invece','Inoltre'],errors:[
  {original:'Io andare',correction:'Vado',explanation_en:'Conjugate the verb for the subject.'},
  {original:'byłem',correction:'byłam',explanation_en:'If you are female, change the verb.'},
  {original:'unspoken phrase',correction:'another',explanation_en:'Incorrect phrase.'}
]}, 'Io andare. Invece ... byłem');
assert.equal(JSON.stringify(filtered.connectors),JSON.stringify(['Inoltre']));
assert.equal(filtered.errors.length,1);
const optional = S.suggestions({band:'competent',score:37,errors:[
  {original:'e era bello',correction:'ed era bello',explanation_en:'This improves flow.'},
  {original:'Mi piace italiano',correction:"Mi piace l'italiano",explanation_en:'Use the article.'},
  {original:'era bello',correction:'è stato bello',explanation_en:'The original is not strictly incorrect.'}
]}, 'Mi piace italiano. e era bello');
assert.equal(optional.errors.length,1);
assert.equal(optional.errors[0].correction,"Mi piace l'italiano");
assert.equal(optional.score,37); assert.equal(optional.band,'competent');
for (const lang of ['it','fr','de','pl']) {
  const html=fs.readFileSync(`${lang}/index.html`,'utf8');
  assert(html.indexOf('../oral-scoring.js') < html.indexOf('src="script.js'));
}
console.log('Scoring checks passed: all integer bands, maxima, component sums, French excluded pronunciation, invalid output and script loading.');
