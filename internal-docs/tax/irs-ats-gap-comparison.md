# IRS ATS comparison — October 13, 2026

Scope: Elevate-lms and next-platform-starter, tax year 2026 / processing year 2027. This is an implementation comparison, not IRS approval.

| IRS requirement | Repository before repair | Implemented in this change | Remaining work |
|---|---|---|---|
| Authenticated taxpayer workspace | Return APIs checked ownership; marketing middleware omitted self-file | Protected self-file namespace, private caching, safe login return URL | Verify live Google release |
| Accurate supported return calculations | Ordinary-income estimator only | Saved estimate, income validation, Schedule C double-count correction | Full forms, credits, special rates, SE tax, state calculations |
| IRS test scenarios | No sourced fixture set | Six current core 1040 PDFs, source URLs and SHA-256 checks | Applicable extension/SS/NR and additional cases based on declared software scope; computed assertion tests |
| Submission identifiers and practitioner signature data | No validated ATS helpers | Submission ID, synthetic SSN, PIN and date validation | Connect actual signed authorization workflow |
| Official XML schemas | No local validation tooling | Offline XSD validation with entity/network access disabled | Download matching official schemas through authorized SOR; generate each supported IRS return |
| IRS business rules | No engine | Audit reports missing implementation | Load current official rules and implement rule evaluation |
| ZIP/MIME IFA transmission package | Export adapter claimed sent without an artifact | Actual ZIP/MIME builder, PDF attachment checks, offline validation command, export artifact with exported status | Supply official XML, manifest and SOAP envelope; verify against current package |
| A2A transport | Missing | Audit reports missing implementation | Enrolled system, approved certificates, official WSDL, transport and acknowledgment retrieval |
| IRS acceptance | No verified acknowledgments | All generated reports explicitly retain atsAccepted=false | Submit synthetic test packages and reconcile actual IRS acknowledgments |

Nine original tax-core modules were identical in both repositories. The starter does not contain a more complete hidden filing engine. Core scenario coverage currently exposes 17 absent form-registry names; adding names alone would not implement calculations or IRS XML.

## Official starting points

- [ATS program](https://www.irs.gov/e-file-providers/modernized-e-file-mef-assurance-testing-system-ats)
- [TY2026 scenarios](https://www.irs.gov/e-file-providers/tax-year-2026-form-1040-series-and-extensions-modernized-e-file-mef-assurance-testing-system-ats-information)
- [Pub. 1436](https://www.irs.gov/pub/irs-pdf/p1436.pdf)
- [Schemas and business rules](https://www.irs.gov/e-file-providers/modernized-e-file-mef-schemas-and-business-rules)
- [Pub. 5446 packaging guide](https://www.irs.gov/pub/irs-pdf/p5446.pdf)
- [E-file application and IFA](https://www.irs.gov/tax-professionals/e-file-provider-services)

## Local commands

`node scripts/tax-ats.mjs audit --starter=/path/to/starter`

`node scripts/tax-ats.mjs validate --xml=/path/return.xml --xsd=/path/official-return.xsd`

`node scripts/tax-ats.mjs package --input=/path/package.json --out=/private/output`

The package specification supplies submissionId, processingYear, returnXml/returnXsd, manifestXml/manifestXsd, soapEnvelopeXml/soapEnvelopeXsd and optional attachments with name/path. File paths are relative to the specification. Packages remain local; no command submits to IRS. Never commit identifiers, certificates, credentials, taxpayer XML or private SOR files.
