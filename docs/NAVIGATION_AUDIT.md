# Navigation Audit Report

**Date:** 2026-06-19  
**Status:** CRITICAL - Needs Immediate Cleanup  
**Auditor:** OpenHands Agent

---

## Executive Summary

The Elevate for Humanity marketing site has **374 navigation items** across 7 top-level menus. This is **10-15x the industry standard** (25-40 items max for enterprise sites).

---

## Current State

### Navigation Breakdown

| Menu | Items | Industry Standard |
|------|-------|------------------|
| Programs | ~100 | 15-20 |
| Apprenticeships | ~20 | 8-12 |
| Funding | ~50 | 12-15 |
| Partners | ~50 | 15-20 |
| Store | ~50 | 10-15 |
| Apply | ~30 | 8-12 |
| About | ~40 | 12-15 |
| **TOTAL** | **~374** | **~80** |

---

## Problems Identified

### 1. **Content Duplication**
Same items appear multiple times:
- "HVAC Technician" appears in Programs AND More Programs
- "Barber Apprenticeship" appears 4+ times
- "WIOA" appears in 3 different sections

### 2. **Depth Overload**
Users must navigate 4-5 levels deep:
```
Programs → Beauty & Apprenticeships → Barber host shops → Enroll your barbershop
```
Should be: `Partners → Host Shop Enrollment`

### 3. **Internal Tool Leakage**
- `/admin/*` routes visible in Portals dropdown
- Admin Dashboard links mixed with student portals
- Technical paths exposed (`/platform/sponsors`, `/compliance/apprenticeship-structure`)

### 4. **Mega-Dropdown Anti-Pattern**
375 items in hover dropdowns = cognitive overload
Users can't process this many options

### 5. **Legacy Content Accumulation**
Many items link to pages that:
- No longer exist (404)
- Are duplicates
- Are placeholder content

---

## Recommended Structure

### Proposed Navigation (Target: 50-60 items)

```
PROGRAMS
├── Healthcare (CNA, MA, Phlebotomy, Pharmacy)
├── Skilled Trades (HVAC, Electrical, Welding, CDL)
├── Beauty & Apprenticeships (Barber, Cosmetology, Esthetician)
├── Technology (IT, Cybersecurity)
└── View All Programs →

APPRENTICESHIPS
├── Barber
├── Cosmetology
├── Esthetician
├── How It Works
└── Become a Sponsor →

FUNDING
├── WIOA / WorkOne
├── Workforce Ready Grant
├── Self-Pay Options
├── Check Eligibility →
└── (Remove: FSSA, TPP Survey, DOL, SNAP EtW - bury in eligibility page)

PARTNERS
├── For Employers
├── For Agencies
├── For Training Providers
└── Referral Program →

APPLY
├── Student Application →
├── Employer Inquiry
└── Host Shop Enrollment

PORTALS
├── Student Login →
├── Employer Portal →
├── Partner Portal →
└── Admin Login →

SUPPORT
├── Help Center
├── Contact Us
└── (Remove: Career Assessment, Academic Calendar, Forms Library - bury in support)
```

---

## Specific Items to Remove

### Programs Menu (Remove ~60 items)
- ❌ "All Healthcare →" (redundant)
- ❌ "All Trades →" (redundant)  
- ❌ "All Technology →" (redundant)
- ❌ "Barber Studio" (duplicate of Barber Apprenticeship)
- ❌ "More Programs & Previews" section (6 duplicate items)
- ❌ "HVAC Technician" (appears 3x - keep one)
- ❌ "Business Program" (unclear if active)

### Funding Menu (Remove ~25 items)
- ❌ "FSSA", "Tpp Survey", "DOL" - not user-facing
- ❌ "Grants", "JRI", "SNAP Et" - legacy paths
- ❌ "WIOA Eligibility", "Low Income", "Public Assistance", "Veterans" - sub-pages, not nav items

### Partners Menu (Remove ~20 items)
- ❌ "Employer directory" - unclear purpose
- ❌ "Platform sponsors" - internal tool
- ❌ Duplicate host shop links

### Store Menu (Remove ~30 items)
- ❌ "License — Features", "License — Integrations" - internal
- ❌ "Demo — Admin", "Demo — Employer" - not user-facing
- ❌ Most of the nested sub-items

### Apply Menu (Remove ~15 items)
- ❌ Individual program applications (consolidate to one form)
- ❌ "Booth rental application" (rare use case)
- ❌ "Create a program" (internal)

### About Menu (Remove ~20 items)
- ❌ "For Students (Hub)", "Team", "Founder" - duplicate
- ❌ "Resources" section - most are support items
- ❌ "Monthly Giving", "Industries" - not navigation priorities

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. Remove all 404/external links
2. Consolidate duplicate items
3. Hide internal tools from public nav

### Phase 2: Important (Week 2)
1. Collapse mega-dropdowns to 15 items max each
2. Move deep content to category pages
3. Simplify Store navigation

### Phase 3: Optimization (Week 3)
1. Add search functionality
2. Create smart defaults (show popular items first)
3. Add "Browse All" links to reduce per-menu items

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Total nav items | 374 | <60 |
| Max dropdown depth | 5 | 2 |
| Duplicate items | 50+ | 0 |
| Internal tool leaks | 20+ | 0 |

---

## Technical Notes

Navigation defined in: `lib/navigation.ts` (575 lines)

```typescript
// Current structure example:
subItems: [
  { name: '— Healthcare —', href: '/programs/healthcare', isHeader: true },
  { name: 'CNA / Nursing Assistant', href: '/programs/cna' },
  // ... 374 total items
]
```

---

## Conclusion

**The navigation is broken by complexity.** 

A workforce platform with 374 menu items signals:
1. No clear content strategy
2. Feature creep without cleanup
3. Technical debt in UX

**Recommended Action:** 
Rebuild navigation from scratch using the 60-item target. Use the existing category pages as "hub" pages that link to specific programs.

---

*End of Report*
