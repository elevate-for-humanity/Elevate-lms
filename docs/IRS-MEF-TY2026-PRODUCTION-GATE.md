# IRS MeF Production Acceptance Requirements — TY2026

This document is a build gate for Supersonic Fast Cash. A configuration variable or database table is not evidence of IRS production readiness.

## Provider enrollment
- Firm must have a completed IRS e-file application with the applicable Software Developer and/or Transmitter provider options.
- Principal, Responsible Official, or authorized Delegated User must have the appropriate MeF authorities.
- Obtain/maintain the IRS identifiers and application-system enrollment required for the selected transmission channel.
- Software packages/forms being tested must be registered through the IRS ATS process.

## Schema and business-rule conformance
- Build each supported return from the IRS-issued TY2026 MeF XML schemas distributed through SOR.
- Validate generated XML locally against the exact schema version targeted for ATS/production.
- Run current IRS business rules/reject criteria before transmission.
- Version schemas/business rules; multiple IRS versions can coexist.
- Do not enable a schema version for production until IRS lists a valid production date.
- Track accepted forms/schedules and attachment requirements from the IRS published inventory.

## ATS certification gate
- Complete the IRS ATS questionnaire for each applicable form/package.
- Run the IRS-prescribed TY2026 ATS scenarios.
- Store submission IDs, acknowledgments, rejects, rule IDs and evidence for every test.
- Track ATS acceptance and production authorization/credentials as readiness status. Do not use this status to block development, XML generation, validation, or ATS testing.

## A2A transmission security
If Supersonic uses A2A:
- Implement the IRS A2A service contract/toolkit rather than inventing a proprietary endpoint.
- HTTPS transport.
- SOAP requests conforming to the IRS MeF service definitions.
- Strong Authentication using a valid X.509 digital certificate from an IRS-authorized certificate authority when required.
- Enroll/maintain the certificate/application through IRS Automated Enrollment.
- Include mandatory AppSysId in the MeF header.
- Implement required WS-Security/XML-Signature behavior from the IRS specification/toolkit.
- Validate IRS server certificates against the current IRS-published certificate chain.
- Monitor certificate expiration and block transmission when credentials are invalid.
- Never store certificate private keys/passphrases, EFIN/ETIN credentials, EPS credentials, or signature PINs in source control or ordinary database rows.

## Submission composition
- Follow IRS MeF Submission Composition Guide for message/return/attachment packaging.
- Generate required manifest/header values and unique identifiers.
- Use IRS-recommended PDF attachment names and allowed attachment types.
- Hash/sign/package data exactly as required by the applicable MeF service.
- Make submissions idempotent; retries must not create accidental duplicate filings.

## Acknowledgments and rejects
- Poll/receive acknowledgments using the supported IRS service.
- Persist receipt/submission identifiers and acknowledgment status.
- Parse reject/business-rule codes without losing the original IRS response.
- Present rejects to preparer/taxpayer as correctable issues.
- Never mark a return accepted merely because transport succeeded.

## Online-provider security/privacy controls
For online individual-return filing, implement the current Publication 1345 security/privacy/business standards, including:
- Current required TLS/SSL certificate standard.
- Weekly external vulnerability scanning by an approved scanning vendor where applicable; retain reports for the required period.
- Written information privacy and safeguard policies and required certification/seal requirements.
- Effective challenge-response/bot protections against bulk fraudulent filing.
- Public domain-registration requirements.
- Incident response/reporting requirements.
- Written Information Security Plan and safeguards for taxpayer data.

## Taxpayer/document controls
- Do not transmit a return before receiving required Forms W-2, W-2G and 1099-R, except where IRS rules permit Form 4852.
- OCR/imported tax-document values require human/taxpayer confirmation.
- Capture required taxpayer signatures/authorizations and retain them under applicable IRS rules.
- Log material return changes and the identity of the preparer/user making them.

## Supersonic production-readiness checklist
These checks report production readiness and guide testing. They do not disable software capabilities, ATS testing, XML generation, validation, return preparation, or development workflows. Actual IRS production transmission requires the applicable IRS production endpoint, credentials, certificate/enrollment, and authorization when the operator chooses to transmit.

Production readiness should verify:
1. Correct provider roles/MeF authorities are active.
2. Required IRS identifiers and A2A/IFA enrollment are active.
3. Current schema/business-rule package is installed.
4. Local schema + business-rule validation passes.
5. ATS scenarios required for the software package pass.
6. Current certificate/authentication configuration passes a real IRS test-environment handshake.
7. Submission, acknowledgment and reject handling pass end-to-end.
8. Online-provider security controls are evidenced.
9. Security review shows no critical/high unresolved taxpayer-data exposure.
10. IRS lists the selected schema version as production-valid.
