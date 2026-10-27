# All-service audit follow-up

The user's scope includes every service and connected integration. This is an open audit, not a production-completion certificate.

## Independently observed runtime evidence

The read-only Google inventory succeeded at 2026-10-17T11:44:10Z, including successful Workload Identity authentication. Its baseline snapshot is preserved beside this report. In us-central1, five Cloud Run web services report Ready and two Cloud Run jobs report Ready. Two Compute VMs report RUNNING. This was a regional Cloud Run snapshot, not a complete all-region count. Resource readiness does not establish feature success.

| Service | Observation | Remaining verification |
| --- | --- | --- |
| Admin | Authenticated navigation audit covers 158 destinations; repair release 6b51ed294 published | Exact release deployment, repaired routes/actions and responsive layouts |
| Marketing | Live health passed; local production build passed | Release activation, public visual audit and unrecovered prior image changes |
| LMS and dashboards | Live health passed; local production build passed | Release activation, individual role/ownership queries and real device layouts |
| Store | Readiness and underlying health passed after an initial timeout | Release activation, checkout and reliable response times |
| Studio browser | Live Chromium health passed; current traffic points at an older revision than latest-ready | Release activation, embedded interaction and performance |
| Course Builder job | Recent executions failed or were cancelled; queue recovery preflight repaired | Successful execution with current source, fresh heartbeat, preserved course checkpoints |
| Video render job | Recent executions failed or were cancelled | Resolve saved media QA failures and verify final lesson output |
| PBX VM | RUNNING; Communications Hub reports carrier setup required | Carrier readiness, ringing and two-way audio; no calls placed for this audit |
| Browser trial VM | RUNNING | Determine active ownership/use; no shutdown or deletion authorized by this observation |
| Supabase database/auth | Live health probes and read-only schema/permission queries passed | Individual dashboard access paths; no blanket grants |
| Supabase storage | Bucket listing probe passed | Media upload/read/playback paths and PWA cache behavior |
| Redis | Live ping passed | Feature-specific memory/rate-limit behavior |
| SendGrid | Read-only API-scope probe passed | Delivery evidence; no test emails sent |
| Email notification worker | Google authentication passed; processing failed | Separate PWA error from email processing and add safe diagnostic evidence |
| PWA push | 34 deliveries require review; zero accepted devices; one active subscription | Diagnose subscription/provider outcome without resending uncertain messages |
| QuickBooks website | Connection/status page reports failed authorization/refresh | Website OAuth reconnection and read-only company lookup |
| QuickBooks connected app | Read-only company lookup succeeded | Separate connection; cannot substitute for website OAuth |
| PayPal | Credentials present according to the billing panel | Provider connectivity and payment/webhook operation remain unverified |

The outbox has 1,027 email messages held for review and two failed historical suppressed rows. The audit did not release held messages, change hours, issue certificates, create invoices, collect payments, or alter learner records.

The live LMS /forms page independently reproduces the reported drug-testing problem: a static array labels Drug Testing Consent Form as universally required, with inactive Download/Fill Out buttons and fabricated update dates. This route now reuses the existing authenticated Documents & Records page rather than inventing another checklist or redirect. Read-only queries found no drug-testing entries in apprentice_document_types or enrollment_requirements. Existing learner-owned records and agreements remain authoritative.

The System Health page incorrectly treated billing credential presence as operational success. A follow-up source repair changes that result to unknown, carries the specific missing-configuration message into alerts, and prevents an all-healthy aggregate. It does not silently refresh or rotate provider tokens while polling health.

The subsequent browser release passed Google authentication, immutable container build, browser protocol tests, local persistent-storage startup, and authorization checks. Its public readiness proof failed. Downloaded diagnostics show the new revision retired with no serving traffic, while the service remained pinned to an older revision. The follow-up cutover repair creates a tagged candidate with no serving traffic, checks that exact candidate's SHA/storage/authorization, activates its exact revision, verifies the public URL and restores previous traffic if verification fails. Nine cutover tests passed, including pinned traffic, failed persistence, authorization failures and rollback. Live success still needs a new release.

Course Builder dispatch now passes the previously blocking preflight. Automatic dispatch run 39030288001 passed Google authentication and safely reported an existing active execution rather than launching duplicates. The existing fresh-course coordinator claimed job a9b85487-5465-4bc0-bed0-9fc3411c4e50 in us-east1. A read-only database check at 11:56:53Z showed running, heartbeat 11:56:20Z, valid five-minute lease, attempt 1 of 5, and no last_error. This verifies current execution, not final course/media acceptance. The inventory follow-up removes the us-central1 restriction for Cloud Run services/jobs/executions and adds project-wide asset metadata discovery; it does not provision resources.

The separate obsolete-execution recovery workflow failed before issuing Google commands because an inline regular expression had double-escaped delimiters. Its correction passed a parse-only test of the actual workflow JavaScript and an immutable approved-image validation test. The exact-execution and image-equality cancellation guards remain in place.

Providers, Provider Applications, Tenants and Waitlist also used session queries against restricted tables. They now require the canonical Admin role guard before obtaining the existing server database client. Live read-only counts confirmed 10 tenants, four provider applications and 20 waitlist records. Authorization tests deny access before privileged client acquisition. No table grants or record writes were introduced.

## Database audit

The migration ledger contains 1,363 versions; the repository has 1,267 distinct 14-digit migration versions among 1,327 files. There are 441 repository versions unmatched in the ledger and 537 ledger versions unmatched in the repository. These are ledger differences, not proof that corresponding DDL is absent: live PWA routines exist despite unmatched repository timestamps. Reconciliation requires comparing definitions before applying SQL.

Supabase advisors returned 29 tables with RLS and no policies, 25 unindexed foreign keys, three RLS init-plan warnings, and 8,438 multiple-permissive-policy findings. Restricted server-owned tables are not automatically broken; no broad grants, index deletions or policy removals were made. See [RLS policy diagnostics](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [foreign-key indexes](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys), [RLS init plans](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan), and [multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies).

Two security-definer advisories name enforce_admin_cell_forwarding(). Inspection confirms it returns trigger and enforces the Admin-only forwarding restriction; it is not an ordinary callable RPC. An MFA-options warning also requires Auth configuration review. Existing protections were not weakened to clear advisory counts.

## Integration catalog coverage

The live Integrations page lists Zoom, Microsoft Teams, SendGrid, Calendly, Google Calendar, Stripe, Affirm, Sezzle, QuickBooks, Supabase, Gemini, Edlink, LTI, SCORM and xAPI. These labels are configuration evidence only. Teams, Google Calendar, Edlink, LTI, SCORM and xAPI reported not configured. Stripe is retired in the canonical billing policy despite its legacy catalog entry; no new Stripe activation is part of this repair.

The Environment Manager also exposes AI providers, Azure, Twilio, PWA phone, legacy Telnyx, Backblaze, Cloudflare, GitHub, Iris memory, D-ID, HeyGen/Synthesia, Runway/Suno, ElevenLabs, image generation, social media, HubSpot, Salesforce, Mailchimp, Sentry, IRS/MeF, WIOA, RAPIDS, credentialing, grants, push, SSO, security, scheduling, support, webhooks and Mapbox. Catalog presence is not proof of a required production dependency or a functioning connection. Each needs classification as active, optional or retired and provider-specific read-only evidence; they are not certified by the six-service health summary.

## Release limits

Commit 6b51ed294 passed 81 regression tests, 50 worker/preflight tests, Docker-context route checks, full lint and all three application production builds/typechecks. Google deployment workflows started; dispatcher success is not deployment success. Exact ready revision and live commit evidence are still required.

The new synthetic-intelligence acceptance run failed on stale architecture assumptions: it requires a historical free-first fallback list and unconditional OpenHands delegation, while current source explicitly uses owned-provider discovery and conditional owned/OpenHands engineering routing. This is recorded as an open gate failure; provider policy was not weakened to satisfy it.

The speech acceptance workflow ran after the dispatcher completed, rejected that as insufficient deployment evidence, and skipped audio testing. It does not establish a speech-runtime failure or a successful microphone/speaker test.

## Follow-up validation

- 108 unit/regression tests passed across 17 files, covering role boundaries, preview ownership, planner checkpoints, Studio state and truthful billing health.
- 50 runtime/release tests passed, including nine exact browser-cutover tests and two recovery-workflow syntax/immutable-image tests.
- Changed source/test lint passed. Final Admin and LMS production builds and generated-route typechecks passed; Marketing's earlier production build passed.
- Store release 6b51ed294 is live: /api/health returned its exact SHA and revision elevate-store-migration-r6b51ed29-39029786503-1, ready true, and passing database/auth checks at 12:01:23Z. Admin and LMS still reported older SHAs at that observation. Their release completion must be verified separately.
- The follow-up source changes are not proof of live deployment or physical microphone/speaker operation. Public media sizing, complete responsive/PWA validation, the remaining restricted-table pages and provider-specific integrations remain open.
