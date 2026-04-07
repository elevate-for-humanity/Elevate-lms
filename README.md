# Elevate for Humanity — Workforce Operating System

> **Repository Notice**
> This repository is published for transparency, security review, and platform documentation.
> It does not contain the complete production system. External contributions are not accepted.
> Access to the live platform requires a formal managed access or enterprise source-use agreement.
> See [docs/repository-scope.md](docs/repository-scope.md) for what is and is not included here.

---

**Production:** [elevateforhumanity.org](https://www.elevateforhumanity.org)
**Status:** Live and Operational — Indianapolis, Indiana
**Branch:** `main` — single consolidated branch

---

## What This Is

Elevate for Humanity operates a vertically integrated **Workforce Operating System** — not a course catalog, not a generic LMS. The platform handles the full operational stack for workforce credential delivery:

- **Training delivery** — cohort scheduling, video lessons, quizzes, attendance, progress tracking
- **Enrollment and funding** — WIOA, Workforce Ready Grant, JRI, and employer-sponsored intake workflows
- **Compliance and reporting** — DOL apprenticeship (RAPIDS), WIOA performance metrics, RTI hour logs, audit trails
- **Credentialing** — EPA 608, OSHA 10/30, CompTIA A+/Security+, PTCB CPhT, Microsoft Office Specialist, WorkKeys NCRC, Certiport, Indiana ISDH, Indiana BMV
- **Stakeholder portals** — learner, admin, instructor, employer, program holder, partner, mentor, staff, parent/guardian
- **Employer pipeline** — job postings, OJT agreements, placement tracking, 6- and 12-month outcome reporting

Programs run 4–18 weeks. Most are fully funded at no cost to eligible participants through federal and Indiana state workforce programs.

---

## Who It Serves

| Stakeholder | Role |
|-------------|------|
| **Adult learners** | Career changers, dislocated workers, justice-involved individuals, youth 16–24 |
| **Workforce agencies** | WorkOne, Indiana DWD, EmployIndy — referring and funding participants |
| **Employers** | Hiring partners, OJT sponsors, apprenticeship co-sponsors |
| **Program holders** | Community organizations delivering training under Elevate's infrastructure |
| **Government** | DOL Office of Apprenticeship, WIOA Title I administrators |
| **Parents / Guardians** | Monitoring progress of enrolled youth participants |

---

## Training Programs

| Program | Credential | Funding |
|---------|-----------|---------|
| HVAC Technician | EPA Section 608 Universal | WIOA · WRG |
| Certified Nursing Assistant | Indiana ISDH CNA | WIOA · WRG |
| Peer Recovery Support Specialist | CPRC Pathway | WIOA · JRI |
| Barber Apprenticeship | Indiana Barber License | DOL Apprenticeship |
| Hair Stylist Apprenticeship | Indiana Cosmetology License | DOL Apprenticeship |
| Esthetician Apprenticeship | Indiana Esthetician License | DOL Apprenticeship |
| CDL Training | Commercial Driver's License | WIOA · EmployIndy |
| IT Help Desk | CompTIA A+ | WIOA · WRG |
| Cybersecurity | CompTIA Security+ | WIOA · WRG |
| Pharmacy Technician | PTCB CPhT | WIOA · WRG |
| Microsoft Office Specialist | MOS Certification | WIOA · WRG |
| Business & Finance | Bookkeeping / Accounting | WIOA |
| Youth Culinary | ServSafe + Culinary Skills | DOL Apprenticeship |

Programs are delivered directly by Elevate for Humanity or through approved training providers and are aligned with applicable credentialing body requirements.

---

## Access Model

| Access Type | Description |
|-------------|-------------|
| **Managed Platform Access** | Fully operated by Elevate for Humanity. Subscription-based. No source code access. $1,500–$3,500/month + setup. |
| **Enterprise Source-Use** | Restricted source-use license for qualified enterprises. Approval required. Starts at $75,000. |
| **Public Transparency** | This repository. Structural and documentation visibility only. Not a deployable copy of production. |

See [docs/access-model.md](docs/access-model.md) for full terms.

---

## Core Capabilities

### Learning Management
- Blueprint-driven course engine — programs defined in code, rendered automatically with no per-program logic
- Video lessons, quiz engine with pass thresholds, checkpoint gating, lab/assignment instructor sign-off
- AI tutoring, adaptive flashcards, spaced repetition review, notes, downloadable resources
- Certificate generation, public credential verification at `/verify/[certificateId]`
- Attendance clock-in, instructor records, cohort scheduling

### Enrollment and Funding
- Multi-step application with funding eligibility screening
- WIOA, Workforce Ready Grant, JRI, and Next Level Jobs workflow integration
- Stripe payments (cards, ACH, Apple Pay, Google Pay) and Affirm BNPL
- Approval workflows, waitlist management, enrollment status tracking
- Parent/guardian portal for monitoring youth participant progress

### Compliance and Reporting
- DOL Registered Apprenticeship (RAPIDS 2025-IN-132301) — RTI hour logs, OJT tracking, competency rubrics
- WIOA performance reporting — enrollment, completion, credential attainment, employment outcomes
- Audit logging on all critical actions, RLS on all database tables
- FERPA-compliant student records management
- Monthly compliance summaries for referring agencies

### Stakeholder Portals
- **Admin panel** — enrollment, compliance, analytics, content, users, programs, and operations
- **Learner portal** — dashboard, courses, certificates, attendance, career services
- **Instructor portal** — student management, submission review, sign-off queue
- **Program Holder** — cohort management, revenue share reporting, participant tracking
- **Employer portal** — job postings, OJT agreements, hiring pipeline
- **Partner portal** — workforce agency reporting, referral tracking
- **Parent/Guardian portal** — linked student progress, enrollment status, certificates

### Testing Infrastructure
- Certiport Authorized Testing Center
- EPA Section 608 authorized testing (ESCO Group, Mainstream Engineering)
- Online exam booking, proctor scheduling, score reporting

---

## Legal and Compliance Standing

| Field | Value |
|-------|-------|
| **Legal Name** | 2Exclusive LLC-S |
| **DBA** | Elevate for Humanity Career & Training Institute |
| **EIN** | 88-2609728 |
| **RAPIDS Program** | 2025-IN-132301 |
| **DOL Registration** | Registered — U.S. Department of Labor, Office of Apprenticeship |
| **ETPL Status** | Indiana Eligible Training Provider List — listed |
| **Location** | 7009 E 56th St, Indianapolis, IN 46226 (Marion County) |
| **Sponsor Type** | Single Employer |
| **EPA Authorization** | Section 608 Universal — authorized testing center |

### Registered Apprenticeship Occupations

| Occupation | RTI Hours | Sponsor | Method |
|------------|-----------|---------|--------|
| Building Services Technician (HVAC) | 432 | 2Exclusive LLC-S (206251) | Classroom / Shop / Web-Based |
| Hair Stylist | 154 | 2Exclusive LLC-S (206251) | Classroom / Shop / Web-Based |
| Barber | 260 | Elevate for Humanity (208029) | Classroom / Web-Based |
| Esthetician | 300 | Elevate for Humanity (208029) | Classroom / Web-Based |
| Nail Tech | 200 | Elevate for Humanity (208029) | Classroom / Web-Based |
| Youth Culinary | 144 | Elevate for Humanity (208029) | Classroom / Web-Based |

See [docs/compliance-overview.md](docs/compliance-overview.md) for full compliance posture.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| UI | React | 19.2.1 |
| CSS | Tailwind CSS | 3.4.18 |
| Database | Supabase (PostgreSQL + Auth + RLS) | — |
| Payments | Stripe | 19.3.1 |
| Email | Resend | 6.4.2 |
| AI | OpenAI | 6.9.1 |
| Monitoring | Sentry | 10.32.1 |
| Hosting | Netlify | — |
| Package Manager | pnpm | 10.28.2 |
| Node.js | — | 20.x |

**Integrations:** Stripe, Affirm, Resend, OpenAI, Supabase, Sentry, Netlify, JotForm, Certiport, D-ID.

---

## Repository Scope

This public repository contains the application codebase for transparency and evaluation purposes. It does not include production secrets, live student records, proprietary AI assets, or the full video library.

**Verified codebase counts:**

| Artifact | Count |
|----------|-------|
| App pages | 1,550 |
| API routes | 1,157 |
| React components | 930 |
| Library modules | 861 |
| SQL migrations | 430 |
| Admin sections | 289+ |
| Netlify serverless functions | 7 |

See [docs/repository-scope.md](docs/repository-scope.md) for full scope details.

---

## System Architecture

### How to Think About This Codebase

The platform is organized into six domains. Each domain owns its data, its API surface, and its UI layer. They communicate through shared lib modules — never through direct cross-domain imports.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC SURFACE                           │
│  /programs  /apply  /funding  /verify  /testing  /partners      │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      STAKEHOLDER PORTALS                        │
│                                                                 │
│  /learner          /instructor       /employer                  │
│  /admin            /program-holder   /partner                   │
│  /parent-portal    /staff-portal     /mentor                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
│   LMS ENGINE    │ │   ENROLLMENT    │ │   COMPLIANCE    │
│                 │ │   & FUNDING     │ │   & REPORTING   │
│ lib/lms/engine/ │ │ lib/apply/      │ │ lib/compliance/ │
│ - completion    │ │ lib/funding/    │ │ lib/audit/      │
│ - progress-calc │ │ lib/payments/   │ │ lib/wioa/       │
│ - gating        │ │                 │ │ lib/apprentice/ │
│ - certificates  │ │ Stripe · Affirm │ │                 │
│ - blueprints    │ │ WIOA · WRG · JRI│ │ RAPIDS · FERPA  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       DATA LAYER                                │
│                                                                 │
│  lib/supabase/          — canonical DB clients (server/admin)   │
│  supabase/migrations/   — 430 SQL migrations, all applied       │
│  lib/api/               — auth guards, rate limiting, errors    │
└─────────────────────────────────────────────────────────────────┘
```

### The Six Domains

**1. LMS Engine** (`lib/lms/engine/`)
The course delivery core. Stateless functions that read and write learner progress. Nothing outside this module writes to `lesson_progress`, `checkpoint_scores`, `step_submissions`, or `program_completion_certificates`.
- `completion.ts` — the only write path for step completion and uncompletion
- `progress-calc.ts` — single source of truth for `progress_percent` calculation
- `gate.ts` — checkpoint gating logic; blocks module access until prior checkpoint passes
- `certificate.ts` — auto-issues certificates when all lessons complete and all checkpoints pass

**2. Enrollment & Funding** (`lib/apply/`, `lib/funding/`, `lib/payments/`)
Handles the intake pipeline from eligibility screening through enrollment activation. Integrates with Stripe (payments), Affirm (BNPL), and funding agency workflows (WIOA, WRG, JRI). Canonical enrollment table: `program_enrollments`.

**3. Compliance & Reporting** (`lib/compliance/`, `lib/audit/`, `lib/apprenticeship/`)
DOL RAPIDS reporting, WIOA performance metrics, RTI hour logs, OJT tracking, and audit trails. Every critical write in the system calls `lib/audit-context.ts` before committing. RLS is enforced on all tables.

**4. Stakeholder Portals** (`app/admin/`, `app/learner/`, `app/instructor/`, etc.)
Role-segmented UI surfaces. Each portal is a Next.js App Router subtree with its own layout and auth guard. Auth is enforced per-route via `lib/admin/guards.ts` — there is no root middleware. Every route that reads or writes user data calls `apiAuthGuard` or `apiRequireAdmin` before any DB access.

**5. Public Surface** (`app/programs/`, `app/apply/`, `app/(marketing)/`)
Static and ISR pages for SEO, program discovery, and participant intake. No auth required. Revalidates on a 60-second cycle in production.

**6. Platform Services** (`lib/email/`, `lib/ai/`, `lib/storage/`, `lib/secrets.ts`)
Cross-cutting infrastructure. Email via Resend, AI via OpenAI, file storage via Supabase Storage + R2, secrets hydrated at request time from `app_secrets` table (not baked into env at build time).

### Mental Model

```
LMS (training delivery)
+ Compliance engine (WIOA · DOL · FERPA)
+ Funding system (government programs + Stripe payments)
+ Employment pipeline (OJT · placement · outcome tracking)
= Workforce Operating System
```

### Why 1,550 Pages and 1,157 API Routes

The page count is high by design — not bloat:
- **Role-segmented portals** — each stakeholder role has its own subtree (`/admin/`, `/learner/`, `/instructor/`, `/employer/`, `/partner/`, `/program-holder/`, `/staff-portal/`, `/mentor/`, `/parent-portal/`)
- **Geographic SEO pages** — program pages are duplicated per state (`/career-training-indiana/`, `/career-training-illinois/`, etc.) for organic search coverage
- **Program-instance pages** — each credential pathway has its own public page, funding page, and application flow
- **Compliance and legal pages** — FERPA, WIOA, consumer education, grievance, satisfactory academic progress, etc. are required by DOL and state agencies

The API route count follows the same pattern — one route per resource per role, not one monolithic handler. This keeps auth boundaries explicit and auditable.

---



### Prerequisites
- Node.js 20+ (< 25)
- pnpm 10+
- Supabase project
- Stripe account

### Setup

```bash
git clone https://github.com/elevateforhumanity/Elevate-lms.git
cd Elevate-lms
pnpm install
cp .env.example .env.local
# Fill in .env.local with your credentials
pnpm next dev --turbopack
```

Visit `http://localhost:3000`

### Key Environment Variables

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

Full variable reference in `.env.example`.

### Common Commands

```bash
pnpm next dev --turbopack              # Development server
pnpm next build                        # Production build (must complete with zero errors)
pnpm lint                              # ESLint
bash scripts/audit-auth-gaps.sh        # Auth gap audit
bash scripts/audit-schema-refs.sh      # Schema reference audit
bash scripts/audit-env-vars.sh         # Env var audit
```

---

## Project Structure

```
Elevate-lms/
├── app/                        # Next.js App Router (1,550 pages + 1,157 API routes)
│   ├── admin/                  # Admin panel
│   ├── api/                    # API routes
│   ├── lms/                    # LMS application (learner-facing)
│   ├── instructor/             # Instructor portal
│   ├── employer/               # Employer portal
│   ├── partner/                # Partner portal
│   ├── parent-portal/          # Parent/Guardian portal
│   ├── program-holder/         # Program Holder portal
│   ├── programs/               # Public program pages
│   └── ...
├── components/                 # React components (930 files)
│   ├── admin/dashboard/        # Admin dashboard shell + panels
│   ├── lms/                    # LMS UI components
│   └── marketing/              # Public-facing marketing components
├── lib/                        # Business logic and utilities (861 modules)
│   ├── lms/engine/             # Course engine — completion, progress, gating, certificates
│   ├── lms/progress-calc.ts    # Canonical progress calculation (single source of truth)
│   ├── admin/                  # Admin data loaders
│   ├── curriculum/blueprints/  # Blueprint-driven course definitions
│   ├── supabase/               # Canonical Supabase clients
│   └── api/                    # Auth guards, rate limiting, error helpers
├── supabase/migrations/        # SQL migrations (430 files)
├── netlify/functions/          # Serverless functions (7)
├── scripts/                    # Audit and seeding scripts
├── public/                     # Static assets
├── docs/                       # Platform documentation
└── data/                       # Static data (team, programs)
```

---

## Ecosystem

| Entity | Type | Role |
|--------|------|------|
| **2Exclusive LLC-S** | Legal entity / RAPIDS sponsor | Parent entity, apprenticeship sponsor |
| **Elevate for Humanity Career & Training Institute** | DBA / training provider | Instruction, RTI delivery, LMS, workforce programs |
| **Selfish Inc.** | 501(c)(3) nonprofit | Mental wellness and community support |
| **The Rise Foundation** | DBA of Selfish Inc. | VITA site — free tax preparation |
| **Supersonic Fast Cash LLC** | Employer | Tax preparation services |

---

## Revenue Model

| Stream | Details |
|--------|---------|
| Government funding | WIOA, WRG, JRI, EmployIndy contracts |
| Program holder revenue share | Partners receive 33.33% of net program revenue per student |
| Self-pay / Stripe | Direct enrollment payments |
| Platform licensing | Managed Enterprise LMS — $1,500–$3,500/month |

**Funding disclosure:** Training may be fully funded for eligible participants through WIOA, JRI, and approved funding partners. Eligibility is determined through WorkOne career centers and applicable agency guidelines.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/architecture-overview.md](docs/architecture-overview.md) | System map — all stakeholder layers and data flows |
| [docs/access-model.md](docs/access-model.md) | Managed access, enterprise source-use, public boundaries |
| [docs/compliance-overview.md](docs/compliance-overview.md) | DOL, WIOA, FERPA, audit, RLS posture |
| [docs/repository-scope.md](docs/repository-scope.md) | What is and is not in this repository |
| [docs/SECURITY.md](docs/SECURITY.md) | Vulnerability reporting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [SUPPORT.md](SUPPORT.md) | Support channels |

---

## Support

| Channel | Contact |
|---------|---------|
| **General** | info@elevateforhumanity.org |
| **Phone** | (317) 314-3757 |
| **Website** | [elevateforhumanity.org/support](https://www.elevateforhumanity.org/support) |
| **Issues** | [GitHub Issues](https://github.com/elevateforhumanity/Elevate-lms/issues) |

---

## Support This Mission

Elevate for Humanity provides **free workforce training** to underserved communities in Indiana through WIOA, Workforce Ready Grant, and DOL-registered apprenticeships. Every dollar goes directly toward training costs, credentialing fees, and learner support services.

**[Donate via PayPal →](https://www.paypal.com/donate/?business=Marcusgreene0103%40gmail.com&currency_code=USD)**

See [SPONSORS.md](SPONSORS.md) for sponsorship tiers and partnership opportunities.

---

**License:** Proprietary — All rights reserved by 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute.
