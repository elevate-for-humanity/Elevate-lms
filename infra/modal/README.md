# External Course Builder acceptance slice

This release adds an **inactive**, exact-lesson Modal execution path. Supabase
`ultimate_build_jobs` remains the queue, and the existing runner remains the
renderer, lease/heartbeat/checkpoint owner and Backblaze uploader. Receipts are
execution and accounting records, not a second work queue. Public hosting and
communications are unchanged. Admin's ordinary dispatcher still selects Google.

## Local verification

```sh
npm ci --prefix infra/modal --ignore-scripts
npm test --prefix infra/modal
python -m pip install -r infra/modal/requirements.txt
python -m unittest discover -s infra/modal -p '*_test.py'
```

PGlite tests execute real PostgreSQL procedures against an isolated fixture.
They are not live Supabase/Modal/B2 acceptance or multi-process stress tests.
SDK imports validate configuration without deploying an app or invoking compute.

## Controlled enablement

1. Pass repository release gates and review migration against the current live
   schema. Apply the forward migration before external execution. It creates
   no policies, allowances or customer charges. Ordinary Google claims keep
   their existing behavior; jobs with external receipts are excluded.
2. Connect the authorized Modal workspace; inspect quota, billing/credit balance,
   deployment permission and approved spending cap. No authenticated workspace
   was available during implementation. Set a provider-level budget as well as
   the database platform/tenant limits. Runtime estimates cannot cap invoices.
3. Select the immutable current worker image containing the approved video
   renderer. Build `infra/modal/Dockerfile` using `BASE_WORKER_IMAGE` set to that
   digest. Do not use mutable tags or an old inherited renderer. Verify B2,
   narration, FFmpeg and Remotion dependencies with the image smoke checks.
4. Supply registry access through `elevate-worker-registry` (Modal registry
   credential secret), and existing database/B2/narration runtime credentials
   through `elevate-course-runtime`. These are secret references, not provisioned
   secrets. Never print their contents or copy them into source.
5. Set `MODAL_COURSE_IMAGE` to the resulting immutable image digest and deploy
   `infra/modal/app.py` only after account and financial authorization. Initial
   worker limits: two containers, one lesson each, hard 2 CPU/4096 MiB bounds,
   32768 MiB scratch disk, 1800-second timeout, zero retries, no warm minimum,
   two-second downscale window, no GPU, disposable containers on AWS.
6. Register the private broker URL and environment-scoped proxy key/secret as
   server-side `MODAL_COMPUTE_ENDPOINT`, `MODAL_PROXY_KEY`, `MODAL_PROXY_SECRET`.
   `EXTERNAL_COMPUTE_ENABLED=true` is an additional explicit runtime gate.
   Probe authenticated `health` before dispatch; unauthenticated calls must fail.
7. Only approved rates and terms may populate `external_compute_policies`.
   Platform and tenant policies must both authorize the work; all defaults deny
   spending. A paid, unexpired canonical organization subscription and feature
   entitlement plus existing Course Builder credits are required for tenants.
   Platform-owned work requires an administrator and a platform budget.
8. Choose an existing queued exact-lesson job with no lease and available retry
   allowance. Do not modify its payload to force eligibility, erase checkpoints,
   reset attempts, or take a job from a live worker. Use the operator CLI:

```sh
node scripts/compute/course-execution.mjs --action prepare --job "$JOB_ID" --actor "$ACTOR_ID" --key "$IDEMPOTENCY_KEY"
node scripts/compute/course-execution.mjs --action submit --attempt "$ATTEMPT_ID"
node scripts/compute/course-execution.mjs --action status --attempt "$ATTEMPT_ID"
```

The CLI uses the existing privileged server connection. Do not place service
credentials in command-line arguments, browser code or chat messages.

## Evidence required before production routing

Capture the original job ID, receipt, provider call ID, exact source/image,
entitlement/credit reservation, atomic claim and generation, fresh heartbeat,
saved render checkpoint, validated B2 key/object metadata, canonical LMS media
reference, actual browser playback with audio/captions, publication readback,
usage and credit settlement. A preview does not publish or approve a course.
Neither a zero exit code nor a green workflow establishes playable video.

Provider invoice costs remain null until reconciled. Allocation-time estimates
are labeled as estimates. Worker telemetry identifies Node-only CPU/RSS metrics;
they exclude FFmpeg/Chromium child-process consumption. Estimated reservations
continue to count against the platform budget after settlement until actual
provider costs are reconciled. Unknown outcomes retain reserved credits/budget.
No overage debit, prepaid pack, monthly allowance or new plan price is activated.

## Recovery and rollback boundaries

Duplicate dispatches are atomically refused. Submission timeout or lost provider
acknowledgement becomes `uncertain`; there is no automatic Google fallback.
Cancellation acknowledgement does not release a lease or refund credits. A
provider/container timeout requires receipt reconciliation after proven terminal
execution and lease expiry. This acceptance slice intentionally prevents replay
of the same paid job; automatic paid retries and abandoned-receipt reconciliation
must be completed/tested after live provider evidence is available.

Disable new dispatch at the environment and policy gates. Retain Google workers
and every checkpoint/media object. Existing Google jobs continue; a job already
assigned externally must remain quarantined until its provider is proved stopped.
Never clear its receipt merely to get Google to claim it.

PARIS/Website Builder processing migration, customer usage UI, approved allowance
catalog, recurring-payment credit grants, prepaid packs and margin reporting
remain later integration work after the first external lesson passes acceptance.
Keep the production release gate open; no live acceptance was performed locally.
