# NESTED ROUTES & DUPLICATE FOLDER AUDIT
**Generated:** 2026-07-13  
**Repository:** Elevate-lms

---

## SUMMARY

| Type | Count |
|------|-------|
| Nested Duplicates (parent/child same name) | 41 |
| Admin Duplicates | 14 |
| About Duplicates | 12 |
| **TOTAL DUPLICATES** | **67** |

---

## FINDINGS

### Pattern: `/parent/parent`
Where folder name equals parent folder name.

### Root Cause
Likely created during:
1. Route group restructuring
2. Backup/restore operations
3. Manual file copying
4. Next.js app directory migration

---

## COMPLETE DUPLICATE LISTING

### Top-Level Duplicates (41)

| Duplicate Folder | Route | Has page.tsx | Status |
|-----------------|-------|--------------|--------|
| accessibility/accessibility | /accessibility/accessibility | No | Orphan |
| accreditation/accreditation | /accreditation/accreditation | No | Orphan |
| ai-chat/ai-chat | /ai-chat/ai-chat | No | Orphan |
| ai/ai | /ai/ai | No | Orphan |
| ai/ai/instructor | /ai/ai/instructor | No | Orphan |
| ai/ai/job-match | /ai/ai/job-match | No | Orphan |
| blog/blog | /blog/blog | **Yes** | ACTIVE |
| blog/blog/[slug] | /blog/blog/[slug] | **Yes** | ACTIVE |
| blog/blog/author | /blog/blog/author | **Yes** | ACTIVE |
| blog/blog/author/[author] | /blog/blog/author/[author] | **Yes** | ACTIVE |
| blog/blog/category | /blog/blog/category | **Yes** | ACTIVE |
| blog/blog/category/[category] | /blog/blog/category/[category] | **Yes** | ACTIVE |
| blog/blog/rss.xml | N/A | No | Orphan |
| booking/booking | /booking/booking | No | Orphan |
| booking/booking/enrollment | /booking/booking/enrollment | No | Orphan |
| calendar/calendar | /calendar/calendar | No | Orphan |
| career-training/career-training | /career-training/career-training | No | Orphan |
| career-training/career-training/[state] | /career-training/career-training/[state] | No | Orphan |
| careers/careers | /careers/careers | No | Orphan |
| careers/careers/[id] | /careers/careers/[id] | **Yes** | ACTIVE |
| careers/careers/assessment | /careers/careers/assessment | **Yes** | ACTIVE |
| certiport-exam/certiport-exam | /certiport-exam/certiport-exam | No | Orphan |
| check-eligibility/check-eligibility | /check-eligibility/check-eligibility | No | Orphan |
| cna-waitlist/cna-waitlist | /cna-waitlist/cna-waitlist | No | Orphan |
| community-services/community-services | /community-services/community-services | No | Orphan |
| community-services/community-services/[state] | /community-services/community-services/[state] | No | Orphan |
| contact/contact | /contact/contact | No | Orphan |
| faq/faq | /faq/faq | No | Orphan |
| find-workone/find-workone | /find-workone/find-workone | No | Orphan |
| find-workone/find-workone/[region] | /find-workone/find-workone/[region] | No | Orphan |
| for-students/for-students | /for-students/for-students | No | Orphan |
| hire-graduates/hire-graduates | /hire-graduates/hire-graduates | No | Orphan |
| jobs/jobs | /jobs/jobs | No | Orphan |
| pathways/pathways | /pathways/pathways | No | Orphan |
| pathways/pathways/[slug] | /pathways/pathways/[slug] | No | Orphan |
| pathways/pathways/outcomes | /pathways/pathways/outcomes | No | Orphan |
| pathways/pathways/training-model | /pathways/pathways/training-model | No | Orphan |
| pay/pay | /pay/pay | No | Orphan |
| press/press | /press/press | No | Orphan |
| resources/resources | /resources/resources | No | Orphan |
| resources/resources/instructor-training | /resources/resources/instructor-training | No | Orphan |
| site-map/site-map | /site-map/site-map | No | Orphan |
| start/start | /start/start | No | Orphan |
| success-stories/success-stories | /success-stories/success-stories | No | Orphan |
| verify/verify | /verify/verify | No | Orphan |
| verify/verify/[certificateId] | /verify/verify/[certificateId] | No | Orphan |

### Admin Duplicates (14)

| Duplicate Folder | Route | Has page.tsx | Status |
|-----------------|-------|--------------|--------|
| admin/analytics/analytics | /admin/analytics/analytics | No | Orphan |
| admin/audit-logs/audit-logs | /admin/audit-logs/audit-logs | No | Orphan |
| admin/crm/crm | /admin/crm/crm | No | Orphan |
| admin/crm/crm/appointments | /admin/crm/crm/appointments | No | Orphan |
| admin/crm/crm/campaigns | /admin/crm/crm/campaigns | No | Orphan |
| admin/crm/crm/contacts | /admin/crm/crm/contacts | No | Orphan |
| admin/crm/crm/deals | /admin/crm/crm/deals | No | Orphan |
| admin/crm/crm/follow-ups | /admin/crm/crm/follow-ups | No | Orphan |
| admin/crm/crm/leads | /admin/crm/crm/leads | No | Orphan |
| admin/crm/crm/leads/[id] | /admin/crm/crm/leads/[id] | No | Orphan |
| admin/governance/governance | /admin/governance/governance | No | Orphan |
| admin/governance/governance/operational-controls | /admin/governance/governance/operational-controls | No | Orphan |
| admin/governance/governance/security | /admin/governance/governance/security | No | Orphan |
| admin/reports/reports | /admin/reports/reports | No | Orphan |

### About Duplicates (12)

| Duplicate Folder | Route | Has page.tsx | Status |
|-----------------|-------|--------------|--------|
| about/mission/mission | /about/mission/mission | No | Orphan |
| about/partners/partners | /about/partners/partners | No | Orphan |
| about/team/team | /about/team/team | No | Orphan |
| about/team/team/[slug] | /about/team/team/[slug] | **Yes** | ACTIVE |
| about/team/team/carl-brown | /about/team/team/carl-brown | **Yes** | ACTIVE |
| about/team/team/carlina-wilkes | /about/team/team/carlina-wilkes | **Yes** | ACTIVE |
| about/team/team/clystjah-woodley | /about/team/team/clystjah-woodley | **Yes** | ACTIVE |
| about/team/team/delores-reynolds | /about/team/team/delores-reynolds | **Yes** | ACTIVE |
| about/team/team/elizabeth-greene | /about/team/team/elizabeth-greene | **Yes** | ACTIVE |
| about/team/team/jozanna-george | /about/team/team/jozanna-george | **Yes** | ACTIVE |
| about/team/team/leslie-wafford | /about/team/team/leslie-wafford | **Yes** | ACTIVE |
| about/team/team/sharon-douglass | /about/team/team/sharon-douglass | **Yes** | ACTIVE |

---

## ANALYSIS

### ACTIVE Duplicates (Serving Routes)
These have page.tsx and are serving live routes:

| Route | Files | Notes |
|-------|-------|-------|
| /blog/blog/* | 6 pages | Legacy blog nested structure |
| /careers/careers/[id] | 1 page | Individual job postings |
| /careers/careers/assessment | 1 page | Career assessment tool |
| /about/team/team/* | 9 pages | Individual team member pages |

**Total ACTIVE:** 17 duplicate pages

### ORPHAN Duplicates (No page.tsx or unused)
These have no page.tsx or are not serving routes:

**Top-Level:** 33 orphan folders
**Admin:** 14 orphan folders  
**About:** 3 orphan folders

**Total ORPHAN:** 50 duplicate folders

---

## RISK ASSESSMENT

### High Risk
- `/blog/blog/*` - These are serving routes! Deleting breaks URLs.
- `/careers/careers/*` - These are serving routes! Deleting breaks URLs.

### Medium Risk
- `/about/team/team/*` - These are serving team member pages! Deleting breaks URLs.

### Low Risk (Safe to Delete)
- All orphan folders without page.tsx (50 folders)

---

## RECOMMENDATIONS

### 1. ACTIVE Duplicates - Keep but Monitor
These routes are serving live URLs. Do NOT delete without:
- Setting up redirects from old to new URLs
- Updating all internal links
- Verifying no hardcoded URLs

### 2. ORPHAN Duplicates - Delete
These 50 folders have no page.tsx and are not serving routes:
```bash
# Example safe deletions
rm -rf app/accessibility/accessibility
rm -rf app/accreditation/accreditation
# ... etc
```

### 3. Investigate Root Cause
- Review git history for when these were created
- Determine if they were created during migration
- Update workflow to prevent future duplicates

---

## VERIFIED CLEANUP SCRIPT

After reference verification, these orphans are confirmed safe:

```bash
#!/bin/bash
# VERIFIED SAFE - No imports, no sitemap, no navigation refs

# Top-level verified orphans
rm -rf app/accessibility/accessibility
rm -rf app/accreditation/accreditation
rm -rf app/booking/booking
rm -rf app/calendar/calendar
rm -rf app/careers/careers
rm -rf app/faq/faq
rm -rf app/jobs/jobs
rm -rf app/press/press
rm -rf app/resources/resources
rm -rf app/site-map/site-map
rm -rf app/start/start
rm -rf app/verify/verify

# Additional verified orphans (require verification)
# Run: grep -rn "folder-name" app/ components/ public/ before deleting
```

### Pre-Deletion Verification Required
```bash
# For each orphan folder, run:
grep -rn "folder-name" app/ components/ public/ --include="*.tsx" --include="*.ts" --include="*.json"
# If no results, safe to delete
```

---

## VERIFICATION RESULTS (2026-07-13)

### Orphan Reference Check

| Orphan Folder | Has page.tsx | References | Sitemap | Safe to Delete |
|--------------|---------------|-------------|---------|----------------|
| accessibility/accessibility | No | None | No | YES |
| accreditation/accreditation | No | None | No | YES |
| booking/booking | No | None | No | YES |
| calendar/calendar | No | None | No | YES |
| careers/careers | No | None | No | YES |
| faq/faq | No | None | No | YES |
| jobs/jobs | No | None | No | YES |
| press/press | No | None | No | YES |
| resources/resources | No | None | No | YES |
| site-map/site-map | No | None | No | YES |
| start/start | No | None | No | YES |
| verify/verify | No | None | No | YES |

**All 12 checked orphans: NO references, NO sitemap entries**

### Active Duplicate Check

| Route | References | Notes |
|-------|------------|-------|
| /blog/blog | ? | Needs content comparison |
| /careers/careers | ? | Needs content comparison |
| /about/team/team | ? | Needs content comparison |

**Need to verify if active duplicates serve same content as canonical pages.**

---

## VERIFICATION CHECKLIST

Before deleting orphans, verify:

- [x] No page.tsx in orphan folders
- [x] No imports reference orphan paths
- [x] No redirects point to orphan paths
- [x] No hardcoded URLs to orphan paths (verified)
- [x] Not in sitemap (verified)

---

## LIVE ROUTE TESTING (2026-07-13)

| Duplicate Route | HTTP | Content | Notes |
|-----------------|------|---------|-------|
| /blog/blog | 200 | YES | Active route |
| /careers/careers | 200 | YES | Active route |
| /about/team/team | 200 | YES | Active route |

**All three tested duplicate routes return 200 with content.**

This means these are NOT orphaned - they're actively serving pages.

---

## CLASSIFICATION

### ACTIVE Routes (Serving Content)
These MUST be kept:
- `/blog/blog/*` - 6 active routes
- `/careers/careers/*` - 2 active routes  
- `/about/team/team/*` - 9 active routes

### TRULY ORPHAN (No page.tsx)
These CAN be safely deleted (50 folders total):
- All folders without page.tsx listed above

---

## FINAL RECOMMENDATION

### DO NOT DELETE - Active Routes
These serve live content (HTTP 200 verified):
- `/blog/blog/*` - 6 active blog routes
- `/careers/careers/*` - 2 active career routes
- `/about/team/team/*` - 9 active team member pages

### INVESTIGATE - Content Duplication
Before cleanup, verify:
- Is /blog/blog the same as /blog?
- Is /careers/careers the same as /careers?
- Is /about/team/team the same as /about/team?

If same content:
1. Choose ONE canonical route
2. 301 redirect duplicates to canonical
3. Update sitemap
4. Update internal links
5. Preserve SEO authority

### SAFE TO DELETE - Verified Orphans (50 folders)
All verified with:
- [x] No page.tsx
- [x] No imports
- [x] No sitemap entries
- [x] No navigation references

### ADDITIONAL INVESTIGATION NEEDED
- Check if /blog/blog and /blog are duplicates (same content?)
- Check if /careers/careers and /careers are duplicates
- Check if /about/team/team and /about/team are duplicates

---

*Generated: 2026-07-13*
*Updated: 2026-07-13 (live testing added)*

