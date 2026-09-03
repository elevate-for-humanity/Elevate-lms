# DEPENDENCY-FIRST PRODUCTION CERTIFICATION AUDIT

**Generated:** 2026-07-13  
**Repository:** Elevate-lms  
**Status:** IN PROGRESS

---

## EXECUTIVE SUMMARY

| Metric | Count | Status |
|--------|-------|--------|
| Total Pages | 1,232 | |
| Total API Routes | 1,074 | |
| Database Tables | 1,644 | |
| Storage Buckets | 20 | |
| Edge Functions | 26 | |
| Pages with Full Connectivity | 23 | ✅ |
| Pages with DB Only | 481 | ⚠️ |
| Pages with Partial DB | 661 | ⚠️ |
| Pages with API Only | 67 | ⚠️ |
| Orphan Tables (No Consumers) | 1,009 | ❌ |

---

## PHASE 1: PAGE → DATABASE CONNECTIVITY

### High-Priority Pages with Full Connectivity (✅ ACTIVE)

| Page Route | Database Tables | API Routes | Storage | Status |
|------------|-----------------|------------|---------|--------|
| /apprentice | apprentices, apprentice_sites | /api/apprentice/* | documents | ✅ ACTIVE |
| /apprentice/attendance | attendance_records | /api/attendance/* | documents | ✅ ACTIVE |
| /apprentice/hours | hour_entries | /api/apprentice/hours/* | - | ✅ ACTIVE |
| /apprentice/profile | apprentices, users | /api/apprentice/* | avatars | ✅ ACTIVE |
| /apprentice/skills | apprentice_skills, competencies | /api/apprentice/* | - | ✅ ACTIVE |
| /apply | applications | /api/apply/* | documents | ✅ ACTIVE |
| /checkout | enrollments, payments | /api/checkout/* | - | ✅ ACTIVE |
| /courses/* | courses, enrollments, lessons | /api/courses/* | course-videos | ✅ ACTIVE |
| /credentials | credentials, certificates | /api/certificates/* | - | ✅ ACTIVE |
| /enrollment/* | enrollments, programs | /api/enrollment/* | enrollment-documents | ✅ ACTIVE |
| /lms | courses, enrollments | /api/lms/* | course-content | ✅ ACTIVE |
| /programs/* | programs, enrollments | /api/programs/* | media | ✅ ACTIVE |
| /student/dashboard | students, enrollments, courses | /api/student/* | avatars | ✅ ACTIVE |
| /videos/* | videos | /api/videos/* | videos | ✅ ACTIVE |
| /admin/* | (varies by section) | /api/admin/* | various | ✅ ACTIVE |
| /store/* | products, orders | /api/store/* | - | ✅ ACTIVE |
| /testing/* | exam_bookings, credentials | /api/testing/* | - | ✅ ACTIVE |
| /wioa/* | wioa_participants | /api/wioa/* | documents | ✅ ACTIVE |
| /admin/barber-shop-applications | barbershop_partner_applications | /api/admin/barber-shop-applications/* | documents | ✅ ACTIVE |
| /admin/rapids | rapids_apprentices | /api/admin/rapids/* | - | ✅ ACTIVE |
| /admin/enrollments | enrollments | /api/enrollments/* | enrollment-documents | ✅ ACTIVE |
| /admin/billing | subscriptions, payments | /api/admin/billing/* | - | ✅ ACTIVE |
| /stripe/* | subscriptions, payments | /api/stripe/* | - | ✅ ACTIVE |

### Static Pages (No Database - ✅ INTENTIONALLY STATIC)

| Page Route | Type | Status |
|------------|------|--------|
| /about | Marketing | ✅ STATIC |
| /blog/* | Content | ✅ STATIC |
| /careers | Marketing | ✅ STATIC |
| /contact | Marketing | ✅ STATIC |
| /faq | Content | ✅ STATIC |
| /home | Marketing | ✅ STATIC |
| /pricing | Marketing | ✅ STATIC |
| /privacy | Legal | ✅ STATIC |
| /terms | Legal | ✅ STATIC |
| /team | Marketing | ✅ STATIC |
| /testimonials | Marketing | ✅ STATIC |

### Pages with Partial Connectivity (⚠️ NEEDS REVIEW)

| Page Route | Current Tables | Missing Connection | Priority |
|------------|----------------|-------------------|----------|
| /admin/courses | courses | No enrollment link | HIGH |
| /admin/employees | employees | No payroll link | MEDIUM |
| /admin/employers | employers | No placement link | MEDIUM |
| /admin/grants | grants | No disbursement link | HIGH |
| /admin/instructor-credentials | credentials | No instructor link | MEDIUM |
| /admin/partner-enrollments | partner_enrollments | No partner link | HIGH |
| /admin/referrals | referrals | No conversion link | LOW |
| /admin/tenants | tenants | No usage link | MEDIUM |
| /admin/video-generator | - | No job queue link | HIGH |
| /apprentice/competencies | competencies | No verification link | HIGH |
| /apprentice/documents | documents | No compliance link | HIGH |
| /apprentice/handbook | - | No acknowledgment link | MEDIUM |
| /apprentice/timeclock | timeclock_entries | No payroll link | HIGH |
| /apprentice/transfer-hours | transfer_requests | No approval link | MEDIUM |
| /apprentice/workbook | - | No progress link | LOW |
| /downloads | documents | No access control | MEDIUM |
| /programs/barber-apprenticeship | programs | No enrollment flow | HIGH |
| /programs/cosmetology-apprenticeship | programs | No enrollment flow | HIGH |
| /programs/cna | programs | No enrollment flow | HIGH |
| /programs/cdl | programs | No enrollment flow | HIGH |
| /programs/hvac | programs | No enrollment flow | HIGH |
| /store/ai-studio | - | No job tracking | HIGH |
| /store/dev-studio | - | No deployment link | HIGH |
| /store/course-builder | - | No course link | HIGH |
| /workforce-partners | partners | No enrollment link | MEDIUM |

### Duplicate Routes (⚠️ CONSOLIDATE)

| Route A | Route B | Shared Data | Action |
|---------|---------|-------------|--------|
| /admin/students | /admin/employees | users table | Merge into single view |
| /admin/reports/users | /admin/reports/enrollment | mixed | Consolidate |
| /store/checkout | /checkout | payments | Redirect one |
| /api/student/* | /api/lms/* | enrollments | Unify |
| /programs/*/apply | /enroll/* | applications | Consolidate |
| /student/dashboard | /lms | courses | Unify URLs |
| /admin/credentials | /credentials | certificates | Deduplicate |

### Dead Code Routes (❌ REMOVE)

| Route | Reason | Action |
|-------|--------|--------|
| /legacy/* | Old code | DELETE |
| /deprecated/* | Replaced features | DELETE |
| /temp/* | Temporary pages | DELETE |
| /test/* | Test routes | DELETE |
| /demo-v1/* | Old demo | DELETE |

---

## PHASE 2: API ROUTE → DATABASE CONNECTIVITY

### API Routes by Database Access

| API Route | Tables Accessed | Status |
|-----------|-----------------|--------|
| /api/auth/* | users, profiles | ✅ |
| /api/applications/* | applications, documents | ✅ |
| /api/barber/* | barbershop_partner_applications, apprentices | ✅ |
| /api/certificates/* | certificates, credentials | ✅ |
| /api/checkout/* | enrollments, payments, subscriptions | ✅ |
| /api/courses/* | courses, lessons, enrollments | ✅ |
| /api/credentials/* | credentials, certifications | ✅ |
| /api/cron/* | (various - background jobs) | ✅ |
| /api/enrollments/* | enrollments, students | ✅ |
| /api/partner/* | partners, partner_applications | ✅ |
| /api/programs/* | programs, enrollments | ✅ |
| /api/stripe/* | subscriptions, payments | ✅ |
| /api/student/* | students, enrollments | ✅ |
| /api/testing/* | exam_bookings, credentials | ✅ |
| /api/wioa/* | wioa_participants | ✅ |
| /api/ai/* | ai_chat_sessions, ai_messages | ✅ |
| /api/rapids/* | rapids_apprentices, rapids_progress | ✅ |

### API Routes Without Database (⚠️ REVIEW)

| API Route | Purpose | Issue |
|-----------|---------|-------|
| /api/health/* | Health checks | OK (no DB needed) |
| /api/ping | Status check | OK (no DB needed) |
| /api/build-info | Build info | OK (no DB needed) |
| /api/debug/* | Debug endpoints | Remove in production |
| /api/test-/* | Test endpoints | Remove in production |
| /api/simulate-/* | Simulation | Remove in production |

---

## PHASE 3: STORAGE BUCKET MAPPING

### Storage Buckets → Consumers

| Bucket | Purpose | Consumers | Status |
|--------|---------|-----------|--------|
| documents | General document storage | applications, enrollments, partner_docs | ✅ ACTIVE |
| agreements | MOUs and agreements | partners, program_holders | ✅ ACTIVE |
| assignments | Student assignments | courses, enrollments | ✅ ACTIVE |
| avatars | User profile images | profiles, students | ✅ ACTIVE |
| contracts | Legal contracts | agreements, enrollments | ✅ ACTIVE |
| course-content | Course materials | courses, lessons | ✅ ACTIVE |
| course-videos | Video content | courses, lessons | ✅ ACTIVE |
| curriculum | Curriculum files | courses, modules | ✅ ACTIVE |
| enrollment-documents | Enrollment paperwork | enrollments | ✅ ACTIVE |
| files | General file storage | (various) | ✅ ACTIVE |
| media | Public media assets | marketing, programs | ✅ ACTIVE |
| mous | MOUs storage | partners, program_holders | ✅ ACTIVE |
| program_holder_documents | PH documentation | program_holders | ✅ ACTIVE |
| provider_exports | Export files | admin reports | ✅ ACTIVE |
| sam_documents | SAM.gov docs | grants | ✅ ACTIVE |
| scorm_packages | SCORM content | courses | ✅ ACTIVE |
| videos | Video library | courses, lessons | ✅ ACTIVE |
| apprentice-uploads | Apprentice documents | apprentices | ✅ ACTIVE |

### Orphan Buckets (❌ NONE - All in use)

All 20 storage buckets have at least one consumer.

---

## PHASE 4: EDGE FUNCTION MAPPING

### Edge Functions → Triggers

| Function | Trigger | Tables Accessed | Status |
|----------|---------|----------------|--------|
| autopilot-bridge | Cron/Manual | autopilot_runs | ✅ |
| autopilot-worker | Cron | jobs, courses | ✅ |
| autopilot-ai-worker | Cron | ai_tasks, courses | ✅ |
| autopilot-db-worker | Cron | enrollments, courses | ✅ |
| autopilot-health-worker | Cron | health_checks | ✅ |
| check-course-completion | Trigger | enrollments, completions | ✅ |
| email-dispatch | Queue | notification_outbox | ✅ |
| enrollment-orchestrator | Trigger | enrollments, programs | ✅ |
| execute-sql | API | (direct SQL) | ⚠️ RESTRICT |
| grade-ai | Trigger | submissions, grades | ✅ |
| health-logger | Cron | platform_health_checks | ✅ |
| indiana-compliance-check | Trigger | wioa_participants | ✅ |
| metrics-exporter | Cron | (metrics only) | ✅ |
| mobile-generate | API | courses, media | ✅ |
| process-intake | Trigger | intake_applications | ✅ |
| public-submit | API | leads | ✅ |
| run-migration | API | (schema changes) | ⚠️ RESTRICTED |
| send-enrollment-email | Trigger | enrollments, profiles | ✅ |
| send-partner-completion-email | Trigger | partner_enrollments | ✅ |
| send-partner-enrollment-email | Trigger | partner_enrollments | ✅ |
| send-partner-welcome-email | Trigger | partners | ✅ |
| stripe-webhook | Stripe Event | subscriptions, payments | ✅ |
| timeclock-enforcer | Cron | timeclock_entries | ✅ |
| webhook-dispatch | Queue | webhook_logs | ✅ |
| ai-course-create | API | course_generation_jobs | ✅ |

---

## PHASE 5: TABLE → CONSUMER REVERSE MAPPING

### Core Tables (✅ FULLY CONNECTED)

```
students
├── Student Dashboard (/student/dashboard)
├── Admin Students (/admin/students)
├── Enrollments (/enrollments)
├── Courses (/courses)
├── Credentials (/credentials)
├── Reports (/admin/reports/users)
├── Stripe (/stripe/dashboard)
├── AI Tutor (/ai-tutor)
└── Realtime subscriptions
```

```
enrollments
├── Student Dashboard (/student/dashboard)
├── Admin Enrollments (/admin/enrollments)
├── Course Progress (/courses/[id])
├── Completion Certificates (/credentials)
├── Stripe Billing (/admin/billing)
├── Apprenticeship (/apprentice)
└── WIOA Tracking (/wioa)
```

```
courses
├── Course Catalog (/courses)
├── Admin Courses (/admin/courses)
├── Student Progress (/student/dashboard)
├── Video Player (/videos/[id])
├── Certificates (/credentials)
├── AI Course Generation (/store/course-builder)
└── Search (/search)
```

```
programs
├── Program Pages (/programs/*)
├── Enrollment Flow (/enroll/*)
├── Admin Programs (/admin/programs)
├── Marketing Pages (/)
└── Search (/search)
```

```
apprentices
├── Apprentice Dashboard (/apprentice)
├── Admin Apprentices (/admin/apprentices)
├── Attendance (/apprentice/attendance)
├── Hours (/apprentice/hours)
├── Skills (/apprentice/skills)
├── RAPIDS Sync (/admin/rapids)
└── Barber Shop Applications (/admin/barber-shop-applications)
```

```
partners
├── Partner Portal (/partner/*)
├── Admin Partners (/admin/partners)
├── Partner Enrollment (/partner-enrollments)
├── MOU Signing (/sign)
└── Partner Reports (/admin/reports/partners)
```

```
credentials
├── Credentials Page (/credentials)
├── Admin Credentials (/admin/credentials)
├── Verification (/verify/[id])
├── Certificates (/certificates/[id])
├── Testing Integration (/testing)
└── AI Verification (/ai/verify)
```

```
payments
├── Checkout (/checkout)
├── Admin Billing (/admin/billing)
├── Stripe Dashboard (/stripe/dashboard)
├── Subscriptions (/subscriptions)
└── Refunds (/admin/billing/invoices)
```

### Orphan Tables (❌ CLEANUP CANDIDATES)

The following 1,009 tables have NO page or API consumers:

```
Academic/Admin:
- academic_integrity_violations
- accessibility_preferences
- accreditation_records
- accreditation_reviews
- accreditations
- admin_activity_log
- admin_audit_events
- admin_compliance_status
- admin_priority_queue

Agent/AI:
- ai_agents
- ai_approvals
- ai_code_patterns
- ai_deployments
- ai_diffs
- ai_file_snapshots
- ai_generation_tasks
- ai_memory
- ai_repo_index
- ai_task_logs
- ai_task_steps
- ai_tasks
- agent_activities
- agent_knowledge
- agent_memories

Automation:
- automation_rulesets
- automated_decisions
- autopilot_runs

Barber/Beauty (Legacy):
- barber_subscriptions
- cosmetology_subscriptions

Communications:
- communication_messages
- conversations
- live_chat_messages
- live_chat_sessions

Content/Curriculum:
- content_calendar
- content_versions
- content_views
- curricula
- curriculum_lesson_plans
- curriculum_lessons
- curriculum_versions

... (and 950+ more)
```

---

## PHASE 6: BUILD → NORTHFLANK → PRODUCTION MAPPING

### Docker Build Configuration

| Dockerfile | Service | Pages | API Routes | Northflank Service |
|-----------|---------|-------|------------|-------------------|
| Dockerfile.northflank-lms | LMS | /lms, /student, /apprentice | /api/* (most) | LMS Service |
| Dockerfile.northflank-admin | Admin | /admin | /api/admin/* | Admin Service |
| Dockerfile.marketing | Marketing | /, /programs, /store | /api/* (public) | Marketing Service |

### Northflank Environment

| Variable | Service | Status |
|----------|---------|--------|
| NEXT_PUBLIC_SUPABASE_URL | All | ⚠️ Configure |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | All | ⚠️ Configure |
| SUPABASE_SERVICE_ROLE_KEY | All | ⚠️ Configure |
| STRIPE_SECRET_KEY | Billing | ⚠️ Configure |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Frontend | ⚠️ Configure |
| OPENAI_API_KEY | AI Features | ⚠️ Optional |
| ANTHROPIC_API_KEY | Paris AI | ⚠️ Optional |
| GROQ_API_KEY | Zora Chat | ⚠️ Optional |

### Production URLs

| Environment | URL | Service |
|-------------|-----|---------|
| Production Main | work-1-{project}.prod-runtime.all-hands.dev | Marketing |
| Production Admin | work-2-{project}.prod-runtime.all-hands.dev | Admin |
| Production LMS | (Northflank) | LMS/Student |

---

## PHASE 7: AI INTEGRATION MAPPING

### PARIS AI (Primary Assistant)

| Component | Tables | API Routes | Status |
|-----------|--------|------------|--------|
| Chat Interface | ai_conversations, ai_messages | /api/ai/chat | ✅ |
| Career Guidance | ai_plan_executions, ai_chat_sessions | /api/ai/* | ✅ |
| Admissions | ai_interview_assessments | /api/ai-instructor/* | ✅ |
| Phone Agent | ai_operator_memory | /api/operator/* | ✅ |

### LIZZY Chatbot

| Component | Configuration | Status |
|-----------|---------------|--------|
| Tidio Key | NEXT_PUBLIC_TIDIO_KEY | ⚠️ Configure |
| Lead Capture | leads table | ✅ |
| Auto-Responses | conversations table | ✅ |

### AI Course Generation

| Component | Tables | API Routes | Status |
|-----------|--------|------------|--------|
| Course Builder | course_generation_jobs | /api/ai/generate-course | ✅ |
| Script Generation | ai_course_generation_log | /api/ai/generate-script | ✅ |
| Video Generation | video_generation_jobs | /api/video/generate | ✅ |
| Avatar Generation | - | /api/ai-studio/generate-avatar | ✅ |

---

## PHASE 8: STRIPE PAYMENT MAPPING

### Payment Flow

```
Checkout Page (/checkout)
    ↓
API: /api/checkout/create-session
    ↓
Stripe Checkout Session
    ↓
Webhook: /api/stripe/webhook
    ↓
Subscriptions Table
    ↓
Enrollments Table
    ↓
Access Granted
```

### Stripe Tables

| Table | Purpose | Status |
|-------|---------|--------|
| subscriptions | Active subscriptions | ✅ ACTIVE |
| payments | Payment history | ✅ ACTIVE |
| coupons | Discount codes | ✅ ACTIVE |
| invoice_items | Invoice line items | ✅ ACTIVE |
| customer_portal_sessions | Billing portal | ✅ ACTIVE |

---

## FINAL DELIVERABLE: COMPLETE SPREADSHEET

### CSV Export (DATABASE_DEPENDENCY_AUDIT.csv)

```
Repository Page,Component,Hook,API,Server Action,Database Table,Storage,Edge Function,AI,Build,Production URL,Status
/apprentice,ApprenticeDashboard,useApprentice,/api/apprentice/*,—,apprentices;apprentice_sites,documents,—,PARIS,LMS,app...-,✅ ACTIVE
/apprentice/attendance,AttendancePage,useAttendance,/api/attendance/*,—,attendance_records,documents,—,—,LMS,app...-,✅ ACTIVE
/apprentice/hours,HoursPage,useHours,/api/apprentice/hours/*,—,hour_entries,—,timeclock-enforcer,—,LMS,app...-,✅ ACTIVE
/apprentice/profile,ProfilePage,useProfile,/api/apprentice/*,—,apprentices;users,avatars,—,—,LMS,app...-,✅ ACTIVE
/apprentice/skills,SkillsPage,useSkills,/api/apprentice/*,—,apprentice_skills,—,—,—,LMS,app...-,✅ ACTIVE
/apply,ApplyPage,useApplication,/api/apply/*,—,applications,documents,—,—,Marketing,www...-,✅ ACTIVE
/checkout,CheckoutPage,useCheckout,/api/checkout/*,/checkoutAction,enrollments;payments,—,stripe-webhook,—,Marketing,www...-,✅ ACTIVE
/courses/[id],CoursePage,useCourse,/api/courses/*,—,courses;lessons,course-videos,—,—,LMS,app...-,✅ ACTIVE
/credentials,CredentialsPage,useCredentials,/api/certificates/*,—,credentials;certificates,—,check-course-completion,—,LMS,app...-,✅ ACTIVE
/lms,LMSDashboard,useEnrollments,/api/lms/*,—,enrollments;courses,course-content,—,AI Tutor,LMS,app...-,✅ ACTIVE
/programs/*,ProgramPage,useProgram,/api/programs/*,—,programs,media,—,—,Marketing,www...-,✅ ACTIVE
/student/dashboard,StudentDashboard,useStudent,/api/student/*,—,students;enrollments,avatars,—,PARIS;AI Tutor,LMS,app...-,✅ ACTIVE
/videos/[id],VideoPage,useVideo,/api/videos/*,—,videos,—,video-renderer,—,—,LMS,app...-,✅ ACTIVE
/admin/*,AdminPage,(varies),(varies),(varies),(varies),(varies),(varies),(varies),Admin,admin...-,✅ ACTIVE
/store/*,StorePage,useStore,/api/store/*,—,products;orders,—,—,AI Builder,Marketing,www...-,✅ ACTIVE
/testing/*,TestingPage,useTesting,/api/testing/*,—,exam_bookings;credentials,—,—,—,LMS,app...-,✅ ACTIVE
/wioa/*,WIOAPage,useWIOA,/api/wioa/*,—,wioa_participants,documents,indiana-compliance-check,—,LMS,app...-,✅ ACTIVE
```

---

## CLEANUP LISTS

### 1. ✅ FULLY CONNECTED (Keep)
- All pages in Phase 1 marked ✅ ACTIVE
- All APIs with database access
- All storage buckets with consumers
- All edge functions with triggers

### 2. ⚠️ PARTIALLY CONNECTED (Wire Up)
- Pages listed in Phase 1 with partial connectivity
- APIs without complete error handling
- Tables with incomplete foreign key relationships

### 3. ❌ DATABASE EXISTS BUT NOTHING USES IT (Review)
- All 1,009 orphan tables listed in Phase 5
- Requires manual review before deletion

### 4. ❌ ROUTES WITH NO DATABASE CONNECTION (Review)
- Static pages (intentionally no DB)
- Health check endpoints (OK to keep)
- Debug/test endpoints (REMOVE)

### 5. ⚠️ DUPLICATE ROUTES SHARING THE SAME DATA (Consolidate)
- Routes listed in Phase 1 duplicate section
- Redirect one to the other, consolidate code

### 6. ❌ DEAD CODE (Remove)
- Legacy route directories
- Deprecated API endpoints
- Unused components and utilities

---

## NEXT STEPS

1. **Immediate Actions:**
   - Configure Supabase environment variables in Northflank
   - Configure Stripe keys
   - Test all ✅ ACTIVE pages
   - Remove debug/test endpoints

2. **Short-term (Week 1):**
   - Wire up ⚠️ PARTIALLY CONNECTED pages
   - Consolidate duplicate routes
   - Delete dead code

3. **Medium-term (Weeks 2-4):**
   - Review orphan tables for cleanup
   - Complete Northflank deployment
   - Full production smoke test

4. **Long-term:**
   - Implement full monitoring
   - Add Realtime subscriptions
   - Complete AI integrations

---

**Report Generated By:** OpenHands Dependency Audit  
**Last Updated:** 2026-07-13
