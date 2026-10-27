# IRS e-file provider authorization — user-supplied evidence (2026-10-08)

## Source and handling

Four photographs of the IRS e-file application/provider-options screen were supplied by the authorized operator in the ChatGPT conversation on 2026-10-08. This record captures **only nonsecret status assertions visibly supported by the screenshots**. The original photographs are **not committed**: they contain taxpayer-identifying/firm details and IRS identifiers. Keep any full-resolution evidence in a restricted compliance repository or encrypted document store, not this public source repository. Do not copy EFIN, ETIN, TIN, phone, address, credentials, certificates or sensitive personal data into code, commits, CI logs, or public documentation.

Evidence is a dated screenshot supplied by the operator, **not** a live IRS authorization/API response and **not** proof of ATS approval.

## Observed IRS application statuses

| Item | Status visible in supplied screenshot | Meaning for implementation |
| --- | --- | --- |
| Firm suitability | Completed | Do not repeatedly ask operator to obtain basic suitability approval. |
| Responsible individual suitability and fingerprint status | Completed | Record completed onboarding, without exposing identifying information. |
| Terms of Agreement | Signed | Existing authorization evidence; revalidate if IRS changes status. |
| Electronic Return Originator (ERO) provider option | Accepted | ERO registration shown; **not** software ATS certification. |
| Software Developer provider option | Accepted | Software Developer option shown; **not** proof each TY2026 software package passed ATS. |
| Transmitter provider option | Accepted | Transmitter provider option shown. |
| EFIN | Active | Record identifier in an encrypted, appropriately restricted production config only. |
| ETIN — production (Transmitter) | Active | Production-designated ETIN exists; do not infer production MeF connectivity or schema/ATS acceptance. |
| ETIN — test (Software Developer) | Active | Test-designated ETIN exists; suitable for validating access through approved IRS ATS procedures. |
| Forms Transmission Status | Test | **Critical**: visible screen explicitly says TEST; do not claim live forms transmission approval. |

### Identifiers and configuration

- The operator states they also possess an SBIN and other needed filing/software identifiers. SBIN is **operator-reported**, not independently demonstrated by these particular IRS screenshots; validate separately for EPS product enrollment.
- Never hardcode identifiers or access tokens. Map required role-specific EFIN/ETIN/Software ID identifiers into secret-backed configuration with masked health indicators (configured/missing only).
- Verify actual provider roles and forms against IRS system records before sending live submissions.

## ATS and EPS acceptance work still required

1. Inventory the **real** tax application code, deterministic calculations, IRS XML builder, validators, manifest/attachments, transport adapters and acknowledgment handling in this repository; document actual tests, not intentions.
2. Obtain the applicable official TY2026 IRS MeF XML schemas/business rules, ATS scenarios, A2A service contracts/certificates and validate locally before any IRS test submission.
3. Verify ATS authentication/handshake using test-designated authorization and run prescribed ATS cases; capture submission IDs, reject codes and authentic IRS acknowledgments in restricted evidence. Do not mark as accepted based on local transport/export alone.
4. Keep **Forms Transmission Status: Test** as the current observed status until independently refreshed from IRS. No production transmission unless the required ATS/form/software approval, endpoint, credentials, schema validity and affirmative operator authorization have been verified.
5. Obtain EPS software-provider onboarding specification, certification credentials/environment, consent artifacts, bank-product codes and certification cases from EPS directly. ERO/ETIN status does not establish EPS partner certification.
6. Replace narrative-only synthetic demo *for the application's operational workflow* with authenticated real-data intake, confirmed OCR, persisted returns, calculations, diagnostics, consent and auditable provider status **without using real taxpayer data for ATS certification**. Retain synthetic/test fixtures in automated and provider certification tests.
7. Separate read-only readiness from actions; never automatically submit, request advances, or change production activation based only on this document.

## Verification record

- Recorded 2026-10-08 from four operator-supplied screenshots.
- IRS live lookup: **not performed**.
- ATS tests and official acknowledgments: **not yet evidenced**.
- EPS live certification: **not evidenced**.
- Source screenshots: **not stored in public repository**.

This file is a durable onboarding/evidence index, not a claim that IRS or EPS integration is production-certified.
