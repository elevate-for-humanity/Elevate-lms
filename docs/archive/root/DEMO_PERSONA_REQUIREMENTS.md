# DEMO PERSONA REQUIREMENTS
**Generated:** June 17, 2026

---

## PURPOSE

Define the demo personas needed to tell the complete Elevate workforce development story through a guided executive demonstration.

---

## PRIMARY PERSONA: MARIA SANTOS

### Role: Career Changer
**Demo Purpose:** Show the full student journey from referral through employment

### Bio
```
Name: Maria Santos
Age: 32
Location: Indianapolis, IN
Background: Previously worked in retail, now transitioning to healthcare
Career Goal: Certified Nursing Assistant (CNA)
Funding Source: WIOA (Vocational Rehabilitation referral)
```

### Student Profile Data

```typescript
const demoStudent = {
  name: "Maria Santos",
  email: "maria.santos.demo@elevate.example",
  phone: "(317) 555-0101",
  
  // Application
  application: {
    status: "completed",
    source: "Vocational Rehabilitation",
    funding: "WIOA",
    referral_date: "2026-01-15",
    intake_completed: "2026-01-20"
  },
  
  // Enrollment
  enrollment: {
    program: "CNA Certification Program",
    status: "in_progress",
    enrolled_date: "2026-02-01",
    expected_completion: "2026-06-15",
    progress: 75
  },
  
  // Credentials (completed)
  credentials: [
    {
      name: "CPR/First Aid Certification",
      issued_date: "2026-02-15",
      status: "active",
      credential_id: "CPR-2026-001"
    },
    {
      name: "OSHA 10-Hour Healthcare",
      issued_date: "2026-02-20",
      status: "active",
      credential_id: "OSHA-2026-001"
    }
  ],
  
  // Certificate (pending)
  certificates: [
    {
      name: "CNA Certification",
      status: "in_progress",
      expected_issue: "2026-06-15",
      requirements: [
        { name: "80 hours classroom", completed: true },
        { name: "40 hours clinical", completed: true },
        { name: "State exam", completed: false, scheduled: "2026-06-10" }
      ]
    }
  ],
  
  // Apprenticeship
  apprenticeship: {
    status: "enrolled",
    employer: "Community Health Network",
    start_date: "2026-03-01",
    ojt_hours: {
      logged: 280,
      required: 480,
      verified: 280
    },
    competencies: {
      completed: 12,
      total: 20
    },
    wage: {
      current: "$16.50/hr",
      progression: ["$15.00", "$16.50", "$18.00", "$19.50"]
    }
  },
  
  // Career
  career: {
    goal: "Registered Nurse (RN)",
    job_match_score: 87,
    matched_employers: 3,
    interview_scheduled: true
  }
};
```

### Digital Binder Contents

```
Maria Santos Digital Binder/
├── Personal Documents
│   ├── Government ID (sample)
│   ├── Social Security Card (sample)
│   ├── High School Diploma/GED
│   └── Resume
│
├── Application Materials
│   ├── WIOA Referral Form
│   ├── VR Case Notes
│   ├── Intake Assessment
│   └── Career Assessment Results
│
├── Training Records
│   ├── CNA Program Enrollment
│   ├── CPR Certification ✓
│   ├── OSHA 10 Certification ✓
│   ├── Clinical Hours Log
│   └── Skills Checklist
│
├── Assessment Results
│   ├── TABE Scores
│   ├── Career Interest Inventory
│   └── Skills Assessment
│
├── Apprenticeship Records
│   ├── Employer Agreement
│   ├── OJT Hour Log
│   ├── Competency Evaluations
│   └── Wage Progression Records
│
├── Testing
│   ├── Practice Exam Scores
│   └── State Exam Registration
│
└── Credentials
    ├── Digital Certificate (pending)
    ├── Digital Transcript
    └── Verification QR Code
```

---

## SECONDARY PERSONA: JAMES THOMPSON

### Role: Employer
**Demo Purpose:** Show the employer perspective and hiring pipeline

### Bio
```
Name: James Thompson
Title: Director of Workforce Development
Company: Community Health Network
Type: Healthcare System (Employer + Training Partner)
Location: Indianapolis, IN
Engagement: Active apprenticeship sponsor, hiring partner
```

### Employer Data

```typescript
const demoEmployer = {
  company: "Community Health Network",
  type: "Healthcare System",
  address: "Indianapolis, IN",
  
  // Portal Access
  portal: {
    role: "employer_admin",
    features_enabled: [
      "job_posting",
      "candidate_matching",
      "apprenticeship_management",
      "ojt_verification",
      "compliance_reporting"
    ]
  },
  
  // Active Postings
  jobPostings: [
    {
      title: "Certified Nursing Assistant",
      type: "Apprenticeship",
      candidates: 5,
      matches: 12
    },
    {
      title: "Medical Assistant",
      type: "Full-time",
      candidates: 3,
      matches: 8
    }
  ],
  
  // Apprentices
  apprentices: [
    {
      name: "Maria Santos",
      program: "CNA",
      ojt_hours: 280,
      competencies: 12,
      status: "active"
    }
  ],
  
  // Hiring Pipeline
  pipeline: {
    total_candidates: 15,
    in_interview: 4,
    offers_extended: 2,
    hired: 8,
    retention_rate: 92
  },
  
  // Compliance
  compliance: {
    wagess_compliant: true,
    ojt_verified: true,
    reporting_current: true
  }
};
```

---

## THIRD PERSONA: SARAH JOHNSON

### Role: Vocational Rehabilitation Counselor
**Demo Purpose:** Show the VR case management perspective

### Bio
```
Name: Sarah Johnson
Title: Vocational Rehabilitation Counselor
Organization: Indiana Vocational Rehabilitation
Location: Indianapolis, IN
Cases: 25 active clients
```

### VR Counselor Data

```typescript
const demoVRCounselor = {
  role: "vr_counselor",
  organization: "Indiana VR",
  
  // Caseload
  caseload: [
    {
      name: "Maria Santos",
      program: "CNA Apprenticeship",
      status: "in_training",
      progress: 75,
      next_steps: ["State exam", "Job placement"]
    }
  ],
  
  // Dashboard Metrics
  metrics: {
    active_clients: 25,
    in_training: 12,
    employed: 8,
    average_wage: "$17.25/hr",
    completion_rate: 85
  },
  
  // Access
  access: {
    student_records: true,
    progress_reports: true,
    employer_matching: true,
    compliance_reports: true
  }
};
```

---

## FOURTH PERSONA: ROBERT CHEN

### Role: Workforce Board Administrator
**Demo Purpose:** Show the workforce board oversight perspective

### Bio
```
Name: Robert Chen
Title: Workforce Development Coordinator
Organization: EmployIndy (Indianapolis Workforce Board)
Location: Indianapolis, IN
```

### Workforce Board Data

```typescript
const demoWorkforceBoard = {
  role: "workforce_board_admin",
  organization: "EmployIndy",
  
  // Oversight Dashboard
  metrics: {
    total_participants: 150,
    active_programs: 8,
    partner_employers: 25,
    credentials_issued: 45,
    placements: 38,
    average_wage: "$16.50/hr",
    completion_rate: 82
  },
  
  // Programs
  programs: [
    {
      name: "Healthcare Pathways",
      provider: "Elevate for Humanity",
      enrolled: 45,
      completed: 12,
      employed: 10
    }
  ],
  
  // Partners
  partners: [
    {
      name: "Elevate for Humanity",
      type: "Training Provider",
      programs: 5,
      active_students: 150
    }
  ],
  
  // Reports
  reports: {
    wioa_compliance: "current",
    performance_metrics: "updated",
    funding_allocation: "on_track"
  }
};
```

---

## FIFTH PERSONA: PATRICIA WILLIAMS

### Role: State Agency Funder
**Demo Purpose:** Show compliance reporting and outcome tracking

### Bio
```
Name: Patricia Williams
Title: Workforce Investment Director
Organization: Indiana Department of Workforce Development
Location: Indianapolis, IN
```

### Funder Data

```typescript
const demoFunder = {
  role: "state_funder",
  organization: "Indiana DWD",
  
  // Oversight
  oversight: {
    service_providers: 15,
    total_participants_served: 500,
    funds_disbursed: "$2.5M",
    outcomes_met: 92
  },
  
  // Compliance
  compliance: {
    wioa_reporting: "current",
    performance_metrics: "exceeding",
    audit_status: "clean"
  },
  
  // Outcomes
  outcomes: {
    credential_rate: 78,
    placement_rate: 72,
    retention_rate: 85,
    average_wage: "$17.00/hr"
  }
};
```

---

## PERSONA RELATIONSHIP MAP

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ELEVATE ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │ Patricia Williams│         │   Robert Chen    │                   │
│  │ (State Funder)   │         │ (Workforce Board)│                   │
│  └────────┬────────┘         └────────┬────────┘                   │
│           │                             │                            │
│           │ funds/reports               │ oversight                  │
│           ▼                             ▼                            │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │                    ELEVATE PLATFORM                      │        │
│  │                                                          │        │
│  │  ┌──────────────────────────────────────────────────┐   │        │
│  │  │ Sarah Johnson (VR Counselor)                     │   │        │
│  │  │ • Caseload management                             │   │        │
│  │  │ • Progress tracking                               │   │        │
│  │  │ • Referral to Elevate                             │   │        │
│  │  └──────────────────────────────────────────────────┘   │        │
│  │                          │                              │        │
│  │                          │ refers                        │        │
│  │                          ▼                              │        │
│  │  ┌──────────────────────────────────────────────────┐   │        │
│  │  │ Maria Santos (Student)                            │   │        │
│  │  │ • Digital Binder                                 │   │        │
│  │  │ • Training: CNA Program                          │   │        │
│  │  │ • Apprenticeship: Community Health Network      │   │        │
│  │  │ • Goal: RN                                      │   │        │
│  │  └──────────────────────────────────────────────────┘   │        │
│  │                          │                              │        │
│  │                          │ hires                         │        │
│  │                          ▼                              │        │
│  │  ┌──────────────────────────────────────────────────┐   │        │
│  │  │ James Thompson (Employer)                         │   │        │
│  │  │ • Community Health Network                       │   │        │
│  │  │ • Apprenticeship Sponsor                          │   │        │
│  │  │ • Hiring Partner                                 │   │        │
│  │  └──────────────────────────────────────────────────┘   │        │
│  │                                                          │        │
│  └─────────────────────────────────────────────────────────┘        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DEMO JOURNEY MAP

### Maria Santos: Referral → Employment

```
1. REFERRAL
   └─ Sarah Johnson (VR) refers Maria to Elevate
   └─ System: Creates referral record

2. DIGITAL BINDER
   └─ Maria uploads documents
   └─ System: Intake assessment
   └─ VR views binder

3. ASSESSMENT
   └─ Maria completes TABE
   └─ Career interest inventory
   └─ Skills assessment

4. CAREER NAVIGATION
   └─ AI recommends CNA pathway
   └─ Wage potential shown
   └─ Employer matches displayed

5. TRAINING
   └─ Maria enrolls in CNA program
   └─ CPR certification
   └─ OSHA 10 certification

6. HANDS-ON TRAINING
   └─ Apprenticeship with Community Health
   └─ OJT hour logging
   └─ Competency tracking

7. TESTING
   └─ Practice exams
   └─ State board prep
   └─ Exam scheduling

8. CREDENTIALING
   └─ Certificate issued
   └─ Digital credential created
   └─ QR verification code

9. APPRENTICESHIP
   └─ OJT completion
   └─ Wage progression
   └─ Competency mastery

10. EMPLOYER PLACEMENT
    └─ Job matching
    └─ Interview scheduled
    └─ CNA hired at Community Health

11. CAREER ADVANCEMENT
    └─ Mentor matched
    └─ RN pathway planned
    └─ Continuing education
```

---

## DATA REQUIREMENTS BY PERSONA

### Maria Santos (Student)

| Data Type | Fields | Demo Ready |
|-----------|--------|------------|
| Profile | Name, email, phone, address | ✅ |
| Application | Status, source, funding | ✅ |
| Enrollment | Program, progress, dates | ✅ |
| Documents | 10+ sample documents | ❌ |
| Credentials | 2 completed, 1 pending | ❌ |
| OJT Hours | 280 logged, 280 verified | ✅ |
| Competencies | 12/20 completed | ✅ |
| Assessments | TABE, career interest | ✅ |
| Mentor Match | 3 matches, 1 assigned | ✅ |

### James Thompson (Employer)

| Data Type | Fields | Demo Ready |
|-----------|--------|------------|
| Company Profile | Name, type, location | ✅ |
| Job Postings | 2 active postings | ✅ |
| Apprentices | 1 active (Maria) | ✅ |
| Candidates | 15 total | ❌ |
| Pipeline | Metrics, stages | ❌ |
| Compliance | WOTC, reporting | ✅ |

### Sarah Johnson (VR Counselor)

| Data Type | Fields | Demo Ready |
|-----------|--------|------------|
| Caseload | 1 demo student (Maria) | ✅ |
| Metrics | Aggregate statistics | ✅ |
| Reports | Progress reports | ❌ |

### Robert Chen (Workforce Board)

| Data Type | Fields | Demo Ready |
|-----------|--------|------------|
| Dashboard | Aggregate metrics | ✅ |
| Partner Oversight | Elevate listed | ✅ |
| Programs | Healthcare Pathways | ✅ |

### Patricia Williams (Funder)

| Data Type | Fields | Demo Ready |
|-----------|--------|------------|
| Oversight | Aggregate metrics | ✅ |
| Compliance | Status indicators | ✅ |
| Reports | WIOA reporting | ❌ |

---

## TECHNICAL REQUIREMENTS

### Demo Database

```sql
-- Create demo organization
INSERT INTO organizations (id, name, slug, type) 
VALUES ('demo-org', 'Demo Organization', 'demo', 'demo');

-- Create demo users with isolated access
INSERT INTO profiles (id, user_id, organization_id, role) 
VALUES 
  ('demo-student-id', 'demo-student', 'demo-org', 'student'),
  ('demo-employer-id', 'demo-employer', 'demo-org', 'employer'),
  ('demo-vr-id', 'demo-vr', 'demo-org', 'vr_counselor');
```

### Demo Environment Isolation

```typescript
// Demo mode flag
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Demo data filter
const demoFilter = (query) => {
  if (DEMO_MODE) {
    return query.eq('organization_id', 'demo-org');
  }
  return query;
};
```

---

## ACCEPTANCE CRITERIA

### All Personas
- [ ] Can log in with demo credentials
- [ ] See only demo data
- [ ] Cannot access production data
- [ ] Can perform demo actions
- [ ] Can reset to demo state

### Maria Santos (Student)
- [ ] Digital binder displays 10+ documents
- [ ] Training progress shows 75%
- [ ] Credentials show 2 completed
- [ ] OJT hours display correctly
- [ ] Career match shows 87% score

### James Thompson (Employer)
- [ ] Dashboard shows Maria as apprentice
- [ ] Job postings are visible
- [ ] Candidate matches display
- [ ] OJT verification works

### Sarah Johnson (VR Counselor)
- [ ] Caseload shows Maria
- [ ] Progress tracking visible
- [ ] Referral history accessible

---

**Persona Requirements By:** OpenHands Agent  
**Date:** June 17, 2026
