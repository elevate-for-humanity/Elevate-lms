# Internal SEO Governance Rules

**Indexing, Content, and Crawl Control**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Last Reviewed | January 2025 |
| Owner | Platform Governance |

---

## Purpose

This document defines the rules for publishing, indexing, and modifying content that may be visible to search engines. Its purpose is to protect platform credibility, prevent SEO drift, and ensure all indexed content aligns with governance, compliance, and product reality.

**No page may be indexed or materially changed outside these rules.**

---

## Scope

These rules apply to:

- Website pages
- Resource and knowledge pages
- Public LMS-facing pages
- Supersonic Fast Cash informational pages
- Metadata, canonical tags, and robots directives

They apply to all contributors, including developers, content writers, contractors, and vendors.

---

## Core Principle (Non-Negotiable)

> **Publishing ≠ Indexing**
>
> Pages may be published freely.
> Pages may only be indexed deliberately.
>
> **Indexing is a governance decision, not a content decision.**

---

## Indexing Authority

Only the following roles may approve a page for indexing:

- Platform Governance
- Compliance & Program Operations
- SEO Owner (designated)

**If approval is not explicit, the page defaults to `noindex`.**

---

## Indexing Eligibility Rules

A page may be indexed only if **all** conditions are met:

| # | Condition | Description |
|---|-----------|-------------|
| 1 | Public | No authentication required |
| 2 | Stable | Content does not change per user |
| 3 | Complete | No placeholders, no "coming soon" |
| 4 | Evergreen | Valid for at least 6 months |
| 5 | Canonical | Single clean URL, no parameters |
| 6 | Governed | Aligned with authoritative documents |
| 7 | Compliant | Reviewed for compliance language |

**Fail one condition → `noindex, follow`**

---

## Mandatory Defaults

### All new public pages

Default to:

```html
<meta name="robots" content="noindex, follow">
```

**Indexing is opt-in, not opt-out.**

---

## Always Blocked From Indexing

The following must **never** be indexed:

- `/auth/*` - Authentication pages
- `/dashboard/*` - Dashboards
- `/admin/*` - Admin routes
- `/checkout/*` - Checkout flows and success/cancel pages
- `/lms/courses/*` - LMS lesson content
- `/*?*` - URLs with query parameters
- Any personalized or dynamic pages

**Violation of this rule is considered a platform risk.**

---

## Resource Content Rules

All `/resources/*` pages must:

1. Follow the approved resource template
2. Be informational only (no advice, no promises)
3. Include disclosures
4. Be listed on the Resource Index page (`/resources`)
5. Be reviewed before indexing

**No resource page may exist outside the Resource Index.**

---

## Meta & Canonical Discipline

Every indexed page must include:

```html
<title>Unique Page Title (≤60 chars)</title>
<meta name="description" content="Unique description (140-160 chars)">
<link rel="canonical" href="https://www.elevateforhumanity.org/exact-path">
<meta name="robots" content="index, follow">
```

**No shared or duplicated metadata is allowed.**

---

## Change Management Rules

Any of the following actions require review:

| Action | Review Required |
|--------|-----------------|
| Changing page intent | ✅ Yes |
| Changing page title or description | ✅ Yes |
| Changing index/noindex status | ✅ Yes |
| Adding new public routes | ✅ Yes |
| Removing disclosures | ✅ Yes |

Emergency fixes may be published but must be reviewed within 24 hours.

---

## Monitoring & Enforcement

### Weekly (light)

- [ ] Search Console coverage scan
- [ ] Index count vs sitemap count
- [ ] Check for surprise URLs indexed

### Monthly (formal)

- [ ] Indexed page inventory
- [ ] Thin content check
- [ ] Canonical audit

### If an issue is detected:

1. Apply `noindex` immediately
2. Fix content or structure
3. Re-index deliberately after review

---

## What We Do NOT Do

- ❌ We do not chase keywords
- ❌ We do not index drafts
- ❌ We do not index fast-changing pages
- ❌ We do not publish opinion as fact
- ❌ We do not override governance for speed

---

## Final Authority Statement

> **If there is a conflict between speed and control, control wins.**
>
> SEO growth is allowed only when it strengthens trust, clarity, and long-term credibility.

---

## Related Documents

- [Authoritative Documentation Index](/governance)
- [Security & Data Protection](/governance/security)
- [Indexing Governance Code](/lib/seo/indexing-governance.ts)
- [Page Metadata Config](/lib/seo/page-metadata.ts)

---

## Enforcement in Code

See `/lib/seo/indexing-governance.ts` for:
- `INDEXING_GATES` - All conditions that must pass
- `NEVER_INDEX_PATTERNS` - Blocked URL patterns
- `isNeverIndexed()` - Runtime check function

---

*End of Document*
