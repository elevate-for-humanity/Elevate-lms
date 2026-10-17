# Independent Store, Supersonic Fast Cash and Course Builder — production separation gates

Project: `elegant-racer-299721`, region `us-central1`.
No runtime move, database copy, DNS modification, IAM change or deployment is authorized by this plan alone.

## Verified code-level starting point

- Store is already a distinct Cloud Run application (`elevate-store-migration`), but `scripts/gcp/stage-web.mjs` merges an approved subset of Marketing runtime environment into Store via `completeStoreConfig()`. This is a remaining *configuration dependency*, not an independent credential boundary.
- Course Builder is already deployed as finite Cloud Run job `elevate-course-builder` via `scripts/gcp/deploy-course-job.mjs`, with one task and parallelism one. Its recovery has an image mismatch safety gate; do not bypass it.
- Supersonic Fast Cash appears in tax code and Supabase migrations. A separate dedicated production service and independent tax database binding must be proven with live deployment and database evidence; do not assume independence based on source tree.
- Current regional effective quotas from October 17 diagnostic: 20 vCPU / 40 GiB. Separate services in the same region still share quota.

## Target boundaries

### Store — independent application, shared brand
- Keep `store.elevateforhumanity.org`; main Marketing site links to Store.
- Store independently deployable with independent secret references, service identity and deployment health gates.
- Store owns catalog, cart, checkout, order lifecycle and subscription billing integration. Ensure payment provider webhooks validate signatures and idempotency.
- Admin integrates via authenticated least-privilege APIs/events only, not by assuming Marketing runtime credentials.
- Remove `completeStoreConfig` Marketing inheritance only **after** mapping every credential to Store-owned approved Secret Manager references and passing commerce acceptance.
- Preserve existing order records, SKU/price mappings, subscriptions and payment links. Do not migrate or delete data solely to separate code.

### Supersonic Fast Cash — separate tax security boundary
- Dedicated runtime, domain/subdomain, service identity, approved secrets, database ownership, ingress and release lane.
- Do not copy IRS/taxpayer PII into Elevate Marketing or LMS databases. Inventory any mixed Supabase tables and migrations and prepare audited transfer/cutover with backups, counts, access checks, and rollback.
- Keep IRS e-file and payment functionality gated until legal/security requirements and provider approvals verified; no synthetic production acceptance.
- Marketing may link to the tax service, not host its confidential processing routes.

### Course Builder — separate finite compute lane
- Keep build/render workers out of request-serving Marketing, Store, Admin and LMS.
- Maintain one-job parallelism under capacity gates. Validate digest-to-execution provenance before restarting failed media jobs.
- Artifacts/media stored in B2 with durable job checkpoints; UI communicates via scoped API/queue.
- Explicitly reserve rollout headroom before scheduling render jobs; 15 vCPU/32 GiB configured service maxima plus 4 vCPU/8 GiB job can exhaust 40 GiB regional memory quota.
- Preserve existing courses and checkpoints; never reset incomplete jobs without an evidence-backed recovery decision.

## Cutover acceptance checklist

1. Capture current production 100%-traffic serving revisions, commit labels/version endpoint, CPU/memory allocations and actual instance metrics.
2. Catalog Store's inherited secrets without logging values; establish Store-only references and rollback.
3. Inventory Supersonic tax routes, DB tables, policies and live service binding; prove complete isolation before cutover.
4. Document Course Builder execution image digests and establish safe resume on the approved image.
5. Run API, payments, webhook, billing, subscription, DNS/TLS, auth and unauthenticated redirect tests.
6. Stage changes without routing public traffic; require healthy revisions and passing security/credential/lockfile/integrity gates.
7. Deploy at most one web component at a time with capacity preflight. Use explicit go/no-go and rollback evidence.
8. Only then switch any traffic or canonical links. Do not terminate existing services until successor acceptance passes.

This document records implementation gates, **not** certification that all three are isolated in production.
