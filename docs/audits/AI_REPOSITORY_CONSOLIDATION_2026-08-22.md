# AI & Legacy Repository Consolidation — 2026-08-22

## Purpose

This document is the controlling ledger for AI/legacy cleanup. A file is **not** deleted merely because it has zero static imports. Every candidate must be classified by purpose, current callers, replacement ownership, data dependencies, and strategic value.

## Disposition vocabulary

- **KEEP** — canonical, active capability.
- **FINISH** — strategically useful implementation exists but contains demo data, incomplete wiring, missing controls, or unfinished UX.
- **MERGE** — useful behavior belongs in another canonical system; migrate the behavior first.
- **MIGRATE-FIRST** — legacy implementation has active callers; migrate callers before deletion.
- **DELETE** — demonstrably superseded or obsolete, with no remaining production/runtime dependency.
- **ARCHIVE** — historical evidence/documentation that should not drive current architecture.

## Canonical ownership

| Capability | Canonical owner | Disposition |
|---|---|---|
| Public program/career AI chat | `components/paris/*` | KEEP |
| Core AI provider abstraction | `lib/ai/ai-service.ts` + `lib/ai/index.ts` | KEEP / consolidate callers here |
| Knowledge retrieval / grounded AI | `lib/platform/rag.ts` | KEEP |
| Course authoring | Admin Course Builder + canonical curriculum blueprint pipeline | KEEP |
| Website generation | Marketing Website Builder under `apps/marketing/app/apps/website-builder/**` | KEEP |
| Learner personalization | LMS Adaptive Learning + real learning/skill tables | FINISH |
| AI provider/task routing | `lib/ai/model-router.ts` | MERGE gradually behind canonical AI service; do not delete while callers remain |
| Legacy curriculum writer | `lib/services/curriculum-generator.ts` | MIGRATE-FIRST |
| Historical AI audits | `docs/**` historical reports | ARCHIVE / non-authoritative |

## Sandstorm AI capability side-by-side

| Benchmark capability | Elevate evidence | Gap | Decision |
|---|---|---|---|
| AI content creation | Course Builder, lesson/quiz/image generation | Multiple historical generators and pathways | KEEP canonical Course Builder; retire old writers only after caller migration |
| AI technology selection | Multi-provider AI service and model router | Static model/pricing catalog can become stale; overlapping clients | KEEP capability; consolidate provider selection behind one service |
| AI digital strategy / KPIs | First-party analytics, admin reporting | AI-specific usage, assist-to-application, cost, fallback and error metrics incomplete | FINISH measurement layer |
| AI product development | PARIS, Course Builder, Website Builder, tutor/instructor systems | Duplicate historical assistants and prototypes | KEEP canonical products; delete only proven superseded duplicates |
| Infrastructure readiness | env validation, RAG, provider routing, Supabase, deployment gates | historical config drift | KEEP and harden |
| Ethical AI / governance | auth/rate limits and some AI audits | prompt-injection controls, audit logging, human-review rules incomplete | FINISH governance controls |
| Intent-based search | pgvector RAG retrieval exists | no single clearly-owned public intent-search UX | FINISH using existing RAG; do not introduce another search stack without need |
| AI chat | PARIS is active public career guidance | old general AI bubble duplicated purpose | PARIS KEEP; old bubble chain DELETE |
| Personalization | Adaptive Learning queries real learner/path data | demo/fallback content and hard-coded profile values existed | FINISH; demo data removed 2026-08-22 |

## Changes completed in this cleanup

### Deleted — proven superseded

1. `components/AIAssistantBubble.tsx`
   - Duplicated PARIS public career/program guidance.
   - Its mounting chain was non-canonical.
2. `components/ConditionalAIBubble.tsx`
   - Existed only to conditionally mount the superseded assistant.
3. `components/layout/ClientOnlyFeatures.tsx`
   - Unmounted legacy global wrapper with duplicated feature ownership.
4. `components/layout/RootWidgets.tsx`
   - Unmounted legacy global wrapper; underlying potentially useful components were not deleted solely because the wrapper was unused.
5. `components/AIPageBuilder.tsx`
   - Prototype called placeholder `efh-ai-stylist.your-subdomain.workers.dev` endpoints and wrote an older generated-pages flow.
   - Current Website Builder has real app routes, AI generation, sites, assets, revisions, import, domain and trial infrastructure.

### Corrected — feature registry truth

`lib/features/registry.ts` now:
- names PARIS as the canonical public AI assistant;
- no longer advertises the removed general AI bubble;
- marks dormant avatar experiments disabled instead of falsely `enabled`.

### Finished / hardened — personalization

`components/AdaptiveLearningPath.tsx` and `/lms/adaptive`:
- removed fake Full-Stack Developer fallback data;
- removed hard-coded `Visual Learner`, `Moderate`, `Problem Solving`, `Technical Skills` profile claims;
- removed fake module recommendations;
- use only real configured `learning_paths`, `learning_path_courses`, `training_programs`, `user_skills`, and `user_learning_paths` data;
- show honest empty/error states when personalization data is not configured.

## Do not delete yet

### Legacy curriculum generator chain — MIGRATE-FIRST

`lib/services/curriculum-generator.ts` is superseded architecturally, but it still has callers:
- `scripts/seed-hvac-curriculum.ts`
- `scripts/seed-bookkeeping-curriculum.ts`
- `scripts/seed-prs-curriculum.ts`

Additionally, `scripts/cli.ts` exposes `seed hvac` through the legacy HVAC seed. The legacy writer cannot be removed until these commands have a tested canonical replacement.

The documented replacement path is the canonical curriculum blueprint pipeline (`generate-course-from-blueprint` / `buildCanonicalCourseFromBlueprint`), but the current `scripts/course-builder/build.ts` is barber-specific and is **not** a drop-in HVAC replacement. Therefore cleanup must build/migrate a real HVAC canonical seeder before retiring the old chain.

### Model router — MERGE, not delete

`lib/ai/model-router.ts` has real callers including template generation, course-generation worker, and workforce-gap scanner. It contains useful task/provider routing but also a static model/cost catalog. Migrate the callers behind the canonical AI service before reducing this layer.

### RAG — KEEP

`lib/platform/rag.ts` is useful infrastructure for both grounded chat and future intent-based search. It already performs vector retrieval from platform knowledge. Do not replace it with another paid search stack unless a measured requirement justifies it.

### Avatar experiments — EVALUATE

`GlobalAvatar` and `AvatarChatBar` are no longer represented as active production features. Do not delete them until their content/UX value is compared against PARIS, accessibility requirements, and learner-course guidance. If they add no unique value, delete; if they provide unique visual/lesson guidance, merge that behavior into the canonical learner assistant instead of reactivating another global widget stack.

## Cleanup rules going forward

1. Search imports and dynamic imports.
2. Search route/config/registry references.
3. Inspect database/migration dependencies.
4. Identify canonical replacement and owner.
5. Decide whether the feature is useful to current product strategy.
6. If useful but incomplete: FINISH or MERGE.
7. If callers remain: MIGRATE-FIRST.
8. Delete only after replacement verification.
9. Run build/typecheck/integrity tests after each cleanup batch.
10. Historical audit documents are evidence, not current architecture; current ledgers override stale claims.

## Next cleanup order

1. Build a canonical HVAC seed/write path and migrate `scripts/cli.ts seed hvac`.
2. Evaluate bookkeeping and PRS legacy curriculum seeds the same way.
3. Remove `lib/services/curriculum-generator.ts` only after all callers are migrated.
4. Consolidate AI model/provider routing without breaking active workers.
5. Evaluate avatar/AR/experimental features one-by-one for unique value before deletion.
6. Re-audit root documentation and move stale reports to a clear historical archive/index rather than allowing them to conflict with current architecture.
7. Verify dependencies only after current imports and script usage are checked; do not use the 2025 dead-dependency list as deletion authority.
