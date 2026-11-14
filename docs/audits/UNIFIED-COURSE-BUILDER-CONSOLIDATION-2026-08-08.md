# Unified Course Builder Consolidation — Preservation Audit

Date: 2026-08-08
Repository: `elevate-for-humanity/Elevate-lms`
Canonical Admin authoring route: `/admin/course-builder`
Canonical Admin API root: `/api/admin/course-builder/*`
Canonical learner route: `/lms/courses/[courseId]/lessons/[lessonId]`
Canonical learner interaction API: `/api/learner/interactions`

## Governing rule

No feature is deleted until its capability has a verified canonical replacement. UI duplication is removed first. Shared runtime rules are not deleted merely because their path contains `course-builder`; some are consumed by enrollment, progression, certificates, and practical workflows.

## Side-by-side capability map

| Capability | Previous location(s) | Canonical destination | Preservation status | Legacy action |
|---|---|---|---|---|
| Course creation | `apps/admin/app/admin/course-builder/page.tsx` thin form | `/admin/course-builder` → `UnifiedCourseBuilder` | Preserved + expanded | Thin page replaced |
| Live course/module/lesson editor | `components/admin/course-builder/LiveCourseBuilder.tsx` | Unified Builder → **Build** tab | Preserved | Component retained as canonical editor module |
| AI full-course generation | `components/course/AutomaticCourseBuilder.tsx` | Unified Builder → **AI Generate** tab | Preserved | No second authoring page required |
| Dev Studio AI course flow | `apps/admin/app/admin/studio/courses/ai-builder/AICourseBuilderChat.tsx` | Unified Builder + canonical Admin APIs | Capability preserved; legacy chat surface still requires reference cleanup | Do not delete until references are zero |
| Blueprint library | `lib/curriculum/blueprints/*`, old `apps/app/api/admin/course-builder/load-blueprint` | `lib/course-factory/blueprint-loader.ts` + `/api/admin/course-builder/load-blueprint` + **Blueprints** tab | Preserved | Old API deleted |
| Blueprint generation | old `apps/app/api/admin/course-builder/generate-from-blueprint` | `/api/admin/course-builder/generate-from-blueprint` → `courseFactory()` | Preserved | Old API deleted |
| Course Factory orchestration | multiple `lib/course-builder/*` + scripts | `lib/course-factory/index.ts` / `factory.ts` is target single engine | In-progress dependency migration | Do not mass-delete shared logic |
| Course workspace loader | scattered DB queries | `/api/admin/course-builder/course` | New canonical | N/A |
| Module quick-add | old `apps/app/api/admin/course-builder/quick-add` | `/api/admin/course-builder/quick-add` | Preserved | Old API deleted |
| Inline lesson editing | old `apps/app/api/admin/course-builder/lesson-patch` | `/api/admin/course-builder/lesson-patch` | Preserved | Old API deleted |
| Course compiler | old `apps/app/api/admin/course-builder/compile` | `/api/admin/course-builder/compile` | Preserved | Old API deleted |
| Audit gate | old `apps/app/api/admin/course-builder/audit` | `/api/admin/course-builder/audit` | Preserved | Old API deleted |
| Publish gate | old `apps/app/api/admin/course-builder/publish` | `/api/admin/course-builder/publish` | Preserved | Old API deleted |
| Compliance profiles | old `apps/app/api/admin/course-builder/profiles` | `/api/admin/course-builder/profiles` | Preserved | Old API deleted |
| Program↔course map | old `apps/app/api/admin/course-builder/program-map` | `/api/admin/course-builder/program-map` | Preserved | Old API deleted |
| Program/course regulatory authoring | old `apps/app/api/admin/course-builder/program` | `/api/admin/course-builder/program` | Preserved + writes canonical columns | Old API deleted |
| Module compliance authoring | old `apps/app/api/admin/course-builder/module` | `/api/admin/course-builder/module` | Preserved + writes target hours/domain fields | Old API deleted |
| AI lesson writing | old `apps/app/api/admin/course-builder/ai-write` | `/api/admin/course-builder/ai-write` | Expanded from text-only to lesson-experience generation | Old API deleted |
| Assessments / hydration | old `apps/app/api/admin/course-builder/hydrate` | Unified Builder → **Assessments** + `/api/admin/course-builder/hydrate` | Preserved | Old API deleted |
| Credential intelligence | old `/api/course-builder/credential` | `/api/admin/course-builder/credential` | Preserved | Old API deleted |
| Integrated credential course builder | old `/api/course-builder/integrated` | `/api/admin/course-builder/integrated` | Preserved + auth corrected | Old API deleted |
| Course data-source inventory | old `/api/course-builder` | `/api/admin/course-builder/sources` | Preserved | Old API deleted |
| BLS data | old `/api/course-builder/bls` | `/api/admin/course-builder/bls` | Preserved | Old API deleted |
| Certification framework data | old `/api/course-builder/certifications` | `/api/admin/course-builder/certifications` | Preserved | Old API deleted |
| Curriculum framework data | old `/api/course-builder/curriculum` | `/api/admin/course-builder/curriculum` | Preserved | Old API deleted |
| Video generation UI | `/video-generator` + `VideoGeneratorClient` | Unified Builder → **Video + Audio** tab | Preserved | Legacy page redirects to Unified Builder |
| Video generation engine | `lib/video/*`, Remotion, job queue, `/api/admin/generate-lesson-videos` | Shared media engine used by Unified Builder | Preserved | Not duplicate business logic; retained |
| TTS / narration | `TextToSpeech`, `AutoPlayTTS`, `edge-tts`, server TTS | Unified lesson experience + LMS `TextToSpeech` | Preserved and learner-visible | Shared accessibility/media helpers retained |
| Interactive video | prior component was a stub; DB support existed | lesson-experience contract + LMS interactive-video renderer | Implemented learner-visible baseline | Stub no longer relied on |
| Knowledge checks | assessment generator + Course Factory spec | lesson-experience contract + LMS renderer | Preserved + learner-visible | N/A |
| Flashcards | NHA/flashcard DB infrastructure + Course Factory types | lesson-experience contract + LMS flashcard renderer | Preserved + learner-visible | Existing DB features retained |
| Scenarios | `ScenarioBlock`, `TroubleshootScenario`, blueprint specs | lesson-experience contract + LMS scenario renderer | Preserved + learner-visible | Program-specific helpers retained until ref audit |
| Hotspots / click-to-reveal | primarily specification + blueprint flags | lesson-experience contract + LMS hotspot renderer | Newly operational | Old spec retained as requirements doc |
| Drag/drop / matching | primarily specification + blueprint flags | lesson-experience contract + LMS matching/drag-drop renderer | Newly operational baseline | Old spec retained as requirements doc |
| Case study | blueprint interaction spec | lesson-experience contract + LMS case-study renderer | Preserved | N/A |
| Simulation | HVAC/program-specific implementations + blueprint spec | lesson-experience contract + LMS simulation/practical renderer | Preserved contract; specialized labs remain reusable | Do not delete specialized labs |
| Decision tree | blueprint interaction spec | lesson-experience contract + LMS decision renderer | Preserved | N/A |
| Practical / hands-on task | practical workflow + lesson fields | lesson-experience contract; `practical_required`; instructor sign-off | Preserved + surfaced | Shared workflow retained |
| Learner interaction endpoint | old `apps/app/api/learner/interactions` | `apps/lms/app/api/learner/interactions` | Consolidated into deployed LMS | Old route deleted |
| Learner lesson experience | LMS page previously video + HTML + quiz only | `InteractiveLessonExperience` inserted into canonical LMS lesson page | Expanded | No parallel learner page needed |
| Compliance dashboard | scattered fields/validators | Unified Builder → **Compliance** tab | Baseline consolidated view | Further publish gate reconciliation remains |

## Unified lesson-experience contract

The canonical authoring API stores interactive experience data under `course_lessons.content_json.experience` and preserves the normal course lesson fields. Supported keys:

- `narrationScript`
- `visualPrompt`
- `flashcards`
- `knowledgeChecks`
- `scenario`
- `hotspots`
- `dragDrop`
- `matching`
- `caseStudy`
- `simulation`
- `decisionTree`
- `practicalTask`
- `interactiveVideo`

A practical task automatically supports `practical_required` and `requires_instructor_signoff` at lesson level. Competency checks remain attached to canonical lesson fields.

## Canonical learner flow

`Video → Objectives → Core instruction → Key terms → InteractiveLessonExperience → Assessment/Progress → Next lesson`

The interactive experience can render narration/TTS, flashcards, knowledge checks, scenarios, hotspot activities, matching/drag-drop, hands-on practical checklists, simulation blocks, decision practice, and interactive video.

## Deleted duplicate route families

The migrated route implementations under these legacy paths were removed after canonical Admin/LMS replacements were created:

- `apps/app/api/admin/course-builder/{quick-add,lesson-patch,ai-write,hydrate,load-blueprint,generate-from-blueprint,audit,compile,module,program,profiles,program-map,publish}`
- `apps/app/api/course-builder/{route,integrated,credential,bls,certifications,curriculum}`
- `apps/app/api/learner/interactions`

## Remaining engine cleanup — deletion gate

`lib/course-builder` is **not yet safe to delete as a directory**. A repository-wide dependency scan shows live consumers outside the Course Builder UI, including certificate compilation, enrollment approval, LMS progression gates, practical workflow, program publishing/versioning and Admin endpoints. Those functions must first be moved or re-exported from `lib/course-factory` and every import updated. Deleting them before that migration would remove production behavior.

The safe final deletion condition is:

1. Zero live `@/lib/course-builder/*` imports outside a temporary compatibility barrel.
2. Course Factory tests pass.
3. Admin build passes.
4. LMS build passes.
5. Prestige Barber course loads and its interactive lesson endpoint renders.
6. Enrollment/progression/certificate/practical workflow tests pass.

Until those gates pass, shared runtime files are dependencies, not disposable duplicates.
