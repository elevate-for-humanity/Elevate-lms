# Content Sources — Elevate LMS

Generated: 2026-02-14

## Homepage (`app/page.tsx`)

| Section | Source | File/Module |
|---|---|---|
| Hero video | Static component | `app/HomeHeroVideo.tsx` |
| Program cards (6) | Inline array in `app/page.tsx` | Lines 14-62 |
| Marquee banner | Component | `components/MarqueeBanner.tsx` |
| Stat strip | Component | `components/StatStrip.tsx` |
| Testimonial carousel | Hardcoded array in component | `components/TestimonialCarousel.tsx` |
| Team preview | Config file | `data/team.ts` → `TEAM_PREVIEW` |
| Trust badges | Component | `components/TrustBadges.tsx` |
| Compliance badges | Component | `components/ComplianceBadges.tsx` |
| Program finder | Component | `components/ProgramFinder.tsx` |
| Program highlights | Component | `components/ProgramHighlights.tsx` |
| Newsletter signup | Component | `components/NewsletterSignup.tsx` |

## Programs Catalog

| Source | File | Notes |
|---|---|---|
| Program registry (slugs, names, categories) | `lib/program-registry.ts` | `PROGRAMS[]` — canonical slug list, form routing |
| Program display data (blurbs, funding, images) | `lib/programs-data.ts` | `PROGRAMS[]` — marketing copy, durations |
| Canonical program data (hours, credentials, wages) | `lib/programs/canonical-data.ts` | `PROGRAMS{}` — apprenticeship hours, RAPIDS codes |
| Program detail pages | `app/programs/[slug]/page.tsx` | Dynamic route, pulls from above sources |
| Program images | `lib/program-images.ts` | Image path mappings |

⚠️ Three separate "PROGRAMS" exports exist. `program-registry.ts` is the slug authority, `canonical-data.ts` is the credential/hours authority, `programs-data.ts` is the marketing copy authority.

## Team / Bios

| Source | File | Notes |
|---|---|---|
| Team data (7 members) | `data/team.ts` | `FOUNDER`, `TEAM_PREVIEW` exports |
| Team page | `app/about/team/page.tsx` | Fetches from Supabase `team_members` table, falls back to `data/team.ts` |
| About page founder section | `app/about/page.tsx` | Uses `FOUNDER` from `data/team.ts` |

## Testimonials / Outcomes

| Source | File | Notes |
|---|---|---|
| Testimonial carousel | `components/TestimonialCarousel.tsx` | Hardcoded array (5 entries) |
| Success stories page | `app/success/page.tsx` | Static content |
| Testimonial images | `lib/program-images.ts` | References `/images/testimonials-hq/person-*.jpg` |

⚠️ Testimonials are hardcoded in the component, not sourced from DB or config file.

## Compliance / Licensing Language

| Source | File | Notes |
|---|---|---|
| Compliance badges | `components/ComplianceBadges.tsx` | DOL, WIOA, WRG, JRI, State License badges |
| Administrator statement | `lib/programs/canonical-data.ts` | `ADMINISTRATOR_STATEMENT` constant |
| State variation disclaimer | `lib/programs/canonical-data.ts` | `STATE_VARIATION_DISCLAIMER` constant |
| Privacy policy | `app/privacy-policy/page.tsx` | Static (14 sections, FERPA, WIOA) |
| Terms of service | `app/terms/page.tsx` | Static |
| Accreditation page | `app/accreditation/page.tsx` | Static |
| FERPA pages | `app/ferpa/` (12 pages) | Static |
| Policies directory | `app/policies/` (35 pages) | Static |

## Credential Mappings

| Source | File | Notes |
|---|---|---|
| Certiport exams | `lib/partners/certiport.ts` | `CERTIPORT_EXAMS` — exam codes, names, passing scores |
| Credential system | `lib/credentials/credential-system.ts` | Credential issuance, verification |
| Certificate generator | `lib/certificates/generator.ts` | PDF generation |
| Certificate issuance | `lib/certificates/issue-certificate.ts` | Authoritative issuance service |

## Navigation

| Source | File | Notes |
|---|---|---|
| Header + footer nav | `lib/navigation/site-nav.config.ts` | `headerNavigation`, `footerNavigation` |
| Hero configs | `lib/hero-config.ts` | Per-route hero images/titles |

## Funding

| Source | File | Notes |
|---|---|---|
| Funding catalog | `lib/funding/catalog.ts` | Funding source definitions |
| Funding match | `lib/funding/match.ts` | Eligibility matching logic |
| Funding pages | `app/funding/` (12 pages) | Static + config-driven |
