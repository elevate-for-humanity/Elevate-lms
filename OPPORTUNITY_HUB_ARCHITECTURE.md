# OPPORTUNITY HUB ARCHITECTURE
**Generated:** June 17, 2026  
**Status:** 🔍 AUDIT + ARCHITECTURE DESIGN (NO CODE)

---

## EXECUTIVE SUMMARY

| Question | Answer |
|----------|--------|
| Does grants opportunity model exist? | ✅ YES - `grant_opportunities` table + Grants.gov API |
| Can volunteer opportunities reuse existing model? | ✅ YES - Add `volunteer_opportunities` or extend |
| Can existing matching engine support volunteer? | ✅ YES - Extend `job-matching.ts` |
| Do you need new tables? | 🟡 PARTIAL - Only for volunteer-specific fields |
| Estimated effort for unified Opportunity Hub? | **2-3 weeks** (not 4-6) |

---

## CURRENT OPPORTUNITY INFRASTRUCTURE

### Existing Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `job_postings` | Employer job listings | ✅ Active |
| `grant_opportunities` | Federal/state grants | ✅ Active |
| `grant_applications` | Grant applications | ✅ Active |
| `apprenticeships` | Apprenticeship programs | ✅ Active |
| `apprentice_placements` | Apprentice hires | ✅ Active |
| `apprenticeship_hours` | Hour tracking | ✅ Active |
| `referrals` | Program referrals | ✅ Active |
| `job_placements` | Graduate placements | ✅ Active |
| `mentors` | Graduate mentors | ✅ Active |
| `mentorships` | Mentor relationships | ✅ Active |
| `employers` | Employer records | ✅ Active |
| `partners` | Partner organizations | ✅ Active |

### Existing Matching Engines

| Engine | Location | Supports |
|--------|----------|----------|
| Job Matching | `lib/hub/job-matching.ts` | Jobs |
| Mentor Matching | `lib/hub/mentor-matching.ts` | Mentors |
| Grant Eligibility | `lib/grants/eligibility.ts` | Grants |

### Existing Portals

| Portal | URL | Current Use |
|--------|-----|-------------|
| Employer Portal | `/employer` | Jobs, Candidates, Hires |
| Student Portal | `/student-portal` | Courses, Progress |
| Career Services | `/career-services` | Job placement, Resume |
| Partner Portal | `/partners` | Partner management |
| Admin Grants | `/admin/grants` | Grant opportunities, Applications |
| Workforce Board | `/workforce-board` | WIOA participants |

---

## UNIFIED OPPORTUNITY FRAMEWORK

### Proposed Opportunity Types

```typescript
enum OpportunityType {
  JOB = 'JOB',
  APPRENTICESHIP = 'APPRENTICESHIP', 
  GRANT = 'GRANT',
  SCHOLARSHIP = 'SCHOLARSHIP',
  VOLUNTEER = 'VOLUNTEER',
  INTERNSHIP = 'INTERNSHIP',
  MENTORSHIP = 'MENTORSHIP',
  PARTNERSHIP = 'PARTNERSHIP',
}
```

### Option A: Extend Existing Tables (Recommended)

Instead of creating new tables, extend existing ones:

```typescript
// Extend job_postings
interface Opportunity {
  id: string;
  type: OpportunityType;  // NEW FIELD
  
  // Common fields
  title: string;
  description: string;
  organization_name: string;
  organization_id?: string;
  location: string;
  remote_allowed?: boolean;
  
  // Type-specific fields (nullable for common)
  salary_range?: string;
  funding_amount?: number;
  commitment_hours?: number;
  commitment_type?: string;
  skills_needed?: string[];
  requirements?: string[];
  
  // Matching fields
  match_criteria?: {
    programs?: string[];
    certifications?: string[];
    skills?: string[];
    location?: string[];
  };
  
  // Status
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  expires_at?: string;
}
```

### Option B: Unified Opportunities Table (Alternative)

```typescript
// New: unified_opportunities
interface UnifiedOpportunity {
  id: string;
  type: OpportunityType;
  
  // Core fields
  title: string;
  description: string;
  summary: string;
  
  // Organization
  organization_name: string;
  organization_type: 'employer' | 'nonprofit' | 'government' | 'education';
  organization_id?: string;
  
  // Location
  location_type: 'onsite' | 'remote' | 'hybrid';
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  
  // Compensation/Commitment
  compensation_type: 'paid' | 'stipend' | 'scholarship' | 'volunteer' | 'unpaid';
  pay_range?: string;
  hours_commitment?: string;
  duration?: string;
  
  // Requirements
  required_programs?: string[];
  required_certifications?: string[];
  required_skills?: string[];
  minimum_age?: number;
  
  // External integration
  external_source?: 'idealist' | 'grants_gov' | 'sam_gov' | 'internal';
  external_id?: string;
  last_synced_at?: string;
  
  // Status
  status: 'active' | 'inactive' | 'closed';
  posted_at: string;
  closes_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}
```

---

## DATABASE DESIGN

### Option A: Minimal Changes (Recommended)

| Change | Scope |
|--------|-------|
| Add `type` to `job_postings` | ALTER TABLE - 1 column |
| Create `volunteer_opportunities` | NEW TABLE - light weight |
| Create `volunteer_applications` | NEW TABLE - track applications |
| Create `opportunity_matches` | NEW TABLE - unified matching |

### Option B: Full Unification

| Change | Scope |
|--------|-------|
| Create `unified_opportunities` | NEW TABLE - single source |
| Create `unified_applications` | NEW TABLE - single tracking |
| Create `opportunity_activities` | NEW TABLE - audit log |
| Migrate existing data | DATA MIGRATION |

### Recommended Schema

```sql
-- Volunteer opportunities (lightweight extension)
CREATE TABLE volunteer_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  nonprofit_id UUID REFERENCES partners(id),
  nonprofit_name TEXT,
  location TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  commitment_type TEXT, -- 'one-time', 'recurring', 'ongoing'
  hours_estimate DECIMAL,
  skills_needed TEXT[],
  interests_needed TEXT[],
  start_date DATE,
  end_date DATE,
  max_volunteers INTEGER,
  application_deadline DATE,
  status TEXT DEFAULT 'active',
  idealist_id TEXT, -- External Idealist reference
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Volunteer applications
CREATE TABLE volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES volunteer_opportunities(id),
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed', 'cancelled'
  hours_logged DECIMAL,
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunity_id, user_id)
);

-- Opportunity matches (unified matching table)
CREATE TABLE opportunity_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  opportunity_type TEXT NOT NULL, -- 'JOB', 'GRANT', 'VOLUNTEER', etc.
  opportunity_id TEXT NOT NULL, -- ID from source table
  match_score DECIMAL,
  match_reasons TEXT[],
  status TEXT DEFAULT 'new', -- 'new', 'viewed', 'applied', 'interested', 'not_interested'
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, opportunity_type, opportunity_id)
);

-- Index for matching queries
CREATE INDEX idx_opportunity_matches_user ON opportunity_matches(user_id);
CREATE INDEX idx_opportunity_matches_type ON opportunity_matches(opportunity_type);
CREATE INDEX idx_opportunity_matches_status ON opportunity_matches(status);
```

---

## API DESIGN

### Unified Opportunity API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/opportunities` | GET | List all opportunities |
| `/api/opportunities` | POST | Create opportunity |
| `/api/opportunities/[id]` | GET | Get opportunity |
| `/api/opportunities/[id]` | PATCH | Update opportunity |
| `/api/opportunities/[id]` | DELETE | Delete opportunity |
| `/api/opportunities/search` | POST | Search with filters |
| `/api/opportunities/match` | POST | Get personalized matches |
| `/api/opportunities/[id]/apply` | POST | Apply to opportunity |
| `/api/opportunities/[id]/save` | POST | Save to favorites |
| `/api/opportunities/[id]/share` | POST | Share opportunity |

### Request/Response Shapes

```typescript
// Search request
interface OpportunitySearchRequest {
  types?: OpportunityType[];
  query?: string;
  location?: {
    city?: string;
    state?: string;
    remote?: boolean;
  };
  filters?: {
    skills?: string[];
    certifications?: string[];
    programs?: string[];
    compensation_min?: number;
    commitment_hours_max?: number;
  };
  page?: number;
  limit?: number;
}

// Search response
interface OpportunitySearchResponse {
  opportunities: Opportunity[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    types: { value: string; count: number }[];
    locations: { value: string; count: number }[];
    skills: { value: string; count: number }[];
  };
}

// Match request
interface OpportunityMatchRequest {
  user_id: string;
  types?: OpportunityType[];
  limit?: number;
}

// Match response
interface OpportunityMatchResponse {
  matches: OpportunityMatch[];
  summary: {
    jobs: number;
    grants: number;
    apprenticeships: number;
    volunteer: number;
    scholarships: number;
  };
}

interface OpportunityMatch {
  opportunity: Opportunity;
  match_score: number;
  match_reasons: string[];
  is_new: boolean;
}
```

---

## AI RECOMMENDATION DESIGN

### AI Opportunity Agent

**Student Input:**
> "I want to become a healthcare worker."

**AI Response:**
```json
{
  "career_goal": "Healthcare Worker",
  "matches": {
    "grants": [
      {
        "title": "Healthcare Workforce Development Grant",
        "amount": "$50,000",
        "match_reasons": ["Healthcare program eligible", "Indiana residents"]
      }
    ],
    "certifications": [
      {
        "title": "CPR/First Aid Certification",
        "program": "Emergency Response Certificate",
        "duration": "2 weeks"
      }
    ],
    "volunteer": [
      {
        "title": "Hospital Volunteer Program",
        "organization": "IU Health",
        "hours_commitment": "4 hrs/week",
        "match_reasons": ["Healthcare exposure", "Patient care experience"]
      }
    ],
    "apprenticeships": [
      {
        "title": "Medical Assistant Apprenticeship",
        "employer": "Community Health Network",
        "pay": "$18-22/hr"
      }
    ],
    "employers": [
      {
        "name": "Ascension St. Vincent",
        "hiring": "Nursing Assistants, CNAs",
        "match_reasons": ["Active hiring", "Nearby location"]
      }
    ],
    "mentors": [
      {
        "name": "Sarah M.",
        "title": "Registered Nurse",
        "program": "LPN to RN Bridge"
      }
    ]
  },
  "next_steps": [
    "Apply for healthcare grant by July 15",
    "Enroll in CPR certification",
    "Schedule hospital volunteer orientation"
  ]
}
```

### Reusable AI Components

Based on existing infrastructure:

```typescript
// Extend existing job-matching.ts
interface OpportunityMatchEngine {
  // Current: Jobs only
  getJobMatches(userId: string): Promise<JobMatch[]>;
  
  // New: Unified
  getMatches(userId: string, types: OpportunityType[]): Promise<OpportunityMatch[]>;
  
  // New: AI-powered
  getAIRecommendations(userId: string, goal: string): Promise<AIOpportunityResponse>;
}
```

### Implementation Pattern

```typescript
// lib/hub/opportunity-matching.ts
// Based on lib/hub/job-matching.ts

interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  organization: string;
  location: string;
  requirements: {
    programs?: string[];
    certifications?: string[];
    skills?: string[];
  };
  compensation?: {
    type: string;
    amount?: string;
  };
}

async function getOpportunityMatches(
  userId: string,
  opts: {
    types?: OpportunityType[];
    limit?: number;
  } = {}
): Promise<OpportunityMatch[]> {
  // 1. Get student profile
  const profile = await getStudentProfile(userId);
  
  // 2. Get all relevant opportunities based on types
  const opportunities = await getOpportunitiesByTypes(opts.types || allTypes);
  
  // 3. Score each opportunity
  const scored = opportunities.map(opp => ({
    opportunity: opp,
    match_score: calculateMatchScore(profile, opp),
    match_reasons: getMatchReasons(profile, opp),
  }));
  
  // 4. Sort and return top matches
  return scored
    .filter(m => m.match_score > 30) // Minimum threshold
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, opts.limit || 20);
}
```

---

## STUDENT PORTAL DESIGN

### Unified Opportunity Dashboard

```
/student-portal/opportunities
├── Dashboard (default)
│   ├── Matched Opportunities (AI recommendations)
│   ├── Saved Opportunities
│   └── Recent Activity
├── Browse
│   ├── Jobs
│   ├── Apprenticeships
│   ├── Grants
│   ├── Scholarships
│   ├── Volunteer
│   ├── Internships
│   └── Mentors
├── Applications
│   ├── All Applications
│   ├── Pending
│   ├── In Progress
│   └── Completed
└── Recommendations
    └── AI-Powered Suggestions
```

### Student Opportunity Card

```tsx
interface OpportunityCardProps {
  opportunity: Opportunity;
  onApply: () => void;
  onSave: () => void;
  matchScore?: number;
}

const OpportunityCard = ({ opportunity, matchScore, onApply, onSave }: OpportunityCardProps) => (
  <div className="opportunity-card">
    <div className="badge">{opportunity.type}</div>
    {matchScore && <div className="match-badge">{matchScore}% match</div>}
    <h3>{opportunity.title}</h3>
    <p>{opportunity.organization}</p>
    <p>{opportunity.location}</p>
    {opportunity.compensation && <p>{opportunity.compensation}</p>}
    <div className="match-reasons">
      {opportunity.match_reasons?.map(reason => (
        <span key={reason}>{reason}</span>
      ))}
    </div>
    <button onClick={onApply}>Apply Now</button>
    <button onClick={onSave}>Save</button>
  </div>
);
```

---

## EMPLOYER PORTAL DESIGN

### Employer Opportunity Management

```
/employer/opportunities
├── My Opportunities
│   ├── Active
│   ├── Drafts
│   ├── Closed
│   └── Archived
├── Applications
│   ├── All Applicants
│   ├── New
│   └── Reviewed
├── Matches
│   └── Recommended Candidates
├── Volunteer Posts (NEW)
│   ├── Create Volunteer Opportunity
│   └── Manage Volunteers
└── Analytics
    └── Opportunity Performance
```

---

## WORKFORCE BOARD DESIGN

### Workforce Board Extensions

```
/workforce-board/opportunities
├── Dashboard
│   ├── WIOA Services
│   ├── Job Opportunities
│   ├── Training Programs
│   ├── Volunteer Opportunities (NEW)
│   └── Community Resources
├── Job Search
│   ├── Local Jobs
│   ├── Remote Jobs
│   └── Apprenticeships
├── Training & Education
│   ├── Grants
│   ├── Scholarships
│   └── Certifications
└── Community
    ├── Volunteer Opportunities
    ├── Nonprofit Partners
    └── Board Service
```

---

## GRANT OPPORTUNITY DESIGN

### Existing Grant Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| Grant Opportunities Table | ✅ Active | `grant_opportunities` |
| Grant Applications Table | ✅ Active | `grant_applications` |
| Grants.gov Integration | ✅ Active | `lib/integrations/grants-gov.ts` |
| Admin Grant Dashboard | ✅ Active | `/admin/grants` |
| Grant Eligibility Engine | ✅ Active | `lib/grants/eligibility.ts` |

### Grant Opportunity Card (reuse pattern)

```tsx
const GrantCard = ({ grant }: { grant: GrantOpportunity }) => (
  <div className="grant-card">
    <div className="grant-badge">GRANT</div>
    <h3>{grant.title}</h3>
    <p>{grant.agency_name}</p>
    <p>Funding: {grant.award_ceiling ? `$${grant.award_ceiling.toLocaleString()}` : 'TBD'}</p>
    <p>Deadline: {formatDate(grant.close_date)}</p>
    <p>CFDA: {grant.cfda_number}</p>
    <button>View Details</button>
    <button>Check Eligibility</button>
    <button>Save</button>
  </div>
);
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1)

| Task | Effort | Reuses |
|------|--------|--------|
| Create `volunteer_opportunities` table | 2 hours | Grant pattern |
| Create `volunteer_applications` table | 2 hours | Application pattern |
| Create `opportunity_matches` table | 2 hours | New |
| Create basic CRUD API | 1 day | Job posting API |
| Create search API | 1 day | Grant search API |
| Create opportunity card component | 4 hours | Grant card pattern |

### Phase 2: Matching (Week 2)

| Task | Effort | Reuses |
|------|--------|--------|
| Extend job-matching.ts | 2 days | Job matching pattern |
| Create unified match API | 1 day | Job match API |
| Create opportunity match UI | 2 days | Job match UI |
| Add AI recommendation endpoint | 2 days | AI pattern |
| Create AI opportunity agent | 3 days | AI tutor pattern |

### Phase 3: Integration (Week 3)

| Task | Effort | Reuses |
|------|--------|--------|
| Create Idealist connector | 2 days | New |
| Sync volunteer opportunities | 1 day | Grant sync pattern |
| Add admin opportunity dashboard | 2 days | Admin pattern |
| Add student portal section | 2 days | Student portal pattern |
| Add employer volunteer posting | 1 day | Job posting pattern |

### Phase 4: Polish (Week 3-4)

| Task | Effort |
|------|--------|
| Testing | 2 days |
| Bug fixes | 2 days |
| Documentation | 1 day |
| Training materials | 1 day |

### **Total Estimate: 2-3 weeks for MVP**

---

## REUSABLE COMPONENTS SUMMARY

### From Existing Codebase

| Component | File | Reuse For |
|-----------|------|-----------|
| Job Matching Engine | `lib/hub/job-matching.ts` | Volunteer, Grant matching |
| Mentor Matching | `lib/hub/mentor-matching.ts` | Mentor recommendations |
| Grant Eligibility | `lib/grants/eligibility.ts` | Opportunity eligibility |
| Grant Opportunities | `lib/integrations/grants-gov.ts` | Idealist API connector |
| Job Card UI | `components/.../JobCard.tsx` | Opportunity card |
| Grant Card UI | `components/.../GrantCard.tsx` | Opportunity card |
| Notification System | Existing | Opportunity alerts |
| Admin Pattern | `/admin/grants/*` | Admin dashboard |
| Student Portal | `/student-portal/*` | Opportunity portal |
| Employer Portal | `/employer/*` | Opportunity management |

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      OPPORTUNITY HUB                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Jobs     │  │  Grants     │  │ Apprentices │             │
│  │ job_postings│  │grant_opport │  │apprentices  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                   │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │  Opportunity Matches   │                         │
│              │  opportunity_matches   │                         │
│              └───────────┬───────────┘                         │
│                          ▼                                      │
│              ┌───────────────────────┐                         │
│              │   Matching Engine     │                         │
│              │ lib/hub/opportunity-  │                         │
│              │     matching.ts      │                         │
│              └───────────┬───────────┘                         │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AI OPPORTUNITY AGENT                       │   │
│  │  "I want to become a healthcare worker"                  │   │
│  │  → Jobs + Grants + Apprentices + Volunteer + Mentors     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Data Sources:
┌──────────────────────────────────────────────────────────────┐
│ External:        Internal:           External:              │
│ • Idealist       • job_postings      • Grants.gov            │
│ • SAM.gov        • grant_opportunities • SAM.gov              │
│                  • apprenticeships                          │
│                  • mentors                                  │
│                  • partners                                 │
└──────────────────────────────────────────────────────────────┘

User Portals:
┌──────────────────────────────────────────────────────────────┐
│ Student Portal  │  Employer Portal  │  Admin Portal          │
│ /opportunities  │  /opportunities   │  /admin/opportunities  │
└──────────────────────────────────────────────────────────────┘
```

---

## CONCLUSION

### Answers to Key Questions

| Question | Answer |
|----------|--------|
| Does grants opportunity model exist? | ✅ YES - `grant_opportunities` + `lib/integrations/grants-gov.ts` |
| Can volunteer opportunities reuse existing model? | ✅ YES - Extend with `volunteer_opportunities` table |
| Can existing matching engine support volunteer? | ✅ YES - Extend `lib/hub/job-matching.ts` |
| Do you need new tables? | 🟡 MINIMAL - Only `volunteer_opportunities`, `opportunity_matches` |

### Effort Recalculation

| Previous Estimate | Revised Estimate | Reason |
|-----------------|-----------------|--------|
| Idealist: 4-6 weeks | Idealist: 1-2 weeks | Reuses 70% infrastructure |
| Full Opportunity Hub: N/A | Opportunity Hub: 2-3 weeks | Builds on Idealist work |

### Recommendation

**YES - Build the Opportunity Hub**

The unified Opportunity Hub leverages existing infrastructure and can be built in **2-3 weeks** for MVP, with Idealist as just one connector among many opportunity sources.

---

**Audit + Architecture By:** OpenHands Agent  
**Date:** June 17, 2026  
**Note:** No code was modified during this audit.
