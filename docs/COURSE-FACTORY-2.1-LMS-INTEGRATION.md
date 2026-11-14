# Course Factory 2.1 - LMS Integration Layer

**Status**: Implemented  
**Date**: 2026-06-23

---

## Overview

The LMS Integration Layer connects blueprint definitions to learner-facing experiences. It transforms static blueprint data into dynamic API responses that power the Learner Dashboard, Competency Tracking, Practice Exams, and Apprenticeship features.

```
Blueprint Definition
        ↓
Blueprint Loader
        ↓
Integration Types
        ↓
    API Routes
        ↓
Learner Dashboard
```

---

## Architecture

### File Structure

```
lib/course-factory/integration/
├── types.ts              # All integration types and transformers

apps/app/api/learner/
├── progress/
│   └── route.ts         # GET /api/learner/progress
├── interactions/
│   └── route.ts         # GET /api/learner/interactions
├── competencies/
│   └── route.ts         # GET /api/learner/competencies
└── apprenticeship/
    └── route.ts         # GET /api/learner/apprenticeship
```

---

## API Endpoints

### 1. Learner Dashboard
**`GET /api/learner/progress`**

Returns full dashboard data including:
- Course progress
- Module progress  
- Lesson progress
- Competency progress
- Certification readiness
- Practice exams
- Apprenticeship status (if enrolled)
- Gamification state
- Notifications

**Response Shape**:
```typescript
{
  success: true,
  dashboard: LearnerDashboard,
  meta: {
    blueprintId: string,
    enrollmentType: 'standard' | 'apprentice' | 'enterprise',
    features: CourseFeatures,
    lastSynced: string
  }
}
```

### 2. Interactions
**`GET /api/learner/interactions?lessonSlug=xxx`**

Returns all interactions for a lesson built from blueprint specs:
- Knowledge Checks
- Flashcards
- Scenarios
- Click-to-Reveal
- Drag-and-Drop
- Matching
- Case Studies
- Simulations
- Decision Trees

**Response Shape**:
```typescript
{
  success: true,
  lessonSlug: string,
  moduleSlug: string,
  interactions: Interaction[],
  flashcards: Flashcard[],
  meta: {
    specs: InteractionSpecs,
    totalInteractions: number,
    completedInteractions: number
  }
}
```

### 3. Competencies
**`GET /api/learner/competencies`**

Returns competency tree from blueprint:
- All competencies with mastery levels
- Touchpoints (lessons, labs, assessments)
- Verification status
- Module associations

**Response Shape**:
```typescript
{
  success: true,
  courseId: string,
  programSlug: string,
  overallMastery: number,
  totalCompetencies: number,
  verifiedCompetencies: number,
  competencies: CompetencyNode[]
}
```

### 4. Apprenticeship
**`GET /api/learner/apprenticeship`**

Returns apprenticeship progress (apprentice enrollments only):
- RTI Hours
- OJL Hours
- Employer Evaluations
- Skill Sign-offs
- RAPIDS Reporting
- Completion Status

**Response Shape**:
```typescript
{
  success: true,
  enrollmentId: string,
  status: 'active' | 'completed' | 'dropped',
  hours: {
    total: { required, completed, remaining, percentComplete },
    rti: { required, completed, remaining, byMonth },
    ojl: { required, completed, remaining, byMonth }
  },
  competencyTracking: { totalRequired, verified, pending, signoffs },
  employerEvaluations: { total, pending, submitted, evaluations },
  rapids: { rapidsId, programCode, lastReportedAt, nextReportDue, status },
  completionStatus: { percent, isComplete, eta, blockers }
}
```

---

## Key Types

### LearnerDashboard
```typescript
interface LearnerDashboard {
  learnerId: string;
  courseId: string;
  programSlug: string;
  enrollmentType: EnrollmentType;
  
  progress: CourseProgress;
  currentModule: ModuleProgress;
  currentLesson: LessonProgress;
  nextLesson?: { slug, title, moduleSlug, estimatedMinutes };
  
  competencies: CompetencyProgress[];
  certification?: CertificationReadiness;
  practiceExams: PracticeExam[];
  
  apprenticeship?: ApprenticeshipProgress; // Only for apprentices
  gamification: GamificationState;
  notifications: NotificationSummary;
}
```

### InteractionSpecs (from Blueprint)
```typescript
interface InteractionSpecs {
  includeKnowledgeChecks: boolean;
  includeScenarios: boolean;
  includeFlashcards: boolean;
  includeClickToReveal: boolean;
  includeDragDrop: boolean;
  includeMatching: boolean;
  includeCaseStudies: boolean;
  includeSimulations: boolean;
  includeDecisionTrees: boolean;
  knowledgeCheckCount: number;
  scenarioCount: number;
  flashcardCount: number;
}
```

---

## Data Flow

### Blueprint → Dashboard

```
1. Load blueprint via loadBlueprintWithProgram()
2. Get enrollment + learner context
3. Fetch progress data from DB
4. Transform via blueprintToDashboard()
5. Return typed LearnerDashboard
```

### Blueprint → Interactions

```
1. Find lesson in blueprint.modules
2. Get InteractionSpecs from module
3. For each spec type:
   - Generate interaction ID
   - Check progress from DB
   - Build Interaction object
4. Return interactions array
```

---

## Database Tables Required

The integration layer expects these tables:

```sql
-- Learner progress tracking
CREATE TABLE module_progress (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  module_slug TEXT,
  lessons_completed INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  lesson_slug TEXT,
  percent_complete INTEGER,
  time_spent INTEGER,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  interactions_completed TEXT[]
);

-- Competency tracking
CREATE TABLE competency_progress (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  competency_key TEXT,
  current_level INTEGER,
  verified BOOLEAN,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  touchpoints JSONB
);

-- Interaction progress
CREATE TABLE interaction_progress (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES auth.users(id),
  lesson_slug TEXT,
  interaction_type TEXT,
  interaction_id TEXT,
  completed BOOLEAN,
  score INTEGER,
  attempts INTEGER,
  last_attempt_at TIMESTAMPTZ
);

-- Flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY,
  blueprint_id TEXT,
  lesson_slug TEXT,
  front TEXT,
  back TEXT,
  tags TEXT[]
);

CREATE TABLE flashcard_reviews (
  id UUID PRIMARY KEY,
  card_id UUID REFERENCES flashcards(id),
  learner_id UUID REFERENCES auth.users(id),
  lesson_slug TEXT,
  quality INTEGER,
  last_reviewed TIMESTAMPTZ
);

-- Apprenticeship
CREATE TABLE rti_hours (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  hours DECIMAL,
  activity_date DATE,
  activity_type TEXT
);

CREATE TABLE ojl_hours (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  hours DECIMAL,
  activity_date DATE,
  task_description TEXT
);

CREATE TABLE employer_evaluations (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  period_start DATE,
  period_end DATE,
  overall_rating INTEGER,
  competency_ratings JSONB,
  status TEXT,
  submitted_at TIMESTAMPTZ
);

CREATE TABLE skill_signoffs (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  skill_key TEXT,
  competency_key TEXT,
  signed_off BOOLEAN,
  signed_off_by UUID,
  signed_off_at TIMESTAMPTZ,
  employer_name TEXT
);

CREATE TABLE rapids_reporting (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  rapids_id TEXT,
  program_code TEXT,
  last_reported_at TIMESTAMPTZ,
  next_report_due DATE
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT,
  title TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

---

## Usage in Components

### Learner Dashboard Component
```tsx
import { useEffect, useState } from 'react';

export function LearnerDashboard({ programSlug }: { programSlug: string }) {
  const [dashboard, setDashboard] = useState<LearnerDashboard | null>(null);
  
  useEffect(() => {
    fetch(`/api/learner/progress?programSlug=${programSlug}`)
      .then(r => r.json())
      .then(d => setDashboard(d.dashboard));
  }, [programSlug]);
  
  if (!dashboard) return <Loading />;
  
  return (
    <div className="dashboard">
      <ProgressBar percent={dashboard.progress.percentComplete} />
      <ModuleList modules={dashboard.modules} />
      <CompetencySummary competencies={dashboard.competencies} />
      {dashboard.enrollmentType === 'apprentice' && (
        <ApprenticeshipPanel apprenticeship={dashboard.apprenticeship} />
      )}
    </div>
  );
}
```

### Interaction Renderer
```tsx
import { InteractionEngine } from '@/components/interactions';

export function LessonContent({ lessonSlug }: { lessonSlug: string }) {
  const [data, setData] = useState<InteractionsResponse | null>(null);
  
  useEffect(() => {
    fetch(`/api/learner/interactions?lessonSlug=${lessonSlug}`)
      .then(r => r.json())
      .then(d => setData(d));
  }, [lessonSlug]);
  
  if (!data) return <Loading />;
  
  return (
    <div className="lesson">
      <LessonContent />
      {data.interactions.map(interaction => (
        <InteractionEngine 
          key={interaction.id}
          interaction={interaction}
        />
      ))}
      <FlashcardDeck cards={data.flashcards} />
    </div>
  );
}
```

---

## Next Steps

1. **Create interaction components** - The actual UI for rendering interactions
2. **Add flashcard generation** - AI-powered flashcard creation from lesson content
3. **Build scenario generator** - Generate scenarios from blueprint competencies
4. **Add practice exam generation** - Auto-generate practice exams from question banks
5. **Implement notification triggers** - Event-driven notifications
6. **Build instructor dashboard** - Use same blueprint data for instructor views

---

## Success Criteria

- [x] Blueprint definitions drive all dashboard data
- [x] Enrollment type determines visible features
- [x] Apprenticeship features only shown to apprentices
- [x] Real-time progress tracking from DB
- [x] Competency tree from blueprint competencies
- [ ] Interaction components render correctly
- [ ] Flashcard spaced repetition working
- [ ] Practice exam generation from blueprints
