# LMS & Portal Parity Audit

Generated: 2026-02-14

## Method

Code-level audit of every portal's layout, nav component, sidebar links, and route existence. No test credentials — this is a repo-side structural audit.

---

## 1. LMS Student Portal (`/lms/*`)

### Auth
- `app/lms/(app)/layout.tsx` — Supabase auth required, role-checked via `canAccessRoute()`
- Redirect: `/login?next=/lms/dashboard`

### Sidebar Nav (`components/lms/LMSNavigation.tsx`)

| Nav Item | Route | Page Exists | Data Source |
|---|---|---|---|
| Dashboard | `/lms/dashboard` | ✅ | DB: enrollments, progress |
| My Courses | `/lms/courses` | ✅ | DB: enrollments |
| Schedule | `/lms/schedule` | ✅ | DB: calendar events |
| Messages | `/lms/messages` | ✅ | DB: messages (unread badge) |
| Certificates | `/lms/certificates` | ✅ | DB: certificates |

**Verdict: 5/5 nav links valid. No dead links.**

### LMS Dashboard Internal Links (`app/lms/(app)/dashboard/page.tsx`)

All 19 internal links on the dashboard page resolve to existing routes. 0 dead links.

### Hidden LMS Features (exist but not in sidebar nav)

28 routes exist under `/lms/(app)/` but are only reachable from dashboard cards or direct URL:

| Route | Category | Discoverable From |
|---|---|---|
| `/lms/achievements` | Gamification | Dashboard card |
| `/lms/adaptive` | Learning | Direct URL only |
| `/lms/ai-tutor` | Learning | Direct URL only |
| `/lms/alumni` | Career | Dashboard card |
| `/lms/analytics` | Reporting | Direct URL only |
| `/lms/apply` | Enrollment | Direct URL only |
| `/lms/attendance` | Tracking | Direct URL only |
| `/lms/badges` | Gamification | Achievements page |
| `/lms/builder` | Instructor | Direct URL only |
| `/lms/calendar` | Scheduling | Dashboard card |
| `/lms/certification` | Credentials | Dashboard card |
| `/lms/chat` | Communication | Direct URL only |
| `/lms/collaborate` | Social | Direct URL only |
| `/lms/community` | Social | Direct URL only |
| `/lms/enroll` | Enrollment | Direct URL only |
| `/lms/files` | Content | Direct URL only |
| `/lms/forums` | Communication | Dashboard card |
| `/lms/grades` | Academic | Dashboard card |
| `/lms/groups` | Social | Direct URL only |
| `/lms/learning-paths` | Learning | Direct URL only |
| `/lms/library` | Content | Direct URL only |
| `/lms/orientation` | Onboarding | Dashboard card |
| `/lms/peer-review` | Assessment | Direct URL only |
| `/lms/placement` | Career | Dashboard card |
| `/lms/portfolio` | Career | Direct URL only |
| `/lms/scorm` | Content | Direct URL only |
| `/lms/social` | Social | Direct URL only |
| `/lms/video` | Content | Direct URL only |

### Duplicate Routes

| Route A | Route B | Action |
|---|---|---|
| `/lms/calendar` | `/lms/schedule` | Consolidate — redirect calendar to schedule |
| `/lms/certification` | `/lms/certificates` | Consolidate — redirect certification to certificates |

---

## 2. Admin Portal (`/admin/*`)

### Auth
- `app/admin/layout.tsx` — `requireAdmin()` server-side check
- Redirect: `/admin-login`

### Sidebar Nav (`components/admin/AdminNav.tsx`)

~50 links across 9 sections. 2 dead:

| Dead Link | Route | Issue |
|---|---|---|
| Course Studio | `/admin/course-studio` | ❌ Page does not exist |
| Course Studio AI | `/admin/course-studio-ai` | ❌ Page does not exist |

**Total: 265 admin routes exist. 2 dead nav links.**

---

## 3. Employer Portal (`/employer/*`)

### Auth
- `app/employer/dashboard/page.tsx` — `requireRole()` check
- No shared layout nav — each page is standalone

### Nav Component: `components/nav/EmployerNav.tsx`

**⚠️ NEVER IMPORTED — Dead component. No page uses it.**

Contains 8 dead links (all point to `/employer/*` but some pages only exist at `/employer-portal/*`):

| Dead Link | Route | Actual Location |
|---|---|---|
| All Applications | `/employer/applications` | `/employer-portal/applications` |
| Pending Review | `/employer/applications/pending` | Does not exist |
| Interviews | `/employer/applications/interviews` | `/employer-portal/interviews` |
| Apprentices | `/employer/apprentices` | Does not exist |
| Apprenticeships | `/employer/apprenticeships` | Only sub-routes exist |
| Company Profile | `/employer/company` | `/employer-portal/company` |
| Post New Job | `/employer/jobs/new` | `/employer-portal/jobs/new` |
| Archived Jobs | `/employer/jobs/archived` | Does not exist |

### Two Parallel Employer Portals

| `/employer/*` (17 pages) | `/employer-portal/*` (13 pages) |
|---|---|
| `/employer/dashboard` | `/employer-portal` (landing) |
| `/employer/jobs` | `/employer-portal/jobs` |
| `/employer/candidates` | `/employer-portal/candidates` |
| `/employer/analytics` | `/employer-portal/analytics` |
| `/employer/settings` | `/employer-portal/settings` |
| `/employer/compliance` | — |
| `/employer/documents` | — |
| `/employer/placements` | — |
| `/employer/post-job` | `/employer-portal/jobs/new` |
| — | `/employer-portal/applications` |
| — | `/employer-portal/company` |
| — | `/employer-portal/hiring-guide` |
| — | `/employer-portal/interviews` |
| — | `/employer-portal/messages` |
| — | `/employer-portal/programs` |

**⚠️ Should consolidate into one prefix.**

---

## 4. Partner Portal (`/(partner)/partners/*`)

### Auth
- `app/(partner)/partners/layout.tsx` — `getMyPartnerContext()`, redirects to `/partners/login`

### Sidebar Nav (`components/partner/PartnerNav.tsx`)

| Nav Item | Route | Exists |
|---|---|---|
| Dashboard | `/partners/dashboard` | ✅ |
| Students | `/partners/students` | ✅ |
| Attendance | `/partners/attendance` | ✅ |
| Weekly Reports | `/partners/reports/weekly` | ✅ |
| Documents | `/partners/documents` | ✅ |
| Support | `/partners/support` | ✅ |
| Admin: Shops | `/partners/admin/shops` | ✅ |
| Admin: Placements | `/partners/admin/placements` | ✅ |

**Verdict: 8/8 nav links valid. No dead links.**

---

## 5. Staff Portal (`/staff-portal/*`)

### Auth
- No shared layout with auth guard — individual pages handle auth

### Nav Component: `components/nav/StaffNav.tsx`

**⚠️ NEVER IMPORTED — Dead component. No page uses it.**

Contains 10 dead links out of 12:

| Link | Route | Exists |
|---|---|---|
| Dashboard | `/staff-portal/dashboard` | ✅ |
| Students | `/staff-portal/students` | ✅ |
| Pending Students | `/staff-portal/students/pending` | ❌ |
| At-Risk Students | `/staff-portal/students/at-risk` | ❌ |
| Partners | `/staff-portal/partners` | ❌ |
| Verifications | `/staff-portal/partners/verifications` | ❌ |
| Enrollment Reports | `/staff-portal/reports/enrollment` | ❌ |
| Compliance Reports | `/staff-portal/reports/compliance` | ❌ |
| Outcomes Reports | `/staff-portal/reports/outcomes` | ❌ |
| Calendar | `/staff-portal/calendar` | ❌ |
| Tasks | `/staff-portal/tasks` | ❌ |
| Settings | `/staff-portal/settings` | ❌ |

### Actual Staff Portal Routes (14 pages)

```
/staff-portal (landing)
/staff-portal/attendance
/staff-portal/attendance/record
/staff-portal/campaigns
/staff-portal/cases
/staff-portal/cases/[id]
/staff-portal/courses
/staff-portal/customer-service
/staff-portal/dashboard
/staff-portal/qa-checklist
/staff-portal/reports
/staff-portal/students
/staff-portal/students/add
/staff-portal/training
```

---

## 6. Student Portal (`/student-portal/*`)

### Nav: Inline on `/student-portal/page.tsx`

| Link | Route | Exists |
|---|---|---|
| My Courses | `/student-portal/courses` | ❌ DEAD — should be `/lms/courses` |
| Schedule | `/student-portal/schedule` | ✅ |
| Grades | `/student-portal/grades` | ✅ |
| Support | `/lms/support` | ✅ |
| Career Services | `/career-services` | ✅ |

### Actual Student Portal Routes (9 pages)

```
/student-portal (landing)
/student-portal/announcements
/student-portal/assignments
/student-portal/grades
/student-portal/handbook
/student-portal/hours
/student-portal/onboarding/documents
/student-portal/resources
/student-portal/schedule
```

---

## 7. Other Portals

| Portal | Routes | Layout Nav | Dead Links |
|---|---|---|---|
| Apprentice (`/apprentice/*`) | 14 | Inline on page | 0 |
| Workforce Board (`/workforce-board/*`) | 10 | Inline on page | 0 |
| Instructor (`/instructor/*`) | 12 | Layout with nav | 0 (all 6 links valid) |
| Program Holder (`/program-holder/*`) | 31 | Layout with nav | 0 (all 7 links valid) |
| Creator (`/creator/*`) | 12 | No layout nav | Not audited |

---

## Dead Link Summary

| Portal | Nav Component | In Use? | Dead Links | Total Links |
|---|---|---|---|---|
| LMS | `LMSNavigation.tsx` | ✅ | **0** | 5 |
| Admin | `AdminNav.tsx` | ✅ | **2** | ~50 |
| Employer | `EmployerNav.tsx` | ❌ Dead component | **8** | 12 |
| Staff | `StaffNav.tsx` | ❌ Dead component | **10** | 12 |
| Partner | `PartnerNav.tsx` | ✅ | **0** | 8 |
| Student | Inline | N/A | **1** | 5 |
| Instructor | Layout inline | ✅ | **0** | 6 |
| Program Holder | Layout inline | ✅ | **0** | 7 |
| Apprentice | Inline | N/A | **0** | 7 |
| Workforce Board | Inline | N/A | **0** | 6 |
| **TOTAL** | | | **21** | ~118 |

---

## Structural Issues

1. **Two parallel employer portals** — `/employer/*` (17 pages) and `/employer-portal/*` (13 pages) with overlapping routes (jobs, candidates, analytics, settings). Should consolidate under one prefix.

2. **Dead nav components** — `EmployerNav.tsx` and `StaffNav.tsx` are never imported by any page or layout. Either wire them into their portal layouts or delete them.

3. **LMS sidebar too minimal** — 5 items for 75 routes. Students cannot discover forums, community, library, learning paths, placement, or career services from the sidebar. These are only reachable from dashboard cards or direct URL.

4. **Duplicate LMS routes** — `/lms/calendar` vs `/lms/schedule`, `/lms/certification` vs `/lms/certificates`. Should redirect one to the other.

5. **No shared layout for staff-portal or student-portal** — each page handles its own auth and nav independently, leading to inconsistent UX and no sidebar navigation.

6. **Student portal links to missing page** — `/student-portal/courses` does not exist. Should link to `/lms/courses`.
