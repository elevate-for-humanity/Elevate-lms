# P0 – Adzuna Integration Audit

## API Credentials

| Setting | Value | Status |
|---------|-------|--------|
| ADZUNA_APP_ID | `08a9335d` | ✅ In `.env.example` |
| ADZUNA_APP_KEY | `28030c1d03fb93ea04b599fabb5f6e6e` | ✅ In `.env.example` |
| ADZUNA_COUNTRY | `us` | ✅ Configured |

**Need to add to GitHub Secrets and Northflank environment variables.**

---

## Adzuna Implementation Status

### ✅ IMPLEMENTED

| Component | Status | Location |
|-----------|--------|----------|
| Adzuna Client | ✅ | `lib/adzuna/client.ts` |
| Job Search API | ✅ | `/api/jobs/search` |
| Salary API | ✅ | `/api/jobs/salary` |
| CareerIntelligencePanel | ✅ | `components/dashboards/CareerIntelligencePanel.tsx` |
| AdzunaJobsFeed | ✅ | `components/dashboards/AdzunaJobsFeed.tsx` |
| AdzunaJobsSection | ✅ | `components/dashboards/AdzunaJobsSection.tsx` |
| Job Aggregation Layer | 🟡 | Partial - NLx + Adzuna |

---

## Per-Feature Audit

### 1. Student Dashboard

| Required | Status | Implementation |
|----------|--------|----------------|
| Recommended jobs | ✅ | `CareerIntelligencePanel` |
| Jobs matching program | ✅ | Via query params |
| Remote jobs | 🟡 | Filter available |
| Local jobs | ✅ | Location-based |
| Apprenticeships | 🟡 | NLx feed |
| Full-time positions | ✅ | Via contract_type |
| Part-time positions | ✅ | Via contract_type |
| Salary range | ✅ | `salary_min`, `salary_max` |
| Company | ✅ | `company.display_name` |
| Distance | ✅ | `where` param |
| Job type | ✅ | `contract_type` |
| Apply button | ✅ | `redirect_url` |
| Save Job | ❌ | **MISSING** |
| Favorite | ❌ | **MISSING** |
| Share | ❌ | **MISSING** |
| Track Application | ❌ | **MISSING** |

### 2. Course Builder

| Required | Status | Implementation |
|----------|--------|----------------|
| Career Opportunities | 🟡 | `OnetLaborData` |
| Live Jobs | ✅ | `LiveJobPostings` |
| Average Salary | ✅ | Adzuna salary |
| Indiana Salary | 🟡 | National only |
| National Salary | ✅ | Adzuna |
| Hiring Employers | 🟡 | Via NLx |
| Related Occupations | ✅ | O*NET |
| Skills Required | ✅ | O*NET |
| Occupation mapping | ✅ | `lib/onet/soc-map.ts` |

### 3. Program Pages

| Required | Status | Implementation |
|----------|--------|----------------|
| Now Hiring section | ✅ | `LiveJobPostings` |
| Current openings | ✅ | DB + NLx |
| Employers hiring | ✅ | `job_postings` |
| Average salary | ✅ | Adzuna |
| Available jobs count | ✅ | Adzuna count |
| Featured employers | 🟡 | Limited |
| Apply now | ✅ | Links |

### 4. Career Center

| Required | Status | Implementation |
|----------|--------|----------------|
| Search jobs | ✅ | `/api/jobs/search` |
| Filter by location | ✅ | `where` param |
| Filter by salary | ✅ | `salary_min/max` |
| Filter by remote | 🟡 | Partial |
| Filter by employer | 🟡 | Via NLx |
| Save jobs | ❌ | **MISSING** |
| Compare jobs | ❌ | **MISSING** |
| Apply | ✅ | External link |
| Track application | ❌ | **MISSING** |

### 5. PARIS AI

| Required | Status | Implementation |
|----------|--------|----------------|
| Jobs based on programs | 🟡 | Via context |
| Jobs based on certs | 🟡 | Via context |
| Higher-paying paths | 🟡 | Via Adzuna salary |
| Related occupations | ✅ | O*NET |
| Skills gaps | 🟡 | Via O*NET |
| Cert recommendations | 🟡 | Via O*NET |

### 6. Employer Dashboard

| Required | Status | Implementation |
|----------|--------|----------------|
| Post jobs | ✅ | `job_postings` table |
| Manage openings | ✅ | Admin UI |
| Student referrals | 🟡 | Limited |
| Candidate matches | 🟡 | Limited |
| Schedule interviews | ❌ | **MISSING** |
| Track hires | ✅ | WIOA reports |

### 7. Resume Builder

| Required | Status | Implementation |
|----------|--------|----------------|
| Recommend matching jobs | ❌ | **NOT WIRED** |
| Highlight missing skills | ❌ | **NOT WIRED** |
| Suggest certifications | ❌ | **NOT WIRED** |
| Interview resources | 🟡 | Limited |

### 8. Application Tracking

| Required | Status | Implementation |
|----------|--------|----------------|
| Save jobs | ❌ | **MISSING** |
| Apply | ✅ | External link |
| Track status | ❌ | **MISSING** |
| Record interviews | ❌ | **MISSING** |
| Reminders | ❌ | **MISSING** |
| Track offers | ❌ | **MISSING** |

### 9. Alumni Dashboard

| Required | Status | Implementation |
|----------|--------|----------------|
| Job alerts | ❌ | **MISSING** |
| Salary updates | ❌ | **MISSING** |
| Career advancement | 🟡 | Via Adzuna |
| CE recommendations | ❌ | **MISSING** |

### 10. Career Analytics

| Required | Status | Implementation |
|----------|--------|----------------|
| Jobs viewed | ❌ | **MISSING** |
| Jobs saved | ❌ | **MISSING** |
| Applications | ❌ | **MISSING** |
| Interviews | ❌ | **MISSING** |
| Placements | ✅ | WIOA reports |
| Hiring employers | ✅ | `placement_records` |
| Avg salary | ✅ | WIOA reports |
| Placement rate | ✅ | WIOA reports |
| Time to placement | ✅ | WIOA reports |

---

## Summary

### ✅ Implemented (6/10)
- Adzuna Client + API
- Job Search Endpoints
- Student Dashboard Jobs
- Program Pages Jobs
- Career Center Search
- Resume Generation

### 🟡 Partially Implemented (2/10)
- PARIS AI Jobs
- Employer Dashboard

### ❌ Missing (2/10)
- Save/Track Applications
- Career Analytics

---

## Required Features to Build

### P0 - Must Implement
1. **Save Jobs** - `saved_jobs` table + UI
2. **Track Applications** - `job_applications` table + UI
3. **Job Alerts** - Cron job + notifications

### P1 - Should Implement
4. **Job Views Analytics** - Track impressions
5. **Interview Tracking** - Table + UI
6. **Salary by State** - Indiana-specific data
7. **Job Comparison** - Side-by-side view

### P2 - Nice to Have
8. **Resume → Job Matching** - Wire existing components
9. **Skills Gap Analysis** - O*NET integration
10. **Employer Interview Scheduling** - Calendar integration

---

## Job Aggregation Layer

Current sources:
```
✅ Adzuna - Job search + salary
✅ NLx - Government jobs
✅ Internal - job_postings table
🟡 O*NET - Career data
🔧 USAJobs - Not wired
🔧 CareerOneStop - Not wired
🔧 State job banks - Not wired
```

**Recommendation:** Build unified `JobProvider` interface to normalize all sources.

---

## Configuration Required

Add to GitHub Secrets:
```
ADZUNA_APP_ID=08a9335d
ADZUNA_APP_KEY=28030c1d03fb93ea04b599fabb5f6e6e
```

Add to Northflank environment variables for all services.
