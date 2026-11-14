# Google quota and repository duplication audit

Reviewed current main ac3cca00 (resolved 2026-10-16) and the release/image/configuration paths below. No services, images, rollback revisions or data were deleted. This is a bounded deployment/packaging audit, not a claim to have semantically reviewed every repository line.

## Findings with exact locations

| File / lines | Observation | Impact / disposition |
|---|---|---|
| Dockerfile.marketing 42–43, 107, 138–140, 191 | Marketing and Store build and run the same apps/marketing application. APPLICATION_SERVICE changes identity, not the compiled route set. | Intentional shared source, but Store receives Marketing/tax routes and dependencies. Middleware restricts access; it does not remove compiled code. A separately packaged Store can reduce build/image scope. |
| Dockerfile.marketing 146–147 | Entire root and application node_modules are copied after standalone tracing. | Candidate for dependency pruning; existing comment documents a real styled-jsx resolution failure. Do not delete blindly. Requires final-container module and checkout tests. |
| Dockerfile.marketing 154–155 | Same root public tree copied into /app/public and /app/apps/marketing/public. | Definite packaging duplication at distinct filesystem destinations. Root tracked public content is 140.49 MiB at reviewed main. This is source payload, not measured compressed image size or allocated RAM. Runtime path consolidation is a candidate; both paths have explicit build assertions. |
| deploy-google-store-runtime.yml 145 | Store deploy explicitly selects 4 CPU, 8 GiB, min zero, max one. | High allocation relative to Marketing's 1 CPU/4 GiB despite shared application. It is not proof Store can run at Marketing's size. Load-test a smaller candidate first. These are workflow settings, not fresh Google resource measurements. |
| deploy-google-marketing-trigger.yml 257 | Marketing update selects 1 CPU/4 GiB. | Confirms resource-setting divergence for the same application. |
| deploy-google-repaired.yml 65–67 | LMS release preserves existing CPU, memory, identity, probes and secrets; changes image only. | Correct preservation, but does not establish actual current LMS allocation. |
| Dockerfile.northflank-lms 151 | Default V8 old-space ceiling is 6144 MiB. | Heap ceiling is not Cloud Run memory quota and is not a measured resident-memory value. Must fit with native allocations beneath actual container memory. |
| scripts/gcp/fix-regional-memory.mjs 39–40 | Repair changes heap/command, min/max instances and startup boost, but does not pass --memory or --cpu. | Important limitation: changing heap does not itself lower the per-instance Cloud Run resource setting. It cannot alone establish that a resource quota problem is solved. |
| deploy-google-store-runtime.yml 80–83; deploy-google-marketing-trigger.yml 78–79; deploy-admin.yml 72–74; deploy-google-repaired.yml 25–27 | Different concurrency group names. | Each workflow serializes its own group. Cross-service updates can overlap; there is no one shared release-operation lock across these paths. |
| scripts/gcp/activate-tested-public-revision.mjs 94–109 | Adds a revision-specific candidate URL before promotion. | Correct exact-candidate isolation, but tagged candidates can require capacity alongside serving revisions. LMS run 38964844912 failed here with quota_exceeded; exact quota identifier was not retained. |
| google-unified-deploy.yml 1–54 | Coordinator verifies coverage and deliberately does not dispatch a second deployment. | Not a duplicate deployer. Keep it. |
| deploy-google-lms-trigger.yml 46–91 | Push workflow dispatches a trusted workflow event; dispatched event builds/deploys. | Separate push/dispatch runs are intentional identity handoff, not evidence of two completed deployments. |

## Shared and separate resources

- LMS: its own Cloud Run service, Node process, image path and per-instance RAM.
- Store: its own Cloud Run service, Node process, image path and per-instance RAM.
- Marketing: separate Cloud Run runtime, but shares Store's Dockerfile and compiled application source.
- Admin: separate Cloud Run runtime and application.
- All these deployment paths target elegant-racer-299721/us-central1, so their regional resource allocations must fit project/region limits. Separate services do not create separate quota pools.
- Repository/shared lib/components and Supabase are intentional dependencies; they do not imply shared Node heaps.
- GitHub build-runner memory is separate from Cloud Run serving-instance memory. Deleting source or image files does not directly lower a configured Cloud Run allocation.

## Elimination priorities

1. Eliminate overlapping release operations through a consistent deployment coordination policy; preserve independently deployed services and exact-candidate verification.
2. Measure and right-size Store CPU/memory. Do not claim specific savings before validating actual memory and traffic.
3. Consolidate duplicate public asset paths after checking server working directories and generated asset URLs.
4. Replace whole-workspace runtime dependency copies with a verified minimal production dependency graph.
5. Package Store without unrelated Marketing routes if independent service boundaries remain a requirement.
6. Release demonstrably unused generated candidate tags; retain rollback revisions. Untagged inactive revisions are not automatically a source of allocated RAM or active quota consumption.

## Limits

A fresh Google control-plane inventory of per-service CPU/memory, revision min instances, current active instances, tag mappings and current quota usage is still needed to quantify available headroom. The known failure classification is quota_exceeded; these logs do not distinguish CPU, memory or another quota. No quota increase, resource resize or deployment was requested by this audit.
