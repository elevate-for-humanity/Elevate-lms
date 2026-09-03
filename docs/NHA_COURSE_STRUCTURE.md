# NHA-Style Course Structure for Elevate LMS

## Current LMS Lesson Types

| Type | NHA Equivalent | Status |
|------|---------------|--------|
| `reading` | Interactive Content/Lessons | ✅ |
| `video` | Videos | ✅ |
| `quiz` | Knowledge Checks | ✅ |
| `checkpoint` | Module Quizzes | ✅ |
| `final_exam` | Certification Exam | ✅ |
| `lab` | Skills Practice | ✅ |
| `simulation` | Case Studies/Simulations | ✅ |
| `assignment` | Practice Activities | ✅ |
| `practicum` | Clinical Hours | ✅ |
| `certification` | Completion Screen | ✅ |

## NHA Course Template Structure

```
Course: [NHA Exam Title]
├── Welcome Module (Module 0)
│   ├── Welcome Video
│   ├── Course Overview
│   ├── How to Use This Course
│   └── Pre-Assessment (optional)
│
├── Module 1: [Topic Name]
│   ├── Learning Objectives (3-5 objectives)
│   ├── Interactive Lesson Content
│   ├── Video Demonstration
│   ├── Case Study
│   ├── Practice Activity
│   ├── Knowledge Check (5 questions)
│   └── End-of-Module Quiz (10 questions)
│
├── Module 2: [Topic Name]
│   ├── [Same structure]
│   └── Checkpoint (after Module 2)
│
├── Module 3: [Topic Name]
│   ├── [Same structure]
│   └── Checkpoint (after Module 3)
│
├── Module 4: [Topic Name]
│   ├── [Same structure]
│   └── Checkpoint (after Module 4)
│
├── Module 5: [Topic Name]
│   └── [Same structure, no checkpoint]
│
├── Practice Assessment
│   ├── Full-length practice test
│   ├── 6 attempts allowed
│   └── Immediate feedback
│
├── Focused Review
│   ├── Weak areas highlighted
│   ├── Targeted lessons
│   └── Personalized study plan
│
├── Readiness Report
│   ├── Domain-by-domain scores
│   ├── Pass probability
│   └── Time recommendation
│
└── Certification Exam
    ├── Scheduled exam link
    └── Exam tips
```

## Medical Assistant (CCMA) Course - 13 Modules

| Module | Title | Lessons |
|--------|-------|---------|
| 1 | Introduction to Medical Assisting | 4 |
| 2 | Medical Terminology | 4 |
| 3 | Anatomy & Physiology | 4 |
| 4 | Pharmacology | 4 |
| 5 | Administrative Medical Assisting | 4 |
| 6 | Clinical Medical Assisting | 4 |
| 7 | Patient Assessment | 4 |
| 8 | Medical Laboratory Procedures | 4 |
| 9 | Electrocardiography | 4 |
| 10 | Radiology Basics | 4 |
| 11 | Medical Law & Ethics | 4 |
| 12 | Patient Communication | 4 |
| 13 | Emergency Procedures | 4 |

**Total: 52 lessons + 3 checkpoints + 1 final exam = 56 items**

## Medical Terminology - 25 Modules

| Module | Topic |
|--------|-------|
| 1-5 | Basic Word Structure, Prefixes, Suffixes |
| 6-10 | Body Systems (Integumentary, Skeletal, Muscular) |
| 11-15 | Body Systems (Cardiovascular, Blood, Lymphatic) |
| 16-20 | Body Systems (Respiratory, Digestive, Nervous) |
| 21-25 | Body Systems (Urinary, Endocrine, Reproductive) + Final Review |

## Phlebotomy (NHA CPT) - 10 Modules

| Module | Title |
|--------|-------|
| 1 | Introduction to Phlebotomy |
| 2 | Safety and Infection Control |
| 3 | Legal Issues in Phlebotomy |
| 4 | Anatomy and Physiology |
| 5 | Blood Collection Equipment |
| 6 | Venipuncture Techniques |
| 7 | Capillary Puncture |
| 8 | Specimen Handling |
| 9 | Complications and Error Prevention |
| 10 | Professional Development |

## Implementation Checklist

### Phase 1: Course Builder Enhancement
- [x] AI Course Generator - generates 5 modules x 4 lessons
- [x] Quiz generation
- [x] Checkpoint generation
- [ ] Support for 13+ modules (Medical Assistant)
- [ ] Support for 25 modules (Medical Terminology)
- [ ] Module-level configuration

### Phase 2: Student Experience
- [x] Module navigation
- [x] Progress tracking
- [x] Quiz attempts
- [ ] Flashcards system
- [ ] Practice assessment (6 attempts)
- [ ] Personalized remediation

### Phase 3: Analytics
- [ ] Readiness report
- [ ] Domain score breakdown
- [ ] Pass probability
- [ ] Time-to-completion estimates

## API Endpoints Needed

```
GET  /api/courses/[id]/readiness-report
POST /api/courses/[id]/focused-review
GET  /api/courses/[id]/practice-attempts
POST /api/courses/[id]/flashcards/generate
GET  /api/courses/[id]/flashcards/[cardId]
POST /api/courses/[id]/flashcards/[cardId]/rate
```

## Database Tables Needed

```sql
-- Practice attempts tracking
CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY,
  user_id UUID,
  course_id UUID,
  attempt_number INT,
  score DECIMAL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  domain_scores JSONB
);

-- Flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY,
  course_id UUID,
  lesson_id UUID,
  front TEXT,
  back TEXT,
  difficulty INT DEFAULT 1,
  times_shown INT DEFAULT 0,
  times_correct INT DEFAULT 0
);

-- User flashcard progress
CREATE TABLE flashcard_progress (
  id UUID PRIMARY KEY,
  user_id UUID,
  flashcard_id UUID,
  rating INT, -- 1-5 (Spaced repetition)
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ
);

-- Readiness reports
CREATE TABLE readiness_reports (
  id UUID PRIMARY KEY,
  user_id UUID,
  course_id UUID,
  overall_score DECIMAL,
  pass_probability DECIMAL,
  domain_breakdown JSONB,
  recommendations JSONB,
  generated_at TIMESTAMPTZ
);
```

## AI Prompts for NHA Courses

### CCMA Course Prompt
```
Create a National Healthcareer Association (NHA) Certified Clinical 
Medical Assistant (CCMA) exam prep course aligned with NHA test plan.

Include:
- 13 modules matching NHA CCMA domains
- NHA-style questions
- Clinical case studies
- Step-by-step procedures
- 6 practice exam attempts
- Domain-based readiness report
```

### Phlebotomy Course Prompt
```
Create an NHA Certified Phlebotomy Technician (CPT) exam prep course.
Align with NHA CPT test plan domains:
- Safety and Compliance (15%)
- Quality and Professionalism (10%)
- Patient Care (35%)
- Procedure/Specimen Handling (40%)

Include venipuncture techniques, complications, and safety protocols.
```