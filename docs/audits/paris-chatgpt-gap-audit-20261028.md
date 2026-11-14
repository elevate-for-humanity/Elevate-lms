# PARIS side-by-side gap audit — 2026-10-28

## Scope and evidence boundary

Source baseline: `e090b20274a30e6f5c16c677f190e2c73cdca8b7`. This is a targeted source audit of PARIS tool execution, GitHub authentication, code repair and release control, compared with the earlier 15-item gap list. It is not a completed line-by-line audit of every repository file or a controlled ChatGPT/model intelligence benchmark. No live authenticated PARIS conversation, student workflow, phone call or media acceptance was performed.

The reviewed sources include:
- `lib/ai/tools/executor.ts` (request dispatch, permissions, retry rules, payload parsing and receipts)
- `lib/ai/tools/registry.ts` (49 registered tool definitions)
- `lib/ai/runtime/code-repair.ts` (queue, publication and runtime verification)
- `lib/devstudio/paris-code-engineer.ts` (protected paths and search fallback)
- `lib/devstudio/github-token.ts` (workflow/App/stored credential precedence)
- `scripts/gcp/paris-github-app-binding.mjs` (atomic secret access and numeric version pin)
- `.github/workflows/paris-code-repair.yml`
- `.github/workflows/deploy-admin.yml`
- `scripts/gcp/prune-web-release-requests.mjs`
- `lib/ai/paris-ai.ts` (legacy demo behavior; active consumer not established)

## Side by side: requested capability, earlier gap and new system

| # | Capability | Earlier evidence | Current code/live evidence | Disposition |
|---|---|---|---|---|
| 1 | Reliable inference | Successful and failed responses mixed | 24 completed and 53 failed inference observations in latest rolling 24h snapshot | Reliability unresolved; counts are observations, not unique requests or a latency/quality benchmark |
| 2 | GitHub authentication | App installation and binding unverified; Search 401 | Canonical resolver, atomic Google key access and Search-401 repository authorization fallback exist in source; recent failures still report 401 | Verify the new runtime/App identity after deployment; do not substitute an Actions-token pass for App verification |
| 3 | Automatic repair | 25 blocked, 10 queued; no verified repair | Latest snapshot 42 blocked, 2 queued, no verified repair | Execution remains unproven; do not reset/replay all records |
| 4 | Truthful completion | Legacy demo-success path present | Active registered executor also accepted body-level failures and malformed JSON as completed | Corrected in this change with behavioral regressions; legacy compatibility path remains separate |
| 5 | Deployment commands | Missing workflow reference | Existing Google dispatcher now used; new Admin rollout code preserves active builds and allows tested ancestral rollout without newer-rollout regression | Preserve new release-control work; actual rollout acceptance still required |
| 6 | Blocked recovery | Bounded retry/lease mechanisms exist | Queue reconciliation and duplicate/superseded classifications exist; daily allowance now Infinity | Owner-requested unlimited daily allowance preserved; no data replay in this audit |
| 7 | Conversation memory | Durable structures exist | No new cross-device authenticated acceptance | Remains an acceptance gap, not proof memory is missing |
| 8 | Student workflows | Registered application/enrollment/reminder tools | Tool definitions exist; full onboarding-to-course test not performed | Require controlled role-specific workflow acceptance |
| 9 | Email | 3 inbound, 3 outbound marked sent in earlier snapshot | Last separate check observed 5 inbound and 3 outbound marked sent | Provider status does not prove inbox delivery |
| 10 | Complete course production | Failed monitored jobs | Last course snapshot: 42 completed jobs in 24h; monitored queue includes running/queued/failed jobs | Jobs are not completed courses; build publication and student playback remain separate |
| 11 | Document/media creation | Components, reports and signature tools exist | No finished artifact acceptance in this audit | Unverified, do not claim broad artifact parity with ChatGPT |
| 12 | Phone receptionist | PBX components and diagnostics | No new authenticated call/audio/transfer/voicemail test | Separate live acceptance needed |
| 13 | Failure visibility | Durable runtime observations | Live events exist; no ai_tool_runs rows in latest 24h query | No recent tool receipts observed; this alone does not establish whether a user invoked tools |
| 14 | Role permissions | Registry role/scope/confirmation checks | Existing checks and independent route guards retained | No broad access, approval or RLS changes made |
| 15 | Task dashboard | Supervision panel exists | Receipt statuses can misrepresent action outcomes before this patch | Executor correction added; verify displayed task reconciliation after release |

## Verified live boundary

At this audit's health readback:
- Admin HTTP 200, healthy, Supabase dependency true, commit `34fb71e516617cb97b2dbe32687e9943e0129498`.
- LMS HTTP 200, healthy, Supabase dependency true, commit `bc4cc78868382ef074f6370b2ece811ff0a134e6`.
- Healthy old Admin infrastructure is not evidence that new PARIS fixes are serving.
- Earlier release 40624917159 was cancelled during image build. Current main now contains non-cancelling Admin build concurrency and tested-rollout admission. Do not overwrite these new changes with an older workflow.
- Supabase observation timestamp: 2026-10-28 04:35 UTC. Repair ledger: 42 blocked / 2 queued; daily allowance Infinity. Last 24h: 24 completed inference observations, 53 failed inference observations, 11 failed workflow observations and 1 advisory command observation. No ai_tool_runs rows in that window.

## Concrete correction

1. Reject unreadable JSON instead of synthesizing an error object that is then marked completed.
2. On successful HTTP transport, respect explicit `ok:false` and `success:false`.
3. For mutation tools, preserve failed, rejected, cancelled, blocked and approval-required outcomes.
4. Failure evidence takes precedence over HTTP 202.
5. Keep accepted/pending/dispatched/processing/scheduled mutations accepted, with no completion timestamp.
6. Preserve successful reads of failed-job status: the query can succeed even when the job it describes failed.
7. Preserve permissions, confirmations, tenant context, read-only retry behavior and non-replay of mutations.

## Behavioral validation

New regressions run on unchanged baseline: 5 failed, 2 passed. This reproduced the defect before the patch.
After correction: all 7 new regression tests pass.
Combined with existing PARIS authentication/routing/boundary checks: all 13 tests pass locally.
The new regression file is wired into CI. Full repository TypeScript/lint/build and exact live release verification still require CI/deployment results; they are not claimed by the local isolated test run.

No secrets, IAM, payments, student attendance, mailboxes, Supabase policies or queued jobs were modified by this audit.

## Remaining release acceptance

- Require protected CI/build results on the final combined main.
- Verify ready Google revision, immutable digest and exact public serving SHA.
- Require App-only diagnostic success.
- Perform one authenticated PARIS read and one owner-authorized bounded repair with durable receipts through independent tests, publication and exact runtime verification.
- Recheck UI task state after refresh; do not call dispatch acceptance task completion.

## Line-by-line changes to the active executor

The table below includes every changed source line in the executor compared with the pinned baseline. Removed defect lines are ISSUE; replacement/additional lines are EXPECTED corrections. Other reviewed boundaries are preserved.

| Before line | Before source | After line | After source | Assessment |
|---|---|---|---|---|
| 450 |         ? await response.json().catch(() => ({ error: \`HTTP ${response.status}\` })) | 450 |         ? await response.json().catch(() => { throw new Error('Tool returned invalid JSON.'); }) | ISSUE → EXPECTED |
| 484 |       const accepted = response.status === 202 \|\| payloadStatus === 'queued' \|\| payloadStatus === 'running'; | 484 |       // HTTP success is transport evidence, not proof the requested action succeeded. | ISSUE → EXPECTED |
| — | (blank) | 485 |       // A status query may legitimately describe a failed job; do not confuse | EXPECTED addition |
| — | (blank) | 486 |       // that read result with failure to execute the query itself. | EXPECTED addition |
| — | (blank) | 487 |       const record = payload && typeof payload === 'object' | EXPECTED addition |
| — | (blank) | 488 |         ? payload as Record<string, unknown> : null; | EXPECTED addition |
| — | (blank) | 489 |       const negativeStatus = tool.classification === 'write' && | EXPECTED addition |
| — | (blank) | 490 |         ['failed', 'error', 'blocked', 'rejected', 'cancelled', 'canceled', 'approval_required'].includes(payloadStatus); | EXPECTED addition |
| — | (blank) | 491 |       if (record?.ok === false \|\| record?.success === false \|\| negativeStatus) { | EXPECTED addition |
| — | (blank) | 492 |         const status = payloadStatus === 'approval_required' ? 'approval_required' | EXPECTED addition |
| — | (blank) | 493 |           : payloadStatus === 'blocked' ? 'blocked' : 'failed'; | EXPECTED addition |
| — | (blank) | 494 |         const message = typeof record?.error === 'string' ? record.error | EXPECTED addition |
| — | (blank) | 495 |           : typeof record?.message === 'string' ? record.message | EXPECTED addition |
| — | (blank) | 496 |           : 'Tool reported an unsuccessful result.'; | EXPECTED addition |
| — | (blank) | 497 |         await writeToolRun(tool, context, input, { | EXPECTED addition |
| — | (blank) | 498 |           status, output: payload, error: message, startedAt, | EXPECTED addition |
| — | (blank) | 499 |           completedAt: status === 'approval_required' ? null : new Date().toISOString(), | EXPECTED addition |
| — | (blank) | 500 |         }); | EXPECTED addition |
| — | (blank) | 501 |         await emitAuditEvent(tool, context, input, status, { | EXPECTED addition |
| — | (blank) | 502 |           http_status: response.status, error: message, source_event_id: eventId, | EXPECTED addition |
| — | (blank) | 503 |         }); | EXPECTED addition |
| — | (blank) | 504 |         return { | EXPECTED addition |
| — | (blank) | 505 |           ok: false, status, httpStatus: response.status, tool: tool.name, | EXPECTED addition |
| — | (blank) | 506 |           risk: tool.risk, classification: tool.classification, | EXPECTED addition |
| — | (blank) | 507 |           approvalRequired: tool.approvalRequired, | EXPECTED addition |
| — | (blank) | 508 |           requiredConfirmation: status === 'approval_required' ? tool.confirmationPhrase : undefined, | EXPECTED addition |
| — | (blank) | 509 |           payload, error: message, traceId: eventId, | EXPECTED addition |
| — | (blank) | 510 |         }; | EXPECTED addition |
| — | (blank) | 511 |       } | EXPECTED addition |
| — | (blank) | 512 |       const accepted = response.status === 202 \|\| payloadStatus === 'queued' \|\| payloadStatus === 'running' \|\| | EXPECTED addition |
| — | (blank) | 513 |         (tool.classification === 'write' && ['accepted', 'pending', 'dispatched', 'processing', 'scheduled'].includes(payloadStatus)); | EXPECTED addition |
