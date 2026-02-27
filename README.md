# Elevate for Humanity — Workforce Operating System

> **Notice**
> This repository does not represent the complete production system.
> Elevate for Humanity provides managed platform access and restricted enterprise source-use under formal agreements.
> Public materials are provided for transparency, documentation, and evaluation only.

---

**Production URL:** https://www.elevateforhumanity.org
**Status:** Live and Operational
**Last Updated:** February 27, 2026

---

## Legal Entity

| Field | Value |
|-------|-------|
| **Legal Name** | 2Exclusive LLC-S |
| **DBA** | Elevate for Humanity Career & Training Institute |
| **EIN** | 88-2609728 |
| **RAPIDS Program** | 2025-IN-132301 |
| **Registration** | Registered (OA) — U.S. Department of Labor, Office of Apprenticeship |
| **Location** | 7009 E 56th St, Indianapolis, IN 46226 (Marion County) |
| **Sponsor Type** | Single Employer |

---

## What This Is

Elevate for Humanity operates a vertically integrated Workforce Operating System with a full LMS. The platform handles enrollment, course delivery, quizzes, grading, certificates, attendance, progress tracking, AI tutoring, government funding workflows, compliance reporting, employer partnerships, and employment outcomes.

### Registered Apprenticeship Occupations (RAPIDS)

| Occupation | RTI Hours | Provider | Method |
|------------|-----------|----------|--------|
| Building Services Technician | 432 | 2Exclusive LLC-S (206251) | Classroom / Shop / Web-Based |
| Hair Stylist | 154 | 2Exclusive LLC-S (206251) | Classroom / Shop / Web-Based |
| Barber | 260 | Elevate for Humanity (208029) | Classroom / Web-Based |
| Esthetician | 300 | Elevate for Humanity (208029) | Classroom / Web-Based |
| Nail Tech | 200 | Elevate for Humanity (208029) | Classroom / Web-Based |
| Youth Culinary | 144 | Elevate for Humanity (208029) | Classroom / Web-Based |

### Delivery Models

| Model | Description |
|-------|-------------|
| **Managed Platform Access** | Fully operated by Elevate for Humanity. Subscription-based. No source code access. |
| **Enterprise Source-Use** | Restricted source-use for qualified enterprises. Approval required. |

---

## Codebase (Verified Counts)

| Metric | Count |
|--------|-------|
| Pages (app/**/page.tsx) | 1,371 |
| API routes (app/api/**/route.ts) | 973 |
| React components | 800 |
| Library modules (lib/) | 664 |
| SQL migrations | 630 |
| Scripts | 860 |
| Static images | 1,032 |
| Video files (.mp4) | 143 |
| Documentation files (docs/) | 50 |
| Netlify serverless functions | 6 |
| LMS app sections | 50 |
| Program pages | 98 |
| Admin sections | 145 |
| Course definitions (with full lesson data) | 5 (Barber, HVAC, CDL, Medical Assistant, Workforce Readiness) |

---

## Tech Stack

### Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| UI | React | 19.2.1 |
| CSS | Tailwind CSS | 3.4.18 |
| State | Zustand | 5.0.9 |
| Forms | React Hook Form + Zod | 7.66.1 / 4.1.12 |
| Database | Supabase (PostgreSQL + Auth + RLS) | — |
| Payments | Stripe | 19.3.1 |
| Email | Resend | 6.4.2 |
| AI | OpenAI | 6.9.1 |
| Monitoring | Sentry | 10.32.1 |
| Hosting | Netlify (Serverless) | — |
| Package Manager | pnpm | 10.28.2 |
| Node.js | — | 20.19.2 |

### Integrations

Stripe (payments, subscriptions, webhooks), Affirm (BNPL), Resend (transactional email), OpenAI (AI tutors), Supabase (database, auth, storage, realtime), Sentry (error tracking), Netlify (hosting, edge functions, serverless), JotForm (intake forms).

---

## Ecosystem Entities

| Entity | Type | Purpose |
|--------|------|---------|
| **2Exclusive LLC-S** | Legal Entity / Sponsor | RAPIDS-registered apprenticeship sponsor, parent entity |
| **Elevate for Humanity Career & Training Institute** | DBA / Training Provider | Instruction, RTI delivery, LMS, workforce programs |
| **Selfish Inc.** | 501(c)(3) Nonprofit | Mental wellness services and community support |
| **The Rise Foundation** | DBA of Selfish Inc. | VITA site — free tax preparation and community education |
| **Supersonic Fast Cash LLC** | Employer | Tax preparation services, hires tax prep graduates |
| **Curvature Body Sculpting** | Employer | Body sculpting services + Meri-Gold-Round wellness products |

---

## Platform Capabilities

### LMS (Learning Management)

- Course catalog with 27+ programs across healthcare, skilled trades, CDL, barbering, technology, business
- 5 fully built course definitions with lesson-level content (Barber: 260 RTI hrs, HVAC: 432 hrs, CDL, Medical Assistant, Workforce Readiness)
- Video-based lessons with per-lesson progress tracking
- Quiz engine with pass thresholds, explanations, retry
- Certificate generation and verification
- Attendance tracking (clock-in, instructor record, export)
- AI tutoring and adaptive learning
- Student dashboard with progress analytics
- 50 LMS app sections (achievements, assignments, calendar, certificates, chat, community, courses, etc.)

### Enrollment

- Multi-step application forms with funding eligibility
- WIOA, WRG, JRI funding workflow integration
- Stripe payment processing (cards, ACH, Apple Pay, Google Pay)
- Affirm buy-now-pay-later
- Approval workflows and waitlist management
- Enrollment status tracking

### Compliance & Reporting

- WIOA performance reporting
- DOL apprenticeship compliance (29 CFR Part 29/30)
- RTI attendance tracking per session per student
- OJT hour logs
- Competency rubric evaluations
- Credential attainment documentation
- Monthly progress summaries for referring agencies
- Audit logs

### Stakeholder Portals

- Student portal
- Admin panel (145 sections)
- Program Holder dashboard
- Employer/Partner portal
- Staff operations
- Workforce Board reporting
- Delegate (sub-office) management

### Apprenticeship Management

- RAPIDS-registered program (2025-IN-132301)
- Apprentice registration and tracking (3 registered)
- Hour logging (RTI + OJT)
- Wage schedule management
- Sponsor disclosure on all apprenticeship pages
- Institutional governance documentation

---

## Revenue Model

| Stream | Details |
|--------|---------|
| Government Funding | WIOA, WRG, JRI, EmployIndy contracts |
| Program Holder Revenue Share | Partners receive 1/3 (33.33%) of net program revenue per student |
| Credential Course Markup | 50/50 split on add-on certification courses |
| Self-Pay / Stripe | Direct enrollment payments |
| Platform Licensing | Managed Enterprise LMS ($1,500–$3,500/month) |
| Supersonic Fast Cash | Tax preparation and refund advance services |
| Curvature Body Sculpting | Body sculpting + Meri-Gold-Round products |

**Funding Disclosure:** Training may be fully funded for eligible participants through workforce programs such as WIOA, JRI, and approved funding partners. Eligibility and funding determinations are subject to program and agency guidelines.

---

## Quick Start

### Prerequisites
- Node.js 20+ (< 25)
- pnpm 10+
- Supabase account
- Stripe account (for payments)

### Installation

```bash
git clone https://github.com/elevateforhumanity/Elevate-lms.git
cd Elevate-lms
pnpm install
cp .env.example .env.local
# Edit .env.local with your credentials
pnpm dev
```

Visit http://localhost:3000

### Environment Variables

See `.env.example` for the complete list. Key variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Project Structure

```
Elevate-lms/
├── app/                          # Next.js App Router (1,371 pages + 973 API routes)
│   ├── admin/                    # Admin panel (145 sections)
│   ├── api/                      # API routes
│   ├── apprenticeships/          # Apprenticeship landing
│   ├── courses/                  # Course catalog
│   ├── institutional-governance/ # Governance & compliance page
│   ├── lms/(app)/                # LMS application (50 sections)
│   ├── partners/                 # Partner pages
│   ├── programs/                 # Training programs (98 pages)
│   ├── verification-approvals/   # Verification & approvals page
│   └── ...
├── components/                   # React components (800 files)
│   ├── compliance/               # SponsorDisclosure, compliance blocks
│   ├── marketing/                # PublicLandingPage, ProgramCatalog
│   ├── programs/                 # ProgramPageLayout, ProgramCard
│   ├── site/                     # Header, Footer, navigation
│   └── ...
├── lib/                          # Utilities & business logic (664 modules)
│   ├── courses/                  # Course definitions, quiz banks
│   ├── programs/                 # Program data, pricing, catalog
│   ├── supabase/                 # Database clients
│   └── ...
├── supabase/migrations/          # SQL migrations (630 files)
├── netlify/functions/            # Serverless functions (6)
├── scripts/                      # Automation scripts (860)
├── public/                       # Static assets (1,032 images, 143 videos)
├── docs/                         # Documentation (50 files)
└── data/                         # Static data (team, programs)
```

---

## Common Commands

```bash
# Development
pnpm dev                  # Start dev server (Turbopack)
pnpm build                # Production build
pnpm start                # Start production server
pnpm lint                 # Run ESLint
pnpm typecheck            # TypeScript checking

# Database
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed database
pnpm db:check             # Check database status

# Testing
pnpm test                 # Run tests
pnpm test:e2e             # End-to-end tests
pnpm test:smoke           # Smoke tests

# Quality
pnpm verify               # Pre-deployment checks
pnpm health               # Health check
pnpm doctor               # Diagnose issues
pnpm readiness            # Readiness report
```

---

## Security

- Supabase Auth with JWT tokens
- Row Level Security (RLS) policies on all tables
- HTTPS enforced via Netlify
- CSRF protection (Next.js built-in)
- Input validation (Zod schemas)
- Parameterized queries (SQL injection prevention)
- API rate limiting
- Audit logging on critical actions
- PCI DSS compliance via Stripe
- FERPA-aligned student data protection
- WIOA compliance reporting

---

## Deployment

Push to `main` triggers automatic Netlify deployment. Environment variables are configured in the Netlify dashboard. Database migrations are managed through Supabase.

---

## Institutional Pages

| Page | URL | Purpose |
|------|-----|---------|
| Institutional Governance | /institutional-governance | Legal structure, org chart, RTI table, governance framework |
| Verification & Approvals | /verification-approvals | RAPIDS, EIN, RTI providers, registered occupations, state alignment |
| Compliance & Security | /compliance | Security posture and compliance documentation |
| Privacy Policy | /privacy-policy | 14-section policy with FERPA, WIOA, cookies |

---

## Licensing

Elevate for Humanity provides licensed access to enterprise platforms it operates. Ownership of software, infrastructure, and intellectual property is not transferred.

| License Type | Details |
|-------------|---------|
| **Managed Platform Access** | Subscription-based, fully operated, no source code access |
| **Enterprise Source-Use** | Restricted source-use, enterprise-only, approval required, starts at $75,000 |

**Managed Enterprise LMS Pricing:**
- Setup: $7,500–$15,000 (one-time)
- Subscription: $1,500–$3,500/month
- Non-payment: automatic suspension

---

## Support

- **Issues:** https://github.com/elevateforhumanity/Elevate-lms/issues
- **Email:** info@elevateforhumanity.org
- **Website:** https://www.elevateforhumanity.org/support
- **Phone:** (317) 314-3757

---

**License:** Proprietary — All rights reserved by 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute.
