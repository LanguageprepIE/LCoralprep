const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('security.js', 'utf8') + '\nglobalThis.api=LCSecurity;', ctx);
const assess = (score, band, feedback_es, feedback_en = 'Good answer.') =>
  ctx.api.spanishAssessment({ score, band, errors: [], feedback_es, feedback_en }, 'HL');

test('valid high and mid band marks remain unchanged', () => {
  assert.equal(assess(70, 1, 'Excelente respuesta.').score, 70);
  assert.equal(assess(55, 2, 'Bien, aunque breve.').score, 55);
  assert.equal(assess(45, 3, 'Comunicación adecuada.').score, 45);
});
test('score and selected official-style band cannot disagree', () => {
  for (const [score,band] of [[70,2],[62,1],[0,1],[60,3],[71,1],[-1,7]])
    assert.throws(() => assess(score,band,'Respuesta adecuada.'), /INVALID_RESPONSE|response/i);
});
test('text-only feedback variations do not discard a valid numerical mark', () => {
  assert.equal(assess(70,1,'La única razón por la que no tiene la máxima puntuación es su brevedad.').score,70);
  assert.equal(assess(70,1,'Muy bien.','You did not receive the maximum score because it was brief.').score,70);
  assert.equal(assess(65,1,'No alcanza la máxima puntuación por su desarrollo.').score,65);
  // Rubric and feedback alignment remains a model instruction and audit concern.
});
