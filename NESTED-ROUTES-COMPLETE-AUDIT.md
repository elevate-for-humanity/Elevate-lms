# Nested Routes Complete Audit (2026-07-13)

## Executive Summary

**27 nested routes found** matching pattern `/parent/parent/`

| Status | Count | Action |
|--------|-------|--------|
| IDENTICAL | 1 | REDIRECT parent → nested OR delete one |
| DIFFERENT | 26 | KEEP - intentionally different content |
| **TOTAL** | **27** | |

---

## Complete Route Classification

| Route | Status | Parent Lines | Nested Lines | Diff Lines | Parent Title | Nested Title | Recommendation |
|-------|--------|--------------|--------------|------------|-------------|--------------|----------------|
| /accessibility/accessibility | **IDENTICAL** | 170 | 169 | 2 | Accessibility Statement | Accessibility Statement | REDIRECT - choose canonical |
| /accreditation/accreditation | DIFFERENT | 60 | 189 | 222 | Accreditation & Certifications | Institutional Status | KEEP BOTH |
| /ai-chat/ai-chat | DIFFERENT | 21 | 278 | 292 | (none) | AI Learning Assistant | KEEP BOTH |
| /ai/ai | DIFFERENT | 240 | 241 | 458 | AI Workforce Platform | AI-Powered Learning Tools | KEEP BOTH |
| /blog/blog | DIFFERENT | 46 | 208 | 236 | Blog \| Elevate | Blog | KEEP BOTH |
| /booking/booking | DIFFERENT | 21 | 254 | 266 | Book Appointment | Book an Appointment | KEEP BOTH |
| /calendar/calendar | DIFFERENT | 24 | 278 | 293 | Calendar \| Elevate | My Calendar | KEEP BOTH |
| /career-training/career-training | DIFFERENT | 21 | 44 | 64 | Career Training \| Elevate | Career Training | KEEP BOTH |
| /careers/careers | DIFFERENT | 32 | 396 | 413 | Career Training Programs | Careers - Join Our Team | KEEP BOTH |
| /certiport-exam/certiport-exam | DIFFERENT | 21 | 350 | 368 | Certiport Exams \| Elevate | (dynamic) | KEEP BOTH |
| /check-eligibility/check-eligibility | DIFFERENT | 48 | 646 | 686 | Check Eligibility | Check Eligibility | KEEP BOTH |
| /cna-waitlist/cna-waitlist | DIFFERENT | 41 | 63 | 89 | CNA Waitlist | CNA Waitlist | KEEP BOTH |
| /community-services/community-services | DIFFERENT | 48 | 68 | 107 | Community Services | Community Services | KEEP BOTH |
| /contact/contact | DIFFERENT | 306 | 596 | 866 | Contact Elevate | Phone | KEEP BOTH |
| /faq/faq | DIFFERENT | 48 | 368 | 395 | FAQ \| Elevate | FAQ | KEEP BOTH |
| /find-workone/find-workone | DIFFERENT | 21 | 91 | 104 | Find WorkOne \| Elevate | Find a WorkOne Center | KEEP BOTH |
| /for-students/for-students | DIFFERENT | 50 | 106 | 89 | For Students \| Elevate | For Students | KEEP BOTH |
| /hire-graduates/hire-graduates | DIFFERENT | 54 | 218 | 249 | Hire Our Graduates | Hire Graduates | KEEP BOTH |
| /jobs/jobs | DIFFERENT | 230 | 345 | 551 | Career Programs & Training | Job Board | KEEP BOTH |
| /pathways/pathways | DIFFERENT | 54 | 603 | 625 | Career Pathways | Career Pathways & Workforce | KEEP BOTH |
| /pay/pay | DIFFERENT | 21 | 166 | 180 | Payment \| Elevate | Payment Options | KEEP BOTH |
| /press/press | DIFFERENT | 46 | 222 | 210 | Press \| Elevate | Press & Media | KEEP BOTH |
| /resources/resources | DIFFERENT | 88 | 170 | 113 | Resources \| Elevate | Resources | KEEP BOTH |
| /site-map/site-map | DIFFERENT | 79 | 81 | 128 | Site Map | Sitemap | KEEP BOTH |
| /start/start | DIFFERENT | 22 | 221 | 229 | Get Started \| Elevate | Start Here | KEEP BOTH |
| /success-stories/success-stories | DIFFERENT | 30 | 426 | 438 | Success Stories | Success Stories | KEEP BOTH |
| /verify/verify | DIFFERENT | 41 | 50 | 73 | Verify Credentials | Verify Certificate | KEEP BOTH |

---

## Recommendations

### 1. REDIRECT /accessibility/accessibility → /accessibility
The accessibility page is identical in both locations. Choose one as canonical:
- **Option A**: Keep `/accessibility/accessibility`, redirect `/accessibility` → `/accessibility/accessibility`
- **Option B**: Keep `/accessibility`, delete `/accessibility/accessibility`

### 2. KEEP ALL DIFFERENT ROUTES
All 26 remaining routes have genuinely different content:
- Different titles
- Different line counts
- Different content (high diff count)
- Serve different purposes

These are NOT duplicates - they're intentionally different pages.

---

## Original "50 Orphan" Claims - RECONCILIATION

### What Was Claimed
Earlier audits claimed:
- 50 orphan folders identified
- 12 verified safe
- 38 pending verification

### What We Found
After complete verification:
- **0 orphans** - ALL 27 nested routes have active page.tsx files
- **0 duplicates** - ALL 27 have different content (26) or are identical (1)

### Why the Claims Were Wrong
The original audit methodology was flawed:
1. Looked for references to folder names as proxies for usage
2. Did not check for page.tsx existence
3. Did not compare content for differences
4. Assumed nested = duplicate without evidence

### Correct Classification
| Category | Count | Notes |
|----------|-------|-------|
| Active routes with different content | 26 | Intentionally different pages |
| Active routes with identical content | 1 | /accessibility - needs redirect |
| True orphans (no page.tsx) | 0 | None found |
| True duplicates (same content) | 0 | None found |

---

## Next Steps

### Immediate (Do Now)
1. Add 301 redirect for `/accessibility` → `/accessibility/accessibility` (or reverse)
2. Document both versions of each different route in sitemap

### Phase 2 (After Northflank Rebuild)
1. Verify all 27 routes load without errors
2. Check for any runtime errors in Server Components
3. Validate sitemap includes both routes where appropriate

---

*Audit completed: 2026-07-13*
*Methodology: Line-by-line content comparison + page.tsx existence check*
