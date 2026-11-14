# 🔴 FINAL PORTAL STRUCTURE

**Generated:** July 7, 2026  
**Branch:** `feature/production-certification-2026-07-07`  
**Commits:** 32

---

## THE FOUR USER TYPES

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        FOUR SEPARATE PORTALS                                                           ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                                        ║
║   1. EMPLOYER              2. HOST SHOP           3. APPRENTICE           4. LMS/STUDENT      5. STAFF              ║
║   ───────────────         ───────────────         ───────────────         ──────────────      ─────────             ║
║   /employer/dashboard     /host-shop/dashboard    /app/apprentice          /lms/dashboard      /admin/staff-portal   ║
║   430 lines ✅            25 pages ✅              487 lines ✅             132 lines ✅        509 lines ✅           ║
║                                                                                                                        ║
║   • Post jobs             • Barber shops          • Track hours           • View courses      • Admin tasks          ║
║   • Browse candidates     • Cosmetology          • Log competencies      • Track progress   • Manage students      ║
║   • Manage applications   • Nail tech            • Timeclock             • View grades      • Reports              ║
║   • Sponsor apprentices   • Esthetician          • State board           • Credentials      • Support              ║
║                           • Manage apprentices                                                               ║
║                           • Sign RTI hours                                                                  ║
║                           • Competencies                                                                    ║
║                                                                                                                        ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 1. EMPLOYER PORTAL ✅

| Property | Value |
|----------|-------|
| **Route** | `/employer/dashboard` |
| **Lines** | 430 lines |
| **Pages** | 28 pages |
| **Status** | ✅ WORKING |

---

## 2. HOST SHOP PORTAL (WAS PARTNER) ✅

| Property | Value |
|----------|-------|
| **Route** | `/host-shop/dashboard` |
| **Pages** | 25 pages |
| **Status** | ✅ WORKING |

### Shop Types (all use same dashboard):
- Barber Host Shops
- Cosmetology Host Shops
- Nail Tech Host Shops
- Esthetician Host Shops

### Pages:
```
/host-shop/page.tsx                    (landing page)
/host-shop/login/page.tsx             (login)
/host-shop/onboarding/page.tsx        (onboarding)
/host-shop/apply/page.tsx            (application)
/host-shop/dashboard/page.tsx        (entry point → /board)
/host-shop/dashboard/board/page.tsx  (main view)
/host-shop/dashboard/apprentices/page.tsx
/host-shop/dashboard/apprentices/new/page.tsx
/host-shop/dashboard/attendance/page.tsx
/host-shop/dashboard/attendance/record/page.tsx
/host-shop/dashboard/competencies/page.tsx
/host-shop/dashboard/documents/page.tsx
/host-shop/dashboard/hours/page.tsx
/host-shop/dashboard/hours/pending/page.tsx
/host-shop/dashboard/programs/page.tsx
/host-shop/dashboard/programs/[program]/page.tsx
/host-shop/dashboard/programs/[program]/edit/page.tsx
/host-shop/dashboard/settings/page.tsx
/host-shop/dashboard/students/page.tsx
/host-shop/dashboard/messages/page.tsx
/host-shop/dashboard/profile/page.tsx
/host-shop/dashboard/reports/page.tsx
/host-shop/dashboard/schedule/page.tsx
/host-shop/dashboard/store/page.tsx
/host-shop/dashboard/subscription/page.tsx
```

---

## 3. APPRENTICE PORTAL ✅

| Property | Value |
|----------|-------|
| **Route** | `/app/apprentice` |
| **Lines** | 487 lines |
| **Pages** | 14 pages |
| **Status** | ✅ WORKING |

### Pages:
```
/app/apprentice
/app/apprentice/hours
/app/apprentice/hours/log
/app/apprentice/competencies
/app/apprentice/competencies/log
/app/apprentice/timeclock
/app/apprentice/skills
/app/apprentice/course
/app/apprentice/documents
/app/apprentice/handbook
/app/apprentice/workbook
/app/apprentice/billing
/app/apprentice/transfer-hours
/app/apprentice/state-board
```

---

## 4. LMS/STUDENT PORTAL ✅

| Property | Value |
|----------|-------|
| **Route** | `/lms/dashboard` |
| **Lines** | 132 lines |
| **Pages** | 10+ pages |
| **Status** | ✅ WORKING |

### For non-apprenticeship students (healthcare, trades, etc.)

### Redirects:
- `/learner/dashboard` → `/lms`

---

## 5. STAFF PORTAL ✅

| Property | Value |
|----------|-------|
| **Route** | `/admin/staff-portal/dashboard` |
| **Lines** | 509 lines |
| **Status** | ✅ WORKING |

### For internal staff (not admins)

---

## 6. CASE MANAGER PORTAL ✅

| Property | Value |
|----------|-------|
| **Route** | `/case-manager/dashboard` |
| **Lines** | 322 lines |
| **Pages** | 7 pages |
| **Status** | ✅ WORKING |

### Pages:
```
/case-manager/dashboard
/case-manager/participants
/case-manager/participants/[id]
/case-manager/reports/wioa
/case-manager/placements
```

---

## DEPRECATED: /partner/*

All `/partner/*` routes now redirect to `/host-shop/*`

```
/partner → /host-shop
/partner/dashboard → /host-shop/dashboard
/partner/onboarding → /host-shop/onboarding
/partner/attendance → /host-shop/dashboard/attendance
... etc.
```

---

## SUMMARY TABLE

| Portal | Route | Pages | Status |
|--------|-------|-------|--------|
| **Employer** | `/employer/dashboard` | 28 | ✅ |
| **Host Shop** | `/host-shop/dashboard` | 25 | ✅ |
| **Apprentice** | `/app/apprentice` | 14 | ✅ |
| **LMS/Student** | `/lms/dashboard` | 10+ | ✅ |
| **Staff** | `/admin/staff-portal/dashboard` | 2 | ✅ |
| **Case Manager** | `/case-manager/dashboard` | 7 | ✅ |

---

**Total: 6 portals, all working**

---

**Audit Version:** FINAL  
**Date:** July 7, 2026  
**Commits:** 32  
**Branch:** `feature/production-certification-2026-07-07`
