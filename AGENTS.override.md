# Elevate LMS — Codex Execution Guardrails

These instructions override conflicting instructions in `AGENTS.md`.

## Objective
Stabilize, harden, and reduce technical debt in the existing Elevate platform without removing working functionality or introducing unnecessary replacement architecture.

## Execution mode
- Work directly from the current repository state on `main` unless a task explicitly says otherwise.
- Before editing shared files, inspect the latest commit and relevant recent changes so concurrent work is not overwritten.
- Do not reset, force-push, rewrite history, discard unrelated changes, or replace files wholesale when a targeted root-cause change is sufficient.
- Preserve existing working behavior, comments, public routes, database contracts, environment-variable names, and integrations unless the task explicitly requires changing them.
- Do not stop merely to ask permission for ordinary fixes that are already within the assigned task. Investigate, implement, validate, and continue.
- If a destructive or irreversible action would be required, do not perform it; choose the non-destructive path and report the blocker.

## Root-cause rule
- Do not mask failures with redirects, aliases, hard-coded fallbacks, fake data, swallowed exceptions, disabled tests, `any`, `@ts-ignore`, `eslint-disable`, skipped migrations, or removed assertions merely to make CI green.
- Fix the canonical source of the failure.
- Prefer consolidation over adding another parallel implementation.
- Reuse existing dependencies and infrastructure where they already solve the problem. Do not introduce a new framework or service without a demonstrated gap.

## Change-size rule
- Make one logical change set at a time.
- After each logical change, run the narrowest relevant validation before moving on.
- If validation regresses, fix that regression before starting another area.
- Do not combine architecture refactors, dependency upgrades, database migrations, and visual redesigns in the same change unless they are inseparable.

## Required baseline before broad refactoring
Establish and record the current status of:
1. repository HEAD and recent commits;
2. dependency installation/lockfile consistency;
3. TypeScript/typecheck;
4. lint;
5. unit/integration tests that exist;
6. Marketing build;
7. Admin build;
8. LMS build;
9. relevant GitHub Actions checks;
10. runtime/deployment health available to the environment.

A green Marketing deployment alone is not proof that the platform is green.

## Validation contract
For every fix, prove the affected surface still works. Where scripts exist, run them rather than assuming success.

Minimum release evidence should include, as applicable:
- `pnpm typecheck`
- `pnpm lint`
- repository tests
- Marketing build
- Admin build
- LMS build
- route/API tests for changed code
- Playwright/E2E tests for critical user flows
- AI regression tests for changed AI behavior

Never claim "green", "fixed", "production ready", or "deployed" without current evidence from the corresponding check.

## Critical user flows that must not regress
- public Marketing navigation and program pages
- authentication and password/session behavior
- student application submission
- application-to-enrollment transition
- learner dashboard and LMS course access
- apprenticeship/host-shop workflows
- Admin authentication and dashboard access
- payments/checkout/webhook processing
- Course Builder / Course Factory persistence
- PWA/service-worker routing where applicable

## Database / Supabase rules
- Treat migrations and RLS as production contracts.
- Never weaken RLS merely to make a request succeed.
- Do not create duplicate tables or parallel sources of truth to avoid repairing an existing schema.
- Verify table/column/function existence before changing application code around an assumed schema.
- Prefer forward migrations; do not edit already-applied production migrations unless the repository explicitly establishes that convention.

## Routing rules
Honor the canonical routing rules documented in `AGENTS.md`.
- Fix bad links at their canonical source rather than accumulating redirects.
- Do not create duplicate page implementations for the same route.
- Verify Marketing/Admin/LMS subdomain ownership before changing middleware or Next.js redirects.

## Dependency rules
- Do not upgrade packages as incidental cleanup.
- Do not change package manager or lockfile format during unrelated work.
- Add a dependency only when the repository does not already provide the capability and the benefit is concrete.
- Security fixes must identify the vulnerable dependency/path and verify the remediation does not break builds.

## Concurrent-work protection
This repository may be modified by multiple environments or agents.
Before writing to a file that appears recently modified:
1. inspect the latest version;
2. understand the recent diff/commit touching it;
3. preserve compatible changes from other work;
4. avoid reverting newer behavior accidentally.

## Failure handling
When a command fails:
1. capture the exact failing command and error;
2. identify whether it is pre-existing or introduced by the current change;
3. fix the root cause if within scope;
4. rerun the same check;
5. do not move on while a newly introduced failure remains.

External provider outages, missing credentials, or unavailable third-party APIs must be reported separately from application regressions. Do not modify application behavior simply to hide an external outage.

## Technical-debt priority order
Unless a task specifies otherwise, work in this order:
1. crash/build/runtime blockers;
2. type/lint/test failures affecting release confidence;
3. authentication, authorization, RLS, secrets, and exposed admin/API surfaces;
4. schema/data-integrity and duplicate source-of-truth problems;
5. duplicate routes/components/services and dead code;
6. critical application/LMS/payment workflows;
7. PWA/service-worker/runtime routing;
8. performance and dependency cleanup;
9. visual/UI polish.

## Completion standard
A task is complete only when:
- the root cause was addressed;
- changed code was validated;
- no known new regression remains;
- evidence is stated precisely;
- remaining failures are listed rather than hidden.

Do not optimize for the appearance of progress. Optimize for a reproducibly stable production system.
