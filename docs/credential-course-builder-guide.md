# Course Builder - Credential Mode

## What Needs to Change

The course builder currently only generates **barber courses**. To generate **credential courses** (like EPA 608), these changes are needed:

---

## 1. ADD CREDENTIAL PROMPTS

### Current State:
```
scripts/course-builder/generate-lesson-content.ts
├── buildContentPrompt()     ← ONLY has barber prompt
├── buildQuizPrompt()        ← ONLY has barber prompt  
├── buildFlashcardPrompt()   ← ONLY has barber prompt
└── buildProcedurePrompt()   ← ONLY has barber prompt
```

### What to Add:

```typescript
// NEW: Credential course prompts

function buildCredentialContentPrompt(lesson: LessonSeed): string {
  return `You are writing exam prep content for the EPA 608 ${lesson.domain} certification exam.

LESSON: "${lesson.title}"
CERTIFICATION: EPA 608 Universal
EXAM DOMAIN: ${lesson.domain} (Core | Type I | Type II | Type III)
EXAM BLUEPRINT: ESCO Institute EPA 608 Preparatory Manual

Write 900-1100 words covering:
- EXACTLY what will be tested on the ${lesson.domain} exam
- Critical numbers/percentages students MUST memorize
- Common mistakes students make on this topic
- How to answer this type of question on the test

Key rules:
- Content must help students PASS the EPA 608 exam
- Include the specific regulation/citation if applicable
- Include the exact number or percentage when relevant
- End with exam tip: "Students often miss this question because..."
`;
}

function buildCredentialQuizPrompt(lesson: LessonSeed): string {
  return `You are writing EPA 608 exam practice questions.
  
LESSON: "${lesson.title}"
EXAM DOMAIN: ${lesson.domain}
CERTIFICATION: EPA 608 Universal (ESCO Institute)

Generate exactly 20 questions matching ESCO exam style:
- 10 factual recall (definitions, rules, numbers)
- 7 scenario-based ("A technician is servicing a...")
- 3 calculation ("If a system has X lbs and you need 90% recovery...")

CRITICAL: Questions must be similar to actual ESCO EPA 608 exam questions.
Include the exact number in the answer for calculation questions.
`;
}
```

---

## 2. ADD CREDENTIAL COURSE CONFIG

### Current State:
```typescript
// Only barber domain weights exist
const DOMAIN_WEIGHTS: Record<string, string> = {
  SAFETY_SANITATION: '25% of Indiana barber written exam',
  // ...
};
```

### What to Add:

```typescript
// EPA 608 Domain weights
const EPA608_DOMAIN_WEIGHTS: Record<string, string> = {
  core: '25 questions on EPA 608 Universal exam',
  type1: '25 questions (small appliances, ≤5 lbs)',
  type2: '25 questions (high-pressure systems)',
  type3: '25 questions (low-pressure systems)',
};

// Critical numbers for EPA 608
const EPA608_CRITICAL_NUMBERS = {
  finePerDay: '$44,539',
  type1Newer: '90% recovery',
  type1Older: '80% recovery',
  type2VacuumMicrons: '500 microns',
  type3VacuumMmHg: '25 mm Hg absolute',
  cylinderFillMax: '80%',
  recordRetention: '3 years',
  leakRateComfort: '30% per year',
  leakRateCommercial: '20% per year',
  repairTimeline: '30 days',
};
```

---

## 3. ADD CREDENTIAL MODE FLAG

### Current State:
```typescript
// Only imports barber course
import { barberCourse } from './seeds/barber-course.seed';
```

### What to Add:

```typescript
// Course type detection
type CourseType = 'barber' | 'epa608' | 'hvac' | 'generic';

function getCourseType(programSlug: string): CourseType {
  if (programSlug.includes('barber')) return 'barber';
  if (programSlug.includes('epa608') || programSlug.includes('hvac')) return 'epa608';
  return 'generic';
}

// Use different prompts based on course type
function buildContentPrompt(lesson: LessonSeed, courseType: CourseType): string {
  switch (courseType) {
    case 'epa608':
      return buildCredentialContentPrompt(lesson);
    case 'barber':
      return buildBarberContentPrompt(lesson); // existing
    default:
      return buildGenericContentPrompt(lesson);
  }
}
```

---

## 4. ADD EXAM BLUEPRINT INTEGRATION

### Current State:
```typescript
// No connection to actual exam blueprints
```

### What to Add:

```typescript
// Exam blueprints
const EXAM_BLUEPRINTS = {
  epa608universal: {
    name: 'EPA 608 Universal',
    provider: 'ESCO Institute',
    questions: 100,
    sections: [
      { name: 'Core', questions: 25, passingScore: 70 },
      { name: 'Type I', questions: 25, passingScore: 70 },
      { name: 'Type II', questions: 25, passingScore: 70 },
      { name: 'Type III', questions: 25, passingScore: 70 },
    ],
    topics: loadJson('hvac-epa608-prep.json'),
  },
  // Add more certifications here
};

// Generate questions from blueprint
function generateFromBlueprint(blueprint: ExamBlueprint, domain: string) {
  const domainTopics = blueprint.topics.filter(t => t.section === domain);
  return domainTopics.map(topic => ({
    title: topic.title,
    content: topic.content,
    examTip: `High priority - ${topic.examWeight}`,
    keyNumbers: topic.keyFacts.filter(f => /\d/.test(f)),
  }));
}
```

---

## 5. GENERATE PRACTICE EXAMS

### What to Add:

```typescript
// Auto-generate practice exam from blueprint
async function generatePracticeExam(courseType: CourseType, domains: string[]) {
  const questions = [];
  
  for (const domain of domains) {
    // Get topic questions from blueprint
    const topicQuestions = await generateFromBlueprint(
      EXAM_BLUEPRINTS[courseType],
      domain
    );
    questions.push(...topicQuestions);
  }
  
  // Shuffle and format as practice exam
  return shuffle(questions).slice(0, 100); // 100 question exam
}
```

---

## FILES TO MODIFY

| File | Change |
|------|--------|
| `scripts/course-builder/generate-lesson-content.ts` | Add credential prompts |
| `scripts/course-builder/course-types.ts` | Add course type config |
| `scripts/course-builder/exam-blueprints.ts` | Add exam blueprints |
| `public/data/hvac-epa608-prep.json` | Already exists - use it |
| `lib/courses/hvac-epa608-prep.ts` | Already exists - use it |

---

## QUICK FIX: Add EPA 608 to Existing System

```typescript
// In generate-lesson-content.ts, add:

const EPA608_PROMPTS = {
  content: `You are writing EPA 608 Universal certification exam prep.
  
CERTIFICATION: EPA 608 Universal (ESCO Institute)
EXAM: 100 questions, 25 per section, 70% to pass each

Write content that:
- Explains exactly what will be tested
- Includes critical numbers students must memorize
- Has exam tips: "Students miss this because..."
- Uses the exact regulation language from Section 608`,

  quiz: `Write EPA 608 practice questions matching ESCO exam style.
  
Must include:
- Recovery percentage questions (90%/80%/0%)
- Vacuum level questions (500 microns, 25 mm Hg)
- Leak rate calculation questions
- CFC/HCFC/HFC/HFO identification questions
- Fine amount questions ($44,539/day)`,
};

// Modify main() to detect EPA 608 and use EPA608_PROMPTS
```

---

## SUMMARY

| Current Problem | Fix |
|----------------|-----|
| Only barber prompts exist | Add credential prompts |
| No exam blueprint integration | Connect to `hvac-epa608-prep.json` |
| Generic course output | Add course type detection |
| No practice exam generation | Add exam generator |
| Questions not ESCO-aligned | Add ESCO question style to prompts |

**The infrastructure exists. The prompts just need to be added.**
