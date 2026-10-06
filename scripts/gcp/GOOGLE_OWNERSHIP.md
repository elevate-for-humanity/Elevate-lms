# Google ownership audit — repository evidence

This is source-code evidence, not a live resource inventory. Do not retire Northflank based on this document.

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
