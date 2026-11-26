# Dev Studio browsing verification — checklist

Purpose: prove Dev Studio works end-to-end by **browsing through it**,
not just by reading code. This checklist is written for a browser run
(signed in as an admin) after the Muse-loop PR merges and deploys, and
for local development runs before that.

How to run it: start the Admin app in development, sign in as a
`super_admin` / `admin` user (production policy also requires AAL2 MFA;
in development, use the local admin session the project provides), then
open each page below and record pass / fail with a screenshot or the
exact error shown.

## 0. Preconditions (record before browsing)

- [ ] Admin app is running and reachable.
- [ ] Signed in as admin/super_admin (Dev Studio requires it; non-admins
      must be refused, not shown a broken page).
- [ ] `OPENHANDS_API_KEY` status known (Admin > Secrets test) — the
      OpenHands panels are expected to be UNPROVEN until this returns
      `read_authorization_verified`.

## 1. Studio shell

- [ ] `/studio` loads, shows the Admin header, notifications, and the
      Studio navigation — no second application shell, no blank page.
- [ ] `/studio/ai` redirects to `/studio` (legacy route must not be a
      second chat workspace).

## 2. Panels — each must load AND do what it claims

| Panel (route under `apps/admin/app/studio/`) | What counts as working |
|---|---|
| Tasks (`/studio/tasks`) | Lists tasks; approve / cancel / rollback controls present and callable (a task action returns a real result, not a silent no-op). |
| Courses (`/studio/courses`) | Lists courses; Course Builder capability opens the single-builder flow (PR #2823) — a course generation can be queued and its job status is visible. |
| Deployments (`/studio/deployments`) | Shows deployment status; a deploy action is staged through the audited approval endpoint (`ellie_pending_actions`), never executed on click without confirmation. |
| Containers (`/studio/containers`) | Container panel calls the canonical APIs (`/api/admin/dev-studio/devcontainer`, `/env`, `/container-env`) and shows real container state. |
| Health (`/studio/health`) | Health panel shows real service state (Dev Studio, Supabase, GitHub, OpenHands key status) — no hardcoded green. |
| Logs (`/studio/logs`) | Shows real log entries for the current session. |
| Workflows (`/studio/workflows`) | Lists workflows; a workflow run can be started and its run state is visible. |
| Media (`/studio/media`) | Media panel loads; an upload/list action works. |
| Memory (`/studio/memory`) | Shows persisted conversations / operational memory. |

## 3. The Muse loop — the one full loop this PR proves

This is the loop the user asked to see working end-to-end:

1. [ ] In Dev Studio (or via the API), request a small fix, e.g.
      "Fix the typo in the Studio health panel heading."
2. [ ] `POST /api/admin/dev-studio/muse-loop` with `action: 'plan'`
      returns the five steps (read-base, create-branch, commit-files,
      open-pr, check-ci) — no writes yet.
3. [ ] `action: 'execute'` returns a branch name, a PR number/URL,
      and a CI check state.
4. [ ] Open the PR URL in GitHub: the branch exists, the change is the
      one requested, CI runs on it.
5. [ ] Record the PR number and CI result here. Until this is done
      live, the loop is unit-tested only (see
      `tests/unit/devstudio/muse-loop.test.ts`, mocked GitHub API).

## 4. What must NOT look working

- [ ] OpenHands repair/autofix panels: if the OpenHands key test has
      not passed and no task has completed, the panel must say so
      (unproven) or route to the Muse loop — it must not present a
      working repair button that silently fails.
- [ ] Any panel whose API returns an error must show the error, not an
      empty list presented as "no items".

## 5. Development-side notes

- Dev Studio in development runs inside the Admin app (`apps/admin`);
  there is no separate Studio server. If a panel works in production
  but not in development (or vice versa), record which one and the
  exact difference — that is a gap, not a pass.
- The browser service (`services/studio-browser`, Playwright/Chromium)
  is a separate service; if it is not running in development, browser
  panels must report it unavailable, not hang.

## Result log

| Date | Runner | Admin user | Pass | Fail | Notes |
|---|---|---|---|---|---|
| (fill in) | | | | | |
