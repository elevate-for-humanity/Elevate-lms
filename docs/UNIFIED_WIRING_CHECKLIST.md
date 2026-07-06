# UNIFIED PLATFORM COMPLETION CHECKLIST

**Goal:** Marketing site, LMS, Admin, Dev Studio, Supabase, Cloudflare, storage, payments, SEO, and portals operate as one connected system.

**Rule:** Do not delete incomplete features. Classify, wire, and finish them.

---

## 1. GLOBAL ROUTE MAP

### Route Inventory

| Route | Container | Auth | Role | Supabase Table | Storage Bucket | Status |
|-------|-----------|------|------|----------------|----------------|--------|
| / | Marketing | No | public | - | images | ⬜ |
| /programs | Marketing | No | public | programs | images | ⬜ |
| /programs/[program] | Marketing | No | public | programs | images | ⬜ |
| /apprenticeships | Marketing | No | public | programs | images | ⬜ |
| /funding | Marketing | No | public | - | images | ⬜ |
| /employers | Marketing | No | public | employers | images | ⬜ |
| /education | Marketing | No | public | programs | images | ⬜ |
| /lms/* | LMS | Yes | student | enrollments, courses | course-videos | ⬜ |
| /admin/* | Admin | Yes | admin | all tables | all buckets | ⬜ |
| /employer/* | Employer | Yes | employer | employers | documents | ⬜ |
| /host-shop/* | Host Shop | Yes | host_shop | host_shops | documents | ⬜ |
| /partner/* | Partner | Yes | partner | partners | documents | ⬜ |
| /app/* | Dev Studio | Yes | platform | all tables | all buckets | ⬜ |

---

## 2. MARKETING SITE

### Required: Every page must have:
- [ ] HTTP 200
- [ ] No runtime errors
- [ ] Correct header/footer
- [ ] Correct CTA
- [ ] Correct images
- [ ] Correct mobile layout
- [ ] Correct metadata
- [ ] Canonical URL
- [ ] Sitemap inclusion
- [ ] No placeholder text
- [ ] No broken links
- [ ] No duplicate pages

### Pages to Audit:
- [ ] /
- [ ] /programs
- [ ] /programs/[program]
- [ ] /apprenticeships
- [ ] /funding
- [ ] /employers
- [ ] /testing
- [ ] /contact
- [ ] /apply
- [ ] /education
- [ ] /about

---

## 3. LMS STUDENT JOURNEY

### Journey: Lead → Application → Approval → Enrollment → Dashboard → Course → Module → Lesson → Quiz → Certificate → Completion

### Checkpoints:
- [ ] Student login works
- [ ] Course dashboard loads
- [ ] Course cards load from Supabase
- [ ] Lessons are connected
- [ ] Videos load from Supabase/Cloudflare
- [ ] Quizzes save results
- [ ] Progress tracking works
- [ ] Certificates generate
- [ ] Completion status updates
- [ ] Student documents upload
- [ ] No null components
- [ ] No missing imports
- [ ] No server/client boundary errors

---

## 4. ADMIN PORTAL

### Functions to Audit:
- [ ] Applications
- [ ] Students
- [ ] Employers
- [ ] Programs
- [ ] Courses
- [ ] Modules
- [ ] Lessons
- [ ] Quizzes
- [ ] Certificates
- [ ] Documents
- [ ] Payments
- [ ] Reports
- [ ] Staff users
- [ ] Roles
- [ ] Settings
- [ ] Logs
- [ ] Site health

### Each page must have:
- [ ] Auth guard
- [ ] Role guard
- [ ] Working data table
- [ ] Search/filter
- [ ] Edit/create flow
- [ ] Save to Supabase
- [ ] Error handling
- [ ] Empty state
- [ ] Loading state
- [ ] Audit log

---

## 5. DEV STUDIO

### Required panels:
- [ ] Route exists
- [ ] Admin/platform role only
- [ ] Build status visible
- [ ] Deployment status visible
- [ ] Environment variables visible safely
- [ ] Supabase status visible
- [ ] Cloudflare status visible
- [ ] Route health visible
- [ ] Error logs visible
- [ ] AI tools connected
- [ ] Course builder connected
- [ ] Website builder connected
- [ ] Program builder connected
- [ ] Document builder connected
- [ ] SEO assistant connected
- [ ] Storage manager connected

---

## 6. COURSE BUILDER

### Flow: Course Builder → creates course → modules → lessons → videos/documents → quizzes → publishes → LMS → dashboard → progress → certificate

### Checkpoints:
- [ ] No orphan courses
- [ ] No orphan modules
- [ ] No orphan lessons
- [ ] No missing program IDs
- [ ] No broken slugs
- [ ] No missing storage files
- [ ] No placeholder lessons
- [ ] No fake publish state

---

## 7. PROGRAM BUILDER

### Flow: Program Builder → registry → public page → application → checkout → enrollment → dashboard → SEO → sitemap → admin → reporting

### Checkpoints:
- [ ] Program slug matches everywhere
- [ ] Program ID matches Supabase
- [ ] Application routes correct
- [ ] Funding labels correct
- [ ] Self-pay vs funded correct
- [ ] Images exist
- [ ] CTA works
- [ ] Course enrollment works

---

## 8. SUPABASE TABLES

### Tables to Audit:
- [ ] users/profiles
- [ ] programs
- [ ] courses
- [ ] modules
- [ ] lessons
- [ ] enrollments
- [ ] applications
- [ ] employers
- [ ] host_shops
- [ ] apprenticeships
- [ ] certificates
- [ ] documents
- [ ] payments
- [ ] audit_logs
- [ ] settings

### For each table document:
- Used by route
- Used by API
- Used by component
- RLS policy
- Indexes
- Foreign keys
- Known issues

---

## 9. SUPABASE STORAGE BUCKETS

### Buckets to Audit:
- [ ] images
- [ ] course-assets
- [ ] course-videos
- [ ] documents
- [ ] certificates
- [ ] student-submissions
- [ ] compliance-evidence

### For each bucket document:
- Public/private
- Used by
- Upload route
- Download route
- Signed URL required
- RLS/storage policy
- Allowed file types
- Max file size
- Fallback

---

## 10. CLOUDFLARE / R2 / MEDIA

### Configuration (CONFIGURED):
- [x] Endpoint: https://ff0d5ca582b5911a626ba012935cf3ec.r2.cloudflarestorage.com
- [x] Bucket: elevate-media
- [ ] Set CLOUDFLARE_R2_SECRET_ACCESS_KEY in Northflank

### Map every asset:
- [ ] R2 buckets
- [ ] Cloudflare Images
- [ ] Cloudflare Stream
- [ ] CDN URLs
- [ ] Cache rules
- [ ] Signed URLs
- [ ] Video delivery
- [ ] PDF/document delivery

---

## 11. DYNAMIC IMPORTS

### Common Errors to Fix:
- `got: object` = imported wrong export shape
- `got: null` = component resolved to nothing
- `Functions cannot be passed to Client Components` = server/client boundary wrong

### Audit every dynamic import:
```tsx
// Default export
dynamic(() => import("@/components/Component"))

// Named export
dynamic(() => import("@/components/Component").then((m) => m.ComponentName))
```

---

## 12. PDF VIEWER

### Required flows:
- [ ] Certificate PDFs
- [ ] MOU PDFs
- [ ] Uploaded documents
- [ ] Supabase document storage
- [ ] Signed download URLs
- [ ] Admin document viewer
- [ ] Student document viewer
- [ ] Employer/host shop document viewer

### Features:
- [ ] View
- [ ] Download
- [ ] Print
- [ ] Auth guard
- [ ] Role permissions
- [ ] Signed URL
- [ ] Error state
- [ ] Empty state

---

## 13. RICH TEXT EDITOR

### Components:
- [ ] RichContentEditor (admin lesson editor)
- [ ] RichText display component
- [ ] Admin pages needing editing
- [ ] Blog/content pages
- [ ] Course lesson editor
- [ ] Program page editor
- [ ] Document/template editor

### Required:
- [ ] Save to Supabase
- [ ] Load existing content
- [ ] Auth guard
- [ ] Role guard
- [ ] Autosave
- [ ] Sanitized HTML
- [ ] Preview mode

---

## 14. MAP / LOCATION

### Features:
- [ ] Employer locations
- [ ] Host shop locations
- [ ] Training locations
- [ ] Testing locations
- [ ] Program service areas
- [ ] Student geofence/timeclock

### Required:
- [ ] Existing location data in Supabase
- [ ] Role permissions
- [ ] Public/private views
- [ ] Fallback if provider missing
- [ ] No missing component stubs

---

## 15. AUTH AND ROLES

### Roles:
- [ ] public
- [ ] student
- [ ] instructor
- [ ] employer
- [ ] host_shop
- [ ] partner
- [ ] admin
- [ ] platform_operator

### Checkpoints:
- [ ] Login works
- [ ] Logout works
- [ ] Session persists
- [ ] Unauthorized redirected correctly
- [ ] Public pages stay public
- [ ] Admin pages protected
- [ ] LMS pages protected
- [ ] Dev Studio protected
- [ ] APIs protected
- [ ] RLS matches app roles

---

## 16. NAVIGATION

### Nav sources:
- [ ] Header nav
- [ ] Footer nav
- [ ] Student nav
- [ ] Admin nav
- [ ] Employer nav
- [ ] Host shop nav
- [ ] Dev Studio nav
- [ ] Sitemap nav

### Checkpoints:
- [ ] No broken href
- [ ] No null href
- [ ] No duplicate route labels
- [ ] No orphan pages
- [ ] No hidden critical pages
- [ ] Navigation matches user role

---

## 17. SEO

### Every public page must have:
- [ ] Title
- [ ] Description
- [ ] Canonical
- [ ] OpenGraph image
- [ ] Structured data
- [ ] Sitemap entry
- [ ] robots allowed
- [ ] Internal links
- [ ] No 500/503

### Google indexing blockers:
- [ ] No 500 errors
- [ ] No 503 no healthy upstream
- [ ] No runtime crashes
- [ ] No missing metadata
- [ ] No no sitemap
- [ ] No blocked robots
- [ ] No duplicate canonicals

---

## 18. PAYMENTS

### Components:
- [ ] Stripe checkout
- [ ] Application fees
- [ ] Tuition payments
- [ ] Payment plans
- [ ] Subscriptions
- [ ] Webhooks
- [ ] Receipts
- [ ] Refunds
- [ ] Enrollment trigger after payment

### Checkpoints:
- [ ] Webhook raw body
- [ ] Correct signing secret
- [ ] Correct environment
- [ ] No fake success
- [ ] No failed enrollment after payment

---

## 19. EMAIL / SMS

### Notifications:
- [ ] Invite emails
- [ ] Application confirmation
- [ ] Enrollment confirmation
- [ ] MOU notifications
- [ ] Certificate emails
- [ ] Password reset
- [ ] SMS if active

### Checkpoints:
- [ ] Invalid SendGrid key does not crash app
- [ ] Failures are logged
- [ ] Workflow continues when email is non-fatal

---

## 20. FINAL ACCEPTANCE GATES

### Do not call complete until:
- [ ] No 500 errors
- [ ] No 503 no healthy upstream
- [ ] No Element type invalid
- [ ] No null component errors
- [ ] No server/client function boundary errors
- [ ] No missing required Supabase fields
- [ ] No invalid images
- [ ] No broken application forms
- [ ] No broken dashboards
- [ ] No broken course flow
- [ ] No broken payment flow
- [ ] No broken PDF/document flow
- [ ] No orphan public routes
- [ ] No placeholder production content

### Required proof:
- [ ] GET / = 200
- [ ] GET /programs = 200
- [ ] GET /programs/barber-apprenticeship = 200
- [ ] GET /education = 200
- [ ] Student dashboard = 200 after login
- [ ] Admin dashboard = 200 after login
- [ ] Employer portal = 200 after login
- [ ] Host shop portal = 200 after login
- [ ] Dev Studio = admin-only and working
- [ ] Supabase read/write verified
- [ ] Storage upload/download verified
- [ ] Cloudflare asset delivery verified
- [ ] Latest logs clean

---

## 21. DOCUMENT UPLOAD (ENROLLMENT FLOW)

### Required wiring:
- [ ] DocumentUpload component → enrollment flow
- [ ] Upload to Supabase documents bucket
- [ ] Auth guard for student uploads
- [ ] Admin approval workflow
- [ ] Document type validation
- [ ] File size limits enforced
- [ ] Status tracking (pending/approved/rejected)

### Flow:
```
Student → DocumentUpload → /api/upload/document → Supabase Storage → documents bucket
    → enrollment_documents table → Admin review → Status update
```

---

## 22. MOU SIGNING (DOCUMENTSIGNATUREBLOCK)

### Required wiring:
- [ ] DocumentSignatureBlock component → MOU flow
- [ ] MOU PDF generation
- [ ] Digital signature capture
- [ ] Save signed MOU to storage
- [ ] Employer/partner notification
- [ ] Audit trail

### Flow:
```
Employer/Partner → View MOU → Sign → DocumentSignatureBlock → Save to mous bucket
    → mou_signatures table → Notify counterparty → Mark complete
```

---

## CLOUD-1: DocumentUpload wiring to enrollment flow
**Status:** ⬜ Not wired
**Owner:** -
**Fix needed:** Connect DocumentUpload to /api/enrollment/upload-document

---

## CLOUD-2: DocumentSignatureBlock MOU signing
**Status:** ⬜ Not wired
**Owner:** -
**Fix needed:** Connect DocumentSignatureBlock to MOU PDF API

---

## CLASSIFICATION RULES

Classify each item as ONE of:
- **Complete** - All dependencies wired, tested, in production
- **Partially built** - Core exists, needs completion
- **Built but not wired** - Exists but not connected
- **Missing component** - Needs to be built
- **Missing route** - Needs route created
- **Missing storage mapping** - Needs storage connection
- **Deprecated only if approved** - Requires explicit approval to remove

---

**FINAL RULE:** If code exists, first assume it was intended. Your platform needs unification and wiring discipline, not deletion.
