# Northflank to Google migration readiness — 2026-10-05

Status: preparation only. No Google deployment, DNS change, database migration, secret export or source-service change has been made.

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

## Remaining gates
1. Complete Google authorization and verify its workflow.
2. Inventory complete effective environments, volume attachments/content and any jobs/addons outside the primary project.
3. Choose target runtime for continuous worker and persistent Studio based on measured resource requirements; web-only Cloud Run is insufficient for the whole topology.
4. Securely transfer runtime credentials directly between trusted systems; never commit them or put them in artifacts/logs. Production credentials must not be Docker build arguments.
5. Build each image and verify packaged runtime. Image-build workflow is not yet executed.
6. Deploy isolated staging, verify login, dashboard permissions, uploads, payments, phone/email, media, Studio sessions and a controlled course job. A container-ready response alone is not acceptance.
7. Review cost limits and domain/TLS routing, then cut over with a rollback record.
8. Retain source volumes and recovery materials until acceptance.

Google project: elegant-racer-299721. Billing linkage was shown by the owner. Google permissions and runtime access remain unverified.
