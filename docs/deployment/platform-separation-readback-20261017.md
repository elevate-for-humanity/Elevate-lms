# Platform separation readback — 2026-10-17

This is an incomplete release, not a production-readiness certificate. Production application changes remain held while separation and acceptance are unfinished. No quota increase, customer pricing change, taxpayer-data migration, or new application deployment was performed by this work.

## Implemented and tested changes

- Store has local sign-in, safe commerce return URLs, local verified payment callback routing, local password recovery, and a product-catalog dependency check.
- Store billing delivery can use Store endpoints without contacting Admin, Marketing, or the agentic worker. Existing Admin routes use the same shared handlers for rollback compatibility. Paid-invoice checks, job claiming, invoice idempotency, and failed-batch detection remain enabled. Switching the dispatcher requires an explicit Store deployment and successful version, readiness, database and QuickBooks checks first.
- Store-owned PayPal configuration supports the exact environment and webhook variable names consumed by the billing clients. Actual provider credentials have not been migrated or independently accepted.
- Marketing Store pages redirect to the existing Store domain; Store page canonical URLs use that domain. Existing callback and mutation URLs remain intact during transition.
- Web runtime heap sizing follows the running container's memory limit. The existing 8 GiB profile retains its 4 GiB heap ceiling; a 2 GiB test container would use a 1 GiB heap. This does not change CPU/memory allocations and does not establish checkout performance at smaller sizes.
- Studio checkpoint saves reject missing encryption and preserve the last durable state if storage fails. A prepared dedicated Studio identity and canonical-secret cutover path remain unexecuted.
- Admin's read-only application inventory includes actual serving revision resources and commits, plus recent CPU/memory distribution means and active/idle instance samples when Google Monitoring permits them. Missing metrics remain unknown. No deployment or billing action is attached to rendering this page.
- Legacy 83's imported unauthenticated administrator bootstrap endpoints are retired with HTTP 410, without Firebase initialization or account writes. Dedicated repository build validation passed on commit `825f10529741e8a6db4c25985ca7093a6a8b88c0`, run `39045443629`.

## Acceptance gates

“Tested” below applies only to the described changes, not the entire application lifecycle.

| Component | Implemented in code | Tested | Deployed | Verified live |
|---|---|---|---|---|
| Marketing | Store handoff and canonical links | Middleware/route checks and typecheck | New handoff pending | Existing version endpoint only |
| LMS | Shared recovery handler preserves existing LMS behavior | Auth checks and typecheck | New shared handler pending | Existing version endpoint only |
| Admin | Read-only inventory, versions and sampled service metrics | Metadata/redaction/metric tests and typecheck | Inventory changes pending | Existing version endpoint only |
| Store | Local authentication/recovery, health, callbacks and independent billing delivery path | Focused auth/billing checks and typecheck | Latest repairs pending | Existing storefront runtime version only; no checkout acceptance |
| Legacy 83 | Bootstrap security repair; existing independent source and database foundation retained | Dedicated repository build and bootstrap check passed | No independent Cloud Run deployment verified | No complete portal/Academy/booking/payment acceptance |
| Supersonic | Existing tax source and dedicated Starter database identified | Full separate application acceptance not run | No separate Cloud Run deployment verified | Not verified |
| Course Builder | Existing finite job and integrity safeguards retained | Checkpoint compatibility and complete lesson acceptance unresolved | Existing job remains | No new complete MP4 acceptance |
| Studio | Durable checkpoint repair and scoped identity preparation | Focused persistence/lifecycle/cutover checks | New identity and persistence cutover pending | General browser, terminal and workspace restoration not verified |

## Production observations

Read-only Google preflight run `39039703958`, latest inspect job `117431507004`, observed infrastructure at **2026-10-17T15:24:22Z**. Later releases can change these values; re-read immediately before cutover.

| Service / region | Observed serving revision | Traffic | CPU | Memory |
|---|---|---:|---:|---:|
| Admin / us-central1 | elevate-admin-migration-00192-4qj | 100% | 4 | 8 GiB |
| LMS / us-central1 | elevate-lms-migration-00170-bxj | 100% | 4 | 8 GiB |
| Marketing / us-central1 | elevate-marketing-migration-rae5983fe-39035995620-1 | 100% | 1 | 4 GiB |
| Store / us-central1 | elevate-store-migration-r23b47627-39031123126-1 | 100% | 4 | 8 GiB |
| Studio / us-central1 | elevate-studio-browser-00039-yuv | 100% | 2 | 4 GiB |
| Marketing / us-east1 | elevate-marketing-migration-00001-dwt | 100% | 2 | 4 GiB |

A separate cache-busted public version check at **15:37:37Z** returned HTTP 200 from all four web domains. Store reported `accd052e05ff0d66c6a9370da77085bf254fecd5`; Marketing, LMS and Admin reported `ae5983feb634c46a35af9cabd9e5e7a31afb20a0`. This demonstrates that an intervening Store release occurred; the earlier revision table is not a current traffic assertion. The newer separation repairs must not be claimed live based on those version responses.

Targeted job inspection found Course Builder at 4 CPU / 8 GiB and video renderer jobs at 8 CPU / 32 GiB in us-central1 and us-east1; no active executions were present in those targeted job reads. This is not a complete project job/asset inventory. Broad Cloud Asset inventory remains permission denied.

## Database boundaries

- Current Store runtime remains on Elevate's existing Supabase project `cuxzzpsyufcewtmicszk`. Dedicated Store project `ebnbeqdsuxygopetptlv` exists, but its schema/catalog/payment compatibility has not passed migration acceptance. Do not simply swap the URL.
- Dedicated Legacy project `vhulnzcfmlnsmoxixjco` exists. Read-only counts during this work: four Academy courses, zero auth users, zero client profiles, zero Academy enrollments. The recovered portal and course UI still use Firebase. That source/data boundary must be reconciled before switching users.
- Dedicated Supersonic Starter project `jlqrfwxuhpzmuivdxvvz` exists. Tax tables also remain in the primary Elevate database. No taxpayer data has been moved, copied, or deleted by this work. Backups, complete table reconciliation, RLS tests and rollback are required before migration.

## Capacity and costs

Effective Cloud Run quota remained **20 vCPU / 40 GiB** in both inspected regions. Central serving revision configurations total **15 vCPU / 32 GiB per one-instance set**; this is configured capacity, not instantaneous usage. A concurrent Store candidate at 4 CPU / 8 GiB consumes the remaining 8 GiB of that simplified configuration budget. Actual scaling, tagged revisions and active job executions must be included by the existing capacity gate before any rollout.

Store's proposed 1 CPU / 2 GiB profile is 75% lower configured allocation than 4 CPU / 8 GiB. No such resource reduction was applied. This is not a demonstrated 75% billing reduction: checkout latency, cold starts, throughput and instance duration must be measured first.

Renderer monitoring reads succeeded but returned no samples in the preflight window. Empty samples cannot establish low usage or memory safety. Billing is enabled, but linked billing account inspection returned permission denied. An absolute monthly cost comparison and credit balance cannot be verified from this evidence.

## Concrete blockers

1. GitHub deployer still lacks project-level `iam.serviceAccounts.create` and IAM policy-management permissions needed to establish new dedicated identities. Existing scoped actAs access for Admin/LMS/Marketing/Store is allowed; do not confuse this with authority to create Studio/Legacy/tax identities. A project owner can execute the prepared `scripts/gcp/prepare-studio-service-identity.mjs` for Studio, which grants only its existing secret, auth bucket and deployer actAs binding. Do not grant Owner/Editor or fall back to Admin's runtime identity.
2. Store credential migration, scoped secret binding, provider authorization and sandbox purchase-to-order acceptance remain incomplete. Marketing bootstrap inheritance is retained until the independent configuration is verified.
3. Studio currently uses Admin's identity. Only Envato provider auth state has existing encrypted persistence; generic browser sessions, terminals and local workspace restoration have not passed restart/reconnection acceptance. Preserve min=1; do not move or scale to zero yet.
4. Legacy authentication, customer data and Academy still span recovered Firebase code and the dedicated Supabase foundation. Its own PayPal/QuickBooks merchant authorization is not verified.
5. Supersonic has no verified separate runtime or completed data-boundary migration. IRS/provider/ATS approval gates remain in force.
6. Course execution image mismatch and checkpoint compatibility are unresolved. Do not disable integrity checks or restart all courses. A dedicated consumer must prove both video and agentic task processing before disabling Admin workers.
7. Final integrated builds, security review, application-specific production acceptance and one coordinated sequential release remain incomplete. No component should be labeled fully production-ready from a passing workflow alone.
