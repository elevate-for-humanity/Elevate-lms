# Dashboard Completeness & Readiness Audit

**Date:** 2026-01-29  
**Scope:** Student, Partner, Admin dashboards  
**Verdict:** ✅ READY

---

## Executive Summary

All three dashboards exist and are functional. Core features are implemented. However, some features use direct database writes instead of RPCs, and hours approval workflow needs UI completion on the partner side.

---

## 1. Student Dashboard Verification

### Location: `/app/lms/page.tsx`, `/app/apprentice/*`

| Feature | Status | Notes |
|---------|--------|-------|
| Application status reflects DB state | ✅ YES | Uses `career_applications.application_state` |
| Enrollment status visible | ✅ YES | Shows `program_enrollments` and `enrollments` |
| Courses appear after enrollment | ✅ YES | Queries `enrollments` joined with `courses` |
| Clock hours tracking | ✅ YES | `/apprentice/hours` - reads from `hours_logs` |
| Students can submit hours | ✅ YES | `/apprentice/hours/log` - form exists |
| Hours tied to program/partner/date | ✅ YES | Form captures employer, supervisor, date |
| Validation rules enforced | ✅ YES | 0.5-24 hours, no future dates |
| Progress tracking | ✅ YES | Shows approved vs required hours |
| Visual progress indicators | ✅ YES | Progress bar with percentage |
| Notifications | ✅ YES | Enrollment confirmation via `notifications` table |
| Access control (own data only) | ✅ YES | Queries filtered by `user_id` |
| Refresh mid-session | ✅ YES | Server-side rendering, no state loss |
| Mobile view | ✅ YES | Responsive Tailwind classes |
| No empty/broken states | ✅ YES | Empty states with CTAs |

### Issues Found
| Issue | Severity | Location |
|-------|----------|----------|
| Hours log uses direct INSERT | LOW | `app/apprentice/hours/log/page.tsx:62` |

---

## 2. Partner/Employer Dashboard Verification

### Location: `/app/partner/*`

| Feature | Status | Notes |
|---------|--------|-------|
| Partner approval status enforced | ✅ YES | Checks `partners` table via `user_id` |
| Partner can view assigned students | ✅ YES | `/partner/students` - queries by `partner_id` |
| Partner can review submitted hours | ✅ YES | `/partner/hours/pending` page |
| Partner can approve/reject hours | ✅ YES | `/api/apprenticeship/hours/approve` |
| Partner can enter progress notes | ⚠️ PARTIAL | Attendance notes exist, no dedicated progress UI |
| Progress visibility (hours to date) | ✅ YES | Stats shown on dashboard |
| Remaining hours visible | ✅ YES | Calculated from required - approved |
| Cannot see students outside org | ✅ YES | Filtered by `partner_id` / `tenant_id` |
| Cannot edit student personal data | ✅ YES | No edit endpoints exposed |
| Actions logged | ✅ YES | `audit_logs` entries on attendance |

### Issues Found
| Issue | Severity | Location |
|-------|----------|----------|
| Attendance uses direct INSERT | LOW | `app/partner/attendance/record/AttendanceRecordForm.tsx:51` |

---

## 3. Admin Dashboard Verification

### Location: `/app/admin/*`

| Feature | Status | Notes |
|---------|--------|-------|
| View all students | ✅ YES | `/admin/students` |
| View all partners | ✅ YES | `/admin/partners` |
| View all applications | ✅ YES | `/admin/applications` |
| View all enrollments | ✅ YES | `/admin/enrollments` |
| Override workflows safely | ✅ YES | Uses RPCs for enrollment/approval |
| See stuck applications | ⚠️ PARTIAL | No dedicated view, can query |
| See stuck partner approvals | ✅ YES | Cron endpoint + can filter by status |
| See enrollment failures | ⚠️ PARTIAL | Audit logs exist, no dedicated view |
| Retry enrollment | ✅ YES | Can call RPC with new idempotency key |
| Retry partner auth linking | ✅ YES | Can re-approve via route |
| Correct rejected hours | ✅ YES | Direct DB access for admins |
| Export/view hours | ✅ YES | `/admin/hours-export`, `/api/reports/rapids` |
| No bypass of state machine | ✅ YES | RLS blocks direct writes |

### Issues Found
| Issue | Severity | Location |
|-------|----------|----------|
| No dedicated "stuck items" dashboard | LOW | Data exists, needs aggregated view |

---

## 4. Data Integrity & Wiring

| Check | Status | Notes |
|-------|--------|-------|
| Application lifecycle uses RPCs | ✅ YES | `start_application`, `advance_application_state`, `submit_application` |
| Enrollment uses RPC | ✅ YES | `rpc_enroll_student` |
| Partner approval uses RPCs | ✅ YES | `rpc_approve_partner`, `rpc_link_partner_user` |
| Hours submission uses RPC | ❌ NO | Direct INSERT to `training_hours` |
| Hours approval uses API | ✅ YES | `/api/apprenticeship/hours/approve` |
| Attendance recording uses API | ⚠️ PARTIAL | API exists, form does direct INSERT |
| Failures return explicit errors | ✅ YES | Structured JSON responses |
| No direct table writes from critical flows | ⚠️ PARTIAL | Hours/attendance use direct writes |

---

## 5. Feature Completeness Check

| Feature | Status |
|---------|--------|
| Students can clock hours | ✅ YES |
| Partners can approve hours | ✅ YES |
| Progress is calculated correctly | ✅ YES |
| Dashboards reflect real DB state | ✅ YES |
| All required dashboards exist and are reachable | ✅ YES |

---

## 6. File Paths

### Dashboard Pages
| Dashboard | Path |
|-----------|------|
| Student LMS | `app/lms/page.tsx` |
| Apprentice Hours | `app/apprentice/hours/page.tsx` |
| Apprentice Hours Log | `app/apprentice/hours/log/page.tsx` |
| Partner Dashboard | `app/partner/dashboard/page.tsx` |
| Partner Students | `app/partner/students/page.tsx` |
| Partner Attendance | `app/partner/attendance/page.tsx` |
| Admin Dashboard | `app/admin/dashboard/page.tsx` |
| Admin Applications | `app/admin/applications/page.tsx` |
| Admin Partners | `app/admin/partners/page.tsx` |

### API Routes
| Function | Path |
|----------|------|
| Partner Attendance | `app/api/partner/attendance/route.ts` |
| Hours Approval | `app/api/apprenticeship/hours/approve/route.ts` |
| Partner Approval | `app/api/partner/applications/[id]/approve/route.ts` |
| Enrollment | `lib/enrollment/orchestrate-enrollment.ts` → `rpc_enroll_student` |

### RPCs (Database)
| RPC | Migration |
|-----|-----------|
| `start_application` | `20260129_application_state_machine.sql` |
| `advance_application_state` | `20260129_application_state_machine.sql` |
| `submit_application` | `20260129_application_state_machine.sql` |
| `rpc_enroll_student` | `20260129_phase2_enrollment_orchestration.sql` |
| `rpc_approve_partner` | `20260129_phase2_partner_approval.sql` |
| `rpc_link_partner_user` | `20260129_phase2_partner_approval.sql` |

---

## 7. Blocking Issues

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Partner hours approval UI incomplete | **RESOLVED** | Partners can now review/approve pending hours | ✅ Created `/partner/hours/pending` |
| Admin applications page queried wrong table | **RESOLVED** | Was querying `profiles` instead of `career_applications` | ✅ Fixed 2026-01-30 |

---

## 8. Non-Blocking Issues (Phase 2)

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Hours submission uses direct INSERT | LOW | Create `rpc_submit_hours` for consistency |
| Attendance uses direct INSERT | LOW | Route through API |
| No "stuck items" admin view | LOW | Create aggregated dashboard widget |
| No dedicated progress notes UI | LOW | Add to partner student detail page |

---

## Verdict

### ✅ READY

**For Day 1 launch:**
- Core functionality works
- Students can log hours
- Partners can approve/reject hours via UI
- Admins have full visibility

**All blocking issues resolved.**

**Can defer to Phase 2:**
- RPC-ify hours submission
- Stuck items dashboard
- Progress notes UI

---

## Appendix: Quick Verification Commands

```sql
-- Check student hours
SELECT * FROM hours_logs WHERE user_id = 'STUDENT_UUID' ORDER BY date DESC;

-- Check pending hours for approval
SELECT * FROM training_hours WHERE status = 'pending';

-- Check partner's students
SELECT * FROM enrollments WHERE partner_id = 'PARTNER_UUID';

-- Check stuck applications
SELECT * FROM career_applications 
WHERE application_state NOT IN ('submitted', 'rejected')
AND updated_at < NOW() - INTERVAL '24 hours';

-- Check stuck partner approvals
SELECT * FROM partner_applications
WHERE approval_status = 'approved_pending_user';
```
