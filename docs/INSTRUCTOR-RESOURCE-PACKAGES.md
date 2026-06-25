# Instructor Resource Packages

Every Elevate curriculum includes a complete instructor resource package. This document defines the required materials for each program.

---

## Package Components

### 1. Curriculum Overview

| Document | Description |
|----------|-------------|
| Program Overview | Description, objectives, career paths |
| Accreditation Mapping | How curriculum aligns to certifications |
| Technical Requirements | LMS, equipment, facilities needed |
| Pacing Guide | Suggested timeline for modules |

### 2. Lesson Plans

For each lesson:

| Component | Description |
|-----------|-------------|
| Lesson Plan | Detailed instructions, timing, activities |
| Learning Objectives | Measurable outcomes |
| Materials List | Required supplies, equipment, handouts |
| Preparation Steps | What instructor needs to do before class |
| Opening Hook | How to engage students |
| Direct Instruction | Lecture content, demos |
| Guided Practice | Activities with instructor support |
| Independent Practice | Student work time |
| Closing | Summary, preview next lesson |
| Assessment | How to evaluate understanding |
| Differentiation | Accommodations and extensions |
| Common Mistakes | What to watch for |

### 3. Assessment Materials

| Document | Description |
|----------|-------------|
| Answer Keys | Correct answers for all assessments |
| Rubrics | Criteria for evaluating performance |
| Discussion Questions | Socratic questions per module |
| Make-Up Work | How to handle absences |
| Extra Credit Options | Optional enrichment |

### 4. Practical/Lab Materials

| Document | Description |
|----------|-------------|
| Lab Guides | Step-by-step procedures |
| Skills Checklists | Competency verification forms |
| Safety Checklists | Safety compliance verification |
| Equipment Lists | Required tools per lab |
| Station Rotations | Lab setup diagrams |
| Grading Rubrics | Performance evaluation criteria |

### 5. Student-Facing Materials

| Document | Description |
|----------|-------------|
| Study Guides | Chapter summaries, key terms |
| Worksheets | Practice exercises |
| Vocabulary Lists | Key terms with definitions |
| Flashcards | Digital and printable |
| Practice Quizzes | Additional test prep |
| Competency Logs | Track skill completion |

### 6. Administrative Materials

| Document | Description |
|----------|-------------|
| Attendance Tracking | Rosters, sign-in sheets |
| Gradebook Templates | Excel/spreadsheet formats |
| Progress Reports | Student progress templates |
| Parent/Employer Communications | Sample letters |
| Program Completion Forms | Certificate requirements |

---

## Example: Barber Apprenticeship Instructor Package

### Module 1: Infection Control & Safety

#### Lesson 1: Introduction to Barbering

**Lesson Plan**:
```
LESSON PLAN: Introduction to Barbering
Time: 60 minutes
Class Size: 8-12 students

LEARNING OBJECTIVES:
✓ Describe the history of barbering in Indiana
✓ Explain the DOL apprenticeship structure
✓ Identify scope of practice for licensed barbers
✓ List required tools and equipment

MATERIALS:
- Tool kit demonstration set
- Sanitation station (setup guide)
- Indiana Barber Board reference materials
- Student workbooks

OPENING HOOK (10 min):
Show video: "History of Barbering" (3 min)
Discussion: "Why did you choose barbering?"

DIRECT INSTRUCTION (20 min):
- History and legal framework
- Apprenticeship pathway
- Scope of practice
- Tool identification demo

GUIDED PRACTICE (15 min):
- Tool identification activity
- Sanitation station layout
- Safety equipment review

INDEPENDENT PRACTICE (10 min):
- Reading comprehension worksheet
- Tool identification quiz

CLOSING (5 min):
- 3 key takeaways
- Preview: Sanitation procedures

ASSESSMENT:
- Exit ticket: 3 questions
- Tool identification quiz (Graded)

DIFFERENTIATION:
- Visual learners: Color-coded tool chart
- Kinesthetic learners: Hands-on tool handling
- Advanced: Research Indiana barber regulations
```

### Module 5: Shaving & Facial Hair

**Lab Guide**:
```
LAB GUIDE: Straight Razor Shaving
Time: 90 minutes
Prerequisites: Module 1, Module 3

LEARNING OBJECTIVE:
Students will demonstrate proper straight razor shaving technique
on a mannequin head with 80% accuracy per rubric.

EQUIPMENT NEEDED:
- Straight razor (5 per station)
- Leather strop
- Shaving brush
- Shaving cream
- Hot towel
- Mannequin heads (2 per station)
- Sanitation supplies

SETUP (15 min before class):
1. Sanitize all mannequins
2. Set up 6 stations with equipment
3. Warm towels (or prepare hot towel station)
4. Test water temperature

SAFETY BRIEFING:
- Never cut toward yourself
- Keep fingers away from blade
- Maintain 3-point contact
- Proper stropping technique

DEMONSTRATION (15 min):
1. Prep: Face shape analysis
2. Steam: Towel application
3. Lather: Circular brush motion
4. First pass: With grain
5. Second pass: Across grain
6. Third pass: Against grain (if needed)
7. Finish: After-shave application

STUDENT PRACTICE (45 min):
- Partner A practices (15 min)
- Partner B observes and notes
- Switch roles (15 min)
- Free practice (15 min)

GRADING CRITERIA:
✓ 80%+ accuracy on safety checklist
✓ Proper stropping technique
✓ Correct lathering motion
✓ All passes in correct direction
✓ Clean finished result
✓ Sanitation procedures followed

COMMON ERRORS:
- Pressing too hard
- Cutting toward face
- Skipping grain direction
- Insufficient lather
- Rushing the finish

MAKEUP PROCEDURE:
- Virtual simulation option
- Written reflection on technique
```

---

## Automated Generation

The Course Factory generates instructor resources from blueprint data:

```typescript
interface InstructorPackage {
  programSlug: string;
  version: string;
  generatedAt: Date;
  
  curriculumOverview: ProgramOverview;
  lessonPlans: LessonPlan[];
  assessmentKeys: AssessmentKey[];
  labGuides: LabGuide[];
  practicalRubrics: Rubric[];
  studentMaterials: StudentMaterial[];
  administrativeForms: Form[];
}

interface LessonPlan {
  lessonSlug: string;
  lessonTitle: string;
  moduleTitle: string;
  duration: number;
  objectives: string[];
  materials: string[];
  preparation: string[];
  activities: Activity[];
  assessment: string;
  commonMistakes: string[];
  accommodations: string[];
}

interface Activity {
  type: 'lecture' | 'discussion' | 'demo' | 'practice' | 'assessment';
  duration: number;
  description: string;
  instructorNotes?: string;
}
```

---

## White Label Configuration

White label packages include:

```typescript
interface WhiteLabelConfig {
  organizationName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  website: string;
  tagline?: string;
  accreditationBody?: string;
}
```

Output materials will include:
- Organization name and logo in headers
- Custom colors throughout
- Organization contact information
- Optional: Remove "Powered by Elevate" (Enterprise tier)

---

## Demo School Environment

Before selling curriculum, have a working demo:

```
demo.elevate.example/
├── /programs
│   ├── barber-apprenticeship
│   │   ├── overview
│   │   ├── curriculum (preview)
│   │   ├── sample-lesson
│   │   ├── instructor-preview (login)
│   │   └── student-preview (login)
│   └── building-services
│       └── ...
├── /curriculum-catalog
│   ├── list
│   ├── program-details
│   ├── licensing-options
│   └── inquiry-form
└── /contact
    └── sales@...
```

---

## Checklist

### For Each Program, Verify:

- [ ] All lessons have complete lesson plans
- [ ] All assessments have answer keys
- [ ] All labs have grading rubrics
- [ ] All practicals have checklists
- [ ] Student materials are ready (workbook, flashcards, etc.)
- [ ] Administrative forms are current
- [ ] Copyright notice on all materials
- [ ] Version number updated
- [ ] Demo environment functional
- [ ] Instructor training completed
