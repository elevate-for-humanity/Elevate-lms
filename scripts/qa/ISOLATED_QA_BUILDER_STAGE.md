# Isolated QA Website Builder stage — 2026-11-19

This stage extends the existing isolated QA bootstrap in PR #2729. Target is
`isdgjcdabhxxozarmxta`; the production hosting project and separate Legacy 83
customer backend are unchanged.

`bootstrap-builder-schema-20261119.sql` creates seven empty tables, 65 columns,
23 constraints, 28 policies, two triggers and six functions from read-only
production schema metadata. It preserves table grants, restrictive MFA policies,
service-only atomic draft/edit commits, private receipts, the monotonic write
version trigger and the PARIS workspace insert trigger. No production application
rows, Auth credentials, subscriptions, credits or customer configuration are copied.
The source credit helper's existing private SECURITY DEFINER behavior is retained;
the two commit functions remain SECURITY INVOKER with their original empty path.

Apply only to the named isolated QA project after its core schema and read-policy
stages, transactionally with stop-on-error. Existing builder tables/functions or
workspace schema cause refusal. The file deliberately lives outside the production
migration directory. Applied QA migration: `20261119131407_qa_builder_schema_contract_stage`.
Do not replay it into any already staged project or production.

The first two attempts rolled back fully: function statement termination, then the
SQL wrapper's dependency order. Zero builder tables were verified after each
failure. The corrected complete stage applied once. Fresh target catalog comparison
matched columns, constraints, indexes, RLS, grants, policies, triggers, function
bodies and execute ACLs. All seven tables contain zero rows. Anonymous and
signed-in roles have no receipt read or draft-commit execution privileges; the
service role retains commit execution. See the sanitized evidence JSON.

The security advisor adds the expected informational RLS-with-no-policy finding for
the intentionally private receipt table. Its existing leaked-password warning is
unchanged. No security setting or access control was relaxed.

This removes the missing builder database-contract dependency only. It does not
establish subscriber browser acceptance. Normal free-trial provisioning, credit
grant helpers, two designated nonadmin subscriber fixtures, fixture cleanup and
actual create/edit/save/reopen/preview/isolation checks remain necessary. Never
seed a fake paid subscription or use production credentials for these tests.
No customer site configuration is opted into footer/backdrop/introduction changes.
