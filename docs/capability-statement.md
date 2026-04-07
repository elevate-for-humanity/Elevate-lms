# Elevate for Humanity — Capability Statement

**Workforce Operating System**

| | |
|---|---|
| **Legal Entity** | 2Exclusive LLC-S |
| **DBA** | Elevate for Humanity Career & Training Institute |
| **EIN** | 88-2609728 |
| **Location** | 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240 |
| **Phone** | (317) 314-3757 |
| **Email** | info@elevateforhumanity.org |
| **Website** | https://www.elevateforhumanity.org |
| **RAPIDS Program** | 2025-IN-132301 |
| **NAICS Codes** | 611430 · 611519 · 611710 |
| **UEI** | *(pending — add when registered in SAM.gov)* |
| **CAGE Code** | *(pending — add when registered in SAM.gov)* |

---

## Overview

Elevate for Humanity operates a vertically integrated Workforce Development Operating System that delivers training, manages funding eligibility, ensures regulatory compliance, and tracks employment outcomes within a single platform.

The system is designed to align with WIOA (Title I), DOL Registered Apprenticeship (RAPIDS), and Indiana workforce programs including Workforce Ready Grant (Next Level Jobs) and Job Ready Indy (JRI).

---

## Core Capabilities

### 1. Workforce Training Delivery

- Structured programs (4–18 weeks) with defined RTI hours per occupation
- Industry-recognized credentials issued by the respective certifying bodies:

| Credential | Issuing Body |
|-----------|-------------|
| EPA Section 608 Universal | ESCO Group / Mainstream Engineering |
| OSHA 10 / OSHA 30 | OSHA Outreach |
| WorkKeys NCRC | ACT |
| CompTIA A+ / Security+ | CompTIA |
| PTCB CPhT | Pharmacy Technician Certification Board |
| Microsoft Office Specialist | Certiport / Microsoft |
| Indiana CNA | Indiana State Department of Health |
| Indiana Barber / Cosmetology License | Indiana Professional Licensing Agency |

- Attendance tracking, quiz assessments, checkpoint gating, and certificate issuance
- Certiport Authorized Testing Center on-site

### 2. Enrollment & Funding Integration

- WIOA eligibility screening (Adult, Dislocated Worker, Youth 16–24)
- Workforce Ready Grant and JRI intake workflows
- Agency referral intake from WorkOne, EmployIndy, and reentry organizations
- Payment processing: Stripe (cards, ACH, Apple Pay, Google Pay), Affirm BNPL
- Funding disclosure and consumer education built into enrollment flow

### 3. Case Management & Support Services

- Participant tracking across enrollment, attendance, and completion milestones
- Role-based dashboards for staff, instructors, and program coordinators
- Integration points for supportive services (transportation, stipends, wraparound support)
- Parent/guardian portal for monitoring youth participant progress

### 4. Compliance & Performance Reporting

**WIOA Performance Indicators:**

| Indicator | Platform Implementation |
|-----------|------------------------|
| Measurable Skill Gains (MSG) | Lesson-level progress, quiz scores, checkpoint passage |
| Credential Attainment | Certificate issuance tied to program completion + exam passage |
| Employment Rate (Q2 / Q4) | Placement tracking with 6- and 12-month outcome records |
| Median Earnings | Employer-reported wage data at placement |

**DOL RAPIDS Requirements:**

| Requirement | Platform Implementation |
|-------------|------------------------|
| RTI hour logs | Per-session attendance records |
| On-the-Job Training (OJT) | OJT agreement management and hour tracking |
| Competency progression | Checkpoint-gated module advancement |
| Apprentice registration | Individual records linked to RAPIDS program ID 2025-IN-132301 |
| Wage schedule compliance | Wage progression tracked per apprentice |
| Equal opportunity | EEO disclosures on all apprenticeship pages (29 CFR Part 30) |

**Data Integrity:**
- PostgreSQL with Row-Level Security (RLS) — strict role and tenant isolation
- Full audit logging on all participant and administrative actions
- FERPA-aligned participant records management
- All schema changes version-controlled in `supabase/migrations/`

### 5. Employment & Outcome Tracking

- Employer partnerships and job placement pipelines
- OJT agreements and DOL-registered apprenticeship pathways
- 6-month and 12-month employment outcome tracking per participant
- Employer portal for job postings, OJT management, and hiring pipeline

---

## Registered Apprenticeship Occupations

| Occupation | RTI Hours | Sponsor | RAPIDS ID |
|------------|-----------|---------|-----------|
| Building Services Technician (HVAC) | 432 | 2Exclusive LLC-S | 206251 |
| Hair Stylist | 154 | 2Exclusive LLC-S | 206251 |
| Barber | 260 | Elevate for Humanity | 208029 |
| Esthetician | 300 | Elevate for Humanity | 208029 |
| Nail Tech | 200 | Elevate for Humanity | 208029 |
| Youth Culinary | 144 | Elevate for Humanity | 208029 |

---

## Multi-Stakeholder Access

| Role | Portal | Access |
|------|--------|--------|
| Participants | `/learner` | Training, progress, credentials, career services |
| Workforce Agencies | `/partner` | Enrollment tracking, funding oversight, outcome reporting |
| Employers | `/employer` | Hiring pipeline, OJT management, job postings |
| Program Providers | `/program-holder` | Cohort delivery, revenue share reporting |
| Administrators | `/admin` | Compliance, analytics, system operations |
| Instructors | `/instructor` | Student management, submission review |
| Parent / Guardians | `/parent-portal` | Youth participant progress monitoring |

---

## Why This Matters for Funders and Partners

Elevate functions as infrastructure for workforce development — not just a training provider. The platform:

- Qualifies participants for funding at intake
- Delivers structured, credential-aligned training
- Embeds compliance tracking into daily operations
- Connects participants directly to employment pathways
- Reports real workforce outcomes (credential attainment, employment rate, earnings)

This integrated approach reduces administrative burden for workforce agencies while improving participant accountability and outcome visibility.

---

## Contact

| | |
|---|---|
| **General Inquiries** | info@elevateforhumanity.org |
| **Phone / Text** | (317) 314-3757 |
| **Partnerships** | https://www.elevateforhumanity.org/partnerships |
| **Partner Application** | https://www.elevateforhumanity.org/partners/join |
| **Workforce Agencies** | https://www.elevateforhumanity.org/partners/workforce |
