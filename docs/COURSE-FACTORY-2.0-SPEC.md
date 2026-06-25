# Course Factory 2.0 — Complete Specification

**Version**: 2.0  
**Status**: Requirements  
**Generated**: 2026-06-23

---

## Overview

Course Factory 2.0 transforms course generation from content authoring into a **complete interactive workforce training ecosystem**. Every generated course automatically includes all learner-facing features, instructor tools, compliance tracking, and career pathway integration.

---

## Core Outputs

Every generated course must automatically include:

| Component | Description |
|-----------|-------------|
| **Course** | Master course record with metadata, credentials, pathways |
| **Modules** | Organized learning units with prerequisites |
| **Lessons** | Individual learning objects with content and objectives |
| **Knowledge Checks** | Inline questions every 3-5 screens |
| **Flashcards** | Auto-generated from key terms |
| **Practice Exams** | Domain-based certification prep |
| **Competency Assessments** | Skill verification aligned to credentials |
| **Completion Certificate Logic** | Automated issuance rules |

```typescript
interface CourseFactoryOutput {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  interactions: Interactions;
  assessments: Assessments;
  tracking: TrackingConfig;
  certificates: CertificateConfig;
  apprenticeship?: ApprenticeshipConfig;
}
```

---

## NHA / ESCO Style Interactions

### 1. Knowledge Checks

**Purpose**: Maintain engagement every 3-5 screens

**Pattern**:
```
Lesson → Knowledge Check → Lesson → Scenario → Lesson → Knowledge Check → Quiz
```

**Types**:
- Multiple choice (4 options)
- True/False
- Fill-in-the-blank
- Ordering/Sequencing
- Image-based selection

**Properties**:
```typescript
interface KnowledgeCheck {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'sequence' | 'image-select';
  question: string;
  imageUrl?: string;
  options?: { id: string; text: string; imageUrl?: string }[];
  correctAnswer: number | string | number[];
  explanation: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  domainKey?: string;
  competencyKey?: string;
}
```

---

### 2. Click-to-Reveal Activities

**Purpose**: Interactive exploration of diagrams, equipment, procedures

**Types**:
- Hotspot identification
- Label placement
- Procedure sequencing
- Equipment location

**Properties**:
```typescript
interface ClickToReveal {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  width: number;
  height: number;
  hotspots: Hotspot[];
  completionType: 'all' | 'count';
  requiredCount?: number;
  points: number;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  tooltip: string;
  correctFeedback: string;
  incorrectFeedback?: string;
  points: number;
}
```

**Example (HVAC)**:
```
Image: AC System Diagram
Hotspots: Condenser, Evaporator, Compressor, Thermostat
```

**Example (Barber)**:
```
Image: Sanitation Station Layout
Hotspots: Disinfectant Basin, Sterilization Equipment, Tool Tray, PPE Station
```

---

### 3. Interactive Scenarios

**Purpose**: Real-world decision-making practice

**Pattern**:
```
Situation → Question → Options → Feedback → Explanation → Next
```

**Properties**:
```typescript
interface InteractiveScenario {
  id: string;
  title: string;
  context: string;
  situation: string;
  question: string;
  options: ScenarioOption[];
  showFeedback: boolean;
  allowRetry: boolean;
  maxAttempts: number;
  points: number;
  competencies: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface ScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
  consequence?: string;
  nextScenarioId?: string;
  points: number;
}
```

**Example (CNA)**:
```
Context: Long-term care facility, night shift
Situation: Resident appears to be choking while eating
Question: What is your FIRST action?
Options:
  - Perform abdominal thrusts (Heimlich maneuver)
  - Call for help and assess airway
  - Start CPR immediately
  - Turn resident to side and pat back
```

---

### 4. Drag-and-Drop Activities

**Purpose**: Matching, categorization, sequencing practice

**Types**:
- Match pairs
- Categorize items
- Sequence steps
- Label diagrams

**Properties**:
```typescript
interface DragAndDrop {
  id: string;
  title: string;
  instructions: string;
  type: 'match' | 'categorize' | 'sequence' | 'label';
  items: DragItem[];
  targets: DropTarget[];
  pairs?: { itemId: string; targetId: string }[];
  correctOrder?: string[];
  categories?: Category[];
  points: number;
  attempts: number;
}

interface DragItem {
  id: string;
  content: string;
  imageUrl?: string;
}

interface DropTarget {
  id: string;
  name: string;
  position: { x: number; y: number };
  accepts: string[];
  feedback?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}
```

**Examples by Program**:

| Program | Match | Categorize | Sequence |
|---------|-------|------------|----------|
| HVAC | Refrigerants ↔ Applications | Tools ↔ Use | Refrigerant Recovery Steps |
| Barber | Tools ↔ Purpose | Hair Types ↔ Cutting Style | Sanitation Procedure |
| CNA | Vital Signs ↔ Normal Range | Equipment ↔ Procedure | Hand Hygiene Steps |
| CDL | Pre-trip Inspection Items | Road Signs ↔ Meaning | Backing Procedure Steps |

---

### 5. Matching Activities

**Purpose**: Connect related concepts

**Properties**:
```typescript
interface MatchingActivity {
  id: string;
  title: string;
  leftColumn: { id: string; text: string }[];
  rightColumn: { id: string; text: string }[];
  pairs: { leftId: string; rightId: string }[];
  shuffle: boolean;
  points: number;
}
```

---

### 6. Flashcards

**Purpose**: Active recall and spaced repetition

**Properties**:
```typescript
interface Flashcard {
  id: string;
  deckId: string;
  front: FlashcardContent;
  back: FlashcardContent;
  tags: string[];
  difficulty: number;
  nextReview: Date;
  reviewHistory: ReviewRecord[];
  sourceLessonSlug?: string;
  keyTerm?: string;
}

interface FlashcardContent {
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

interface ReviewRecord {
  date: Date;
  quality: 0 | 1 | 2 | 3 | 4 | 5; // SM-2 algorithm
  responseTime: number;
}
```

**Generation Sources**:
- Key terms from lesson content
- Definitions from glossary
- Procedure steps
- Formula/calculation references
- Comparison pairs

---

### 7. Video + Questions

**Purpose**: Active viewing, not passive watching

**Pattern**:
```
[Video Segment] → [Question] → [Video Segment] → [Question] → ...
```

**Properties**:
```typescript
interface VideoInteraction {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  segments: VideoSegment[];
  transcript?: string;
  allowSkip: boolean;
  skipTimestamp?: number;
  completionCriteria: VideoCompletionCriteria;
}

interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  question?: KnowledgeCheck;
  autoPause: boolean;
}

interface VideoCompletionCriteria {
  watchedPercent: number;
  answeredCorrectly: number;
  minCorrectPercent: number;
}
```

---

### 8. Interactive Simulations

**Purpose**: Safe practice environment for procedural skills

**Types**:
- Step-by-step procedures
- Troubleshooting trees
- Equipment operation
- Safety scenarios

**Properties**:
```typescript
interface VirtualSimulation {
  id: string;
  title: string;
  category: 'procedure' | 'troubleshooting' | 'equipment' | 'safety' | 'documentation';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: SimulationStep[];
  competencies: string[];
  passingScore: number;
  maxAttempts: number;
  allowHint: boolean;
  points: number;
}

interface SimulationStep {
  id: string;
  instruction: string;
  imageUrl?: string;
  videoUrl?: string;
  actionRequired: SimulationAction;
  feedback: {
    correct: string;
    incorrect: string;
  };
  hints?: string[];
  nextStepId?: string;
  timeLimit?: number;
}

interface SimulationAction {
  type: 'click' | 'select' | 'sequence' | 'input' | 'swipe' | 'drag' | 'multi-select';
  targetId?: string;
  expectedSequence?: string[];
  validInputs?: string[];
  correctValue?: string | number;
  tolerance?: number;
}
```

**Examples by Program**:

| Program | Simulation |
|---------|------------|
| HVAC | Refrigerant recovery, AC troubleshooting, Equipment startup |
| Barber | Haircut technique, Sanitation inspection, Tool sterilization |
| CNA | Vital signs, Patient transfer, Medication administration |
| CDL | Pre-trip inspection, Backing procedures, Hazard recognition |
| Esthetics | Skin analysis, Facial treatment, Waxing procedure |

---

### 9. Case Studies

**Purpose**: Extended real-world application

**Properties**:
```typescript
interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  context: string;
  subject: string;
  situation: string;
  challenges: string[];
  timeline: TimelineEvent[];
  questions: CaseQuestion[];
  resources: CaseResource[];
  competencies: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

interface CaseQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'action-plan';
  options?: { id: string; text: string; isOptimal: boolean }[];
  rubric?: string;
  maxPoints: number;
}

interface CaseResource {
  type: 'document' | 'image' | 'video' | 'spreadsheet';
  title: string;
  url: string;
}
```

---

### 10. Decision Trees

**Purpose**: Algorithmic decision-making practice

**Properties**:
```typescript
interface DecisionTree {
  id: string;
  title: string;
  description: string;
  nodes: DecisionNode[];
  startNodeId: string;
  competencies: string[];
  passingScore: number;
}

interface DecisionNode {
  id: string;
  type: 'question' | 'action' | 'outcome';
  content: string;
  imageUrl?: string;
  branches?: {
    condition: string;
    nextNodeId: string;
  }[];
  outcome?: {
    text: string;
    isCorrect: boolean;
    feedback: string;
    points: number;
  };
}
```

---

## Apprenticeship Support

Every apprenticeship course must generate:

### RTI Hours
```typescript
interface RTIHoursConfig {
  totalHours: number;
  completedHours: number;
  remainingHours: number;
  trackedBy: 'date' | 'completion' | 'both';
  reportingPeriod: 'weekly' | 'monthly' | 'quarterly';
  approvedActivities: RTTActivity[];
}

interface RTIActivity {
  id: string;
  name: string;
  type: 'online' | 'in-person' | 'lab' | 'exam';
  hoursCredit: number;
  documentation: 'auto' | 'manual';
  requiresVerification: boolean;
}
```

### Competency Tracking
```typescript
interface CompetencyTracking {
  competencyKey: string;
  competencyName: string;
  touchpoints: Touchpoint[];
  currentLevel: number; // 0-100
  targetLevel: number;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  ojlHours: number;
  rtiHours: number;
}

interface Touchpoint {
  type: 'lesson' | 'quiz' | 'lab' | 'scenario' | 'evaluation' | 'practice';
  sourceId: string;
  score: number;
  timestamp: Date;
  evaluatorNotes?: string;
}
```

### OJL Mapping
```typescript
interface OJLMappings {
  competencyKey: string;
  ojlTasks: OJTask[];
  verificationRequired: boolean;
}

interface OJTask {
  id: string;
  task: string;
  worksiteActivity: string;
  employerSignoffRequired: boolean;
  employerName?: string;
  supervisorName?: string;
  completedDate?: Date;
  supervisorSignature?: string;
}
```

### Employer Evaluations
```typescript
interface EmployerEvaluation {
  id: string;
  apprenticeId: string;
  employerId: string;
  evaluationDate: Date;
  periodStart: Date;
  periodEnd: Date;
  competencies: CompetencyRating[];
  overallRating: 1 | 2 | 3 | 4 | 5;
  strengths: string;
  areasForImprovement: string;
  goals: string;
  supervisorSignature: string;
  apprenticeSignature: string;
  submittedAt: Date;
}

interface CompetencyRating {
  competencyKey: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}
```

### Apprentice Evaluations
```typescript
interface ApprenticeEvaluation {
  id: string;
  apprenticeId: string;
  employerId: string;
  evaluationDate: Date;
  worksiteQuality: 1 | 2 | 3 | 4 | 5;
  supervisorEffectiveness: 1 | 2 | 3 | 4 | 5;
  trainingQuality: 1 | 2 | 3 | 4 | 5;
  comments: string;
  submittedAt: Date;
}
```

### Skill Verification Forms
```typescript
interface SkillVerificationForm {
  id: string;
  skillKey: string;
  skillName: string;
  programSlug: string;
  standard: string;
  taskDescription: string;
  conditions: string;
  performanceStandard: string;
  demonstrationAttempts: number;
  successfulCompletion: boolean;
  employerSignature: string;
  date: Date;
}
```

### RAPIDS Reporting Fields
```typescript
interface RAPIDSReporting {
  rapidsId: string;
  programCode: string;
  occupationCode: string;
  sponsorName: string;
  apprenticeInfo: {
    firstName: string;
    lastName: string;
    ssn: string; // encrypted
    dateOfBirth: Date;
    gender: string;
    ethnicity: string;
    veteranStatus: boolean;
  };
  enrollmentDate: Date;
  completionDate?: Date;
  credentialEarned?: string;
  status: 'active' | 'completed' | 'cancelled' | 'suspended';
  hours: {
    cumulative: number;
    rti: number;
    ojl: number;
  };
  progress: {
    competenciesCompleted: number;
    competenciesRequired: number;
    percentComplete: number;
  };
  reportingPeriod: {
    start: Date;
    end: Date;
    dueDate: Date;
  };
}
```

### Apprenticeship Programs

| Program | RTI Hours | OJL Hours | Total Hours |
|---------|-----------|-----------|-------------|
| Barber Apprenticeship | 500 | 1,500 | 2,000 |
| Cosmetology Apprenticeship | 700 | 1,300 | 2,000 |
| Esthetics Apprenticeship | 300 | 400 | 700 |
| Manicurist Apprenticeship | 200 | 400 | 600 |
| Building Services Technician | 400 | 1,600 | 2,000 |
| Youth Culinary | 300 | 1,700 | 2,000 |

---

## Progress Tracking

### Course Progress
```typescript
interface CourseProgress {
  courseId: string;
  learnerId: string;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  percentComplete: number;
  currentModuleSlug: string;
  currentLessonSlug: string;
  totalTimeSpent: number; // minutes
  lastActiveAt: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'dropped';
}
```

### Module Progress
```typescript
interface ModuleProgress {
  moduleSlug: string;
  learnerId: string;
  startedAt: Date;
  completedAt?: Date;
  percentComplete: number;
  lessonsCompleted: number;
  totalLessons: number;
  quizScores: { quizId: string; score: number; attempts: number }[];
  competencyScores: Record<string, number>;
  timeSpent: number;
}
```

### Lesson Progress
```typescript
interface LessonProgress {
  lessonSlug: string;
  learnerId: string;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
  interactionsCompleted: InteractionCompletion[];
  knowledgeCheckScores: { questionId: string; correct: boolean; attempts: number }[];
  flashcardProgress: {
    totalCards: number;
    masteredCards: number;
    dueCards: number;
  };
  videoProgress?: {
    watchedPercent: number;
    segmentsCompleted: number;
  };
}
```

### Competency Progress
```typescript
interface CompetencyProgress {
  competencyKey: string;
  learnerId: string;
  currentLevel: number; // 0-100
  targetLevel: number;
  progress: {
    lessons: number;
    labs: number;
    scenarios: number;
    assessments: number;
  };
  evidence: EvidenceRecord[];
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}
```

### Certification Readiness
```typescript
interface CertificationReadiness {
  certificationId: string;
  learnerId: string;
  examEligibility: boolean;
  readinessScore: number; // 0-100
  domainScores: {
    domainKey: string;
    domainName: string;
    weight: number;
    score: number;
    questionsAnswered: number;
    questionsCorrect: number;
  }[];
  weakAreas: string[];
  recommendedFocus: string[];
  practiceExamAverage?: number;
  lastPracticeExam?: Date;
  examReadyDate?: Date;
}
```

### Practice Exam Scores
```typescript
interface PracticeExamScore {
  examId: string;
  learnerId: string;
  attemptNumber: number;
  takenAt: Date;
  score: number;
  passingScore: number;
  passed: boolean;
  timeSpent: number;
  domainScores: {
    domainKey: string;
    score: number;
    questionsCorrect: number;
    questionsTotal: number;
  }[];
  questionResults: {
    questionId: string;
    correct: boolean;
    timeSpent: number;
    attempts: number;
  }[];
}
```

### Attendance
```typescript
interface AttendanceRecord {
  learnerId: string;
  sessionId: string;
  sessionType: 'rti' | 'lab' | 'instructor-led' | 'assessment';
  date: Date;
  scheduledTime: string;
  actualStart?: Date;
  actualEnd?: Date;
  duration?: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  tardyMinutes?: number;
  reason?: string;
}
```

---

## Notifications

### Notification Types
```typescript
interface Notification {
  id: string;
  learnerId: string;
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

type NotificationType = 
  | 'assignment'           // Assignment due reminders
  | 'certification'        // Exam deadlines, eligibility
  | 'exam-readiness'        // Practice exam scores, weak areas
  | 'community'            // Discussion replies, mentions
  | 'instructor'            // Feedback, announcements
  | 'achievement'          // Badges, milestones
  | 'streak'               // Streak warnings, reminders
  | 'progress'             // Course completion milestones
  | 'apprenticeship'       // OJL hours, employer evaluations
  | 'system';              // Maintenance, updates
```

### Notification Triggers

| Type | Trigger | Template |
|------|---------|----------|
| Assignment Reminder | Due in 24h, 1h | "Assignment due: {title}" |
| Certification Deadline | 30d, 7d, 1d before | "Exam in {days} days: {cert}" |
| Exam Readiness | Score drop, new weak area | "Focus on: {domain}" |
| Community Reply | New reply to post | "{user} replied to your question" |
| Instructor Feedback | Feedback on submission | "Feedback on {lesson}" |
| Badge Earned | Badge criteria met | "You earned: {badge}" |
| Streak Warning | No activity in 20h | "Keep your {count} day streak!" |
| OJL Hours | Hours milestone | "You've completed {hours} OJL hours" |
| Employer Evaluation | Evaluation due | "Evaluation due: {date}" |

---

## Community

### Discussion Board
```typescript
interface DiscussionBoard {
  courseId: string;
  moduleSlug?: string;
  lessonSlug?: string;
  threads: DiscussionThread[];
}

interface DiscussionThread {
  id: string;
  type: 'question' | 'discussion' | 'tips' | 'success-story' | 'resources';
  title: string;
  body: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  tags: string[];
  replyCount: number;
  viewCount: number;
  upvotes: number;
  lastActivityAt: Date;
  lastReplyAt?: Date;
}

interface Reply {
  id: string;
  threadId: string;
  parentReplyId?: string;
  body: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  isInstructorReply: boolean;
  isAcceptedAnswer: boolean;
}
```

### Study Groups
```typescript
interface StudyGroup {
  id: string;
  courseId: string;
  name: string;
  description: string;
  leaderId: string;
  memberIds: string[];
  maxMembers: number;
  isPublic: boolean;
  meetingSchedule?: {
    dayOfWeek: number;
    time: string;
    timezone: string;
    location?: string;
    virtualLink?: string;
  };
  goals: string[];
  currentTopic?: string;
  progress: number;
  createdAt: Date;
}
```

### Announcements
```typescript
interface Announcement {
  id: string;
  courseId: string;
  authorId: string;
  authorType: 'instructor' | 'admin';
  title: string;
  body: string;
  priority: 'info' | 'important' | 'urgent';
  isPinned: boolean;
  allowComments: boolean;
  createdAt: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}
```

---

## Certification Prep

### Practice Tests
```typescript
interface PracticeTest {
  id: string;
  certificationId: string;
  title: string;
  type: 'full' | 'domain' | 'weak-area' | 'timed' | 'review';
  questionCount: number;
  timeLimit?: number;
  domains: { domainKey: string; questionCount: number }[];
  passingScore: number;
  questions: PracticeQuestion[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanations: boolean;
  showCorrectAnswers: boolean;
}

interface PracticeQuestion {
  id: string;
  domainKey: string;
  question: string;
  imageUrl?: string;
  options: { id: string; text: string; imageUrl?: string }[];
  correctOptionId: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  references?: { title: string; url: string }[];
}
```

### Domain-Based Exams
```typescript
interface DomainExam {
  id: string;
  certificationId: string;
  domainKey: string;
  domainName: string;
  questionCount: number;
  passingScore: number;
  timeLimit: number;
  questions: PracticeQuestion[];
  weight: number; // % of total exam
}
```

### Weak Area Detection
```typescript
interface WeakAreaAnalysis {
  learnerId: string;
  certificationId: string;
  analysisDate: Date;
  overallScore: number;
  domainScores: {
    domainKey: string;
    score: number;
    questionsTotal: number;
    questionsCorrect: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  weakDomains: string[];
  recommendedResources: {
    domainKey: string;
    lessonSlugs: string[];
    practiceExamId?: string;
    simulationId?: string;
  }[];
  estimatedReadinessDate?: Date;
}
```

### Remediation Plans
```typescript
interface RemediationPlan {
  id: string;
  learnerId: string;
  certificationId: string;
  createdAt: Date;
  targetDate: Date;
  focusAreas: FocusArea[];
  milestones: Milestone[];
  status: 'active' | 'completed' | 'abandoned';
}

interface FocusArea {
  domainKey: string;
  currentScore: number;
  targetScore: number;
  activities: {
    type: 'lesson' | 'practice-exam' | 'simulation' | 'flashcard' | 'tutor';
    sourceId: string;
    completed: boolean;
    impact: number;
  }[];
}

interface Milestone {
  id: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'missed';
}
```

---

## Mobile Support

### Responsive Breakpoints
```typescript
const BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;
```

### Mobile Optimizations

| Feature | Mobile Adaptation |
|---------|-------------------|
| Knowledge Checks | Larger tap targets, swipe navigation |
| Flashcards | Tap to flip, swipe for next |
| Drag-Drop | Touch-drag with guides |
| Video | Fullscreen, gesture controls |
| Simulations | Simplified interface, larger buttons |
| Progress | Collapsible panels, bottom nav |

### Offline Support
```typescript
interface MobileContent {
  lessonId: string;
  downloadable: boolean;
  downloadSize: number;
  offlineAvailable: boolean;
  lastSynced?: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}
```

---

## Instructor Resources

### Lesson Plans
```typescript
interface InstructorLessonPlan {
  lessonSlug: string;
  lessonTitle: string;
  duration: number;
  objectives: string[];
  prerequisites: string[];
  materials: string[];
  preparation: string;
  activities: {
    name: string;
    duration: number;
    type: 'lecture' | 'discussion' | 'activity' | 'lab' | 'assessment';
    description: string;
  }[];
  discussionPrompts: string[];
  commonMistakes: string[];
  accommodations: string[];
  assessmentStrategies: string[];
}
```

### Answer Keys
```typescript
interface AnswerKey {
  quizId: string;
  questions: {
    questionId: string;
    correctAnswer: number | string;
    rubric?: string;
    partialCredit?: boolean;
  }[];
  gradingNotes?: string;
}
```

### Rubrics
```typescript
interface Rubric {
  id: string;
  name: string;
  criteria: {
    name: string;
    weight: number;
    levels: {
      score: number;
      label: string;
      description: string;
    }[];
  }[];
  totalPoints: number;
}
```

### Lab Guides
```typescript
interface LabGuide {
  id: string;
  title: string;
  moduleSlug: string;
  objectives: string[];
  equipment: string[];
  safetyNotes: string[];
  procedure: {
    step: number;
    instruction: string;
    imageUrl?: string;
    timeEstimate?: number;
  }[];
  worksheetUrl?: string;
  signoffRequired: boolean;
}
```

### Observation Checklists
```typescript
interface ObservationChecklist {
  id: string;
  skillKey: string;
  skillName: string;
  items: {
    id: string;
    description: string;
    criteria: string;
    observed: boolean;
    notes?: string;
  }[];
  overallRating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  observerSignature: string;
  date: Date;
}
```

---

## Industry Pathways

### Career Pathway
```typescript
interface CareerPathway {
  id: string;
  sector: string;
  title: string;
  credentials: PathwayCredential[];
}

interface PathwayCredential {
  credentialId: string;
  name: string;
  type: 'certificate' | 'license' | 'degree' | 'badge';
  description: string;
  requiredCourses: string[];
  estimatedTime: string;
  cost: number;
  prerequisites: string[];
  nextCredential?: string;
  jobs: {
    title: string;
    medianSalary: string;
    growthOutlook: 'growing' | 'stable' | 'declining';
    jobPostings: number;
  }[];
  employers: {
    name: string;
    hiring: boolean;
    logoUrl?: string;
  }[];
}
```

### Pathway Display
```
┌─────────────────────────────────────────────────────────┐
│ Career Path: Barber → Master Barber                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│    Licensed Barber (Entry)                              │
│    💰 $35,000 - $55,000/yr                            │
│    ↓                                                    │
│    Senior Barber                                        │
│    💰 $45,000 - $65,000/yr                            │
│    ↓                                                    │
│    Master Barber / Shop Manager                         │
│    💰 $55,000 - $80,000/yr                            │
│    ↓                                                    │
│    Salon Owner / Franchise                              │
│    💰 $70,000 - $150,000/yr                           │
│                                                         │
│ Next Program: Business Management Certificate          │
│                                                         │
│ [Explore Pathway]  [Find Jobs]  [Get Started]         │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema Extensions

### Tables Required

```sql
-- Core course generation tracking
CREATE TABLE course_generations (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  blueprint_id UUID REFERENCES blueprints(id),
  generated_at TIMESTAMPTZ,
  status TEXT,
  outputs JSONB
);

-- Interaction instances
CREATE TABLE lesson_interactions (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  interaction_type TEXT,
  interaction_data JSONB,
  position INTEGER
);

-- Learner interaction progress
CREATE TABLE interaction_progress (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES learners(id),
  interaction_id UUID REFERENCES lesson_interactions(id),
  completed BOOLEAN,
  score INTEGER,
  attempts INTEGER,
  completed_at TIMESTAMPTZ
);

-- Flashcard decks
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id),
  cards JSONB
);

-- Flashcard review history
CREATE TABLE flashcard_reviews (
  id UUID PRIMARY KEY,
  card_id UUID,
  learner_id UUID REFERENCES learners(id),
  quality INTEGER,
  reviewed_at TIMESTAMPTZ
);

-- Apprenticeship tracking
CREATE TABLE apprenticeship_progress (
  id UUID PRIMARY KEY,
  apprentice_id UUID REFERENCES learners(id),
  program_id UUID REFERENCES programs(id),
  rti_hours_completed DECIMAL,
  ojl_hours_completed DECIMAL,
  competencies_verified JSONB
);

-- Competency verification
CREATE TABLE competency_verifications (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES learners(id),
  competency_key TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  evidence JSONB
);

-- Practice exam attempts
CREATE TABLE practice_exam_attempts (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES learners(id),
  exam_id UUID,
  attempt_number INTEGER,
  score INTEGER,
  answers JSONB,
  completed_at TIMESTAMPTZ
);

-- Discussion threads
CREATE TABLE discussion_threads (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  author_id UUID,
  title TEXT,
  body TEXT,
  type TEXT,
  created_at TIMESTAMPTZ
);

-- Study groups
CREATE TABLE study_groups (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  name TEXT,
  leader_id UUID,
  member_ids UUID[]
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  learner_id UUID REFERENCES learners(id),
  type TEXT,
  title TEXT,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

---

## API Endpoints

### Course Generation
```
POST /api/courses/generate
  Body: { programSlug, options }
  Response: { courseId, modules[], lessons[], interactions[] }

POST /api/courses/[courseId]/regenerate-interactions
  Response: { interactions[] }
```

### Learner Progress
```
GET /api/learners/[id]/progress
GET /api/learners/[id]/competencies
GET /api/learners/[id]/certifications
```

### Interactions
```
GET /api/lessons/[slug]/interactions
POST /api/interactions/[id]/complete
POST /api/interactions/[id]/attempt
```

### Flashcards
```
GET /api/learners/[id]/flashcards?deckId=xxx
POST /api/flashcards/[id]/review
```

### Apprenticeship
```
GET /api/apprentices/[id]/hours
POST /api/apprentices/[id]/verify-competency
GET /api/apprentices/[id]/employer-evaluations
```

### Community
```
GET /api/courses/[id]/discussions
POST /api/discussions
POST /api/discussions/[id]/replies
POST /api/courses/[id]/study-groups
```

### Notifications
```
GET /api/learners/[id]/notifications
PATCH /api/notifications/[id]/read
```

### Certification
```
GET /api/learners/[id]/certifications/[certId]/readiness
GET /api/certifications/[id]/practice-exams
POST /api/practice-exams/[id]/submit
```

---

## Success Criteria

Course Factory 2.0 is complete when:

- [ ] All 6 apprenticeship programs generate with full apprenticeship support
- [ ] Every lesson includes at least 2 knowledge checks
- [ ] Every module generates flashcards from key terms
- [ ] Every course includes practice exams per certification
- [ ] Progress tracking updates in real-time
- [ ] Notifications trigger for all specified events
- [ ] Discussion boards functional per course
- [ ] Mobile-responsive for all interaction types
- [ ] Instructor resources auto-generated per lesson
- [ ] Career pathways displayed on course pages
- [ ] RAPIDS reporting fields populated correctly

---

## Implementation Phases

### Phase 1: Core Generation (Week 1-2)
- [ ] Update Course Factory to generate all interaction types
- [ ] Create flashcard generation from lesson content
- [ ] Generate knowledge checks automatically

### Phase 2: Assessments (Week 3-4)
- [ ] Practice exam generation
- [ ] Domain-based exam generation
- [ ] Remediation plan generation

### Phase 3: Apprenticeship (Week 5-6)
- [ ] RTI/OJL hour tracking
- [ ] Competency verification workflow
- [ ] Employer evaluation forms
- [ ] RAPIDS reporting integration

### Phase 4: Community & Notifications (Week 7-8)
- [ ] Discussion board infrastructure
- [ ] Study group management
- [ ] Notification triggers and delivery

### Phase 5: Mobile & Instructor (Week 9-10)
- [ ] Responsive interaction components
- [ ] Lesson plan auto-generation
- [ ] Instructor dashboard

### Phase 6: Career Pathways (Week 11-12)
- [ ] Pathway data structure
- [ ] Career widget on course pages
- [ ] Job integration (optional)
