# PRIORITIZED ACTION PLAN
**Generated:** 2026-07-13  
**Status:** ACTIVE

---

## CURRENT PROGRESS

| Category | Progress | Assessment |
|----------|----------|------------|
| Architecture cleanup | 95% | Near complete |
| Repository organization | 95% | Near complete |
| Route cleanup | 90% | Near complete |
| Documentation | 95% | Near complete |
| Deployment readiness | 75% | Needs deployment |
| Production stability | 70% | Needs testing |
| Security validation | 30% | NOT STARTED |
| SEO validation | 40% | PARTIAL |
| E2E workflow testing | 40% | PARTIAL |
| **Overall** | **~80-85%** | **NOT PRODUCTION READY** |

---

## BLOCKERS (CRITICAL - Must Fix)

### 1. Northflank Deployment
**Owner:** Someone with Northflank access

| Action | Status |
|--------|--------|
| Trigger Marketing rebuild | PENDING |
| Trigger Admin rebuild | PENDING |
| Trigger LMS rebuild | PENDING |
| Verify x-build-id = Git SHA | PENDING |

### 2. Server Component Errors
**Priority:** CRITICAL

| Page | Issue | Fix |
|------|-------|-----|
| /programs/cna | Server Component Error | Investigate data fetching |
| /programs/hvac-technician | Server Component Error | Investigate data fetching |

**Next Step:** Deploy fixes, monitor logs.

### 3. Production Running Dev Build
**Issue:** `x-build-id: dev` instead of production SHA

**Fix:** Rebuild with `next build` → `next start`

---

## PHASE 1: ORPHAN FOLDER CLEANUP

### Verified Safe (NO references)
These can be deleted after ONE final check:

#### Top-Level Orphans (12 verified)
```
app/accessibility/accessibility
app/accreditation/accreditation
app/booking/booking
app/calendar/calendar
app/careers/careers
app/faq/faq
app/jobs/jobs
app/press/press
app/resources/resources
app/site-map/site-map
app/start/start
app/verify/verify
```

#### Admin Orphans (verified: 0 references)
```
app/admin/analytics/analytics
app/admin/audit-logs/audit-logs
app/admin/crm/crm
app/admin/governance/governance
app/admin/reports/reports
```

#### About Orphans (verified: 0 references)
```
app/about/mission/mission
app/about/partners/partners
app/about/team/team
```

### Not Verified Yet (38 remaining)
These need reference check before deletion:

```
app/ai-chat/ai-chat
app/ai/ai
app/ai/ai/instructor
app/ai/ai/job-match
app/blog/blog/rss.xml
app/booking/booking/enrollment
app/career-training/career-training
app/career-training/career-training/[state]
app/certiport-exam/certiport-exam
app/check-eligibility/check-eligibility
app/cna-waitlist/cna-waitlist
app/community-services/community-services
app/community-services/community-services/[state]
app/find-workone/find-workone
app/find-workone/find-workone/[region]
app/for-students/for-students
app/hire-graduates/hire-graduates
app/pathways/pathways
app/pathways/pathways/[slug]
app/pathways/pathways/outcomes
app/pathways/pathways/training-model
app/pay/pay
app/success-stories/success-stories
app/verify/verify
app/verify/verify/[certificateId]
app/admin/crm/crm/appointments
app/admin/crm/crm/campaigns
app/admin/crm/crm/contacts
app/admin/crm/crm/deals
app/admin/crm/crm/follow-ups
app/admin/crm/crm/leads
app/admin/crm/crm/leads/[id]
app/admin/governance/governance/operational-controls
app/admin/governance/governance/security
```

---

## PHASE 2: ACTIVE DUPLICATE INVESTIGATION

### Requires Content Comparison

| Duplicate | Canonical | Action |
|-----------|----------|--------|
| /blog/blog | /blog | Compare content |
| /careers/careers | /careers | Compare content |
| /about/team/team | /about/team | Compare content |

### If Same Content
1. Choose canonical URL
2. Add 301 redirect from duplicate to canonical
3. Update sitemap (remove duplicate)
4. Update navigation (remove duplicate links)
5. Keep canonical

### If Different Content
1. Keep both
2. Update sitemap for both
3. Ensure navigation is correct

---

## PHASE 3: BROWSER CERTIFICATION

### Complete Page Testing (After Deployment)

#### Public Pages
- [ ] / (homepage)
- [ ] /programs
- [ ] /programs/cna
- [ ] /programs/hvac-technician
- [ ] /programs/medical-assistant
- [ ] /apply
- [ ] /apply/employer
- [ ] /funding
- [ ] /testing
- [ ] /about
- [ ] /contact
- [ ] /barber-host-shop
- [ ] /partners/host-shops

#### Authentication Required
- [ ] /admin/dashboard
- [ ] /lms/dashboard

### Test Each Page For
- [ ] HTTP 200
- [ ] Hero renders
- [ ] Content renders
- [ ] CTA buttons work
- [ ] No console errors
- [ ] No hydration errors
- [ ] Images load
- [ ] Responsive design

---

## PHASE 4: WORKFLOW TESTING

### Student Workflow
- [ ] Eligibility check form
- [ ] Student application
- [ ] Application confirmation
- [ ] Email notification

### Employer Workflow
- [ ] Employer application
- [ ] Application confirmation
- [ ] Email notification

### Payment Workflow
- [ ] Stripe checkout
- [ ] Payment confirmation
- [ ] Webhook processing

### LMS Workflow
- [ ] Login
- [ ] Course enrollment
- [ ] Lesson completion
- [ ] Progress tracking

---

## PHASE 5: SECURITY AUDIT

### Required Checks
- [ ] API route exposure (no public admin APIs)
- [ ] Authentication middleware
- [ ] Authorization (RLS policies)
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Webhook signature verification
- [ ] Secrets management
- [ ] Environment variables

---

## PHASE 6: SEO AUDIT

### Required Checks
- [ ] Sitemap generation
- [ ] Robots.txt
- [ ] Canonical tags
- [ ] Meta descriptions
- [ ] Open Graph tags
- [ ] Twitter cards
- [ ] Schema.org markup
- [ ] Breadcrumbs
- [ ] Alt text on images

---

## EXECUTION SEQUENCE

### Week 1: Deployment & Stabilization
1. [ ] Deploy to Northflank
2. [ ] Verify x-build-id
3. [ ] Monitor error logs
4. [ ] Fix Server Component errors

### Week 2: Browser Certification
1. [ ] Complete public page testing
2. [ ] Complete workflow testing
3. [ ] Fix any issues found

### Week 3: Security & SEO
1. [ ] Security audit
2. [ ] SEO audit
3. [ ] Fix issues

### Week 4: Cleanup & Release
1. [ ] Delete verified orphan folders
2. [ ] Investigate active duplicates
3. [ ] Final regression testing
4. [ ] Production release

---

## METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Routes certified | 100% | 40% |
| Workflows tested | 100% | 0% |
| Security checks | 100% | 0% |
| SEO checks | 100% | 0% |
| Orphan folders deleted | 50 | 0 |

---

## DAILY STANDUP ITEMS

### Today
- [ ] Verify remaining 38 orphan folders
- [ ] Prepare deployment checklist

### This Week
- [ ] Trigger Northflank deployment
- [ ] Monitor deployment
- [ ] Complete browser certification

### This Month
- [ ] Security audit
- [ ] SEO audit
- [ ] Production release

---

*Plan: 2026-07-13*
