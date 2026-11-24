# The own engine — Elevate's AI repair engine, without OpenHands

Date: 2026-11-23. Branch: `studio/muse-loop-assembly` (PR #2824, extending the
Muse-loop hands half). Status: implemented, unit-tested with mocked model /
hands / ledger. **Not live-proven yet.**

## What it is

One loop, owned end to end:

```
goal
  -> brain:   elevate-local (Qwen2.5-7B-Instruct, Q4_K_M, owned CPU worker)
  -> router:  runAITask({ task: 'code_repair' }) — providerPolicy 'owned-only'
  -> loop:    lib/devstudio/own-engine/agent-loop.ts
                prompt -> model JSON -> structural verify -> bounded retry
  -> gate:    PARIS approval (paris_autopilot_policy + paris_code_repairs row)
  -> hands:   lib/devstudio/muse-loop.ts
                branch -> commit -> draft PR -> CI check (never merges)
  -> ledger:  every attempt recorded on the paris_code_repairs row
```

Entry point: `POST /api/admin/dev-studio/own-engine` (admin + `access_dev_tools`).
`action: 'plan'` returns the steps without calling the model or writing the
ledger. `action: 'execute'` runs the loop; `repairId` is optional — when
omitted, a PARIS ledger row is created first (fails closed when the PARIS
autopilot policy is disabled).

## The brain, honestly

The owned model is **small for code work**:

- Qwen2.5-7B-Instruct, Q4_K_M, pinned checkpoint
  `a09a35458c702b33eeacc393d103063234e8bc28` (see `services/llm-cpu-worker/README.md`)
- 8 GiB, 4 CPU threads, 1 slot, 8192-token context
- One call may take up to 210s (`ELEVATE_LLM_TIMEOUT_MS`, capped at 270s);
  repairs have timed out at 210s before
- The loop therefore keeps goals narrow, repo context small (≤ 6000 chars),
  temperature 0.2, at most 6 changed files, and at most 3 attempts
  (route default: 2 — one model call can already take 210s, and the route
  allows 300s)

In-loop verification is **structural only** (paths inside the repair
boundary, shape, size, JSON validity). Semantic verification is CI on the
draft PR, which the hands half reports back. Do not claim a fix is verified
before CI.

## The GPU worker is NOT deployed

`services/llm-gpu-worker` (vLLM / Runpod pilot) is source only. Its README
says: "No deployment is implied by this source." Nothing in this PR deploys
it, provisions a GPU, or spends anything. `PARIS_GPU_ENABLED=true` +
`PARIS_INFERENCE_TIER=gpu` would select it, but only after acceptance —
that is an open cost decision (see below).

## OpenHands is opt-in-only

OpenHands is **not** the engine and is **not** a required path. Record
(2026-11-23): 29 tasks, 22 failed, 0 completed; API key untested since
2026-09-15. The adapter code is retained, gated off behind
`PARIS_REPAIR_ENGINE=openhands` (`lib/devstudio/openhands-opt-in.ts`).

Gated, fail-closed without the opt-in:

| Place | What happens without the opt-in |
|---|---|
| `lib/devstudio/paris-openhands-repair.mjs` (`parisRepairEngine`) | Without the opt-in every repair selects `internal`; with it, a fresh repair or a historical OpenHands checkpoint selects OpenHands (falling back to internal when OpenHands readiness fails), and planner checkpoints always stay `internal` |
| `lib/ai/runtime/code-repair.ts` (PARIS staging + tick admission) | Checkpoints restage on the owned engine; new repairs admit on the owned model |
| `lib/ai/tools/planner.ts` | Naming OpenHands in a command routes to `studio.engineering.execute` |
| `lib/studio/master-runtime.ts` | Code-word plan steps fall through to `ROUTER`, not `OPENHANDS` |
| `POST /api/admin/dev-studio/openhands/agent` | 503 `OpenHands is opt-in only...` |
| `POST /api/admin/dev-studio/openhands/chat` | 503 `OpenHands is opt-in only...` |
| `lib/devstudio/repair-dashboard.ts` | A repair with no candidate is labelled `internal`, not `openhands` |
| `components/studio/OpenHandsRepairPanel.tsx` + engineering route | Copy no longer claims repairs go to OpenHands |

Not gated (observation only, never dispatches): reconciling already-created
OpenHands tasks (`/api/cron/openhands-reconcile`, `lib/autopilot`), validating
an already-committed provider branch (`paris-provider-candidate.ts`), and
`openhands.status` reads of existing tasks. These cannot start new work.

## Fail-closed list

The loop refuses before spending a model call when: the owned model is not
configured (`OWN_ENGINE_MODEL_NOT_CONFIGURED`); PARIS approval is missing
(`OWN_ENGINE_APPROVAL_REQUIRED`); the branch is `main` or invalid; the model
reply is not the owned provider (`OWN_ENGINE_PROVIDER_NOT_OWNED`); the model
reaches for a secret path (`OWN_ENGINE_BLOCKED_PATH`, never retried). Retries
are bounded; exhaustion records the repair `blocked` on the ledger.

## Live proof still needed

1. **Worker answering live.** The owned CPU worker's acceptance steps
   (see `services/llm-cpu-worker/README.md`: quota, immutable digest,
   IAM, `accept-owned-cpu-model.mjs`, live PARIS chat) are unproven.
   The loop fails closed with `OWN_ENGINE_MODEL_NOT_CONFIGURED` until
   `ELEVATE_LLM_CPU_URL` / `ELEVATE_LLM_SECRET` are set in Admin.
2. **One end-to-end fix driven by the owned model.** After merge + deploy,
   an admin runs `POST /api/admin/dev-studio/own-engine` with
   `action: 'plan'` then `action: 'execute'` for a small fix and confirms
   the draft PR, the CI state, and the ledger row. Until then the engine is
   unit-tested, not live-proven.

## Open cost decision: GPU host

Staying on the 7B CPU worker costs nothing new but keeps the 210s timeout
and small-model limits. A GPU host (Runpod pilot per
`services/llm-gpu-worker/README.md`, or another host) would serve the same
`elevate-local` model faster with more headroom, but it is a new recurring
cost with no price in this repo — no quote, no commitment, no provisioning
in this PR. Decide after the first live CPU runs show whether the 7B CPU
model is good enough for the repairs being asked of it.
