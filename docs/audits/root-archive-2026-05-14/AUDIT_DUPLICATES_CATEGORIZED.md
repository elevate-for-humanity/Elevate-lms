# Full App Duplicate Audit — Categorized

## 1. MUST CONSOLIDATE (Redundant/Conflicting)

### A. Apply System Chaos (60+ pages to 1)
**Problem:** Same functionality at different URLs = maintenance nightmare + user confusion

| Current Path | Should Route To | Status |
|---|---|---|
| `/app/apply/quick` | `/apply` | Quick form → canonical |
| `/app/apply/full` | `/apply` | Full form → canonical |
| `/app/apply/student` | `/apply?type=student` | Query param |
| `/app/apply/employer` | `/apply?employer=true` | Query param |
| `/app/apply/staff` | `/apply?staff=true` | Query param |
| `/app/apply/fssa` | `/apply?program=fssa` | Query param |
| `/app/apply/impact` | `/apply?program=impact` | Query param |
| `/app/apply/program-holder` | `/apply?program-holder=true` | Query param |
| `/app/fssa/apply` | `/apply?program=fssa` | Redirect |
| `/app/tax/apply` | `/apply?program=tax-prep` | Redirect |
| `/app/booth-rental/apply` | `/apply?program=booth-rental` | Redirect |
| `/app/help/tutorials/how-to-apply` | `/help/apply-tutorial` | Training content (keep) |
| `/app/lms/(app)/apply` | `/apply` | Authenticated → canonical |
| `/app/partners/apply` | `/partners/register` | Different domain (keep) |
| `/app/programs/*/apply` | **Keep** | Program-specific entry points (legitimate) |
| `/app/apply/confirmation` | `/apply/success` | Consolidate |
| `/app/apply/status` | `/lms/apply/status` | Authenticated tracking (keep separate) |

**Action Items:**
- [ ] Create canonical `/app/apply/page.tsx` (absorbs quick/full/student/employer/staff)
- [ ] Redirect all `/app/apply/*` variants → `/apply?...` with query params
- [ ] Keep `/app/programs/*/apply` (legitimate program-specific flows)
- [ ] Keep `/app/lms/(app)/apply` (authenticated learner dashboard)

---

### B. API Apply Endpoints (11 down to 1)
**Problem:** Different endpoints doing same thing = clients confused + hard to audit

| Endpoint | Maps To | Notes |
|---|---|---|
| `/api/applications` | **CANONICAL** | ✅ Just unified here |
| `/api/apply` | `/api/applications` | Legacy stub |
| `/api/apply/student` | `/api/applications` | Legacy stub |
| `/api/enroll/apply` | `/api/applications` OR `/api/enrollments/create` | Check—might be different |
| `/api/intake/apply` | `/api/applications` | Multi-stage intake (archive) |
| `/api/partners/barbershop-apprenticeship/apply` | Keep (`/api/partners/*`) | Provider-specific |
| `/api/programs/barber-apprenticeship/apply` | Keep (special OJT system) | Barber-specific (payment + OJT) |
| `/api/provider/apply` | `/api/provider/register` | Provider registration (different) |
| `/api/schools/mesmerized-by-beauty/apply` | Archive or keep? | Check if dead code |
| `/api/shop/apply` | Archive or partner? | Unclear—needs review |
| `/api/suboffice/apply` | Archive or keep? | Check if dead code |

**Action Items:**
- [ ] Archive `/api/apply` → return 410 → migrate to `/api/applications`
- [ ] Archive `/api/apply/student` → return 410
- [ ] Archive `/api/enroll/apply` OR clarify purpose
- [ ] Archive `/api/intake/apply` → return 410
- [ ] Verify `/api/schools/*`, `/api/shop/*`, `/api/suboffice/*` are legitimate or dead

---

### C. Intake Funnel (8 endpoints to archive)
**Problem:** 3-stage lead workflow still live but NOT used by public apply

| Endpoint | Purpose | Action |
|---|---|---|
| `/api/intake/route.ts` | Lead creation | Archive? (Admin only?) |
| `/api/intake/leads` | Lead listing | Archive |
| `/api/intake/interest` | Stage 1: Interest | Archive |
| `/api/intake/eligibility` | Stage 2: Eligibility | Archive |
| `/api/intake/application` | Stage 3: Application | ✅ Already archived |
| `/api/intake/status` | Status check | Archive |
| `/api/intake/workflow` | Workflow automation | Archive |
| `/api/intakes` | Listing | Archive? |

**Action Items:**
- [ ] Confirm none of these are used by admin UI
- [ ] Return 410 Gone on all with migration path
- [ ] If admin still needs lead workflow, move to `/api/admin/leads/*`

---

## 2. SHOULD CONSOLIDATE (High Maintenance)

### A. Duplicate Components (40+ instances)

| Component | Count | Action |
|---|---|---|
| `NotificationBell.tsx` | ×5 | Audit—keep best, redirect others |
| `VideoPlayer.tsx` | ×3 | Consolidate to `/components/ui/VideoPlayer.tsx` |
| `VideoHeroBanner.tsx` | ×3 | Consolidate |
| `ProgramPageLayout.tsx` | ×3 | ✅ Already consolidated |
| `ProgramPageTemplate.tsx` | ×3 | Delete duplicates |
| `ProgramCard.tsx` | ×3 | ✅ Already using canonical |
| `HeroSection.tsx` | ×3 | Consolidate |
| `CTASection.tsx` | ×3 | Consolidate |
| `Breadcrumbs.tsx` | ×3 | ✅ Already canonical in `/components/ui/` |
| `LoadingSpinner.tsx` | ×3 | Consolidate |
| `PerformanceMonitor.tsx` | ×3 | Keep for now (different use cases?) |
| `ScrollReveal.tsx` | ×2 | ✅ Already canonical in `/components/ui/` |
| `site-header.tsx` | ×2 | Consolidate layout variants |
| `site-footer.tsx` | ×2 | Consolidate layout variants |

**Action Items:**
- [ ] Audit each duplicate: keep canonical, reexport from others
- [ ] Update imports across codebase to use canonical paths
- [ ] Delete redundant files after migration

---

### B. Enrollment Variants (3 endpoints, intentional or not?)

| Endpoint | Purpose | Keep/Merge |
|---|---|---|
| `/api/enrollments/create` | Standard student enrollment | Keep (canonical) |
| `/api/enrollments/create-enforced` | Staff-driven override | Keep (intentional) |
| `/api/enrollments/apprentice` | OJT-specific | Keep (intentional) |
| `/api/enroll/auto` | Automatic enrollment | Probably same as `create`? |
| `/api/enroll/complete` | Enrollment completion | Check—might be duplicate |
| `/api/enroll/checkout` | Payment flow | Keep |

**Action Items:**
- [ ] Verify each has distinct business logic
- [ ] Archive if truly redundant
- [ ] Document decision on each

---

## 3. PRESERVE (Intentionally Separate)

### A. Admin-Only Systems (Keep Separate)
| System | Reason |
|---|---|
| `/apps/admin/app/api/admin/applications/*` | Staff operations (approvals, bulk actions, follow-ups) |
| `/apps/admin/app/api/admin/intakes/*` | Multi-stage lead workflow for staff intake calls |
| `/apps/admin/app/api/admin/barber-shop-applications/*` | Barber mentor/shop application flow |
| `/api/admin/barber-shop-applications/status` | Separate Barber application tracking |

**No action needed**—these are intentionally privileged.

---

### B. Provider/Partner Systems (Keep Separate)
| System | Reason |
|---|---|
| `/app/partners/apply` | Provider registration (not student application) |
| `/api/partner/applications/*` | Provider app review (staff, not public) |
| `/api/provider/apply` | Provider registration form |
| `/app/partners/*/apply` | Partner cohort entry points |

**No action needed**—these are partner onboarding, not student apply.

---

### C. Payment-Specific Systems (Keep Separate)
| System | Reason |
|---|---|
| `/api/barber/checkout/*` | Barber-specific payment (OJT + installments) |
| `/api/affirm/checkout` | Third-party BNPL provider |
| `/api/sezzle/checkout` | Third-party BNPL provider |
| `/api/stripe/webhook` | Payment processor webhook |
| `/api/payments/create-session` | General payment session |

**No action needed**—payment systems by provider.

---

### D. Separate Products (Keep Separate)
| System | Reason |
|---|---|
| `/api/tax-intake` | tax services workflow |
| `/app/tax/*` | Tax prep application flow |
| `/api/tax-filing/applications` | Tax filing, not training |

**No action needed**—different business line.

---

## 4. LEGACY / DEAD CODE (Archive)

| Path | Status | Action |
|---|---|---|
| `/api/schools/mesmerized-by-beauty/apply` | Unclear | Archive if no active use |
| `/api/shop/apply` | Unclear | Archive if no active use |
| `/api/suboffice/apply` | Unclear | Archive if no active use |
| `/api/cash-advances/applications` | Might be legacy | Archive if no active use |
| `/api/ocr/extract` | Unclear | Archive if no active use |
| `/api/onboarding/complete` | Unclear | Archive if no active use |

**Action Items:**
- [ ] Search for client-side calls to these endpoints
- [ ] If no references found → archive with 410
- [ ] If found → document keep reasons

---

## Summary

| Category | Count | Action |
|---|---|---|
| Must Consolidate | 60+ pages, 11 endpoints | High priority |
| Should Consolidate | 40+ component duplicates | Medium priority |
| Preserve Intentional | Admin, Partners, Payments, Products | No action |
| Legacy/Unclear | 6+ endpoints | Review & archive |

**Recommended Next Steps:**

1. **Week 1:** Consolidate apply pages to canonical `/apply` with query params
2. **Week 2:** Archive redundant apply API endpoints
3. **Week 3:** Consolidate duplicate components
4. **Week 4:** Archive unclear legacy endpoints after verification
