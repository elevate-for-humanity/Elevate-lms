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

---

## Pre-auth Registry Check

> **Required for any PR that adds or modifies a public-write route, webhook, intake form,
> application form, enrollment flow, checkout flow, or anonymous insert path.**

- [ ] This PR does **NOT** add or modify any public-write route or anonymous insert path
- [ ] This PR **does** add or modify a public-write path — and I have done the following:

  **If the new table needs user_id reconciliation after account creation:**
  - [ ] Table added to `lib/pre-auth-tables.ts` with `mode: 'reconcile'`
  - [ ] `emailColumn` and `userIdColumn` are correct
  - [ ] `scripts/detect-orphaned-rows.sql` updated to include the new table
  - [ ] Detection query run in Supabase and returns 0 linkable rows

  **If the table is intentionally anonymous (no user_id ever needed):**
  - [ ] Table added to `lib/pre-auth-tables.ts` with `mode: 'anonymous'`
  - [ ] `reason` field explains why no reconciliation is needed

  **If the route is exempt from the registry (e.g. auth is enforced by a non-standard pattern):**
  - [ ] Route file contains `// pre-auth-registry: exempt — <reason>`

- [ ] `node scripts/check-pre-auth-registry.cjs` passes locally

> **Rule: Every public-write table must be consciously categorized. Unregistered pre-auth
> inserts block merge via the integrity-gate CI check.**
