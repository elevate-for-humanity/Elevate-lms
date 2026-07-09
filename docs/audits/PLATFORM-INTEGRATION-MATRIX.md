# Platform Integration Matrix

**Elevate for Humanity - Production Readiness Audit**

---

## Complete Module Verification

| Module | Implemented | DB Connected | Storage | Auth | Northflank | Env Vars | APIs | Realtime | E2E Tested | Runtime OK |
|--------|-------------|--------------|---------|------|------------|----------|------|----------|-------------|------------|
| **PARIS AI** | ✅ | ✅ | - | ✅ | - | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Dev Studio** | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | - | ⚠️ | ⚠️ |
| **Course Builder** | ✅ | ✅ | - | ✅ | - | ⚠️ | ✅ | - | ⚠️ | ⚠️ |
| **Program Builder** | ✅ | ✅ | ⚠️ | ✅ | - | ⚠️ | ✅ | - | ⚠️ | ⚠️ |
| **CRM** | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Digital Binder** | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Enrollment** | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Orientation** | ✅ | ✅ | ✅ | ✅ | - | ⚠️ | ✅ | - | ⚠️ | ⚠️ |
| **LMS** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Career Services** | ✅ | ✅ | - | ✅ | - | ⚠️ | ✅ | - | ⚠️ | ⚠️ |
| **Employer Portal** | ✅ | ✅ | ✅ | ✅ | - | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Host Shop Portal** | ✅ | ✅ | ✅ | ✅ | - | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Testing Center** | ✅ | ✅ | ✅ | ✅ | - | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Payments/Stripe** | ✅ | ✅ | - | ✅ | - | ✅ | ✅ | - | ⚠️ | ⚠️ |
| **Notifications** | ✅ | ✅ | - | ✅ | - | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Admin Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **Marketing Site** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ⚠️ | ⚠️ |

---

## 1. Authentication Verification

### Users & Roles

| Check | Table | RLS | Status |
|-------|-------|-----|--------|
| User signup | `auth.users` | ✅ | ⚠️ Test |
| User login | `auth.users` | ✅ | ⚠️ Test |
| Password reset | `auth.users` | ✅ | ⚠️ Test |
| Email verification | `auth.users` | ✅ | ⚠️ Test |
| Session persistence | `auth.sessions` | ✅ | ⚠️ Test |
| Protected routes | `middleware.ts` | ✅ | ⚠️ Test |

### Role-Based Access

| Role | Table | Permissions | Status |
|------|-------|-------------|--------|
| Admin | `profiles.role='admin'` | Full access | ⚠️ Test |
| Student | `profiles.role='student'` | LMS + Career | ⚠️ Test |
| Employer | `profiles.role='employer'` | Employer Portal | ⚠️ Test |
| Partner | `profiles.role='partner'` | Partner Portal | ⚠️ Test |
| Host Shop | `profiles.role='host_shop'` | Host Shop Portal | ⚠️ Test |
| Apprentice | `profiles.role='apprentice'` | Apprenticeship | ⚠️ Test |
| Recruiter | `profiles.role='recruiter'` | CRM | ⚠️ Test |

---

## 2. Database Tables Audit

### Core Tables

| Table | Schema | FKs | Indexes | RLS | Migrations | Status |
|-------|--------|-----|----------|-----|------------|--------|
| `users` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `profiles` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `leads` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `inquiries` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `applications` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `enrollments` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `programs` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `program_versions` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `program_pricing` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `courses` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `modules` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `lessons` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `quizzes` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `assessments` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `certificates` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `credentials` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `digital_binders` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `binder_documents` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `payments` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `invoices` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `payment_schedules` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `subscriptions` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `job_postings` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `employer_matches` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `notifications` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `audit_logs` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `ai_sessions` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `ai_interviews` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `ai_recommendations` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `workflows` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `sops` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |

### Apprenticeship Tables

| Table | Schema | FKs | Indexes | RLS | Status |
|-------|--------|-----|----------|-----|--------|
| `apprenticeships` | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `apprentice_hours` | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `rti_records` | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `ojt_competencies` | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `host_shops` | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `employers` | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| `partners` | ✅ | ✅ | ✅ | ✅ | ⚠️ |

---

## 3. Storage Buckets

| Bucket | Purpose | Public | Files | Status |
|--------|---------|--------|-------|--------|
| `hero-videos` | Marketing videos | ✅ | ⚠️ | ⚠️ |
| `program-images` | Program photos | ✅ | ⚠️ | ⚠️ |
| `student-uploads` | User uploads | ❌ | ⚠️ | ⚠️ |
| `binder-documents` | Digital Binder | ❌ | ⚠️ | ⚠️ |
| `certificates` | Generated certs | ✅ | ⚠️ | ⚠️ |
| `logos` | Brand assets | ✅ | ⚠️ | ⚠️ |
| `marketing` | Website assets | ✅ | ⚠️ | ⚠️ |
| `orientation-videos` | Training videos | ✅ | ⚠️ | ⚠️ |
| `sop-attachments` | SOP files | ❌ | ⚠️ | ⚠️ |
| `employer-assets` | Employer logos/docs | ✅ | ⚠️ | ⚠️ |

---

## 4. Realtime Subscriptions

| Feature | Table | Subscription | Status |
|---------|-------|--------------|--------|
| Applications | `applications` | ✅ | ⚠️ Test |
| CRM Updates | `leads` | ✅ | ⚠️ Test |
| Notifications | `notifications` | ✅ | ⚠️ Test |
| Dashboard | `enrollments` | ✅ | ⚠️ Test |
| Attendance | `attendance` | ✅ | ⚠️ Test |
| Apprenticeship | `apprentice_hours` | ✅ | ⚠️ Test |
| Job Postings | `job_postings` | ✅ | ⚠️ Test |
| Digital Binder | `binder_documents` | ✅ | ⚠️ Test |

---

## 5. API Endpoints

### Core APIs

| Endpoint | Method | Auth | DB | Status |
|----------|--------|------|-----|--------|
| `/api/auth/*` | ALL | ✅ | ✅ | ⚠️ |
| `/api/paris` | POST | ✅ | ✅ | ⚠️ |
| `/api/paris/session` | GET/PATCH | ✅ | ✅ | ⚠️ |
| `/api/programs` | GET/POST | ✅ | ✅ | ⚠️ |
| `/api/courses/*` | ALL | ✅ | ✅ | ⚠️ |
| `/api/enrollment` | POST | ✅ | ✅ | ⚠️ |
| `/api/jobs/search` | GET | - | ✅ | ⚠️ |
| `/api/jobs/salary` | GET | - | ✅ | ⚠️ |
| `/api/payments/*` | ALL | ✅ | ✅ | ⚠️ |
| `/api/crm/*` | ALL | ✅ | ✅ | ⚠️ |
| `/api/digital-binder/*` | ALL | ✅ | ✅ | ⚠️ |
| `/api/admin/*` | ALL | Admin | ✅ | ⚠️ |
| `/api/devstudio/*` | ALL | Admin | ✅ | ⚠️ |

---

## 6. PARIS AI Capabilities

| Capability | API | Supabase | Storage | Status |
|------------|-----|----------|---------|--------|
| Read applicant data | `/api/paris` | ✅ | - | ⚠️ |
| Write interview results | `/api/paris` | ✅ | - | ⚠️ |
| Update applications | `/api/paris` | ✅ | - | ⚠️ |
| Generate recommendations | `/api/paris` | ✅ | - | ⚠️ |
| Create CRM activities | `/api/paris` | ✅ | - | ⚠️ |
| Create Binder records | `/api/paris` | ✅ | ✅ | ⚠️ |
| Trigger notifications | `/api/paris` | ✅ | - | ⚠️ |
| Route workflows | `/api/paris` | ✅ | - | ⚠️ |

---

## 7. End-to-End Workflow Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. MARKETING WEBSITE                                                │
│    / → /programs → /apply                                          │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. PARIS AI                                                         │
│    /paris → Inquiry → Interview → Recommendation                   │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. INQUIRY / LEAD                                                   │
│    Table: leads                                                     │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. APPLICATION                                                      │
│    Table: applications                                              │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. DOCUMENT UPLOAD                                                   │
│    Storage: student-uploads                                         │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. DIGITAL BINDER                                                   │
│    Table: digital_binders, binder_documents                         │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 7. ENROLLMENT                                                       │
│    Table: enrollments                                               │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 8. ORIENTATION                                                       │
│    Videos, checklists                                               │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 9. STUDENT DASHBOARD                                                │
│    /lms dashboard                                                   │
│    ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 10. LMS                                                              │
│     /lms/courses                                                    │
│     ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 11. CAREER SERVICES                                                  │
│     /lms/placement → Adzuna + O*NET + Internal                      │
│     ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 12. EMPLOYER PORTAL                                                  │
│     /employer                                                        │
│     ✅ Implemented  ⚠️ Need runtime test                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Supabase Services

| Service | Usage | Status |
|---------|-------|--------|
| Database | All tables | ✅ Configured |
| Auth | User management | ✅ Configured |
| Storage | File uploads | ✅ Configured |
| Realtime | Live updates | ✅ Configured |
| Edge Functions | API extensions | ⚠️ Check |
| Postgres | Primary DB | ✅ Configured |

---

## 9. Northflank Services

| Service | Dockerfile | Health Check | Status |
|---------|------------|--------------|--------|
| LMS | Dockerfile.northflank-lms | ✅ /api/health/northflank | ⚠️ |
| Admin | Dockerfile.northflank-admin | ✅ /api/health/northflank | ⚠️ |
| Marketing | Dockerfile.marketing | ✅ /api/health/northflank | ⚠️ |

---

## 10. Environment Variables

### Required in Northflank

| Variable | Service | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | ⚠️ Verify |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | ⚠️ Verify |
| `SUPABASE_SERVICE_ROLE_KEY` | All | ⚠️ Verify |
| `STRIPE_SECRET_KEY` | LMS/Admin | ⚠️ Verify |
| `STRIPE_WEBHOOK_SECRET` | LMS | ⚠️ Verify |
| `RESEND_API_KEY` | All | ⚠️ Verify |
| `OPENAI_API_KEY` | LMS | ⚠️ Verify |
| `ADZUNA_APP_ID` | LMS | ⚠️ Add |
| `ADZUNA_APP_KEY` | LMS | ⚠️ Add |
| `ONET_API_KEY` | LMS | ⚠️ Add |
| `USAJOBS_API_KEY` | LMS | ⚠️ Add |
| `NORTHFLANK_API_TOKEN` | Admin | ⚠️ Verify |
| `NORTHFLANK_PROJECT_ID` | Admin | ⚠️ Verify |
| `SENTRY_DSN` | All | ⚠️ Verify |

---

## Action Items

### Critical (Before Production)

- [ ] Add missing environment variables to Northflank
- [ ] Run database migrations on production
- [ ] Test authentication flow end-to-end
- [ ] Test PARIS → Application flow
- [ ] Test Course Builder → LMS publish
- [ ] Test job search API with Adzuna
- [ ] Verify all storage buckets have correct permissions
- [ ] Test realtime subscriptions

### Important (Before Launch)

- [ ] E2E test full enrollment flow
- [ ] Test employer portal
- [ ] Test apprenticeship workflow
- [ ] Verify Stripe payments
- [ ] Test digital binder document upload
- [ ] Verify notifications trigger correctly
- [ ] Test host shop portal

### Verification (Production)

- [ ] All health checks return 200
- [ ] No console errors in browser
- [ ] All API endpoints respond correctly
- [ ] Database queries perform well
- [ ] Storage files load correctly
- [ ] Realtime updates work
- [ ] Role-based access enforced
