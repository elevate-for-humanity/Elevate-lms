# LMS, Course Generator, Barber Program & Dashboard Audit

**Date:** 2026-06  
**Scope:** LMS course engine · Blueprint/course generator · Barber Apprenticeship page · Student/Learner dashboard · Admin dashboard  
**Severity:** P0 = breaks production revenue · P1 = security/data risk · P2 = functional bug · P3 = structural debt · P4 = UX/content issue

---

## PART 1 — BARBER APPRENTICESHIP PAGE

### P0-1 — $600 deposit link is broken (API enforces $1,743 minimum)

**File:** `app/api/barber/checkout/public/route.ts` line 120  
**File:** `app/programs/barber-apprenticeship/apply/ApprenticeForm.tsx` lines 14–19

The UI advertises a **$600 minimum down payment** and the `PRICING` constant in `ApprenticeForm.tsx` sets `minDownPayment: 600`. However the API route calculates:

```ts
const minSetupFee = Math.round(adjustedFullPrice * 0.35); // = $1,743
```

When a user selects the default "weekly" payment option (no `custom_setup_fee` sent), the API defaults to 35% = **$1,743**, not $600. When a user sends `custom_setup_fee: 600`, the API clamps it: `Math.max(minSetupFee, ...)` = **$1,743 wins**.

**Result:** Every payment plan checkout silently charges $1,743 instead of the advertised $600. The Stripe session is created for the wrong amount. This is a P0 revenue/trust issue.

**Fix required:**
- Change `minSetupFee` in the API to `BARBER_PRICING.minDownPayment` ($600), not 35%.
- Remove the `Math.max(minSetupFee, ...)` clamp that overrides the user's chosen amount.
- The `setupFeeRate: 0.35` and `setupFeeRate: 0.12` constants in two different files are contradictory — consolidate to `lib/programs/pricing.ts` as the single source.

---

### P4-1 — Indiana Career Connect block must be removed

**File:** `app/programs/barber-apprenticeship/BarberApprenticeshipClient.tsx` lines 201–214

There is a prominent blue box titled "Indiana Career Connect" with a button linking to `https://www.indianacareerconnect.com`. Per the owner's instruction:

- This program is **self-payment** (Stripe / BNPL), not WIOA/workforce-funded.
- Indiana Career Connect is a WorkOne/WIOA intake portal — it does not apply to self-pay apprentices.
- The block creates confusion and may cause applicants to abandon the self-pay flow.

**Fix required:** Remove the entire Indiana Career Connect section from `BarberApprenticeshipClient.tsx`.

---

### P4-2 — Funding copy implies government funding is available

**File:** `app/programs/barber-apprenticeship/sections/BarberEnrollment.tsx` lines ~60–75

The "Funding Sources" subsection lists WIOA and JRI as options alongside self-pay. Per the owner's instruction, this program is **self-payment only**. The WIOA/JRI copy should be removed or replaced with a note that funding eligibility is assessed separately.

**Fix required:** Remove the WIOA and JRI funding paragraphs from `BarberEnrollment.tsx`. Keep only the self-pay / BNPL / payment plan options.

---

### P2-1 — BNPL config shows 5 providers; only Affirm and Sezzle are wired

**File:** `lib/bnpl-config.ts`  
**File:** `app/programs/barber-apprenticeship/apply/ApprenticeForm.tsx`

`ACTIVE_BNPL_PROVIDERS` returns 5 providers (Affirm, Sezzle, Klarna, Afterpay, Zip). The apply form only has working checkout flows for **Affirm** and **Sezzle**. Klarna, Afterpay, and Zip are shown in the payment methods badge strip but have no dedicated checkout path — they fall through to the Stripe PMC (which may or may not have them enabled).

**Fix required:** Either wire Klarna/Afterpay/Zip as explicit options, or set `enabled: false` in `bnpl-config.ts` for providers without a dedicated checkout path. Do not advertise providers that aren't fully functional.

---

### P3-1 — Duplicate PRICING constant (ApprenticeForm vs lib/programs/pricing.ts)

`ApprenticeForm.tsx` defines its own local `PRICING` object (lines 13–22) with `setupFeeRate: 0.12` while `lib/programs/pricing.ts` has `setupFeeRate: 0.35`. These are contradictory. The form should import `BARBER_PRICING` from `lib/programs/pricing.ts` directly.

---

## PART 2 — LMS COURSE ENGINE

### P2-2 — Lesson page is `'use client'` with 1,520 lines and `@ts-nocheck` on LMS dashboard

**File:** `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` — 1,520 lines, client component  
**File:** `app/lms/(app)/dashboard/page.tsx` — line 1: `// @ts-nocheck`

The lesson page is a single 1,520-line client component. All data fetching happens client-side via `useEffect` + `fetch`. This means:
- No SSR — blank flash on every lesson load
- No streaming — full JS bundle must load before any content renders
- Auth is checked client-side (race condition window before redirect fires)

The LMS dashboard has `@ts-nocheck` suppressing all TypeScript errors — type safety is completely disabled.

**Fix required (P3):** Split lesson page into server component (data fetch) + client component (interactivity). Remove `@ts-nocheck` from LMS dashboard and fix underlying type errors.

---

### P2-3 — Checkpoint gating: `checkpointBlocked` only checks `lesson_source === 'canonical'`

**File:** `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` line 404

```ts
if (lessonData && lessonsData && lessonData.lesson_source === 'canonical' && lessonData.module_order > 1) {
```

Checkpoint gating is skipped entirely for non-canonical lessons (legacy HVAC path). HVAC learners can bypass module checkpoints.

---

### P3-2 — HVAC legacy path still runs in parallel on every lesson load

The lesson page imports and runs both the DB-driven path and the HVAC legacy path (32 `lib/courses/hvac-*.ts` files) on every render. The HVAC course was migrated to `curriculum_lessons` in 2025-Q2. The legacy path should be behind a feature flag or removed.

---

### P3-3 — `lms_lessons` view: `quiz_questions` and `passing_score` depend on migration `20260401000005`

Per AGENTS.md, migration `20260401000005_curriculum_lessons_quiz_questions.sql` must be applied manually. If it hasn't been applied, all quiz/checkpoint lessons will have `null` quiz_questions and fall back to the HVAC local quiz bank — wrong for non-HVAC programs.

**Action required:** Verify in Supabase Dashboard that `curriculum_lessons.quiz_questions` column exists and `lms_lessons` view exposes it.

---

### P4-3 — Course landing page auth uses `?redirect=` but lesson page uses inline redirect

**File:** `app/lms/(app)/courses/[courseId]/page.tsx` line 63  
```ts
redirect('/login?redirect=/lms/courses/' + courseId);
```
This is correct. But the lesson page does auth client-side with no redirect param — unauthenticated users land on `/login` with no return path.

---

## PART 3 — COURSE GENERATOR (BLUEPRINT SYSTEM)

### P2-4 — No barber-apprenticeship blueprint registered

**File:** `lib/curriculum/blueprints/index.ts`

The registry contains: `prs-indiana`, `hvac-epa608-v1`, `bookkeeping-quickbooks-v1`. There is **no blueprint for barber-apprenticeship**. This means:
- The barber program cannot use the canonical DB-driven course engine
- No `course_lessons` rows exist for barber (no seeder has been run)
- Barber learners have no LMS course to navigate to after enrollment

**Fix required:** Create `lib/curriculum/blueprints/barber-apprenticeship.ts` and register it. Run the seeder against the barber program ID.

---

### P2-5 — `getBlueprintForProgram` only resolves PRS and credential_slug — all other programs return null

**File:** `lib/curriculum/builders/getBlueprintForProgram.ts`

The function only handles PRS slug aliases and `credential_slug` lookups. Programs like `bookkeeping` that have a blueprint registered by `programSlug` will return `null` unless their DB row has `credential_slug` populated. This is a silent failure — the builder throws, but the error may not surface to the admin.

---

### P3-4 — `buildCourseFromBlueprint.ts` and `buildCanonicalCourseFromBlueprint.ts` both exist

**File:** `lib/curriculum/builders/`

Two builder files exist. `buildCanonicalCourseFromBlueprint.ts` is the canonical one (writes to `courses → course_modules → course_lessons`). `buildCourseFromBlueprint.ts` is the older version. It's unclear if the older one is still imported anywhere. Dead code risk.

```bash
grep -rn "buildCourseFromBlueprint" app/ lib/ --include="*.ts" --include="*.tsx"
```

---

### P4-4 — Blueprint auditor (`auditor.ts`) is not called by the seeder script

**File:** `scripts/seed-course-from-blueprint.ts`

The seeder calls `buildCanonicalCourseFromBlueprint` but does not call `auditAgainstBlueprint` after seeding. Blueprint violations (missing modules, wrong lesson counts) are only caught if the caller explicitly audits. Add a post-seed audit step.

---

## PART 4 — "JVA" PROGRAM

**Finding:** No program, page, blueprint, data file, or route with the slug, name, or abbreviation "JVA" or "Java" exists anywhere in the codebase. This term does not match any known program.

**Likely interpretation:** "JVA" may be a spoken/typed shorthand for **JRI** (Job Ready Indy) — the justice-involved workforce funding program referenced throughout the barber and PRS program pages. Alternatively it may refer to a planned program not yet built.

**Action required:** Clarify with the owner what "JVA" refers to. If it is JRI, no code action is needed. If it is a new program, a blueprint and program page must be created.

---

## PART 5 — STUDENT / LEARNER DASHBOARD

### P2-6 — Two separate learner dashboards exist with overlapping data fetches

**Files:**
- `app/learner/dashboard/page.tsx` — 843 lines, server component, fetches from 3 enrollment tables
- `app/lms/(app)/dashboard/page.tsx` — 502 lines, `@ts-nocheck`, fetches from 2 enrollment tables

Both are accessible to students. They show different data and have different UI. There is no canonical learner dashboard — students may land on either depending on the entry point. The `/learner` path redirects to `/learner/dashboard`; the LMS sidebar links to `/lms/dashboard`.

**Fix required:** Designate one as canonical (per AGENTS.md, `/learner/dashboard` is canonical). Add a redirect from `/lms/dashboard` → `/learner/dashboard`, or merge the two.

---

### P2-7 — Learner dashboard merges 3 enrollment tables with dedup by `course_id`

**File:** `app/learner/dashboard/page.tsx` lines 41–100

The dashboard fetches `program_enrollments`, `training_enrollments`, and `external_program_enrollments` and merges them. The dedup key is `course_id || id`. If a student has both a `program_enrollment` and a `training_enrollment` for the same course, one is silently dropped. The merge logic does not account for status differences (one may be `active`, the other `completed`).

---

### P2-8 — WorkOne checklist shown based on `applications.status = 'pending_workone'`

**File:** `app/learner/dashboard/page.tsx` lines 231–241

The WorkOne checklist is gated on `applications.status = 'pending_workone'`. This is correct for WIOA-funded students. However, the barber program is self-pay — if a barber applicant's application row ever gets set to `pending_workone` by mistake, they will see the WorkOne checklist on their dashboard. No guard exists to check `program_slug` before showing it.

---

### P3-5 — Stripe session auto-repair runs on every dashboard load

**File:** `app/learner/dashboard/page.tsx` lines 195–228

On every dashboard render, the server queries `stripe_sessions_staging` and calls a DB function `p_source: 'stripe_repair'` if a paid session exists but no active enrollment. This is a repair mechanism running as a side effect of a page load — it should be a webhook handler or a background job, not inline page logic.

---

### P4-5 — Dashboard links to `/lms/courses/[courseId]` (not `/lms/programs`)

**File:** `app/learner/dashboard/page.tsx` line 432

```tsx
href={`/lms/courses/${enrollment.course_id}`}
```

Per AGENTS.md tracked debt: "Programs" vs "Courses" terminology split. The dashboard uses "courses" in URLs while the public LMS uses "programs". This is known debt but affects learner navigation.

---

## PART 6 — ADMIN DASHBOARD

### P2-9 — Admin dashboard has no BNPL payment breakdown

**File:** `app/admin/dashboard/page.tsx` and `DashboardClient.tsx`

Revenue is pulled from `payments.amount_cents` as a single aggregate total. There is no breakdown by payment provider (Stripe, Sezzle, Affirm). Admin cannot see:
- How many barber enrollments used Sezzle vs Affirm vs Stripe card
- BNPL approval rates
- Failed/abandoned BNPL sessions

**Fix required:** Add a payment provider breakdown to the admin dashboard, querying `payments.provider` or `payments.metadata`.

---

### P2-10 — Admin test-payments page only checks Stripe; Sezzle and Affirm have no health check

**File:** `app/admin/test-payments/page.tsx`

The test-payments page checks Stripe configuration status only. Sezzle and Affirm have their own API keys (`SEZZLE_PUBLIC_KEY`, `SEZZLE_PRIVATE_KEY`, `AFFIRM_PUBLIC_KEY`, `AFFIRM_PRIVATE_KEY`) that are not verified anywhere in the admin UI. If these keys expire or are misconfigured, BNPL checkout silently returns a 503 with no admin alert.

**Fix required:** Add Sezzle and Affirm configuration status checks to `/admin/test-payments`.

---

### P3-6 — Admin integrations page lists Stripe but not Sezzle or Affirm

**File:** `app/admin/integrations/page.tsx`

The integrations page shows Stripe as an integration but does not list Sezzle or Affirm. These are active payment providers with their own API keys and webhook endpoints. They should appear in the integrations list with status indicators.

---

### P3-7 — Admin revenue page shows hardcoded placeholder data

**File:** `app/admin/grants/revenue/page.tsx`

```tsx
<p className="text-3xl font-bold text-brand-green-600 mt-2">$2.4M</p>
<p className="text-3xl font-bold text-brand-blue-600 mt-2">$1.8M</p>
```

These are hardcoded placeholder values, not live DB data. The page has no real data fetching.

---

### P4-6 — Admin dashboard revenue links to `/admin/payroll` (wrong destination)

**File:** `app/admin/dashboard/DashboardClient.tsx` line 158

```ts
{ label: 'Revenue Collected', ..., href: '/admin/payroll' }
```

Clicking "Revenue Collected" goes to `/admin/payroll` (employee payroll), not a payments/revenue page. Should link to `/admin/test-payments` or a dedicated revenue page.

---

## SUMMARY TABLE

| ID | Severity | Area | Issue | File |
|----|----------|------|-------|------|
| P0-1 | **P0** | Barber / Payments | $600 deposit overridden to $1,743 by API | `app/api/barber/checkout/public/route.ts:120` |
| P2-1 | P2 | Barber / BNPL | 5 BNPL providers shown, only 2 wired | `lib/bnpl-config.ts` |
| P2-2 | P2 | LMS Engine | Lesson page 1,520-line client component; LMS dashboard `@ts-nocheck` | `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` |
| P2-3 | P2 | LMS Engine | Checkpoint gating skipped for non-canonical lessons | lesson page line 404 |
| P2-4 | P2 | Course Generator | No barber blueprint registered — no LMS course for barber | `lib/curriculum/blueprints/index.ts` |
| P2-5 | P2 | Course Generator | `getBlueprintForProgram` returns null for most programs | `lib/curriculum/builders/getBlueprintForProgram.ts` |
| P2-6 | P2 | Student Dashboard | Two separate learner dashboards, no canonical | `app/learner/dashboard/` vs `app/lms/(app)/dashboard/` |
| P2-7 | P2 | Student Dashboard | 3-table enrollment merge with silent dedup | `app/learner/dashboard/page.tsx:88` |
| P2-8 | P2 | Student Dashboard | WorkOne checklist not guarded by program slug | `app/learner/dashboard/page.tsx:231` |
| P2-9 | P2 | Admin Dashboard | No BNPL payment provider breakdown | `app/admin/dashboard/page.tsx` |
| P2-10 | P2 | Admin Dashboard | Sezzle/Affirm have no health check in admin | `app/admin/test-payments/page.tsx` |
| P3-1 | P3 | Barber / Payments | Duplicate PRICING constant with contradictory `setupFeeRate` | `ApprenticeForm.tsx` vs `lib/programs/pricing.ts` |
| P3-2 | P3 | LMS Engine | HVAC legacy path runs in parallel on every lesson load | lesson page imports |
| P3-3 | P3 | LMS Engine | `lms_lessons` view depends on unapplied migration | migration `20260401000005` |
| P3-4 | P3 | Course Generator | Two builder files; old one may still be imported | `lib/curriculum/builders/` |
| P3-5 | P3 | Student Dashboard | Stripe repair runs as page-load side effect | `app/learner/dashboard/page.tsx:195` |
| P3-6 | P3 | Admin Dashboard | Sezzle/Affirm missing from integrations page | `app/admin/integrations/page.tsx` |
| P3-7 | P3 | Admin Dashboard | Revenue page shows hardcoded placeholder data | `app/admin/grants/revenue/page.tsx` |
| P4-1 | P4 | Barber Page | Indiana Career Connect block must be removed (self-pay program) | `BarberApprenticeshipClient.tsx:201` |
| P4-2 | P4 | Barber Page | WIOA/JRI funding copy must be removed (self-pay only) | `BarberEnrollment.tsx:~60` |
| P4-3 | P4 | LMS Engine | Lesson page auth redirect loses return path | lesson page |
| P4-4 | P4 | Course Generator | Blueprint auditor not called after seeding | `scripts/seed-course-from-blueprint.ts` |
| P4-5 | P4 | Student Dashboard | Dashboard links use `/lms/courses/` not `/lms/programs/` | `app/learner/dashboard/page.tsx:432` |
| P4-6 | P4 | Admin Dashboard | Revenue card links to `/admin/payroll` instead of payments | `DashboardClient.tsx:158` |
| N/A | INFO | JVA Program | No "JVA" program exists in codebase — likely means JRI | — |

---

## IMMEDIATE ACTION ITEMS (P0 + P4 content fixes)

### 1. Fix the $600 deposit (P0-1)
In `app/api/barber/checkout/public/route.ts`, change line 120:
```ts
// BEFORE (broken — charges $1,743 minimum)
const minSetupFee = Math.round(adjustedFullPrice * 0.35);

// AFTER (correct — $600 minimum as advertised)
const minSetupFee = BARBER_PRICING.minDownPayment; // $600
```
And change line 140–141:
```ts
// BEFORE
const setupFee = custom_setup_fee 
  ? Math.max(minSetupFee, Math.min(custom_setup_fee, adjustedFullPrice))
  : Math.round(adjustedFullPrice * 0.35);

// AFTER
const setupFee = custom_setup_fee
  ? Math.max(minSetupFee, Math.min(custom_setup_fee, adjustedFullPrice))
  : minSetupFee;
```

### 2. Remove Indiana Career Connect (P4-1)
Remove lines 201–214 from `BarberApprenticeshipClient.tsx` (the blue box with the Indiana Career Connect button).

### 3. Remove WIOA/JRI funding copy (P4-2)
Remove the WIOA and JRI paragraphs from the "Funding Sources" section in `BarberEnrollment.tsx`. Replace with a single sentence: "This program is self-pay. Payment plans and BNPL financing available."
