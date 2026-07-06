# GLOBAL ROUTE MAP
**Generated:** 2026-07-02
**Total Routes:** 538 pages, 1090 APIs

---

## PORTAL OVERVIEW

| Portal | Routes | Auth | Primary Table | Storage |
|--------|--------|------|--------------|---------|
| Marketing | ~100 | No | programs | images |
| LMS | ~50 | Yes | enrollments | course-videos |
| Admin | ~80 | Yes | all | all |
| Employer | ~30 | Yes | employers | documents |
| Host Shop | ~20 | Yes | host_shops | documents |
| Partner | ~20 | Yes | partners | documents |
| Dev Studio | ~30 | Yes | all | all |
| Store | ~20 | No | products | media |
| Auth | ~10 | No | users | avatars |

---

## MARKETING / PUBLIC ROUTES

| Route | Status | SEO | Storage | Notes |
|-------|--------|-----|---------|-------|
| / | ⬜ | ⬜ | ⬜ | Homepage |
| /about | ⬜ | ⬜ | ⬜ | About page |
| /programs | ⬜ | ⬜ | ⬜ | All programs |
| /programs/barber-apprenticeship | ⬜ | ⬜ | ⬜ | Barber program |
| /programs/nail-technician-apprenticeship | ⬜ | ⬜ | ⬜ | Nail tech program |
| /programs/electrical | ⬜ | ⬜ | ⬜ | Electrical program |
| /programs/plumbing | ⬜ | ⬜ | ⬜ | Plumbing program |
| /education | ⬜ | ⬜ | ⬜ | Education landing |
| /funding | ⬜ | ⬜ | ⬜ | Funding options |
| /employers | ⬜ | ⬜ | ⬜ | Employer landing |
| /contact | ⬜ | ⬜ | ⬜ | Contact form |
| /apply | ⬜ | ⬜ | ⬜ | Application form |
| /testing | ⬜ | ⬜ | ⬜ | Testing info |
| /certificates | ⬜ | ⬜ | ⬜ | Certificate verification |
| /blog | ⬜ | ⬜ | ⬜ | Blog listing |
| /careers | ⬜ | ⬜ | ⬜ | Careers |
| /faq | ⬜ | ⬜ | ⬜ | FAQ |
| /locations | ⬜ | ⬜ | ⬜ | Locations map |
| /press | ⬜ | ⬜ | ⬜ | Press |
| /privacy | ⬜ | ⬜ | ⬜ | Privacy policy |
| /terms | ⬜ | ⬜ | ⬜ | Terms of service |
| /accessibility | ⬜ | ⬜ | ⬜ | Accessibility |
| /accreditation | ⬜ | ⬜ | ⬜ | Accreditation info |

---

## LMS ROUTES

| Route | Auth | Role | Supabase | Storage | Status |
|-------|------|------|----------|---------|--------|
| /lms | Yes | student | enrollments | - | ⬜ |
| /lms/dashboard | Yes | student | enrollments | - | ⬜ |
| /lms/courses | Yes | student | courses, enrollments | course-videos | ⬜ |
| /lms/courses/[id] | Yes | student | lessons | course-videos | ⬜ |
| /lms/certificates | Yes | student | certificates | certificates | ⬜ |
| /lms/assignments | Yes | student | assignments | - | ⬜ |
| /lms/grades | Yes | student | grades | - | ⬜ |
| /lms/profile | Yes | student | profiles | avatars | ⬜ |
| /lms/calendar | Yes | student | calendar | - | ⬜ |
| /lms/notifications | Yes | student | notifications | - | ⬜ |

---

## ADMIN ROUTES

| Route | Auth | Role | Supabase | Status |
|-------|------|------|----------|--------|
| /admin | Yes | admin | - | ⬜ |
| /admin/dashboard | Yes | admin | - | ⬜ |
| /admin/students | Yes | admin | profiles | ⬜ |
| /admin/employers | Yes | admin | employers | ⬜ |
| /admin/courses | Yes | admin | courses | ⬜ |
| /admin/programs | Yes | admin | programs | ⬜ |
| /admin/enrollments | Yes | admin | enrollments | ⬜ |
| /admin/applications | Yes | admin | applications | ⬜ |
| /admin/certificates | Yes | admin | certificates | ⬜ |
| /admin/documents | Yes | admin | documents | ⬜ |
| /admin/documents/templates | Yes | admin | document_templates | ⬜ |
| /admin/contracts | Yes | admin | contracts | ⬜ |
| /admin/governance | Yes | admin | audit_logs | ⬜ |
| /admin/operations | Yes | admin | - | ⬜ |
| /admin/credentials | Yes | admin | credentials | ⬜ |
| /admin/reports | Yes | admin | reports | ⬜ |
| /admin/settings | Yes | admin | settings | ⬜ |
| /admin/staff | Yes | admin | profiles | ⬜ |
| /admin/roles | Yes | admin | roles | ⬜ |
| /admin/logs | Yes | admin | audit_logs | ⬜ |
| /admin/site-health | Yes | admin | - | ⬜ |

---

## EMPLOYER PORTAL

| Route | Auth | Role | Supabase | Storage | Status |
|-------|------|------|----------|---------|--------|
| /employer | Yes | employer | employers | - | ⬜ |
| /employer/dashboard | Yes | employer | employers | - | ⬜ |
| /employer/company | Yes | employer | employers | images | ⬜ |
| /employer/documents | Yes | employer | employer_documents | documents | ⬜ |
| /employer/jobs | Yes | employer | job_postings | - | ⬜ |
| /employer/apprentices | Yes | employer | apprenticeships | - | ⬜ |
| /employer/candidates | Yes | employer | applications | - | ⬜ |
| /employer/reports | Yes | employer | reports | - | ⬜ |
| /employer/analytics | Yes | employer | - | - | ⬜ |

---

## HOST SHOP PORTAL

| Route | Auth | Role | Supabase | Storage | Status |
|-------|------|------|----------|---------|--------|
| /host-shop | Yes | host_shop | host_shops | - | ⬜ |
| /host-shop/dashboard | Yes | host_shop | host_shops | - | ⬜ |
| /host-shop/documents | Yes | host_shop | host_shop_documents | documents | ⬜ |
| /host-shop/apprentices | Yes | host_shop | apprenticeships | - | ⬜ |

---

## PARTNER PORTAL

| Route | Auth | Role | Supabase | Storage | Status |
|-------|------|------|----------|---------|--------|
| /partner | Yes | partner | partners | - | ⬜ |
| /partner/dashboard | Yes | partner | partners | - | ⬜ |
| /partner/programs | Yes | partner | programs | - | ⬜ |
| /partner/documents | Yes | partner | partner_documents | documents | ⬜ |

---

## DEV STUDIO (/app)

| Route | Auth | Role | Purpose | Status |
|-------|------|------|---------|--------|
| /app | Yes | platform | Command center | ⬜ |
| /app/admin/runtime-footprint | Yes | platform | Build status | ⬜ |
| /app/admin/storage | Yes | platform | Supabase status | ⬜ |
| /app/admin/cloudflare | Yes | platform | R2 status | ⬜ |
| /app/admin/errors | Yes | platform | Error logs | ⬜ |
| /app/admin/routes | Yes | platform | Route health | ⬜ |
| /app/admin/course-builder | Yes | platform | Course management | ⬜ |
| /app/admin/program-builder | Yes | platform | Program management | ⬜ |
| /app/admin/content | Yes | platform | Content management | ⬜ |
| /app/admin/ai-tools | Yes | platform | AI assistant | ⬜ |

---

## STORE (/store)

| Route | Auth | Role | Supabase | Storage | Status |
|-------|------|------|----------|---------|--------|
| /store | No | public | products | media | ⬜ |
| /store/checkout | Yes | student | orders | - | ⬜ |
| /store/guides | No | public | products | media | ⬜ |
| /store/cart | Yes | student | orders | - | ⬜ |
| /store/downloads | Yes | student | orders | R2 | ⬜ |

---

## API ROUTES SUMMARY

| Category | Count | Examples |
|----------|-------|----------|
| Auth | ~20 | /api/auth/* |
| Certificates | ~10 | /api/certificates/* |
| Documents | ~30 | /api/documents/*, /api/upload/* |
| Enrollments | ~20 | /api/enrollment/* |
| Payments | ~30 | /api/stripe/*, /api/payments/* |
| Programs | ~20 | /api/programs/* |
| Admin | ~50 | /api/admin/* |
| Cron | ~10 | /api/cron/* |
| Webhooks | ~20 | /api/webhooks/* |
| AI | ~15 | /api/ai/* |
| Export | ~20 | /api/export/* |

---

## STORAGE BUCKETS MAPPING

| Bucket | Public | Used By | Upload Route | Status |
|--------|--------|---------|--------------|--------|
| images | Yes | Marketing, LMS | /api/upload/image | ⬜ |
| media | Yes | Store, Courses | /api/upload/media | ⬜ |
| avatars | Yes | Auth, Profiles | /api/upload/avatar | ⬜ |
| course-videos | No | LMS | /api/upload/video | ⬜ |
| course-assets | No | LMS | /api/upload/course | ⬜ |
| documents | No | All portals | /api/upload/document | ⬜ |
| certificates | No | Admin, LMS | /api/certificates/pdf | ⬜ |
| student-submissions | No | LMS | /api/enrollment/submit | ⬜ |
| contracts | No | Admin | /api/contracts/* | ⬜ |
| agreements | No | Employer | /api/agreements/* | ⬜ |

---

## CLOUDFLARE MAPPING

| Service | Used By | Route | Status |
|---------|---------|-------|--------|
| R2 (elevate-media) | Store downloads | /api/download/* | ⬜ |
| R2 (course-videos) | LMS videos | /api/video/* | ⬜ |
| Stream | Course videos | /api/stream/* | ⬜ |
| Images | CDN images | CDN URLs | ⬜ |

---

## AUTH FLOW MAPPING

| Route | Auth Method | Session | RLS |
|-------|------------|---------|-----|
| /lms/* | Supabase | Yes | Yes |
| /admin/* | Supabase | Yes | Yes |
| /employer/* | Supabase | Yes | Yes |
| /host-shop/* | Supabase | Yes | Yes |
| /partner/* | Supabase | Yes | Yes |
| /app/* | Supabase | Yes | Yes |
| /store/checkout | Stripe | Yes | No |

---

**Legend:**
- ⬜ = Not audited
- ✅ = Complete
- ⚠️ = Has issues
- ❌ = Broken
