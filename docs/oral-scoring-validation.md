# Preview validation — 6 October 2026

Tested commit: 722a59e218d0f7c0e38bb9955b51c4b58f88d776, PR #19. No production merge.

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
