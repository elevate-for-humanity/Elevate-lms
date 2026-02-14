# Parity Diff — Repo vs Live Site

Generated: 2026-02-14

## Overview

| Metric | Count |
|---|---|
| Total repo routes (static, no dynamic params) | 1,370 |
| Live sitemap URLs | 888 |
| Matched (in both) | 879 |
| Repo-only (not in live sitemap) | 491 |
| Live-only (in sitemap but not in repo) | 9 |

## Live-Only URLs (in sitemap but not matching repo paths)

These appear in the live sitemap but don't match repo file paths exactly. Most are route-group artifacts:

| URL | Explanation |
|---|---|
| `/docs/ENV\_CONFIG.md` | Escaped backslash in sitemap — likely a bug in sitemap generation |
| `/org/create` | Route group: `app/(dashboard)/org/create` — sitemap strips `(dashboard)` |
| `/org/invites` | Route group: `app/(dashboard)/org/invites` |
| `/partners/attendance` | Route group: `app/(partner)/partners/attendance` |
| `/partners/documents` | Route group: `app/(partner)/partners/documents` |
| `/partners/login` | Route group: `app/(partner)/partners/login` |
| `/partners/reports/weekly` | Route group: `app/(partner)/partners/reports/weekly` |
| `/partners/students` | Route group: `app/(partner)/partners/students` |
| `/partners/support` | Route group: `app/(partner)/partners/support` |

**Issue**: Partner portal routes (`/partners/*`) are auth-gated but appear in the public sitemap. They should be excluded.

## Repo-Only Routes (not in live sitemap) — by category

These are correctly excluded from the sitemap:

| Category | Count | Correct? |
|---|---|---|
| `/admin/*` | 247 | ✅ Correct — auth-gated |
| `/lms/*` | 62 | ✅ Correct — auth-gated |
| `/supersonic-fast-cash/*` | 55 | ✅ Correct — separate domain |
| `/demo/*` | 20 | ✅ Correct — excluded |
| `/staff-portal/*` | 13 | ✅ Correct — auth-gated |
| `/student-portal/*` | 9 | ✅ Correct — auth-gated |
| `/account/*` | 7 | ✅ Correct — auth-gated |
| `/mentorship/*` | 7 | ⚠️ Should some be public? |
| `/auth/*` | 7 | ✅ Correct — auth flow |
| `/mentor/*` | 5 | ✅ Correct — auth-gated |
| `/checkout/*` | 4 | ✅ Correct — transactional |
| `/payment/*` | 3 | ✅ Correct — transactional |
| `/certiport-exam/*` | 2 | ⚠️ `/certiport-exam` could be public info |

## Navigation Divergence

**The live site does NOT use `lib/navigation/site-nav.config.ts`.**

The actual navigation sources are:
- **Header**: `components/layout/SiteHeader.tsx` — hardcoded `NAV_ITEMS` and `DESKTOP_NAV_LINKS`
- **Footer**: `components/layout/SiteFooter.tsx` — hardcoded `footerSections`
- **Unused**: `lib/navigation/site-nav.config.ts` — 45 links, not imported by any rendered component
- **Unused**: `components/layout/MainNav.tsx` — alternative nav, not used in ConditionalLayout

### Live Header Nav (from SiteHeader.tsx)

| Section | Links |
|---|---|
| Programs | `/programs`, `/programs/healthcare`, `/programs/skilled-trades`, `/programs/beauty`, `/programs/technology`, `/programs/business` |
| How It Works | `/how-it-works`, `/check-eligibility`, `/funding`, `/faq` |
| About | `/about`, `/contact` |
| CTAs | `/login`, `/programs`, `/apply/student` |

### Live Footer Nav (from SiteFooter.tsx)

| Section | Links |
|---|---|
| About | `/about`, `/store/licenses`, `/about#mission`, `/outcomes/indiana`, `/contact` |
| Programs | `/programs`, `/how-it-works`, `/programs/barber-apprenticeship`, `/employer` |
| Compliance & Trust | `/governance`, `/governance/data`, `/accessibility`, `/governance/ai` |
| Access | `/login`, `/partner/login`, `/support` |
| Bottom bar | `/terms-of-service`, `/privacy-policy`, `/accessibility`, `/governance` |

### Live Homepage Body Links (from page content)

Additional links found in homepage sections:
- `/funding`, `/programs`, `/how-it-works`, `/career-services`
- `/wioa-eligibility`, `/apply/student`
- `/employer`, `/apply/program-holder`
- `/programs/healthcare`, `/programs/skilled-trades`, `/programs/barber-apprenticeship`
- `/programs/cdl`, `/programs/technology`, `/programs/cpr-first-aid-hsi`

### Live Footer Extra Links (from homepage crawl)

The live homepage footer has MORE links than SiteFooter.tsx shows:
- Programs: `/programs/healthcare`, `/programs/skilled-trades`, `/programs/cdl-training`, `/programs/barber-apprenticeship`, `/apply/student`
- Funding: `/funding`, `/wioa-eligibility`, `/financial-aid`, `/tuition-fees`, `/scholarships`
- About: `/about`, `/mission`, `/how-it-works`, `/testimonials`, `/outcomes/indiana`
- Support: `/help`, `/faq`, `/contact`, `/academic-calendar`, `/student-handbook`
- Access: `/login`, `/employer`, `/partner/login`, `/verify`

**This means the live site footer was updated AFTER the last deploy, OR there's a different footer component being used on the homepage.**

## Key Discoverability Gaps

Pages that exist, are public, and should be findable but are NOT linked from nav/footer:

### HIGH priority (core offering pages)

| Page | In Sitemap? | In Nav? | In Footer? | Inbound Links |
|---|---|---|---|---|
| `/credentials` | ✅ | ❌ | ❌ | 0 |
| `/features` | ✅ | ❌ | ❌ | 0 |
| `/enterprise` | ✅ | ❌ | ❌ | 0 |
| `/government` | ✅ | ❌ | ❌ | 0 |
| `/certifications` | ✅ | ❌ | ❌ | 1 |
| `/directory` | ✅ | ❌ | ❌ | 2 |
| `/search` | ✅ | ❌ | ❌ | 1 |

### MEDIUM priority (student/funding pages)

| Page | In Sitemap? | In Nav? | In Footer? | Inbound Links |
|---|---|---|---|---|
| `/scholarships` | ✅ | ❌ | ✅ (live) | 0 |
| `/financial-aid` | ✅ | ❌ | ✅ (live) | 2 |
| `/tuition` | ✅ | ❌ | ❌ | 0 |
| `/orientation` | ✅ | ❌ | ❌ | 1 |
| `/ojt-and-funding` | ✅ | ❌ | ❌ | 3 |
| `/jri` | ✅ | ❌ | ❌ | 1 |
| `/philanthropy` | ✅ | ❌ | ❌ | 2 |
| `/press` | ✅ | ❌ | ❌ | 0 |
| `/webinars` | ✅ | ❌ | ❌ | 2 |

### LOW priority (legal/compliance — sitemap is sufficient)

| Page | In Sitemap? | Inbound Links |
|---|---|---|
| `/accreditation` | ✅ | 3 |
| `/ferpa` | ✅ | 12 |
| `/grievance` | ✅ | 5 |
| `/legal` | ✅ | 8 |
| `/refund-policy` | ✅ | 10 |
| `/equal-opportunity` | ✅ | 1 |
| `/dmca` | ✅ | 0 |
| `/disclosures` | ✅ | 0 |

## Sitemap Issues

1. **Partner portal routes in sitemap**: `/partners/attendance`, `/partners/documents`, etc. are auth-gated but not excluded. Add `/partners` to `EXCLUDED_PREFIXES` in `app/sitemap.ts`.
2. **Escaped backslash**: `/docs/ENV\_CONFIG.md` — fix or exclude `/docs/ENV_CONFIG.md`.
3. **`/org/*` routes in sitemap**: Dashboard routes leaking through route groups. Add `/org` to `EXCLUDED_PREFIXES`.
