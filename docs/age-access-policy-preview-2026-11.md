> **Updated design decision (12 November 2026):** The earlier 18+-only and guardian-facing *prototype* descriptions below are historical. The current OpenAI preview supports a 16–17-year-old's **own explicit attestation** that they already have parental/guardian permission. It remembers the selection once per browser-tab session. No parent account, ID or DOB is collected. This is not verified permission, and is not a legal compliance certification. Under-16s remain outside the intended audience. **The public site is unchanged.** Age protection and legal/privacy review are still required before merging.

# LCorals.ie — provisional age-access policy (Deploy Preview only)

Date: 12 November 2026. This is an interim engineering safeguard, **not a legal compliance certification**.

## Intended audience

LCorals is designed for Irish Leaving Certificate students. Some are under 18.
The target for future access is **16 and over**, subject to completed minor-safety
controls, privacy disclosures, and verification of an appropriate legal basis.

| Declared age | Deploy Preview behaviour in phase 1 |
| --- | --- |
| Under 16 | Not eligible to submit AI practice |
| 16–17 | Temporarily not eligible while safeguards/consent pathway are unfinished |
| 18+ | Eligible for AI practice after declaring age band |

No names, exact birth dates, account registrations, or documents are requested
by this age dialog. The selection is not persisted across pages.

## Technical scope

- The age-band dialog is in the shared `security.js` AI request pathway.
- The Netlify OpenAI Deploy Preview endpoint requires the
  `X-LCorals-Age-Band: 18-plus` header before it will call the provider.
- Existing public production is **unchanged** and continues to use Gemini.
- The header is **self-declared, not cryptographically protected or verified**:
  it can be forged. These controls deter accidental underage access but must
  not be described as robust age verification.
- The age access mechanism must be reassessed when production is switched to
  OpenAI. Hostname-based preview checks alone will NOT protect a future public
  deployment.

## Compliance caveats and next steps

1. In Ireland the digital age of consent is 16 **when consent is the lawful
   basis** for processing under GDPR Article 8; it is not a universal minimum
   age for internet use. Establish LCorals' lawful basis and identify all data
   controllers/processors.
2. OpenAI's Under-18 API guidance requires reasonable age-appropriate
   safeguards. A 16–17 user remains a minor.
3. Confirm and implement the intended 16–17 consent/disclosure flow, including
   whether a parental permission statement is appropriate/required.
4. Implement age-appropriate content handling, reporting/escalation, and
   monitoring before enabling 16–17 AI requests.
5. Update privacy notices to accurately explain OpenAI, Netlify, analytics,
   other third-party recipients, and retention. Verify Zero Data Retention
   requirements before contemplating under-16 access.
6. Complete functional, accessibility, and safe-failure review of the dialog
   in a browser before merging. Include direct-API misuse review.

Sources:
- https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
- https://www.dataprotection.ie/sites/default/files/uploads/2023-04/DPC_ChildrensData_ParentalConsent.pdf
- https://www.irishstatutebook.ie/eli/2018/act/7/section/31/enacted/en/html

## Phase 2 — draft guardian declaration (12 November 2026)

A parent/guardian-facing, accessible draft is now available under the `16–17`
choice on OpenAI Deploy Previews. It explains the educational use, AI
processing, privacy link, potential AI mistakes and avoidance of personal data.
A confirmation checkbox is deliberately required before its draft acknowledgement.

**This is not a finished parental consent mechanism.** No identity or
parent-child relationship is verified; no auditable consent evidence is stored;
no account, email, DOB or guardian details are collected. The UI does not
unlock teen AI access. The backend *still rejects* all non-`18-plus` age-band
headers, including forged `16-17-parent-declared` headers.

### Legal distinction to resolve

- The Data Protection Commission says Irish children aged **16 or 17 can
  generally give their own GDPR consent for information society services
  when consent is the appropriate lawful basis**, but remain minors under 18.
- OpenAI's Services Agreement separately prohibits allowing minors to access
  OpenAI services without parent or guardian consent. A contractual permission
  declaration cannot automatically be considered sufficient for GDPR compliance.
- This prototype alone does not prove the declaration came from a guardian.
  We need to decide if proportionate verification/confirmation is appropriate
  and document the decision before accepting any minor requests.
- The age check must not be represented as verified age assurance. Declaring
  `18-plus` in the browser can be falsified.
- Safeguarding (content controls and incident escalation), lawful basis, and
  applicable retention review still need completion before switching on 16–17.

Sources:
- https://openai.com/en-GB/policies/services-agreement/
- https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
- https://www.dataprotection.ie/sites/default/files/uploads/2023-04/DPC_ChildrensData_ParentalConsent.pdf
