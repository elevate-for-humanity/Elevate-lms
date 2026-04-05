# Admin Dashboard — Complete Production Spec

## Problem Statement

The admin dashboard has 164 pages. ~26 are stubs with no DB connection. ~39 had no auth guard.
The course builder cannot create new programs from scratch or add lesson content.
There is no unified video management. The admin currently redirects straight to `/admin/dashboard`
with no landing page. The nav is a flat dropdown bar — it needs section headers, sub-groups,
and a full hamburger slide-in panel matching the public marketing site pattern.

---

## Goals

1. **Admin landing page** — `/admin` is a real page (not a redirect), styled like the marketing site
2. **Full nav** — sticky top bar with grouped dropdowns (section headers + sub-items), full hamburger panel on mobile with nested expand/collapse, search, user menu
3. **Every admin page** is production-ready — auth-guarded, wired to Supabase, real data
4. **Course builder** — create programs, modules, lessons, content (text/video/quiz) from scratch
5. **Video management** — upload to Supabase storage, generate via D-ID, or paste external URL
6. **Design** — matches public marketing site: full-bleed hero, big typography, ruled lists, no card grids

---

## Design System (non-negotiable for all pages)

- Full-bleed hero image, no text on top of image
- Page title: `text-4xl sm:text-6xl font-black text-slate-900 leading-none`
- Eyebrow: `text-xs font-bold uppercase tracking-widest text-slate-400`
- Section headings: `text-3xl sm:text-5xl font-black`
- Data rows: `divide-y divide-slate-100`, each row a `<Link>` where applicable
- Container: `max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8`
- Status pills: `rounded-full text-[11px] font-semibold` colored by status
- Buttons: `px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold`
- Background: always `bg-white` — never `bg-slate-50` page backgrounds
- Mobile-first: all layouts work on 375px phones

---

## Requirement 1 — Admin Landing Page (`/admin`)

Replace the current redirect with a real page that looks like the public home page but shows admin data.

**Sections (top to bottom):**
1. **Hero** — full-bleed image (`/images/pages/admin-dashboard-hero.jpg`), greeting + name below, urgent CTA if pending applications
2. **Quick stats** — 4 large typographic numbers (Applications waiting, Active enrollments, Revenue this month, Certificates issued) as a ruled list — each links to its section
3. **Quick nav grid** — all 10 nav sections as large clickable tiles (Operations, Students, Programs, Build, AI, Funding, Partners, Marketing, Compliance, System) — each tile shows section name, icon, and count of items
4. **Recent activity** — last 10 audit log entries
5. **At-risk students** — top 5 inactive learners

All data fetched server-side from Supabase. Auth-guarded with `requireAdmin()`.

---

## Requirement 2 — Admin Nav (full rebuild)

### Desktop nav
- Sticky top bar, `z-50`, `h-16`, `bg-white border-b border-slate-200`
- Logo left: Elevate "E" mark + "Elevate Admin" text
- 10 nav groups as dropdown buttons — each dropdown has **section header labels** (styled like the public site: red uppercase label, `bg-brand-red-50 border-l-3 border-brand-red-500`) separating sub-groups
- Dropdowns open on **hover** (CSS `group-hover`) AND click (JS toggle) — matches public site pattern
- Active section highlighted: `text-blue-600 bg-blue-50`
- Right side: search bar, notifications bell with unread badge, username, sign-out

### Nav structure with section headers

```
Operations
  — Overview —
    Dashboard, Activity Feed, Analytics, Reporting, Impact
  — Health —
    Monitoring, System Health, Site Health, URL Health
  — Alerts —
    At-Risk, Retention, Notifications, Inbox

Students
  — Pipeline —
    Applications, Applicants, Applicants Live, Leads, Intake, Waitlist
  — Enrolled —
    All Students, Enrollments, Progress, Gradebook, Completions
  — Support —
    Barriers, Next Steps, Outcomes, Verifications, FERPA, Impersonate
  — Records —
    Submissions, Certificates, Exam Authorizations, Transfer Hours, HSI Enrollments, SAP

Programs
  — Catalog —
    Programs, Courses, Curriculum, Modules, Lessons
  — Credentials —
    Certifications, Credentials, Certificates
  — Delivery —
    Instructors, Cohorts, Apprenticeships, Career Courses, Quizzes
  — External —
    External Courses, External Modules, External Progress, External Completions
  — Tools —
    HVAC Activation, ETPL Alignment

Build
  — Courses —
    Course Builder, Course Generator, Course Templates, Course Import, Program Generator
  — Content —
    Quiz Builder, Syllabus Generator, Editor, Content Automation
  — Media —
    Media Studio, Video Manager, Video Generator, Videos, Page Builder

AI
  — Studio —
    AI Console, AI Studio, AI Tutor Logs
  — Automation —
    Copilot, Autopilot, Data Processor, Automation, Automation QA, Workflows, Dev Studio

Funding
  — Programs —
    Funding, Grants, WIOA, JRI, Incentives
  — Payments —
    Cash Advances, Payroll, Payroll Cards, Tax Filing, WOTC, RAPIDS
  — Tools —
    Funding Playbook, Funding Verification, Hours Export

Partners
  — Employers —
    Employers, Employers Playbook, Jobs, OJT Partnerships
  — Network —
    Partners, Partner Enrollments, Partner Inquiries, Affiliates, Providers, Provider Applications
  — Programs —
    Program Holders, Delegates, Shops, Barber Applications, Marketplace

Marketing
  — Outreach —
    Marketing, CRM, Campaigns, Email Marketing, Blog, Social Media
  — Commerce —
    Promo Codes, Store, Live Chat, Support

Compliance
  — Audit —
    Compliance, Compliance Audit, Accreditation, Governance, Audit Logs
  — Documents —
    Documents, Document Center, Signatures, MOU, FERPA
  — HR —
    Security, HR, Moderation, Review Queue

System
  — Config —
    Settings, Users, Tenants, License, Licenses, Licensing, License Requests, Features
  — Dev —
    API Keys, Integrations, Migrations, Import, Mobile Sync, Files
  — Docs —
    Docs, Internal Docs, Portal Map, Advanced Tools, Testing, Test Emails, Test Payments
```

### Mobile hamburger panel
- Slides in from right, `w-[85vw] max-w-sm`
- Each of the 10 sections is an accordion — tap to expand, shows section headers + links inside
- Section headers styled same as desktop (red uppercase label)
- Search bar at top
- Sign out at bottom
- Overlay closes panel on tap
- `Escape` key closes panel
- `style={{ transform }}` (not className template literal) to avoid hydration mismatch

---

## Requirement 3 — All stub pages wired to DB

Every page below rewritten as a production server component:

| Page | Primary tables | Key UI |
|------|---------------|--------|
| `audit-logs` | `audit_logs`, `profiles` | Paginated log, filter by action/user/date, 24h summary |
| `monitoring` | `audit_logs`, `program_enrollments`, `profiles` | Recent events, error counts, active sessions |
| `system-monitor` | `audit_logs` | Event counts by type, last 24h chart data |
| `site-health` | `programs`, `courses`, `curriculum_lessons` | Unpublished content, missing videos, broken slugs |
| `url-health` | `programs`, `courses`, `curriculum_lessons` | Duplicate/missing slugs list |
| `compliance-audit` | `audit_logs`, `documents`, `program_enrollments` | Compliance checklist, missing docs |
| `incentives` | `incentives`, `profiles`, `program_enrollments` | Incentive CRUD, filter by program/student |
| `intake` | `intake_submissions`, `profiles`, `programs` | Intake submissions list, link to enrollment |
| `next-steps` | `next_steps`, `profiles`, `program_enrollments` | Next-step assignments, create/assign/track |
| `promo-codes` | `promo_codes` | Promo code CRUD, usage counts, toggle active |
| `hours-export` | `ojt_hours_log`, `apprenticeship_enrollments`, `profiles` | Filter + CSV export |
| `support` | `support_tickets`, `profiles` | Ticket list, status, reply link |
| `settings` | `profiles`, `tenants`, `features` | Profile edit, tenant config, feature flags |
| `governance` | `governance_documents`, `board_members` | Docs list, board directory |
| `content-automation` | `automation_rules`, `course_generation_logs` | Rule list, last run, toggle |
| `import` | `profiles`, `program_enrollments`, `programs` | CSV upload, preview, confirm |
| `page-builder` | `pages` | CMS page list, create/edit/publish |
| `advanced-tools` | `audit_logs`, `programs`, `courses` | Bulk ops, data repair, cache clear |
| `dev-studio` | `course_generation_logs`, `automation_rules` | Generation logs, automation debug |
| `ai-studio` | `course_generation_logs`, `ai_tutor_logs` | AI job queue, tutor session logs |

---

## Requirement 4 — Course Builder (full creation flow)

### 4a. Create program from scratch
- Form: title, slug (auto-generated from title), description, category, status
- POST to `programs` table
- Redirect to program detail in builder on save

### 4b. Module management
- Add module: title, order, description → writes to `modules` table
- Reorder with up/down buttons → updates `module_order`
- Delete module (with confirmation)

### 4c. Lesson management
- Add lesson: title, `step_type`, order → writes to `curriculum_lessons`
- `step_type` options: lesson, quiz, checkpoint, lab, assignment, exam, certification
- Delete lesson (with confirmation)

### 4d. Lesson content editor (inline, tabbed)
- **Content tab** — rich text editor for reading content
- **Video tab** — attach video (see §5)
- **Quiz tab** — add/edit/delete questions + answer choices, set `passing_score`
- **Settings tab** — step_type, order, passing_score, status
- Auto-saves on blur via PATCH `/api/admin/lessons/[id]`

---

## Requirement 5 — Video Management

### 5a. Upload (Supabase Storage)
- Drag-and-drop or file picker (MP4, MOV, WebM)
- Uploads to `course-videos` bucket: `programs/{programId}/{lessonId}/{filename}`
- Progress bar during upload
- On complete → writes URL to `curriculum_lessons.video_url`

### 5b. D-ID Generation
- Form: lesson select, script text, avatar (default: instructor-trades.jpg)
- POST to D-ID API via existing integration
- Polls job status → writes result to `curriculum_lessons.video_url`
- Job status tracked in `video_generation_jobs` table

### 5c. External URL
- Input: paste YouTube, Vimeo, or direct MP4 URL
- URL format validation
- Writes to `curriculum_lessons.video_url`

### 5d. Video Manager page
- Lists all lessons where `video_url IS NOT NULL`
- Columns: lesson, program, video type (upload/did/external), preview link, replace, remove
- Filter by program

---

## Requirement 6 — Auth sweep

Every admin page must have `requireAdmin()` (server) or `AdminClientPage` wrapper (client).
No page in `/app/admin/**` is accessible without admin role.

---

## Acceptance Criteria

- [ ] `/admin` is a real landing page — not a redirect — with live DB data
- [ ] Nav has section headers in dropdowns matching the public site pattern
- [ ] Mobile hamburger panel has accordion sections with section headers
- [ ] Every admin page returns 403/redirect for unauthenticated users
- [ ] Every stub page shows real Supabase data (or clear empty state)
- [ ] Admin can create program → add modules → add lessons → add content without code
- [ ] Admin can attach video via upload, D-ID, or URL
- [ ] `/admin/video-manager` lists all lesson videos with replace/remove
- [ ] All pages match marketing site design (no card grids, no sidebar aesthetic)
- [ ] Zero hydration errors
- [ ] Dev server starts clean

---

## Implementation Order

1. Auth sweep — `requireAdmin()` on all unguarded pages
2. Admin landing page (`/admin/page.tsx`) — hero + stats + quick nav + activity
3. AdminNav rebuild — section headers in dropdowns, hover+click, mobile accordion
4. Stub pages — all 20 wired to Supabase as production server components
5. Course builder — create program form + API route
6. Course builder — module/lesson management UI
7. Lesson content editor — inline tabs (Content, Video, Quiz, Settings)
8. Video upload — Supabase storage with progress
9. D-ID video generation — form + polling + status
10. External URL video — input + save
11. Video manager page — full list with replace/remove
12. Verify — dev server clean, all pages load, all DB queries return data
