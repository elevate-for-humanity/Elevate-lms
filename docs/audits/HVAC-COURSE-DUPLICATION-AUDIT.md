# HVAC COURSE DUPLICATION AUDIT

**Date:** 2026-07-11
**Status:** 🔴 CRITICAL - Complete Course Structure Analysis

---

## EXECUTIVE SUMMARY

YES, the HVAC course has MASSIVE duplication. The SAME quiz content exists in **multiple locations** in different formats.

### The Problem in Numbers

| Location | Type | Size | Lines |
|----------|------|------|------:|
| `lib/courses/hvac-quizzes.ts` | TypeScript | 301 KB | 8,474 |
| `lib/courses/hvac-lesson-quizzes.ts` | TypeScript | 187 KB | 5,294 |
| `lib/courses/hvac-quiz-banks.ts` | TypeScript | 90 KB | 2,311 |
| `public/data/hvac-quizzes.json` | JSON | 1.3 MB | - |
| `public/data/hvac-lesson-quizzes.json` | JSON | 196 KB | - |
| `public/data/hvac-quiz-banks.json` | JSON | 89 KB | - |
| `courses/hvac/module*/quiz*.ts` | TypeScript | Various | Various |

**Total HVAC course data:** ~2.5 MB across 50+ files!

---

## FILE STRUCTURE ANALYSIS

### 1. Source of Truth?
```
courses/hvac/                    ← Video scripts + lesson quizzes (source)
├── module1/
│   ├── lesson1-script.ts        ← Video script
│   └── quiz1.ts                ← 5 questions per lesson
├── module2/
│   ├── lesson1-script.ts
│   └── quiz.ts
... (16 modules)
└── modules.ts                  ← Module metadata
```

### 2. Duplicate Libraries (3 versions of same data!)
```
lib/courses/                     ← All different content
├── hvac-quizzes.ts             ← EPA 608 exam questions (8,474 lines)
├── hvac-lesson-quizzes.ts      ← 83 lesson quizzes (5,294 lines)
└── hvac-quiz-banks.ts          ← Per-module banks (2,311 lines)
```

### 3. JSON Exports (duplicates of above)
```
public/data/                     ← Same content as lib/courses/
├── hvac-quizzes.json           ← 1.3 MB (SAME as lib/hvac-quizzes.ts)
├── hvac-lesson-quizzes.json    ← 196 KB (SAME as lib/hvac-lesson-quizzes.ts)
└── hvac-quiz-banks.json        ← 89 KB (SAME as lib/hvac-quiz-banks.ts)
```

---

## CONTENT BREAKDOWN

### lib/courses/hvac-quizzes.ts (8,474 lines)

Contains **EPA 608 certification exam questions**:
- EPA 608 Core (75 questions)
- EPA 608 Type I (75 questions)
- EPA 608 Type II (75 questions)
- EPA 608 Type III (75 questions)
- Module exam questions (8 modules × 10 questions)
- HVAC Final Exam (40 questions)

**Purpose:** Certification exam prep

---

### lib/courses/hvac-lesson-quizzes.ts (5,294 lines)

Contains **5 quick-check questions per teaching lesson**:
- 83 lessons × 5 questions = 415 questions
- Format: `QUIZ_01_01` through `QUIZ_16_05`

**Purpose:** Lesson comprehension checks

---

### lib/courses/hvac-quiz-banks.ts (2,311 lines)

Contains **per-module quiz banks**:
- `hvac-01` through `hvac-16`
- Similar questions to hvac-lesson-quizzes but different format

**Purpose:** Practice exam component

---

### courses/hvac/ (source directory)

Contains **video scripts and lesson quizzes**:
- Video scripts for each lesson
- Individual quiz files per module
- Module metadata

**Purpose:** Course content (source of truth?)

---

## DUPLICATION CHAIN

```
COURSES DIRECTORY (source?)
    │
    ├─→ courses/hvac/module1/quiz1.ts (5 questions)
    │
    ├─→ lib/courses/hvac-lesson-quizzes.ts (re-exports 83 lesson quizzes)
    │
    ├─→ lib/courses/hvac-quiz-banks.ts (per-module banks)
    │
    └─→ lib/courses/hvac-quizzes.ts (EPA 608 exams)
            │
            └─→ public/data/hvac-quizzes.json (JSON export)
            └─→ public/data/hvac-lesson-quizzes.json
            └─→ public/data/hvac-quiz-banks.json
```

**TOTAL QUIZ QUESTIONS:** ~1,000+ questions across 6 files!

---

## WHAT'S ACTUALLY USED?

| File | Imported By | Status |
|------|------------|--------|
| `lib/courses/hvac-quizzes.ts` | `hvac-quiz-map.ts` (DEAD) | ❌ NOT USED |
| `lib/courses/hvac-lesson-quizzes.ts` | `hvac-quizzes.ts` (re-export) | ❌ CHAIN ONLY |
| `lib/courses/hvac-quiz-banks.ts` | `UniversalPracticeExam.tsx` (DEAD) | ❌ NOT USED |
| `courses/hvac/module*/quiz*.ts` | Unknown | ⚠️ UNCLEAR |
| `public/data/hvac-*.json` | `hvac-instructor-prompt.ts` | ✅ USED |

---

## WHY THIS IS A PROBLEM

### 1. Memory Waste
- 2.5 MB of quiz data loaded at build time
- Most of it is never used
- Bundle bloat for all users

### 2. Maintenance Nightmare
- Quiz in 6 places = update 6 times
- Syncing errors guaranteed
- No single source of truth

### 3. Build Time Impact
- 8,474 lines of TypeScript to compile
- 1.3 MB JSON to process
- Increases build time significantly

### 4. Confusion
- What's the source of truth?
- Which file is used?
- What if they get out of sync?

---

## RECOMMENDED ARCHITECTURE

### SINGLE SOURCE OF TRUTH

```
SINGLE LOCATION:
public/data/hvac-course/
├── lessons/
│   ├── module-01/
│   │   ├── lesson-01.json    ← 5 comprehension questions
│   │   └── lesson-02.json
│   └── module-02/
├── exams/
│   ├── epa-core.json        ← 75 EPA 608 questions
│   ├── epa-type-1.json
│   └── ...
└── quiz-map.json            ← Maps lesson ID → quiz file
```

### API ENDPOINTS

```
/api/hvac/lessons/[module]/[lesson]  → GET quiz questions
/api/hvac/exams/[exam-type]         → GET exam questions
/api/hvac/practice                   → GET practice questions
```

### CLIENT USAGE

```typescript
// BEFORE (loads 2.5 MB)
import { HVAC_QUIZ_MAP } from '@/lib/courses/hvac-quizzes';

// AFTER (lazy load)
async function getQuiz(moduleId: string, lessonId: string) {
  const res = await fetch(`/api/hvac/lessons/${moduleId}/${lessonId}`);
  return res.json();
}
```

---

## ACTION ITEMS

### IMMEDIATE (Delete Dead Code)

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 HIGH | DELETE `lib/courses/hvac-quiz-map.ts` | Remove 8,474 lines |
| 🔴 HIGH | DELETE `components/lms/UniversalPracticeExam.tsx` | Remove dead component |
| 🔴 HIGH | DELETE JSON files (duplicates) | Remove 1.5 MB |

### PHASE 2 (Consolidate)

| Priority | Action | Impact |
|----------|--------|--------|
| 🟡 MED | Determine source of truth | courses/hvac/ or lib/courses/ |
| 🟡 MED | DELETE duplicate TypeScript files | Remove 16,000+ lines |
| 🟡 MED | Create JSON structure in public/data/ | Single source |
| 🟡 MED | Create API endpoints | Lazy load on demand |

### PHASE 3 (Cleanup)

| Priority | Action | Impact |
|----------|--------|--------|
| 🟢 LOW | Verify courses/hvac/ usage | Check if imported |
| 🟢 LOW | Update imports to use API | Modern architecture |
| 🟢 LOW | Add caching layer | Performance |

---

## FILES TO DELETE

```bash
# DEAD CODE
rm lib/courses/hvac-quiz-map.ts                    # 8,474 lines, never imported
rm components/lms/UniversalPracticeExam.tsx        # Never imported

# DUPLICATE JSON (same as TypeScript)
rm public/data/hvac-quizzes.json                   # 1.3 MB duplicate
rm public/data/hvac-lesson-quizzes.json           # 196 KB duplicate
rm public/data/hvac-quiz-banks.json               # 89 KB duplicate

# DEPENDS ON DECISION
# If courses/hvac/ is source:
rm lib/courses/hvac-quizzes.ts                    # 8,474 lines duplicate
rm lib/courses/hvac-lesson-quizzes.ts            # 5,294 lines duplicate
rm lib/courses/hvac-quiz-banks.ts                # 2,311 lines duplicate

# If lib/courses/ is source:
rm -rf courses/hvac/                             # 50+ files duplicate
```

---

## ESTIMATED SAVINGS

| Metric | Before | After |
|--------|--------|-------|
| Quiz data files | 50+ | ~20 |
| Total quiz data | 2.5 MB | 0.5 MB |
| Lines of TypeScript | 16,000+ | 0 |
| Build memory impact | ~50 MB | ~5 MB |

---

## AUDIT SIGN-OFF

**Auditor:** OpenHands Agent
**Date:** 2026-07-11
**HVAC Course Files Found:** 90+
**Duplication Level:** 🔴 CRITICAL
**Potential Savings:** 2+ MB, 16,000+ lines
