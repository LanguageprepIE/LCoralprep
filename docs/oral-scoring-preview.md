# Oral scoring preview

This branch changes Italian, French, German and Polish assessment only. Spanish and the Gemini backend/model are unchanged. No production merge is intended until the preview is reviewed.

## Assessment contracts

| Language | Individual practice | Complete mock |
|---|---|---|
| Italian | Conversation /50; picture narrative /25; roleplay /25 | Conversation /50 + roleplay /25 + picture /25 |
| French | Communication /30 + structures /30 + vocabulary /20 | Same categories, /80; document belongs to conversation |
| German | Conversation /40; picture narrative /30 | Conversation /40 + picture/project /30 + roleplay /30 |
| Polish | Integrated estimate /100 | Integrated /100; optional official HL contribution ×1.2 = /120 |

French pronunciation /20 is unassessed and no /100 total is inferred. Every language remains a transcript estimate: listening, pronunciation, timing, examiner support and live interaction cannot be measured here. A single topic response or shortened narrative is evidence of practice performance, not proof of achievement across the complete exam component. Study support itself has no score.

`oral-scoring.js` holds shared principles and explicit component ranges. Its six descriptive bands are **LCorals pedagogical calibration**, not published SEC bands and not H1/O1 grade predictions. The model selects a qualitative band before a direct component mark. Totals are sums of component marks; no generic percentage is converted into them. Any integer is possible, including maxima. Invalid bands, noninteger marks and marks outside their band are rejected rather than silently clamped to zero.

The learner's existing HL/OL or General/Discussion setting controls practice support. Polish exam weighting is a separate mock setup selection; an individual practice answer is never weighted to /120. There are no invented Polish conversation/portfolio subweights. Gender guesses and connector suggestions already present in the text are excluded from displayed corrections/suggestions.

## Scope and references

The common oral structure and weighting were audited using SEC Chief Examiner reports and the SEC candidate results guide, plus the NCCA Polish specification. References:

- [SEC Italian report (2005, archived copy)](https://diazilla.com/doc/345612/italian---state-examination-commission): 50/25/25. This historical allocation should be checked against the current examiner instructions before production approval; the current Italian instructions linked by the teachers' association were unavailable during the audit.
- [SEC French report (2010)](https://pdst.ie/sites/default/files/10%20CER.pdf): communication 30, structures 30, vocabulary 20, pronunciation 20.
- [SEC German report (2016)](https://pdst.ie/sites/default/files/16%20CER_0.pdf): 40/30/30. The preview does not enforce the previously hardcoded, unverified subweights inside the last two components.
- [SEC candidate results guide (2024)](https://careersportal.ie/sites/default/files/documents/LC2024%20candidates:%20Understanding%20Your%20Examination%20Results:%20Candidate%20Information%20Guide.pdf): common marks and weighting, including Polish 100 ×1.2 = 120 at HL.
- [NCCA Polish specification](https://curriculumonline.ie/getmedia/b32d1de0-62fd-4c3a-b544-3f869993d5fa/Polish-Specification-for-Leaving-Certificate_EN.pdf): integrated performance, cultural awareness and portfolio discussion at approximately A2/B1.

Annual task selections and Polish prescribed topics are unchanged. This branch does not claim to update the mock to the 2027 instructions.

## Validation

See [follow-up validation and remaining limitations](oral-scoring-validation.md) before production approval. Feedback proofreading is now a separate step with immutable marks; repeated model scores remain variable.

Run `node tests/oral-scoring.test.cjs` for integer coverage, component totals, unsupported Spanish contracts, invalid output and display filtering. All five changed JavaScript files pass `node --check`.

DOM checks against the real HTML and rendering functions passed: Italian /50 and /100 plus five-turn roleplay feedback /25; French /80 breakdown; Polish /100, HL /120 and unweighted optional practice; German /40 and full /100. These checks used a DOM emulator; a visual browser check remains part of user preview review.

Synthetic excellent, medium and error-heavy responses were tested through the existing Gemini 3.5 Flash-Lite proxy. One conversation run produced Italian 48/50, 37/50, 31/50; French 74/80, 64/80, 48/80; German 39/40, 30/40, 25/40; Polish 95/100, 85/100, 65/100. Excellent-response enrichment arrays were empty after strengthening the final prompt checks.

Integrated mock samples produced Italian 97/100, 75/100, 47/100; German 100/100, 70/100, 60/100; Polish 96/100, 68/100, 65/100. A French conversation/document sample produced 75/80. All output contracts validated and quality ordering held. These are observations, not fixed expected marks: model judgements vary, and short samples cannot establish reliability for all learners. Samples are fictional and contain no student data.
