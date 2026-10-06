# Preview validation — 6 October 2026

Tested commit: 722a59e218d0f7c0e38bb9955b51c4b58f88d776, PR #19. No production merge.

## Follow-up changes and verification

The original findings below describe the baseline commit, not the final implementation. The follow-up keeps all component maxima/ranges, Spanish and the Gemini proxy/model unchanged.

- Removed HL/OL and General/Discussion labels from assessment inputs and removed conflicting level-dependent marking instructions. Question choice and Study support remain adaptive. A regression checks that the same question/text produces identical assessment prompts across support settings. This removes a systematic prompt difference; it cannot eliminate stochastic model variation.
- Clarified narrative assessment: a coherent present tense is valid; unseen details, extra feelings and an opinion are not compulsory. Distinguish simple correct control from pervasive core errors. Follow-up correct narratives scored 18 then 23–24/25; error-heavy versions 12–16/25. Ordering held in the targeted repeats and final pipeline.
- Applied source-quote/style filtering to the German full mock's corrections as well as ordinary practice. Vocabulary proposals without an actual quoted source phrase are filtered.
- Added a focused feedback proofreading call with the same Gemini model when corrections/advice or a claim of language errors needs review. It checks bilingual summaries, examples, explanations and proposals, but its output cannot change bands or scores. No new correction quotes can be introduced. If review fails, marks remain intact and the UI requests a retry while withholding unverified comments. Excellent answers without proposals or error claims skip this call. Other feedback can take longer and use an additional API request.

Unit tests cover unchanged marks/component objects, malformed or failed review, unsupported original quotes, the empty-review skip and learner-only mock text. DOM checks verify that German stylistic corrections disappear while a genuine conjugation correction remains. Syntax and whitespace checks pass.

Live feedback regressions corrected Polish szłem → szedłem, retained both szedłem/szłam when gender was unknown, corrected the explanation of do szkoły to genitive, and preserved nauczyciel as singular. The German review removed the false studieren correction and unsupported grammar criticism, and corrected the war/Perfekt label. All bands and marks stayed unchanged by review. French singular professeur agreement was also targeted for review.

A final pipeline sample produced Italian conversation 38/50, correct narrative 24/25 and error-heavy narrative 15/25; French error-heavy 50/80; German correct simple conversation 34/40; Polish error-heavy 65/100. Short integrated medium mocks produced Italian 86/100, German 82/100 and Polish 74/100. These are observed estimates, not target marks. Repeated focused assessment still varied: Italian medium 37–42/50, French error-heavy 48–55/80 and German medium 28–34/40. The proofreading step deliberately does not rescore them.

**Remaining limitation:** feedback accuracy improved on reproduced faults, but model scoring is not deterministic and proofreading is also probabilistic. French structural-band variability remains a review point before production approval. Do not claim stable exact marks or universal correction accuracy from these tests. No temperature/backend change was made: Google recommends default sampling settings for Gemini 3.x (https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5).

## Method

48 synthetic evaluations through the deploy-preview-19 Gemini proxy, using prompts generated from the actual frontend functions: 24 repeated conversation evaluations, 10 integrated mock/document evaluations, 6 Italian roleplay/picture evaluations, 4 lower-support conversation evaluations and 4 targeted Italian repetitions. No student data. All 48 outputs passed language-specific band/mark contracts.

Syntax, integer coverage, component totals, invalid-output rejection and real frontend DOM rendering checks passed. DOM checks covered Italian five-turn roleplay feedback/reset, French /80 breakdown, Polish optional HL /120 and German full mock. These used a DOM emulator, not a visual end-to-end browser. The user's earlier Italian screenshots show the actual preview display.

The results below are observed estimates, not prescribed expected marks or official grades. This small set cannot establish general reliability. Medium samples are not identical in grammatical quality across languages: Italian intentionally omits articles; German is grammatically correct. Integrated mock samples are short synthetic exchanges, not full-duration exams.

## Conversation results

HL/Discussion support; two runs per sample.

| Language | Excellent | Simple/medium | Error-heavy | Scale |
|---|---|---|---|---|
| Italian | 48, 48 | 38, 37 | 32, 32 | /50 |
| French | 75, 77 | 66, 67 | 44, 55 | /80 |
| German | 39, 39 | 30, 33 | 25, 26 | /40 |
| Polish | 95, 95 | 75, 75 | 62, 62 | /100 |

All excellent conversation responses returned empty next-step, connector and vocabulary arrays. Quality ordering held. French maintained 30+30+20, without an invented pronunciation mark. Its error-heavy response varied by 11/80: categories changed from 19+15+10 to 22+19+14, including band changes.

The same medium text in lower support received Italian 48/50, French 73/80, German 34/40 and Polish 85/100. Two additional Italian OL repeats gave 42/50 and 42/50. Earlier user testing also gave 42/50 at HL. This does not establish systematic level bias, but common-oral calibration is not reliably independent of support labels. Existing level-dependent assessment wording and common-oral instructions should be reconciled narrowly.

## Mock and task results

| Task | Excellent | Simple/medium | Error-heavy | Scale |
|---|---|---|---|---|
| Italian mock | 96 | 79 | 50 | /100 |
| German mock | 96 | 75 | 53 | /100 |
| Polish mock | 95 | 72 | 64 | /100 raw |
| French conversation/document | 80 | — | — | /80 |
| Italian roleplay | 25 | 21 | 16 | /25 |
| Italian picture narrative | 25 | 15 | 16 | /25 |

Full marks were possible. Integrated mock ordering held. Italian narrative ordering failed: the correct short narrative scored 15/25, while the shorter error-heavy narrative scored 16/25. Both scores repeated in targeted tests.

Correct: “Marco va al supermercato. Trova un portafoglio e lo porta alla cassa. La signora arriva e ringrazia Marco. La storia finisce bene.”
Error-heavy: “Marco andare supermercato. Lui trova portafoglio. Signora arriva e lui dare portafoglio. Lei contento.”

Both communicate the basic plot. The model suggested changing the coherent present-tense narrative to a past tense and adding imagined character details. These should not become arbitrary requirements.

## Findings before release

- **German false corrections:** “Nach den Prüfungen möchte ich studieren” was corrected despite an explanation admitting it was acceptable. The current filter misses that wording. The full mock lists “es war gut” → “es hat mir sehr gut gefallen” as a correction based only on naturalness; its renderer uses `corrections` directly and bypasses the shared filter.
- **Polish accuracy:** “nauczyciel jest mili” was changed to “nauczyciele są mili”, with an explanation incorrectly calling `nauczyciel` plural. The noun is singular; do not silently assume a different intended number. Another correction selected feminine first-person past forms without gender evidence.
- **Advice quality:** some vocabulary suggestions remain unnecessary or change meaning/register. Some summaries still claim spoken fluency or inaccurately identify verb tenses. A fixed transcript disclaimer does not make those statements accurate.
- **Consistency:** address the Italian narrative reversal and clarify common oral calibration against teaching support. Investigate the French error-heavy variation without forcing exact marks or converting generic percentages.

The Italian e/ed suggestion still appeared in raw output but was removed by the display filter. “Mi piace l’italiano” was generated correctly throughout these tests. Filtering an error does not necessarily remove related unsupported summary criticism.

**Recommendation:** keep PR #19 in preview. Agree narrow fixes and rerun affected cases. Preserve the approved Spanish calibration and Gemini model; do not rewrite the full language prompts.

## Italian documentary check

The [SEC 2024 instructions](https://www.examinations.ie/misc-doc/EN-EX-7853827.pdf), linked by the [Association of Teachers of Italian](https://www.ati-ireland.ie/leaving-certificate-information), were downloaded and read. They confirm the three compulsory sections and selection from three roleplays and three picture sequences. **They contain no numerical allocation.**

The [official 2026 assessment arrangements hosted by Oide](https://oide.ie/wp-content/uploads/2025/10/Assessment-Arrangements-For-Junior-Cycle-and-Leaving-Certificate-Examinations-2026.pdf), pp.42–43, retain those sections at both levels and selection from three prepared cards/sequences. They do not print component marks.

The exact 50+25+25 allocation is explicit in the [historical SEC report](https://diazilla.com/doc/345612/italian---state-examination-commission) and corroborated by [Studyclix's Italian guide](https://blob-static.studyclix.ie/cms/media/ad5fslth/how-to-get-a-h1-in-leaving-cert-italian.pdf), pp.3–4. The guide's document date is not established and its five-card selection advice is outdated. Use it only as secondary corroboration of allocation.

Newer official documents corroborate structure, not the exact numerical allocation. Current numeric examiner guidance remains desirable. No evidence found justifies replacing the existing practice scales with an invented alternative.
