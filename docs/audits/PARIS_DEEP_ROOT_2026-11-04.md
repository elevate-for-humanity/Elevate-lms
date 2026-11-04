# PARIS deep-root incident analysis — November 4, 2026

## Scope and evidence hierarchy
Inspected GitHub source for the admin assistant, repair workflow, provider budgeting,
repair policy, database persistence, and affected API endpoints. Compared it with
read-only Supabase catalog queries and recent task/repair status summaries.

**Do not confuse these evidence tiers:**
- **Live verified database:** PostgreSQL constraint definitions and current rows.
- **GitHub workflow logs:** real HTTP response from serving Admin API.
- **Repository code:** implementation, not proof of serving deployment.
- **User report:** PARIS dashboard and voice/work commands do not act as expected;
  authenticated browser acceptance still required.

## Root cause A — repair monitor 23514 (confirmed)
- Workflow run 41911079752 receives HTTP 502 and `PARIS_DATABASE_23514` during signed PARIS repair tick.
- Live `paris_code_repairs_attempt_count_check` permits attempts 0–2,
  and attempt 3 only when `source_job_id IS NULL` and a
  `bounded-cpu-edit-recovery` marker exists.
- A queued source-free repair at attempt 2 has marker
  `bounded-context-budget-recovery` instead. Code already allows
  that controlled recovery, so dispatch attempts a forbidden increment.
- **Repair:** reviewed SQL migration aligns this specific third-attempt
  exception; code validates count/history/source before attempting the write.
  No direct live database write is part of this PR.

## Root cause B — model-context failure (observed, not fully fixed)
- `lib/devstudio/repair-inference-budget.mjs` intentionally refuses to
  truncate immutable task/system rules; throws
  `PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT`.
- `canResumeContextBudgetRepair` allows at most one verified, no-write,
  checkpoint-safe retry. This protects source fidelity but doesn't guarantee
  that every oversized goal can run.
- **Remaining work:** bounded task decomposition preserving immutable
  original scope, verified source lookups per subtask, new regression tests,
  and explicit review. Do not silently truncate a compliance or licensing task.

## Root cause C — dashboard/personal assistant (not yet proven live)
- `apps/admin/app/paris/page.tsx` renders the AI-team screen.
- `apps/admin/app/ai-team/page.tsx` embeds `UnifiedEllieChat`.
- Its principal conversational transport is
  `/api/admin/dev-studio/chat` and its task-plan endpoint, **not**
  `/api/paris/execute` by default.
- `/api/paris/execute` has separate durable `ai_tasks` receipts,
  requires authenticated admin authority, provider access, and task status
  persistence before saying success.
- Last-seven-day task status summary at inspection:
  6 completed, 8 failed, 1 blocked, 1 queued, 1 running.
  Some failures are from source/model unavailable and long-running jobs.
- A browser.execute failure lacking sessionId dates to November 1;
  current source now has session-less owner-scoped browser creation.
  **Don't assume that historical failure persists in the deployed runtime.**
- **Acceptance still needed:** sign in as an authorized admin; submit text,
  voice, read-only staff/student counts, a safe draft, and a protected action
  with explicit approval; inspect task IDs, exact endpoint responses, tenant
  authorization, provider health, and persisted results. Confirm end-to-end
  action without fabricated completion.

## Root cause D — external repair prerequisites
- HTTP 401/private caption access, Barber licensed visual gaps,
  owner-paused queue work, missing canonical publication evidence, and
  exhausted job attempts are **separate operational blockers**.
- They must not be cleared by blindly retrying PARIS or updating statuses.
- Check Cloud Run worker digest and deployment acceptance, backup-read
  credentials, learner playback, enrollment/clocking/payment E2E receipts.

## Safe release order
1. Run `node --test lib/ai/runtime/paris-attempt-contract.test.mjs lib/ai/runtime/code-repair-policy.test.mjs`.
2. Review migration against production constraint and verify backup/recovery.
3. Apply migration through controlled, approved deployment BEFORE code dispatch
   can claim a third context recovery.
4. Verify live constraint and queued repair state **read-only**.
5. Run an authorized signed PARIS monitor tick; confirm no 23514 and that
   writes are bounded. Do not replay active work.
6. Test Admin dashboard chat, task receipt, approval gate, and voice input.
7. Only declare operational after successful live execution, independent
   deployment verification, rollback path, and audit receipts.

This audit narrows proven defects. It is not evidence that all PARIS features,
inference providers, integrations, or live browser journeys are healthy.
