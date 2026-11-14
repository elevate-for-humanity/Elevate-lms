# Health and regional deployment repairs

## Implemented

- Shared health now probes both Supabase Auth settings and a real read-only PostgREST programs query. Both must pass. Responses contain status/timing/error class, never row contents or credentials. Anonymous SQL read permission for the selected public catalog table was independently verified in a rolled-back production transaction.
- Public monitoring retains allowlisted dependency, Auth and database diagnostics instead of dropping them. Timeout, malformed JSON and network errors remain distinguishable without logging raw exception messages.
- Build readiness requires a full commit SHA and falls through empty primary environment values.
- Main automatic Admin, Marketing, Store and generic/LMS release paths share google-runtime-us-central1 concurrency. Build-only jobs remain independent. This coordinates these release paths; it is not a distributed lock against every manual tool or unrelated workflow.
- Regional read-only audit now also runs audit-runtime-capacity.mjs, which inventories us-central1/us-east1 and reads their approved Cloud Run CPU/memory quotas. This prepared audit has not executed after modification. Earlier live inventory covered central only.

## Region/cutover evidence

Google supports Cloud Run in other regions. The repository already includes east1 worker image synchronization and Marketing cutover code. A fresh anonymous request to the prepared east1 Marketing service URL returned HTTP 403. That does not prove its authenticated backend is unhealthy, but blocks public website cutover as currently observed. No IAM binding or traffic change was made.

A regional move requires a verified target revision, target quota, runtime identity/secrets access, artifact access, regional NEG/load-balancer route, authentication audience/callback consistency, storage/network bindings and database latency checks. Do not infer readiness from the existence of deployment source.

Store currently runs a separate Cloud Run service and Node process; it builds apps/marketing, not apps/lms. Full Store packaging separation remains outstanding. The existing Dockerfile builds all Marketing routes for both images. No separate apps/store implementation or repository was fabricated in this repair.

## Validation

26 health, monitoring, readiness and regional-capacity tests pass. Marketing TypeScript and focused health lint pass. Existing lint pages-directory warning remains. Six changed workflow YAML files parse and git diff --check passes. LMS TypeScript passes with the bounded 5120 MiB heap after restoring server/remotion source directories omitted by the sparse checkout. Initial failures were local heap/checkout limitations. No deployment, regional service creation, resizing, database schema change or traffic cutover initiated.

## Remaining

Run the expanded regional audit from merged code; complete separate Store packaging and final-container tests; diagnose the prepared east1 access boundary using authenticated resource evidence; then perform one reviewed regional cutover with rollback evidence. The exact quota identifier behind the earlier failed LMS tag operation remains unverified; neither CPU nor memory is asserted as the sole cause.
