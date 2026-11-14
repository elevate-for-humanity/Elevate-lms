# ELEVATE ENTERPRISE PLATFORM
# MASTER BLUEPRINT SPECIFICATION
## Version 1.0 | Production Readiness Directive

---

# DOCUMENT PURPOSE

This document serves as the **governing specification** for the Elevate Enterprise Platform. It is not a checklist—it is the authoritative source for what, why, and how every feature must be built, integrated, tested, and deployed.

Every team member, contractor, and AI agent must align their work to this specification.

---

# PART 1: GLOBAL DEVELOPMENT STANDARDS

## 1.1 Business Purpose Definition

Every feature MUST document:

| Element | Required For |
|---------|-------------|
| **Why it exists** | All features |
| **Who it serves** | All features |
| **Problem it solves** | All features |
| **Success metrics** | All features |
| **Revenue impact** | Revenue-generating features |
| **Grant reporting impact** | Government-funded features |
| **Compliance requirements** | Regulated features |

## 1.2 User Experience Standards

### First Five Seconds Rule
Every page must communicate within 5 seconds:
1. What this organization does
2. Who it serves
3. Why it's trustworthy
4. What the visitor should do next

### Emotional Design
- **Unemployed visitors** → Hope, possibility, dignity
- **Career changers** → Confidence, clarity, path forward
- **Employers** → Trust, value, partnership
- **Government partners** → Compliance, outcomes, ROI

### Journey Completeness
Every interaction must answer:
- Why Elevate?
- Why now?
- Why trust this organization?
- What outcome will I achieve?
- What action should I take next?

## 1.3 Storytelling Framework

Every page must include:

```
┌─────────────────────────────────────────────────────────────┐
│ HEADLINE: Outcome-focused, benefit-driven                    │
├─────────────────────────────────────────────────────────────┤
│ SUBHEADLINE: Credibility + Clarity                          │
├─────────────────────────────────────────────────────────────┤
│ PROOF: Trust indicators, statistics, testimonials              │
├─────────────────────────────────────────────────────────────┤
│ PATHWAY: Clear next step                                    │
└─────────────────────────────────────────────────────────────┘
```

## 1.4 Visual Experience Standards

### Required Elements
| Element | Specification |
|---------|---------------|
| Hero | Premium, 60%+ above fold |
| Photography | Real students, employers, campuses |
| Icons | Consistent, purposeful |
| Cards | Interactive, animated |
| Statistics | Animated counters |
| Testimonials | Real graduates, real outcomes |
| CTAs | Clear, contrasting, accessible |

### Performance Requirements
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.5s

## 1.5 Motion & Animation Standards

| Animation Type | Use Case | Performance Impact |
|--------------|----------|-------------------|
| Hero transitions | Page load | GPU-accelerated |
| Scroll reveals | Section entry | IntersectionObserver |
| Stat counters | Numbers | RAF-based |
| Hover effects | Interactive elements | CSS-only preferred |
| Loading states | Async content | Skeleton preferred |

## 1.6 AI Integration Framework

### AI Roles by Module

| Module | AI Functions |
|--------|-------------|
| **Homepage** | Program recommendations, FAQ answers |
| **Programs** | Career guidance, funding explanations |
| **Application** | Document assistance, eligibility guidance |
| **Enrollment** | Next step recommendations, document checklist |
| **Student** | Tutoring, study plans, career coaching |
| **Instructor** | Grading assistance, content suggestions |
| **Employer** | Candidate matching, compliance guidance |
| **Admin** | Anomaly detection, reporting, automation |

### AI Context Requirements
- User role and permissions
- Current module and context
- Historical interactions
- Platform data (where applicable)
- Session state

## 1.7 Database Design Standards

### Required Documentation
For every table:
```typescript
interface TableSpec {
  name: string;
  description: string;
  columns: ColumnSpec[];
  relationships: Relationship[];
  indexes: Index[];
  policies: RLS_Policy[];
  triggers?: Trigger[];
  audit_fields: AuditField[];
}
```

### Required Fields (All Tables)
- `id`: UUID, primary key
- `created_at`: timestamp with timezone
- `updated_at`: timestamp with timezone
- `created_by`: UUID, foreign key (nullable)
- `deleted_at`: timestamp with timezone (nullable, soft delete)

## 1.8 API Design Standards

### REST Conventions
```
GET    /api/resource          - List
GET    /api/resource/:id     - Read
POST   /api/resource          - Create
PATCH  /api/resource/:id     - Update
DELETE /api/resource/:id     - Delete
```

### Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

## 1.9 Security Standards

### Authentication
- Supabase Auth with MFA required for staff
- Role-based access control (RBAC)
- Session management with refresh tokens
- IP allowlisting for admin access

### Authorization Matrix

| Role | Homepage | Programs | Application | Student | Admin |
|------|----------|----------|-------------|---------|-------|
| Visitor | Read | Read | Apply | - | - |
| Applicant | Read | Read | Read/Write | - | - |
| Student | Read | Read | - | Read/Write | - |
| Instructor | Read | Read | - | Read | - |
| Employer | Read | Read | - | - | - |
| Admin | Full | Full | Full | Full | Full |

### Security Checklist
- [ ] Input validation on all forms
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Data encryption at rest
- [ ] Data encryption in transit

## 1.10 Analytics Requirements

### Required Events

| Category | Events |
|----------|--------|
| **Page Views** | page_view, section_view, cta_click |
| **Forms** | form_start, form_step, form_complete, form_abandon |
| **Programs** | program_view, program_compare, program_save |
| **Application** | application_start, application_complete |
| **Enrollment** | enrollment_start, enrollment_complete |
| **Student** | course_view, assignment_submit, assessment_take |
| **Conversions** | apply_click, tour_book, advisor_chat |

### Required Metrics Dashboard
- Visitor journey funnel
- Application completion rate
- Enrollment conversion rate
- Student success rate
- Time to completion
- Cost per acquisition

## 1.11 Testing Standards

### Unit Tests
- Minimum 80% code coverage
- All business logic functions
- All utilities
- All validators

### Integration Tests
- API endpoints
- Database operations
- Authentication flows
- Role permissions

### End-to-End Tests (Playwright)
- Critical user journeys
- Payment flows (mocked)
- Enrollment workflows
- Dashboard navigation

### Accessibility Tests
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast ratios

---

# PART 2: PHASE SPECIFICATIONS

---

## PHASE 3: PUBLIC WEBSITE EXPERIENCE

### Business Purpose
The public website is the digital front door for all stakeholders. It must establish trust, communicate value, guide visitors to appropriate actions, and capture leads for downstream workflows.

**Serves:**
- Unemployed/underemployed individuals
- Career changers
- Employers seeking workforce partners
- Government agencies evaluating providers
- Grant administrators reviewing outcomes
- Donors and community partners

**Success Metrics:**
- Visitor-to-application rate: > 5%
- Application completion rate: > 60%
- Trust indicator engagement: > 30% scroll
- Mobile traffic: > 50%

### User Experience

#### Homepage Journey
```
Visitor Arrives
    ↓
Hero (3 seconds to understand)
    ↓
Trust Bar (instant credibility)
    ↓
Career Pathways (self-qualify)
    ↓
Programs Preview (browse)
    ↓
Calculators (self-assess)
    ↓
Funding Info (remove barriers)
    ↓
Success Stories (build hope)
    ↓
CTA (apply/schedule/contact)
```

#### Required Sections
| Section | Purpose | Required Elements |
|---------|---------|------------------|
| Hero | Instant understanding | Video/gradient, headline, stats, CTAs |
| Trust Bar | Credibility | DOL, WIOA, WorkOne, employers, outcomes |
| Career Pathways | Self-qualification | Interactive career selector |
| Programs | Discovery | Featured programs with key details |
| ROI Calculator | Barrier removal | Interactive investment calculator |
| Salary Data | Outcome preview | Real salary ranges by career |
| Funding Info | Financial clarity | All funding options explained |
| Success Stories | Social proof | Graduate testimonials with outcomes |
| Employer Partners | Employment guarantee | Logo wall with hiring info |
| FAQ | Self-service | Pre-answered common questions |
| Final CTA | Conversion | Apply/Schedule/Contact options |

### AI Integration

#### AI Career Advisor Widget
**Location:** Floating, bottom-right corner
**Trigger:** After 30 seconds OR on scroll to 50%

**Capabilities:**
- Program recommendations based on interests
- Funding eligibility guidance
- Application process explanation
- Next steps clarification

**Data Required:**
- User interactions (clicked programs)
- Session context
- Platform program data

### Database Requirements

#### Tables
```sql
-- Homepage analytics
CREATE TABLE homepage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  section_views JSONB DEFAULT '[]',
  cta_clicks JSONB DEFAULT '[]',
  calculator_uses JSONB DEFAULT '[]',
  ai_interactions JSONB DEFAULT '[]',
  scroll_depth INTEGER,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program interest tracking
CREATE TABLE program_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitors(id),
  program_id UUID REFERENCES programs(id),
  interaction_type TEXT NOT NULL, -- 'view', 'compare', 'save', 'apply'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Success stories
CREATE TABLE success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graduate_name TEXT NOT NULL,
  program_id UUID REFERENCES programs(id),
  quote TEXT NOT NULL,
  outcome TEXT NOT NULL,
  video_url TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints
```
GET  /api/homepage/sections     - Get homepage configuration
GET  /api/homepage/analytics   - Get analytics (admin)
POST /api/homepage/analytics   - Track visitor event
GET  /api/programs/featured     - Get featured programs
GET  /api/success-stories      - Get success stories
GET  /api/employers/featured   - Get featured employers
```

### Admin Configuration
| Element | Configurable | Location |
|---------|-------------|----------|
| Hero headline | Yes | CMS |
| Hero subheadline | Yes | CMS |
| Hero CTA buttons | Yes | CMS |
| Hero video/image | Yes | CMS |
| Trust badges | Yes | CMS |
| Featured programs | Yes | CMS |
| Success stories | Yes | CMS |
| Employer logos | Yes | CMS |
| FAQ items | Yes | CMS |
| Calculator defaults | Yes | CMS |

### Automation
| Trigger | Action |
|---------|--------|
| 50% scroll | Show AI advisor prompt |
| Program view > 30s | Trigger follow-up email |
| Calculator use | Track for retargeting |
| Form abandon | Send recovery email (2 hours) |

### Testing Acceptance Criteria

#### Functional
- [ ] All CTAs navigate correctly
- [ ] All calculators compute accurately
- [ ] All forms validate properly
- [ ] Mobile responsive at all breakpoints
- [ ] AI advisor responds contextually

#### Performance
- [ ] Lighthouse Performance > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

#### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader announces sections
- [ ] Color contrast meets standards

---

## PHASE 4: PROGRAM EXPERIENCE

### Business Purpose
Each program page must serve as a complete recruiting experience, answering all questions a prospective student has and guiding them to application.

**Serves:**
- Self-qualifying prospects
- Career changers exploring options
- Referrals from employers/partners
- Government agency clients

**Success Metrics:**
- Program page-to-application rate: > 8%
- Time on page: > 2 minutes
- Calculator use rate: > 15%

### User Experience

#### Program Page Journey
```
Visitor Arrives (from search/referral)
    ↓
Hero with Key Stats (duration, credential, salary)
    ↓
Quick CTA (Apply Now)
    ↓
Trust Indicators (DOL, WIOA, employers)
    ↓
What You'll Learn (outcomes)
    ↓
Curriculum Overview (modules)
    ↓
Career Paths (job titles, salaries)
    ↓
Certifications (credentials earned)
    ↓
Funding Options (cost breakdown)
    ↓
Employer Partners (who hires)
    ↓
Student Work (portfolio/gallery)
    ↓
Instructor Spotlight (faculty)
    ↓
FAQ (common questions)
    ↓
Related Programs (cross-sell)
    ↓
Final CTA (apply/schedule)
```

### AI Integration

#### AI Program Advisor
**Location:** Embedded, contextual
**Trigger:** On scroll to 50% OR after 60 seconds

**Capabilities:**
- Personalized program recommendation
- Curriculum explanation
- Career pathway clarification
- Funding strategy recommendation

### Database Requirements

```sql
-- Programs
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  duration_weeks INTEGER,
  credential TEXT,
  salary_low INTEGER,
  salary_high INTEGER,
  tuition DECIMAL(10,2),
  color TEXT,
  icon TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program outcomes
CREATE TABLE program_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  outcome_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program curriculum modules
CREATE TABLE program_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  hours INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module topics
CREATE TABLE module_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES program_modules(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program careers
CREATE TABLE program_careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  career_title TEXT NOT NULL,
  salary_range TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program certifications
CREATE TABLE program_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  description TEXT,
  issuing_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program employers
CREATE TABLE program_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  employer_type TEXT,
  is_hiring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Testing Acceptance Criteria

#### Functional
- [ ] All sections render correctly
- [ ] Calculator computes ROI accurately
- [ ] All CTAs navigate correctly
- [ ] Curriculum modules expandable
- [ ] Related programs display correctly

#### SEO
- [ ] Unique meta tags per program
- [ ] Schema.org markup validated
- [ ] Image alt tags present
- [ ] Semantic HTML structure

---

## PHASE 5: APPLICATION EXPERIENCE

### Business Purpose
The application must guide prospective students through a frictionless journey that captures necessary data, validates eligibility, and triggers downstream enrollment workflows.

**Serves:**
- Prospective students
- Career changers
- Re-entry individuals
- Veterans

**Success Metrics:**
- Application start rate: > 40%
- Application completion rate: > 60%
- Average completion time: < 15 minutes

### User Experience

#### Application Journey
```
Visitor Clicks "Apply"
    ↓
Step 1: Personal Information
    - Name, DOB, SSN (last 4)
    - Program selection
    - Save & Continue
    ↓
Step 2: Contact Information
    - Email, phone
    - Address
    - Emergency contact
    ↓
Step 3: Background
    - Education history
    - Employment history
    - Goals statement
    ↓
Step 4: Funding Eligibility
    - WIOA status
    - VR status
    - Income information
    - AI funding recommendation
    ↓
Step 5: Documents
    - ID upload
    - Education proof
    - Income verification
    ↓
Step 6: Review & Submit
    - Summary view
    - Digital signature
    - Application submission
    ↓
Step 7: Confirmation
    - Next steps
    - Advisor assignment
    - Enrollment trigger
```

### AI Integration

#### Application Assistant
**Location:** Persistent sidebar
**Trigger:** Available throughout application

**Capabilities:**
- Step explanation
- Document guidance
- Funding eligibility clarification
- Eligibility requirement explanation

### Database Requirements

```sql
-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES users(id),
  program_id UUID REFERENCES programs(id),
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, under_review, accepted, rejected, withdrawn
  current_step INTEGER DEFAULT 1,
  form_data JSONB DEFAULT '{}',
  funding_eligible BOOLEAN,
  funding_source TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application steps
CREATE TABLE application_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application documents
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- id, diploma, income, other
  file_url TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  status TEXT DEFAULT 'pending', -- pending, verified, rejected
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application audit log
CREATE TABLE application_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Automation Triggers

| Trigger | Action |
|---------|--------|
| Application submitted | Create student record (if accepted) |
| Application submitted | Send confirmation email/SMS |
| Application submitted | Assign to admissions queue |
| Application under review | Notify applicant |
| Application accepted | Trigger enrollment workflow |
| Application rejected | Send feedback + alternatives |

### Testing Acceptance Criteria

#### Functional
- [ ] All 7 steps navigate correctly
- [ ] Save/resume works
- [ ] Validation prevents invalid submission
- [ ] Document upload works
- [ ] Progress indicator accurate

#### Security
- [ ] CSRF protection active
- [ ] Rate limiting applied
- [ ] Sensitive data encrypted
- [ ] Audit log captures all actions

---

## PHASE 6: ENROLLMENT & ONBOARDING

### Business Purpose
Automatically provision all systems and workflows when a student is accepted, ensuring they can begin learning immediately.

**Serves:**
- Accepted applicants
- Enrollment staff
- Instructors

**Success Metrics:**
- Time from acceptance to first login: < 24 hours
- Onboarding completion rate: > 80%
- Advisor response time: < 4 hours

### User Experience

#### Enrollment Journey
```
Application Accepted
    ↓
System Creates:
- Student profile
- LMS account
- CRM record
- Digital Binder
- Financial record
    ↓
Advisor Assignment
    ↓
Welcome Email/SMS Sent
    ↓
Onboarding Checklist Created
    ↓
Orientation Scheduled
    ↓
Student Receives:
- Login credentials
- Welcome packet
- Orientation invite
- Supply list
    ↓
Student Completes Onboarding
    ↓
First Day of Class
```

### Automation Requirements

```typescript
// Enrollment triggered automation
interface EnrollmentAutomation {
  on: 'application.accepted';
  actions: [
    { type: 'create_student_record' },
    { type: 'create_lms_account' },
    { type: 'create_crm_record' },
    { type: 'create_digital_binder' },
    { type: 'assign_advisor', params: { load_balance: true } },
    { type: 'send_welcome_email' },
    { type: 'send_sms', params: { template: 'welcome' } },
    { type: 'create_onboarding_checklist' },
    { type: 'schedule_orientation' },
    { type: 'create_financial_record' },
    { type: 'notify_admissions_team' }
  ];
}
```

### Database Requirements

```sql
-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  application_id UUID REFERENCES applications(id),
  program_id UUID REFERENCES programs(id),
  enrollment_date DATE,
  expected_completion_date DATE,
  status TEXT DEFAULT 'pending', -- pending, active, on_hold, withdrawn, graduated, terminated
  advisor_id UUID REFERENCES users(id),
  cohort TEXT,
  student_id TEXT UNIQUE, -- Human-readable ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding tasks
CREATE TABLE onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital binders
CREATE TABLE digital_binders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  binder_type TEXT NOT NULL, -- enrollment, academic, financial
  status TEXT DEFAULT 'incomplete',
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PHASE 7: STUDENT EXPERIENCE

### Business Purpose
Provide students with a personalized command center for their entire educational journey, from learning to graduation to employment.

**Serves:**
- Active students
- Apprentices
- Alumni (for career services)

**Success Metrics:**
- Daily active usage: > 70%
- Course completion rate: > 85%
- Graduation rate: > 80%
- Employment rate (6 months): > 85%

### User Experience

#### Student Dashboard Journey
```
Student Logs In
    ↓
Dashboard Shows:
- Welcome message
- Progress overview
- Today's tasks
- Upcoming events
- Recent messages
    ↓
Navigation to:
- Courses
- Assignments
- Calendar
- Messages
- Grades
- Credentials
- Career Services
- Settings
    ↓
Quick Actions:
- Continue last course
- View next assignment
- Message advisor
- Check schedule
```

### AI Integration

#### AI Tutor Widget
**Location:** Persistent, contextual
**Trigger:** Available in course content

**Capabilities:**
- Explain concepts
- Answer questions
- Generate study guides
- Create flashcards
- Summarize content

#### AI Career Coach
**Location:** Career services section
**Trigger:** After 75% program completion

**Capabilities:**
- Resume review and suggestions
- Interview preparation
- Job matching
- Salary negotiation guidance

### Database Requirements

```sql
-- Student courses
CREATE TABLE student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  enrollment_date DATE,
  completion_date DATE,
  progress_percent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, completed, failed, dropped
  current_module_id UUID,
  current_lesson_id UUID,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_course_id UUID REFERENCES student_courses(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES course_assignments(id),
  status TEXT DEFAULT 'pending', -- pending, submitted, graded, returned
  submission_url TEXT,
  submitted_at TIMESTAMPTZ,
  grade DECIMAL(5,2),
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  session_date DATE NOT NULL,
  status TEXT NOT NULL, -- present, absent, tardy, excused
  hours DECIMAL(4,2),
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credentials
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  credential_name TEXT NOT NULL,
  issuing_body TEXT,
  issue_date DATE,
  expiry_date DATE,
  credential_number TEXT,
  verification_url TEXT,
  status TEXT DEFAULT 'earned', -- earned, pending, expired, revoked
  digital_badge_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PHASE 8: INSTRUCTOR EXPERIENCE

### Business Purpose
Provide instructors with tools to manage courses, track student progress, grade assignments, and communicate effectively.

**Serves:**
- Primary instructors
- Guest lecturers
- Lab supervisors
- TAs

**Success Metrics:**
- Grade turnaround: < 72 hours
- Student satisfaction: > 4.2/5
- Office hour utilization: > 30%

### User Experience

#### Instructor Dashboard Journey
```
Instructor Logs In
    ↓
Dashboard Shows:
- Today's schedule
- Pending grades
- Recent submissions
- Student alerts
- Announcements
    ↓
Navigation to:
- My Courses
- Student Roster
- Gradebook
- Attendance
- Calendar
- Announcements
- Reports
```

### AI Integration

#### AI Teaching Assistant
**Capabilities:**
- Auto-grade multiple choice
- Plagiarism detection
- Student performance prediction
- Content suggestions
- Engagement analysis

---

## PHASE 9: REGISTERED APPRENTICESHIP EXPERIENCE

### Business Purpose
Manage the complete apprenticeship lifecycle including RTI, OJL, competency tracking, wage progression, and government reporting.

**Serves:**
- Apprentices
- Mentors
- Employers
- Compliance staff

**Government Reporting Requirements:**
- RAPIDS integration
- O*NET alignment
- State compliance reporting
- Federal reporting (ETA 671)

### Database Requirements

```sql
-- Apprenticeships
CREATE TABLE apprenticeships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  employer_id UUID REFERENCES employers(id),
  mentor_id UUID REFERENCES users(id),
  program_id UUID REFERENCES programs(id),
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  status TEXT DEFAULT 'active', -- active, suspended, completed, cancelled
  wage_start DECIMAL(10,2),
  wage_current DECIMAL(10,2),
  rapids_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competency tracking
CREATE TABLE apprenticeship_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id UUID REFERENCES apprenticeships(id) ON DELETE CASCADE,
  competency_code TEXT NOT NULL,
  competency_name TEXT NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OJL (On-the-Job Learning) hours
CREATE TABLE ojl_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id UUID REFERENCES apprenticeships(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  hours_logged DECIMAL(5,2),
  employer_verified BOOLEAN DEFAULT FALSE,
  employer_verified_at TIMESTAMPTZ,
  employer_verified_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RTI (Related Technical Instruction)
CREATE TABLE rti_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id UUID REFERENCES apprenticeships(id) ON DELETE CASCADE,
  course_session_id UUID REFERENCES course_sessions(id),
  attendance_date DATE NOT NULL,
  hours DECIMAL(4,2),
  status TEXT DEFAULT 'present',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations
CREATE TABLE mentor_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id UUID REFERENCES apprenticeships(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  evaluator_id UUID REFERENCES users(id),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  technical_skills INTEGER CHECK (technical_skills BETWEEN 1 AND 5),
  workplace_behavior INTEGER CHECK (workplace_behavior BETWEEN 1 AND 5),
  safety_awareness INTEGER CHECK (safety_awareness BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  comments TEXT,
  areas_for_improvement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wage progression
CREATE TABLE wage_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenticeship_id UUID REFERENCES apprenticeships(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  wage_rate DECIMAL(10,2) NOT NULL,
  increase_percent DECIMAL(5,2),
  reason TEXT,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PHASE 10: TESTING CENTER

### Business Purpose
Provide secure, compliant testing for certification exams with proper proctoring, scoring, and credentialing.

**Serves:**
- Students requiring certification
- Employers verifying credentials
- State boards
- Testing agencies (Pearson VUE, Prometric)

### Database Requirements

```sql
-- Test sessions
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  test_id UUID REFERENCES tests(id),
  scheduled_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, no_show
  score DECIMAL(5,2),
  passing_score DECIMAL(5,2),
  passed BOOLEAN,
  proctor_id UUID REFERENCES users(id),
  location_id UUID REFERENCES test_locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test attempts
CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES test_questions(id),
  answer TEXT,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  attempt_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proctor logs
CREATE TABLE proctor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Test locations
CREATE TABLE test_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## PHASE 11: EMPLOYER & PARTNER EXPERIENCES

### Business Purpose
Provide employers and partners with tools to engage with Elevate, post jobs, request apprentices, and track workforce outcomes.

**Serves:**
- Hiring managers
- HR professionals
- Training coordinators
- Community partners
- Government workforce agencies

### Database Requirements

```sql
-- Employers
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  dba TEXT,
  ein TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  industry TEXT,
  size TEXT, -- small, medium, large
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  partnership_level TEXT, -- bronze, silver, gold, platinum
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job postings
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employers(id),
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  location TEXT,
  employment_type TEXT, -- full_time, part_time, contract
  remote_option TEXT, -- onsite, hybrid, remote
  status TEXT DEFAULT 'active', -- draft, active, closed, filled
  expires_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprenticeship requests
CREATE TABLE apprenticeship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES employers(id),
  program_id UUID REFERENCES programs(id),
  number_of_positions INTEGER,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, filled
  request_date TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  notes TEXT
);
```

---

## PHASE 12: ADMIN OPERATING SYSTEM

### Business Purpose
Provide administrators with a complete operating system to manage all platform operations without code changes.

**Serves:**
- Platform administrators
- Admissions managers
- Program directors
- Compliance officers
- Finance staff

### Admin Modules

| Module | Features |
|--------|----------|
| **Students** | Search, filters, bulk actions, export |
| **Applications** | Queue, review, approve/reject |
| **Enrollment** | Manage enrollments, cohorts |
| **Programs** | CRUD, curriculum editor |
| **Courses** | Course builder, module editor |
| **Attendance** | Record, edit, reports |
| **Grades** | Gradebook, transcripts |
| **Credentials** | Issue, revoke, verify |
| **Testing** | Schedule, proctor, reports |
| **Employers** | Manage partners, jobs |
| **Apprenticeships** | Full lifecycle management |
| **Finance** | Tuition, payments, refunds |
| **Grants** | Award tracking, reporting |
| **Compliance** | Audit trails, reports |
| **Communications** | Email, SMS, templates |
| **Reports** | Custom reports, dashboards |
| **Settings** | System configuration |

### Admin Configuration Capabilities

| Setting | Configurable |
|---------|-------------|
| Email templates | Yes |
| SMS templates | Yes |
| Application forms | Yes |
| Approval workflows | Yes |
| User roles | Yes |
| Permission sets | Yes |
| Notification rules | Yes |
| Integration settings | Yes |
| Branding | Yes |

---

## PHASE 13: DEV STUDIO

### Business Purpose
Provide internal development tools for building and maintaining the platform without production deployments.

**Serves:**
- Developers
- Content editors
- System administrators

### Dev Studio Tools

| Tool | Purpose |
|------|---------|
| **Visual Builder** | Page construction |
| **Course Builder** | LMS content creation |
| **SOP Builder** | Procedure documentation |
| **Form Builder** | Form construction |
| **Workflow Builder** | Automation design |
| **AI Prompt Manager** | AI behavior configuration |
| **Environment Manager** | Dev/staging/prod switching |
| **Database Explorer** | Data inspection |
| **Version Control** | Git integration |
| **Deployment Manager** | One-click deploys |
| **Bundle Analyzer** | Size optimization |
| **Performance Monitor** | Real-time metrics |
| **Error Center** | Issue tracking |

---

## PHASE 14: AI PLATFORM

### AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI ORCHESTRATION LAYER                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Context  │  │ Memory   │  │ Tools    │  │ Safety   │  │
│  │ Manager  │  │ Store    │  │ Access   │  │ Filter   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                        AI MODELS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ GPT-4    │  │ Claude   │  │ Embed-   │  │ Custom   │  │
│  │ (Primary)│  │ (Alt)    │  │ dings    │  │ Models   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     APPLICATION LAYER                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │Admis │ │Fundin│ │Career │ │Tutor │ │Grade │ │Admin │ │
│  │sions │ │g     │ │Coach  │ │      │ │Assist│ │Assist│ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
└─────────────────────────────────────────────────────────────┘
```

### AI Capabilities by Module

| Module | AI Capabilities |
|--------|----------------|
| **Homepage** | Program recommendations, FAQ answers |
| **Programs** | Career guidance, curriculum explanation |
| **Application** | Document review, eligibility guidance |
| **Funding** | Eligibility assessment, source recommendation |
| **Enrollment** | Next steps, document checklist |
| **Student** | Tutoring, study plans, flashcards |
| **Instructor** | Auto-grading, content suggestions |
| **Career** | Resume review, interview prep, job matching |
| **Employer** | Candidate matching, compliance guidance |
| **Admin** | Anomaly detection, report generation |

---

## PHASE 15: AUTOMATION ENGINE

### Automation Architecture

```typescript
interface AutomationTrigger {
  type: 'event' | 'schedule' | 'webhook' | 'manual';
  event?: string;
  schedule?: string; // cron expression
  webhook?: string;
}

interface AutomationAction {
  type: string;
  params: Record<string, any>;
  on_error?: 'continue' | 'stop' | 'notify';
}

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  is_active: boolean;
  last_run_at?: string;
  run_count: number;
}
```

### Core Automations

| Automation | Trigger | Actions |
|------------|---------|---------|
| Application Welcome | application.submitted | Send welcome email, create tasks |
| Acceptance Flow | application.accepted | Provision accounts, assign advisor |
| Rejection Flow | application.rejected | Send feedback, suggest alternatives |
| Enrollment Complete | enrollment.confirmed | Send welcome, schedule orientation |
| Class Reminder | schedule.24h_before | Send reminder email/SMS |
| Assignment Due | assignment.1h_before | Send reminder |
| Grade Posted | grade.recorded | Notify student |
| Attendance Alert | attendance.3_absences | Alert advisor |
| Credential Earned | credential.issued | Generate certificate, update resume |
| Apprenticeship Complete | apprenticeship.completed | Generate completion letter |
| Job Match | job.posted | Match eligible students |
| Contract Renewal | employer.30d_expiry | Send renewal notification |
| Compliance Report | schedule.monthly | Generate government reports |
| Backup | schedule.daily | Database backup |

---

## PHASE 16: PRODUCTION VALIDATION

### Production Gates

All phases must pass these gates before deployment:

#### Pre-Deployment Gates
- [ ] Architecture review completed
- [ ] Blueprint compliance verified
- [ ] Code review approved
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] SEO validation complete
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing

#### Deployment Gates
- [ ] Docker build successful
- [ ] Marketing build successful
- [ ] LMS build successful
- [ ] Admin build successful
- [ ] TypeScript compilation successful
- [ ] ESLint no errors
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 90

#### Post-Deployment Gates
- [ ] Smoke tests passing
- [ ] Monitoring dashboards active
- [ ] Alerting configured
- [ ] Rollback plan documented
- [ ] Runbook created
- [ ] Team trained

---

# PART 3: APPENDICES

## Appendix A: Required Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_program ON applications(program_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, session_date);
CREATE INDEX idx_credentials_student ON credentials(student_id);
CREATE INDEX idx_employers_active ON employers(is_active);
CREATE INDEX idx_job_postings_active ON job_postings(status);
CREATE INDEX idx_ojl_hours_week ON ojl_hours(apprenticeship_id, week_start_date);
```

## Appendix B: Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Storage
NEXT_PUBLIC_CLOUDFLARE_ENDPOINT=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=

# Monitoring
SENTRY_DSN=
```

## Appendix C: Required Environment Configurations

```typescript
// next.config.js
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['assets.elevateforhumanity.org'],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};
```

---

# DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Enterprise Team | Initial specification |

---

*This document serves as the governing specification for the Elevate Enterprise Platform. All development must align with this specification. Deviations must be documented and approved through the change control process.*
