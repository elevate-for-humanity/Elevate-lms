# Enrollment Flow Map — Start to Finish

## Overview

Every user follows a linear funnel from discovery to certification. The flow has 6 stages with clear handoffs between each.

```
DISCOVER → INQUIRE → APPLY → ENROLL → LEARN → CERTIFY
```

---

## Stage 1: DISCOVER (Public Site)

**Entry points:**
- Homepage (`/`) → "Programs" or "Apply Now" buttons
- `/programs` → Browse all program categories
- `/programs/{category}` → Healthcare, Skilled Trades, Beauty, etc.
- `/programs/{slug}` → Individual program detail page

**What happens:** User browses programs, reads details, sees career outcomes and funding info.

**Exit to next stage:** Every program page has an "Apply Now" CTA that routes to Stage 3 (Apply), or an "Inquiry" link for Stage 2.

**Routes:**
| Page | CTA | Destination |
|------|-----|-------------|
| `/programs` | "Start Eligibility & Apply" | `/apply` |
| `/programs/barber-apprenticeship` | "Apply Now" | `/apply?program=barber-apprenticeship` |
| `/programs/cna-certification` | "Apply Now" | `/apply?program=cna-certification` |
| `/programs/hvac-technician` | "Apply Now" | `/apply?program=hvac-technician` |
| `/programs/{any-slug}` (template) | "Apply Now" | `/apply?program={slug}` |

---

## Stage 2: INQUIRE (Optional — Information Request)

**Purpose:** For users not ready to apply. Submits contact info for follow-up.

**Flow:**
```
/programs/{slug} → "Request Info"
    ↓
/inquiry?program={slug}  (form with program pre-selected)
    ↓
/inquiry/success  (confirmation + links to Apply and Programs)
```

**Program-specific shortcuts:**
- `/programs/barber-apprenticeship/inquiry` → redirects to `/inquiry?program=barber-apprenticeship`
- `/programs/cosmetology-apprenticeship/inquiry` → redirects to `/inquiry?program=cosmetology-apprenticeship`

**What happens after:** Admissions team contacts user within 1-2 business days. User can also proceed directly to Apply.

---

## Stage 3: APPLY (Application Submission)

**Two paths based on program type:**

### Path A: Standard Programs (most programs)
```
/apply?program={slug}
    ↓
/apply  (routing page — detects program, redirects)
    ↓
/apply/student?program={slug}  (full application form)
    ↓
/apply/success  (confirmation + next steps)
```

### Path B: Apprenticeship Programs (barber, cosmetology, nail-tech)
```
/apply?program=barber-apprenticeship
    ↓
/programs/barber-apprenticeship/apply  (dedicated form with pricing calculator)
    ↓
/programs/barber-apprenticeship/apply/success  (confirmation)
```

**Programs with dedicated apply pages:**
| Program | Dedicated Apply Page |
|---------|---------------------|
| Barber Apprenticeship | `/programs/barber-apprenticeship/apply` |
| Cosmetology Apprenticeship | `/programs/cosmetology-apprenticeship/apply` → redirects to `/apply?program=cosmetology-apprenticeship` |
| CPR/First Aid | `/programs/cpr-first-aid-hsi/apply` |
| Culinary Apprenticeship | `/programs/culinary-apprenticeship/apply` |
| Electrical | `/programs/electrical/apply` |
| Medical Assistant | `/programs/medical-assistant/apply` |
| Plumbing | `/programs/plumbing/apply` |
| Sanitation & Infection Control | `/programs/sanitation-infection-control/apply` |
| Welding | `/programs/welding/apply` |

**All other programs** use the generic `/apply/student?program={slug}` form.

**What happens after:** Application is reviewed by admissions (1-2 business days). User receives email/call.

---

## Stage 4: ENROLL (Payment + Confirmation)

**Two paths based on program funding:**

### Path A: Funded Programs (WIOA/WRG/JRI)
```
/apply/success  (admissions reviews, approves funding)
    ↓
[Email notification: "You're approved"]
    ↓
/enroll/{programId}  (enrollment confirmation page)
    ↓
/enroll/success  (access unlocked → Student Portal)
```

### Path B: Self-Pay / Apprenticeship Programs
```
/apply/success  (admissions reviews application)
    ↓
[Email: "Application approved — complete enrollment"]
    ↓
/enroll/{programId}  (payment via Stripe checkout)
    ↓
/enroll/confirmation?session_id=xxx  (payment verified)
    ↓
/programs/{slug}/enrollment-success  (enrollment confirmed)
```

**Apprenticeship-specific enrollment success pages:**
| Program | Enrollment Success | Next Step |
|---------|-------------------|-----------|
| Barber | `/programs/barber-apprenticeship/enrollment-success` | → Orientation |
| Cosmetology | `/programs/cosmetology-apprenticeship/enrollment-success` | → Orientation |
| Nail Technician | `/programs/nail-technician-apprenticeship/enrollment-success` | → Orientation |

---

## Stage 5: ONBOARD (Orientation + Documents)

**Apprenticeship programs have a structured onboarding flow:**

```
/programs/{slug}/enrollment-success
    ↓  "Start Orientation"
/programs/{slug}/orientation  (5-section walkthrough)
    ↓  "Continue to Program"
/programs/{slug}/documents  (upload government ID + optional docs)
    ↓  "Submit Documents"
/apprentice  (Apprentice Dashboard — training begins)
```

**Orientation sections (all apprenticeships):**
1. What This Program Leads To
2. How the Apprenticeship Works
3. Attendance & Conduct Expectations
4. Payment Terms
5. Compliance & Agreement (checkbox acknowledgment required)

**Standard programs onboarding:**
```
/enroll/success
    ↓  "Start Onboarding Now"
/student-portal/onboarding  (document upload)
    ↓
/student/dashboard  (Student Dashboard — training begins)
```

**Programs with full onboarding flow:**
| Program | Orientation | Documents | Dashboard |
|---------|------------|-----------|-----------|
| Barber Apprenticeship | ✅ | ✅ | `/apprentice` |
| Cosmetology Apprenticeship | ✅ | ✅ | `/apprentice` |
| Nail Technician Apprenticeship | ✅ | ✅ | `/apprentice` |
| All other programs | — | via `/student-portal/onboarding` | `/student/dashboard` |

---

## Stage 6: LEARN + CERTIFY (LMS)

```
/apprentice  OR  /student/dashboard  OR  /lms
    ↓
Module-based learning (sequential)
    ↓
Progress tracking (percentage complete)
    ↓
/certificates  (download credentials at 100% completion)
```

**Apprentice Dashboard (`/apprentice`):**
- `/apprentice/courses` — Course modules
- `/apprentice/hours` — Hour tracking (OJT + RTI)
- `/apprentice/timeclock` — Clock in/out
- `/apprentice/documents` — Uploaded documents
- `/apprentice/skills` — Skills checklist
- `/apprentice/state-board` — License exam prep
- `/apprentice/handbook` — Student handbook

**Student Dashboard (`/student-portal`):**
- Announcements
- Assignments
- Grades
- Schedule
- Resources

**Certificates (`/certificates`):**
- View earned certificates
- Download/print credentials
- `/certificates/verify` — Public verification

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC SITE                               │
│                                                                  │
│  Homepage (/)  →  Programs (/programs)  →  Program Detail        │
│                                            (/programs/{slug})    │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
          "Request Info"                 "Apply Now"
               │                              │
               ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────────────┐
│  INQUIRY              │    │  APPLICATION                        │
│                       │    │                                     │
│  /inquiry?program=x   │    │  Standard: /apply/student?program=x │
│       ↓               │    │  Barber:   /programs/barber.../apply │
│  /inquiry/success     │    │  Cosmo:    /apply?program=cosmo...  │
│  (+ link to Apply)    │    │       ↓                             │
└───────────┬───────────┘    │  /apply/success                     │
            │                │  OR /programs/{slug}/apply/success   │
            └──── can ──────→└──────────────┬──────────────────────┘
                 proceed                    │
                                    Admissions Review
                                    (1-2 business days)
                                            │
                                            ▼
                              ┌─────────────────────────────┐
                              │  ENROLLMENT                  │
                              │                              │
                              │  Funded: /enroll/{id}        │
                              │  Self-pay: Stripe checkout   │
                              │       ↓                      │
                              │  /enroll/success             │
                              │  OR /programs/{slug}/        │
                              │     enrollment-success       │
                              └──────────────┬───────────────┘
                                             │
                              ┌──────────────┴───────────────┐
                              │                              │
                         Apprenticeship              Standard Program
                              │                              │
                              ▼                              ▼
                    ┌──────────────────┐          ┌──────────────────┐
                    │  ORIENTATION      │          │  ONBOARDING      │
                    │  /programs/{slug} │          │  /student-portal │
                    │  /orientation     │          │  /onboarding     │
                    │       ↓           │          └────────┬─────────┘
                    │  DOCUMENTS        │                   │
                    │  /programs/{slug} │                   │
                    │  /documents       │                   │
                    └────────┬─────────┘                   │
                             │                              │
                             ▼                              ▼
                    ┌──────────────────┐          ┌──────────────────┐
                    │  APPRENTICE      │          │  STUDENT         │
                    │  DASHBOARD       │          │  DASHBOARD       │
                    │  /apprentice     │          │  /student/       │
                    │  - courses       │          │  dashboard       │
                    │  - hours         │          │  - courses       │
                    │  - timeclock     │          │  - assignments   │
                    │  - state-board   │          │  - grades        │
                    └────────┬─────────┘          └────────┬─────────┘
                             │                              │
                             └──────────┬───────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  CERTIFICATES     │
                              │  /certificates    │
                              │  (100% complete)  │
                              └──────────────────┘
```

---

## All 28 Active Programs — Enrollment Status

| # | Program | Slug | Category | Apply Route | Full Flow |
|---|---------|------|----------|-------------|-----------|
| 1 | CNA | `cna-certification` | Healthcare | `/apply?program=cna-certification` | ✅ |
| 2 | Medical Assistant | `medical-assistant` | Healthcare | `/apply?program=medical-assistant` | ✅ |
| 3 | Phlebotomy Technician | `phlebotomy-technician` | Healthcare | `/apply?program=phlebotomy-technician` | ✅ |
| 4 | Home Health Aide | `home-health-aide` | Healthcare | `/apply?program=home-health-aide` | ✅ |
| 5 | Emergency Health & Safety Tech | `emergency-health-safety-tech` | Healthcare | `/apply?program=emergency-health-safety-tech` | ✅ |
| 6 | CPR, AED & First Aid | `cpr-first-aid-hsi` | Healthcare | `/inquiry?program=cpr-first-aid-hsi` | ✅ |
| 7 | HVAC Technician | `hvac-technician` | Skilled Trades | `/apply?program=hvac-technician` | ✅ |
| 8 | CDL Training | `cdl-training` | Skilled Trades | `/apply?program=cdl-training` | ✅ |
| 9 | Building Maintenance Tech | `building-maintenance-tech` | Skilled Trades | `/apply?program=building-maintenance-tech` | ✅ |
| 10 | Barber Apprenticeship | `barber-apprenticeship` | Barber & Beauty | `/programs/barber-apprenticeship/apply` | ✅ Full |
| 11 | Esthetician | `professional-esthetician` | Barber & Beauty | `/apply?program=professional-esthetician` | ✅ |
| 12 | Beauty & Career Educator | `beauty-career-educator` | Barber & Beauty | `/apply?program=beauty-career-educator` | ✅ |
| 13 | Tax Prep & Financial Services | `tax-prep-financial-services` | Business | `/apply?program=tax-prep-financial-services` | ✅ |
| 14 | Business Start-up & Marketing | `business-startup-marketing` | Business | `/apply?program=business-startup-marketing` | ✅ |
| 15 | Certified Peer Recovery Coach | `certified-peer-recovery-coach` | Human Services | `/apply?program=certified-peer-recovery-coach` | ✅ |
| 16 | Public Safety Reentry Specialist | `public-safety-reentry-specialist` | Human Services | `/apply?program=public-safety-reentry-specialist` | ✅ |
| 17 | Drug & Alcohol Specimen Collector | `drug-alcohol-specimen-collector` | Human Services | `/apply?program=drug-alcohol-specimen-collector` | ✅ |
| 18 | Direct Support Professional | `direct-support-professional` | Human Services | `/apply?program=direct-support-professional` | ✅ |
| 19 | Sanitation & Infection Control | `sanitation-infection-control` | Human Services | `/apply?program=sanitation-infection-control` | ✅ |
| 20 | IT Support Specialist | `it-support` | Technology | `/apply?program=it-support` | ✅ |
| 21 | Cybersecurity Fundamentals | `cybersecurity` | Technology | `/apply?program=cybersecurity` | ✅ |
| 22 | Electrical Apprenticeship | `electrical` | Skilled Trades | `/apply?program=electrical` | ✅ |
| 23 | Plumbing Apprenticeship | `plumbing` | Skilled Trades | `/apply?program=plumbing` | ✅ |
| 24 | Welding Certification | `welding` | Skilled Trades | `/apply?program=welding` | ✅ |
| 25 | Diesel Mechanic | `diesel-mechanic` | Skilled Trades | `/apply?program=diesel-mechanic` | ✅ |
| 26 | Cosmetology Apprenticeship | `cosmetology-apprenticeship` | Barber & Beauty | `/programs/cosmetology-apprenticeship/apply` | ✅ Full |
| 27 | Nail Technician Apprenticeship | `nail-technician-apprenticeship` | Barber & Beauty | `/apply?program=nail-technician-apprenticeship` | ✅ Full |
| 28 | Youth Culinary Apprenticeship | `culinary-apprenticeship` | Skilled Trades | `/apply?program=culinary-apprenticeship` | ✅ |

**"Full"** = Has dedicated orientation, documents, and enrollment-success pages.

---

## Fixes Applied

1. **`[slug]` fallback page** — CTA now passes `?program={slug}` instead of bare `/apply`
2. **`ProgramTemplate.tsx`** — All CTAs now include `?program={slug}`
3. **`VisualProgramTemplate.tsx`** — All CTAs now include `?program={slug}`
4. **`tax-entrepreneurship/page.tsx`** — CTAs now route to `?program=tax-prep-financial-services`
5. **`direct-support-professional/page.tsx`** — Primary CTA now includes program param
6. **`cosmetology-apprenticeship`** — Added full enrollment sub-pages (inquiry, eligibility, apply, apply/success, enrollment-success, orientation, documents)
7. **`cosmetology-apprenticeship`** — Added to orientation config with program-specific details
8. **`cosmetology-apprenticeship`** — Added `dedicatedApplyPage` to program registry
9. **`inquiry/success`** — Added "Ready to Apply?" and "Browse Programs" CTAs (was a dead end)
10. **`nail-technician-apprenticeship`** — CTA updated to use canonical slug
