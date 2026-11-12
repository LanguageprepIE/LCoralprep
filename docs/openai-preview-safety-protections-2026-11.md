# LCorals: proportionate content safeguards (OpenAI preview only)
Date: 12 November 2026. Draft implementation — **not cleared for under-18 access or production release**.

## Scope
- Existing public Gemini production is unchanged. These checks are on OpenAI Deploy Previews only.
- No student data is collected by tests. Unit tests simulate fictional inputs and mocked moderation responses.
- Browser age selection for **18+ only** is remembered via `sessionStorage` for the current tab/session, so switching themes, levels or languages does not repeat the prompt.
- Under-18 guardian declaration is a *non-activating prototype*. It is NOT stored and does not establish verified parental authorisation. We must separately design a once-per-session, appropriately evidenced permission flow before enabling ages 16–17.

## Current moderation
- The Netlify function requests **inline** `omni-moderation-latest` input/output classifications in the same OpenAI Responses API call; it inspects them **before showing feedback**. The model has already processed the input when inline results become available (unlike pre-flight moderation).
- Checks stop the AI request on `self-harm/intent`, `self-harm/instructions` (show support guidance), or `sexual/minors` / `illicit/violent` (safe refusal). Missing or errored inline moderation results fail closed for the preview and preserves student text in the browser.
- Flagged `harassment`, `self-harm` without intent, or other general categories do **not** automatically block exam discussion. A school topic can mention bullying, mental health, difficult family situations or social issues legitimately.
- No raw content, classification scores, model outputs or moderator responses are written into the application's diagnostic logs.

## Important limitations and release blockers
1. The moderation model is a probabilistic classifier; it can produce false positives/negatives. A fiction/history/third-person response could be classified as a personal emergency. We need multilingual adversarial tests, browser QA and review of false positives.
2. The current safety support screen links users to trusted adults or help, and 112/999 for immediate danger in Ireland; it is not monitored, cannot alert a named school/guardian, and must not pretend to provide crisis intervention.
3. Current safety check moderates the **entire prompt**, not only the student's answer. Prompt templates may change model classifications. This should be refined and benchmarked before production.
4. The first standalone-moderation implementation failed a live preview smoke check (`SAFETY_UNAVAILABLE`); we replaced it with documented **Responses inline moderation** to avoid separate requests and a potential moderation-specific throughput bottleneck. The live inline integration must pass before declaring this implementation operational. Limits and latency still need measurement before 100+ simultaneous students.
5. The preview's age header remains spoofable. Under-18 access is still blocked in our intended UX, but this is not verified age assurance.
6. Consent is not complete; no safeguarding escalation owner/incident handling, incident-response and retention procedure or legal/privacy signoff yet. Do not merge the PR.
7. The existing five language prompts are inconsistent in incidental safety wording. Review multilingual outputs without diluting assessment rubrics.
8. A missing or invalid inline moderation result makes preview feedback unavailable rather than silently displaying unchecked student text; clear retry messaging is required.
9. Confirm support for the inline moderation feature with `gpt-6-luna` in a live preview request; do not weaken the safety guard to make a smoke test pass.
10. Periodically review thresholds, costs, API limitations, and deployment concurrency.

Documentation:
- https://developers.openai.com/api/docs/guides/moderation
- https://developers.openai.com/api/docs/models/omni-moderation-latest
- https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
