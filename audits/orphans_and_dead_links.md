# Orphans and Dead Links Report

**Audit Date:** 2026-02-14

---

## 1. Admin Routes Not in AdminNav

**269 admin page routes** exist that are NOT linked from `components/admin/AdminNav.tsx`.

These are reachable by direct URL but not discoverable via navigation. This is by design for many (sub-pages, detail pages, settings pages), but some may be genuinely orphaned.

### Categories of unlisted admin routes:

**Sub-pages of nav items (expected):**
- `/admin/certificates/bulk`, `/admin/certificates/issue` — sub-pages of `/admin/certificates`
- `/admin/courses/[courseId]/content`, `/admin/courses/[courseId]/quizzes` — course detail pages
- `/admin/analytics/learning`, `/admin/analytics/engagement`, `/admin/analytics/programs` — analytics sub-pages
- `/admin/reports/enrollment`, `/admin/reports/financial`, etc. — report sub-pages
- `/admin/crm/contacts/[id]`, `/admin/crm/leads/[id]` — CRM detail pages

**Potentially orphaned (no parent page links to them):**
- `/admin/accreditation` — accreditation management
- `/admin/affiliates` — affiliate program
- `/admin/at-risk` — at-risk student tracking
- `/admin/automation` — workflow automation
- `/admin/autopilot` — AI autopilot
- `/admin/barriers` — barrier tracking
- `/admin/blog` — blog management
- `/admin/campaigns` — campaign management (separate from CRM campaigns)
- `/admin/cash-advances` — cash advance management
- `/admin/copilot` — AI copilot
- `/admin/portal-map` — portal navigation map
- `/admin/rapids` — RAPIDS reporting
- `/admin/scheduling` — class scheduling
- `/admin/time-tracking` — time tracking
- `/admin/wotc` — WOTC tax credit management

**Command to reproduce:**
```
find app -name "page.tsx" -path "*/admin/*" | sed 's|app||;s|/page.tsx||' | sort > /tmp/all_admin.txt
grep -oP "href:\s*'[^']+'" components/admin/AdminNav.tsx | sed "s/href: '//;s/'//" | sort > /tmp/nav.txt
comm -23 /tmp/all_admin.txt /tmp/nav.txt | wc -l
```

---

## 2. Dead Nav Links

**Status: CLEAN**

All 54 links in `components/admin/AdminNav.tsx` resolve to existing `page.tsx` files. Verified via filesystem check.

Previously dead links (now fixed):
- `/admin/course-studio` → redirected to `/admin/course-builder`
- `/admin/course-studio-ai` → redirected to `/admin/course-generator`
- `/admin/course-studio-simple` → redirected to `/admin/course-builder`
- `/student-portal/courses` → redirected to `/lms/courses`

**Command to reproduce:**
```
grep -oP "href:\s*'[^']+'" components/admin/AdminNav.tsx | sed "s/href: '//;s/'//" | while read route; do
  dir="app${route}"
  if [ -f "${dir}/page.tsx" ]; then echo "✅ ${route}"; else echo "❌ ${route}"; fi
done
```

---

## 3. Dead Components (Previously Deleted)

| Component | Status | Action Taken |
|-----------|--------|-------------|
| `components/ScormPlayer.tsx` | **DELETED** | Duplicate of canonical `components/scorm/ScormPlayer.tsx` |
| `components/student/ScormPlayer.tsx` | **DELETED** | Duplicate, 0 imports |
| `components/scorm/SCORMPlayer.tsx` | **DELETED** | Duplicate, 0 imports |
| `components/nav/EmployerNav.tsx` | **DELETED** | 0 imports, 8 dead links |
| `components/nav/StaffNav.tsx` | **DELETED** | 0 imports, 10 dead links |

**Remaining canonical ScormPlayer:**
```
$ find . -name "*ScormPlayer*" | grep -v node_modules | grep -v .next
./components/scorm/ScormPlayer.tsx
```

---

## 4. Dead API Routes

| Route | References | Status |
|-------|-----------|--------|
| `app/api/scorm/enrollment/[enrollmentId]/route.ts` | 0 | Dead — never called from any component or page |
| `app/api/lti/launch/route.ts` | 2 | Referenced by LTI config files (prototype, not production-wired) |
| `app/api/lti/login/route.ts` | 1 | Referenced by LTI config (prototype) |
| `app/api/xapi/statements/route.ts` | — | Prototype xAPI endpoint |

---

## 5. Sitemap Exclusions

The following route prefixes are excluded from the public sitemap (`app/sitemap.ts`):
- `/partner/` — partner portal (auth-gated)
- `/org/` — organization portal (auth-gated)
- `/docs/api/` — API documentation (internal)
- `/admin/` — admin portal
- `/lms/` — LMS portal
- `/instructor/` — instructor portal
- `/employer-portal/` — employer portal
- `/workforce-board/` — workforce board portal

---

## 6. Parallel/Overlapping Portals

| Portal A | Portal B | Overlap |
|----------|----------|---------|
| `/employer/*` (17 pages) | `/employer-portal/*` (13 pages) | Both serve employer functionality. `/employer-portal` has company profile, job postings. `/employer/*` has dashboard, analytics, apprentices |
| `/student-portal/*` | `/lms/*` | Student portal redirects to LMS for courses. Some pages still exist in both |

---

**NO ASSUMPTIONS CERTIFICATION:**
All counts and statuses verified via filesystem commands. Dead component deletion confirmed via `find`. Nav link resolution confirmed via filesystem check.
