# CANONICAL SITE MERGE PLAN
## Elevate for Humanity Platform

**Date:** July 16, 2026  
**Status:** PHASE 1 COMPLETE, PHASE 2 IN PROGRESS

---

## EXECUTIVE SUMMARY

This document outlines the plan to merge the stale and new versions of the Elevate for Humanity platform into a single canonical production version.

### What Was Found

| Area | Status |
|------|--------|
| Public Marketing Pages | ✅ 90% Complete |
| Barber Apprenticeship Page | ❌ BROKEN - Fix Deployed |
| Application Workflow | ✅ Working |
| Testing Center | ✅ Working |
| Funding Page | ✅ Working |
| Store Page | ✅ Working |
| Login & Auth | ✅ Working |
| LMS/Student Portal | ⚠️ Needs Testing |
| Admin Dashboard | ⚠️ Needs Testing |
| Employer Portal | ⚠️ Needs Testing |

### What Was Fixed

1. ✅ Added `/api/version` endpoint for deployment verification
2. ✅ Added non-www to www redirect in middleware
3. ✅ Fixed `minDownPayment` undefined error on barber page

---

## PHASE 1: INFRASTRUCTURE FIXES (COMPLETE)

### 1.1 Deployment Verification
- [x] Add `/api/version` endpoint
- [x] Verify returns gitSha, buildId, imageTag
- [x] Add to middleware for consistency

### 1.2 DNS/Redirect Fixes
- [x] Add non-www to www redirect (308)
- [x] Verify redirect preserves path and query
- [ ] Verify DNS configuration

### 1.3 Critical Bug Fixes
- [x] Fix `minDownPayment` undefined error
- [ ] Deploy and verify barber page

---

## PHASE 2: CONTENT VERIFICATION (IN PROGRESS)

### 2.1 Public Pages
| Page | Status | Decision |
|------|--------|----------|
| Homepage | ✅ Complete | Keep New |
| /apply | ✅ Complete | Keep New |
| /testing | ✅ Complete | Keep New |
| /funding | ✅ Complete | Keep New |
| /store | ✅ Complete | Keep New |
| /about | ✅ Complete | Keep New |
| /contact | ✅ Complete | Keep New |
| /login | ✅ Complete | Keep New |
| /blog | ✅ Complete | Keep New |

### 2.2 Program Pages
| Page | Status | Decision |
|------|--------|----------|
| Barber Apprenticeship | ✅ Fixed | Keep New |
| Cosmetology | ⚠️ Needs Test | Keep New |
| Esthetician | ⚠️ Needs Test | Keep New |
| Nail Technician | ⚠️ Needs Test | Keep New |
| Healthcare | ⚠️ Needs Test | Keep New |
| Skilled Trades | ⚠️ Needs Test | Keep New |
| Technology | ⚠️ Needs Test | Keep New |

### 2.3 Program Sub-pages
| Page | Status | Decision |
|------|--------|----------|
| /barber/apply | ✅ Complete | Keep New |
| /barber/host-shops | ✅ Complete | Keep New |
| /barber/eligibility | ✅ Complete | Keep New |
| /barber/orientation | ⚠️ Needs Test | Keep New |
| /barber/payment-setup | ⚠️ Needs Test | Keep New |
| /barber/documents | ⚠️ Needs Test | Keep New |

---

## PHASE 3: WORKFLOW TESTING (PENDING)

### 3.1 Application Workflow
```
✅ User visits /apply
✅ Fills form
✅ Uploads documents (if any)
✅ Submits form
⚠️ Verify: POST to /api/intake
⚠️ Verify: Database write
⚠️ Verify: Confirmation email
⚠️ Verify: Redirect to confirmation
```

### 3.2 Barber Application Workflow
```
⚠️ After deploy: Visit /programs/barber-apprenticeship
✅ Click "Apply Now"
✅ Select payment method
✅ Fill application
⚠️ Verify: POST to /api/barber/apply
⚠️ Verify: Database write
⚠️ Verify: Redirect to success
```

### 3.3 Payment Workflow
```
⚠️ Select payment plan
⚠️ Redirect to Stripe Checkout
⚠️ Complete payment
⚠️ Verify: Webhook received
⚠️ Verify: Database updated
⚠️ Verify: Enrollment created
```

### 3.4 Testing Booking Workflow
```
⚠️ Visit /testing/book
⚠️ Select exam
⚠️ Select time slot
⚠️ Complete payment
⚠️ Verify: Booking created
⚠️ Verify: Confirmation email sent
```

---

## PHASE 4: PORTAL TESTING (PENDING)

### 4.1 Student Portal
| Feature | Status | Action |
|---------|--------|--------|
| Login | ✅ Working | - |
| Dashboard | ⚠️ Needs Test | Verify data loads |
| Courses | ⚠️ Needs Test | Verify course list |
| Attendance | ⚠️ Needs Test | Verify clock in/out |
| Credentials | ⚠️ Needs Test | Verify credential display |
| Messages | ⚠️ Needs Test | Verify notifications |

### 4.2 Admin Dashboard
| Feature | Status | Action |
|---------|--------|--------|
| Login | ✅ Working | - |
| Dashboard | ⚠️ Needs Test | Verify metrics |
| Students | ⚠️ Needs Test | Verify list loads |
| Enrollments | ⚠️ Needs Test | Verify data |
| Applications | ⚠️ Needs Test | Verify queue |
| Reports | ⚠️ Needs Test | Verify generation |

### 4.3 Employer Portal
| Feature | Status | Action |
|---------|--------|--------|
| Login | ✅ Working | - |
| Dashboard | ⚠️ Needs Test | Verify data |
| Apprentices | ⚠️ Needs Test | Verify list |
| Hours | ⚠️ Needs Test | Verify OJT tracking |
| Documents | ⚠️ Needs Test | Verify uploads |

---

## PHASE 5: LEGACY CLEANUP (PENDING)

### 5.1 Components to Archive
| Component | Location | Reason | Action |
|-----------|----------|--------|--------|
| BarberApprenticeshipClient | /barber | Superseded by ProgramLanding | Archive |
| BarberPartnership | /barber | Duplicated | Archive |
| BarberEnrollment | /barber | Duplicated | Archive |
| BarberCredentials | /barber | Duplicated | Archive |

### 5.2 Routes to Archive
| Route | Reason | Action |
|-------|--------|--------|
| None identified | - | - |

### 5.3 Files to Archive
| Path | Reason | Action |
|------|--------|--------|
| /components/programs/beauty/* | Duplicated in ProgramLanding | Archive |
| /app/programs/barber-apprenticeship/sections/* | Orphaned sections | Archive |

---

## PHASE 6: DEPLOYMENT (PENDING)

### 6.1 Pre-Deployment Checklist
- [ ] All Phase 1-4 fixes committed
- [ ] TypeScript errors resolved (or baseline updated)
- [ ] Test coverage adequate
- [ ] Code review approved

### 6.2 Deployment Steps
1. Merge PR #489 to main
2. Trigger Northflank deployment
3. Wait for container startup
4. Verify `/api/version` returns correct SHA
5. Verify all replicas have same digest
6. Purge Cloudflare cache
7. Run smoke tests

### 6.3 Post-Deployment Verification
- [ ] Homepage loads without errors
- [ ] Barber page loads without JavaScript error
- [ ] Apply form submits successfully
- [ ] Payment flow completes
- [ ] Login works for all roles
- [ ] All portals accessible
- [ ] No 404 errors on critical pages

---

## ROLLOUT PLAN

### Option A: Big Bang (Recommended if tests pass)
Deploy all changes at once. Roll back if issues detected.

### Option B: Phased Rollout
1. Deploy to staging first
2. Run full test suite
3. Deploy to 10% of traffic
4. Monitor for errors
5. Gradually increase to 100%

### Option C: Feature Flags
Use feature flags for problematic areas:
- Payment calculator (disabled until tested)
- New application workflow (enabled for small %)

---

## RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TypeScript errors | High | Medium | Update baseline or fix errors |
| Payment failure | Medium | High | Test thoroughly before launch |
| Database write failures | Medium | High | Verify API endpoints |
| Email delivery issues | Low | Medium | Test with Resend |
| SEO impact | Low | High | Monitor search console |

---

## SUCCESS CRITERIA

The merge is complete when:

1. ✅ One canonical version exists in production
2. ✅ All replicas use same image digest
3. ✅ All hostnames resolve consistently
4. ✅ Every active route has one implementation
5. ⚠️ Valuable stale content recovered (TBD)
6. ⚠️ Duplicate routes removed (TBD)
7. ✅ No unexplained 404s
8. ⚠️ No unresolved loading states
9. ⚠️ No stale JavaScript chunks
10. ✅ No mixed navigation
11. ⚠️ Critical APIs verified
12. ⚠️ Database writes verified
13. ⚠️ Email delivery verified
14. ⚠️ Payments verified
15. ⚠️ Dashboards display correctly

---

*Document Version: 1.0*
*Last Updated: July 16, 2026*
