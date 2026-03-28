## Description

<!-- Brief description of changes -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Configuration change
- [ ] Other: ___________

---

## SEO & Indexing Governance Check

> **Required for any PR that adds or modifies public pages.**
> See [SEO Governance Rules](/docs/SEO-GOVERNANCE.md) for details.

### A. Page Changes

- [ ] This PR adds new public-facing pages
- [ ] This PR modifies existing public-facing pages
- [ ] This PR does **NOT** affect public pages (skip to Testing section)

### B. Indexing Status

- [ ] New/modified pages default to `noindex, follow`
- [ ] Any `index, follow` pages are listed in `config/seo-index-whitelist.json`
- [ ] No `/auth`, `/admin`, `/dashboard`, `/checkout`, or dynamic routes are indexable

### C. Meta & Canonical

- [ ] Indexed pages have unique `<title>` tags (≤60 chars)
- [ ] Indexed pages have unique `<meta description>` (140-160 chars)
- [ ] Canonical URLs point to `https://www.elevateforhumanity.org`

### D. Resource Content (if applicable)

- [ ] Resource pages follow approved template (`ResourcePageTemplate`)
- [ ] Disclosures included at bottom of page
- [ ] Page is listed on `/resources` index
- [ ] N/A - not a resource page

### E. Review & Sign-off

- [ ] Compliance language reviewed (no guarantees, no advice)
- [ ] Platform Governance aware of any indexing changes
- [ ] CI SEO validation passes

**If any box is unchecked, explain why:**

<!-- Explanation here -->

---

## Testing

- [ ] Tested locally
- [ ] Tested on preview deployment
- [ ] Existing tests pass
- [ ] New tests added (if applicable)

## Screenshots (if applicable)

<!-- Add screenshots here -->

---

## Pre-merge Checklist

- [ ] Code follows project conventions
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] Commits are clean and descriptive
- [ ] Ready for review

---

## Related Issues

<!-- Link related issues: Fixes #123, Relates to #456 -->

---

## Reliability Gate

Every box must be checked before merge when this PR touches enrollment, booking, payment, application, or auth flows.

### API routes

- [ ] No API route returns `success: true` after a DB write failure
- [ ] No `catch` block logs and continues — persistence failures return non-2xx
- [ ] Native form POST routes redirect on both success and error — no raw JSON responses
- [ ] Email / notification sends only run **after** a confirmed DB write

### Client submit handlers

- [ ] Handlers validate payload `success` and a required identifier — not just `response.ok`
- [ ] Error states are visible to the user inline — not console-only
- [ ] Double-submit is prevented while a request is in flight

### Revenue / enrollment / booking / payment flows

- [ ] Payment or next-step redirect only happens after a real persisted record ID is confirmed
- [ ] Failure paths keep the user on-page with a recoverable error message
- [ ] These flows were manually broken and re-tested

### Guard scripts

- [ ] `pnpm lint:reliability` passes
- [ ] `pnpm lint:critical-routes` passes

> **Rule: No DB record = no success state.**
