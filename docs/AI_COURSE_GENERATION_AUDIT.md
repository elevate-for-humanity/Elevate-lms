# AI Course Generation - Honest Operational Audit

**Date:** 2026-07-15  
**Question:** Can the current system generate 90-95% of a complete approval-oriented program from one structured prompt?

**Answer:** ❌ **PARTIAL** (Estimated 40-50% of required output)

---

## What the System CAN Generate

### 1. Course Structure ✅ EXISTS
- **Generator:** `lib/ai/course-generator.ts` + `lib/ai/generate-course-outline-fn.ts`
- **Output:** Course title, description, learning objectives, module/lesson structure
- **Validation:** Built-in JSON schema validation with 3-retry logic
- **Status:** WORKING - AI is called and returns structured data

### 2. Lesson Content ✅ EXISTS  
- **Generator:** `lib/ai/course-generator.ts`
- **Output:** Lesson body (200-400 words), key takeaways, reflection prompts
- **Status:** GENERATED - AI produces content

### 3. Quiz Questions ✅ EXISTS
- **Generator:** `lib/ai/course-generator.ts`
- **Output:** Multiple choice questions (4 options), correct answer, explanation
- **Status:** GENERATED - 2-3 questions per lesson

### 4. Competency Keys ✅ EXISTS
- **Generator:** Built into lesson output
- **Output:** kebab-case competency tags per lesson
- **Status:** GENERATED - 1-3 keys per lesson

### 5. Indiana Compliance ✅ EXISTS
- **Generator:** `lib/ai/indiana-compliance-map.ts`
- **Output:** State-specific compliance prompts for CNA/NATCEP
- **Status:** EXISTS - Compliance awareness built into generation

### 6. Canonical Persistence ✅ EXISTS
- **Service:** `lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts`
- **Writes to:** courses → course_modules → course_lessons → lms_lessons
- **Status:** EXISTS - Validates production completeness before writing

---

## What the System CANNOT Generate (Auto)

### 7. Instructor Lesson Plans ❌ MISSING
- **Required:** Detailed instructor guides with timing, activities, discussion prompts
- **Current:** Only generic reflection_prompt per lesson
- **Gap:** No structured instructor guide output

### 8. Student Workbooks ❌ MISSING
- **Required:** Student-facing worksheets, exercises, note-taking guides
- **Current:** Only lesson content (designed for instructor delivery)
- **Gap:** No student workbook generation

### 9. Slide Presentations ❌ MISSING
- **Required:** PowerPoint/Google Slides content
- **Current:** No slide generation capability
- **Gap:** Content exists but not in presentation format

### 10. Skills Checklists ❌ MISSING
- **Required:** Step-by-step competency verification forms
- **Current:** competency_keys exist but no checklist output
- **Gap:** No skills verification document generation

### 11. Practical/Rubric Assessments ❌ MISSING
- **Required:** Performance rubrics with criteria, points, descriptors
- **Current:** Only multiple choice quizzes
- **Gap:** No rubric/scoring guide generation

### 12. Lab Activities ❌ MISSING
- **Required:** Hands-on lab instructions with materials, steps, safety
- **Current:** lesson content is generic, not lab-specific
- **Gap:** No lab activity document generation

### 13. Clock-Hour Breakdown ❌ PARTIAL
- **Required:** Lecture/lab/clinical/externship hours per module
- **Current:** duration_minutes per lesson, no categorization
- **Gap:** No clock-hour reconciliation by activity type

### 14. Syllabus Document ❌ MISSING
- **Required:** Formal syllabus with policies, grading, attendance
- **Current:** course description and learning objectives
- **Gap:** No syllabus export format

### 15. Regulatory Crosswalk ❌ PARTIAL
- **Required:** Mapping of lessons to certification exam domains
- **Current:** Indiana compliance only, generic competency_keys
- **Gap:** Only for CNA/NATCEP, no other certifications

### 16. Approval Packet Export ❌ PARTIAL
- **Required:** PDF/DOCX package for state board submission
- **Current:** JSON export with counts only
- **Gap:** No document generation, no formatting

### 17. Version History ❌ MISSING
- **Required:** Track revisions, compare versions, rollback
- **Current:** No versioning on generated content
- **Gap:** No version tracking implementation

### 18. Instructor Guide ❌ MISSING
- **Required:** Complete instructor package with timing, materials, prep
- **Current:** Lesson content only
- **Gap:** No instructor-specific document generation

---

## Detailed Gap Analysis

### What Works End-to-End

```
Prompt: "Build a 120-hour hybrid Phlebotomy Technician program aligned with NHA CPT requirements"

✅ AI receives structured prompt
✅ AI returns valid JSON with course structure
✅ Lessons include title, content, objectives
✅ Quizzes generated with questions/answers
✅ Content saved to database
✅ Student can access via LMS
```

### What's Broken or Missing

```
❌ No instructor lesson plan output
❌ No student workbook generation  
❌ No slide presentation creation
❌ No skills checklist output
❌ No rubric/scoring guide output
❌ No lab activity documents
❌ No clock-hour categorization
❌ No syllabus export
❌ No regulatory crosswalk (outside Indiana)
❌ No approval packet PDF generation
❌ No version history tracking
```

---

## The Honest Verdict

| Output | Status | Evidence |
|--------|--------|----------|
| Program description | ✅ Generated | `lib/ai/course-generator.ts` |
| Program outcomes | ✅ Generated | `learning_objectives` array |
| Module/course sequence | ✅ Generated | `modules` + `lessons` arrays |
| Complete lessons | ✅ Generated | 200-400 words per lesson |
| Learning objectives | ✅ Generated | `summary_text` per lesson |
| Instructor lesson plans | ❌ Missing | No instructor guide output |
| Student content | ⚠️ Partial | Lesson content exists, no workbook |
| Presentations | ❌ Missing | No slide generation |
| Assignments/worksheets | ⚠️ Partial | Reflection prompts only |
| Quizzes/exams | ✅ Generated | Multiple choice with answers |
| Skills checklists | ❌ Missing | No checklist output |
| Practical rubrics | ❌ Missing | Multiple choice only, no rubric |
| Lab activities | ❌ Missing | Generic content, no lab docs |
| Clock-hour breakdown | ⚠️ Partial | Duration only, no categorization |
| Syllabus | ❌ Missing | No formal document export |
| Instructor guide | ❌ Missing | No instructor package |
| Student workbook | ❌ Missing | No student package |
| Regulatory crosswalk | ⚠️ Partial | Indiana only |
| Approval export | ⚠️ Partial | JSON only, no PDF |
| Version history | ❌ Missing | No tracking |

---

## Estimated Completeness

| Category | % Complete |
|----------|-----------|
| **Course Structure** | 95% |
| **Lesson Content** | 80% |
| **Assessments** | 60% |
| **Instructor Materials** | 10% |
| **Student Materials** | 15% |
| **Administrative Docs** | 5% |
| **Compliance Export** | 20% |

**Overall Estimate: 40-50% of a complete approval-oriented program**

---

## Root Cause

The AI generation engine (`lib/ai/course-generator.ts`) was designed for **lesson content generation**, not **complete curriculum package generation**.

The system can:
1. Generate lesson content ✅
2. Generate quizzes ✅
3. Map competencies ✅

The system cannot:
1. Generate instructor materials ❌
2. Generate student materials ❌
3. Generate administrative documents ❌
4. Export formatted documents ❌

---

## What Would Make This 90-95% Complete

### Required Additions

1. **Instructor Guide Generator** - Extend AI prompts to output instructor-specific content
2. **Student Workbook Generator** - Separate output format for student materials
3. **Slide Deck Generator** - Convert lesson content to presentation format
4. **Skills Checklist Templates** - Structured output for competency verification
5. **Rubric Generator** - Performance assessment scoring guides
6. **Lab Activity Templates** - Hands-on instruction documents
7. **Clock-Hour Calculator** - Categorize hours by activity type
8. **Syllabus Template** - Formal document with policies
9. **Regulatory Crosswalk Engine** - Map to multiple certification bodies
10. **Document Exporter** - PDF/DOCX generation from templates

---

## Final Answer

**❌ PARTIAL**

The system generates solid **lesson content and structure** but lacks **complete document generation** for instructor guides, student workbooks, administrative documents, and formatted approval packets.

**What works:** Course outline → AI generation → Database persistence → Student delivery

**What's missing:** ~50% of the approval package (instructor materials, student materials, formatted documents)

**Recommended path:** Extend `lib/ai/course-generator.ts` with additional output generators for instructor guides, workbooks, rubrics, and approval documents.
