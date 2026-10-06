# Google ownership audit

The repository review and the live observations below are separate acceptance evidence. Do not retire Northflank based on source-code checks alone.

## Live observations — 2026-10-06 UTC

| Boundary | Northflank observation | Google observation | Remaining gate |
|---|---|---|---|
| Marketing, Admin, LMS | All three source services report zero instances | Resolved environment parity passed. Startup and liveness probes installed; both dependency health and readiness passed for all three in [run 37509834503](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37509834503) | Google-owned configuration import and deployment/recovery without source credentials |
| Store | Source service reports zero instances | Parity audit found no mapped Cloud Run target; Google Store image build started in [run 37511152443](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37511152443) | Image upload, scoped runtime identity, configuration, actual target, billing routes, DNS and readiness |
| Studio | 6144 MiB auth volume is BOUND and attached to elevate-studio-browser; no backup schedules. Source service reports zero instances | Compute Engine instances and disks both empty in [run 37510506802](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37510506802) | Supported singleton runtime, state/key/workspace transfer, private/authenticated networking, backups and restart/provider acceptance |
| Course Builder | Source worker reports zero instances | Resolved environment parity passed. [Run 37511074343](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37511074343) successfully dispatched elevate-course-builder-j5r8g | Execution completion, resulting course acceptance, and Google-owned scheduling |
| Configuration | Source resolved variables and files are readable | Secret Manager absent from enabled API inventory. Import reached destination inventory and failed in [run 37509744077](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37509744077) | Enable API, provision six configuration secrets and confined access, import/readback all components |
| Scheduling/backups/IAM | Source auth volume has no scheduled backup | Cloud Scheduler absent from enabled APIs. Snapshot, bucket and project IAM inventories unavailable | Resolve access failures; unavailable inventories cannot be treated as empty resources |

Source attachment evidence: [run 37510213829](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37510213829). Import must discover standalone attached volumes, because Studio's service deployment object does not declare its auth volume.

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

Source shutdown is authorized only after replacement acceptance. Local contract tests do not satisfy that condition.

## Current verification and blocked acceptance

Fresh inventory [37542510832](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37542510832) failed on 2026-10-06 at 22:45 UTC. Instances, disks, enabled APIs and course executions were observed. Snapshot inventory failed; Secret Manager metadata, Scheduler and bucket inventories returned permission denied; project IAM inspection returned API disabled. These boundaries remain unknown. Secret Manager and Scheduler API enablement alone did not grant the deployment identity access.

The affected identity is `elevate-github-deploy@elegant-racer-299721.iam.gserviceaccount.com`. A Google project administrator must prepare scoped configuration access using `bootstrap-runtime-config.sh` and grant the missing inventory permissions / enable the IAM inspection API before rerunning inventory. The deployment identity cannot grant itself this access. Do not grant project-wide secret payload access.

The six JSON configuration secrets are an import staging format, not the final per-secret delivery architecture. Production acceptance additionally requires individual Secret Manager secret references, dedicated runtime identities and an explicit service-to-secret allowlist. QuickBooks, Telnyx, Studio and worker credentials must remain confined to their consuming services. The compatibility secret reader now uses only the service's injected environment; it neither enumerates nor hydrates a shared credential store. Existing Admin credential editors still require Google Secret Manager replacement before final acceptance.

Repair validation: Marketing/Admin/LMS TypeScript checks, repository lint, 53 focused application tests, and 46 Google deployment contract tests passed locally. The production readiness gate could not verify live Supabase without credentials and its Store proof encountered a local IPC permission error. Production build, live routing, credential delivery and state acceptance remain unverified by these local checks.

## Complete responsibility comparison

| Northflank responsibility | Google replacement / improvement | Acceptance still required |
|---|---|---|
| Marketing, Admin, LMS and Store containers | Four Cloud Run Services with digest-pinned revisions and individual identities | Store runtime; all public workflows, configuration and rollback |
| Course Builder queue worker | Finite Cloud Run Job, queue leases and active-execution exclusion | Dedicated worker identity; actual course completion and lease recovery |
| Video and rendering | Cloud Run Jobs; Kokoro narration and local Whisper; AI_PROVIDER=none | Render artifact, timing, retry and resource acceptance |
| Container builds / registry | Cloud Build and Artifact Registry | Current workflow builds in GitHub; native Cloud Build replacement remains |
| Shared and per-service secrets | Individual Secret Manager secrets with service-specific IAM | Direct value transfer/readback; scope audit; retired Stripe and commercial AI excluded |
| Cron and build triggers | Cloud Scheduler plus Google build/deploy controls | Source trigger inventory; real scheduled execution; no duplicate writers |
| Deployment authorization | GitHub OIDC/WIF to Google | Dispatch works; scheduled GitHub event fails current attribute condition; use Google scheduling |
| Probes, logs and alerts | Cloud Run probes, Cloud Logging and Cloud Monitoring | Alert delivery, failure detection and recovery verification |
| Studio Browser and authentication volume | Supported stateful Google compute with persistent disk | Transfer encryption key, auth files and workspace; decrypt/restart/provider checks |
| Service identity and internal authorization | Dedicated service accounts, least-privilege IAM and OIDC | Worker/Studio currently reuse Admin identity and must be separated |
| Scaling and GPU infrastructure | Google resource limits and demand-based scaling; GPU only if proven necessary | Capacity, concurrency and execution verification |
| Northflank APIs / configuration editor | Google APIs; masked Admin operational inventory and Secret Manager control | Remove all production Northflank API paths; no raw secret values in UI |
| Admin infrastructure, builds and health | Actual Google service health and queued Google build/deploy dispatch | UI build request now dispatches rather than claiming health is a deployment; live acceptance remains |
| Supabase autopilot target | Google deployment controller with authenticated request handling | Current webhook placeholder requires implemented receiver and end-to-end verification |
| Recovery and SHA verification | Google rollback/recovery workflows and revision/image digest verification | Exercise recovery with Northflank credentials unavailable |
| Northflank removal | Disable source triggers, remove runtime credentials/configuration, then delete source resources | All preceding acceptance evidence; historical tooling unreachable from production |

Supabase remains database/Auth/RLS/queues/storage. Cloudflare remains DNS/proxy; Cloudflare TTS must not become Course Builder narration. No secret transfer, Studio state migration or source deletion has been represented as complete.
