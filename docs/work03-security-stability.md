# Work 03 — Security and stability

Base: current `main`, commit `5fd37022c38142771860d07580fa20ea30aab9d8`, including merged Work 02 / PR #23. Work 01 was read from the available audit report and all changes were confirmed against this source before editing.

## Confirmed problems and fixes

### S02: untrusted HTML

Confirmed direct HTML interpolation in DE/EAL student roleplay replies; FR document corrections; DE picture corrections; GA conversation/Sraith corrections; EAL native-language feedback and corrections. ES/IT/PL already used escaping or DOM text in most corresponding routes; those protections remain.

- Plain-text values now use the existing escaping pattern (or the same shared escape helper). Fixed template markup, labels, bold corrections, line-through originals and feedback content are preserved.
- GA/EAL study help deliberately requests HTML. Its prompt is unchanged. `security.js` parses the reply into an **inert template** and reconstructs an **attribute-free HTML-only allow-list** of formatting elements into a new tree. No untrusted element is adopted into the document. Unsupported/executable/foreign elements are displayed as literal text, not executed. This is a DOM reconstruction, not a regex XSS blacklist. No runtime library or service was added.
- Shared CSS preserves line breaks in escaped corrections, learner bubbles, EAL feedback and formatted study output. It only appends rules to Work 02's stylesheet.
- Error strings inserted into HTML are escaped and use controlled messages.

No public-site penetration test was performed. XSS payloads were used only in isolated DOM/Chromium fixtures, with networking blocked or fulfilled locally.

### S01: request validation, not a new quota system

The existing Lambda-compatible function and model URL are preserved. The server now requires POST/JSON with the actual text-only request shape. It validates objects, arrays, text types, non-empty values and optional user/model roles, and rejects unrecognized configuration/media fields.

- **1 MiB UTF-8 maximum for the entire serialized request**, including instructions, all mock responses and review context. There is no new per-answer textarea limit. A complete long synthetic HL/mock prompt is tested verbatim. This is deliberately far above normal oral-answer lengths.
- At most 64 content items and 64 parts per content item. Current clients send one content item with one prompt text part.
- Invalid/oversized requests fail before any provider fetch.
- No model, API key, provider limit, output generation setting or token configuration changed. No daily/monthly/IP quota, CAPTCHA, authentication or paid security service was added.

The user's existing Google rate limits, prepaid balance and disabled auto-recharge were supplied as context, not independently verified from the account. This patch does not depend on the approximate quota numbers as code constants.

### Safe errors and deadlines

Previously Google errors were returned with HTTP 200, raw internal errors could be exposed, and clients assumed a first candidate/text part always existed.

- The endpoint now returns controlled JSON errors and appropriate statuses: malformed input 400/415, size 413, quota 429, unavailable/auth/billing/provider errors 502/503, timeout 504. Provider error bodies, keys, URLs, stack traces and billing details are not relayed.
- Empty, blocked, malformed or unfinished candidate responses are rejected. Multiple text parts are concatenated without altering their text. Only the existing minimal text-candidate contract is sent to the browser.
- A 45-second server deadline and 55-second client deadline abort stalled fetches. These are application wait limits, not changes to Gemini generation settings. Deadline behavior was simulated in tests; production latency was not measured.
- All seven existing `callSmartAI` functions delegate to a shared request helper loaded before the module script. It validates response shape and presents safe messages for quota, connectivity, temporary unavailability, oversized request and incomplete output.
- No new automatic retries. Existing once-only JSON repair and feedback-review behavior are preserved with byte-identical prompt text.
- Malformed legacy feedback/roleplay data is rejected before screen transitions. Existing numeric scoring calculations remain unchanged; this validation does not invent a zero mark for an absent score.

Existing error recovery normally keeps typed text and accumulated mock responses in memory; tests confirm the affected paths retain responses and re-enable controls. No storage, accounts or persistence was introduced. Reloading/closing a page can still lose its in-memory work.

## Files

- `netlify/functions/gemini.js`: validation, safe HTTP errors, provider-response checks and timeout.
- `security.js`: shared browser transport, controlled errors, data-shape checks and safe formatted-help renderer.
- `es/fr/de/it/pl/ga/eal/index.html`: one shared script include before the existing module script.
- The seven module `script.js` files: shared transport delegation, confirmed output sinks, structured-response checks and safe error messages. Changes do not touch educational data or prompt text.
- `accessibility.css`: three appended lines preserving line breaks and wrapping.
- `tests/accessibility.test.cjs`: loads the shared dependency in its existing fixture.
- `tests/security.test.cjs`, `tests/security-dom.test.cjs`, `tests/security-browser.cjs`, `tests/helpers/protected-content.cjs`, `tests/fixtures/work03-protected-content.json`: security and preservation regressions.
- This document.

## Validation completed

All provider replies, quota/prepayment-style errors and network failures below were **simulated**, not produced by a real Google account.

- **29 Node/DOM tests passed, 0 failed, 0 skipped**, with the temporary jsdom/Acorn test tools enabled. Includes the existing scoring and feedback-review suites, Work 02 accessibility regressions, complete mock routes for ES/FR/DE/IT/PL/GA, XSS routes, malformed input/output, long legitimate requests, safe errors, timeout and answer retention.
- **149 Chromium accessibility assertions passed** against local files: keyboard, selected/expanded/busy states, persistent labels, question/result focus, and checked layouts at 320/375/768/1024 CSS px. Seven synthetic API requests; no real API requests or page errors.
- **80 Chromium security assertions passed** in an isolated `.invalid` origin: actual student/AI sink routes, preserved study formatting, eight HTML/foreign-namespace/attribute vectors, and eight HTTP/network/malformed-response scenarios. 18 synthetic requests, no real API requests, no page errors and no payload execution.
- SHA-256 snapshots generated from the base commit verify the shared scoring/rubrics, `accessibility.js` and privacy page remain byte-identical. Acorn syntax-tree extraction verifies the exact prompt expressions, assessment builders, criteria/calibration initializers and educational data initializers of all seven modules, rather than comparing only a few visible prompt fragments. The snapshot contains hashes and counts, not student data or secrets.
- `git diff --check` and JavaScript syntax checks pass.

### Reproduction

Temporary development tools are outside the repository and are never loaded by the website:

```sh
npm install --prefix /tmp/lcorals-work03-test jsdom acorn playwright
LCORALS_JSDOM_PATH=/tmp/lcorals-work03-test/node_modules/jsdom LCORALS_ACORN_PATH=/tmp/lcorals-work03-test/node_modules/acorn node --test tests/*.test.cjs
LCORALS_PLAYWRIGHT_PATH=/tmp/lcorals-work03-test/node_modules/playwright node tests/accessibility-browser.cjs
LCORALS_PLAYWRIGHT_PATH=/tmp/lcorals-work03-test/node_modules/playwright node tests/security-browser.cjs
```

Install the Playwright browser or pass `LCORALS_CHROMIUM_EXECUTABLE` pointing at a test-only Chromium. This run used headless Chromium 153 from the temporary npm package `@sparticuz/chromium`. No package manifest, runtime dependency or binary was added to LCorals.

Without the optional environment paths, DOM/Acorn tests explicitly report skipped, not passed. Core server/client tests use Node's built-in test runner and mocked fetch.

## Residual risks / manual checks

- The endpoint remains public. Shape/size checks do not identify a student or stop another client making otherwise valid requests within Google's limits. Existing prepaid/quota controls are not a guarantee of availability for a class. Stronger identity or abuse controls would require a separate teacher-approved design; none was added.
- Google quota and prepaid exhaustion may have different HTTP/status details. Tests cover 400/401/402/403/429/5xx mappings, but the actual account, balance and production error responses were not inspected or exhausted.
- No real Gemini call was needed to validate this patch. Production model output quality, real latency and the platform's deployed timeout behavior remain operational checks, not simulated-test conclusions.
- VoiceOver, NVDA, Safari on physical iPad/iPhone, Android dictation, native zoom and forced-colors remain manual checks from Work 02. Existing accessibility logic was preserved and its automated regression suite passes.
- Unsupported model-generated markup appears literally; ordinary paragraphs, bold/emphasis, examples, lists, code and tables retain formatting. Inspect a normal GA/EAL study-help example in the preview; it does not require changing its prompt.
- Work 01 provider-terms/privacy/SEO/performance items outside this security scope remain separate. No provider migration, payments, subscriptions or legal-copy changes.

Teacher review of the PR and preview is required before merging. No direct production deployment is authorized by this work.
