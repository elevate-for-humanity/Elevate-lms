# Google ownership audit

The repository review and the live observations below are separate acceptance evidence. Do not retire Northflank based on source-code checks alone.

## Live observations — 2026-10-07 UTC

The [Google ownership inventory](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37512752655), job 112733297236, succeeded at 09:52 UTC. All nine inventory boundaries returned successfully: instances, disks, snapshots, secret metadata, enabled services, deployment roles, Scheduler, buckets and course executions. These are actual empty inventories where stated, rather than inaccessible resources.

| Boundary | Verified Google observation | Remaining gate |
|---|---|---|
| Configuration | Six Google secrets created and imports/readback succeeded: [Marketing](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37599901504), [Admin](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37599951808), [LMS](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37600003519), [Store](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37600061331), [worker](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37600099773), [Studio](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37600187218) | Deploy/recover workloads using Google configuration. Importing volume metadata does not transfer bytes |
| Store | Image uploaded, digest sha256:14d5309c123a8b4b2391c4e60020d5a3e8b3b82c38612f7fa3f276b5c1bb3f3c. Imported 11 variables contain no database configuration | Missing database settings resolved only from Google-owned Marketing configuration. Dedicated identity, actual deployment, billing/routes and readiness remain |
| Studio | Compute instances, disks and snapshots are empty | Transfer 6144 MiB source auth volume and workspace, preserve encryption key, implement supported singleton runtime and authenticated access, verify reboot/provider acceptance and backups |
| Scheduler | API enabled and access verified; zero jobs in us-central1 | Create authenticated Google-native queue dispatcher and schedule. Existing GitHub scheduled event is outside the manual-event WIF condition |
| Object storage | Zero project buckets | Provision durable transfer/archive destinations before moving unique Studio/model data |
| Course Builder | Latest execution elevate-course-builder-j5r8g completed successfully at 2026-10-06 18:36:24 UTC | Successful infrastructure execution does not prove a completed course. Dedicated worker identity, actual queue/render acceptance and scheduling remain |
| Health checks | Prior Google startup/liveness and dependency readiness evidence remains in run 37509834503; local probe contract tests pass | Fresh runtime and user-flow acceptance remains required. No direct live-site request is accepted as new evidence in this audit |

`prepare-runtime-identities.sh` provisions separate Store and ultimate-worker identities and grants the GitHub deployment identity actAs on those two accounts only. It does not deploy, execute, grant project-wide runtime access, or change public IAM. Worker deployment now requires its own identity instead of sharing Admin's identity.

Legacy 83 remains a managed preview with nine configured pages and a dedicated Supabase backend. No custom-domain cutover is intended until its contract is complete. A targeted current-repository search and independent checks of document, contract-template, agreement and MOU records did not locate the Legacy 83 contract. Those checks cannot establish contractual completion; no final-domain migration or completion claim is authorized by them.

The [all-project source inventory, run 37512489039](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37512489039), discovered elevate-platform and elevate-media-gpu. The latter has a zero-instance L4 worker, no jobs/addons, two 81920 MiB LLM volumes (one pending, one bound/unattached), and one 153600 MiB GPU model volume bound to the stopped GPU worker. Do not recreate those legacy runtime plans in Google. Classify model downloads versus unique weights/output first: reproducible caches belong in an explicit model download/image strategy; unique data needs checksum-verified object-storage transfer. Contents have not been inspected, so none of these volumes is cleared for deletion. The current finite Google Course Builder execution does not establish equivalent WAN/GPU capabilities.

`bootstrap-runtime-config.sh` is the concrete project-administrator preparation for configuration ownership: enable Secret Manager, create the six empty secrets, and grant metadata/version-add/payload-access only on those resources. It does not deploy workloads or change public access. The importer initializes empty secrets and refuses any secret with existing versions. Do not grant project-wide secret payload access to make the import pass.

## Architecture and acceptance

| Boundary | Existing implementation | Google architecture / remaining acceptance |
|---|---|---|
| Web runtime (Marketing, Admin, LMS, Store) | Staging reads imported Google-owned configuration | Import once into Google Secret Manager; deployment reads Google thereafter. Verify all four actual services, IAM, readiness, public routes and domain records. |
| Course Builder | Finite Cloud Run Job; deployment reads Google-owned worker configuration | Same Google-owned configuration. Preserve one task, active-execution exclusion, queue leases, pause controls and zero infrastructure retries. Test an actual claim and execution. |
| Studio authentication | Encrypted account-scoped files under /var/lib/studio-browser-auth | Stateful singleton Google runtime with persistent disk; transfer encrypted files AND unchanged encryption secret. Verify checksums, decryptability, actual provider access and reboot recovery before connecting consumers. |
| Studio workspace | /workspace/project contains editable repository and terminal work | Inventory and transfer uncommitted workspace changes. Auth disk alone does not preserve this workspace. |
| Studio deployment | create-with-container; no runtime environment, transfer, gateway or acceptance | Replace deprecated container startup dependency with supported VM startup/systemd or GKE runtime. Private networking, authenticated gateway, durable mounts with UID 1001 ownership, health monitoring and backups required. |
| Secrets / files | Runtime templates resolved from Northflank; web and worker reject files/volumes | Secret Manager is authoritative after import. Never silently drop secret files or persistent mounts; dedicated transfer remains mandatory. Runtime delivery should subsequently use per-secret Cloud Run references and least-privilege service accounts. |
| Networking | Web domains already Google; Studio consumers may reference source URLs | Audit Admin, worker and LMS URLs together. Reject any remaining Northflank runtime URLs before retirement. |
| Operations | Multiple Northflank deploy/recovery workflows still exist | Inventory active schedules, addons, jobs and automatic deployment triggers. Transfer required behavior to Google; deactivate source writers only after equivalent runtime acceptance. |

## Order

1. Capture live source and Google resource inventories, including inherited variables, files, mounts, commands, probes, jobs, addons, IAM and routing. Missing observations are failures, never empty success.
2. Import each component's resolved configuration once using `import-google-runtime-config.yml`. Imports refuse replacement; configuration thereafter belongs to Google. All six imports succeeded with exact readback; future changes require an explicit Google-owned configuration update.
3. Stage web services and Course Builder using only Google configuration. Existing services continue running while this is tested. Preserve an exact rollback revision.
4. Transfer Studio state and workspace to a supported singleton Google runtime, prove restart recovery and provider authentication, then switch consumers.
5. Verify public Store behavior, billing, documents, clock-in, dashboards, browser controls and a real course render. Health HTTP 200 alone is insufficient.
6. Remove source deployment triggers and demonstrate Google deploy/recovery with Northflank credentials unavailable before stopping source services.

No source shutdown is implemented or authorized by passing local contract tests.
