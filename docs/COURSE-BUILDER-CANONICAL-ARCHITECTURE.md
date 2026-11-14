# Canonical Studio / Course Builder Architecture

Authoritative as of 2026-08-22.

## Ownership

Studio is the control plane. It owns administrator intent, workflow coordination, and the Studio user experience.

Course Builder is the single application orchestration authority for complete-course creation, blueprint generation, validation, repair, media queueing, governance, and publication.

Course Factory is the private execution engine. Raw execution lives in `lib/course-factory/factory.ts` and is owned by `lib/course-builder/orchestrator.ts` for application traffic.

The LMS consumes published canonical courses and learner state. It does not own an independent complete-course generator.

## Canonical flow

`Studio -> Course Builder orchestrator -> private Course Factory -> courses/course_modules/course_lessons -> media/governance/publish -> LMS`

The single application HTTP orchestration boundary is:

`POST /api/admin/course-builder`

Supported orchestration actions include complete generation, blueprint generation, media queueing, audit/validation, governed publication, and repair/missing-content generation.

## Studio compatibility facade

Some existing Studio code imports `courseFactory` from `@/lib/course-factory`. That public barrel no longer exports the private engine directly. `lib/course-factory/index.ts` exposes the Course Builder facade from `lib/course-builder/orchestrator.ts`. Therefore the historical import name does not grant direct access to `factory.ts`.

New Studio integration code should prefer `lib/devstudio/course-builder-controller.ts`, which explicitly represents the Studio control-plane contract.

Direct application imports of `lib/course-factory/factory.ts` are forbidden outside the canonical Course Builder orchestrator.

## Publication

Publication follows one governed path:

`draft/generated -> governance normalization -> course/regulatory audit -> government procurement gate -> media/persistence verification -> published/active`

The regulatory audit and government procurement gate are part of the canonical Course Builder orchestrator. The former standalone publication endpoint is retired.

## Repair

Repair and missing-content generation use the canonical course identity and `missing-only` generation so existing human-authored content is not indiscriminately overwritten.

## Retired authorities

The following complete-course HTTP paths are compatibility-only and must not generate or persist a complete package:

- `/api/admin/lms/courses/generate`
- `/api/admin/course-builder/publish`
- `/api/admin/courses/[courseId]/generate-missing`
- historical generate-and-publish APIs
- the Supabase AI course creator

Compatibility routes may return an explicit retirement response while callers are migrated, but they are not architectural authorities.

## Enforcement

`scripts/check-course-factory-authority.mjs` enforces the single complete-course HTTP authority, the Course Builder facade/private-engine split, retired endpoint references, and absence of unapproved parallel complete-package writers.

`scripts/check-studio-architecture.mjs` enforces Studio as the canonical control plane and verifies that its course path resolves through the Course Builder facade/controller rather than the private Course Factory engine.

`.github/workflows/build-esb-acceptance.yml` runs these architecture gates before production course acceptance.

When older audit or architecture documents conflict with this file, this document and the current executable gates are authoritative.
