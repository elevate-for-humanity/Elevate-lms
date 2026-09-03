# LINE-BY-LINE AUDIT: FOOTER vs HEADER NAVIGATION

## Date: 2026-07-26

---

## 1. FOOTER LINKS (PlatformFooter.tsx)

### CURRENT FOOTER:
```
resources: ["/funding", "/testing", "/barber-and-beauty-apprenticeships", "/career-services"]
company: ["/about", "/contact", "/partners", "/employers"]
legal: ["/privacy", "/terms", "/accessibility", "/handbook"]
```

### AUDIT RESULTS:
| Link | Route | Status | Lines |
|------|-------|--------|-------|
| Funding Options | /funding | ✅ EXISTS | 2798 |
| Testing Center | /testing | ✅ EXISTS | 2090 |
| Apprenticeship | /barber-and-beauty-apprenticeships | ✅ EXISTS | 50 |
| Career Services | /career-services | ✅ EXISTS | 331 |
| About Us | /about | ✅ EXISTS | 1622 |
| Contact | /contact | ✅ EXISTS | 905 |
| Partners | /partners | ✅ EXISTS | 1191 |
| Employers | /employers | ✅ EXISTS | 244 |
| Privacy Policy | /privacy | ✅ EXISTS | 732 |
| Terms of Service | /terms | ⚠️ STUB | 14 |
| Accessibility | /accessibility | ✅ EXISTS | 171 |
| Student Handbook | /handbook | ✅ EXISTS | 198 |

**ISSUE:** /terms is a STUB (14 lines)

---

## 2. HEADER NAVIGATION (config/navigation.ts)

### SECTION-BY-SECTION AUDIT:

| Section | Link | Route | Status |
|---------|------|-------|--------|
| **Testing** | Testing Home | /testing | ✅ EXISTS |
| | Schedule Exam | /testing/book | ✅ |
| | Certiport | /testing/certiport | ✅ |
| | EPA 608 | /testing/epa608 | ✅ |
| | WorkKeys | /testing/workkeys | ✅ |
| | NHA | /testing/nha | ✅ |
| | NRF Rise Up | /testing/riseup | ✅ |
| | ASE | /testing/ase | ✅ |
| | Midland | /testing/midland | ✅ |
| **Programs** | All Programs | /programs | ✅ EXISTS |
| | Healthcare | /programs/healthcare | ✅ EXISTS |
| | Skilled Trades | /programs/skilled-trades | ✅ EXISTS |
| | Beauty & Cosmetology | /barber-and-beauty-apprenticeships | ✅ EXISTS |
| | Technology | /programs/technology | ⚠️ STUB (38 lines) |
| | Business | /programs/business | ✅ EXISTS |
| **Funding** | How Funding Works | /funding | ✅ EXISTS |
| | WIOA Funding | /funding/wioa | ✅ EXISTS |
| | Workforce Ready Grant | /funding/wrg | ✅ EXISTS |
| | FAQ | /faq | ✅ EXISTS |
| **Partners** | Partner Network | /admin/partners | ⚠️ ADMIN APP |
| | For Employers | /employers | ✅ EXISTS |
| | Hire Graduates | /hire-graduates | ✅ EXISTS |
| | Workforce Partners | /workforce-partners | ✅ EXISTS |
| | Career Services | /career-services | ✅ EXISTS |
| **Portals** | Student Portal | /lms/dashboard | ⚠️ LMS APP |
| | Admin Portal | /admin | ⚠️ ADMIN APP |
| | Partner Portal | /partner/dashboard | ⚠️ PARTNER APP |
| | Workforce Board | /workforce-board/dashboard | ⚠️ ADMIN APP |
| | Staff Portal | /admin/staff-portal/dashboard | ⚠️ ADMIN APP |
| | Instructor Portal | /admin/instructor/dashboard | ⚠️ ADMIN APP |
| | Employer Portal | /employer/dashboard | ⚠️ ADMIN APP |
| | Host Shop Portal | /host-shop/dashboard | ⚠️ MARKETING |
| | Parent Portal | /parent-portal/dashboard | ⚠️ ADMIN APP |
| **Resources** | Success Stories | /success-stories | ✅ EXISTS |
| | Blog | /blog | ⚠️ STUB (46 lines) |
| | Videos | /videos | ❌ MISSING |
| | Webinars | /webinars | ⚠️ STUB (25 lines) |
| | News | /news | ⚠️ STUB (25 lines) |
| | Events | /events | ⚠️ STUB (25 lines) |
| | FAQ | /faq | ✅ EXISTS |
| **About** | About Us | /about | ✅ EXISTS |
| | Our Team | /team | ✅ EXISTS |
| | Platform | /platform | ✅ EXISTS |
| | Features | /features | ❌ MISSING |
| | Pricing | /pricing | ✅ EXISTS |
| | Accreditation | /accreditation | ✅ EXISTS |
| | Donate | /donate | ✅ EXISTS |
| | Grants | /grants | ✅ EXISTS |
| | Philanthropy | /philanthropy | ✅ EXISTS |

---

## 3. MISSING/NEED FIX:

### ❌ MISSING (No page exists):
- /videos
- /features

### ⚠️ STUBS (< 50 lines):
| Route | Lines | Action |
|-------|-------|--------|
| /terms | 14 | FIX CONTENT |
| /blog | 46 | FIX CONTENT |
| /events | 25 | FIX CONTENT |
| /webinars | 25 | FIX CONTENT |
| /news | 25 | FIX CONTENT |
| /programs/technology | 38 | FIX CONTENT |

---

## 4. APP LOCATION MAP:

```
apps/
├── marketing/app/    -> Public marketing pages
├── admin/app/       -> Admin dashboard pages
├── lms/app/         -> Student LMS pages
└── partner/app/     -> Partner portal pages
```

Links with ⚠️ ADMIN/LMS/PARTNER are valid routes but in DIFFERENT apps.

---

## 5. RECOMMENDED FIXES:

### FOOTER:
- [x] /terms - NEEDS CONTENT (14 lines)

### HEADER - STUBS:
- [ ] /blog - Add real content
- [ ] /events - Add real content
- [ ] /webinars - Add real content
- [ ] /news - Add real content
- [ ] /programs/technology - Add real content (DB has tech slugs)

### HEADER - MISSING:
- [ ] /videos - Create page or remove link
- [ ] /features - Create page or remove link

---

Generated: 2026-07-26
