# Complete Workflow Checklist: Phlebotomy Program E2E

**Target:** Generate a complete Phlebotomy Technician program from one prompt

---

## PHASE 1: Program Request

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 1.1 | User enters program request | ✅ | ✅ | ❌ | `app/ai/course-factory/page.tsx` |
| 1.2 | Structured prompt parsed | ✅ | ✅ | ❌ | `lib/ai/course-generator.ts` |
| 1.3 | Credential alignment selected | ✅ | ✅ | ❌ | `lib/curriculum/blueprints/` |
| 1.4 | State jurisdiction set | ✅ | ✅ | ❌ | Blueprint state field |

---

## PHASE 2: Layer 1 - Course Generation

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 2.1 | Course structure created | ✅ | ✅ | ❌ | `lib/ai/course-generator.ts` |
| 2.2 | Modules created | ✅ | ✅ | ❌ | Generated in AI response |
| 2.3 | Lessons created | ✅ | ✅ | ❌ | Generated in AI response |
| 2.4 | Lesson content written | ✅ | ✅ | ❌ | 200-400 words per lesson |
| 2.5 | Learning objectives created | ✅ | ✅ | ❌ | `summary_text` field |
| 2.6 | Quiz questions generated | ✅ | ✅ | ❌ | `quiz_questions` array |
| 2.7 | Competency keys mapped | ✅ | ✅ | ❌ | `competency_keys` array |
| 2.8 | Content saved to DB | ✅ | ✅ | ❌ | `buildCanonicalCourseFromBlueprint.ts` |
| 2.9 | Lesson accessibility verified | ✅ | ❌ | ❌ | Needs check |

---

## PHASE 3: Layer 2 - Curriculum Package

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 3.1 | Instructor guide generated | ✅ | ✅ | ❌ | `lib/curriculum/package/generator.ts` |
| 3.2 | Student workbook generated | ✅ | ✅ | ❌ | `lib/curriculum/package/generator.ts` |
| 3.3 | Syllabus generated | ✅ | ✅ | ❌ | `lib/curriculum/package/generator.ts` |
| 3.4 | Skills checklists generated | ✅ | ✅ | ❌ | `lib/curriculum/package/generator.ts` |
| 3.5 | Practical rubrics generated | ✅ | ✅ | ❌ | `lib/curriculum/package/generator.ts` |
| 3.6 | Lab activities generated | ✅ | ✅ | ❌ | `lib/curriculum/package/generator.ts` |
| 3.7 | Clock-hour breakdown generated | ✅ | ✅ | ❌ | `lib/curriculum/package/generator.ts` |
| 3.8 | Lecture hours calculated | ✅ | ✅ | ❌ | In breakdown |
| 3.9 | Lab hours calculated | ✅ | ✅ | ❌ | In breakdown |
| 3.10 | Clinical hours calculated | ✅ | ✅ | ❌ | In breakdown |
| 3.11 | Hours reconcile correctly | ✅ | ✅ | ❌ | Validator checks |

---

## PHASE 4: Layer 3 - Validation

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 4.1 | Hour reconciliation validated | ✅ | ✅ | ❌ | `lib/curriculum/package/validator.ts` |
| 4.2 | Competency coverage validated | ✅ | ✅ | ❌ | `lib/curriculum/package/validator.ts` |
| 4.3 | Assessment alignment validated | ✅ | ✅ | ❌ | `lib/curriculum/package/validator.ts` |
| 4.4 | Document completeness validated | ✅ | ✅ | ❌ | `lib/curriculum/package/validator.ts` |
| 4.5 | Approval checklist generated | ✅ | ✅ | ❌ | `generateApprovalChecklist()` |
| 4.6 | Validation score calculated | ✅ | ✅ | ❌ | Returns 0-100 |

---

## PHASE 5: Document Export

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 5.1 | JSON export available | ✅ | ✅ | ❌ | API returns JSON |
| 5.2 | PDF export generated | ✅ | ❌ | ❌ | **MISSING** |
| 5.3 | DOCX export generated | ✅ | ❌ | ❌ | **MISSING** |
| 5.4 | ZIP package created | ✅ | ❌ | ❌ | **MISSING** |
| 5.5 | Documents previewable | ✅ | ❌ | ❌ | **MISSING** |

---

## PHASE 6: Approval Submission

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 6.1 | Approval packet assembled | ✅ | ✅ | ❌ | `generateApprovalPacketSummary()` |
| 6.2 | Checklist itemized | ✅ | ✅ | ❌ | 15-item checklist |
| 6.3 | Missing items flagged | ✅ | ✅ | ❌ | Validation issues |
| 6.4 | Human review triggered | ✅ | ❌ | ❌ | **MISSING** |
| 6.5 | Revision workflow started | ✅ | ❌ | ❌ | **MISSING** |

---

## PHASE 7: Publishing to LMS

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 7.1 | Course published to LMS | ✅ | ✅ | ❌ | `buildCanonicalCourseFromBlueprint.ts` |
| 7.2 | Lessons visible to students | ✅ | ✅ | ❌ | `lms_lessons` view |
| 7.3 | Quizzes available | ✅ | ✅ | ❌ | Quiz questions in lessons |
| 7.4 | Progress tracking enabled | ✅ | ✅ | ❌ | `lesson_progress` table |
| 7.5 | Completion certificates enabled | ✅ | ✅ | ❌ | Certificate tables |

---

## PHASE 8: Student Lifecycle

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 8.1 | Student enrolled | ✅ | ✅ | ❌ | `program_enrollments` |
| 8.2 | Lessons accessible | ✅ | ✅ | ❌ | LMS delivery |
| 8.3 | Progress tracked | ✅ | ✅ | ❌ | `lesson_progress` |
| 8.4 | Competencies assessed | ✅ | ✅ | ❌ | Quiz completion |
| 8.5 | Skills verified | ✅ | ❌ | ❌ | **MISSING** |
| 8.6 | Certificate issued | ✅ | ✅ | ❌ | Certificate tables |

---

## PHASE 9: Version Control

| # | Step | Required | Implemented | Tested | Location |
|---|------|----------|-------------|--------|----------|
| 9.1 | Version history tracked | ✅ | ❌ | ❌ | **MISSING** |
| 9.2 | Revisions compared | ✅ | ❌ | ❌ | **MISSING** |
| 9.3 | Rollback available | ✅ | ❌ | ❌ | **MISSING** |
| 9.4 | Audit trail maintained | ✅ | ✅ | ❌ | `audit_logs` table |

---

## Summary

| Phase | Required | Implemented | Missing |
|-------|----------|-------------|---------|
| Phase 1: Program Request | 4 | 4 | 0 |
| Phase 2: Layer 1 - Course | 9 | 9 | 0 |
| Phase 3: Layer 2 - Package | 11 | 11 | 0 |
| Phase 4: Layer 3 - Validation | 6 | 6 | 0 |
| Phase 5: Document Export | 5 | 1 | **4** |
| Phase 6: Approval Submission | 5 | 3 | **2** |
| Phase 7: Publishing | 5 | 5 | 0 |
| Phase 8: Student Lifecycle | 6 | 5 | **1** |
| Phase 9: Version Control | 4 | 1 | **3** |

**Total: 55 steps required, 44 implemented (80%), 11 missing (20%)**

---

## Gaps to Fill

1. **PDF Export** - Generate PDF from package content
2. **DOCX Export** - Generate Word documents
3. **ZIP Package** - Bundle all documents
4. **Human Review Trigger** - Start approval workflow
5. **Revision Workflow** - Handle feedback and edits
6. **Skills Verification** - Instructor sign-off UI
7. **Version History** - Track changes over time
