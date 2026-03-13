# Elevate for Humanity — Workforce Operating System

> **Repository Notice**
> This repository is published for transparency, security review, and platform documentation.
> It does not contain the complete production system. External contributions are not accepted.
> Access to the live platform requires a formal managed access or enterprise source-use agreement.
> See [docs/repository-scope.md](docs/repository-scope.md) for what is and is not included here.

---

**Production:** [elevateforhumanity.org](https://www.elevateforhumanity.org)
**Status:** Live and Operational — Indianapolis, Indiana
**Updated:** June 2025
**Branch:** `main` — single consolidated branch

---

## What This Is

Elevate for Humanity operates a vertically integrated **Workforce Operating System** — not a course catalog, not a generic LMS. The platform handles the full operational stack for workforce credential delivery:

- **Training delivery** — cohort scheduling, video lessons, quizzes, attendance, progress tracking
- **Enrollment and funding** — WIOA, Workforce Ready Grant, JRI, and employer-sponsored intake workflows
- **Compliance and reporting** — DOL apprenticeship (RAPIDS), WIOA performance metrics, RTI hour logs, audit trails
- **Credentialing** — EPA 608, OSHA 10, WorkKeys NCRC, Certiport, AWS, Indiana ISDH, Indiana BMV
- **Stakeholder portals** — student, admin, program holder, employer, staff, workforce board, delegate
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
- 1,439 app pages across student, admin, employer, and program holder surfaces
- 5 fully built course definitions with lesson-level content (Barber: 260 RTI hrs, HVAC: 432 hrs, CDL, Medical Assistant, Workforce Readiness)
- Video lessons with per-lesson progress, quiz engine with pass thresholds, certificate generation and verification
- AI tutoring, adaptive learning, attendance clock-in, instructor records

### Enrollment and Funding
- Multi-step application with funding eligibility screening
- WIOA, Workforce Ready Grant, JRI, and Next Level Jobs workflow integration
- Stripe payments (cards, ACH, Apple Pay, Google Pay) and Affirm BNPL
- Approval workflows, waitlist management, enrollment status tracking

### Compliance and Reporting
- DOL Registered Apprenticeship (RAPIDS 2025-IN-132301) — RTI hour logs, OJT tracking, competency rubrics
- WIOA performance reporting — enrollment, completion, credential attainment, employment outcomes
- Audit logging on all critical actions, RLS on all database tables
- Monthly compliance summaries for referring agencies

### Stakeholder Portals
- **Admin panel** — 289 sections covering enrollment, compliance, analytics, content, users, programs, and operations
- **Student portal** — dashboard, courses, certificates, attendance, career services
- **Program Holder** — cohort management, revenue share reporting, participant tracking
- **Employer portal** — job postings, OJT agreements, hiring pipeline
- **Workforce Board** — aggregate reporting, outcome data, funding utilization

---

## Legal and Compliance Standing

| Field | Value |
|-------|-------|
| **Legal Name** | 2Exclusive LLC-S |
| **DBA** | Elevate for Humanity Career & Training Institute |
| **EIN** | 88-2609728 |
| **RAPIDS Program** | 2025-IN-132301 |
| **DOL Registration** | Registered (OA) — U.S. Department of Labor, Office of Apprenticeship |
| **Location** | 7009 E 56th St, Indianapolis, IN 46226 (Marion County) |
| **Sponsor Type** | Single Employer |
| **EPA Authorization** | Section 608 Universal — authorized testing center (ESCO Group, Mainstream Engineering) |

### Registered Apprenticeship Occupations

| Occupation | RTI Hours | Provider | Method |
|------------|-----------|----------|--------|
| Building Services Technician | 432 | 2Exclusive LLC-S (206251) | Classroom / Shop / Web-Based |
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

**Integrations:** Stripe, Affirm, Resend, OpenAI, Supabase, Sentry, Netlify, JotForm.

---

## Repository Scope

This public repository contains the application codebase for transparency and evaluation purposes. It does not include production secrets, live student records, proprietary AI assets, or the full video library.

**Verified codebase counts (June 2025):**

| Artifact | Count |
|----------|-------|
| App pages | 1,439 |
| API routes | 1,020 |
| React components | 857 |
| Library modules | 732 |
| SQL migrations | 225 |
| Static images | 1,197 |
| Video files | 737 |
| Admin sections | 289 |
| Netlify serverless functions | 7 |

See [docs/repository-scope.md](docs/repository-scope.md) for full scope details.

---

## Quick Start

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
pnpm dev
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
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
```

---

## Project Structure

```
Elevate-lms/
├── app/                    # Next.js App Router (1,439 pages + 1,020 API routes)
│   ├── admin/              # Admin panel (289 sections)
│   ├── api/                # API routes
│   ├── lms/                # LMS application
│   ├── programs/           # Training program pages
│   └── ...
├── components/             # React components (857 files)
├── lib/                    # Business logic and utilities (732 modules)
├── supabase/migrations/    # SQL migrations (225 files)
├── netlify/functions/      # Serverless functions (7)
├── public/                 # Static assets
├── docs/                   # Platform documentation
└── data/                   # Static data (team, programs)
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

**License:** Proprietary — All rights reserved by 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute.
