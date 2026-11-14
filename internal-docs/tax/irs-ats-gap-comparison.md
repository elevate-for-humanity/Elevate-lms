# IRS ATS comparison — October 13, 2026

Scope: Elevate-lms and next-platform-starter, tax year 2026 / processing year 2027. This is an implementation comparison, not IRS approval.

| IRS requirement | Main and starter implementation | Verification / actual limitation |
|---|---|---|
| Private taxpayer workspace | Authenticated self-file routes; owner checks and private responses | Anonymous boundaries tested; live deployment must serve the new revision |
| Federal 1040 calculation | TY2026 brackets/table, standard/dependent deductions, capital gains, taxable Social Security, owner-specific self-employment, Medicare/NIIT and saved input worksheets | Official core ATS case 5 calculates tax $3,883 and refund $6,385; state returns and specialized forms are not automatically calculated |
| Credit worksheets | Child/other-dependent credit, ACTC, EIC, education and dependent care calculations with eligibility inputs | Eligibility attestations do not replace supporting IRS forms or evidence |
| Signature and identity protection | AES-256-GCM identity/PIN storage bound to owner and return; authorization binds both calculation and source documents | Encryption key must be provisioned in secure runtime configuration; concurrent saves reject stale writes |
| Official XML | Application mapping for 1040/W-2/8888; calculated Schedule 1/2/SE for supported self-employment data; official field ordering and offline XSD validation | Wage/refund and self-employment XML passed downloaded TY2026 v4.0 schema; specialized credit/deduction source documents still require implementation/review |
| Business rules | Published local payment, wage, deposit and consistency rules | IRS identity/file-history rules require actual IRS processing; this is not a full evaluation of every published rule |
| Test fixtures and packaging | Six core scenario PDFs with source/hash checks; submission identifiers and actual ZIP/MIME export tooling | Other applicable scenarios require software scope declarations and computed assertions; no fabricated acceptance |
| A2A transmission | Official PY2027 WSDL downloaded and preserved | Enrollment/certificates and actual transport/acknowledgment flow are not yet operational |
| IRS approval | Firm/provider registration verified | Software Products showed zero records; no package registration, upload or IRS acceptance has been completed |

Both repositories now contain the calculation, secure profile, connected worksheets and IRS XML modules. The starter previously held the same nine tax core modules; it did not contain a separate complete filing engine.

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

The IRS IFA Transmit Test File page listed both associated ETINs. Selecting the active developer test ETIN and continuing returned a site-served Access Denied page from the IRS edge gateway. No file was uploaded or transmitted, and no test acknowledgment was obtained. This browser restriction is separate from the successful SOR download and the software package registration and additional form coverage still required before production filing.

## Connected implementation and validation

Taxpayer identity and signature data is stored only as an authenticated encryption envelope. Required runtime configuration is TAX_DATA_ENCRYPTION_KEY (64 hex characters; existing SSN_ENCRYPTION_KEY may be used), IRS_SOFTWARE_ID and IRS_EFIN. Keys and real identifiers must be provisioned through the secure runtime secret store, never committed or supplied as public fixture data. Export recomputes the return and verifies both its calculation and source-document digests against the authorization.

The self-file UI now saves federal income/deduction/payment worksheets, household and credit eligibility inputs, dependent care expense limits, additional taxpayer/spouse business income, taxpayer/spouse details and signature authorization. W-2 confirmation captures the employer mailing address and income owner. XML is downloaded as a draft artifact; downloading does not transmit to IRS.

Validation: federal/credit, encryption, return mapping, local rule, authorization and profile-route tests; calculation route failure checks; downloaded official XSD checks for the wage/refund case and self-employment schedules. The IRS schema check is structural validation, not IRS ATS acceptance. Do not enable production transmission until the product is registered, its declared forms are implemented, applicable ATS cases pass, and actual acknowledgments are reconciled.

The main Google release verifies an existing taxpayer encryption key and provisions one private Secret Manager key only when none is configured. It preserves existing keys, refuses public secret access, grants access only to the existing Marketing runtime identity, and binds a specific enabled key version with the new image. IRS-issued identifiers are not generated by this process.

### Dependent schedules and private entry

Dependent identification and eligibility attestations now enter through the encrypted taxpayer profile. Reviewed counts must match the saved child-credit and earned-income worksheets. Export includes Form 1040 dependent details, Schedule EIC and Schedule 8812, including rounded phaseout amounts and the three-child payroll alternative using actual W-2 Social Security/Medicare withholding and the self-employment deduction. Other specialized payroll-tax/credit lines still require complete form-specific implementation; this does not establish support for every Schedule 8812 scenario. The ordinary no-Form-1062 return now emits Form 1040 line 24c.

Validation: 50 main unit tests passed; the generated three-child return passed the official 2026v4.0 Form 1040 XSD with both dependent schedules. This is structural validation, not an IRS acknowledgement or ATS acceptance.

### Canonical business worksheets and source permissions

Schedule C income and expenses now save in the existing tax_schedule_c table. The business worksheet includes income owner, principal activity, business code, cash/accrual method, filing answers, ordinary expenses, itemized other expenses and inventory costs. Server-derived totals are rechecked before calculation and are mapped into Schedule C, Schedule 1 and Schedule SE. Legacy records require explicit worksheet review before export.

The source-access test found missing authenticated table privileges on Schedule C, 1099 income and itemized deductions. Minimum grants and self-file ownership policies repair the calculation path while retaining RLS and privileged-session MFA. An unrelated synthetic authenticated subject cannot read these records. The calculation/export source queries now include the complete canonical business record, including ownership and worksheet metadata.

Current local evidence: 64 main tests, including eight owner/version API cases and six business calculation/export cases. The business XML passes the official 2026v4.0 XSD. IRS transmission/acceptance remains unverified; specialized depreciation, home-office, loss-limitation and other federal form coverage still requires implementation and verification.

### Supersonic payment choices and separate office account

The owner selected EPS Financial bank-partner Refund Transfer and identified the Supersonic Fast Cash Lili business account as the intended fee-deposit account. Elevate for Humanity has a different Lili account and must never be used for these fees. No account has been linked or settlement details changed by this implementation.

Checkout recomputes the reviewed federal return and existing software pricing from canonical sources. Customers can save an upfront payment preference or an EPS request when their federal refund exceeds software fees and any configured provider charges. Free returns require no payment product. The application does not infer approval from a sufficient estimated refund. State-only RT eligibility is outside the currently implemented federal return scope.

EPS fees are not the example $39 or an assumed $30–$40. TAX_EPS_REFUND_TRANSFER_FEES_JSON must contain the actual complete fee schedule with a version and itemized label/amountCents entries. A request remains awaiting_eps_application; it does not record a bank agreement, Section 7216 consent, bank submission, approval or funding. Exact approved forms, signed document evidence, bank-specific routing, service-bureau identification, authorized transport and funding reconciliation remain to be connected. A generic checkbox is not substituted for those forms.

Upfront checkout reuses the existing hosted QuickBooks invoice infrastructure only after a separate TAX_OFFICE_PAYMENT_PROFILE_JSON verifies HOTT KAMODITTY / Supersonic Fast Cash, Lili, a masked account suffix, settlement-account reference, verification reference/time and the dedicated QuickBooks realm. The live QuickBooks company identity and realm must match before invoice creation. The general Elevate merchant is never a fallback. Without that configuration the customer can save a preference, but no invoice or payment is created. The operator must verify the actual Supersonic settlement account in the provider portal; account labels alone do not link a bank. No routing/account number belongs in source or chat.

Invoice creation is idempotent per owner, return and amount. Invoice references are rechecked against that binding; changing a return cannot silently reuse a payment for another return or create a second changed-price invoice. Only the existing provider ledger can establish paid status. No client redirect marks an invoice paid. This checkout code does not claim that IRS transmission or EPS refund funding is operational.
