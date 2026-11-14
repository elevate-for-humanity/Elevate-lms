# Course Builder: Complete Specification

## Platform Vision

Transform Elevate courses from a content library into a **comprehensive interactive learning platform** with:

- **NHA-style engagement** (interactions, scenarios, simulations)
- **Certification preparation** aligned to industry exams
- **Community learning** with discussions and peer support
- **Progress tracking** with gamification and notifications
- **Mobile access** for learning anywhere
- **Stackable credentials** for career pathways

---

## Core Features

### 1. Interactive Simulations

**Purpose**: Hands-on practice in a safe, virtual environment

**Types**:
- Step-by-step procedures
- Troubleshooting trees
- Equipment operation
- Safety scenarios

**Examples by Program**:

| Program | Simulation |
|---------|------------|
| HVAC | Refrigerant recovery, troubleshooting paths, equipment operation |
| Barber | Haircut techniques, sanitation inspection, tool selection |
| CNA | Vital signs, patient care, documentation workflows |
| Esthetics | Skin analysis, product matching, treatment planning |
| CDL | Pre-trip inspection, backing procedures, road safety |
| Medical Assistant | Phlebotomy, EKG, patient intake |

**Properties**:
```typescript
interface VirtualSimulation {
  id: string;
  title: string;
  category: 'procedure' | 'troubleshooting' | 'equipment' | 'safety';
  duration: number;
  steps: SimulationStep[];
  competencies: string[];
  passingScore: number;
}
```

---

### 2. Practice Exams

**Purpose**: Certification readiness assessment

**Features**:
- Timed simulations of actual exam format
- Domain-based question distribution
- Detailed answer explanations
- Score tracking by topic
- Pass/fail prediction

**Exam Alignment**:
| Program | Certification | Exam Body |
|---------|--------------|-----------|
| HVAC | EPA 608 | EPA |
| CNA | Nurse Aide | State Board |
| Medical Assistant | CCMA | NHA |
| Barber | License | State Board |
| CDL | Class A/B CDL | DMV/FMCSA |
| Esthetics | License | State Board |
| Pharmacy Tech | CPhT | PTCB |

```typescript
interface PracticeExam {
  id: string;
  title: string;
  certificationExam: string;
  questionCount: number;
  timeLimit: number;
  domains: { name: string; weight: number }[];
  passingScore: number;
  questions: ExamQuestion[];
}
```

---

### 3. Certification Preparation

**Purpose**: Direct path to industry certification

**Components**:
- Exam content alignment
- Domain-by-domain review
- Key term flashcards
- Practice exams (above)
- Exam day preparation

**Certification Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│ Your Certification Path                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Target: EPA 608 Universal Certification                  │
│                                                         │
│ Progress: 75%                                           │
│ ███████████████████████░░░░░░░░░░░░░░░░░░░░░░          │
│                                                         │
│ Domains:                                               │
│ ✓ Core - 85%                                          │
│ ✓ Section 608 - 72%                                   │
│ ○ Leak Repair - Not started                            │
│ ○ Recovery Techniques - Not started                   │
│                                                         │
│ Next: Practice Exam #3 (Recommended)                   │
│ Practice Exam Average: 78% (Target: 80%)              │
│                                                         │
│ [Start Practice Exam]  [Review Weak Areas]             │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Mobile App Access

**Purpose**: Learn anywhere, anytime

**Features**:
- Offline content download
- Progress sync across devices
- Push notifications for reminders
- Quick practice mode
- Flashcard study
- Video streaming

**Mobile-Specific**:
```typescript
interface MobileOptimizedContent {
  lessonId: string;
  offlineAvailable: boolean;
  downloadSize: number;
  videoQuality: 'low' | 'medium' | 'high';
  estimatedReadTime: number;
  flashcardCount: number;
}
```

---

### 5. Community Discussions

**Purpose**: Peer learning and support

**Features**:
- Course-specific discussion boards
- Study groups
- Q&A with instructors
- Peer mentoring
- Success stories

**Discussion Types**:
```typescript
interface Discussion {
  id: string;
  type: 'question' | 'study-group' | 'tips' | 'success-story';
  courseId: string;
  moduleSlug?: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  isPinned: boolean;
  isResolved: boolean;
  replyCount: number;
  lastActivity: Date;
}

interface StudyGroup {
  id: string;
  courseId: string;
  name: string;
  description: string;
  members: string[];
  meetingSchedule?: string;
  goals: string[];
  progress: number;
}
```

**Community Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│ Community                                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🔥 Active Discussions (23)                            │
│ ├─ HVAC: EPA 608 Type II Question (5 replies)        │
│ ├─ CNA: Clinical Hours Help (12 replies)              │
│ └─ Barber: State Exam Tips (8 replies)               │
│                                                         │
│ 👥 Study Groups (7)                                    │
│ ├─ HVAC EPA Prep Group (12 members) ← Join           │
│ ├─ CNA Spring Cohort (8 members)                     │
│ └─ CDL Class A Training (5 members)                  │
│                                                         │
│ 🏆 Recent Achievements                                 │
│ └─ @student123 completed HVAC Module 3               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 6. Credentialing

**Purpose**: Track and display earned credentials

**Credential Types**:
- Course completion certificates
- Assessment badges
- Competency certifications
- Industry certifications
- Stackable credentials

```typescript
interface Credential {
  id: string;
  type: 'completion' | 'competency' | 'certification' | 'badge';
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  credentialUrl?: string;
  verificationCode?: string;
  badgeImage?: string;
  criteria: string[];
}
```

**Credential Wallet**:
```
┌─────────────────────────────────────────────────────────┐
│ Your Credentials                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🏆 Industry Certifications                              │
│ ├─ EPA 608 Universal - Issued Jan 2025                 │
│ ├─ CCMA - In Progress (68%)                           │
│ └─ CDL Class A - Not Started                          │
│                                                         │
│ 📜 Course Certificates                                  │
│ ├─ HVAC Fundamentals - Jan 2025                        │
│ ├─ Safety Essentials - Feb 2025                        │
│ └─ CNA Module 1-4 - Mar 2025                           │
│                                                         │
│ ⭐ Competency Badges                                   │
│ ├─ Refrigerant Handling ⭐⭐⭐                          │
│ ├─ Patient Safety ⭐⭐                                 │
│ └─ Equipment Diagnostics ⭐                            │
│                                                         │
│ [Share Credentials]  [Download PDF]  [Verify]          │
└─────────────────────────────────────────────────────────┘
```

---

### 7. Accreditation Support

**Purpose**: Ensure courses meet regulatory standards

**Features**:
- CEU tracking and reporting
- Accreditation documentation
- Audit preparation materials
- Compliance reporting

```typescript
interface AccreditationRecord {
  id: string;
  accreditationBody: string;
  accreditationNumber: string;
  validFrom: Date;
  validUntil: Date;
  ceuCredits: number;
  categories: string[];
  renewalRequirements: string[];
}
```

---

### 8. Instructor Resources

**Purpose**: Support instructors and administrators

**Resources**:
- Lesson plans and guides
- Discussion prompts
- Assessment answer keys
- Student progress dashboards
- Communication tools

```typescript
interface InstructorResources {
  lessonPlans: { moduleSlug: string; content: string }[];
  discussionPrompts: { lessonId: string; prompts: string[] }[];
  answerKeys: { quizId: string; answers: number[] }[];
  studentMetrics: {
    courseId: string;
    enrollmentCount: number;
    completionRate: number;
    averageScore: number;
    atRiskStudents: string[];
  };
}
```

**Instructor Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│ Instructor Portal                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📊 Course: HVAC Certification                           │
│ Enrolled: 45 | Completed: 32 | Avg Score: 78%         │
│                                                         │
│ ⚠️ At-Risk Students (3)                                │
│ ├─ @student15 - Missed Module 4                       │
│ ├─ @student22 - Quiz scores declining                 │
│ └─ @student31 - Last login 5 days ago                 │
│                                                         │
│ 📝 Pending Questions (7)                               │
│ └─ View all | Reply to recent                         │
│                                                         │
│ 📅 Upcoming Sessions                                   │
│ └─ Live Q&A: Friday 2pm                               │
└─────────────────────────────────────────────────────────┘
```

---

### 9. Lab Recommendations

**Purpose**: Connect online learning to hands-on practice

**Features**:
- Required lab hours per program
- Partner lab locations
- Virtual lab alternatives
- Lab completion tracking

```typescript
interface LabRequirement {
  programSlug: string;
  totalHours: number;
  completedHours: number;
  requiredSkills: string[];
  partnerLabs: {
    name: string;
    address: string;
    distance: number;
    availability: string[];
  }[];
  virtualAlternatives?: {
    name: string;
    type: 'simulation' | 'vr' | 'video';
    url: string;
    hoursCredit: number;
  }[];
}
```

**Lab Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│ Lab Requirements: CNA Program                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Required: 40 hours | Completed: 25 hours               │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░              │
│                                                         │
│ 📍 Partner Labs Near You                               │
│ ├─ Elevate Training Center (2.3 mi)                   │
│ │    Next available: Mon 9am, Wed 2pm                 │
│ └─ Community Health Center (5.1 mi)                   │
│      Next available: Tue 10am, Thu 3pm                 │
│                                                         │
│ 💻 Virtual Lab Alternatives                            │
│ ├─ Vital Signs Simulation (2 hrs)                     │
│ └─ Patient Care VR (4 hrs)                           │
│                                                         │
│ [Schedule Lab Session]  [Complete Virtual Lab]         │
└─────────────────────────────────────────────────────────┘
```

---

### 10. Stackable Credentials

**Purpose**: Build career pathways through micro-credentials

**Pathway Example - Healthcare**:
```
Entry Level
    ↓
CNA Certificate
    ↓
Phlebotomy Certificate → EKG Certificate → CCMA Certificate
    ↓
Medical Assistant Associate Degree
    ↓
LPN/RN Pathway
```

**Stackable Credential Structure**:
```typescript
interface StackablePathway {
  id: string;
  title: string;
  description: string;
  credentials: PathwayCredential[];
}

interface PathwayCredential {
  credentialId: string;
  name: string;
  type: 'certificate' | 'license' | 'degree';
  requiredCourses: string[];
  estimatedTime: string;
  cost: number;
  nextCredential?: string;
  prerequisites: string[];
}
```

**Career Pathway Dashboard**:
```
┌─────────────────────────────────────────────────────────┐
│ Your Career Pathway: Medical Assistant                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    RN License                           │
│                    ↑                                   │
│            ┌──────┴──────┐                            │
│            │  LPN Cert   │                            │
│            └──────┬──────┘                            │
│                    ↑                                   │
│            ┌──────┴──────┐                            │
│            │    CCMA     │ ← Current Goal             │
│            └──────┬──────┘                            │
│                    ↑                                   │
│            ┌──────┴──────┐                            │
│            │  Phlebotomy │ ✓ Complete                 │
│            └──────┬──────┘                            │
│                    ↑                                   │
│                 Start                                  │
│                                                         │
│ [View Full Pathway]  [Get Started]  [Learn More]      │
└─────────────────────────────────────────────────────────┘
```

---

### 11. Industry Pathways

**Purpose**: Connect learning to career outcomes

**Features**:
- Job posting integration
- Skill-to-job matching
- Career counseling resources
- Employer partnerships

```typescript
interface IndustryPathway {
  sector: string;
  jobTitles: {
    title: string;
    medianSalary: string;
    growthOutlook: string;
    requiredCredentials: string[];
    jobPostings: { source: string; url: string }[];
  }[];
  employerPartners: {
    name: string;
    hiring: boolean;
    logoUrl: string;
  }[];
}
```

---

## Progress Tracking & Notifications

### Progress Dashboard

```typescript
interface LearnerProgress {
  courseId: string;
  percentComplete: number;
  currentModule: number;
  totalModules: number;
  timeSpent: {
    total: number;
    thisWeek: number;
    lastActive: Date;
  };
  scores: {
    quizzes: number;
    exams: number;
    simulations: number;
  };
  competencyLevels: Record<string, number>;
  streak: {
    current: number;
    longest: number;
  };
  badges: Badge[];
}
```

**Progress Display**:
```
┌─────────────────────────────────────────────────────────┐
│ Your Progress                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ HVAC Certification                                     │
│ Module 4 of 8                                    67%   │
│ ████████████████████████████████░░░░░░░░░░░░░░░        │
│                                                         │
│ ⏱️ Time Spent: 12h 30m / 40h total                    │
│ 🔥 5 Day Streak! (Best: 12 days)                      │
│ ⭐ 850 XP                                               │
│                                                         │
│ 📊 This Week                                            │
│ ├─ Lessons: 4/5 completed                              │
│ ├─ Quiz Average: 82%                                   │
│ └─ Simulation: Passed (first try)                      │
│                                                         │
│ 🎯 Next Up: Module 5 - Refrigerant Handling            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Notifications

**Types**:
- Assignment due reminders
- Discussion replies
- Instructor messages
- Achievement unlocks
- Streak warnings
- Certification deadlines
- New content alerts

```typescript
interface Notification {
  id: string;
  type: 'reminder' | 'reply' | 'achievement' | 'message' | 'alert';
  title: string;
  body: string;
  actionUrl?: string;
  createdAt: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}
```

**Notification Center**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔔 Notifications (4 new)                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🏆 ACHIEVEMENT UNLOCKED                                │
│ "HVAC Expert - Module 4 Complete"                     │
│ 2 hours ago                                            │
│                                                         │
│ 💬 REPLY TO YOUR QUESTION                              │
│ @instructor_jane: "Great question! The key is..."     │
│ 5 hours ago                                            │
│                                                         │
│ ⏰ REMINDER                                            │
│ Practice Exam #2 due in 2 days                         │
│ 1 day ago                                              │
│                                                         │
│ 🔥 STREAK AT RISK                                      │
│ Complete a lesson today to keep your 5-day streak       │
│ 12 hours ago                                           │
│                                                         │
│ [Mark All Read]  [Notification Settings]               │
└─────────────────────────────────────────────────────────┘
```

---

## Knowledge Checks

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

**Properties**:
```typescript
interface KnowledgeCheck {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'sequence';
  question: string;
  options?: string[];
  correctAnswer: number | string | number[];
  explanation: string;
  points: number;
  feedbackLevel: 'immediate' | 'end' | 'none';
}
```

**Example (HVAC)**:
```json
{
  "type": "multiple-choice",
  "question": "What type of refrigerant is commonly used in residential AC systems?",
  "options": ["R-22", "R-410A", "R-12", "R-134a"],
  "correctAnswer": 1,
  "explanation": "R-410A is the most common refrigerant in modern residential systems due to its efficiency and lower environmental impact."
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
  imageUrl: string;
  width: number;
  height: number;
  hotspots: Hotspot[];
  completionType: 'all' | 'count';
  requiredCount?: number;
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
}
```

**Example (HVAC)**:
```json
{
  "title": "Identify the HVAC Components",
  "imageUrl": "/images/hvac/ac-system-diagram.webp",
  "hotspots": [
    { "label": "Condenser", "tooltip": "Click the condenser", "correctFeedback": "Correct! The condenser releases heat." },
    { "label": "Evaporator", "tooltip": "Click the evaporator", "correctFeedback": "Correct! The evaporator absorbs heat." },
    { "label": "Compressor", "tooltip": "Click the compressor", "correctFeedback": "Correct! The compressor circulates refrigerant." }
  ]
}
```

**Example (Medical)**:
```json
{
  "title": "Vital Signs Assessment",
  "imageUrl": "/images/medical/vitals-positions.webp",
  "hotspots": [
    { "label": "Blood Pressure Cuff", "tooltip": "Select proper blood pressure measurement position" },
    { "label": "Patient Arm", "tooltip": "Position patient's arm at heart level" },
    { "label": "Stethoscope", "tooltip": "Place stethoscope over brachial artery" }
  ]
}
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
  competencies: string[];
}

interface ScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
  consequence?: string;
  nextScenarioId?: string;
}
```

**Example (Barber)**:
```json
{
  "title": "Client Consultation Challenge",
  "context": "A new client arrives for their first haircut. They show you a photo but you're not sure they understand what they want.",
  "situation": "The client says 'I want it just like this' but the photo shows an extremely short cut.",
  "question": "What is your best approach?",
  "options": [
    {
      "text": "Ask clarifying questions about length and style preferences",
      "isCorrect": true,
      "feedback": "Excellent! Good consultation prevents misunderstandings."
    },
    {
      "text": "Just give them the haircut in the photo",
      "isCorrect": false,
      "feedback": "This could lead to an unhappy client if they don't understand the cut."
    },
    {
      "text": "Refuse to cut their hair",
      "isCorrect": false,
      "feedback": "While you should communicate concerns, outright refusal isn't professional."
    }
  ]
}
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
  type: 'match' | 'categorize' | 'sequence' | 'label';
  items: DragItem[];
  targets: DropTarget[];
  pairs?: { itemId: string; targetId: string }[];
  correctOrder?: string[];
  categories?: { id: string; name: string; items: string[] }[];
}

interface DragItem {
  id: string;
  content: string;
  imageUrl?: string;
}

interface DropTarget {
  id: string;
  content?: string;
  position: { x: number; y: number };
  accepts: string[];
}
```

**Example (HVAC - Match Refrigerants)**:
```json
{
  "title": "Match Refrigerants to Applications",
  "type": "match",
  "items": [
    { "id": "r410a", "content": "R-410A" },
    { "id": "r22", "content": "R-22" },
    { "id": "r134a", "content": "R-134a" },
    { "id": "r404a", "content": "R-404A" }
  ],
  "targets": [
    { "id": "residential", "content": "Residential AC" },
    { "id": "legacy", "content": "Legacy Systems" },
    { "id": "auto", "content": "Automotive" },
    { "id": "commercial", "content": "Commercial Refrigeration" }
  ],
  "pairs": [
    { "itemId": "r410a", "targetId": "residential" },
    { "itemId": "r22", "targetId": "legacy" },
    { "itemId": "r134a", "targetId": "auto" },
    { "itemId": "r404a", "targetId": "commercial" }
  ]
}
```

**Example (Medical - Match Terminology)**:
```json
{
  "title": "Medical Terminology: Body Systems",
  "type": "categorize",
  "categories": [
    { "name": "Cardiovascular", "items": ["Arrhythmia", "Atherosclerosis", "Tachycardia"] },
    { "name": "Respiratory", "items": ["Bronchitis", "Pneumonia", "Asthma"] },
    { "name": "Digestive", "items": ["Gastritis", "Colitis", "Hepatitis"] }
  ]
}
```

---

### 5. Virtual Simulations

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
  category: 'procedure' | 'troubleshooting' | 'equipment' | 'safety';
  duration: number;
  steps: SimulationStep[];
  competencies: string[];
  passingScore: number;
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
}

interface SimulationAction {
  type: 'click' | 'select' | 'sequence' | 'input' | 'swipe';
  targetId?: string;
  expectedSequence?: string[];
  validInputs?: string[];
}
```

**Example (CNA - Resident Care)**:
```json
{
  "title": "Proper Hand Hygiene Technique",
  "category": "procedure",
  "duration": 5,
  "steps": [
    {
      "instruction": "Turn on water and adjust temperature",
      "actionRequired": { "type": "click", "targetId": "faucet" },
      "feedback": {
        "correct": "Good! Water should be warm, not hot.",
        "incorrect": "Remember to wet your hands before applying soap."
      }
    },
    {
      "instruction": "Apply soap to hands",
      "actionRequired": { "type": "click", "targetId": "soap" },
      "feedback": {
        "correct": "Apply enough soap to cover all surfaces.",
        "incorrect": "You need soap to effectively clean your hands."
      }
    },
    {
      "instruction": "Scrub for at least 20 seconds. Rub hands together.",
      "actionRequired": { "type": "swipe" },
      "feedback": {
        "correct": "Great! 20 seconds of scrubbing ensures proper cleaning.",
        "incorrect": "Remember to scrub for at least 20 seconds."
      }
    }
  ]
}
```

**Example (HVAC - Troubleshooting)**:
```json
{
  "title": "AC Not Cooling: Troubleshooting Path",
  "category": "troubleshooting",
  "steps": [
    {
      "instruction": "The customer reports the AC is running but not cooling. What is your first check?",
      "actionRequired": {
        "type": "select",
        "validInputs": ["Check thermostat", "Check air filter", "Check refrigerant", "Call supervisor"]
      },
      "feedback": {
        "correct": "Always start with the basics - check the thermostat settings first.",
        "incorrect": "Before checking refrigerant levels, verify basic settings."
      }
    }
  ]
}
```

---

### 6. Progress Gamification

**Purpose**: Motivation and progress tracking

**Display Elements**:
```typescript
interface ProgressDisplay {
  currentModule: number;
  totalModules: number;
  percentComplete: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'proficient';
  xpPoints: number;
  badges: Badge[];
  streak: {
    current: number;
    longest: number;
  };
  timeSpent: {
    today: number;
    total: number;
  };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: Date;
  iconUrl: string;
}
```

**Module Progress Bar**:
```
┌─────────────────────────────────────────────────────────┐
│ Module 3 of 8                                    85%    │
│ ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│ Skill Level: Beginner → Intermediate → Advanced         │
│                    ↑ You are here                      │
│                                                         │
│ 🔥 5 Day Streak    ⭐ 450 XP    🏆 First Module         │
└─────────────────────────────────────────────────────────┘
```

---

### 7. AI Practice Coach

**Purpose**: On-demand help and tutoring

**Features**:
- Context-aware questions
- Personalized explanations
- Related concept linking
- Quiz generation

**API**:
```typescript
interface PracticeCoachRequest {
  studentId: string;
  courseId: string;
  moduleSlug: string;
  question: string;
  context: {
    currentLesson?: string;
    recentMistakes?: string[];
    competencyLevel?: Record<string, number>;
  };
}

interface PracticeCoachResponse {
  answer: string;
  relatedConcepts: string[];
  practiceProblems?: QuizQuestion[];
  confidence: number;
  sources: string[]; // Lesson URLs
}
```

**Example**:
```
Student: "Explain EPA 608 Type II certification"

Coach: "EPA 608 Type II certification covers the service of 
high-pressure appliances containing ≤5 lbs of refrigerant 
and low-pressure appliances.

Key differences from other types:
• Type I: Small cans (≤5 lbs) only
• Type II: Stationary AC/heat pump systems
• Type III:Chillers and high-pressure systems

Would you like me to explain when each certification is 
required, or generate some practice questions?"
```

---

### 8. Interactive Flashcards

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
}

interface FlashcardContent {
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
}
```

**Example**:
```
┌─────────────────────────────────────────┐
│                                         │
│    What is superheat?                   │
│                                         │
│                                         │
│    Tap to reveal                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│                                         │
│    The temperature increase above        │
│    saturation temperature.              │
│                                         │
│    Measured after the evaporator        │
│    in the refrigerant cycle.            │
│                                         │
│    [Again] [Hard] [Good] [Easy]         │
└─────────────────────────────────────────┘
```

**Generation Rule**: Auto-generated from lesson content:
- Key terms and definitions
- Procedures and steps
- Comparisons and contrasts
- Formulas and calculations

---

### 9. Video + Interaction

**Purpose**: Active viewing, not passive watching

**Pattern**:
```
[Video Segment] → [Question] → [Video Segment] → [Question] → ...
```

**Properties**:
```typescript
interface VideoInteraction {
  id: string;
  videoUrl: string;
  duration: number;
  segments: VideoSegment[];
  allowSkip: boolean;
  skipTimestamp?: number;
  completionCriteria: {
    watchedPercent: number;
    answeredCorrectly: number;
  };
}

interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  question?: KnowledgeCheck;
}
```

**Example**:
```
┌─────────────────────────────────────────┐
│                                         │
│  HVAC: Refrigerant Recovery            │
│  ▶ ━━━━━━━━━○                    1:45  │
│                                         │
│  [Pause]  [Speed: 1x ▼]  [CC]          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Watched 0:00 - 0:45                 │
│  ▶ Now: 0:45 - 1:15                     │
│  ○ 1:15 - 1:45                          │
│  ○ 1:45 - 2:30                          │
│                                         │
└─────────────────────────────────────────┘

[Question appears at 1:15]
┌─────────────────────────────────────────┐
│                                         │
│  What is the purpose of recovery        │
│  equipment in EPA 608?                  │
│                                         │
│  ○ To add refrigerant to the system     │
│  ● To remove refrigerant safely         │
│  ○ To increase system pressure          │
│  ○ To cool the compressor               │
│                                         │
└─────────────────────────────────────────┘
```

---

### 10. Competency-Based Learning

**Purpose**: Skills mastery, not just content completion

**Display**:
```
┌─────────────────────────────────────────────────────────┐
│ Competency Dashboard                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Skill: Refrigerant Recovery (EPA 608)                   │
│ ════════════════════════════════════════════════        │
│                                                         │
│ Current Mastery:     65%                                │
│ Target:              80%                                │
│ Time Spent:          2h 15m                              │
│ Attempts:            3                                  │
│                                                         │
│ Recent Activity:                                         │
│ • Quiz #2 - 70%  (2 days ago)                          │
│ • Lab Practice - Passed (3 days ago)                    │
│ • Quiz #1 - 55%  (5 days ago)                          │
│                                                         │
│ Recommended Next:                                        │
│ ▸ Practice: Recovery Procedures                         │
│ ▸ Review: Common Recovery Errors                        │
│ ▸ Watch: EPA 608 Type II Video                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Tracking**:
```typescript
interface CompetencyTracking {
  competencyKey: string;
  currentLevel: number; // 0-100
  targetLevel: number;
  touchpoints: Touchpoint[];
  barriers: string[];
  evidence: EvidenceRecord[];
}

interface Touchpoint {
  type: 'lesson' | 'quiz' | 'lab' | 'scenario' | 'practice';
  sourceId: string;
  score: number;
  timestamp: Date;
}
```

---

## Lesson Content Block Types

**Updated Lesson Structure**:
```typescript
interface EnrichedLesson {
  id: string;
  slug: string;
  title: string;
  
  // Core content
  objective: string;
  content: string; // HTML
  
  // NHA-style interactions (auto-generated or authored)
  blocks: LessonBlock[];
  
  // Knowledge checks (distributed throughout)
  knowledgeChecks: KnowledgeCheck[];
  
  // Embedded scenarios
  scenarios: InteractiveScenario[];
  
  // Flashcards for this lesson
  flashcards: Flashcard[];
  
  // Related resources
  resources: Resource[];
}

type LessonBlock = 
  | { type: 'text'; content: string }
  | { type: 'heading'; level: 2 | 3 | 4; content: string }
  | { type: 'knowledge-check'; question: KnowledgeCheck }
  | { type: 'click-to-reveal'; activity: ClickToReveal }
  | { type: 'drag-drop'; activity: DragAndDrop }
  | { type: 'scenario'; scenario: InteractiveScenario }
  | { type: 'video'; video: VideoInteraction }
  | { type: 'simulation'; simulation: VirtualSimulation }
  | { type: 'flashcard'; flashcard: Flashcard }
  | { type: 'key-term'; term: string; definition: string }
  | { type: 'tip'; content: string; type: 'warning' | 'note' | 'pro-tip' }
  | { type: 'image'; url: string; caption: string; alt: string }
  | { type: 'code-block'; language: string; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; ordered: boolean; items: string[] };
```

---

## Blueprint Integration

**Updated Blueprint Module Structure**:
```typescript
interface BlueprintModule {
  slug: string;
  title: string;
  
  // Existing fields
  orderIndex: number;
  domainKey: string;
  competencies: Competency[];
  
  // NHA-style additions
  interactionDensity: 'low' | 'medium' | 'high'; // Checks per lesson
  scenarioCount: number;
  simulationCount: number;
  
  lessons: BlueprintLesson[];
}

interface BlueprintLesson {
  slug: string;
  title: string;
  order: number;
  
  // Existing fields
  objective?: string;
  content?: string;
  quizQuestions?: QuizQuestion[];
  
  // NHA-style additions
  interactionSpecs: {
    includeKnowledgeChecks: boolean;
    includeScenarios: boolean;
    includeFlashcards: boolean;
    includeClickToReveal: boolean;
    includeDragDrop: boolean;
  };
  
  knowledgeCheckCount: number;
  hasSimulation: boolean;
  hasVideo: boolean;
  
  // Auto-generated content (populated by AI)
  generatedInteractions?: {
    knowledgeChecks: KnowledgeCheck[];
    flashcards: Flashcard[];
    scenarios: InteractiveScenario[];
  };
}
```

---

## Course Factory Enhancements

### New Generator Functions

```typescript
// Generate knowledge checks from lesson content
async function generateKnowledgeChecks(
  lesson: BlueprintLesson,
  count: number
): Promise<KnowledgeCheck[]>;

// Generate flashcards from lesson content
async function generateFlashcards(
  lesson: BlueprintLesson,
  count: number
): Promise<Flashcard[]>;

// Generate interactive scenarios from lesson content
async function generateScenario(
  lesson: BlueprintLesson,
  context: string
): Promise<InteractiveScenario>;

// Generate click-to-reveal activities
async function generateClickToReveal(
  lesson: BlueprintLesson,
  diagramUrl: string
): Promise<ClickToReveal>;

// Generate drag-and-drop activities
async function generateDragDrop(
  lesson: BlueprintLesson,
  type: 'match' | 'categorize' | 'sequence'
): Promise<DragAndDrop>;

// Enrich lesson with all interactions
async function enrichLessonWithInteractions(
  lesson: BlueprintLesson
): Promise<EnrichedLesson>;
```

### AI Coach Integration

```typescript
// Context-aware AI tutoring
async function askPracticeCoach(
  studentId: string,
  courseId: string,
  question: string
): Promise<PracticeCoachResponse>;

// Generate personalized practice problems
async function generatePersonalizedPractice(
  studentId: string,
  competencyGaps: string[]
): Promise<QuizQuestion[]>;
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Knowledge Check Engagement | 80% completion | Track interactions |
| Scenario Success Rate | 70% correct first try | Track attempts |
| Flashcard Retention | 85% recall at 7 days | Spaced repetition |
| Competency Mastery | 80% average | Final assessments |
| Video Completion | 95% with questions | Video + quiz |
| Practice Coach Usage | 2+ questions/session | Usage logs |

---

## Implementation Priority

1. **Phase 1 (Foundation)**
   - Knowledge checks (low friction, high impact)
   - Flashcards (auto-generation ready)
   - Progress display

2. **Phase 2 (Engagement)**
   - Interactive scenarios
   - Click-to-reveal activities
   - Video + questions

3. **Phase 3 (Advanced)**
   - Drag-and-drop
   - Virtual simulations
   - AI Practice Coach

4. **Phase 4 (Optimization)**
   - Spaced repetition tuning
   - Competency tracking refinement
   - Personalization engine
