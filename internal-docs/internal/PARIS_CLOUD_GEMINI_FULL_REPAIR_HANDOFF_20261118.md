# PARIS / Elevate AI — Cloud Shell Gemini Diagnostic and Full Repair Handoff
Date: 2026-11-18. Repository: elevate-for-humanity/Elevate-lms.
Owner has authorized diagnosis, source repair, tests, safe PRs, and protected release; NOT branch-protection bypass, unapproved provider payments, student data mutation, or blind cloud resizing.

## What is actually verified
- Google Cloud project `elegant-racer-299721`. Private inference Cloud Run service `elevate-owned-cpu-llm`, region `us-east1`, revision observed `elevate-owned-cpu-llm-00003-quw`.
- Worker limits: 4 vCPU, 8 GiB, max instances 1, concurrency 1, one llama.cpp slot, context slot 8192. Minimum instances 0; startup CPU boost false.
- Model logs: ~13–14 prompt tokens/sec; output down to 1.53 tokens/sec. Two POST /v1/chat/completions requests ended in 504 after ~300s (2026-11-18 05:06 and 11:45 UTC).
- LMS values: `AI_PROVIDER=elevate`, `AI_PROVIDER_ORDER=elevate`, `PARIS_INFERENCE_TIER=cpu`, `PARIS_GPU_ENABLED=false`, `ELEVATE_LLM_TIMEOUT_MS=300000`, `ELEVATE_LLM_CONTEXT_TOKENS=8192`; primary and CPU alias both target same owned CPU endpoint.
- `scripts/gcp/deploy-owned-cpu-model.mjs` deploy policy hard-codes CPU instance/timeout limits. `scripts/gcp/activate-owned-cpu-model.mjs` distributes CPU-only authority to Admin/LMS/Marketing/Store. Cache RAM zero is intentional for 8Gi; do not enable cache RAM blindly.
- `lib/ai/ai-service.ts` explicitly selects one canonical provider to prevent unauthorized vendor fallback; `lib/ai/providers/elevate.ts` makes requests to owned-model endpoint.
- Existing owner-authorized PR #2708 (branch `fix/paris-owned-cpu-timeout-budget-20261118`) adjusts client timeout cap to 270s and excludes 504/timeouts from retry; it is NOT merged/live. Inspect PR and exact-head CI before editing; keep work on this existing track when appropriate. This is a partial correction, not a throughput fix.

## REQUIRED FIRST — read-only diagnosis
1. Confirm local git tree, actual main SHA, open PARIS/Gemini/inference PRs and current workflows. Preserve untracked `.gemini/` and any user changes. Never blindly reset/clean, overwrite or force-push.
2. Read `AGENTS.md`, `lib/ai/ai-service.ts`, `lib/ai/providers/{elevate.ts,owned-model-config.mjs,google-runtime-auth.mjs}`, `lib/ai/provider-runtime.ts`, `lib/ai/paid-inference-context.ts`, `scripts/gcp/{deploy-owned-cpu-model.mjs,activate-owned-cpu-model.mjs,verify-ai-runtime.mjs}`, `internal-docs/internal/PARIS_REPAIR_AUTOPILOT_RUNBOOK.md`, `services/llm-gpu-worker/README.md`, and existing PARIS dispatcher/repair-ledger routes.
3. Read production Cloud Run service revision, resource limits, startup probes, scaling, logs, errors, latency and metrics; inspect Cloud Run IAM policies without exposing access tokens. Read actual Admin/LMS/Marketing runtime provider selection (names and nonsecret values only); compare runtime config snapshots to container env without dumping private Secret Manager payloads.
4. Identify Gemini's existing role: Google provider code, actual credentials/configuration presence (boolean only), authorized paid-inference boundary and private-data policy. Do not automatically send student, payment, account, or repair-ledger data to Gemini or other vendors.
5. Correlate PARIS requests, timeouts and retry counts with actual dispatch/ledger events. Determine queue wait vs prefill vs decode vs cold-start; measure prompt sizes, token budgets and slot occupancy. Prove whether timeouts are from the owned model or another upstream caller.
6. Report facts vs hypotheses. Distinguish source code changes not deployed from currently serving revision.

## COMPLETE REPAIR REQUIRED
- Prevent duplicate/unsafe retries of exhausted or aborted inference attempts, propagate AbortSignal, preserve idempotency/correlation and repair-ledger evidence. Do not hide failure or mark job successful.
- Add real bounded request admission, queue/overload handling and instrumented queue wait; no unbounded in-process backlog, no lost tasks or new silent fallback. For durable repair tasks, use an existing authorized persistent job/queue path with state transitions rather than a synchronous 5-minute request.
- Budget prompts and completion tokens against measured CPU prefill/decode throughput and remaining end-to-end deadline. Reject/defer oversized synchronous jobs with an actionable structured error; do not silently truncate student/program context or produce partial repairs.
- Reconcile source-of-truth deploy settings with measured capacity; use validated config and cost-controlled changes so future deployments cannot revert the fix. GPU/provider selection requires a verified private GPU endpoint or explicitly approved provider, IAM, budget and actual acceptance tests; never merely flip `PARIS_GPU_ENABLED=true` or set `AI_PROVIDER=gemini` without approval/validation.
- Correct PARIS/Gemini provider adapter inconsistencies, if verified, while retaining canonical provider, approved data access, student isolation, paid-inference gate and secrets hygiene.
- Add unit, integration and regression tests for CPU timeouts (504, AbortError), no duplicate dispatch, oversized prompts, queue overload, cancellation, exact revision/active routing, provider authorization and ledger preservation; run relevant TypeScript, lint, security/compliance and functional tests.
- Use existing PR/repair ownership. Protected merge only after required status checks and actual enforced reviews. Avoid duplicate PRs/CI/deployments, no direct main push if protected, no emergency release bypass.
- Post-merge verify exact main SHA, Cloud Run service serving revision, latency on controlled non-sensitive short and long test prompts, no 504s under agreed load envelope, PARIS generate→validate→commit→review→deploy→verify chain as permitted, and no customer/student data mutation.

## STOP / REPORT
If external provider costs, IAM changes, new project, persistent paid GPU, branch rule change or credentials are needed, stop that specific action and provide exact permission/cost blocker; continue safe independent fixes.
Return: root cause(s), affected code blocks, commit/PR links, test run IDs and results, deployed SHA/service evidence, performance before/after, and remaining unresolved blockers. Do not claim full recovery before verifiable end-to-end proof.
