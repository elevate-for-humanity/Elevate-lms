# Elevate Admin Dashboard - Complete Audit Report

**Generated:** 2026-07-30  
**Last Commit:** `47b5599d03`  
**Repository:** https://github.com/elevate-for-humanity/Elevate-lms

---

## 1. REPOSITORY OVERVIEW

| Field | Value |
|-------|-------|
| **Repository Name** | Elevate-lms |
| **GitHub URL** | https://github.com/elevate-for-humanity/Elevate-lms |
| **Main Branch** | main |
| **TypeScript Files** | 753 |
| **Database Migrations** | 820 |
| **Admin Pages** | 147 directories |

---

## 2. ADMIN DASHBOARD STRUCTURE

### 2.1 App Architecture

```
apps/admin/
├── app/                    # Next.js 15 App Router (148 directories)
│   ├── api/               # API Routes
│   ├── components/        # Reusable components
│   └── [147 pages]        # All admin sections
├── lib/                   # Utilities (auth, native-modules)
├── public/               # Static assets
└── package.json           # Dependencies
```

### 2.2 Technology Stack

| Component | Version |
|-----------|---------|
| **Next.js** | 15.5.15 |
| **React** | 19.2.7 |
| **TypeScript** | 5.x |
| **Tailwind CSS** | 3.4.18 |
| **Node.js** | 22.x (in Docker) |

### 2.3 Native Dependencies (for PDF generation, images)

- `@napi-rs/canvas` - Canvas API bindings
- `pdfkit` - PDF generation
- `fontkit` - Font rendering
- `sharp` - Image processing
- `ws` - WebSocket support

---

## 3. ADMIN PAGES (147 Sections)

### 3.1 Core Student Management

| Page | Path | Purpose |
|------|------|---------|
| Students | `/students` | Student directory & profiles |
| Enrollments | `/enrollments` | Manage course enrollments |
| Applications | `/applications` | Student applications |
| Program Holders | `/program-holders` | Program participants |
| Barber Shop Applications | `/barber-shop-applications` | Apprenticeship applications |
| Waitlist | `/waitlist` | Waiting list management |

### 3.2 Programs & Courses

| Page | Path | Purpose |
|------|------|---------|
| Programs | `/programs` | Training programs (Healthcare, Trades, Beauty) |
| Courses | `/courses` | Individual courses |
| Curriculum | `/curriculum` | Course curriculum builder |
| Modules | `/modules` | Course modules |
| Learning Paths | `/learning-paths` | Student learning journeys |
| Career Courses | `/career-courses` | Career-focused courses |
| Gradebook | `/gradebook` | Student grades |

### 3.3 Apprenticeship System

| Page | Path | Purpose |
|------|------|---------|
| Apprenticeships | `/apprenticeships` | Apprenticeship management |
| Host Shop | `/host-shop` | Host shop portal |
| Barbershops | `/barbershops` | Barber shop management |
| Student Hours | `/student-hours` | Track apprenticeship hours |
| Timeclock | `/timeclock` | Time tracking |
| Hours Export | `/hours-export` | Export hour reports |

### 3.4 Employment & Workforce

| Page | Path | Purpose |
|------|------|---------|
| Employers | `/employers` | Employer directory |
| Workforce | `/workforce` | Workforce development |
| Job Board | `/marketplace` | Job postings |
| JRI | `/jri` | Job-related initiatives |
| Instructors | `/instructors` | Instructor management |
| Staff Portal | `/staff-portal` | Staff tools |

### 3.5 Financial & Billing

| Page | Path | Purpose |
|------|------|---------|
| Billing | `/billing` | Billing management |
| Invoices | `/billing/invoices` | Invoice management |
| Subscriptions | `/billing/subscriptions` | Recurring billing |
| Licenses | `/licenses` | License management |
| Promo Codes | `/promo-codes` | Discount codes |
| Store | `/store` | E-commerce products |

### 3.6 Testing & Credentials

| Page | Path | Purpose |
|------|------|---------|
| Testing Center | `/testing-center` | Test scheduling |
| Testing | `/testing` | Test management |
| Exam Authorizations | `/exam-authorizations` | Exam permissions |
| Certificates | `/certificates` | Student certificates |
| Credentials | `/credentials` | Credential management |
| Instructor Credentials | `/instructor-credentials` | Instructor certs |

### 3.7 Compliance & Legal

| Page | Path | Purpose |
|------|------|---------|
| Contracts | `/contracts` | Contract management |
| Compliance | `/compliance` | Compliance tracking |
| FERPA | `/ferpa` | Student privacy |
| Accreditation | `/accreditation` | Accreditation docs |
| MOU | `/mou` | Memoranda of Understanding |
| Signatures | `/signatures` | E-signatures |

### 3.8 CRM & Communications

| Page | Path | Purpose |
|------|------|---------|
| CRM | `/crm` | Customer relationship management |
| Communications | `/communications` | Communications center |
| Email Marketing | `/email-marketing` | Email campaigns |
| Inbox | `/inbox` | Message inbox |
| Notifications | `/notifications` | Notification center |
| Referrals | `/referrals` | Referral tracking |

### 3.9 Partners & Franchises

| Page | Path | Purpose |
|------|------|---------|
| Partners | `/partners` | Partner management |
| Franchises | `/franchises` | Franchise management |
| Tenants | `/tenants` | Multi-tenant support |
| Shops | `/shops` | Shop management |
| Affiliates | `/affiliates` | Affiliate tracking |

### 3.10 Funding & Grants

| Page | Path | Purpose |
|------|------|---------|
| Funding | `/funding` | Funding programs |
| WIOA | `/wioa` | Workforce Innovation Act |
| Grants | `/grants` | Grant management |
| Funding Verification | `/funding-verification` | Verify funding |
| Scholarships | `/scholarships` | Scholarship programs |
| Barriers | `/barriers` | Career barriers |

### 3.11 Reports & Analytics

| Page | Path | Purpose |
|------|------|---------|
| Analytics | `/analytics` | Platform analytics |
| Reports | `/reports` | Report generation |
| Gradebook | `/gradebook` | Student grades |
| Cohorts | `/cohorts` | Student cohorts |
| Activity | `/activity` | Activity logs |
| Audit Logs | `/audit-logs` | System audit trail |

### 3.12 Dev Studio & Tools

| Page | Path | Purpose |
|------|------|---------|
| Dev Studio | `/dev-studio` | Developer workspace |
| Studio | `/studio` | Content studio |
| CFD Studio | `/cfd-studio` | Course flow designer |
| Advanced Tools | `/advanced-tools` | Admin tools |
| Video Generator | `/video-generator` | AI video creation |
| Course Import | `/course-import` | Import courses |

### 3.13 AI & Automation

| Page | Path | Purpose |
|------|------|---------|
| Paris | `/paris` | AI career guidance |
| Ellie | `/inbox` (AI) | AI assistant |
| AI Agents | `/dev-studio` | AI agent management |
| Workflows | `/workflows` | Automation workflows |
| Autopsy | `/autopilot` | Automated tasks |

### 3.14 System Administration

| Page | Path | Purpose |
|------|------|---------|
| Admin | `/admin` | Platform administration |
| Settings | `/settings` | System settings |
| Staff | `/staff` | Staff management |
| Security | `/security` | Security settings |
| Integrations | `/integrations` | Third-party integrations |
| System Health | `/system-health` | Health monitoring |
| Mission Control | `/mission-control` | System control center |

---

## 4. API ROUTES

### 4.1 API Structure

```
/api/
├── admin/       # Admin operations
├── auth/        # Authentication
├── health/      # Health checks
├── paris/       # AI guidance system
├── storage/     # File storage
├── webhooks/    # External webhooks
├── profile/     # User profiles
└── version/     # Version info
```

### 4.2 Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/health/native` | Verify native modules work |
| `/api/paris/*` | Paris AI career guidance |
| `/api/admin/*` | Admin operations |

---

## 5. DATABASE SCHEMA (820 Migrations)

### 5.1 Core Tables

| Category | Table Count | Key Tables |
|----------|-------------|------------|
| **Users & Auth** | 15+ | profiles, users, sessions, team_members |
| **Students** | 20+ | students, enrollments, applications |
| **Programs** | 25+ | programs, courses, modules, lessons |
| **Apprenticeships** | 30+ | apprentices, host_shops, hour_entries |
| **Financial** | 20+ | invoices, payments, subscriptions, licenses |
| **CRM** | 15+ | contacts, leads, opportunities |
| **Content** | 20+ | pages, posts, media, documents |
| **Workforce** | 25+ | employers, jobs, referrals, ieps |
| **Compliance** | 15+ | contracts, signatures, compliance_items |
| **AI/Automation** | 20+ | workflows, agents, conversations |

### 5.2 Key Migrations (Recent)

| Date | File | Purpose |
|------|------|---------|
| 2026-08-16 | `20260816000001_paris_schema.sql` | Paris AI system |
| 2026-08-16 | `20260816000002_paris_media_schema.sql` | AI media storage |
| 2026-08-15 | `20260815000001_comprehensive_rls_policies.sql` | Security policies |
| 2026-08-10 | `20260810000006_host_shop_subscriptions.sql` | Host shop billing |
| 2026-08-10 | `20260810000001_ai_agents_dev_studio.sql` | AI agent system |
| 2026-08-10 | `20260810000002_course_generation_pipeline.sql` | AI course creation |
| 2026-08-10 | `20260810000004_unified_control_plane.sql` | Platform control |
| 2026-08-08 | `20260808000001_studio_audit_fixes.sql` | Studio fixes |
| 2026-07-30 | `20260730000001_notification_outbox.sql` | Notifications |

---

## 6. CONFIGURATION FILES

### 6.1 Root Configuration

```json
{
  "name": "@elevate/admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "next lint"
  }
}
```

### 6.2 Key Files

| File | Purpose |
|------|---------|
| `Dockerfile.northflank-admin` | Production Docker build |
| `tailwind.config.js` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `middleware.ts` | Request middleware |

---

## 7. INTEGRATIONS

### 7.1 Connected Services

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| **Supabase** | Database | PostgreSQL, Auth, Storage |
| **Stripe** | Payments | Billing, subscriptions |
| **Northflank** | Hosting | Docker containers |
| **GitHub** | CI/CD | Deployment pipeline |

### 7.2 Feature Flags

| Feature | Status |
|---------|--------|
| RLS Policies | Active |
| Multi-tenancy | Active |
| AI Agents | Active |
| Course Generation | Active |
| Host Shop Portal | Active |
| Paris AI | Active |

---

## 8. WHAT YOU CAN MANAGE

### 8.1 Student Lifecycle

```
Application → Enrollment → Training → Completion → Career
     ↓            ↓           ↓          ↓           ↓
  Programs    Payments    Courses   Certificates  Jobs
  Funding     Progress    Attendance  Credentials  Employers
```

### 8.2 Programs Available

| Category | Programs |
|----------|----------|
| **Healthcare** | Medical Assistant, Phlebotomy, EKG, Pharmacy Tech |
| **Trades** | HVAC, EPA 608, CDL, Welding, Building Tech |
| **Beauty** | Barber, Cosmetology, Esthetics, Manicurist |
| **Testing** | ACT WorkKeys, CPR, EPA, Certiport |
| **Career** | Tax Prep, Bookkeeping, Business |

### 8.3 Funding Sources

- WIOA (Workforce Innovation)
- Trade Act
- Scholarships
- Payment Plans
- Employer Sponsorship

---

## 9. HOW TO ACCESS

### 9.1 URLs

| Environment | URL |
|-------------|-----|
| **Admin Dashboard** | https://admin.elevateforhumanity.org |
| **Marketing** | https://www.elevateforhumanity.org |
| **Student LMS** | https://app.elevateforhumanity.org |

### 9.2 Required Access

| Service | Access Needed |
|---------|---------------|
| Admin Dashboard | Supabase Auth (admin role) |
| Code Changes | GitHub repo access |
| Database | Supabase project access |
| Deployment | Northflank project access |
| Payments | Stripe dashboard |

---

## 10. QUICK START GUIDE

### For Content Management:
1. Login to admin.elevateforhumanity.org
2. Navigate to Programs, Courses, or Curriculum
3. Edit content directly in the dashboard

### For Student Management:
1. Navigate to Students or Enrollments
2. View/update student profiles
3. Track progress and payments

### For Code Changes:
1. Clone: `git clone https://github.com/elevate-for-humanity/Elevate-lms`
2. Branch: `git checkout -b fix/your-fix`
3. Edit code
4. Push: `git push origin fix/your-fix`
5. Northflank auto-deploys

---

## 11. SUMMARY

| Metric | Count |
|--------|-------|
| Total Pages | 147 |
| TypeScript Files | 753 |
| Database Migrations | 820 |
| API Routes | 40+ |
| Programs Supported | 15+ |
| Integrations | 5+ |

**Platform Status:** ✅ Active Production  
**Last Deployment:** `47b5599d03`  
**Build System:** Northflank (Docker)  
**Database:** Supabase (PostgreSQL)

---

*This audit was generated from the codebase at commit `47b5599d03`*
