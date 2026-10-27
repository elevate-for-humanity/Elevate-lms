# Platform separation: coordinated release evidence — 2026-10-17

This supplements the earlier readback. It does not certify the separation complete.
No application container or serving traffic has been changed by this continuation so far.
The release hold remains enabled. A merged repair is not evidence that it is serving.

## Independent acceptance gates

| Component | Implemented in code | Tested | Deployed | Verified live |
| --- | --- | --- | --- | --- |
| Studio | Workspace archives, owner-scoped encrypted browser recovery, existing terminal/reconnect repairs; PR #1933 pending exact final checks | 129 local real Chromium/service/storage checks; 262 integration tests; final release/identity contracts | Serving 00039-yuv remains unchanged | Existing state inventoried; full live replacement and dedicated-identity cutover still pending |
| Store | Independent config preparation, verified canonical PayPal migration, provider family/environment preservation (#1929, #1930) | 45 focused migration/config tests; 82 commerce/provider/entitlement regressions | Config secret version 2 created; no container deployment | PayPal authorization and registered webhook verified; no transactions; QuickBooks and sandbox commerce acceptance pending |
| Legacy 83 | Exact dedicated database-origin checks, privileged server-only exports; dedicated repository PR #2 | 15 tests, TypeScript and complete Next production build in CI | No independent Google runtime verified | Existing Firebase/customer reconciliation and complete application acceptance pending |
| Supersonic | Removed blanket general-profile tax access in empty destination; source and private documents preserved | Transactional denial/owner/backend tests; migration and rollback rehearsal | Destination security migration applied; no application runtime deployed | Dedicated application, data migration, authentication and provider acceptance pending |
| Course Builder | Existing independent orchestration/checkpoints retained | Existing regressions included in 262 integration tests | Existing execution preserved | Active job has a live lease; complete B2 MP4/narration/captions acceptance pending |
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

1. Studio full live workspace/browser runtime-replacement acceptance, fresh state inventory and controlled dedicated-identity cutover. File/history restoration does not restore arbitrary running OS processes or replay interrupted commands. Supported browser persistence covers tabs, active tab, viewport, cookies and localStorage; unsaved DOM and IndexedDB are not certified.
2. Store complete independent config, exact authorized secret bindings, secure QuickBooks merchant/environment reconciliation, approved sandbox end-to-end commerce, deployed health/auth/subscription delivery and measured resource comparison.
3. Legacy Firebase inventory/reconciliation, dedicated runtime identity/config and payment authorization, followed by website/portal/Academy/booking acceptance.
4. Supersonic verified backups and schema/document reconciliation, scoped operator authorization, dedicated runtime identity/config and application acceptance; live-transmission approval stays separately gated.
5. Representative Course Builder lesson completion and verified approved B2 media, records, audible narration and synchronized captions.
6. Admin exact read-only inventory IAM preparation, candidate deployment and live permission/tenant/usage/alert/action verification. Unknown usage/cost remains unknown. New Legacy/tax identities require separate owner provisioning authority; never substitute Admin or grant Owner/Editor.

The coordinated release hold must remain until its applicable prerequisites pass through the authorized release process. Healthy serving revisions, trial storage, active jobs, rollback targets and concurrent PARIS work must remain preserved.
