# Combined PARIS runtime — October 14, 2026

PARIS combines the admissions, instructional, operational, and compliance capabilities historically called PARIS, ELLIE, LIZZY, and ZORA. These are capability/compatibility IDs, not four independently selected platform assistants. Provider/model identities are infrastructure, not additional user-facing agents.

## Integration changes

| Boundary | Previous behavior | Current implementation |
| --- | --- | --- |
| Admin AI Team | Four commercial chats with separate histories | Canonical Studio chat restores its existing durable conversation and plan/task state |
| Account/LMS AI console | Four independent per-agent histories | One PARIS conversation; capability selection retains entitlement checks |
| Shared operational command executor | Persona-specific labels and tool subsets | PARIS identity with union of registered capability tools; actor roles, scope, confirmation, idempotency and quality gates unchanged |
| Public chat, learner chat, central task prompts, Studio | Different identity prompts | Shared combined identity plus existing task-specific requirements and context restrictions |
| Public agent/health metadata | Process-local registration reported as health | One combined identity; availability explicitly unverified without actual execution evidence; legacy agent names resolve as aliases |
| HVAC tutor | Direct Gemini calls, model hopping, successful fallback text on failure | Shared gateway and real error response; saved lesson context retained |
| Dropout risk analysis | Direct OpenAI client requirement | Shared gateway; existing authenticated role checks and JSON contract retained |
| Inference/commands/API failures | Separate logs and incomplete cross-process visibility | Durable `paris_runtime_events` observations for shared inference (including streams), shared commands and audited API server errors |
| OpenAI Studio stream errors | Error inside HTTP 200 SSE could escape API status monitoring | Explicit failed-stream observation |
| Course supervisor | Old waiting reason could survive a fresh heartbeat | Clear obsolete reason while preserving fenced queue/lease/attempt policies |

`/api/paris/supervision` is Admin-only and returns bounded recent observations and existing monitored course jobs. Admin `/paris` and `/ai-team` display them. Tool `paris.supervision` makes the same evidence available through authenticated commands.

## Context and permissions

Admin `/paris`, `/ai-team`, and Studio use the same existing durable conversation component and restoration path. Account/LMS unified chat retains one history when the topic changes. This does not mix private histories between users, organizations, public visitors, or commercial Store customers. Legacy stored capability IDs remain valid; no conversations or production work are deleted or restarted.

The Store product console and feature entitlements remain separate. The public Store website-builder SDK path remains part of that commercial boundary. The shared orchestrator has the combined platform identity; commercial tools still enforce their existing subscription checks.

## Failure handling

Every observed failure is classified as billing, credentials, source/licensing, quality, approval, transient, or unknown, with a recorded next action. Only established bounded retry/lease/checkpoint policies perform automatic recovery. An observation does not authorize replaying payments, messages, publishing, destructive tools, or unknown mutations. No arbitrary model-generated repair code is executed by this observer.

Failures in API handlers without `withApiAudit`, external third-party operations, container termination before a write, and network failures that never reach an instrumented runtime are not exhaustively captured by this stream. Existing external Google/GitHub health and canonical course monitoring continue independently. Do not describe this as universally verified self-repair.

Observations store no prompt, response, raw exception, token or secret. RLS restricts the new table to the service role. A daily retention job removes records older than 30 days. Historical failure observations are not presented as current outage status.

## Verification

- Final Admin, Marketing, and LMS TypeScript checks pass. Changed-file ESLint and diff whitespace checks pass.
- Admin production build completed compilation, all 141 static pages, and standalone output generation. The exact merged main revision is validated again by the Google release workflows.
- 38 focused tests pass, including shared conversation behavior, capability tool union, protected approvals, failure classification, aliases, portal commands and the remaining shared gateway adapters.
- Six course-monitor tests pass, including stale-reason clearing, lease ownership, retry limits, fencing and no worker-payload replacement.
- The broader paid-provider-boundary suite has one existing source-expectation failure (`reservePaidInference` expected in the unchanged video worker). Reproduced on untouched main `f149280e8ba29ac4bcb932d3919ab47e186580af`: eight pass, one fails. It is not represented as a new regression or as a green full suite.
- Local production compilation initially exhausted shared container memory while another workspace was building. Deployment uses the repository's exact-SHA Google workflows; local build and final deployment evidence are recorded separately.
