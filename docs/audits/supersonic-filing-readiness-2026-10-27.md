# Supersonic Fast Cash filing-readiness audit — October 27, 2026

Status: **not ready for public IRS e-filing; ATS acceptance has not been established**.
Baseline: Elevate-lms main `74f57155`. This is a scoped engineering audit, not a claim that every line of the entire platform has been reviewed.

## Verified live surfaces and bindings

- Opened `https://supersonicfastcash317.com` twice: this cloud browser received an upstream remote-connection failure. This does not establish whether other clients can reach it.
- `https://www.elevateforhumanity.org/tax` renders Supersonic branding, pricing/service links and the self-preparation entry point.
- Its Prepare my taxes link opens `/tax-software/self-file`; the page resolves to a filing-status selector and Start return button in the existing browser session.
- The page and footer accurately disclose that the workspace does not currently submit IRS returns or process bank products.
- The public runtime configuration endpoint reports the primary database `cuxzzpsyufcewtmicszk`, matching the shared Supabase client used by the tax routes.
- The dedicated Starter project `jlqrfwxuhpzmuivdxvvz` is healthy but has an incompatible tax-return contract (including missing `service_type`). Do not redirect the existing runtime there without schema, auth, storage and ownership reconciliation.
- No real tax return, payment, signature authorization or IRS submission was created during browser testing.

## Code paths reviewed

Reviewed the return start/list, calculation, interview, W-2 confirmation, taxpayer profile, federal forms, business worksheet, checkout and export routes; self-file/login/W-2 review UI; source mapping, federal calculator/credits, signature digest, local MeF rules, readiness and transmission adapters; ATS scripts and database policies. Existing unit tests exercise additional serialization, pricing, authorization and training behavior. Further end-to-end tax coverage and an isolated tax runtime remain release work.

## Repairs made

1. Calculation saves now compare the return's original `updated_at` before writing JSON. Concurrent changes return HTTP 409 instead of losing newer interview, worksheet or signature metadata.
2. W-2 amount parsing preserves missing/blank optional boxes as null. Explicit zero remains zero; booleans and other nonnumeric JSON types are rejected. Previously blank string boxes became zero, defeating the source mapper's missing-box handling for Social Security/Medicare wages.
3. Return start/list, calculation and W-2 confirmation use the existing private JSON response helper (`private, no-store`, `Vary: Cookie`, `nosniff`) for successful and error responses.
4. Applied `restrict_tax_legacy_reads` to the primary database: three blanket authenticated SELECT policies on tax intake, legacy upload metadata and payments now have `USING (false)`. Existing owner/tenant/admin policies and the MFA restriction are unchanged. No rows were migrated or deleted.

The legacy tables currently lack some client table grants. The broad policy issue was therefore reproduced **inside a rolled-back transaction with temporary SELECT grants**, using synthetic rows only. The pre-repair assertion proved each synthetic row visible; after policy changes all three counts were zero. Temporary grants, fixtures and rehearsal policy changes were rolled back. The actual migration changed only the three policy predicates; readback confirmed all three are false.

## Validation

- Frozen-lockfile dependency install succeeded; scripts were disabled during installation. No lockfile change.
- 21 tax unit-test files / 105 tests passed, including new concurrent-save and W-2 coercion regressions.
- Four Python serializer tests passed. These use a small test schema and do not prove conformance to the official IRS return schemas.
- Targeted ESLint passed on changed production TypeScript; tests are ignored by repository ESLint configuration. Prettier and `git diff --check` passed.
- Marketing and Admin typechecks completed successfully. LMS typecheck and full lint remain queued/running as of this update. The full build stopped in Marketing because the local invocation omitted the required GIT_SHA production build identity; this is not evidence of a tax-code build failure. No full build or deployed-revision success is claimed.
- Dedicated project security advisor: informational closed RLS tables only, no warning/error finding. That result does not certify the active primary tax runtime's security.

## IRS and filing gaps

- Only `CertificationExportAdapter` is implemented; it generates a download and correctly does not report an IRS send. The audit confirms there is no IRS A2A adapter at the expected path.
- No official tax XSD/WSDL package is installed in this checkout. Full schema validation, official rule coverage and a real ATS handshake have not been proven.
- Runtime secret **metadata only** was inspected: IRS_EFIN, IRS_ENVIRONMENT, SSN_ENCRYPTION_KEY and TAX_SOFTWARE_LICENSE have stored entries. No IRS_SOFTWARE_ID, IRS_ETIN, IRS_APPSYSID, A2A certificate or rule-package entry was returned by that store query. Google Secret Manager or other environment configuration was not exhaustively inventoried; absence in this table alone is not proof of absence everywhere.
- The local ATS audit reports false source verification for uninstalled fixture PDFs and missing form-registry entries. Form-registry presence is not equivalent to implemented/accepted tax-form support. Do not add names merely to turn this report green.
- No accepted ATS submission identifiers, IRS acknowledgments or production authorization evidence was established.
- State filing, independent tax-service isolation, online-provider safeguards, complete tax-form calculations/limitations and real user signup-to-save-to-export acceptance still require verification and implementation.

## Required continuation

Obtain the authorized current TY2026 IRS SOR schema/business-rule and WSDL packages; confirm Software Developer/Transmitter enrollment and software-package registration; implement the selected documented IRS transport (or documented IFA package workflow); run applicable official ATS scenarios with synthetic IRS fixtures; retain acknowledgments/rejects and acceptance evidence; prove owner isolation and protected taxpayer storage end to end; validate production readiness before enabling public transmission. An EFIN or a successful XML download does not establish any of these outcomes.

Official references checked October 27, 2026:

- https://www.irs.gov/e-file-providers/how-tax-preparation-software-is-approved-for-electronic-filing
- https://www.irs.gov/e-file-providers/tax-year-2026-form-1040-series-and-extensions-modernized-e-file-mef-assurance-testing-system-ats-information
- https://www.irs.gov/e-file-providers/modernized-e-file-mef-status
- https://www.irs.gov/tax-professionals/e-file-provider-services

IRS lists some TY2026 scenarios as tentatively available November 1, 2026. Follow the actual current scenario/version requirements for the selected supported form package; do not invent acceptance for unavailable scenarios.

## Publication status

The user explicitly authorized pushing the repair code to the public Elevate for Humanity LMS repository after automatic review required that authorization. Publication targets `repair/supersonic-filing-audit-20261027`. Publishing the branch does not establish a merge, deployment, or IRS acceptance.

The active primary database advisor after the repair reports informational closed RLS tables and one insufficient-MFA-options warning; this was not changed by weakening MFA. Tax-return, W-2, Schedule C and calculation table grants support the corresponding implemented API operations. 1099 and itemized records are currently read-only to authenticated clients; no unimplemented document-editing path is claimed.
