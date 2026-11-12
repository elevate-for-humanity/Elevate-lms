# SUPABASE → ROUTE MAPPING AUDIT

## TABLE 1: programs
**Route Pattern:** `/programs/[slug]` (dynamic)

| Supabase Field | Route | Status |
|----------------|-------|--------|
| slug = barber-apprenticeship | /programs/barber-apprenticeship | ✅ EXISTS |
| slug = cosmetology-apprenticeship | /programs/cosmetology-apprenticeship | ✅ EXISTS |
| slug = esthetician-apprenticeship | /programs/esthetician-apprenticeship | ✅ EXISTS |
| slug = nail-technician-apprenticeship | /programs/nail-technician-apprenticeship | ✅ EXISTS |
| 80+ other programs | /programs/[slug] | ✅ Dynamic routes exist |

**Published Programs:** 80 | **Unpublished:** 2 (dsp-training, peer-support)

---

## TABLE 2: Static Routes (sitemap.ts)

### EXISTS:
- / | app/page.tsx
- /programs | app/programs/page.tsx
- /apply | app/apply/page.tsx
- /funding | app/funding/page.tsx
- /store | app/store/page.tsx
- /testing | app/testing/page.tsx
- /platform | app/platform/page.tsx
- /login | app/login/page.tsx
- /signup | app/signup/page.tsx
- /for-employers | app/for-employers/page.tsx
- /legal/privacy | app/legal/privacy/page.tsx
- /funding/wioa | app/funding/wioa/page.tsx
- /funding/jri | app/funding/jri/page.tsx

### MISSING (in sitemap but no page.tsx):
- /about ❌
- /about/mission ❌
- /about/team ❌
- /about/partners ❌
- /apprenticeships ❌
- /partners ❌
- /contact ❌
- /how-it-works ❌
- /check-eligibility ❌
- /credentials ❌
- /for-students ❌
- /blog ❌
- /careers ❌
- /faq ❌
- /employer ❌
- /donate ❌
- /press ❌
- /news ❌
- /booking ❌
- /certification-testing ❌
- /jri ❌
- /training ❌
- /verify ❌
- /workkeys ❌
- /transparency ❌
- /dmca ❌
- /eligibility ❌
- /resources ❌
- /site-map ❌
- /services ❌
- /career-assessment ❌
- /career-counseling ❌
- /call-now ❌
- /career-training-indiana ❌
- /apprenticeship-sponsor ❌
- /install-app ❌
- /mobile-app ❌
- /compliance/wioa ❌
- /compliance/wioa/initial-eligibility-aggregate-performance ❌
- /compliance/wioa/section-188-equal-opportunity-checklist ❌
- /apps ❌
- /apps/grants ❌
- /apps/sam-gov ❌
- /apps/website-builder ❌
- /testing/careersafe ❌
- /testing/esco ❌
- /testing/nrf ❌
- /store/guides/capital-readiness ❌
- /store/guides/licensing ❌

---

## CRITICAL: NAVIGATION → MISSING PAGES

File: `lib/navigation/site-nav.config.ts`

| Nav Link | Target Page | Status |
|----------|-------------|--------|
| /about | app/about/page.tsx | ❌ MISSING |
| /about/team | app/about/team/page.tsx | ❌ MISSING |
| /about/partners | app/about/partners/page.tsx | ❌ MISSING |
| /about/mission | app/about/mission/page.tsx | ❌ MISSING |
| /partners | app/partners/page.tsx | ❌ MISSING |
| /how-it-works | app/how-it-works/page.tsx | ❌ MISSING |
| /check-eligibility | app/check-eligibility/page.tsx | ❌ MISSING |
| /credentials | app/credentials/page.tsx | ❌ MISSING |
| /apprenticeships | app/apprenticeships/page.tsx | ❌ MISSING |
| /portals | app/portals/page.tsx | ❌ MISSING |
| /support/chat | app/support/chat/page.tsx | ❌ MISSING |
| /employment-support | app/employment-support/page.tsx | ❌ MISSING |

---

## SEO HUB PAGES MISSING

sitemap.ts declares but pages don't exist:
- /workforce-training-indianapolis
- /wioa-funded-training-indiana
- /healthcare-training-indianapolis
- /skilled-trades-training-indiana
- /it-certification-training-indianapolis
- /employer-workforce-partnerships-indiana
- /agency-referral-workforce-training-indiana

---

## ROOT CAUSE

The sitemap and navigation declare routes that were never created.
The code has program dynamic routes working.
But static marketing pages are missing.

---

## RECOMMENDED ACTIONS

1. **Option A:** Create pages for high-traffic routes
   - /about
   - /contact
   - /how-it-works
   - /partners

2. **Option B:** Remove dead links from site-nav.config.ts

3. **Option C:** Remove routes from sitemap.ts that shouldn't exist
