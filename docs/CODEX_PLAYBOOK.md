# Codex Operating Playbook — Elevate LMS

This playbook defines how to use Codex safely and effectively across the full Elevate LMS system.

## 1. Purpose and Scope

- Applies to all code in this repository: `app/`, `apps/admin/`, `components/`, `lib/`, `scripts/`, `docs/`, and `supabase/migrations/`.
- Standardizes how we plan, prompt, implement, validate, and ship Codex-assisted changes.
- Prioritizes production safety over speed.

---

## 2. Non-Negotiable Guardrails

1. **Never use production credentials in Codex runtime.**
   - Use dev/staging-only environment variables.
   - Use a dedicated low-privilege `OPENAI_API_KEY` for Codex sessions.

2. **No broad, untested refactors.**
   - Avoid mass changes across unrelated modules.
   - Break work into bounded PRs by feature area.

3. **Always use canonical project patterns.**
   - Auth/API guards from `@/lib/admin/guards` for new routes.
   - API errors from `@/lib/api/safe-error` with `{ error: string }` shape.
   - Rate limiting via `applyRateLimit` from `@/lib/api/withRateLimit`.
   - Supabase clients from `@/lib/supabase/*` only.
   - AI completions through `aiChat()` in `@/lib/ai/ai-service` (except documented route exceptions).

4. **Do not bypass architecture rules.**
   - No new `middleware.ts`; keep middleware logic in `proxy.ts`.
   - No new progress tables; use `lesson_progress`, `lms_progress`, `progress_entries` by contract.
   - No hardcoded per-program LMS behavior when blueprint/step_type path exists.

5. **Migration discipline is mandatory.**
   - File naming: `YYYYMMDD000NNN_description.sql`.
   - Migrations are **not live** until manually applied in Supabase SQL Editor.
   - Include manual-apply and verification steps in PR notes.

---

## 2A. Active Codex Mission — Production Stabilization Sprint

When handing work to Codex, use this precise mission. Do **not** ask Codex to "fix everything" or broadly polish the platform.

### MISSION: Production Stabilization Sprint

**Objective:**
Bring the Elevate platform to production-ready status by eliminating critical technical debt and completing unfinished user workflows without introducing new features.

**Rules:**

- Do NOT add new features.
- Do NOT redesign architecture.
- Do NOT change business logic unless required to fix defects.
- Keep changes in focused PRs.
- Produce a report after each phase.

### PHASE 1 — COMPLETE CRITICAL USER FLOWS

Verify and repair end-to-end functionality for:

1. **Enrollment Flow**
   - Application
   - Intake
   - Enrollment
   - Status updates
   - Notifications

2. **Testing Center**
   - Registration
   - Payment processing
   - Confirmation workflow
   - Admin reporting

3. **Trial Application**
   - Data collection
   - Validation
   - Storage
   - Notifications

4. **Admin Studio**
   - Remove dead routes
   - Repair broken forms
   - Verify create/edit/delete workflows
   - Verify save operations

**Deliverables:**

- List of repaired workflows
- Remaining blockers
- Screenshots or verification evidence

### PHASE 2 — AUTHENTICATION CONSOLIDATION

**Tasks:**

- Locate all inline `supabase.auth.getUser()` implementations.
- Replace with centralized `apiAuthGuard` pattern.
- Remove duplicate role verification logic.
- Preserve existing permissions.

**Deliverables:**

- Number of files migrated
- Remaining auth exceptions
- Security review summary

### PHASE 3 — TYPESCRIPT STABILIZATION

**Tasks:**

- Reduce TypeScript errors aggressively.
- Prioritize:
  - Authentication
  - Payments
  - Enrollment
  - Testing Center
  - Admin Studio

**Goal:**

- Reduce baseline errors as much as possible.
- Document unresolved issues.

**Deliverables:**

- Before/after error count
- Categorized error summary

### PHASE 4 — LOGGING CLEANUP

**Tasks:**

- Replace `console.log` statements with structured logging.
- Preserve:
  - error logging
  - security logging
  - audit logging

**Deliverables:**

- Number of console statements removed
- Logging standard implemented

### PHASE 5 — FINAL PRODUCTION AUDIT

Verify:

- Build passes
- No critical route failures
- No broken forms
- No payment failures
- Authentication functioning
- Environment variables validated
- Database connectivity validated

Produce:

- Final readiness score
- Critical issues remaining
- Recommended next actions

**Success Criteria:**
The platform supports a complete user journey from application → enrollment → payment → training → completion without critical failures.

---

## 3. Standard Workflow (Every Task)

### Step 1 — Define scope

- State the user-visible goal.
- List touched files/modules.
- Identify blast radius and rollback path.

### Step 2 — Prompt Codex with constraints

- Ask for minimal diff.
- Explicitly require canonical patterns.
- For APIs: require auth guard + safe error helpers + rate limiting tier choice.

### Step 3 — Implement in small increments

- Prefer one logical change set per commit.
- Keep legacy paths unless removal is explicitly requested and tested.

### Step 4 — Run checks locally

```bash
pnpm lint
pnpm next build
```

Run targeted tests/scripts when relevant.

### Step 5 — Review diff critically

- Validate no secrets, no dead imports, no non-canonical utility reintroduction.
- Confirm naming and route conventions.

### Step 6 — Commit and PR

- Include intent, risk, test evidence, and migration/manual steps.

---

## 4. Required Validation Matrix

Run these before merge unless a task is docs-only:

| Check       | Command                                                      |
| ----------- | ------------------------------------------------------------ |
| Lint        | `pnpm lint`                                                  |
| Build       | `pnpm next build`                                            |
| LMS routing | Click-through `?activity=` behavior on lesson/accordion      |
| API routes  | Auth role path, error responses, rate limits                 |
| Storage     | Bucket usage via Supabase storage client (no hardcoded URLs) |

If a command cannot run due to environment limitations, document exactly why and what remains to verify.

---

## 5. Task Templates

### A) New Authenticated API Route

```
Implement app/api/<path>/route.ts using canonical API patterns only.
Use apiAuthGuard / apiRequireAdmin / apiRequireInstructor as appropriate
before any DB access. Apply applyRateLimit(request, '<tier>'). Return
errors via safeError / safeDbError / safeInternalError from
@/lib/api/safe-error in { error: string } shape. Minimal diff only.
Include a short test plan.
```

### B) LMS Lesson/Program Feature

```
Implement this LMS change using the DB-driven engine (step_type +
activities/video_config). Avoid program-specific hardcoding. Preserve
checkpoint gating behavior and existing completion contracts. Keep
compatibility with existing lesson rendering paths. Minimal diff +
validation steps.
```

### C) Supabase Migration + App Update

```
Add a migration in supabase/migrations/ named YYYYMMDD000NNN_<description>.sql
(idempotent when possible), then update application code to use the new schema.
PR notes must explicitly state migrations require manual apply in Supabase SQL
Editor and include a verification query/checklist.
```

### D) UI Content/Page Update

```
Update the page using existing shared components and brand conventions.
For hero banners, use components/marketing/HeroVideo.tsx and content in
content/heroBanners.ts only. Do not overlay text on video. Ensure CTA
order and routing rules remain compliant.
```

---

## 6. Do / Don't Quick Reference

| Do                                                               | Don't                                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| Use focused prompts with explicit constraints                    | Run Codex with prod secrets or broad infrastructure credentials   |
| Keep PRs small and reversible                                    | Introduce duplicate auth/supabase/rate-limit helpers              |
| Use canonical utilities and shared components                    | Return raw `error.message` from API responses                     |
| Preserve legacy behavior unless deprecation is explicitly scoped | Hardcode storage URLs, CTA placeholders, or LMS per-program logic |

---

## 7. PR Definition of Done

A Codex-assisted PR is ready only when all are true:

- [ ] Scope is clear and bounded
- [ ] Canonical patterns used for auth, errors, rate limit, and Supabase access
- [ ] `pnpm lint` and `pnpm next build` pass, or limitations are documented
- [ ] Any migration includes manual apply + verification instructions
- [ ] User-visible impact and rollback path are documented

---

## 8. Recommended Runtime Setup

- Run Codex in a dev container bound to this repo.
- Default mode: interactive (`codex`).
- Use `--approval-mode auto-edit` cautiously for repetitive low-risk edits.
- Reserve `--approval-mode full-auto` for isolated, low-blast-radius tasks with mandatory review.

### Day-to-day command flow

```bash
# inside repo container
codex
# ask for focused change, then:
pnpm lint
pnpm next build
git add -A
git commit -m "feat: ..."
git push
```

---

## 9. Escalation Rules

Require human review before merge when changes involve:

- Authentication/authorization boundaries
- Payment, enrollment, or credential issuance logic
- Middleware/proxy routing behavior
- Data model or migration changes
- Any cross-portal navigation or redirect logic

---

Following this playbook keeps Codex fast **and** safe across the full Elevate LMS system.
