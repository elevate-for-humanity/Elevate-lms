# Orphan Report — Elevate LMS

Generated: 2026-02-14

## Summary

- **Total routes in repo**: 1,467
- **Nav/footer linked routes**: 45
- **Important public pages not in nav/footer**: 71
- **Completely orphaned (0 inbound links, not in nav)**: 22
- **Partially linked (some inbound links but not in nav)**: 49

## CRITICAL: Completely Orphaned Public Pages (0 inbound links)

These pages exist in the repo, are public, but have zero inbound links from anywhere in the codebase AND are not in nav/footer.

| Route | Risk | Recommended Fix |
|---|---|---|
| `/credentials` | HIGH — core offering page | Add to nav under Programs or About |
| `/features` | HIGH — platform value prop | Add to nav under About or footer |
| `/testimonials` | HIGH — social proof | Add to nav under For Students → Success Stories, or redirect to `/success` |
| `/scholarships` | HIGH — student acquisition | Add to nav under For Students → Funding |
| `/government` | HIGH — B2G landing page | Add to nav under For Employers or Partners |
| `/enterprise` | HIGH — B2B landing page | Add to nav under For Employers |
| `/founder` | MEDIUM — about page variant | Link from `/about` or redirect to `/about` |
| `/funding-impact` | MEDIUM — donor-facing | Link from `/philanthropy` or `/funding` |
| `/licensing` | MEDIUM — partner-facing | Add to footer under Partners |
| `/press` | MEDIUM — media page | Add to footer |
| `/tuition` | MEDIUM — student-facing | Link from `/funding` or `/how-it-works` |
| `/what-we-offer` | MEDIUM — marketing page | Redirect to `/programs` or `/features` |
| `/career-training-indiana` | LOW — SEO landing page | Internal links from state-specific content; sitemap covers it |
| `/career-training-ohio` | LOW — SEO landing page | Same as above |
| `/career-training-texas` | LOW — SEO landing page | Same as above |
| `/career-training-tennessee` | LOW — SEO landing page | Same as above |
| `/career-training-illinois` | LOW — SEO landing page | Same as above |
| `/community-services-indiana` | LOW — SEO landing page | Same as above |
| `/community-services-ohio` | LOW — SEO landing page | Same as above |
| `/community-services-tennessee` | LOW — SEO landing page | Same as above |
| `/community-services-illinois` | LOW — SEO landing page | Same as above |
| `/community-services-texas` | LOW — SEO landing page | Same as above |

## Partially Linked (some inbound links, but not in nav/footer)

These have some internal links but are not in the primary navigation.

| Route | Inbound Links | Recommended Fix |
|---|---|---|
| `/accreditation` | 3 | Add to footer under Legal/Compliance |
| `/certifications` | 1 | Add to nav under Programs |
| `/directory` | 2 | Add to footer |
| `/ferpa` | 12 | Add to footer under Legal |
| `/grievance` | 5 | Add to footer under Legal |
| `/legal` | 8 | Add to footer (already has sub-pages linked) |
| `/nonprofit` | 8 | Add to footer under About |
| `/refund-policy` | 10 | Add to footer under Legal |
| `/student-handbook` | 5 | Add to footer under For Students |
| `/drug-testing` | 6 | Linked from programs; OK as-is |
| `/financial-aid` | 2 | Add to nav under For Students → Funding |
| `/hire-graduates` | 2 | Add to nav under For Employers |
| `/ojt-and-funding` | 3 | Link from `/funding` |
| `/philanthropy` | 2 | Add to footer |
| `/resources` | 3 | Add to footer |
| `/rise-foundation` | 3 | Link from `/about/partners` |
| `/search` | 1 | Add to header (search icon) |
| `/syllabi` | 2 | Link from program pages |
| `/tuition-fees` | 3 | Link from `/funding` or `/how-it-works` |
| `/volunteer` | 1 | Add to footer under About |
| `/webinars` | 2 | Add to footer under Resources |
| `/equal-opportunity` | 1 | Add to footer under Legal |
| `/jri` | 1 | Link from `/funding` |
| `/orientation` | 1 | Link from enrollment flow |
| `/verify` | 1 | Add to footer |

## Pages That Should Be Protected (not public)

These routes exist as public but should likely be behind auth or noindex:

| Route | Current State | Recommended Fix |
|---|---|---|
| `/access-paused` | Public | Add noindex — utility page |
| `/cache-diagnostic` | Public | Add noindex + auth check |
| `/sentry-test` | Public | Delete or add auth check |
| `/test-enrollment` | Public | Delete or add auth check |
| `/test-images` | Public | Delete or add auth check |
| `/unauthorized` | Public | Add noindex — utility page |
| `/builder` | Public | Add auth check |
| `/studio` | Public | Add auth check |
| `/import` | Public | Add auth check |
| `/generate` | Public | Add auth check |

## Unused API Routes (not called from UI)

SOURCE MISSING — requires grep of all fetch/axios calls vs all `/api/` routes. Deferred to Phase 3.

## Dead Content Configs

| File | Issue |
|---|---|
| `lib/programs-data.ts` | Uses unsplash URL for `emergency-health-safety-tech` image |
| `components/TestimonialCarousel.tsx` | References `/testimonials/sarah.jpg` — file may not exist |
| `lib/program-images.ts` | References `/images/testimonials-hq/person-*.jpg` — verify files exist |
