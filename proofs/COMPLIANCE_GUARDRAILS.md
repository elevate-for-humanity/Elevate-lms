# Compliance Language Guardrails

**Last Updated:** 2025-02-06

## Overview

This document describes the compliance language guardrails implemented in the Elevate for Humanity platform to ensure regulatory compliance and protect both the organization and users.

## Component Library

All compliance components are located in `components/compliance/` and can be imported from `@/components/compliance`.

### Core Disclaimers

| Component               | Purpose                  | Required On                    |
| ----------------------- | ------------------------ | ------------------------------ |
| `NoGuaranteeDisclaimer` | No outcome guarantees    | Program pages, success stories |
| `FundingDisclaimer`     | WIOA/funding eligibility | Apply pages, funding pages     |
| `NotAdviceDisclaimer`   | Not professional advice  | Legal, financial content       |
| `PathwayDisclosure`     | Career pathway structure | All program pages              |

### Verification Components

| Component               | Purpose                      | Usage                        |
| ----------------------- | ---------------------------- | ---------------------------- |
| `VerificationDate`      | Shows when info was verified | Program details, salary data |
| `AccreditationNotice`   | Accreditation status         | Program pages                |
| `SalaryDisclaimer`      | Salary data source/date      | Career outcome pages         |
| `TestimonialDisclaimer` | Results may vary             | Success stories              |

### Consent Components

| Component             | Purpose                | Usage             |
| --------------------- | ---------------------- | ----------------- |
| `ApplicationConsent`  | Pre-submission consent | Application forms |
| `ComplianceNotice`    | Policy acknowledgment  | Forms, agreements |
| `CookieConsentBanner` | Cookie consent         | Site-wide         |

## Required Placements

### Program Pages

```tsx
import { PathwayDisclosure, FundingDisclaimer } from '@/components/compliance';

// Above primary CTA
<PathwayDisclosure variant="compact" />

// Near pricing/funding info
<FundingDisclaimer />
```

### Application Forms

```tsx
import { ApplicationConsent, FundingDisclaimer } from '@/components/compliance';

// Before submit button
<FundingDisclaimer className="mb-4" />
<ApplicationConsent
  checked={consent}
  onChange={setConsent}
/>
```

### Success Stories / Testimonials

```tsx
import { TestimonialDisclaimer, NoGuaranteeDisclaimer } from '@/components/compliance';

// After testimonials
<TestimonialDisclaimer />

// On outcome-focused pages
<NoGuaranteeDisclaimer />
```

### Salary / Career Outcome Data

```tsx
import { SalaryDisclaimer, VerificationDate } from '@/components/compliance';

// After salary information
<SalaryDisclaimer source="Bureau of Labor Statistics" date="2024" />
<VerificationDate date="January 2025" />
```

## Legal Pages

The following legal pages contain full compliance language:

| Page             | Path                    | Content                         |
| ---------------- | ----------------------- | ------------------------------- |
| Disclosures      | `/legal/disclosures`    | Full disclaimers, no guarantees |
| Terms of Service | `/terms-of-service`     | User agreement                  |
| Privacy Policy   | `/privacy-policy`       | Data handling                   |
| Acceptable Use   | `/legal/acceptable-use` | Platform rules                  |
| EULA             | `/legal/eula`           | Software license                |

## Key Compliance Statements

### No Guarantees (Required)

> "We do not guarantee any outcomes. This includes but is not limited to: job placement, income levels, certification pass rates, funding approval, enrollment numbers, revenue, or business success."

### Funding Eligibility (Required)

> "Eligibility for WIOA, WRG, or other funding programs is determined by WorkOne / Indiana Career Connect, not by Elevate for Humanity. Submitting an application does not guarantee funding approval."

### Not Professional Advice (Required)

> "Information provided is for general educational purposes only and does not constitute legal, financial, tax, or medical advice."

### Career Pathway (Required on program pages)

> "This program is part of the Elevate for Humanity Career Pathway and begins after eligibility determination. Enrollment is contingent upon eligibility, funding availability, and employer participation."

## Audit Checklist

- [ ] All program pages have PathwayDisclosure
- [ ] All application forms have FundingDisclaimer
- [ ] All application forms have ApplicationConsent checkbox
- [ ] All testimonials have TestimonialDisclaimer
- [ ] All salary data has SalaryDisclaimer with source
- [ ] Footer links to legal pages on all pages
- [ ] Cookie consent banner on first visit

## Files

- Components: `components/compliance/`
- Legal pages: `app/legal/`
- Disclosures: `app/legal/disclosures/page.tsx`
- This document: `proofs/COMPLIANCE_GUARDRAILS.md`
