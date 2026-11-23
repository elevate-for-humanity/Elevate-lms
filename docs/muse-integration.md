# Muse in this setup

Muse is Meta's AI agent. In this repository it is an **external** agent:
it does not run inside Dev Studio, the Admin app, or any Elevate server.
It works through the Meta Muse AI GitHub App.

## Installation (verified 2026-11-23)

- Org: `elevate-for-humanity`
- Repository selection: **Only select repositories — exactly 1 repo**,
  `elevate-for-humanity/Elevate-lms`
- Permissions: read metadata; read/write code, issues, pull requests
- Merges: human-only. Muse opens draft PRs; it never merges to main.

## What Muse does here

The loop, every time:

1. Read the repo (code, issues, PRs, CI state).
2. Make a real change on a new branch.
3. Open a draft PR.
4. Check CI on that PR.
5. Report back — what changed, what is green, what is still blocked.

PRs #2809–#2823 were produced this way. Each write asks for a fresh
approval from the user; an approval that times out means the write never
happens and must be retried.

## Muse vs the PARIS GitHub App — do not confuse them

| | Muse App | PARIS App |
|---|---|---|
| App | Meta Muse AI | "PARIS Engineer for Elevate" |
| App ID | (Meta-owned; not in this repo) | 5477907 |
| Owner | Meta | Elevate (in-repo runtime) |
| Where it runs | Outside the repo, in Muse | Inside the Admin server, via `lib/devstudio/github-token.ts` |
| Used by | Muse, in chat with the user | Dev Studio code: the PARIS/OpenHands adapter, the git route, the Muse loop |
| Can one call the other? | No | No |

The PARIS App is the credential Dev Studio uses to call the GitHub API
from the Admin server. Muse's App is a separate installation. Nothing in
this repo can invoke Muse, and Muse cannot invoke Dev Studio.

## Dev Studio working like Muse

That is the goal of `lib/devstudio/muse-loop.ts` and
`POST /api/admin/dev-studio/muse-loop`: Dev Studio drives the same five
steps itself, using the PARIS App credential, with no OpenHands
dependency. Admin-only, plus the `access_dev_tools` permission. It opens
draft PRs and reports CI state; it never merges.

Why a separate loop exists at all: Dev Studio's existing code-fix engine
is OpenHands, and OpenHands has 0 completed tasks in this repo (29 tasks,
22 failed; key untested since 2026-09-15). The Muse loop is the working
replacement until OpenHands is proven live. See
`lib/devstudio/capability-registry.ts` — OpenHands is marked `unproven`
with the Muse loop as its fallback.

## What remains unproven

- The Muse loop is unit-tested against a mocked GitHub API. Its first
  live run from the Admin server must be a small, reviewed change.
- OpenHands: prove it (key test must return
  `read_authorization_verified`, then one small task must complete) or
  retire its panels.
