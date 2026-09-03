# Admin Onboarding Runbook (Target: New Customer Live in 2 Hours)

## Prerequisites
- Domain + DNS access
- Supabase project ready
- Admin secrets configured (Supabase, auth, AI, email, storage)

## 0:00–0:20 — Environment setup
1. Configure required env vars in hosting dashboard.
2. Verify env presence via smoke env precheck.
3. Trigger deploy.

## 0:20–0:45 — Data + roles
1. Seed baseline org/program records.
2. Create admin/instructor/learner users.
3. Verify role routes:
   - admin -> `/admin/dashboard`
   - instructor -> `/instructor/dashboard`
   - learner -> `/learner/dashboard`

## 0:45–1:10 — Enrollment critical path
1. Submit test application.
2. Approve via admin queue.
3. Enroll learner.
4. Verify learner course access.

## 1:10–1:35 — Documents + communications
1. Upload test document.
2. Confirm appears in document center.
3. Trigger outbound email test.
4. Validate print/download paths.

## 1:35–2:00 — Final acceptance
1. Run audits: route, redirects, links, admin.
2. Run smoke check.
3. Capture proof artifacts (screenshots/logs/run IDs).
4. Sign-off checklist.
