# Platform Relationship Map

## Overview
Elevate LMS unified platform architecture connecting PARIS AI, Dev Studio, Course Builder, Program Builder, LMS, CRM, Enrollment, Career Services, and Employer Portal.

---

## Module Dependency Map

### 1. PARIS AI (Personalized AI Recruitment, Interview & Success System)

**Purpose:** AI intelligence layer for the entire platform

**Dependencies:**
- Supabase (ai_sessions, interviews, recommendations tables)
- OpenAI/Claude API
- O*NET API (career data)
- Adzuna API (job matching)

**Exposes:**
- `/api/paris` - Main chat endpoint
- `/api/paris/session` - Session management

**Consumes:**
- `/api/programs` - Program data
- `/api/enrollment` - Enrollment status
- `/api/jobs/search` - Job matching

**Triggers:**
- Application flow
- Enrollment workflow
- Career recommendations
- Student success coaching

---

### 2. Dev Studio

**Purpose:** Platform control center - manages all builders

**Workspaces:**
| Workspace | Purpose | Connects To |
|-----------|---------|-------------|
| Studio | AI conversations | PARIS |
| Workflows | Automation monitoring | All systems |
| Command | CLI operations | Deployment |
| Deploy | Service deployment | Northflank |
| Files | Code editor | Git |
| Container | Environment management | Docker |
| Health | System monitoring | All services |
| Secrets | API key management | All APIs |
| Integrations | Third-party connections | External services |
| Career AI | Job market intelligence | Adzuna, O*NET |

**Dependencies:**
- Git repository
- Northflank API
- Supabase (studio_configs, workflows)

---

### 3. Course Builder

**Purpose:** AI-powered course generation

**Connects To:**
| System | Purpose |
|--------|---------|
| O*NET | SOC codes, career context |
| Credential DB | Certificate generation |
| LMS | Lesson storage |
| Digital Binder | Competency tracking |
| Program Builder | Program-course linking |

**Workflow:**
```
Input → O*NET lookup → AI generation → Blueprint → Lessons → LMS
```

**Tables:**
- `courses`
- `modules`
- `lessons`
- `quizzes`
- `course_blueprints`

---

### 4. Program Builder

**Purpose:** Program creation and management

**Generates:**
- Program pages
- Pricing tiers
- Stripe products
- Funding rules
- SOC codes (from O*NET)
- Career outcomes
- Document requirements
- SEO metadata

**Dependencies:**
- O*NET (occupations)
- Stripe (products)
- Course Builder (curriculum)
- SEO system

**Tables:**
- `programs`
- `program_versions`
- `program_pricing`

---

### 5. Career Services

**Purpose:** Job matching and career placement

**Aggregates From:**
| Source | Data Type | Status |
|--------|-----------|--------|
| Internal DB | Employer postings | ✅ Connected |
| O*NET | Career data, skills | ✅ Connected |
| Adzuna | Real-time jobs | ✅ Connected (needs config) |
| USAJOBS | Federal jobs | ✅ Connected (needs config) |
| CareerOneStop | Training programs | ✅ Connected (needs config) |

**Exposes:**
- `/api/jobs/search` - Job search
- `/api/jobs/salary` - Salary insights
- `/lms/placement` - Student job board

**Tables:**
- `job_postings`
- `employer_matches`

---

### 6. Enrollment System

**Purpose:** Student enrollment workflow

**Flows Into:**
- Digital Binder
- Orientation
- LMS
- Payment processing
- CRM

**Tables:**
- `enrollments`
- `applications`
- `payment_schedules`

---

### 7. Digital Binder

**Purpose:** Student document management

**Sections:**
- Documents
- Handbooks
- Certifications
- Competencies
- Compliance records

**Tables:**
- `digital_binders`
- `binder_documents`

---

### 8. CRM

**Purpose:** Lead and relationship management

**Tables:**
- `leads`
- `applications`
- `contacts`
- `activities`

**Connects To:**
- PARIS (chat history)
- Enrollment (applications)
- Career Services (job matches)

---

## API Dependency Graph

```
                    ┌─────────────┐
                    │   PARIS     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐       ┌─────────┐
   │Program  │        │Career   │       │Enrollment│
   │Builder  │        │Services │       │         │
   └────┬────┘        └────┬────┘       └────┬────┘
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐       ┌─────────┐
   │Course   │        │Adzuna   │       │Digital  │
   │Builder  │        │O*NET    │       │Binder   │
   └────┬────┘        └─────────┘       └────┬────┘
        │                                    │
        ▼                                    ▼
   ┌─────────┐                         ┌─────────┐
   │  LMS    │                         │  CRM    │
   └─────────┘                         └─────────┘
```

---

## Database Ownership

| Module | Tables Owned |
|--------|-------------|
| PARIS | ai_sessions, interviews, ai_recommendations |
| Programs | programs, program_versions, program_pricing |
| Courses | courses, modules, lessons, quizzes, assessments |
| Careers | job_postings, employer_matches, career_pathways |
| Enrollment | enrollments, applications, applications_wioa |
| Digital Binder | digital_binders, binder_documents |
| CRM | leads, contacts, activities, opportunities |
| Payments | payments, payment_schedules, invoices |
| Certificates | certificates, credentials |
| Compliance | compliance_records, audit_logs |

---

## Unified Workflow

```text
Dev Studio (Control Center)
         │
         ├──────────────────────────────┐
         ▼                              ▼
   Program Builder                 Course Builder
         │                              │
         ▼                              ▼
   Website Pages              LMS Lessons
         │                              │
         ▼                              ▼
   PARIS Interview ◄─────────────────┘
         │
         ▼
   Application
         │
         ▼
   Enrollment
         │
         ├──────────────────────────────┐
         ▼              ▼              ▼
   Digital Binder   Orientation   Payment
         │              │              │
         └──────────────┴──────────────┘
                      │
                      ▼
                   Student Dashboard
                      │
                      ▼
              ┌───────────────┐
              ▼               ▼
         LMS            Career Services
                                   │
                                   ▼
                            Employer Portal
```

---

## Missing Integrations (To Complete)

| Integration | Status | Action Required |
|------------|--------|-----------------|
| Adzuna → Career Services | Partial | Add API keys to Northflank |
| USAJOBS → Career Services | Partial | Add API key to Northflank |
| CareerOneStop → Programs | Partial | Add credentials to Northflank |
| PARIS → Dev Studio | Needs UI | Add PARIS chat to Dev Studio |
| Program Builder → Stripe | Needs wiring | Connect product creation |
| Course Builder → Certificates | Needs wiring | Auto-generate cert templates |

---

## Configuration Required

### Northflank Environment Variables

```
# Adzuna (Job Search)
ADZUNA_APP_ID=08a9335d
ADZUNA_APP_KEY=28030c1d03fb93ea04b599fabb5f6e6e
ADZUNA_COUNTRY=us

# O*NET (Career Data)
ONET_API_KEY=jkkII-vDFMZ-Dd32X-REn8d

# USAJOBS (Federal Jobs)
USAJOBS_API_KEY=R1Ts/qetIIfiHwj2F0MXZy8IamqfvVKT7AGRKYR6tc4=

# CareerOneStop (Training Programs)
CAREERONESTOP_USER_ID=xmXrnhnrnn4DZNX
CAREERONESTOP_API_KEY=[token]
```

---

## Activation Checklist

For each module, verify:

- [ ] UI is complete
- [ ] API endpoints connected
- [ ] Database reads working
- [ ] Database writes working
- [ ] Permissions enforced
- [ ] Notifications configured
- [ ] Auditing enabled
- [ ] Logging enabled
- [ ] PARIS integrated
- [ ] Dev Studio integrated
- [ ] Active in production workflow

---

## Next Steps

1. Add environment variables to Northflank
2. Redeploy LMS service
3. Test Adzuna API endpoints
4. Verify PARIS → Career Services flow
5. Connect Program Builder → Stripe (if needed)
6. Add PARIS chat to Dev Studio workspace
