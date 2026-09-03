# Apply menu — page & application audit (2026-05)

Scope: every link under **Apply** in `lib/navigation.ts`, plus attached forms, APIs, and post-submit flows.

## Summary

| Area | Pages | Live form | Submit path | Notes |
|------|-------|-----------|-------------|-------|
| **Students** | `/apply`, `/apply/student`, `/apply/fssa/waitlist`, `/enrollment`, `/apply/track` | Yes | `/api/intake`, server action, `/api/waitlist`, links to apply | Two student paths: quick eligibility intake vs full student app |
| **Employers** | `/apply/employer`, `/onboarding/employer` | Yes | server `submitEmployerApplication` | Onboarding requires login |
| **Providers & hosts** | program-holder, barber/cosmo host, booth rental, create-program | Yes (except create-program) | Mixed | See gaps below |
| **Staff** | `/apply/staff`, `/onboarding/instructor` | Yes | server `submitStaffApplication` | |
| **Agencies** | `/partners/apply` | Yes | `/api/provider/apply` | Multi-step + document uploads |

## Page-by-page

### Apply hub (`/apply`)

- **UI:** Audience switcher (student / employer / provider / agency), hero, `IntakeFormInner` (funding eligibility intake).
- **Submit:** `POST /api/intake` (+ optional `POST /api/intake/upload` for documents).
- **Program prefill:** `?program=` via `normalizeProgramInterest` (hero + client form). Aliases include barber + **cdl → cdl-training**.
- **Fix applied:** Employer switcher now points to `/apply/employer` (was onboarding-only).

### Student application (`/apply/student`)

- **UI:** Marketing hero, featured programs, multi-step `StudentApplicationForm`.
- **Submit:** server action `submitStudentApplication` in `app/apply/actions.ts` (creates application + optional auth account).
- **Prefill:** `?program=` via `resolveSlug()` (registry aliases e.g. `cdl` → `cdl-training`).

### FSSA (`/apply/fssa` → `/apply/fssa/waitlist`)

- **`/apply/fssa`** permanently redirects to waitlist (direct online FSSA intake archived).
- **Nav updated** to label **FSSA / SNAP waitlist** and href `/apply/fssa/waitlist`.
- **Submit:** `POST /api/waitlist` with `programSlug: 'fssa'`.

### Enroll in a program (`/enrollment`)

- **UI:** Program cards linking into `/apply/student?program=…` (not a separate enrollment form).
- **Role:** Discovery / routing page.

### Track application (`/apply/track`)

- **UI:** Search by application ID and/or email; auto-search from `?id=&email=` in confirmation emails.
- **API:** `GET /api/applications/track`.
- **`/apply/status`:** Now redirects here (was duplicate UI + broken error string).

### Employer application (`/apply/employer`)

- **UI:** `EmployerApplicationForm`.
- **Submit:** `submitEmployerApplication` server action.

### Employer onboarding (`/onboarding/employer`)

- **UI:** Step checklist (auth required).
- **Not an application** — post-approval onboarding.

### Program holder (`/apply/program-holder`)

- **UI:** Explains role vs barber/cosmo host vs provider apply; `ProgramHolderForm`.
- **Submit:** `submitProgramHolderApplication` → confirmation route.
- **Cross-links:** Correctly points users to host-shop apply when they are a shop, not a generic program holder.

### Barber host shop (`/partners/barber-host-shop/apply`)

- **UI:** Full application: EIN / license / insurance uploads, signature canvas, MOU/consent, links to handbook/forms/sign-mou/policy steps.
- **Submit:** `POST /api/partners/barber-host-shop/apply` (+ `/api/documents/upload` for files).

### Cosmetology host shop (`/partners/cosmetology-host-shop/apply`)

- **UI:** Salon fields + acknowledgments; **no file upload fields on apply page** (document readiness captured as text).
- **Submit:** `POST /api/partners/cosmetology-host-shop/apply`.
- **Gap (product):** Barber apply collects EIN/license/insurance files; cosmetology relies on follow-up. Consider parity uploads.

### Booth rental (`/booth-rental/apply`)

- **UI:** Discipline selector + license fields.
- **Submit:** `POST /api/booth-rental/checkout` → Stripe redirect.

### Create a program (`/partners/create-program`)

- **UI:** Marketing only; CTA → `/partners/apply` and `/contact`.
- **Nav label is accurate** as “Create a program” (starts partner flow, not inline form).

### Staff (`/apply/staff`)

- **UI:** `StaffApplicationForm`.
- **Submit:** `submitStaffApplication`.

### Instructor onboarding (`/onboarding/instructor`)

- Post-hire onboarding, not listed as duplicate of staff apply.

### Agency / partner (`/partners/apply`)

- **UI:** 7-step `ProviderApplicationForm` (org, programs, compliance, documents, QuickBooks optional).
- **Submit:** `POST /api/provider/apply`; uploads via `/api/upload/document`.

## Related application URLs (not in Apply menu)

| URL | Purpose |
|-----|---------|
| `/programs/*/apply` | Program-specific enrollment (barber, HVAC, cosmo, etc.) |
| `/partners/esthetician-apprenticeship/apply` | Esthetician host-style apply |
| `/partners/nail-technician-apprenticeship/apply` | Nail host-style apply |
| `/apply/intake` | Alternate intake entry |
| `/apply/quick` | Quick apply variant |

**Recommendation:** Add esthetician + nail host apply under **Apply → Providers & hosts** if those programs are actively enrolling shops.

## Automated checks

```bash
pnpm exec tsx scripts/audit-apply-pages.mjs
pnpm exec tsx scripts/audit-nav-links.mjs
pnpm exec vitest run tests/unit/navigation-links.test.ts
```

## Fixes in this audit (branch `cursor/fix-header-mobile-desktop-c4c6`)

1. FSSA nav → waitlist URL + label  
2. Removed duplicate “Application status” nav item; `/apply/status` → `/apply/track`  
3. Apply hub employer link → `/apply/employer`  
4. `cdl` aliases in `normalize-program-interest.ts` for `/apply?program=cdl`  
