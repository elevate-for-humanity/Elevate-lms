# Isolated QA bootstrap checkpoint — 2026-11-19

Target: `isdgjcdabhxxozarmxta` (`elevate-lms-qa`). Source schema metadata:
`cuxzzpsyufcewtmicszk`. Production application rows and credentials were not
read or copied, and production was not modified.

This is a reproducible **staged subset**, not a complete production clone or
authenticated browser certification. Do not replay these files into production
or add them to the production migration directory.

## Applied stages

| Target migration | Source-derived contract |
| --- | --- |
| `20261119115632_qa_core_schema_structural_stage` | 17 core tables and recursive public foreign-key dependencies, 800 columns, 107 constraints, 126 additional indexes, `course_status` enum |
| `20261119120047_qa_policy_social_dependencies_structural_stage` | Nine policy/social dependencies, 132 columns, 30 constraints, 25 additional indexes |
| `20261119120206_qa_profile_read_policy_stage` | Exact source administrator helper and two profile SELECT policies |
| `20261119120414_qa_core_read_policy_stage` | Eleven exact pure-read helper functions, all 49 source SELECT/ALL policies for ten core tables, source SELECT grants |

The separate social draft RPC migration was applied by its own repair task.
It is not supplied by this bootstrap checkpoint.

Each structural stage compared actual target column types/defaults/generated
expressions/nullability, constraint definitions/validation flags and index
definitions against the captured production catalogs. All comparisons matched.
All tables enable RLS. Anon/authenticated write grants remain revoked. Read
grants and policies preserve source semantics, including restrictive AAL2 rules.
No source DML triggers, cron jobs, publishing integrations, storage objects or
application rows were copied.

Tables staged: `cohorts`, `compliance_profiles`, `course_enrollments`,
`course_versions`, `courses`, `employers`, `funding_programs`, `host_shops`,
`lessons`, `organizations`, `partners`, `profiles`, `program_enrollments`,
`program_holders`, `programs`, `store_instances`, `tenants`, `blog_posts`,
`course_pacing_plans`, `lms_organizations`, `organization_users`, `partner_users`,
`roles`, `social_campaigns`, `social_media_posts`, `user_roles`.

## Disposable identity setup

`provision-auth-personas.mjs` uses the installed official Supabase SDK's Auth
Admin API. It creates nine email-confirmed identities with unique random
passwords and trusted `app_metadata` QA/run/role markers. Learner maps to
`student`; the other profile roles are `admin`, `program_holder`, `host_shop`,
`apprentice`, `employer`, `instructor`, `staff`, and `case_manager`.

Inputs are explicit `QA_PROJECT_REF`, `QA_SERVICE_KEY_FILE`, `QA_PERSONAS_FILE`
and `QA_SDK_PACKAGE_JSON`. The credential output is mode 0600 and must stay out
of version control, reports and logs. It contains the target project/run and
`personas` entries (`name`, `role`, `email`, `password`, `user_id`). It can safely
resume its own interrupted run without adopting unrelated Auth identities.

`seed-bootstrap-persona-profiles.sql` creates the QA tenant/organization and
matching profiles. Their learner enrollment state remains pending. No training
enrollment, payment, signed agreement or regulator approval is fabricated.

`verify-auth-profile-isolation.mjs` signs in all nine real accounts. Ordinary
roles see their own profile only; administrator/staff visibility matches the
source helper. It verifies that a learner role mutation is denied and signs
test sessions out. Sanitized evidence is checked in.

`verify-admin-mfa-read-policy.mjs` enrolls a genuine TOTP factor on the disposable
QA administrator, retaining its seed only in the mode-0600 credential output.
It verifies source-protected program reads are denied at AAL1 and allowed after
real Auth MFA verification at AAL2. Its temporary program fixture is deleted
and zero remaining rows verified. The persistent QA administrator's factor is
retained for future real MFA testing; the script does not weaken MFA policies.
The evidence contains no factor seed, OTP, password, token, or API key.

When replaying raw SQL with a database client, use a single transaction with
stop-on-error, the same reviewed target project, and the documented order.
The Supabase migration API applied each stage transactionally. An early SQL
terminator error in the profile-read stage rolled back with zero policies;
the corrected migration subsequently passed.

## Remaining acceptance gaps

- Only 26 of 1,810 production public tables are staged. This is not full schema
  parity. Course/workbook, billing, attendance, signature and dashboard-specific
  tables/fixtures still require dependency-scoped setup.
- Application write-policy and trigger parity is intentionally unfinished.
  In particular, do not grant profile UPDATE merely by copying an own-row
  policy without reproducing role/tenant immutability protections.
- No test programs/courses/media, training enrollments, Host Shop memberships,
  payment-provider transactions or signed agreements are established here.
- The source `rpc_private.get_current_tenant_id()` reads
  `partner_users.partner_id`, not `profiles.tenant_id`. Tenant/organization seed
  rows alone do not supply actual partner membership. Preserve this fact when
  constructing fixtures; do not force unrelated IDs to match.
- Admin browser acceptance must complete genuine TOTP MFA. Password-only test
  helpers are insufficient for AAL2-protected source policies. The SDK MFA
  evidence is not browser acceptance.
- Run configuration preflight, exact-head CI, security review, full desktop and
  mobile suites, fixture cleanup and protected release acceptance separately.

The early core-schema evidence JSON is a historical zero-row structural-stage
snapshot. Later Auth/profile and MFA evidence files record subsequent stages.

## Host Shop and apprenticeship browser fixtures

On a fresh isolated project, install the project identity anchor, core schema
and read policies, then create the disposable QA tenant. Apply the student
lifecycle and portal schema contracts first, including the QA HVAC catalog
entry required by the portal contract. The portal contract installs
`course_lessons`, `documents` and the private `documents` bucket.

Apply the following with stop-on-error against the isolated QA database,
in order. For an existing project, check its migration history first and skip
stages it already has. The workspace and apprenticeship stages intentionally
reject overlapping relations.

1. `bootstrap-host-shop-fixtures-20261119.sql` creates the canonical shop and
   staff relations, scoped membership policies, empty audit sinks and the
   isolated Barber program anchor.
2. `bootstrap-portal-workspace-20261122.sql` restores the applied workspace
   stage, including hour and competency records.
3. `bootstrap-apprentice-runtime-20261122.sql` restores the applied
   apprenticeship stage, including placements, the active Barber standard
   and the document requirement catalog.
4. `bootstrap-apprentice-acceptance-20261122.sql` adds the Host Shop attendance,
   wage and certificate schema, seeds the approved Barber RTI categories,
   and aligns the existing private document bucket with allowed uploads.
   Apply this stage on existing QA projects that already have steps 1–3.

The desktop workflow installs the locked Node dependencies, verifies its QA
connection, and provisions the disposable Admin before the Host Shop fallback.
With `E2E_HOST_SHOP_EMAIL` and `E2E_HOST_SHOP_PASSWORD` unset, the fallback
creates run-scoped Host Shop and Apprentice identities and removes them during
teardown. To verify a clean bootstrap, run all four desktop shards with the
pair unset and check that fixture provisioning, the authenticated Host Shop
browser checks, and fixture cleanup succeed. A static credential pair must
belong to a disposable QA Host Shop supervisor with approved active
membership. Store customer and production credentials must stay out of QA.
