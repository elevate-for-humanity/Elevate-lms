# Dedicated Supersonic database repairs

Target: existing Starter project `jlqrfwxuhpzmuivdxvvz` only. These files are
reproducible migration bodies, intentionally outside the primary Elevate
`supabase/migrations` directory. Do not apply them through the primary database runner.

Applied with Supabase migration tooling on 2026-10-17:

- `harden_supersonic_status_and_trigger_boundaries`: the existing status view
  now obeys caller row policies. Fixed search paths and removed public API
  execution of internal auth/DDL triggers. Trigger definitions remain intact.
- `protect_supersonic_profile_roles`: authenticated users retain owner-scoped
  display-name updates, but cannot modify their role, owner ID or other protected
  columns. Existing service-role role administration remains available.

Readback verified `security_invoker=true`, denied client role/owner updates,
allowed display-name updates and service role administration, and retained the
auth trigger binding. The security advisor reported no errors or warnings after
the first migration; twelve RLS tables without client policies remain closed.
No records were copied, updated or deleted by these repairs.

Record-count inspection found all 31 dedicated tax/SFC tables empty and no auth
users. The primary database has one tax-office configuration row and three
objects in its private `tax-documents` bucket. Empty relational tax tables do
not establish that there is no taxpayer information in storage. Preserve those
objects for an authorized, encrypted, reconciled migration; do not inspect their
contents or copy them through shared logs.

These repairs do not deploy a tax runtime, migrate authentication or documents,
or establish IRS/provider approval or production filing readiness.

## Unscoped profile-role access repair — 2026-10-17

`remove_unscoped_tax_profile_shortcuts` was applied to the dedicated Starter
project only, using `remove-global-profile-access.sql`. Twenty existing policies
across nineteen tables granted broad access based on generic profile roles;
those role shortcuts are now false. Existing owner predicates remain intact.
Staff/preparer access through a future tenant-scoped tax API remains a separate
acceptance gate; this repair does not grant a new tax operator role or make
service-role access safe without API authorization.

The migration requires empty destination auth/profile and affected data tables,
locks the affected tables, and refuses changed policy definitions. The primary
database, payroll, private source documents and provider/transmission approvals
are outside this migration. `tax_withholdings` belongs to payroll (its employee
foreign key was verified), so a tax-prefix inventory must not migrate it.

Verification: generic-admin cross-record access was reproduced and rolled back;
the policy changes and exact rollback were rehearsed transactionally. After the
permanent apply, `verify-unscoped-tax-denial.sql` passed: a generic administrator
and an unassigned preparer could not read the synthetic return; owner-scoped
client access and backend service access remained. Every fixture was rolled back.
Independent counts then confirmed zero destination auth users, profiles, SFC
returns and clients, and zero remaining generic-admin tax policy expressions.
The security advisor reported only the twelve existing informational notices
for RLS tables without client policies, with no warning or error finding.

`rollback-global-profile-access.sql` preserves the exact previous policy bodies.
It restores broad privileges and must be used only as an explicit rollback after
rechecking current definitions; never run it as part of routine deployment.

Schema reconciliation also found UUID-versus-bigint return identifiers and
incompatible payment amount types between the primary and dedicated projects,
plus missing columns. Do not copy rows or retire source dependencies until the
actual tax application schema and ownership mapping are reconciled. These are
not completed data/auth/runtime or filing acceptance gates.
