# COMPREHENSIVE PAGE AUDIT REPORT WITH SUPABASE ANALYSIS
## Date: 2026-07-26

---

## SUPABASE TABLES CHECKED:
- `pages` - EMPTY for these routes
- `marketing_pages` - EMPTY
- `website_pages` - EMPTY
- `site_content` - EMPTY for these routes
- `apprenticeship_programs` - **HAS DATA** (slugs found)

---

## 1. MISSING ROUTES (Linked but DO NOT EXIST)

| Route | Referenced In | Supabase | Action |
|-------|---------------|----------|--------|
| `/programs/beauty` | Footer, Industries | `beauty-career-educator` in DB | CREATE page |
| `/programs/business-financial` | Footer | NOT FOUND | Create page or remove link |
| `/student-portal` | Footer | NOT FOUND | Create page or remove link |
| `/lms` | Footer | NOT FOUND | Create page or remove link |
| `/community` | Footer | NOT FOUND | Create page or remove link |
| `/marketplace` | Footer | NOT FOUND | Create page or remove link |

---

## 2. APPRENTICESHIP PROGRAMS IN DATABASE (Active)

| DB Slug | Page Route | File Status |
|---------|-----------|-------------|
| `electrical` | /programs/electrical | STUB (6 lines) |
| `plumbing` | /programs/plumbing | STUB (6 lines) |
| `beauty-career-educator` | /programs/beauty | MISSING PAGE |
| `barber-apprenticeship` | /programs/barber-apprenticeship | EXISTS |
| `cosmetology-apprenticeship` | /programs/cosmetology-apprenticeship | EXISTS |
| `esthetician-apprenticeship` | /programs/esthetician-apprenticeship | EXISTS |
| `nail-technician-apprenticeship` | /programs/nail-technician-apprenticeship | EXISTS |
| `hvac-technician` | /programs/hvac-technician | EXISTS |
| `medical-assistant` | /programs/medical-assistant | EXISTS |
| `cna` | /programs/cna | EXISTS |

---

## 3. STUB PAGES vs DATABASE

| Stub Page | Lines | Supabase | Recommendation |
|-----------|-------|----------|----------------|
| `programs/electrical` | 6 | `electrical` EXISTS | FIX CONTENT |
| `programs/plumbing` | 6 | `plumbing` EXISTS | FIX CONTENT |
| `healthcare` (root) | 7 | `cna` EXISTS | DELETE duplicate |
| `career-training-indiana` | 7 | NOT FOUND | DELETE stub |
| `case-manager` | 7 | NOT FOUND | DELETE stub |
| `community-services-indiana` | 7 | NOT FOUND | DELETE stub |
| `launch` | 7 | NOT FOUND | DELETE stub |
| `partner` | 7 | NOT FOUND | DELETE stub |
| `program-holder/*` | 7-10 | NOT FOUND | DELETE stubs |
| `partners/barbershop-apprenticeship/*` | 9 | NOT FOUND | DELETE stubs |
| `portal/page.tsx` | 9 | NOT FOUND | DELETE stub |

---

## 4. DELETE THESE (No DB data, Stub content):

- [ ] `apps/marketing/app/healthcare/` (duplicate of programs/healthcare)
- [ ] `apps/marketing/app/career-training-indiana/`
- [ ] `apps/marketing/app/case-manager/`
- [ ] `apps/marketing/app/community-services-indiana/`
- [ ] `apps/marketing/app/launch/`
- [ ] `apps/marketing/app/partner/`
- [ ] `apps/marketing/app/program-holder/`
- [ ] `apps/marketing/app/partners/barbershop-apprenticeship/`
- [ ] `apps/marketing/app/portal/page.tsx`

## 5. FIX CONTENT (Has DB data):

- [ ] `apps/marketing/app/programs/electrical/page.tsx`
- [ ] `apps/marketing/app/programs/plumbing/page.tsx`
- [ ] `apps/marketing/app/programs/technology/page.tsx` (38 lines)
- [ ] `apps/marketing/app/wioa-eligibility/page.tsx` (28 lines)
- [ ] `apps/marketing/app/terms/page.tsx` (14 lines)

## 6. CREATE PAGES:

- [ ] `apps/marketing/app/programs/beauty/page.tsx`
- [ ] `apps/marketing/app/programs/business-financial/page.tsx`
- [ ] `apps/marketing/app/student-portal/page.tsx`
- [ ] `apps/marketing/app/lms/page.tsx`
- [ ] `apps/marketing/app/community/page.tsx`
- [ ] `apps/marketing/app/marketplace/page.tsx`

---

Generated: 2026-07-26 - Updated with Supabase Analysis
