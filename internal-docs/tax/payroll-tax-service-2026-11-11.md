# Supersonic payroll and tax-service implementation

Owner request: finish Supersonic Fast Cash payroll and tax service using the existing owned code and Supabase.

## Runtime and source

The dedicated `elevate-for-humanity/supersonic-fast-cash` repository is a partial source snapshot, not a standalone build. Its transfer note points to `next-platform-starter`; that repository's workflow validates source only. The live tax routes are released by `Elevate-lms`'s Google Marketing workflow. Preserve the pinned upstream source identity in `config/paris-release-source.json`, recording reviewed local changes separately.

The connected Starter project has tax tables but no legacy payroll tables. No database was switched and no taxpayer, employee, school or bank records were copied. Payroll preparation uses new `sfc_payroll_*` tables, separate from school payroll and learner attendance. Apply the reviewed migration only to the actual runtime database through the established migration process.

## Implemented workflow

- `/tax-software/office/services`: entry to professional tax preparation, client self-file preparation, staff reports and payroll.
- `/tax-software/office/payroll`: active office owners with verified email and MFA can manage client companies and up to 100 employee profiles per company. Stored records omit SSNs and bank account numbers.
- Supported calculation: regular hourly periodic wages for Indiana residents, periods beginning October–December 2026, modern W-4, all 92 Indiana counties, reviewed hours/overtime, federal withholding, employee/employer FICA, additional Medicare, Indiana WH-4 exemptions and after-tax deductions. Reject unsupported dates, arrangements, unknown counties and negative net wages.
- Preserve per-employee prior same-employer wage evidence. Saved and approved drafts are never counted as actual paid wages.
- Draft save and export approval lock the company and check the employee profile revision atomically. Duplicate active periods are rejected. Approved calculations cannot be edited. Voiding retains the original calculation and append-only audit events.
- Private, formula-safe CSV download and print review. Approval means **approved for export**, never paid, deposited, remitted or filed.
- Professional tax workspaces can download a digest-bound saved preparation record for the displayed revision. Access remains office/preparer scoped; a changed revision is rejected. Download does not transmit a return or create an IRS acknowledgment.

## Calculation sources

- IRS Publication 15-T (2026), Worksheet 1A and annual percentage schedules: https://www.irs.gov/publications/p15t
- IRS Publication 15 (2026), Social Security cap and Medicare: https://www.irs.gov/publications/p15
- Indiana DOR Departmental Notice #1, effective October 1, 2026: https://www.in.gov/dor/files/dn01.pdf
- The county data was extracted from that official PDF; PDF SHA256 `5eb64923aaa1b0f21c105dd64ab318fef290b232864109cd571d7bb9375b5315`.

## Remaining release and provider acceptance

This implementation does not provide a bank payout adapter, unemployment tax calculation/remittance, payroll tax filing, special wage arrangements or multistate payroll. It cannot be represented as a complete live payroll-processing service until the approved bank/processor and tax-filing integration are supplied and tested. No deposit is sent by these routes, including approval routes. Chime directory listing is a separate supported payroll connection.

Existing IRS firm ERO/developer/transmitter approvals are documented in `irs-ats-gap-comparison.md`; do not require the owner to reapply based on the absence of a software connection. That record also identifies unfinished Software Product registration, full form/business-rule coverage, transport, ATS acceptance and production acknowledgments. Current source still has only a local certification-export adapter. Owner firm approval, configured identifiers, local XML validation and an export must remain distinct from IRS acceptance. EPS product enrollment, configured fees, dedicated Supersonic merchant identity, provider transport and reconciliation remain separate; never substitute Elevate's settlement account.

The Supersonic custom-domain probe failed at the network/DNS boundary (proxy HTTP 503), so no app-runtime root cause or successful domain deployment is established by that probe. The existing Google Marketing health endpoint was reachable. Verify the actual custom domain, current Google immutable image/revision, authenticated save/reopen/download and the approved provider receipts before declaring production acceptance.
