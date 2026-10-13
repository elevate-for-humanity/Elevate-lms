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

## Verified IRS account and package findings

The signed-in IRS account shows HOTT KAMODITTY as legal name and Supersonic fast cash as DBA. The e-file application is Completed; Electronic Return Originator, Software Developer and Transmitter provider options are Accepted. EFIN is Active, and both a production transmitter ETIN and test developer ETIN are Active. These are account authorizations, separate from a specific software package passing ATS.

The Software Products page returned zero records on this inspection. No new package was submitted, and no acceptance was inferred from the completed firm application.

Downloaded through the authorized SOR session: September 24, 2026 IMF release and MeF WSDL 10.A for processing year 2027. The TY2026 v4.0 return-schema bundle contains 753 XSD files and 235 globally declared IRS document elements; these include shared and dependency documents, not 235 independently supported return products. The 1040 workbook has 1,846 Active, 18 Verbiage Change, 50 New, 169 Disabled and 115 Deleted rows. Status interpretation and applicability must follow the official release instructions; counting Active rows alone is insufficient.

Use `python3 scripts/tax-irs-package-inventory.py --schemas=/private/2026v4.0 --rules=/private/1040_Business_Rules_2026v4.0.xlsm --repo=.` for a local field/rule inventory. The reader does not execute workbook macros. Private SOR files and IRS identifiers are intentionally excluded from the public repository.

## Schema-driven XML generation added

`python3 scripts/tax-irs-xml.py --input=/private/irs-field-values.json --xsd=/private/2026v4.0/IndividualIncomeTax/Ind1040/Return1040.xsd --package-root=/private/2026v4.0 --out=/private/return.xml`

This generates XML from official IRS field-name JSON, orders elements using the installed XSD, handles repeated elements and XML escaping, rejects unknown fields, and validates the entire output before saving with private permissions. It does not calculate tax or map the application's interview answers into IRS fields. Input uses `@attributes` for XML attributes and arrays for repeated elements. Schema includes must remain inside the supplied package directory; remote schema loading is disabled. Error output omits document values.

Validation: four unit tests passed; the downloaded official 2026v4.0 1040 XSD compiled with 702 reachable global element declarations. A deliberately incomplete synthetic return was rejected. No IRS transmission or acceptance occurred.

Install offline tool dependencies with `python3 -m pip install -r scripts/requirements-tax-ats.txt`.

The IRS IFA Transmit Test File page listed both associated ETINs. Selecting the active developer test ETIN and continuing returned a site-served Access Denied page from the IRS edge gateway. No file was uploaded or transmitted, and no test acknowledgment was obtained. This browser restriction is separate from the successful SOR download and the unfinished filing engine.
