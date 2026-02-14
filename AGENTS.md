# Elevate LMS — Agent Guidelines

## Project Overview

**Elevate LMS** is a workforce development / career training platform for [Elevate for Humanity](https://www.elevateforhumanity.org). It handles ETPL, DOL sponsorship, credentialing, enrollment, and payments. The owner also runs **SupersonicFastCash**, a tax preparation software company (Enrolled Agent with EFIN and PTIN).

## Tech Stack

- **Framework**: Next.js 16.1.6 with Turbopack, App Router
- **Database**: Supabase (project `cuxzzpsyufcewtmicszk`, 516+ tables)
- **Hosting**: Netlify with `@netlify/plugin-nextjs`
- **Package Manager**: pnpm
- **Build**: `pnpm next build` — expect 882+ pages, zero errors

## Common Commands

- `pnpm next build` — Build for production (verify zero errors)
- `pnpm next dev --turbopack` — Start dev server
- `pnpm lint` — Run linter

## Key Directories

- `app/` — Next.js App Router pages
- `components/` — Reusable UI components
- `components/marketing/PublicLandingPage.tsx` — Config-driven marketing page template
- `data/team.ts` — Team member data (7 real members)
- `lib/tax-software/` — MeF tax stack
- `netlify/functions/` — Serverless functions (file-return.ts, refund-tracking.ts)
- `supabase/migrations/` — SQL migration files
- `public/images/` — All site images

## Available Replacement Images

When replacing stock images (`success-new/` or `students-new/` paths), use these real workforce images:

### heroes-hq/
about-hero.jpg, career-services-hero.jpg, contact-hero.jpg, employer-hero.jpg, funding-hero.jpg, how-it-works-hero.jpg, jri-hero.jpg, programs-hero.jpg, success-hero.jpg, success-stories-hero.jpg, tax-refund-hero.jpg, team-hero.jpg

### programs-hq/
barber-hero.jpg, barber-training.jpg, business-office.jpg, business-training.jpg, cdl-trucking.jpg, cna-training.jpg, cybersecurity.jpg, electrical.jpg, healthcare-hero.jpg, hvac-technician.jpg, it-support.jpg, medical-assistant.jpg, phlebotomy.jpg, skilled-trades-hero.jpg, students-learning.jpg, tax-preparation.jpg, technology-hero.jpg, training-classroom.jpg, welding.jpg

### trades/
electrical-hero.jpg, hero-program-carpentry.jpg, hero-program-cdl.jpg, hero-program-electrical.jpg, hero-program-hvac.jpg, hero-program-plumbing.jpg, hero-program-welding.jpg, program-building-construction.jpg, program-building-technology.jpg, program-cdl-commercial-driving.jpg, program-cdl-overview.jpg, program-construction-training.jpg, program-electrical-training.jpg, program-hvac-overview.jpg, program-hvac-technician.jpg, program-plumbing-training.jpg, program-welding-training.jpg, welding-hero.jpg

## Image Replacement Mapping Guide

Choose replacements based on page context:
- **Admin/dashboard pages** → `heroes-hq/about-hero.jpg` or `heroes-hq/career-services-hero.jpg`
- **Funding/grants pages** → `heroes-hq/funding-hero.jpg`
- **Contact/chat pages** → `heroes-hq/contact-hero.jpg`
- **Student/learning pages** → `programs-hq/students-learning.jpg` or `heroes-hq/success-hero.jpg`
- **Course/education pages** → `programs-hq/training-classroom.jpg` or `heroes-hq/programs-hero.jpg`
- **Tax pages** → `heroes-hq/tax-refund-hero.jpg` or `programs-hq/tax-preparation.jpg`
- **Partner/employer pages** → `heroes-hq/employer-hero.jpg`
- **Media/content pages** → `heroes-hq/success-stories-hero.jpg`
- **Auth pages (signin/signup/login)** → `heroes-hq/success-hero.jpg`
- **Mentorship pages** → `heroes-hq/career-services-hero.jpg`
- **Orientation pages** → `programs-hq/students-learning.jpg`
- **Reports pages** → `heroes-hq/how-it-works-hero.jpg`
- **Store pages** → `heroes-hq/programs-hero.jpg`
- **Healthcare-related** → `programs-hq/healthcare-hero.jpg` or `programs-hq/cna-training.jpg`
- **Trades-related** → `programs-hq/skilled-trades-hero.jpg` or specific trade image
- **Technology pages** → `programs-hq/technology-hero.jpg`

---

# COMPLETED TASKS

## Stock Image Replacement ✅
All 34 files with `success-new/` and `students-new/` stock images replaced with contextual workforce images.

## Template Sludge Elimination ✅
- All "Access your dashboard" broken copy fixed (12 files)
- All "Join thousands who have launched" CTAs eliminated (87+ files)
- All public-facing template pages rewritten with real content (27 pages)
- Auth pages: signin/signup redirect to real forms, forgot/reset-password have real forms
- Funding pages: how-it-works, federal-programs, state-programs, grant-programs all rewritten
- Support, training, grievance, forms, orientation pages all rewritten
- Admin template CTAs fixed to brand colors (52 files)

## Remaining Lower-Priority Items
- 8 files still have Learn/Certify/Work inline SVG card sections (complex JSX, admin pages)
- ~1,233 files use raw Tailwind blue/green/etc instead of brand tokens (gradual migration)
- 161 console.log statements should use logger utility
- Missing error.tsx in app/store and app/login

## Build State
Last verified: 882/882 pages, zero errors

---

# FUTURE TASKS (after stock images)

1. **Fix "Access your dashboard" placeholder text** in 12 files
2. **Accessibility (WCAG 2.1 AA)** — skip-nav, aria labels, focus styles, keyboard nav
3. **Navigation streamlining** — audience-based quick links
4. **Mobile optimization** — touch targets, responsive spacing
5. **Visual hierarchy improvements**
6. **Performance optimization**
7. **JotForm webhook security** — add IP allowlist or HMAC check
8. **Error message leaks** — 394 routes expose `error.message`
9. **Run SQL migrations** in Supabase Dashboard
10. **Commit and push** all accumulated changes

---

# Key Components Created

- **`components/marketing/PublicLandingPage.tsx`** — Reusable config-driven landing page (hero, intro, features, steps, CTA). Used by 7 partner pages.
- **`data/team.ts`** — Team data with FOUNDER and TEAM_PREVIEW exports
- **`netlify/functions/file-return.ts`** — Tax filing endpoint (service role key)
- **`netlify/functions/refund-tracking.ts`** — Public tracking endpoint (anon key, rate limited)

# Key Pages Rewritten

- `app/privacy-policy/page.tsx` — 14-section privacy policy with FERPA, WIOA, cookies table
- `app/search/page.tsx` — Program search with cards, funding tags
- `app/about/page.tsx` — Founder section, credentials, team preview
- `app/funding/dol/page.tsx` — DOL Registered Apprenticeship
- `app/funding/jri/page.tsx` — JRI funding with qualified language
- `app/credentials/page.tsx` — 8 credentials with issuer/field
- `app/training/certifications/page.tsx` — 8 cert programs
- `app/features/page.tsx` — 6 platform features
- `app/directory/page.tsx` — Partner directory
- `app/philanthropy/page.tsx` — Support/donation page
- `app/resources/page.tsx` — Resource hub
- 7 partner pages using PublicLandingPage template

# Known Fixed Issues

- `/license` 500 error — `ROUTES.pricing` → `ROUTES.licensePricing`
- Cookie banner / GlobalAvatar / voice-over issues in ClientWidgets.tsx
- Partner card JSX nesting bug on homepage
- Drug-testing instant-tests broken string from sed

# Brand Color Convention

All `blue-*` Tailwind classes have been migrated to `brand-blue-*` tokens across app/ and components/ (1,469 files). The hex values are identical — this enforces naming consistency.

Semantic colors (indigo, teal, purple, emerald, cyan) are intentionally kept for UI state differentiation (status badges, category colors, charts).

When adding new UI, always use `brand-blue-*`, `brand-red-*`, `brand-orange-*`, or `brand-green-*` for brand elements.

# Cleanup Status

- ✅ All stock images replaced with local workforce images
- ✅ All "Join thousands" template CTAs eliminated
- ✅ All inline SVG Learn/Certify/Work cards → Lucide icons
- ✅ All pexels image references → local images (except preview/[previewId])
- ✅ All empty alt="" attributes → descriptive alt text
- ✅ All blue-* → brand-blue-* across app/ and components/
- ✅ 27+ public pages rewritten with real content
- ✅ Auth flow: signin/signup redirect to real forms
