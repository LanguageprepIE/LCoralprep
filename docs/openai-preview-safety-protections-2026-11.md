# LCorals: proportionate content safeguards (OpenAI preview only)
Date: 12 November 2026. Draft implementation — **not cleared for under-18 access or production release**.

## Scope
- Existing public Gemini production is unchanged. These checks are on OpenAI Deploy Previews only.
- No student data is collected by tests. Unit tests simulate fictional inputs and mocked moderation responses.
- Browser age selection for **18+ only** is remembered via `sessionStorage` for the current tab/session, so switching themes, levels or languages does not repeat the prompt.
- Under-18 guardian declaration is a *non-activating prototype*. It is NOT stored and does not establish verified parental authorisation. We must separately design a once-per-session, appropriately evidenced permission flow before enabling ages 16–17.

## Current moderation
- The Netlify function calls the free `omni-moderation-latest` endpoint to classify the entire prompt **before** forwarding it to Luna, then classifies model output **before** rendering it.
- Checks stop the AI request on `self-harm/intent`, `self-harm/instructions` (show support guidance), or `sexual/minors` / `illicit/violent` (safe refusal). A moderation service outage fails closed for the preview and preserves student text in the browser.
- Flagged `harassment`, `self-harm` without intent, or other general categories do **not** automatically block exam discussion. A school topic can mention bullying, mental health, difficult family situations or social issues legitimately.
- No raw content, classification scores, model outputs or moderator responses are written into the application's diagnostic logs.

## Important limitations and release blockers
1. The moderation model is a probabilistic classifier; it can produce false positives/negatives. A fiction/history/third-person response could be classified as a personal emergency. We need multilingual adversarial tests, browser QA and review of false positives.
2. The current safety support screen links users to trusted adults or help, and 112/999 for immediate danger in Ireland; it is not monitored, cannot alert a named school/guardian, and must not pretend to provide crisis intervention.
3. Current safety check moderates the **entire prompt**, not only the student's answer. Prompt templates may change model classifications. This should be refined and benchmarked before production.
4. A pair of separate moderation calls adds latency and counts against the moderation model's separate RPM/TPM; **Build currently publishes 500 RPM and 20,000 TPM for omni-moderation-latest**. This can bottleneck 100+ simultaneous students even if Luna permits 5,000 RPM / 2M TPM. For a national-scale launch, explore Responses API inline moderation, or safely restrict moderation inputs to the student's actual short answer. Never assume free moderation means unlimited throughput.
5. The preview's age header remains spoofable. Under-18 access is still blocked in our intended UX, but this is not verified age assurance.
6. Consent is not complete; no safeguarding escalation owner/incident handling, incident-response and retention procedure or legal/privacy signoff yet. Do not merge the PR.
7. The existing five language prompts are inconsistent in incidental safety wording. Review multilingual outputs without diluting assessment rubrics.
8. A disabled moderation endpoint makes preview feedback unavailable rather than silently processing unchecked student text; clear retry messaging is required.
9. Confirm actual OpenAI moderation API permissions in the project's scoped key before live testing.
10. Periodically review thresholds, costs, API limitations, and deployment concurrency.

Documentation:
- https://developers.openai.com/api/docs/guides/moderation
- https://developers.openai.com/api/docs/models/omni-moderation-latest
- https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
