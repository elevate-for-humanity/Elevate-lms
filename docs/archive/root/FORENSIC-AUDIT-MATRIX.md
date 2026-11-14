# FORENSIC AUDIT MATRIX
**Date:** 2026-07-13  
**Auditor:** OpenHands Agent  
**Scope:** Team Page, Job Board, Hero Components, Transfer Hours

---

## EXECUTIVE SUMMARY

| Issue | Component | Database | Data Exists | Render Issue | Root Cause | Priority |
|-------|-----------|----------|-------------|--------------|------------|----------|
| Team Page | `/about/team/team/page.tsx` | `team_members` | ✅ YES | Static content | Uses `cf-team.ts` instead of DB | HIGH |
| Job Board | `lib/adzuna/client.ts` | `government_job_feed` | ⚠️ PARTIAL | Empty results | Missing ADZUNA API keys | HIGH |
| Job Board | `app/api/jobs/government-feed/route.ts` | `government_job_feed` | ⚠️ PARTIAL | Empty results | Missing USAJOBS_API_KEY | HIGH |
| Job Board | `app/api/jobs/government-feed/route.ts` | N/A | ❌ NO | N/A | No promotion logic to `job_postings` | HIGH |
| Hero Components | 54 files | N/A | N/A | Dead code | Fragmentation | MEDIUM |
| Transfer Hours | `lib/hours/get-approved-hours.ts` | `hour_transfer_requests` | ✅ YES | Incomplete progress | Not querying transfer requests | MEDIUM |

---

## ISSUE #1: TEAM PAGE - STATIC vs DATABASE DISCONNECT

### Forensic Trace

```
UI Component: /about/team/team/page.tsx
    ↓
Import: import { teamMembers } from '@/content/cf-team';
    ↓
Data Source: content/cf-team.ts (STATIC)
    ↓
ISSUE: Never queries database!
```

### Evidence

| File | Line | Code |
|------|------|------|
| `content/cf-team.ts` | 9 | `export const teamMembers: TeamMember[] = [...]` |
| `app/about/team/team/page.tsx` | 5 | `import { teamMembers } from '@/content/cf-team';` |
| `lib/content.ts` | ~120 | `export async function getTeamMembers()...` (EXISTS BUT UNUSED) |
| `supabase/migrations/2026041600000300_seed_hardcoded_data.sql` | ~50 | Seeded team_members table with same data |

### Schema Mismatch

| cf-team.ts | Database (TeamMember) |
|------------|----------------------|
| `slug` | `id` |
| `headshotSrc` | `image_url` |
| `title` | `title` ✅ |
| `name` | `name` ✅ |
| `bio` | `bio` ✅ |

### Required Fix

1. **Update `/about/team/team/page.tsx`** to:
   - Import `getTeamMembers` from `@/lib/content`
   - Use `await getTeamMembers()` instead of static import
   - Map `image_url` to the image component
   - Add `generateStaticParams` for static generation if desired

2. **Map Schema** in the component:
   ```tsx
   {member.image_url && (
     <Image src={member.image_url} ... />
   )}
   ```

---

## ISSUE #2: JOB BOARD - MULTIPLE DATA FLOW BREAKS

### Forensic Trace

```
Adzuna API (lib/adzuna/client.ts)
    ↓
Requires: ADZUNA_APP_ID, ADZUNA_APP_KEY
    ↓
Status: ❌ NOT SET (missing from GitHub secrets)
    ↓
Returns: { jobs: [], totalCount: 0 }
    ↓
UI: "No employer postings right now"
```

```
Government Feed (app/api/jobs/government-feed/route.ts)
    ↓
Sources: USAJobs, CareerOneStop
    ↓
Requires: USAJOBS_API_KEY, USAJOBS_USER_AGENT_EMAIL, CAREERONESTOP_TOKEN
    ↓
Status: ⚠️ PARTIAL (USAJOBS_API_KEY missing)
    ↓
Upserts to: government_job_feed table
    ↓
ISSUE: No promotion logic to job_postings table
```

### Missing Secrets

| Secret | Status | Impact |
|--------|--------|--------|
| `ADZUNA_APP_ID` | ❌ NOT SET | Job search returns empty |
| `ADZUNA_APP_KEY` | ❌ NOT SET | Job search returns empty |
| `USAJOBS_API_KEY` | ⚠️ CHECK | Government feed may fail |
| `USAJOBS_USER_AGENT_EMAIL` | ⚠️ CHECK | Government feed requires this |
| `CAREERONESTOP_TOKEN` | ⚠️ CHECK | CareerOneStop feed requires this |

### Required Fixes

1. **Add Adzuna API Keys** to GitHub Secrets:
   - `ADZUNA_APP_ID`
   - `ADZUNA_APP_KEY`

2. **Add Government Feed Keys** (if available):
   - `USAJOBS_API_KEY`
   - `USAJOBS_USER_AGENT_EMAIL`
   - `CAREERONESTOP_TOKEN`

3. **Create Promotion Logic** in `app/api/jobs/government-feed/route.ts`:
   - After upserting to `government_job_feed`
   - Add logic to promote approved jobs to `job_postings` table
   - OR create a separate cron job for promotion

4. **Verify Database Tables**:
   - `job_postings` exists and has schema
   - `government_job_feed` exists and receives data

---

## ISSUE #3: HERO COMPONENT FRAGMENTATION

### Inventory

| Directory | Count | Used in app/ |
|-----------|-------|--------------|
| `components/` (root) | 14 | 0 |
| `components/hero/` | 3 | 1 |
| `components/heroes/` | 2 | 0 |
| `components/home/` | 6 | 0 |
| `components/landing/` | 1 | 3 |
| `components/layout/` | 2 | 0 |
| `components/lms/` | 2 | 2 |
| `components/marketing/` | 6 | 14 |
| `components/media/` | 1 | 0 |
| `components/programs/` | 4 | 0 |
| `components/sections/` | 1 | 0 |
| `components/shared/` | 1 | 0 |
| `components/templates/` | 1 | 0 |
| `components/ui/` | 5 | 2 |
| **TOTAL** | **54** | **22** |

### Actually Used Components

| Component | Usage Count | Location |
|-----------|-------------|----------|
| `marketing/HeroVideo` | 12 | Various pages |
| `landing/ModernLandingHero` | 3 | Landing pages |
| `marketing/HeroPicture` | 2 | Marketing pages |
| `lms/LmsHeroBanner` | 2 | LMS pages |
| `ui/PageVideoHero` | 1 | Unknown |
| `ui/HomeHeroVideo` | 1 | Unknown |
| `hero/HeroMediaFrame` | 1 | Unknown |
| `hero/CanonicalHero` | 1 | Unknown |

### Dead Code: 46 components

These 46 components exist but are never imported in `app/`:
- `HeroBanner.tsx`, `HeroSlideshow.tsx`, `HeroVideoWithVoiceover.tsx`
- `HomeHeroWithVoiceover.tsx`, `ImageHero.tsx`, `ProgramHero.tsx`
- `RotatingHeroBanner.tsx`, `ServiceHero.tsx`, `SideHeroBanner.tsx`
- And 38 more...

### Required Fix

1. **Do NOT delete immediately** - audit for references first
2. **Create Hero Registry** documenting:
   - Which heroes are used
   - Which should be canonical
   - Which are truly dead code
3. **Consolidate** to 3-5 canonical hero types:
   - `VideoHero` (with voiceover/transcript)
   - `ImageHero` (with optional text overlay)
   - `DataHero` (for calculators/forms)
4. **Delete dead code** after verification

---

## ISSUE #4: TRANSFER HOURS - ORPHANED CALCULATION

### Forensic Trace

```
BarberApprenticeshipDashboard
    ↓
hours: { ojl: number; rti: number }
    ↓
Source: getApprovedHoursByType()
    ↓
ISSUE: Only queries hour_entries table
    ↓
Missing: hour_transfer_requests table
```

### Evidence

| File | Line | Code |
|------|------|------|
| `lib/hours/get-approved-hours.ts` | 39-47 | Only queries `hour_entries` |
| `app/apprentice/transfer-hours/page.tsx` | 36-40 | Queries `hour_transfer_requests` ✅ |
| `components/barber/BarberApprenticeshipDashboard.tsx` | 54-55 | Uses hours.ojl, hours.rti |

### Database Evidence

```sql
-- hour_transfer_requests table exists with approved hours
SELECT * FROM hour_transfer_requests 
WHERE apprentice_id = 'xxx' 
AND status = 'approved';
```

### Required Fix

1. **Update `lib/hours/get-approved-hours.ts`**:
   - Add query for `hour_transfer_requests` table
   - Include approved transfer hours in OJL/RTI totals
   - OR create separate `transferred_hours` field

2. **Schema Mapping**:
   | hour_transfer_requests | hour_entries |
   |------------------------|--------------|
   | `hours_approved` | `hours_claimed` |
   | `status = 'approved'` | `status IN ('approved','locked')` |

3. **Update Dashboard Stats**:
   - Show "Transfer hours" separately OR include in progress

---

## DEPLOYMENT STATUS

| Service | URL | Status |
|---------|-----|--------|
| LMS | https://work-1-xovgoeqbupilkext.prod-runtime.all-hands.dev/ | 502 (Investigating) |
| Admin | https://work-2-xovgoeqbupilkext.prod-runtime.all-hands.dev/ | 502 (Investigating) |

**GitHub Workflow:** Completed successfully but sites return 502 Bad Gateway.

### Action Required
- Verify Northflank service status
- Check container health probes
- Verify environment variables in Northflank

---

## RECOMMENDED ACTIONS (Priority Order)

### P0 (Critical - Blocking)

1. **Wire Team Page to Database**
   - File: `app/about/team/team/page.tsx`
   - Change: Replace static import with `await getTeamMembers()`
   - Map: `image_url` field to image component

2. **Fix Job Board Data Flow**
   - Add `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` to GitHub secrets
   - OR implement promotion from `government_job_feed` to `job_postings`
   - Verify `job_postings` table has data

### P1 (High - Affecting UX)

3. **Fix Transfer Hours Integration**
   - Update `lib/hours/get-approved-hours.ts`
   - Include `hour_transfer_requests` in hours calculation

4. **Hero Component Audit**
   - Document all 54 components
   - Identify canonical types
   - Remove dead code (after verification)

### P2 (Medium - Technical Debt)

5. **Deployment Investigation**
   - Verify Northflank container status
   - Check health probe configuration
   - Review environment variable injection

---

## VERIFICATION CHECKLIST

After fixes, verify:

- [ ] Team page renders from database
- [ ] Team page displays actual headshots from `team_members.image_url`
- [ ] Job board returns results from Adzuna or government feed
- [ ] Transfer hours appear in barber dashboard progress
- [ ] Hero components consolidated to canonical types
