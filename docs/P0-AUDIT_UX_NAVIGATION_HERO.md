# UX Audit: Navigation, Hero Banners & Content Density

**Date:** 2026-06-23  
**Priority:** HIGH  
**Status:** AUDIT COMPLETE - remediation plan needed

---

## 1. NAVIGATION AUDIT

### Current State: CRITICAL OVERLOAD

| Metric | Value | Target |
|--------|-------|--------|
| Total nav items | 425 | < 50 |
| Menu items (desktop) | 7 top-level | 5 max |
| Dropdown items per menu | 50-100+ | < 15 |
| Mobile menu items | Unknown (likely 100+) | < 30 |
| Duplicate links | YES | 0 |

### Issues Identified

#### 1.1 Navigation Structure (lib/navigation.ts)
- **636 lines** for navigation alone
- **425 named items** across 7 top-level menus
- Massive duplication:
  - Career Services appears in 8+ places
  - Pathways duplicated 5x
  - Training hub split into 6 sections
  - Barber/Cosmetology host shops have 4 separate sections

#### 1.2 Menu Categories (Current)
```
├── Platform (9 items + nested)
├── Testing (3 items)
├── Solutions (6 items)
├── Programs (100+ items - massive!) │   ├── Healthcare (11 items)
│   ├── Skilled Trades (10 items)
│   ├── Beauty & Apprenticeships (12 items)
│   ├── Barber Host Shops (3 items)
│   ├── Cosmetology Host Shops (3 items)
│   ├── Esthetician Host Shops (2 items)
│   ├── Nail Tech Host Shops (2 items)
│   ├── Technology (5 items)
│   ├── Business & Finance (1 item)
│   ├── Short Courses (3 items)
│   ├── Special Programs (2 items)
│   └── More Programs & Previews (8 items)
├── Students (40+ items - duplicate!)
│   ├── Academic Calendar, Alumni, Attendance
│   ├── Career Assessment, Career Counseling (2x)
│   ├── Career Services (6 sub-items)
│   ├── Training Hub (5 sub-items)
│   ├── Help & Support (20+ items)
│   └── More...
└── About (40+ items - duplicate!)
    ├── Organization (8 items)
    ├── Resources (5 items)
    ├── Contact (4 items)
    ├── Company & News (20+ items)
    ├── AI Tools (8 items)
    └── More (10+ items)
```

### Recommended Navigation Consolidation

| Current Menu | Recommended Action | New Structure |
|--------------|-------------------|---------------|
| **Programs** | Keep top-level, simplify dropdown | Programs (max 10 items with sub-categories) |
| **Testing** | Keep as-is | Testing (3 items - good) |
| **Platform** | Keep as-is | Platform (6 items - good) |
| **Solutions** | Keep as-is | Solutions (5 items - good) |
| **Students** | **MERGE into Programs** | Programs > Student Resources |
| **About** | **MERGE with About** | About (8 items max) |
| **Careers** | **REMOVE or consolidate** | About > Careers |

### Top-Level Menu Target (5 items)
```
1. Programs ▼  ← Simplify to 10 items max
2. Testing     ← Keep standalone
3. Solutions ▼ ← Keep (already clean)
4. Platform ▼  ← Keep (already clean)
5. About ▼     ← Simplify to 8 items
[Apply CTA Button]
```

---

## 2. HERO BANNER AUDIT

### Current HeroBanner.tsx Settings

```tsx
// Current (PROBLEMATIC)
className="relative h-[50svh] sm:h-[55svh] md:h-[60svh] lg:h-[65svh] min-h-[320px]"
```

| Breakpoint | Current Height | Issue |
|------------|----------------|-------|
| Mobile (sm-) | 50svh | Too tall for small screens |
| Tablet (sm) | 55svh | Excessive |
| Desktop (md) | 60svh | Very tall |
| Large Desktop (lg) | 65svh | **Massive** - cuts off content |

### Recommended Hero Height

```tsx
// Recommended
className="relative h-[35svh] sm:h-[40svh] md:h-[45svh] lg:h-[50svh] min-h-[240px] max-h-[500px]"
```

| Breakpoint | Current | Recommended | Reduction |
|------------|---------|-------------|-----------|
| Mobile | 50svh | 35svh | -15% |
| Tablet | 55svh | 40svh | -15% |
| Desktop | 60svh | 45svh | -15% |
| Large | 65svh | 50svh | -15% |

---

## 3. TESTING CENTER PAGE AUDIT

### Issues Found

1. **Large exam cards** - Each exam takes full viewport width
2. **No visual hierarchy** - EPA 608, NRF, etc. all same size
3. **Text-heavy** - Price, description, CTA all competing
4. **Missing images** - Cards show placeholder (large gray areas)

### Recommendations

1. **Grid layout** - 2-3 columns on desktop
2. **Image optimization** - Use proper Next.js Image with sizing
3. **Card redesign** - Logo + title + price + CTA only
4. **Reduce text** - Move details to detail page

---

## 4. CONTENT DENSITY AUDIT

### Current Issues

| Issue | Example | Recommendation |
|-------|---------|----------------|
| Text walls | Program pages have 1000+ words | Use bullet points, accordions |
| No whitespace | Sections run together | Add consistent padding |
| Too many CTAs | 5+ per section | Max 2 per section |
| No visual breaks | Long paragraphs | Use icons, images, cards |

### Text-Heavy Pages (Priority)

1. `/testing` - Dense exam list
2. `/programs/[slug]` - Walls of text
3. `/funding` - Overwhelming options
4. `/about` - Too much content

---

## 5. KENNY BARBERSHOP TEMPLATE COMPARISON

### Reference: Clean Template Structure

```
Header (sticky, minimal)
├── Logo
├── 4-5 Nav Items
└── CTA Button

Hero (30-40vh)
├── Background Image/Video
├── Headline (max 6 words)
├── Subhead (max 20 words)
└── 1 Primary CTA

Content Sections (breathing room)
├── Section Title
├── 3-4 Feature Cards (icon + title + 2 lines)
├── Stats Bar (optional)
└── CTA

Footer
├── 4 Column Links
├── Social
└── Copyright
```

### Elevate Current vs Target

| Element | Current | Target |
|---------|---------|--------|
| Header nav items | 7+ (overload) | 4-5 |
| Hero height | 65vh | 45vh |
| Hero CTAs | 2 | 1-2 |
| Content per section | Text wall | 3-4 cards |
| Whitespace | Minimal | Generous |
| Images | Missing/huge | Consistent sizes |
| Mobile menu | Full page | Slide-out |

---

## 6. ACTION ITEMS

### Immediate (Quick Wins)

- [ ] Reduce hero banner height by 15-20%
- [ ] Add max-height to HeroBanner.tsx
- [ ] Audit and remove 50% of nav items
- [ ] Consolidate duplicate nav sections

### Short Term (1-2 days)

- [ ] Redesign testing center grid layout
- [ ] Add images to exam cards (or remove placeholders)
- [ ] Create mobile nav hamburger menu
- [ ] Reduce text on homepage sections

### Medium Term (1 week)

- [ ] Complete navigation overhaul
- [ ] Template all program pages
- [ ] Add consistent visual system
- [ ] Implement proper image sizing

---

## 7. QUICK REFERENCE

### HeroBanner.tsx Fix
```tsx
// Change from:
className="relative h-[50svh] sm:h-[55svh] md:h-[60svh] lg:h-[65svh] min-h-[320px]"

// To:
className="relative h-[35svh] sm:h-[40svh] md:h-[45svh] lg:h-[50svh] min-h-[240px] max-h-[500px]"
```

### Navigation Consolidation Target
```ts
// Target: < 50 total items
// Current: 425 items
// Action: Audit each section, keep essentials
```

---

## Metadata

- **Created:** 2026-06-23
- **Author:** AI Agent
- **Last Updated:** 2026-06-23
- **Status:** OPEN
- **Priority:** HIGH
