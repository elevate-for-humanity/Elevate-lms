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

# FUTURE TASKS

1. **Accessibility (WCAG 2.1 AA)** — skip-nav, aria labels, focus styles, keyboard nav
2. **Navigation streamlining** — audience-based quick links
3. **Mobile optimization** — touch targets, responsive spacing
4. **Visual hierarchy improvements**
5. **Performance optimization**
6. **JotForm webhook security** — add IP allowlist or HMAC check
7. **Error message leaks** — 394 routes expose `error.message`
8. **Run SQL migrations** in Supabase Dashboard
9. **Commit and push** all accumulated changes

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
- `app/funding/jri/page.tsx` — JRI = Justice Reinvestment Initiative (Indiana DWD state program, separate from Job Ready Indy)
- `app/funding/job-ready-indy/page.tsx` — Job Ready Indy = Indianapolis workforce initiative for Marion County residents (separate from JRI)
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

# Canonical Portals by Role

When adding new pages for a specific role, use the canonical portal path. Non-canonical paths are legacy redirects — do not add new pages there.

| Role | Canonical path | Legacy (redirect-only) |
|------|---------------|------------------------|
| Learner / Student | `/learner/dashboard` | `/student-portal`, `/student` |
| Admin | `/admin/dashboard` | — |
| Instructor | `/instructor/dashboard` | — |
| Employer | `/employer/dashboard` | `/employer-portal` |
| Partner | `/partner/dashboard` | `/partner-portal` |
| Program Holder | `/program-holder/dashboard` | — |
| Staff | `/staff-portal/dashboard` | — |
| Mentor | `/mentor/dashboard` | — |

# API Conventions

## Auth Pattern

Use these helpers for new API routes. Do not use `getUser()` directly — it does not enforce role.

```ts
// Any authenticated user
import { apiAuthGuard } from '@/lib/admin/guards';
const auth = await apiAuthGuard(request);
if (auth.error) return auth.error;

// Admin or super_admin only
import { apiRequireAdmin } from '@/lib/admin/guards';
const auth = await apiRequireAdmin(request);
if (auth.error) return auth.error;
```

There is no root `middleware.ts`. Auth is enforced per-route. Every route that reads or writes user data must call one of the above before any DB access.

## Rate Limiting

Use `applyRateLimit` from `lib/api/withRateLimit.ts`. Choose the tier that matches the route's risk level.

```ts
import { applyRateLimit } from '@/lib/api/withRateLimit';
const rateLimited = await applyRateLimit(request, 'api');
if (rateLimited) return rateLimited;
```

| Tier | Limit | Use for |
|------|-------|---------|
| `strict` | 3 req / 5 min | Sensitive admin actions |
| `auth` | 5 req / 1 min | Login, signup, password reset |
| `payment` | 10 req / 1 min | Checkout, Stripe webhooks |
| `contact` | 3 req / 1 min | Contact forms, enrollment forms |
| `api` | 100 req / 1 min | General authenticated API |
| `public` | 10 req / 1 min | Public AI tutor, unauthenticated reads |

Do not use `lib/rateLimit.ts` (in-memory, broken in serverless) or `lib/rateLimiter.ts` (different Redis client). Canonical rate limit logic is in `lib/rate-limit.ts`.

## Error Response Shape

All API error responses must use `{ error: string }`. Never use `{ message: string }` for errors, and never return `error.message` directly (leaks internal details).

```ts
// Correct
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Program not found' }, { status: 404 });

// Wrong — do not do this
return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: error.message }, { status: 500 });
```

## Auth Redirect Parameter

Use `?redirect=<path>` (not `?next=`) when redirecting unauthenticated users to login. The login form reads `redirect`.

```ts
redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
```

# Document Generation (Partnership Proposals)

Elevate uses Node.js + `docx` (npm package) to generate `.docx` partnership proposals programmatically, then emails them via SendGrid.

## Pattern

```js
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        WidthType, AlignmentType, BorderStyle, ImageRun, ShadingType,
        convertInchesToTwip } = require('docx');
```

- Logo: `public/images/Elevate_for_Humanity_logo_81bf0fab.jpg` — render at 60×90px
- Brand colors: `DARK = '1E293B'`, `RED = 'DC2626'`, `GRAY = '6B7280'`
- Page margins: 1in top/bottom, 1.25in left/right
- Font: Arial throughout, body size 22 (11pt), headings size 28 (14pt)
- Output to `/tmp/` then attach to SendGrid email

## SendGrid

- API key stored in the generation script (not in env — keep as-is for now)
- From address: `noreply@elevateforhumanity.org`
- Reply-to: `elevate4humanityedu@gmail.com`
- Recipient: `elevate4humanityedu@gmail.com` (Elizabeth Greene)

## La Plaza Proposal — Current State (v4)

File: `LaPlaza_Partnership_Proposal_Elevate_v4.docx`

Program table (Section 2):
| Program Length | 12 weeks (flexible based on hours/days per week) |
| Classroom Instruction | 12 weeks |
| Primary Credential | EPA Section 608 Universal (proctored on-site at Elevate) |
| Additional Credentials | OSHA 10-Hour, ACT WorkKeys / NCRC |
| Cohort Size | Up to 30 participants per cohort |
| Service Area | Indianapolis / Marion County |

Key decisions made:
- OJT Placements row removed (employer agreements still pending)
- Hands-On Training row removed (redundant with Classroom Instruction)
- Cohort size: up to 30 participants

---

# Cleanup Status

- ✅ All stock images replaced with local workforce images
- ✅ All "Join thousands" template CTAs eliminated
- ✅ All inline SVG Learn/Certify/Work cards → Lucide icons
- ✅ All pexels image references → local images (except preview/[previewId])
- ✅ All empty alt="" attributes → descriptive alt text
- ✅ All blue-* → brand-blue-* across app/ and components/
- ✅ 27+ public pages rewritten with real content
- ✅ Auth flow: signin/signup redirect to real forms

---

# Multi-Provider Hub — Canonical Patterns

## Role Model (complete)

```ts
export type UserRole =
  | 'student' | 'instructor' | 'admin' | 'super_admin' | 'staff'
  | 'program_holder' | 'provider_admin' | 'case_manager'
  | 'employer' | 'partner' | 'delegate';
```

`provider_admin` — scoped to a single `tenant_id`. Cannot read cross-tenant data.  
`case_manager` — scoped to assigned learners via `case_manager_assignments`. Read-only except placement verification.

## Tenant Architecture

- `tenants.type` enum: `elevate | partner_provider | employer | workforce_agency`
- `organizations.tenant_id` FK → `tenants` (required for `type = 'training_provider'`)
- RLS helpers (all `SECURITY DEFINER`, stable):
  - `get_my_tenant_id()` — returns caller's `tenant_id` from profiles
  - `is_provider_admin()` — boolean check
  - `is_case_manager()` — boolean check
  - `get_my_assigned_learner_ids()` — UUID[] of assigned learners
  - `get_my_role()` — returns role string
  - `is_admin_role()` — boolean for admin/super_admin/staff

## Safe Error Responses

Always use `lib/api/safe-error.ts`. Never return `error.message` in API responses.

```ts
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';

// Expected errors
return safeError('Program not found', 404);

// Unexpected errors — logs internally, returns generic message
return safeInternalError(err, 'Failed to create enrollment');

// Supabase errors
if (error) return safeDbError(error, 'Failed to fetch programs');
```

## Admin IP Guard

```ts
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
const blocked = checkAdminIP(request);
if (blocked) return blocked;
```

Controlled by `ADMIN_IP_ALLOWLIST` env var (comma-separated CIDRs). No-op if unset.

## Credential Authority Separation

- Platform stores credential records and verification links
- Certifications are issued by their respective authorities (EPA, PTCB, CompTIA, NCCER, Indiana SDOH)
- Elevate does not issue credentials it does not legally control
- `learner_credentials.verification_source` tracks how verification was obtained
- External verification: `lib/credentials/verification.ts` (CompTIA implemented; add providers to registry)
- Badge issuance: `lib/credentials/credly.ts` + job handler `lib/jobs/handlers/credly-badge.ts`

## Enrollment Schema — Source of Truth

Three enrollment tables exist. Use `program_enrollments` for new code:

| Table | References | Status |
|-------|-----------|--------|
| `program_enrollments` | 409 | **Canonical** — use this |
| `training_enrollments` | 68 | LMS operational (attendance, cohort, docs) |
| `enrollments` | 15 | Legacy — compatibility view → `program_enrollments` |

## Key New Tables (Phase 1–10)

| Table | Purpose |
|-------|---------|
| `provider_program_approvals` | External provider program approval workflow |
| `placement_records` | First-class employment outcome records |
| `enrollment_funding_records` | Funding source per enrollment (WIOA/WRG/JRI) |
| `data_deletion_requests` | FERPA/CCPA deletion request tracking |
| `consent_records` | Structured data sharing consent |
| `tenant_compliance_records` | Compliance status per tenant per area |
| `wioa_participants` | WIOA participant records (PIRL-aligned) |
| `wioa_participant_records` | Individual PIRL data points |

## Key New Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/provider/programs/submit` | provider_admin | Submit program for review |
| `POST /api/provider/programs/[id]/review` | admin/staff | Approve or reject |
| `GET /api/provider/programs/list` | provider_admin/admin | List approvals |
| `GET/POST /api/placements` | admin/staff/case_manager | Placement records |
| `GET /api/employer/matches` | admin/employer | Employer-program matching |
| `GET /api/cron/expire-credentials` | CRON_SECRET | Expire stale credentials |
| `POST/DELETE /api/admin/impersonate` | admin/super_admin | Support impersonation |
| `POST /api/provider/export` | provider_admin | Queue CSV data export |

## Impersonation

Admin-only. Every session is written to `admin_audit_events` (immutable).  
Cannot impersonate admin-tier users. Sessions expire after 60 minutes.  
UI: `/admin/impersonate`

## Docs

- `docs/platform-readiness-implementation-plan.md` — audit findings and execution plan
- `docs/platform-readiness-completion-report.md` — full completion report with deployment steps
