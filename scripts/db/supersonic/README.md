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
