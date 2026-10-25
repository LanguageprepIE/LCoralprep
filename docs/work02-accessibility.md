# Work 02 — Accessibility and interface

Base: `main` at `2982ec33a44aa16110f6a8aa79f1f33fbadaa1f8` (verified against GitHub on 25 October 2026).
Reference: `LCorals_Work01_Auditoria_2026-10-25.md`, findings A01–A06, read and checked against the source before editing.

## Changes

- Native buttons replace the static roleplay and picture selectors in ES/DE/IT, retaining their handlers and labels.
- Irish poem and Sraith selectors are also generated as native buttons. This additional A01 case was confirmed in source.
- All seven module pages and the homepage feedback form have persistent, associated labels for previously unlabelled textareas. Existing labelled setup fields are preserved. Response fields reference their unchanged task context.
- Shared `accessibility.js` synchronizes pressed and expanded states from existing UI classes and visibility, including dynamically generated choices. It does not wrap or replace educational functions, call AI, change task variables, add network access, or alter marks.
- One existing-before-update polite status region announces brief loading/activity/result messages. Keyboard actions can focus a question or score reading target; touch/pointer actions retain focus. The adapter does not focus response inputs or interrupt a focused editing field. Rebuilt keyboard controls can regain equivalent focus without being clicked again. Full chat/feedback contents are not made live, because the app often reconstructs the chat with `innerHTML +=`.
- The German full mock loading panel uses the shared brief announcer instead of a second live region. Its visible loading content is unchanged; the existing setup-error alert remains.
- Shared focus outlines include a forced-colors variant. Roleplay audio/label/response/send controls stack vertically so adding a persistent label cannot become an extra column. Narrow layouts permit wrapping of selector controls and one-column study grids without hiding content.
- Removed zoom limits from DE/GA.
- Darkened insufficient control text/background colors within the original palettes: ES/IT hints, ES mock gradient, FR active HL, IT active HL/activity selection, GA active tab/level/mode/activity and mock gradient, EAL send button. The new colors checked in tests meet at least 4.5:1 against their corresponding white text/background. This is not a claim that every pre-existing color on the site is AA compliant.

## Changes by module

| Module | Specific changes beyond the shared adapter/labels/focus |
|---|---|
| ES | Native roleplay choices; darker hint and mock button; stacked roleplay form |
| FR | Labelled document-description and answer fields; darker active HL |
| DE | Native roleplay/picture choices; labelled full mock response; unrestricted zoom; single loading announcer |
| IT | Native roleplay/picture choices; darker hint and green selected controls |
| PL | Preserved General/Discussion and official-weighting distinction; labels and shared state/announcements |
| GA | Native generated poem/Sraith choices; unrestricted zoom; darker selected controls; repaired missing hint handler |
| EAL | Preserved Basic/Advanced and native-language selector; labels and shared states; darker send control |
| Homepage | Persistent feedback label and shared focus styles; no change to Formspree submission |

## Small behavioral differences to review

1. Keyboard users receive a reading focus target when a question/result changes, rather than being left at a removed control. Touch users do not receive new automatic input focus from the adapter. Existing audio code that focuses an input is unchanged.
2. Hints, instructions, levels, modes and selected activities expose their state to assistive technology. No new hints are made available during mocks.
3. The GA hint button previously called nonexistent `toggleHint()`. Added that function to open/close the existing `hintBox`; no hint content or availability rule changed.
4. The roleplay form is stacked vertically; small-screen tabs/modes may wrap rather than forcing horizontal page overflow.

## Preserved scope

No changes to the Gemini function/model/configuration, original module scripts except the two Irish element types and missing hint toggler, `oral-scoring.js`, prompts, data banks, questions, roleplay content, mock logic, default levels, point distributions, provider integration, privacy policy, production domain or deploy configuration. No new runtime dependencies, accounts, persistence or services. No production deploy or merge is part of this work.

## Validation completed

- `LCORALS_JSDOM_PATH=/tmp/lcorals-work02-test/node_modules/jsdom node --test tests/*.test.cjs`: **15 passed, 0 failed, 0 skipped**, including the existing scoring and feedback-review suites.
- The optional DOM tests run the original module code with synthetic AI replies and disabled network. They cover all seven modules, both difficulty choices, persistent names, pressed/expanded/busy states, question/result focus, non-interruption of typing, roleplay input/turn progression, DE/IT pictures, Irish poem/Sraith controls, complete ES/FR/DE/IT/PL/GA mock routes with preserved score contracts, and recovery of the existing submit control/typed text after simulated failure.
- DOM visibility is simulated because jsdom has no layout; those tests are not described as native keyboard or reflow tests.
- `tests/accessibility-browser.cjs` executed against local static files using **headless Chromium 153**: **149 assertions**, **7 synthetic API requests**, **0 real AI requests**, **0 page errors**. All third-party requests were blocked; AI requests were fulfilled locally with synthetic JSON.
- Chromium checks include real Tab/Enter/Space activation, selected states, question/result focus, accessible labels, visible focus outline, busy transitions, roleplay and picture selection, and page widths 320/375/768/1024 CSS px. No horizontal page overflow in the checked question, roleplay and mock setup states. These are viewport sizes in Chromium, not physical device tests.
- Contrast calculations use WCAG relative luminance; new normal-text control colors meet 4.5:1 in the pairs asserted by the tests.
- No restrictive viewport metadata remains in the seven modules.
- `git diff --check` passes. The local ES question screenshot was visually inspected; identity and task content are retained. External fonts/emoji in that isolated test environment can render differently from user devices.

## Reproducing optional tests

No test engine is loaded by production. Existing suites and static accessibility checks require Node only. DOM/browser tests need temporary development tools installed outside this repository:

```sh
npm install --prefix /tmp/lcorals-work02-test jsdom playwright
LCORALS_JSDOM_PATH=/tmp/lcorals-work02-test/node_modules/jsdom node --test tests/*.test.cjs
LCORALS_PLAYWRIGHT_PATH=/tmp/lcorals-work02-test/node_modules/playwright node tests/accessibility-browser.cjs
```

Install Chromium through Playwright if it is not available. The browser runner also accepts `LCORALS_CHROMIUM_EXECUTABLE` for an existing test-only binary. In this run the standard browser download failed; a temporary Chromium binary from the npm package `@sparticuz/chromium` was used. No browser package or binary is included in the repository.

Without `LCORALS_JSDOM_PATH`, optional DOM tests are explicitly skipped, not reported as passed. Browser tests are a separate explicit command.

## Pending manual validation / limits

- VoiceOver on iOS/macOS and NVDA on Windows: announcement order, voice language and focus behavior with actual screen readers. Inspect repeated same-text announcements and speech-synthesis coexistence.
- Safari on physical iPad/iPhone, Android dictation and physical Windows/Firefox. Chromium viewport tests do not prove those combinations work.
- Native pinch zoom, 200–400% browser zoom, personalized text spacing and forced-colors rendering. Metadata and CSS support are checked, but these manual experiences are not certified.
- Real Gemini output is deliberately not tested in this phase. Synthetic results exercise rendering and orchestration, not model quality.
- The remaining audit findings outside A01–A06 (security, provider terms, privacy, image optimization, etc.) remain outside this PR.

This work does not establish complete WCAG 2.2 AA conformance. Teacher review of the preview is required before merging.
