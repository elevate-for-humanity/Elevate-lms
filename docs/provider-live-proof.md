# Owned CPU provider — live proof runbook

Service: `elevate-owned-cpu-llm`, project `elegant-racer-299721`, region `us-east1`.
Private URL: https://elevate-owned-cpu-llm-aabnh2y32a-ue.a.run.app
Model: `elevate-local` (Qwen2.5-7B-Instruct, Q4_K_M), 4 CPU / 8 GiB, concurrency 1,
min 0 / max 1. Admin connects via `ELEVATE_LLM_CPU_URL` + `ELEVATE_LLM_CPU_SECRET`
with `ELEVATE_LLM_GOOGLE_IAM=true`.

## 1. Read-only live re-proof (changes nothing)

Dispatch the verification workflow with the connect job turned off. It runs the
same checks that passed on 2026-11-13: unit contracts, real private inference as
the deployment identity (`accept-owned-cpu-model.mjs`: auth enforced, catalog
lists `elevate-local`, 2+2 inference, forced tool call, streaming), and model
discovery under the actual serving Admin identity (`probe-owned-cpu-admin.mjs`).

```bash
gh workflow run verify-owned-cpu-access.yml --ref main -f connect=false
```

Success looks like: `verify` job green; the Admin-identity probe reports
`verified: true` with `discovery.httpStatus: 200` and `elevate-local` in the
model catalog. The `connect` job is skipped. If `verify` fails, do not activate
anything — preserve the current Admin configuration and serving revision.

## 2. Full activation (only after a green verify, and only when a config change is wanted)

```bash
gh workflow run verify-owned-cpu-access.yml --ref main -f connect=true
```

The `connect` job re-runs `activate-owned-cpu-model.mjs`: it re-checks access,
stages a new Admin revision with the endpoint aliases, health-checks it, routes
traffic, and updates the lms / marketing / store consumers best-effort. This is
the path that ran successfully on 2026-11-13 (run `43341661249`).

## 3. Live PARIS chat proof (release step 7, still open)

After a green verify, prove a real PARIS chat turn and one internal code-repair
turn through the owned provider and record the receipts (model `elevate-local`,
latency, result). A healthy `/v1/models` response alone is not acceptance.

## Notes

- The service scales to zero (min 0); a cold first call can take minutes. That is
  by design, not an outage.
- An unauthenticated request to the URL returns HTTP 403 from Google Frontend.
  That proves the service exists and is private — it does not prove the model
  answers.
- The 7B CPU model is small for code work and has timed out repair turns at
  210s before (issue #2515; timeout now 270s via `ELEVATE_LLM_TIMEOUT_MS`).
  The GPU worker (`services/llm-gpu-worker`) is not deployed; that is a separate
  cost decision, not part of this proof.
