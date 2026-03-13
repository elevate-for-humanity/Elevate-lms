# LOC Readiness Audit — La Plaza Partnership
## Gap Matrix + 48-Hour Sprint Checklist

---

## A. Route & Button Audit

| Program | Route | Status | Issues |
|---|---|---|---|
| HVAC | `/programs/hvac` | ✅ Loads | False stats fixed (was 95% placement, 500+ grads, 400+ hrs) |
| HVAC (SEO) | `/programs/hvac-technician` | ✅ Loads | Hours fixed (was "400+ training hours") |
| Electrical | `/programs/electrical` | ✅ Loads | Stats fixed (was 90% placement, 16 weeks) |
| Plumbing | `/programs/plumbing` | ✅ Loads | Stats fixed (was 91% placement, 16 weeks) |
| **Forklift** | `/programs/forklift` | ❌ **404** | **No page exists. Referenced in micro-programs but route missing.** |
| Skilled Trades hub | `/programs/skilled-trades` | ✅ Loads | Links to HVAC, Electrical, Plumbing. No Forklift link. |
| Programs index | `/programs` | ✅ Loads | Lists "Skilled Trades" category. No direct Forklift. |

### Broken Links Found
- `app/microclasses/page.tsx` line 56: links to `/programs/forklift` — **404**
- `app/programs/micro-programs/page.tsx` line 113: references Forklift Certification — no link to dedicated page
- `app/programs/skilled-trades/page.tsx`: no Forklift tile

---

## B. Gap Matrix — Dulce's Required Fields

### Legend
- ✅ Present and adequate
- ⚠️ Exists but vague/insufficient
- ❌ Missing entirely
- 📁 Exists in repo but not rendered on page

| Required Field | HVAC | Electrical | Plumbing | Forklift |
|---|---|---|---|---|
| **Dedicated program page** | ✅ 2 pages | ✅ | ✅ | ❌ No page |
| **Curriculum outline** | ✅ Week-by-week | ✅ Week-by-week | ✅ Week-by-week | ❌ |
| **Competency framework** | ⚠️ Implied in curriculum | ⚠️ Implied | ⚠️ Implied | ❌ |
| **Total weeks** | ✅ 12 weeks (fixed) | ✅ 12 weeks (fixed) | ✅ 12 weeks (fixed) | ❌ |
| **Total hours** | ✅ 144 hrs (fixed) | ✅ 144 hrs (fixed) | ✅ 144 hrs (fixed) | ❌ |
| **Credential awarded** | ✅ EPA 608 | ✅ OSHA 10 | ⚠️ "Completion cert" only | ❌ |
| **Certifying body** | ✅ EPA | ✅ OSHA/CareerSafe | ⚠️ Not stated | ❌ |
| **Next Level Jobs eligible** | ⚠️ Not on page | ⚠️ Not on page | ⚠️ Not on page | ❌ |
| **Mon/Wed 5:30-8:30 schedule** | ⚠️ Says "flexible" | ⚠️ Not specific | ⚠️ Not specific | ❌ |
| **Min/max cohort size** | ❌ | ❌ | ❌ | ❌ |
| **Admission requirements** | ⚠️ FAQ says "no experience" | ⚠️ FAQ says "no experience" | ⚠️ FAQ says "no experience" | ❌ |
| **Modality** | ⚠️ Says "hybrid" vaguely | ⚠️ Vague | ⚠️ Vague | ❌ |
| **Employer site days** | ❌ Not on page yet | ❌ Not on page yet | ❌ Not on page yet | ❌ |
| **Equipment/PPE included** | ⚠️ FAQ (fixed) | ⚠️ FAQ mentions tools | ⚠️ FAQ mentions tools | ❌ |
| **Bilingual support** | ❌ | ❌ | ❌ | ❌ |
| **Tutoring/academic support** | ❌ | ❌ | ❌ | ❌ |
| **Attendance tracking** | ❌ | ❌ | ❌ | ❌ |
| **LOC alert process** | ❌ | ❌ | ❌ | ❌ |
| **Progress report format** | ❌ | ❌ | ❌ | ❌ |
| **Apprenticeship pathway** | ⚠️ FAQ mentions | ⚠️ FAQ mentions | ⚠️ FAQ mentions | ❌ |
| **Employer partners** | ⚠️ Generic list | ⚠️ Generic | ⚠️ Generic | ❌ |
| **Job placement support** | ⚠️ FAQ (fixed) | ⚠️ FAQ | ⚠️ FAQ | ❌ |
| **Retention tracking** | ❌ | ❌ | ❌ | ❌ |
| **Verified work hours** | ❌ | ❌ | ❌ | ❌ |
| **Pricing model** | ❌ | ❌ | ❌ | ❌ |
| **Cost ranges** | ⚠️ Says "free with WIOA" | ⚠️ Says "free with WIOA" | ⚠️ Says "free with WIOA" | ❌ |
| **Exam fees included** | ⚠️ Implied | ⚠️ Implied | ❌ | ❌ |
| **Payment terms** | ❌ | ❌ | ❌ | ❌ |
| **Brochure/syllabus** | ❌ | ❌ | ❌ | ❌ |
| **Reporting dashboard** | 📁 Exists in code, not linked from program page | 📁 Same | 📁 Same | ❌ |

---

## C. Hidden Repo Features (exist but not surfaced)

| Feature | File Path | Status |
|---|---|---|
| Cohort management API | `app/api/admin/cohorts/route.ts` | ✅ Working API, not linked from program pages |
| Workforce board dashboard | `app/workforce-board/dashboard/page.tsx` | ✅ Renders, admin-only |
| Program schema validation | `lib/program-schema.ts` | ✅ 238 lines, validates programs for publish |
| Programs data (canonical) | `lib/programs-data.ts` | ✅ Updated with correct hours/descriptions |
| Programs data (complete) | `lib/programs-data-complete.ts` | ⚠️ 752 lines, may have stale data |
| BNPL (Affirm/Sezzle) | `lib/affirm/client.ts`, `lib/sezzle/client.ts` | 📁 Code exists, no API keys configured |
| Stripe checkout with BNPL | `app/api/enroll/checkout/route.ts` | ✅ Supports Affirm, Klarna, Afterpay |
| Hub cohort tracking | `lib/hub/cohorts.ts` | ✅ Queries programs with total_hours |
| CareerSafe integration | Referenced in multiple pages | ⚠️ Link-based, no API integration |
| Progress tracking | `lesson_progress` table + LMS player | ✅ Working in production |
| Certificates | `certificates` table + generation | ✅ 2 issued in production |

---

## D. 48-Hour Sprint Checklist

### P0 — Must fix before LOC meeting (blocks credibility)

| # | Task | File(s) | Est |
|---|---|---|---|
| 1 | **Create `/programs/forklift` page** | New: `app/programs/forklift/page.tsx` | 30 min |
| 2 | **Add Forklift to skilled-trades hub** | `app/programs/skilled-trades/page.tsx` line 74 | 5 min |
| 3 | **Add "Employer Site Days" section to HVAC page** | `app/programs/hvac/page.tsx` | 15 min |
| 4 | **Add "Employer Site Days" section to Electrical page** | `app/programs/electrical/page.tsx` | 15 min |
| 5 | **Add "Employer Site Days" section to Plumbing page** | `app/programs/plumbing/page.tsx` | 15 min |
| 6 | **Add bilingual support mention to all 4 program pages** | All 4 program pages | 10 min |
| 7 | **Add "Next Level Jobs: X-star" badge to all 4 pages** | All 4 program pages | 10 min |
| 8 | **Fix schedule on all pages to say "Mon/Wed 5:30-8:30 PM"** | All 4 program pages | 10 min |

### P1 — Should fix before sending proposal (strengthens position)

| # | Task | File(s) | Est |
|---|---|---|---|
| 9 | Add cohort size (8-20) to program pages | All 4 pages | 10 min |
| 10 | Add "Certification Testing Model" section (EPA via Mainstream/ESCO) | HVAC page | 15 min |
| 11 | Add apprenticeship readiness section (application guidance + referral support) to page body, not just FAQ | HVAC, Electrical, Plumbing | 20 min |
| 12 | Add pricing section or "Contact for cohort pricing" to program pages | All 4 pages | 15 min |
| 13 | Link workforce board dashboard from program admin | `app/programs/admin/page.tsx` | 5 min |
| 14 | Verify LMS demo works end-to-end (enroll → lesson → progress → completion) | Manual test | 30 min |

### P2 — Nice to have (polish)

| # | Task | File(s) | Est |
|---|---|---|---|
| 15 | Create downloadable PDF syllabus for each program | New: `public/docs/syllabi/` | 1 hr |
| 16 | Add sample progress report screenshot/mockup | New component or image | 30 min |
| 17 | Add "Reporting for Partners" section explaining bi-weekly reports | Program pages or new page | 20 min |
| 18 | Surface cohort management in admin dashboard | `app/admin/dashboard/page.tsx` | 30 min |

---

## E. Data Objects to Create

| Object | Where | Status |
|---|---|---|
| Forklift course in DB | `training_courses` | ✅ Already exists (40 hrs, 10 lessons) |
| Electrical course in DB | `training_courses` | ✅ Already exists (144 hrs, 10 real lessons) |
| Plumbing course in DB | `training_courses` | ✅ Already exists (144 hrs, 10 real lessons) |
| HVAC course in DB | `training_courses` | ✅ Already exists (144 hrs, 10 real lessons) |
| Forklift in programs-data.ts | `lib/programs-data.ts` | ✅ Just added |
| Plumbing in programs-data.ts | `lib/programs-data.ts` | ✅ Just added |
| Forklift program page | `app/programs/forklift/page.tsx` | ❌ **Must create** |
