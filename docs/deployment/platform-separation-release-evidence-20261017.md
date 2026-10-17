# Platform separation: coordinated release evidence — 2026-10-17

This supplements the earlier readback. It does not certify the separation complete.
A zero-traffic Studio candidate has now been deployed and tested. Serving production traffic remains unchanged.
The release hold remains enabled. A merged repair is not evidence that it is serving.

## Independent acceptance gates

| Component | Implemented in code | Tested | Deployed | Verified live |
| --- | --- | --- | --- | --- |
| Studio | Workspace/browser/terminal recovery and saved viewport restoration; cloud replacement gate (`502dca60`) | 129 actual container/Chromium tests, 262 integration tests, required CI and Integrity Gate; live candidate foundation and runtime-replacement acceptance passed | Candidate `00043-tuf` only, with dedicated identity; serving `00039-yuv` unchanged | Isolated workspace file, tabs, selected tab and viewport restored across an actual runtime replacement; production/Admin cutover remains pending |
| Store | Independent config preparation, canonical PayPal migration and production-only QuickBooks boundary (`d98845e8`) | 45 configuration regressions and 28 focused QuickBooks tests passed; previous commerce evidence retained | Config secret version 2 created; no container deployment | PayPal authorization and registered webhook verified; no transactions; QuickBooks and sandbox commerce acceptance pending |
| Legacy 83 | Exact dedicated database-origin checks, privileged server-only exports; dedicated repository PR #2 | 15 tests, TypeScript and complete Next production build in CI | No independent Google runtime verified | Existing Firebase/customer reconciliation and complete application acceptance pending |
| Supersonic | Removed blanket general-profile tax access in empty destination; source and private documents preserved | Transactional denial/owner/backend tests; migration and rollback rehearsal | Destination security migration applied; no application runtime deployed | Dedicated application, data migration, authentication and provider acceptance pending |
| Course Builder | Existing orchestration/checkpoints retained; concurrent owner-preview and B2-resolution repairs preserved (#1938–#1940) | Existing regressions and separately recorded owner-preview checks | Existing job templates preserved by this continuation | Tracked job is deliberately paused for diagnosis; no lease reset/restart here. Complete B2/media acceptance remains pending |
| Central Admin | Immutable serving digest, runtime identity and unknown readiness handling (#1931); six-permission inventory preparation (#1934) | 10 inventory/usage tests; 6 IAM-preparation tests | No Admin container or IAM grant applied | Signed-in inventory page reachable; Google service/job listings denied; exact role and binding absent |

## Commits and workflow receipts

- Store preparation merged `342e77153e184e91ef432393845659169d777271`.
- Store PayPal migration/environment guard merged `dd0eec375b3dee0160fa14867704a76513738659`.
  - Validate-only run `39068140335`, job `117500546698`.
  - Apply run `39068526484`, job `117501202549`: existing Store secret version 2; previous versions retained; zero transactions, no deployment/traffic changes. Existing provider webhook uses a non-Store origin; it was not changed.
- Admin inventory fields merged `42006e00648760f571a6d51defef13cf1650c1ae`.
- Legacy dedicated-repository repair merged `3a6a94782e2e186fe8ccb99df0bca59814205ea8`.
  - Build/test run `39068163323`, job `117500037335` succeeded, including production build. Local font-fetch failure did not reproduce in CI.
- Supersonic security receipts merged `c2c2682df0b9c13d4c9c6e5b9e96facb9888e977`.
  - Destination migration `20261017205241_remove_unscoped_tax_profile_shortcuts`.
- Admin inventory preparation merged `27b742ab875924f5ffc922fa0210fefbd63e2ead`.
  - Read-only run `39069935149`, job `117505328438`: `roleExists=false`, `bindingVerified=false`, `changed=false`.
- Studio preceding source head `13800d79c70f14ad414a9021b828e1f28d6e29fe` passed its core checks. Current PR #1933 head `6dc3c83b333cf8e4ad8bbd9e28fb6b0624f4c593` adds encrypted completed-download recovery and is under exact-head checks. The preceding-head integration job `117505109712` passed 262 tests and 23 release/preparation contracts. Local additional verification passed 24 release/verification contracts. Routine release no longer provisions identities, secrets or buckets, reads Admin credentials, or writes raw runtime/log contents to diagnostic artifacts.

## Serving and resource observations

Direct Google inventory run `39067366297`, job `117497696725`, observed approximately 20:36 UTC. Its broad Cloud Asset query was denied; direct service/job/VM/disk queries succeeded.

| Service | Actual serving revision / allocation | Immutable image digest | Configured CPU / memory |
| --- | --- | --- | --- |
| Admin | elevate-admin-migration-00193-nnw / 100% | sha256:a42a058b2b335397229d788cb483c25dc060005ab7fb83446cef315d89815ddd | 4 / 8 GiB |
| LMS | elevate-lms-migration-00171-bcd / 100% | sha256:0a32817d6b6e01879763e3a6162f6d0069127602ec48c0bee5816d126a67c3b3 | 4 / 8 GiB |
| Marketing central | elevate-marketing-migration-raccd052e-39044134724-1 / 100% | sha256:00c283261093f406518be2250f1000c4399c04fb83fe46208eec7e9cb9e42df0 | 1 / 4 GiB |
| Store | elevate-store-migration-raccd052e-39044029981-1 / 100% | sha256:2b797671157b06f4127949c1c48be737ccfb35d51d1b0c6b97e62870d36100c2 | 4 / 8 GiB |
| Studio | elevate-studio-browser-00039-yuv / 100% | sha256:060c177aaac5269bcf12fd3f9402ad8444d6986ddbb145aa9a9a13a627ffe4b4 | 2 / 4 GiB |

These are configured resources, not measured usage. Effective central quota remained 20 vCPU / 40 GiB. The configured one-instance service set totals 15 vCPU / 32 GiB; this is not a measurement of regional consumption or scaling headroom. Recheck usage, tagged revisions, configured scaling and active jobs immediately before staging. Store 1 vCPU / 2 GiB has not passed measured checkout/load/cold-start acceptance; no reduction or cost saving is claimed. Billing is enabled, but linked account metadata and actual costs remain unknown.

Studio's prepared dedicated identity is verified; its historical creation denial is resolved. Production still uses the older Admin identity. Candidate 00041-muw is not proof of serving traffic. Existing running trial VM and retained 10 GiB auth disk remain untouched. State inventory run `39066834392` counted zero sessions/files/direct child shells and two unclassified direct non-browser processes. That snapshot must be refreshed before maintenance; do not infer those processes are disposable.

## Database and service boundaries

- Store retains `cuxzzpsyufcewtmicszk`; no commerce records, prices, subscriptions or payment relationships moved. Marketing inheritance remains until all independent settings and commerce acceptance pass. Canonical `QB_ENVIRONMENT=sandbox` conflicts with the production-only QuickBooks API client; credentials must be reconciled securely before production acceptance. Production PayPal authorization does not authorize charging a customer for a test.
- Legacy dedicated project `vhulnzcfmlnsmoxixjco` retained four Academy courses and no auth users/client profiles/enrollments at inspection. Firebase remains the recovered site's auth/customer authority. Both recovered website variants and approved assets remain preserved. No auth authority switch occurred.
- Supersonic destination `jlqrfwxuhpzmuivdxvvz` remained empty of users and private documents. Nineteen destination tables had blanket profile-role access removed (20 policies); owner predicates and backend service access were retained and verified with rolled-back synthetic fixtures. Dedicated operator access remains closed pending scoped APIs. No primary tax data/document was copied or deleted. Source/target UUID-versus-bigint identifiers and numeric-versus-integer payment fields require an explicit mapping. `tax_withholdings` references payroll employees and must stay with payroll. Three existing private source tax documents were counted without opening them. Application deployment will not establish IRS/MEF/ATS/bank/provider authorization.
- Course job `a9b85487-5465-4bc0-bed0-9fc3411c4e50` remained running at 21:11 UTC, with heartbeat 21:11:01 and lease through 21:16:01. It must be rechecked before recovery. Its saved source image commit is `6b51ed2940c081d81e1d01e00f7355caa81dd367`; no live lease/checkpoint was reset or duplicated. A Supabase artifact is not accepted as B2 delivery.

## Release prerequisites still open

1. Studio candidate runtime-replacement acceptance has passed; fresh serving-state inventory and coordinated production/Admin cutover remain. File/history restoration does not restore arbitrary running OS processes or replay interrupted commands. Supported browser persistence covers tabs, active tab, viewport, cookies and localStorage; unsaved DOM and IndexedDB are not certified.
2. Store complete independent config, exact authorized secret bindings, secure QuickBooks merchant/environment reconciliation, approved sandbox end-to-end commerce, deployed health/auth/subscription delivery and measured resource comparison.
3. Legacy Firebase inventory/reconciliation, dedicated runtime identity/config and payment authorization, followed by website/portal/Academy/booking acceptance.
4. Supersonic verified backups and schema/document reconciliation, scoped operator authorization, dedicated runtime identity/config and application acceptance; live-transmission approval stays separately gated.
5. Representative Course Builder lesson completion and verified approved B2 media, records, audible narration and synchronized captions.
6. Admin exact read-only inventory IAM preparation, candidate deployment and live permission/tenant/usage/alert/action verification. Unknown usage/cost remains unknown. New Legacy/tax identities require separate owner provisioning authority; never substitute Admin or grant Owner/Editor.

The coordinated release hold must remain until its applicable prerequisites pass through the authorized release process. Healthy serving revisions, trial storage, active jobs, rollback targets and concurrent PARIS work must remain preserved.


## Verified continuation: source repairs and Studio cloud recovery — 22:24 UTC

This is candidate acceptance, not certification of overall production separation.

- QuickBooks production-boundary repair: `dc9060d06fe8fe5f9cba43bd7299e6c1e130c69b`,
  followed by environment documentation/comparison diagnostics in
  `d98845e88b5f1fe548036ebbc9b98098a5d720da`. Both reached main through a normal
  fast-forward after CI Required Gate and Integrity Gate passed. Focused tests:
  28 passed; Store configuration tests: 45 passed. No financial transaction,
  credential rotation, merchant reassignment or application deployment occurred.
  Production-only API requests, Admin reconnect/sync, callback and contractor
  accounting now refuse a sandbox/unverified environment in source. This does
  not turn sandbox credentials into production credentials.
- Fresh, value-free database checks found `QB_ENVIRONMENT=sandbox`, matching
  canonical/stored client identity and secret, different canonical/stored company
  identifiers, and an expired access-token timestamp. No credential values or
  company identifiers were emitted. Preserve the existing relationship until
  matching production app/company authorization is verified securely.
- Studio repair: `502dca60ccb2c994cba0e81f4d625dbab27ab92b`. A real Chromium
  regression reproduced saved viewport state being ignored during context
  recreation; the restore path and returned dimensions were corrected.
- Exact-commit CI: run `39074027241` passed CI Required Gate; Integrity run
  `39074033152` passed. Studio validation `39074058767` passed 129 nonroot
  container/Chromium tests with zero skips, 262 Admin/browser integration tests
  across 50 files, and 25 identity/cutover tests. Additional focused local
  recovery/preflight/cutover safety checks: 28 passed. Plaintext credential
  scanning and workflow syntax checks passed.
- One candidate build/staging run: `39074348694`, job `117518305802`, success.
  Immediately before staging, regional capacity verification returned required
  **17 vCPU / 36 GiB**, granted **20 vCPU / 40 GiB**, `fits=true`. This is an
  allocation bound for the rollout, not observed CPU/memory usage or billing.
- Candidate `elevate-studio-browser-00043-tuf` passed all 15 live browser
  foundation checks. At **22:21:50Z**, `studio-runtime-replacement-v1` passed:
  an isolated encrypted cloud workspace file survived actual runtime replacement;
  browser tabs/order, selected tab and viewport reconnected; synthetic fixtures
  were removed; no commands were replayed. The test refuses serving revisions,
  active sessions, unclassified processes and unchanged runtime fingerprints.
  Its isolated storage prefix does not advance the serving workspace generation.
  It does not certify restoration of running OS processes, unsaved forms,
  every external authentication mechanism or customer shell-tenant isolation.
- Candidate image:
  `sha256:0748952518bc3237a228fb2b8578685a3f2eb6007b7c02b1399fb99fcc4f483f`.
  The candidate verification tag was removed after acceptance; its revision and
  the known-good production revision remain available. Minimum instances were
  not reduced, and the trial VM/disk were not changed.
- Independent Google readback: run `39074923986`, job `117519973874`, success
  at **22:24:40Z**. Revision `00043-tuf` uses
  `elevate-studio-runtime@elegant-racer-299721.iam.gserviceaccount.com`,
  2 vCPU / 4 GiB and the above immutable digest. Actual traffic remained
  **100% on `elevate-studio-browser-00039-yuv`**, with no candidate tag.
  Latest-ready `00043-tuf` is not the serving revision.
- Fresh Admin inventory readback: run `39074577796`, job `117519020235`,
  success at **22:19:48Z**: the exact six-permission role is absent and its
  Admin runtime binding is absent. `changed=false`. Studio's identity creation
  problem remains resolved; this is a different, still-unprepared Admin boundary.
- Read-only regional audit `39073348478` verified both regional Cloud Run quota
  values and direct Cloud Run/job/instance reads. Its overall failure concerns
  the broad Cloud Asset inventory section; do not reinterpret it as a failed
  quota read. Central jobs had no running executions in that observation.
  Observed instance samples do not establish CPU or memory utilization, and
  Store utilization and actual cost/credit comparisons remain unverified.
- Course storage audits `39073875555` (parallel) and `39074210180` (central)
  both stopped before container inspection. Actual template digest
  `1c6e221e95530c20ff6b85d2aca254228501c8eb6859325e70f050ee3eeb7c9d`
  differs from the current resolution of source tag `6b51ed...`, digest
  `3b2c5cf57dadc333470dc7726f0067e96ae1218c3fe54d66901d54a7aeda46d8`.
  The first digest matches earlier approved-template evidence; source-tag
  provenance must be reconciled rather than blindly replacing an image.
  The newer tag-resolution repair #1939 was preserved, and the alternative
  audit proposal was not merged over it. No worker image, execution, lease,
  generation or saved checkpoint was changed by these audits.
- The tracked course job is `failed` with explicit owner-pause diagnosis marker,
  generation 80 and no lease. It was not automatically retried. Concurrent
  #1940 (`f0b53b3e`) provides an isolated owner-approved lesson preview and B2
  connection verification; it was preserved without starting a duplicate preview.
- Supersonic count-only checks confirmed three private PDFs (1,371 metadata
  bytes), zero source `tax_documents`/`sfc_documents` rows, no storage owner IDs,
  and zero destination auth users/profiles/files. Contents and filenames were
  not read or emitted. These objects require a verified ownership/migration
  mapping and backup/rollback evidence before source dependencies are retired.
- Legacy's intended dedicated database still has zero auth users. Its private
  repository's Actions settings show no repository or environment secrets, and
  organization secrets are unavailable to that private repository on its current
  plan. No plan change or credential creation was attempted. The intended
  database has no integration/settings/secret/config tables, and no dedicated
  Legacy/tax scope was found in the primary canonical secret metadata. These
  observations do not prove that credentials are absent from another authorized
  provider. Existing Firebase authority/access and customer inventory must be
  verified before switching users; an empty destination is not permission to
  replace Firebase auth.

### Smallest owner-dependent next actions

1. Prepare the already-reviewed Admin read-only inventory role from an
   authenticated project-owner Cloud Shell in the repository checkout:
   `ADMIN_INVENTORY_APPLY=true node scripts/gcp/prepare-admin-inventory-access.mjs`.
   It verifies the exact six permissions, does not grant Owner/Editor, and does
   not deploy an application or change traffic. Do not rerun Studio identity
   creation as a substitute.
2. Verify and securely configure the matching QuickBooks production app keys,
   registered callback and authorized live company; then complete OAuth and
   provider readback. Do not paste credentials into chat or relabel sandbox keys.
   Independent PayPal sandbox lifecycle acceptance still needs an approved
   sandbox merchant/configuration; the verified live merchant must not be charged.
3. Supply authorized access for Legacy's existing Firebase/customer inventory and
   its own merchant configuration. Tax document ownership and destination access
   require reconciliation before private-object migration.

Production/Admin cutover, signed-in management acceptance, complete Store sandbox
commerce, Legacy and tax application/data boundaries, and the complete B2 lesson
acceptance remain open. The coordinated release hold remains enabled. No overall
completion percentage, absolute cost saving or production-ready claim is made.


### Concurrent private B2 owner-preview repair (22:38 UTC)

The owner-preview preflight run `39075094762` failed safely before building or
executing because the existing B2 bucket is private. Concurrent commit
`7df4b69695748dbc6dd7a122300be9ed4ee44893` (#1941) preserves the bucket ACL and
adds bounded signed reads for successfully uploaded preview objects. Its source
was preserved instead of publishing a competing implementation. Eighteen focused
resolver, preview-isolation and signed-delivery tests passed locally.

Run `39075722198` is already in progress for that exact source. No duplicate
render was started here. The immutable image build, execution and actual MP4,
narration, captions and B2 readback are not yet accepted. Signed preview links
are temporary bearer credentials and must not appear in logs or this report.
