> **Updated design decision (12 November 2026):** In the OpenAI preview, the age declaration now accepts 16–17-year-olds who confirm that they already have parental/guardian permission (session-scoped; not independently verified). Routine wellbeing flags can show an optional Childline/Samaritans notice while preserving feedback. The high-risk interventions listed below remain; this is not an emergency service. End-to-end UI and legal/privacy release gates remain open.

# LCorals.ie — incident handling and safeguarding procedure (draft)
Date: 12 November 2026
Status: prepared on **work-06-openai-preview** only. Not a legal compliance certificate; no rollout to minors.

## Purpose and scope
A lightweight procedure for an educational **practice** website without student accounts, staff supervision, identifiable student profiles, continuous monitoring or guaranteed response times. The operator must not promise to identify a student or contact their family/school based on an anonymous AI session.

## How a learner can report an issue
- Learners find **Safety and reporting** from the homepage footer and Privacy & AI page.
- The page includes voluntary reporting through the **existing Formspree endpoint**, not a new database or account system. The reporter presses Send report; the web app does **not** automatically upload transcripts, AI outputs or safety-classification results.
- The page asks for **minimal context only** (language, mode, what went wrong), discourages names, contact details, transcripts and sensitive personal data, and links to privacy information.
- A submission is **not** an emergency alert and is not monitored continuously. Without user contact details, replying may not be possible.
- No automatic notification is made to schools, guardians, teachers or emergency services.
- For an actual disclosure to a teacher, that teacher should use their school's child-protection/safeguarding procedures (not this web feedback form).

## User-visible responses
| Condition | User-facing behavior | AI response handling |
| --- | --- | --- |
| Ordinary safe exam answer | Normal practice and feedback | Continue |
| Bullying, exam anxiety, family issues, wellbeing **as educational topics** | Normal practice unless another high-risk classification is triggered | Continue; no blanket prohibition |
| High-risk self-harm intent/instructions classification | Pause grading; suggest trusted adult/qualified help and Irish emergency number 112/999 if immediate danger | No grade shown |
| High-risk sexual-minors / illicit-violent classification | Pause practice; acknowledge possible classifier mistake; link to safety page | No grade shown |
| Unsafe Luna output | Withhold output, show non-alarmist error and support/reporting route | Never display the unsafe generated text |
| Missing/failed moderation classification | Fail closed and suggest retry later, preserve user input within the relevant frontend flow | No output displayed |
| Technical error / rate limit | Ordinary retry guidance, no safeguarding implication | No false emergency claim |

**Important:** the app evaluates AI moderation fields on the *entire constructed prompt* and final model output. This may produce false positives; real-world sensitivity and specificity are not validated by the current five harmless-case tests. The moderation results are obtained **inline** with Luna, so model processing already occurs even when feedback is withheld.

## Operator procedure when a report arrives
1. **Triage without forwarding the student transcript.** Read the minimum voluntary description and classify as:
   - **Urgent real-world safety concern:** If the report contains credible, actionable details of immediate danger, prioritize appropriate emergency/safeguarding channels; do not assume location, identity or ability to intervene.
   - **Serious product-safety/privacy issue:** Unsafe output, exposure of personal information, security flaw or repeated dangerous behavior. Consider temporarily disabling the affected preview feature, preserving *redacted* evidence needed for debugging, and contacting relevant service provider and appropriate expert where warranted.
   - **Incorrect safety block / ordinary bug:** Record topic/mode, reproduce with synthetic examples, check false positives and fix with regression tests.
2. **Minimize data.** Do not request a student's full answer, identifying details or sensitive disclosure. If a report contains such data unexpectedly, limit access, avoid copying it into GitHub issues/logs, and review whether deletion, breach assessment or notification obligations arise.
3. **Escalate appropriately.** A real pupil concern reported to a school belongs in the school's safeguarding channel. For potential data breaches, evaluate GDPR notification rules with competent guidance; don't assume every error is a reportable breach.
4. **Fix and regression-test in draft PR.** Use synthetic cases for all five languages and all key modes; verify ordinary exam answers still work, check incident messages and accessible links.
5. **Review before deployment.** Do not merge if a safety or privacy regression remains unresolved. After a material incident, consider pausing affected practice rather than silently dropping safety checks.
6. **Periodically review:** triage the submitted feedback when available, check failures by category **without logging prompts or student data**, maintain a short change/decision log and revisit the safeguarding approach as usage grows. No continuous human monitoring or guaranteed response time is promised.

## Minimum evidence / release blockers
- [x] A privacy-aware, voluntary incident form already exists; linked from an explicit support page.
- [x] Safety page states no emergency monitoring/automatic contact and gives Irish emergency numbers.
- [x] Inline moderation and high-risk branches exist in the preview backend; automated tests cover synthetic responses.
- [x] Five benign sensitive-topic multilingual calls passed on 12 November 2026 (workflow run 43228289703).
- [ ] Manual browser accessibility testing of the page, dialog, and language-specific error displays.
- [ ] Multilingual adversarial testing of real high-risk *classifications*, not only mocked data.
- [ ] Establish the actual operational owner for reviewing Formspree messages, safeguarding escalation and data retention. Do not present 24/7 support.
- [ ] Complete parental permission validation, privacy/legal review, data governance and age controls before minor access.
- [ ] Run smoke tests in Conversation, Study and Mock Exam across languages before merging.
- [ ] Assess third-party Formspree retention/access permissions and data incidents before release.

## Change-management principles
- Keep production and PR #27 separate; never auto-merge.
- Prefer the existing reporting form and static page over accounts, tracking, new vendors or automatic capture.
- Treat moderation scores as fallible classifications, not proof that a student is in crisis.
- Avoid changing grades, oral rubrics or classroom exercise content in the name of safety.
- Keep the once-per-session age declaration. The *parental* declaration is still only a non-activating prototype; it must not be described as completed or verified.

References: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance ; https://www.dataprotection.ie/ ; https://www.tusla.ie/children-first/
