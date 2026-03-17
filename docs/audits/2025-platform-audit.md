# Platform Audit — 2025

This document captures point-in-time findings, cleanup status, and inventory from platform audits.
These are not standing rules — see AGENTS.md for operating rules.

---

## Completed Cleanup (as of mid-2025)

### Stock Image Replacement
All files with `success-new/` and `students-new/` stock image paths replaced with local workforce images under `public/images/pages/`.

### Template Copy Elimination
- "Access your dashboard" broken copy fixed across 12 files
- "Join thousands who have launched" CTAs eliminated across 87+ files
- 27+ public-facing template pages rewritten with real content
- Auth pages: signin/signup redirect to real forms; forgot/reset-password have real forms
- Funding pages: how-it-works, federal-programs, state-programs, grant-programs rewritten
- Support, training, grievance, forms, orientation pages rewritten
- Admin template CTAs fixed to brand colors across 52 files

### Brand Color Migration
All `blue-*` Tailwind classes migrated to `brand-blue-*` tokens across `app/` and `components/`. Hex values are identical — this enforces naming consistency. Semantic colors (indigo, teal, purple, emerald, cyan) intentionally kept for UI state differentiation.

### Image Overlay Removal
All `bg-black/xx` overlays removed from program and credential cards. Titles moved below images.

### Auth Flow
signin/signup redirect to real forms. `?redirect=` parameter used consistently.

---

## Known Remaining Items (as of mid-2025)

These are not blocking but should be addressed:

| Item | Detail |
|---|---|
| Inline SVG cards | 8 admin page files still have Learn/Certify/Work inline SVG card sections |
| Raw Tailwind colors | ~1,233 files use raw Tailwind color classes instead of brand tokens |
| console.log statements | ~161 console.log calls should use logger utility |
| Missing error.tsx | `app/store` and `app/login` have no error boundary |
| Error message leaks | ~394 routes return `error.message` directly — should use `safeInternalError` |
| JotForm webhook security | No IP allowlist or HMAC check on JotForm webhook handler |
| SQL migrations pending | Several migrations written but not yet applied in Supabase Dashboard |

---

## Known Fixed Issues

- `/license` 500 error — `ROUTES.pricing` → `ROUTES.licensePricing`
- Cookie banner / GlobalAvatar / voice-over issues in `ClientWidgets.tsx`
- Partner card JSX nesting bug on homepage
- Drug-testing instant-tests broken string from sed
- `program-hero.mp4` was 66KB placeholder — replaced with `training-providers-hero.mp4`

---

## Key Components Created

| Component | Purpose |
|---|---|
| `components/marketing/PublicLandingPage.tsx` | Config-driven landing page template (hero, intro, features, steps, CTA). Used by 7 partner pages. |
| `data/team.ts` | Team data with `FOUNDER` and `TEAM_PREVIEW` exports |
| `netlify/functions/file-return.ts` | Tax filing endpoint (service role key) |
| `netlify/functions/refund-tracking.ts` | Public refund tracking endpoint (anon key, rate limited) |

---

## Key Pages Rewritten

| Page | Notes |
|---|---|
| `app/privacy-policy/page.tsx` | 14-section privacy policy with FERPA, WIOA, cookies table |
| `app/search/page.tsx` | Program search with cards, funding tags |
| `app/about/page.tsx` | Founder section, credentials, team preview |
| `app/funding/dol/page.tsx` | DOL Registered Apprenticeship |
| `app/funding/jri/page.tsx` | JRI = Justice Reinvestment Initiative (Indiana DWD state program) |
| `app/funding/job-ready-indy/page.tsx` | Job Ready Indy = Indianapolis workforce initiative for Marion County residents |
| `app/credentials/page.tsx` | 3-layer credential model, no overlays, correct images |
| `app/training/certifications/page.tsx` | 8 cert programs |
| `app/features/page.tsx` | 6 platform features |
| `app/directory/page.tsx` | Partner directory |
| `app/philanthropy/page.tsx` | Support/donation page |
| `app/resources/page.tsx` | Resource hub |
| `app/for/students/page.tsx` | Job seeker page — real program cards, icons, funding section |
| 7 partner pages | Using `PublicLandingPage` template |

---

## Enrollment Schema

Three enrollment tables exist. Use `program_enrollments` for all new code.

| Table | Status |
|---|---|
| `program_enrollments` | **Canonical** — use this |
| `training_enrollments` | LMS operational (attendance, cohort, docs) |
| `enrollments` | Legacy — compatibility view → `program_enrollments` |

---

## Multi-Provider Hub Tables (Phase 1–10)

| Table | Purpose |
|---|---|
| `provider_program_approvals` | External provider program approval workflow |
| `placement_records` | Employment outcome records |
| `enrollment_funding_records` | Funding source per enrollment (WIOA/WRG/JRI) |
| `data_deletion_requests` | FERPA/CCPA deletion request tracking |
| `consent_records` | Structured data sharing consent |
| `tenant_compliance_records` | Compliance status per tenant per area |
| `wioa_participants` | WIOA participant records (PIRL-aligned) |
| `wioa_participant_records` | Individual PIRL data points |

---

## Key API Routes Added

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/provider/programs/submit` | provider_admin | Submit program for review |
| `POST /api/provider/programs/[id]/review` | admin/staff | Approve or reject |
| `GET /api/provider/programs/list` | provider_admin/admin | List approvals |
| `GET/POST /api/placements` | admin/staff/case_manager | Placement records |
| `GET /api/employer/matches` | admin/employer | Employer-program matching |
| `GET /api/cron/expire-credentials` | CRON_SECRET | Expire stale credentials |
| `POST/DELETE /api/admin/impersonate` | admin/super_admin | Support impersonation |
| `POST /api/provider/export` | provider_admin | Queue CSV data export |

---

## Document Generation (Partnership Proposals)

Elevate uses Node.js + `docx` to generate `.docx` partnership proposals, emailed via SendGrid.

- Logo: `public/images/Elevate_for_Humanity_logo_81bf0fab.jpg` — render at 60×90px
- Brand colors: `DARK = '1E293B'`, `RED = 'DC2626'`, `GRAY = '6B7280'`
- Page margins: 1in top/bottom, 1.25in left/right
- Font: Arial throughout, body 22 (11pt), headings 28 (14pt)
- Output to `/tmp/` then attach to SendGrid email
- From: `noreply@elevateforhumanity.org` / Reply-to: `elevate4humanityedu@gmail.com`

### La Plaza Proposal — v4

| Field | Value |
|---|---|
| Program Length | 12 weeks (flexible) |
| Classroom Instruction | 12 weeks |
| Primary Credential | EPA Section 608 Universal |
| Additional Credentials | OSHA 10-Hour, ACT WorkKeys / NCRC |
| Cohort Size | Up to 30 participants |
| Service Area | Indianapolis / Marion County |

OJT Placements and Hands-On Training rows removed (employer agreements pending; redundant with classroom row).

---

## Tenant Architecture Reference

- `tenants.type` enum: `elevate | partner_provider | employer | workforce_agency`
- `organizations.tenant_id` FK → `tenants` (required for `type = 'training_provider'`)

RLS helpers (all `SECURITY DEFINER`, stable):

| Function | Returns |
|---|---|
| `get_my_tenant_id()` | caller's `tenant_id` from profiles |
| `is_provider_admin()` | boolean |
| `is_case_manager()` | boolean |
| `get_my_assigned_learner_ids()` | UUID[] of assigned learners |
| `get_my_role()` | role string |
| `is_admin_role()` | boolean for admin/super_admin/staff |

---

## Impersonation

Admin-only. Every session written to `admin_audit_events` (immutable).
Cannot impersonate admin-tier users. Sessions expire after 60 minutes.
UI: `/admin/impersonate`
