# Google ownership audit

The repository review and the live observations below are separate acceptance evidence. Do not retire Northflank based on source-code checks alone.

## Live observations — 2026-10-06 UTC

| Boundary | Northflank observation | Google observation | Remaining gate |
|---|---|---|---|
| Marketing, Admin, LMS | All three source services report zero instances | Resolved environment parity passed. Startup and liveness probes installed; both dependency health and readiness passed for all three in [run 37509834503](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37509834503) | Google-owned configuration import and deployment/recovery without source credentials |
| Store | Source service reports zero instances and is excluded from the shared production environment | Image uploaded in [run 37511152443](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37511152443), digest sha256:14d5309c123a8b4b2391c4e60020d5a3e8b3b82c38612f7fa3f276b5c1bb3f3c. No mapped Cloud Run target | Scoped runtime identity, Google configuration, actual target, billing routes, DNS and readiness. Fill only missing database settings from Google-owned Marketing configuration; retain Store flags and billing keys |
| Studio | 6144 MiB auth volume is BOUND and attached to elevate-studio-browser; no backup schedules. Source service reports zero instances | Compute Engine instances and disks both empty in [run 37510506802](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37510506802) | Supported singleton runtime, state/key/workspace transfer, private/authenticated networking, backups and restart/provider acceptance |
| Course Builder | Source worker reports zero instances | Resolved environment parity passed. [Run 37511074343](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37511074343) dispatched elevate-course-builder-j5r8g. [Inventory run 37512752655](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37512752655) confirms Completed=True, succeeded=1, completed 18:36:24 UTC | Resulting course acceptance and Google-owned scheduling |
| Configuration | Source resolved variables and files are readable | Secret Manager absent from enabled API inventory. Import reached destination inventory and failed in [run 37509744077](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37509744077) | Enable API, provision six configuration secrets and confined access, import/readback all components |
| Scheduling/backups/IAM | Source auth volume has no scheduled backup | Cloud Scheduler absent from enabled APIs. Snapshot, bucket and project IAM inventories unavailable | Resolve access failures; unavailable inventories cannot be treated as empty resources |

Source attachment evidence: [run 37510213829](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37510213829). Import must discover standalone attached volumes, because Studio's service deployment object does not declare its auth volume.

The foundation repair was attempted in [run 37511761681](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37511761681). Google rejected both API enables because elevate-github-deploy lacks serviceusage.services.enable. This is a verified permission blocker, not a source compatibility failure. The latest inventory also reports disabled Secret Manager, Cloud Scheduler and project-IAM API access, and denied bucket-list access. The console is unavailable from this session; administrator preparation cannot be completed through the current identity.

The [all-project source inventory, run 37512489039](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37512489039), discovered elevate-platform and elevate-media-gpu. The latter has a zero-instance L4 worker, no jobs/addons, two 81920 MiB LLM volumes (one pending, one bound/unattached), and one 153600 MiB GPU model volume bound to the stopped GPU worker. Do not recreate those legacy runtime plans in Google. Classify model downloads versus unique weights/output first: reproducible caches belong in an explicit model download/image strategy; unique data needs checksum-verified object-storage transfer. Contents have not been inspected, so none of these volumes is cleared for deletion. The current finite Google Course Builder execution does not establish equivalent WAN/GPU capabilities.

`bootstrap-runtime-config.sh` is the concrete project-administrator preparation for configuration ownership: enable Secret Manager, create the six empty secrets, and grant metadata/version-add/payload-access only on those resources. It does not deploy workloads or change public access. The importer initializes empty secrets and refuses any secret with existing versions. Do not grant project-wide secret payload access to make the import pass.

## Architecture and acceptance

| Boundary | Existing implementation | Google architecture / remaining acceptance |
|---|---|---|
| Web runtime (Marketing, Admin, LMS, Store) | Staging fetches inherited Northflank configuration each deployment | Import once into Google Secret Manager; deployment reads Google thereafter. Verify all four actual services, IAM, readiness, public routes and domain records. |
| Course Builder | Finite Cloud Run Job; deployment still fetches Northflank variables | Same Google-owned configuration. Preserve one task, active-execution exclusion, queue leases, pause controls and zero infrastructure retries. Test an actual claim and execution. |
| Studio authentication | Encrypted account-scoped files under /var/lib/studio-browser-auth | Stateful singleton Google runtime with persistent disk; transfer encrypted files AND unchanged encryption secret. Verify checksums, decryptability, actual provider access and reboot recovery before connecting consumers. |
| Studio workspace | /workspace/project contains editable repository and terminal work | Inventory and transfer uncommitted workspace changes. Auth disk alone does not preserve this workspace. |
| Studio deployment | create-with-container; no runtime environment, transfer, gateway or acceptance | Replace deprecated container startup dependency with supported VM startup/systemd or GKE runtime. Private networking, authenticated gateway, durable mounts with UID 1001 ownership, health monitoring and backups required. |
| Secrets / files | Runtime templates resolved from Northflank; web and worker reject files/volumes | Secret Manager is authoritative after import. Never silently drop secret files or persistent mounts; dedicated transfer remains mandatory. Runtime delivery should subsequently use per-secret Cloud Run references and least-privilege service accounts. |
| Networking | Web domains already Google; Studio consumers may reference source URLs | Audit Admin, worker and LMS URLs together. Reject any remaining Northflank runtime URLs before retirement. |
| Operations | Multiple Northflank deploy/recovery workflows still exist | Inventory active schedules, addons, jobs and automatic deployment triggers. Transfer required behavior to Google; deactivate source writers only after equivalent runtime acceptance. |

## Order

1. Capture live source and Google resource inventories, including inherited variables, files, mounts, commands, probes, jobs, addons, IAM and routing. Missing observations are failures, never empty success.
2. Import each component's resolved configuration once using `import-google-runtime-config.yml`. Imports refuse replacement; configuration thereafter belongs to Google. This requires Secret Manager API/IAM privileges on the deployment identity and is not yet executed.
3. Stage web services and Course Builder using only Google configuration. Existing services continue running while this is tested. Preserve an exact rollback revision.
4. Transfer Studio state and workspace to a supported singleton Google runtime, prove restart recovery and provider authentication, then switch consumers.
5. Verify public Store behavior, billing, documents, clock-in, dashboards, browser controls and a real course render. Health HTTP 200 alone is insufficient.
6. Remove source deployment triggers and demonstrate Google deploy/recovery with Northflank credentials unavailable before stopping source services.

No source shutdown is implemented or authorized by passing local contract tests.
