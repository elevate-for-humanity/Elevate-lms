# Northflank to Google migration readiness — 2026-10-06

Status: partially migrated. Marketing, Admin and LMS are live on Google. Full six-service configuration parity, Store, Studio persistence and worker scheduling are not yet accepted. Do not shut down or delete source recovery materials based on this document.

## Verified source
GitHub Actions run 37387850342 successfully queried Northflank's management API using the existing production connection. Six services were returned, each with zero instances:

| Service | Existing Dockerfile | Last deployed commit |
|---|---|---|
| Marketing | Dockerfile.marketing | b51fc39df5089b28f8a9a125e73ac949c9c06356 |
| Admin | Dockerfile.northflank-admin | a489d753d92483f0d4ac529a96c0cb873f986014 |
| LMS | Dockerfile.northflank-lms | 2ec774411d0ab7874e038f5c4ffce942ac259349 |
| Store | Dockerfile.marketing | 62894db654903b7f62e5a4d280e85ffca47bf050 |
| Studio browser | Dockerfile.studio-browser | 66c268042d8b1374353390571df4a705ca54bcfd |
| Ultimate worker | Dockerfile.ultimate-worker | 111a9e19e9f4469712247d3f9ed00b3ae9ee12ff |

Supabase project cuxzzpsyufcewtmicszk is ACTIVE_HEALTHY. Storage bucket metadata, ultimate_build_jobs, video_generation_jobs, video_jobs and the claim_video_jobs RPC were found. No cron command contained "northflank". This does not prove all scheduled endpoints work. No student data, schema, RLS, queues or bucket permissions were changed.

## Preserve the existing platform
- Keep the existing Supabase project, user identities, records, storage and policies.
- Preserve each service's effective configuration, including attached secret groups and service overrides. The inventory contains names only, not credentials.
- Preserve Store's STORE_ONLY_RUNTIME and store URLs.
- Preserve Admin/Studio shared authentication, learner-runthrough secrets, phone, email, payment and media connections.
- Do not silently change the narration provider or activate archived LLM/GPU resources.
- The continuous Ultimate worker is not an HTTP web service. Do not deploy its Dockerfile as a request-driven service or start another worker until lease/pause behavior is checked.
- Studio uses /var/lib/studio-browser-auth in the provisioning code. Verify the actual source volume and recover its encrypted contents before cutover. A new empty volume is not a migration.
- Inspect downloaded media and any files outside Supabase/object storage before terminating the source.
- Source commits differ. Building main transfers current source, not the exact old running images. Validate changes against each recorded source commit.

## Prepared automation
- authorize-github.sh: scoped, keyless Google authorization for this repository's manual main-branch workflows.
- verify-google-cloud.yml: read-only authenticated connection check.
- inventory-migration-source.yml: read-only source topology inventory.
- build-google-migration-images.yml: builds the existing Dockerfiles for all six components and uploads SHA-tagged images to Artifact Registry after authorization. It does not deploy containers.

Google project: elegant-racer-299721, region us-central1. Authenticated verification run 37489183780 confirms healthy Marketing, Admin and LMS, including Supabase readiness, on deployed commit 23f09682ade2f2989aa3312d3f6b80d96c8284d1. Existing web capacity is 4 CPU / 8 GiB per service, minimum 1 and maximum 1 instance. Store public health returns 503; the public QuickBooks health route returns 404. These failures remain open.

## Completion order and acceptance

| Work | Configuration and acceptance | Current state |
|---|---|---|
| Effective environments | Run audit-google-runtime-parity.yml on main; compare inherited and direct values in memory, transfer missing values directly into Google without logging them; repeat until all six services match approved adaptations. | New audit requires merge and an approving write-access review. |
| Web health | Run configure-google-health.yml serially; use /api/ping for startup/liveness and /api/ready plus /api/health for deployment acceptance. Preserve existing runtime configuration and capacity. | Probe reconciliation prepared; not executed. |
| New application release | Build pinned-SHA Google images, deploy serially with deploy-google-repaired.yml, verify health, Admin executor and QuickBooks; retain prior image and revision for rollback. | Current Google release predates the new checks. |
| Store | Build the Store image from Dockerfile.marketing, preserve STORE_ONLY_RUNTIME and exact Store variables, provision an appropriate runtime identity, verify checkout and domain/TLS before routing Store to Google. | Public endpoint unhealthy; target and permissions must be verified by audit. |
| Studio browser | Preserve shared Admin/browser and learner credentials, port 3100, session policy and domain restrictions. Recover encrypted authentication-state contents and migrate to verified persistent storage before enabling sessions. | Source project volume exists; contents and target persistence unverified. |
| Worker | Preserve finite-job leases, pause controls, queue claims, retry/idempotency and execution overlap limits; prove a queued job and its persisted outputs. Verify scheduled authentication independently from manual dispatch. | Course-builder Google job exists; schedule and complete processing unverified. |
| Other dependencies | Inventory source jobs/addons/unattached secret groups; classify active dependencies and recovery-only resources. Validate storage, email, phone, media and billing integrations without sending unsolicited communications or charging customers. | Inventory and application acceptance outstanding. |
| Exit Northflank | Retarget active deployment/health workflows and scheduled URLs to Google. Verify DNS and every public domain. Remove deployment dependence only after all above checks pass; retain source recovery data. | Health monitor replacement prepared; legacy deploy workflows remain. |

The current authorization bootstrap restricts Google OIDC to manual main-branch workflows. A scheduled worker workflow cannot be assumed to authenticate under that policy. Dedicated runtime identities, persistent storage and domain routing must be verified against actual Google permissions; GitHub deployment authorization alone does not prove those administrative permissions exist.
