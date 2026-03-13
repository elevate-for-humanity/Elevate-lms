# Buyer Deck Outline

**Purpose:** Slide-by-slide outline for platform licensing presentation  
**Matches:** Live implementation at elevateforhumanity.org  
**Pricing Source:** `lib/pricing.ts`

---

## Slide 1: Title

**Title:** License the Elevate LMS + Workforce Hub

**Subtitle:** White-label workforce training platform for training providers, workforce boards, and employer partners

**Visual:** Platform dashboard mockup

---

## Slide 2: The Problem

**Title:** Workforce Training Needs Modern Infrastructure

**Bullets:**
- Training providers struggle with disconnected systems
- Compliance reporting is manual and error-prone
- Employer partnerships lack structured pipelines
- Reentry and underserved populations need integrated support

---

## Slide 3: The Solution

**Title:** One Platform for the Entire Workforce Ecosystem

**Bullets:**
- LMS delivery with progress tracking and certificates
- Intake and eligibility workflows for funded programs
- Employer portal with candidate matching
- Apprenticeship oversight and OJT tracking
- Compliance-ready reporting

**Live Page:** `/license`

---

## Slide 4: Built For

**Title:** Who Uses Elevate

**Three columns:**

| Training Providers | Workforce Organizations | Employers |
|-------------------|------------------------|-----------|
| Community colleges | Reentry programs | Apprenticeship sponsors |
| Trade schools | Workforce boards | Hiring partners |
| Certification programs | WIOA providers | OJT employers |

**Live Page:** `/license` (Built For section)

---

## Slide 5: Platform Modules

**Title:** What's Included

**Four module cards:**

1. **LMS Delivery** — Course management, progress tracking, certificates
2. **Programs & Pathways** — Career pathways, prerequisites, cohorts
3. **Intake & Eligibility** — Screening, document collection, routing
4. **Employer & Apprenticeship** — Partner portals, hiring pipelines, OJT

**Live Page:** `/license/features`

---

## Slide 6: Learner Experience Demo

**Title:** Learner Dashboard

**What to show:**
- Program enrollment and progress
- Module completion tracking
- Funding pathway information
- Support resources

**Live Page:** `/demo/learner`

---

## Slide 7: Admin Experience Demo

**Title:** Program Manager Dashboard

**What to show:**
- Program management table
- Enrollment pipeline (Intake → Eligible → Enrolled → Active → Completed)
- Reporting and data exports
- Compliance documentation

**Live Page:** `/demo/admin`

---

## Slide 8: Employer Experience Demo

**Title:** Employer Partner Portal

**What to show:**
- Candidate pipeline with match scores
- Open roles management
- Hiring incentive information
- Apprenticeship tracking

**Live Page:** `/demo/employer`

---

## Slide 9: Integrations

**Title:** Connect With Your Systems

**Integration list:**

| Integration | Status | Description |
|-------------|--------|-------------|
| Salesforce | Integration-ready | CRM sync via API/webhooks |
| Supabase | Included | Auth + database infrastructure |
| Email Providers | Configurable | Resend, SendGrid, SMTP |
| Credentialing | Configurable | Certificate verification |

**Note:** "Salesforce integration is supported via API/workflow configuration; implementation depends on partner environment."

**Live Page:** `/license/integrations`

---

## Slide 10: Pricing

**Title:** Platform Licensing

**Three tiers (from `lib/pricing.ts`):**

| Core Platform | School License | Enterprise |
|---------------|----------------|------------|
| **$4,999** | **$15,000** | **$50,000** |
| Single-site deployment | White-label + compliance | Full deployment + AI |
| Unlimited students | Partner dashboard | Employer portal |
| 1 year updates | WIOA reporting | Dedicated support |
| | Lifetime updates | Custom integrations |

**Monthly option:** $499/month for up to 100 students

**Disclaimer:** Final pricing depends on scope, branding, modules, and implementation support.

**Live Page:** `/license/pricing`

---

## Slide 11: What's Included vs Implementation

**Title:** License Includes

**Included:**
- All platform modules
- White-label branding (School+)
- Standard integrations
- Updates and support

**Implementation-dependent:**
- Custom integrations beyond standard
- Data migration
- Custom development
- Ongoing managed services
- Training (available separately)

**Live Page:** `/license/pricing` (What's Included section)

---

## Slide 12: Live Demo Flow

**Title:** See It In Action

**Demo path:**
```
/store → /license → /demo → /schedule
```

**Three demo tracks:**
1. Learner Experience → `/demo/learner`
2. Admin Dashboard → `/demo/admin`
3. Employer Portal → `/demo/employer`

**CTA:** Schedule a live walkthrough via Google Meet

**Live Page:** `/license/demo`

---

## Slide 13: Next Steps

**Title:** Ready to Get Started?

**Process:**
1. **Discovery** — We learn about your organization
2. **Platform Tour** — Walk through all three experiences
3. **Scoping** — Discuss licensing tier and implementation
4. **Proposal** — Receive formal quote and timeline

**CTA:** Schedule a Demo

**Live Page:** `/schedule`

---

## Slide 14: Contact

**Title:** Let's Talk

**Primary CTA:** Schedule a Demo → `/schedule`

**Alternative:** Contact us directly

**Website:** elevateforhumanity.org/license

---

## Appendix: Pricing Evidence

All pricing derived from repository evidence:

| Tier | Price | Source |
|------|-------|--------|
| Core Platform | $4,999 | `app/data/store-products.ts:117` |
| School License | $15,000 | `app/data/store-products.ts:145` |
| Enterprise | $50,000 | `app/data/store-products.ts:175` |
| Monthly | $499/mo | `app/data/store-products.ts:205` |

Canonical source: `lib/pricing.ts`
