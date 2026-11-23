# Systems Side-by-Side — Elevate-lms (main e6e19ec9, 2026-11-23)

Five systems, one platform. This doc is the side-by-side the user asked for:
the repository, Dev Studio, Course Builder, the AI orchestration system,
and Muse. It records what each owns, where they overlap, and the gaps —
and what PR #2824 (this PR) fills.

An older side-by-side exists at `docs/SIDE-BY-SIDE-GAP-ANALYSIS.md`
(credential-intelligence platform). It is stale in places (it lists
`lib/paris/dev-studio.ts`, `lib/dev-studio/agent.ts`, and feed connections
as missing that now exist in the Ultimate builder). This doc supersedes
it for the five systems below.

## 1. The five systems at a glance

| System | Owns | Entry points | Who can use it |
|---|---|---|---|
| **Repository** (Elevate-lms monorepo) | All code, data, migrations, workflows | `apps/marketing`, `apps/lms`, `apps/admin`, `packages/db`, `packages/shared`, `packages/ui`; `pnpm-workspace.yaml` | Engineers (via GitHub), CI |
| **Dev Studio** | Admin AI operating surface: chat, agents, code, containers, deployments, git, health, tasks, snapshots, shell, workflows, courses | UI `apps/admin/app/studio/` (58 components); API `apps/admin/app/api/admin/dev-studio/` (86 routes) | `super_admin` / `admin`; OpenHands chat also needs `access_dev_tools` |
| **Course Builder** | Course generation, validation, governance, persistence | `lib/course-builder/` (template surface) + `lib/ultimate-course-builder/` (generation engine); admin route `apps/admin/app/api/admin/course-builder/` | Admins, via Dev Studio and the admin route |
| **AI orchestration** | Provider selection, task routing, PARIS, OpenHands, autopilot | `lib/ai/orchestrator.ts` (`runAITask`), `lib/ai/paris-ai.ts`, `lib/devstudio/openhands/`, `lib/autopilot/` | LMS learners/instructors (chat, tutor), admins (Dev Studio), PARIS repairs |
| **Muse** | External AI agent working the repo: read, change, PR, check CI | Meta Muse AI GitHub App (installed 2026-11-23, org `elevate-for-humanity`, Elevate-lms only) | The user, in chat with Muse; merges are human-only |

## 2. What each does well

- **Repository:** single canonical monorepo since the fix2 archive; Supabase
  GitHub integration points at Elevate-lms `main`; auto-deploy to Google
  Cloud Run on merge (path gaps fixed in PR #2818).
- **Dev Studio:** the largest surface — 86 API routes covering chat, agents,
  autofix, builds, containers, deployments, git, health, jobs, OpenHands,
  tasks, snapshots, shell, workflows, and course-* operations. The
  integration gate (`scripts/dev-studio-integration-gate.sh`) enforces the
  canonical `/api/admin/dev-studio` namespace and the absence of legacy
  `/api/devstudio` aliases.
- **Course Builder:** after PR #2823 (single builder), one template, one
  generation path (`requestCanonicalGeneration`), and the government job
  feed (O*NET, CareerOneStop, USAJobs, BLS) stored on the course.
  `lib/course-factory` is the only generation/validation/persistence
  authority (see `docs/DEV_STUDIO_CANONICAL_ARCHITECTURE.md`).
- **AI orchestration:** `lib/ai/orchestrator.ts` centralises provider
  selection, moderation, RAG, and 17 task types; `lib/ai/paris-ai.ts`
  (PARIS) executes authenticated commands via `executeAICommand`; the
  PARIS/OpenHands adapter stages repairs with branch creation, diff
  readback, and ledger verification.
- **Muse:** the only engine with a proven loop in this repo — PRs
  #2809–#2823 were opened through it, with approval-gated writes and CI
  as the verifier.

## 3. Overlaps and duplicates

| Overlap | Reality |
|---|---|
| Dev Studio chat vs `runAITask` | Dev Studio chat (`apps/admin/app/api/admin/dev-studio/chat/route.ts`, 82 KB) calls `aiChat` and provider clients directly; it does NOT go through `lib/ai/orchestrator.ts`, despite the orchestrator's claim that "all AI tasks route through here". The ESLint rule `no-direct-ai-providers` exempts the (non-existent) legacy paths `apps/admin/app/api/devstudio/{chat,execute}/route.ts`. This PR corrects the exemption to the canonical paths and documents the exception instead of pretending it doesn't exist. |
| Two course builders | Resolved by PR #2823: one builder (Ultimate generation, classic template as surface). `lib/devstudio/course-builder-controller.ts` is now just a compatibility adapter. |
| Two GitHub Apps | PARIS App ("PARIS Engineer for Elevate", ID 5477907) is the in-repo runtime credential; Muse App is Meta's external agent credential. Different apps, same repo, different owners. Neither can call the other. See `docs/muse-integration.md`. |
| Two course-generation paths | `runAITask({ task: 'course_generation' })` returns raw JSON blueprints from the LLM; it does NOT call Course Factory. The LMS generate-course route returns that JSON as `draft_for_human_review`. Governed courses must still cross `courseFactory()` / `publishGovernedCourse` and the procurement gate. This PR adds `lib/ai/course-generation-authority.ts` so callers can check that boundary instead of assuming it. |
| Autopilot vs PARIS | `lib/autopilot/runner.ts` still defaults to the archived `elevateforhumanity/fix2` at main; PR #2815 fixes that (open, unmerged) — not duplicated here. |
| `/api/devstudio/*` vs `/api/admin/dev-studio/*` | The canonical architecture doc claimed `/api/devstudio/*` holds runtime APIs. Zero such routes exist at HEAD; the gate enforces their absence. `.agents/AGENTS.md` and `docs/ORPHANED_ROUTE_MAP.md` still document them as live. This PR corrects both docs. |

## 4. Gaps found (and what this PR does about them)

| # | Gap | Filled in this PR |
|---|---|---|
| G1 | **Dev Studio cannot do Muse's loop.** Its code-fix path is OpenHands: 29 tasks, 22 failed, 0 completed, key untested since 2026-09-15, fails closed on missing PARIS start receipt / pending approval. | **Yes** — `lib/devstudio/muse-loop.ts` + `POST /api/admin/dev-studio/muse-loop`: branch → commit → draft PR → CI check, via the PARIS GitHub App token, no OpenHands. Admin-only + `access_dev_tools`. Unit-tested with a mocked GitHub API. |
| G2 | **Muse has zero presence in the repo.** No doc, no route, no status surface; an operator in Dev Studio cannot see what Muse is or how it differs from the PARIS App. | **Yes** — `docs/muse-integration.md`, `lib/devstudio/muse-integration.ts`, and the GET side of the muse-loop route. |
| G3 | **Panels look working when their engine is dead.** Nothing records which Dev Studio capability is proven, pending, or unproven. | **Yes** — `lib/devstudio/capability-registry.ts`, surfaced by the muse-loop route. OpenHands panels are marked `unproven` with the Muse loop as fallback. |
| G4 | **Stale docs misstate the system.** Canonical arch doc claims `/api/devstudio/*` runtime APIs; `.agents/AGENTS.md` documents `/api/devstudio/chat` and `lib/dev-studio/agent.ts` / `skills-loader.ts` (both files missing); `docs/dev-studio-checklist.md` says feeds are NOT IMPLEMENTED and lists rollback as missing (rollback routes exist). | **Yes** — targeted corrections in all four files, dated 2026-11-23. |
| G5 | **ESLint exemption points at routes that don't exist.** `no-direct-ai-providers` exempts legacy `/api/devstudio/chat` and `/execute`. | **Yes** — exemption updated to the canonical `/api/admin/dev-studio/chat` path, with a comment stating the exception is intentional multi-provider tool-calling. |
| G6 | **Course-generation boundary is implicit.** `course_generation` output is raw JSON; nothing in code says it must cross Course Factory before it becomes a course. | **Yes** — `lib/ai/course-generation-authority.ts`: a named boundary + helper the LMS route and future callers use to label output as draft-only. |
| G7 | **No live proof the Muse loop runs from the Admin server.** Unit tests mock GitHub; CI typechecks. | **Not in this PR** — first live run must be a small, reviewed change via the route, after merge + deploy. See "What remains". |
| G8 | **OpenHands still unproven.** | **Retired as the required path in this PR (own-engine extension)** — OpenHands is now opt-in-only (`PARIS_REPAIR_ENGINE=openhands`): PARIS staging, the planner, the master-studio specialist, and both Dev Studio OpenHands routes fail closed without it; the adapter is retained, gated off. The owned engine (`code-fix-own-engine` in the registry) is the replacement. Proving OpenHands live is no longer required; it needs a live key test (`read_authorization_verified`) + one completed task only if someone opts in. |
| G9 | **PR #2812 migration untested in QA; #2813 phone unverified live; #2821 E2E shard 3/4 still red.** | **Not in this PR** — tracked in the registry as `pending` / `implemented-unverified`. |

## 5. What remains

1. **Live proof of the loop:** after merge + deploy, an admin calls
   `POST /api/admin/dev-studio/muse-loop` with `action: 'plan'` for a
   small fix, reviews the plan, then `action: 'execute'`, and confirms
   the branch, PR, and CI state in the response. Until then the loop is
   unit-tested, not live-proven.
2. **Live proof of the own engine:** after merge + deploy, an admin calls
   `POST /api/admin/dev-studio/own-engine` with `action: 'plan'`, then
   `action: 'execute'` for a small fix, and confirms the draft PR was
   opened from a model-produced change with the PARIS ledger row updated.
   Until then the engine is unit-tested (mocked model), not live-proven —
   in particular the owned worker answering live is still unproven.
3. **OpenHands:** retired as the required path (opt-in-only). No live
   proof is needed unless someone opts in with `PARIS_REPAIR_ENGINE=openhands`.
3. **Merge queue:** #2821 (E2E), #2822 (enrollment/hours), #2823
   (single Course Builder) must go green and merge before this PR's
   registry statuses can be upgraded from `pending`.
