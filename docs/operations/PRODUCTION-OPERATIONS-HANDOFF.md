# Elevate for Humanity — Development-to-Operations Release Gate

## Goal
Move the existing platform into a **stable, supportable business-operations release**, while PARIS detects and proposes repairs without requiring the owner to hunt for bugs. This PR is a **safety foundation**, not a claim that production is ready or self-healing is already deployed.

## Existing evidence and current blockers (2026-11-04)
- GitHub Actions has deployment-time readback evidence for five Course Builder workers on commit `09ebd400`, image digest `sha256:1869a68ffda84b45a7b67c7adb098cfdb634f0557eb5da2c97cc633218b94daa`. A later independent live Cloud Run readback still needs verification.
- Most recently reported Supabase snapshot: 246 completed, 77 failed, 65 queued, 2 running. **These are historical observations, not live data from this PR.**
- Known issues: held owner-pause queues, exhausted job attempts, Barber asset licensing/relevance failures, caption HTTP 401 failures, inconsistent canonical publication records, and final production acceptance not passed.
- October full-diff audit for PR #2271 must be retained as release evidence; evidence availability alone is not a passed release gate.

## What this PR changes
Adds `scripts/operations/assess-production-readiness.mjs`: an **offline, read-only, fail-closed** evaluator for a structured runtime-evidence JSON snapshot. It never contacts Supabase, Cloud Run, GitHub, or customers. It reports BLOCKED or READY_FOR_HUMAN_RELEASE_APPROVAL. The latter is **not authorization to deploy**. A unit test proves missing/stale/code-only evidence blocks, and that automatic deploy/worker restart is not permitted.

Run: `node --test scripts/operations/assess-production-readiness.test.mjs`
Evaluate a safely acquired snapshot: `node scripts/operations/assess-production-readiness.mjs /path/to/verified-evidence.json`

## PARIS self-healing policy: staged rollout
1. **Observe and correlate:** authenticated, read-only adapters for GitHub Actions, deployed Cloud Run revision/digest, Supabase job transitions/heartbeats/leases/attempts/pause origins, Sentry or equivalent runtime faults, verified payment/clock-in flows, site 404/media/player checks, and learner-facing publication evidence. Record capture time, source, source IDs, and confidence.
2. **Diagnose:** deduplicate by fingerprint and job ID; identify root causes rather than retrying the same failure; attach redacted evidence and exact repro/acceptance tests.
3. **Propose:** PARIS may open **draft PRs** with bounded code-only fixes and new tests, run CI in an isolated branch, and notify the administrator. Never edit production secrets, financial records, approvals, learner hours, or compliance evidence.
4. **Safe auto-merge only after a separate reviewed policy** identifies a low-risk, explicitly allowlisted category, required approvals, passing regression/security tests, and rollback. This PR does **not** enable auto-merge or auto-deploy.
5. **Release:** protect main; run production acceptance against **actual deployed digest**, authenticate learner playback, validate clocks, dashboards and payments; deploy via progressive rollout; verify telemetry and provide instant rollback/kill switch.
6. **Operate:** dashboard shows Green / At Risk / Blocked with human-readable causes, accountable owner, and a one-click link to the evidence. Daily noise-free digest; urgent notifications for new breakage or stuck queues; archive completed incidents.

## Invariants
- An active job with a valid lease must not be restarted or marked completed by automation.
- Owner-pause flags, retry budgets, and missing licensing evidence are never bypassed by automation.
- Publication/version changes require authenticated release provenance and learner-facing tests.
- Existing regression tests cannot be deleted or weakened to satisfy repair automation.
- Admin approval is required for database writes, job transitions, financial/payment changes, merge to main, and production deployment until individual risk-graded permissions are reviewed.
- Every action is logged with actor, timestamp, change diff, source evidence, authorization, result, and rollback reference.

## Remaining implementation work before operations handoff
- Build real **read-only evidence collectors**; do not construct pass-shaped fixtures for production.
- Connect PARIS diagnostic triage and draft PR repair loop to the existing autopilot, with rate limits, timeouts, circuit breakers, and on-call escalation.
- Connect verified failure coverage across marketing pages, authentication, staff/student/host-shop dashboards, time clocks, payments, course publishing, videos, and workers.
- Repair currently failed jobs, broken media/captions, canonical release mismatches and stuck queues through authorized, audited fixes.
- Pass all production acceptance and end-to-end user journeys; freeze nonessential features; define release owner, incident response, backup and restore, rollback drill, and a 7-day stability observation window.

**Release rule:** no production-ready claim from merged code alone. Runtime evidence + signed approval + successful canary and post-deploy checks are required.
