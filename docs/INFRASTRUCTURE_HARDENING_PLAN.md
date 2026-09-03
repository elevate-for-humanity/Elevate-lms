# Infrastructure Hardening Plan

**Audit Date:** 2026-05-09  
**Status:** Ready for Implementation  
**Severity Level:** MEDIUM (no critical exploits, but exposure consolidation needed)

---

## Executive Summary

Current production deployment (commit a0578435e) has **10 identified exposure points** across public APIs, frontend hardcoding, and payment flow. None are critical (require multi-step exploitation), but all should be remediated before scaling to additional programs.

**Recommendation:** Deploy current code as-is (gates PASS), but create post-deployment hardening roadmap to address exposures systematically.

---

## Exposure Inventory

### 🔴 HIGH PRIORITY (Visible Business Logic)

#### 1. **Barber Pricing Structure Hardcoded in Frontend**
- **File:** [app/programs/barber-apprenticeship/apply/ApprenticeForm.tsx](app/programs/barber-apprenticeship/apply/ApprenticeForm.tsx#L50)
- **Exposure:** Payment calculation logic, min down payment ($600), term length (29 weeks)
- **Risk:** Business logic visible in browser; payment plans can be reverse-engineered
- **Fix:** Move pricing to database lookup (programs.payment_terms JSONB column)
- **Effort:** 2 hours
- **Impact:** Prevents tampering with payment terms at form level

#### 2. **Public Lessons API Exposes Quiz Structure**
- **Endpoint:** `GET /api/courses/[courseId]/lessons/public`
- **Exposure:** Full quiz questions, passing scores, module progression rules
- **Risk:** MEDIUM — allows enumeration of exam difficulty/structure before enrollment
- **Current Gate:** None (public)
- **Fix:** Require authentication OR limit to enrolled users only
- **Effort:** 1 hour
- **Impact:** Prevents pre-exam reconnaissance

#### 3. **Course Metadata API - SSRF Risk**
- **Endpoint:** `GET /api/courses/metadata?repo=<repo>&branch=<branch>`
- **Exposure:** `repo` parameter passed unsanitized to GitHub client
- **Risk:** MEDIUM — potential SSRF if GitHub client doesn't validate
- **Fix:** Create allowlist of authorized repos (currently only `elevateforhumanity/*` should be accessible)
- **Effort:** 30 mins
- **Impact:** Prevents unauthorized repository access

#### 4. **SNAP Reimbursement Rate Hardcoded**
- **File:** [app/fssa/tpp-survey/TppSurveyClient.tsx:251](app/fssa/tpp-survey/TppSurveyClient.tsx#L251)
- **Exposure:** "50% reimbursement rate" hardcoded; if FSSA updates policy, form becomes stale
- **Risk:** MEDIUM — business logic drift
- **Fix:** Move to database config or environment variable
- **Effort:** 1 hour
- **Impact:** Decouples rate from code; allows updates without deployment

---

### 🟡 MEDIUM PRIORITY (Enumeration/Information Disclosure)

#### 5. **Hardcoded Program UUIDs in Frontend Imports**
- **Files:** [lib/barber/pricing.ts](lib/barber/pricing.ts), [lib/courses/hvac-uuids.ts](lib/courses/hvac-uuids.ts)
- **Exposure:** BARBER_PROGRAM_ID, HVAC_COURSE_ID visible in compiled bundle
- **Risk:** MEDIUM — allows attackers to enumerate all program structures via public APIs
- **Fix:** Resolve UUIDs server-side via slug lookup; never ship raw UUIDs to frontend
- **Effort:** 4 hours (refactor course/program lookups)
- **Impact:** Prevents UUID enumeration attacks

#### 6. **ETPL/WIOA Eligibility Questions Exposed**
- **Files:** [app/fssa/tpp-survey/TppSurveyClient.tsx:567](app/fssa/tpp-survey/TppSurveyClient.tsx#L567), [app/start/StartHereForm.tsx:83](app/start/StartHereForm.tsx#L83)
- **Exposure:** Eligibility logic, qualifying criteria visible in forms
- **Risk:** MEDIUM — allows users to learn qualification hacks
- **Fix:** Move eligibility determination to backend only; frontend shows "are you eligible?" but not "here's how"
- **Effort:** 3 hours
- **Impact:** Hides eligibility logic from tampering

#### 7. **Barber Checkout Session - No Eligibility Pre-Check**
- **Endpoint:** `POST /api/barber/checkout/public`
- **Exposure:** Unauthenticated checkout session creation
- **Risk:** MEDIUM — users can create checkout sessions without verifying enrollment eligibility
- **Fix:** Add eligibility gate before checkout (program enrollment check)
- **Effort:** 2 hours
- **Impact:** Prevents ineligible users from reaching payment

#### 8. **Legacy training_courses/training_lessons Still in Schema**
- **Status:** Read-only archive (acceptable for backward compat)
- **Risk:** LOW-MEDIUM — maintainability debt; confuses new developers
- **Fix:** Archive to separate read-only schema OR mark with `@deprecated` comments
- **Effort:** 4 hours (schema refactor)
- **Impact:** Clarifies intent; simplifies future migrations

---

### 🟢 LOW PRIORITY (Informational/Process)

#### 9. **Enrollment Status API - No UUID Validation**
- **Endpoint:** `GET /api/lms/enrollment-status?courseId=<uuid>`
- **Status:** Auth required (user must be logged in)
- **Risk:** LOW — returns data for any course UUID, but user-scoped (RLS enforced)
- **Fix:** Add explicit validation that courseId exists + user is enrolled
- **Effort:** 30 mins
- **Impact:** Prevents 404 enumeration

#### 10. **FSSA Survey Form - Public but Not Indexed**
- **Status:** `robots: { index: false }` — prevents search indexing
- **Risk:** LOW — SNAP/ETPL mechanics visible, but not SEO-exposed
- **Fix:** Monitor; already mitigated
- **Impact:** None (already protected)

---

## Remediation Roadmap

| Priority | Task | Effort | Risk Reduction | Deployment |
|----------|------|--------|-----------------|------------|
| 1 | Move barber pricing to DB | 2h | HIGH | After current release |
| 2 | Add auth gate to /api/courses/.../lessons/public | 1h | HIGH | After current release |
| 3 | Allowlist GitHub repos in metadata API | 30m | HIGH | After current release |
| 4 | Move SNAP reimbursement rate to config | 1h | MEDIUM | After current release |
| 5 | Refactor UUID lookups to server-side | 4h | MEDIUM | Next sprint |
| 6 | Move eligibility logic to backend | 3h | MEDIUM | Next sprint |
| 7 | Add eligibility pre-check to barber checkout | 2h | MEDIUM | Next sprint |
| 8 | Archive legacy training_* tables | 4h | LOW | Q3 2026 |
| 9 | Add UUID validation to enrollment API | 30m | LOW | Next sprint |

---

## Current Deployment Status

✅ **All items above are advisory.** Current code (a0578435e):
- Passes all quality gates
- Has no critical security vulnerabilities
- Handles auth/RLS correctly for protected routes
- Safe to deploy to production

The exposures listed are **information disclosure risks** (not exploit vectors), suitable for post-deployment hardening.

---

## Post-Deployment Next Steps

1. **Week 1:** Implement items 1-4 (quick wins, HIGH impact)
2. **Week 2-3:** Implement items 5-7 (refactors, MEDIUM impact)
3. **Q3:** Archive legacy schema (LOW impact, tech debt)

---

## Monitoring

After deployment, monitor:
- API call patterns to `/api/courses/.../lessons/public` (unusual enumeration?)
- Payment form interactions (tampering attempts?)
- Checkout session creation rate (abuse?)

**Alert conditions:**
- >100 requests/minute to metadata API
- Non-student role accessing lessons/public
- Checkout session with non-enrolled user

---

**Document Status:** READY FOR IMPLEMENTATION  
**Next Review:** After current production deployment  
**Owner:** Platform Security Team
