# HVAC Legacy Retirement — Final Merge Policy

HVAC legacy retirement is not considered protected until repository policy and
code policy both enforce the same outcome. Passing tests alone do not satisfy
this standard.

---

## Required repository controls for main

In GitHub, open: **Settings → Branches → Branch protection rules → main**

Enable these controls:

- **Require a pull request before merging**
- **Require at least 1 approving review** — prevents a PR from merging after checks pass without real human review
- **Require conversation resolution before merging** — prevents unresolved review comments from being silently ignored
- **Require status checks to pass before merging**
- **Require branches to be up to date before merging**
- **Do not allow bypassing the above settings** — this is the critical one; without it, admins can merge without satisfying any of the above

"Do not allow bypassing the above settings" is the critical admin lock. Without it, repository admins may be able to merge or push around required PR, review, and status-check controls. Direct-push behavior must also remain restricted by the branch protection rule or ruleset configuration, and force pushes and deletions should remain disabled unless explicitly intended.

### Mark these exact checks as required

```
HVAC legacy removal state
HVAC legacy reference audit
```

These are the two unconditional controls. They must be required on every PR,
including fork PRs, because they do not depend on secrets.

### Do not mark these as globally required for all PRs from forks

```
HVAC legacy retirement prerequisites
HVAC legacy readiness
```

Those depend on secrets. They are maintainer-run retirement checks, not
universal fork-safe required checks.

---

## Mandatory merge rule for any HVAC retirement PR

No PR that changes HVAC legacy routing, deletes HVAC legacy files, flips the
runtime flag, or removes retirement infrastructure may be merged unless all of
the following are true:

- The PR passes **HVAC legacy removal state**
- The PR passes **HVAC legacy reference audit**
- A maintainer has run the DB-backed retirement verification with secrets enabled
- The maintainer has confirmed the result of `pnpm verify:hvac-legacy-readiness`
- The PR description includes a completed retirement checklist

If any one of those is missing, the PR does not merge. No exceptions made
casually. That is the line.

---

## Required PR checklist for HVAC retirement work

Paste this into every HVAC retirement PR:

```
- [ ] HVAC legacy removal state passed
- [ ] HVAC legacy reference audit passed
- [ ] Maintainer ran pnpm verify:hvac-legacy-readiness with required secrets
- [ ] DB-backed retirement prerequisites passed
- [ ] Renderer cutover behavior verified with legacy runtime disabled
- [ ] No partial deletion of tracked HVAC legacy files
- [ ] No new legacy HVAC files introduced outside approved tracked set
- [ ] Kill switch state is intentional for this PR
- [ ] Retirement stub migration still present and matches policy stage
- [ ] At least 1 approving review obtained before merge
- [ ] All review conversations resolved before merge
- [ ] main branch protection still requires the two unconditional HVAC checks
      and "Do not allow bypassing" is still enabled
```

The last two checkboxes are not redundant. They catch silent governance drift —
specifically the case where someone disables bypass protection or removes a
required check without updating this document.

---

## Non-negotiable naming rule

Do not rename the GitHub Actions job names for:

```
HVAC legacy removal state
HVAC legacy reference audit
```

If you rename them, branch protection stops enforcing the intended controls
until someone manually rebinds the required checks. That is how supposedly
protected repos get punched through by accident.

Required status check names must be unique across all workflows. Before locking
these as required checks, verify they appear exactly once each:

```bash
grep -rn "HVAC legacy removal state\|HVAC legacy reference audit" .github/workflows/
```

Expected: one result per name, both in `ci-cd.yml`. If either name appears in
more than one workflow, GitHub will produce ambiguous check results and may
block merges unpredictably.

---

## Operational policy for maintainers

Maintainers may not merge on the basis of "tests are green" alone when the PR
affects HVAC retirement state.

Maintainers must verify whether the PR touches any of these areas:

- `LessonContentRenderer`
- HVAC kill switch
- retirement stub migration
- tracked HVAC legacy file set
- legacy reference audit boundaries
- DB retirement prerequisite logic

If yes, the maintainer must treat the PR as retirement-sensitive and run the
DB-backed verification before merge.

---

## What counts as bulletproof

You can reasonably call this bulletproof only when all three are true:

1. The code-level controls exist and pass
2. The unconditional checks are required on main
3. Direct or bypass merges cannot skip those checks

Until then, it is hardened, not final.

---

## Status labels

**Current state (before branch protection is updated):**

> Code-enforced and test-hardened, pending final repository governance lock.

**Current state (after branch protection is updated with all six controls above):**

> HVAC legacy retirement enforcement is locked at both code and repository policy layers.

Note: "tests pass" is not equivalent to "governance locked." Tests passing in CI
proves the code controls work. It does not prove branch protection is configured.
These are independent. Both must be true before using the second label.

---

## Short version for the team lead

> Do not merge HVAC retirement-related PRs unless the two unconditional HVAC
> checks are required in branch protection and passing, and a maintainer has run
> `pnpm verify:hvac-legacy-readiness` with secrets. Passing tests without
> required branch protection is not final-state enforcement.

---

**The next action is simple: go into GitHub branch protection for main and lock
those two required checks today.**
