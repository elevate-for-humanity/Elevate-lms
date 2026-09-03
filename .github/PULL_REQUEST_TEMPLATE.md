## What Changed

<!-- Describe what changed in 2-4 sentences. Focus on the outcome, not implementation details. -->

## Why This Changed

<!-- Explain the motivation. What problem does this solve? What was broken or missing? -->

## How to Verify

<!-- Provide step-by-step instructions for testing this change. Be specific enough that someone unfamiliar with the work can reproduce it. -->

1.
2.
3.

## Evidence

<!-- Paste proof that this works: build output, test results, screenshots, logs, SQL queries, or API responses. -->

```
# Paste evidence here
```

## Rollback Plan

<!-- If this needs to be reverted, what are the exact steps? -->

## Pre-Merge Checklist

**Code Quality**

- [ ] Code builds without errors (`npm run build`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code follows existing patterns and conventions

**Functionality**

- [ ] Core flow tested end-to-end
- [ ] Edge cases handled (empty states, errors, invalid inputs)
- [ ] No regressions in related features

**Security & Data**

- [ ] Server-side enforcement in place (no client-only security)
- [ ] Database changes verified with test queries
- [ ] No secrets exposed in code or logs
- [ ] Multi-tenant boundaries preserved (if applicable)

**Testing & Evidence**

- [ ] Acceptance criteria met and verified
- [ ] Proof provided (logs, screenshots, queries, or tests)
- [ ] Manual testing completed for critical paths

**Documentation**

- [ ] Commit messages are clear and follow conventions
- [ ] Handoff documentation updated (if non-trivial change)
- [ ] Next actions documented (if work remains)

**Cleanup**

- [ ] Temporary files removed
- [ ] New dependencies justified (if any added)
- [ ] Only intentional changes committed (`git status` clean)

**Deployment Readiness**

- [ ] Environment variables documented (if new ones added)
- [ ] Migration steps documented (if database changes)
- [ ] Feature flags or gradual rollout considered (if high-risk)

## Related Issues

<!-- Link to related issues, tickets, or discussions -->

Closes #
Relates to #

## Deployment Notes

<!-- Any special instructions for deployment? Environment variables? Migration order? -->

## Risks & Tradeoffs

<!-- What could go wrong? What tradeoffs did you make? What should we watch in production? -->

---

**Reviewer Instructions:** Do not approve this PR unless every checkbox is marked and evidence is provided. If something is unclear, risky, or incomplete, request changes with specific feedback.
