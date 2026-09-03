# Course Factory Phase 2: Migration Plan

## Current State Analysis

### Runtime Reference Counts

| System | References | Status |
|--------|------------|--------|
| `lib/course-builder/` | 70 | ⚠️ ACTIVE |
| `lib/curriculum/builders/` | 5 | ⚠️ ACTIVE |
| `lib/ai/course-*` | 11 | ⚠️ ACTIVE |
| `lib/course-factory/` | 0 | 🆕 NEW |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN STUDIO (apps/admin/)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐                     │
│  │ course-builder/      │    │ ai/course-*          │                     │
│  │  • orchestrator      │    │  • course-generator  │                     │
│  │  • pipeline          │    │  • course-ingestion   │                     │
│  │  • assessment-gen    │    │  • course-gap-detect  │                     │
│  │  • audit            │    │                       │                     │
│  └──────────┬───────────┘    └──────────┬───────────┘                     │
│             │                            │                                 │
│             └────────────┬───────────────┘                                 │
│                          ▼                                                   │
│              ┌──────────────────────┐                                      │
│              │ curriculum/builders/  │                                      │
│              │  • buildCanonical    │                                      │
│              │  • buildCourse       │                                      │
│              └──────────┬───────────┘                                      │
│                         │                                                   │
│                         ▼                                                   │
│              ┌──────────────────────┐                                      │
│              │    SUPABASE DB       │                                      │
│              │  courses             │                                      │
│              │  course_modules      │                                      │
│              │  course_lessons      │                                      │
│              └──────────────────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

DESIRED STATE:
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN STUDIO (apps/admin/)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              ┌──────────────────────┐                                      │
│              │   course-factory/    │  ← SINGLE ENTRY POINT               │
│              │  • factory           │                                      │
│              │  • publisher         │                                      │
│              │  • content-generator │                                      │
│              │  • blueprint-loader  │                                      │
│              │  • types             │                                      │
│              └──────────┬───────────┘                                      │
│                         │                                                   │
│                         ▼                                                   │
│              ┌──────────────────────┐                                      │
│              │    SUPABASE DB       │                                      │
│              └──────────────────────┘                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Questions 6-8: Integration Status

| Component | Current System | Uses course-factory? |
|-----------|----------------|---------------------|
| Admin Studio | `lib/course-builder/` + `lib/ai/` | ❌ NO |
| Course Pipeline | `lib/course-builder/orchestrator.ts` | ❌ NO |
| AI Generation | `lib/ai/course-generator.ts` | ❌ NO |
| Publishing | `lib/course-builder/pipeline.ts` + `curriculum/builders/` | ❌ NO |
| Validation | `lib/course-builder/audit.ts` | ❌ NO |
| Blueprint Loading | `lib/curriculum/builders/getBlueprintForProgram.ts` | ❌ NO |

---

## Question 5: Blueprint Availability

| Course | Blueprint | Course Factory Support |
|--------|-----------|----------------------|
| HVAC | ✅ `hvac-epa-608.ts` | ✅ Yes |
| Barber | ✅ `barber-apprenticeship.ts` | ✅ Yes |
| CNA | ✅ `cna.ts` | ✅ Yes |
| CDL | ✅ `cdl-training.ts` | ✅ Yes |
| Medical Assistant (CCMA) | ✅ `ccma.ts` | ✅ Yes |
| Peer Recovery | ✅ `peer-recovery-specialist.ts` | ✅ Yes |
| Cosmetology | ❌ None | ⚠️ Needs Blueprint |
| Esthetics | ❌ None | ⚠️ Needs Blueprint |
| Nail/Manicurist | ❌ None | ⚠️ Needs Blueprint |

---

## MIGRATION CHECKLIST

### Phase 1: Update API Routes (Priority 1)

- [ ] `apps/admin/app/api/admin/course-builder/publish/route.ts`
  - Replace: `runCoursePublishPipeline` → `publishCourse`
  - Replace: `auditCourseTemplate` → validator
  
- [ ] `apps/admin/app/api/admin/course-builder/generate-from-blueprint/route.ts`
  - Replace: `buildCanonicalCourseFromBlueprint` → `publishCourse`
  - Replace: `generateAndPersistModuleQuiz` → `generateAssessment`

- [ ] `apps/admin/app/api/admin/programs/[programId]/auto-generate-course/route.ts`
  - Replace: `autoGenerateCourseForProgram` → `courseFactory`

- [ ] `apps/admin/app/api/admin/courses/ai-builder/route.ts`
  - Replace: `generateCourse` from `lib/ai/` → `courseFactory`

### Phase 2: Update Blueprint Loader (Priority 2)

- [ ] Replace all `getBlueprintForProgram.ts` calls with `blueprint-loader.ts`
- [ ] Update `lib/course-builder/program-resolver.ts` to use `blueprint-loader.ts`

### Phase 3: Deprecate Old Systems (Priority 3)

- [ ] Mark `lib/course-builder/orchestrator.ts` as deprecated
- [ ] Mark `lib/course-builder/pipeline.ts` as deprecated
- [ ] Mark `lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts` as deprecated
- [ ] Add deprecation warnings

### Phase 4: Add Missing Blueprints (Priority 4)

- [ ] Create `lib/curriculum/blueprints/cosmetology.ts`
- [ ] Create `lib/curriculum/blueprints/esthetics.ts`
- [ ] Create `lib/curriculum/blueprints/nail-technician.ts`

---

## Success Criteria

| Criteria | Status |
|----------|--------|
| Admin Studio uses `course-factory` | ❌ Pending |
| Course Pipeline uses `course-factory` | ❌ Pending |
| AI Generation uses `course-factory` | ❌ Pending |
| `lib/course-builder/` references = 0 | ❌ 70 references |
| `lib/curriculum/builders/` references = 0 | ❌ 5 references |
| `lib/ai/course-*` references = 0 | ❌ 11 references |
| All 9 courses have blueprints | ⚠️ 6/9 |
