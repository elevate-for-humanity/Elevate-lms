# Repository Scripts

This directory contains maintenance, verification, migration, deployment, media, and one-time administrative scripts for the Elevate monorepo.

## Operating rule

A script is not an architectural owner. Production behavior belongs in the application/service layer. Scripts may invoke canonical services or perform controlled maintenance, but they must not create a parallel course, enrollment, media, authentication, deployment, or data model.

Before adding a new script:

1. Search for an existing application service or package script that already owns the capability.
2. Prefer a thin caller of that service over copying business logic into `scripts/`.
3. Do not hard-code production course, lesson, student, service, or tenant IDs unless the script is explicitly a documented one-time migration.
4. Do not write new curriculum to `training_lessons`, `lms_lessons`, or other compatibility views. Canonical course structure is `courses -> course_modules -> course_lessons`.
5. Do not add a second media generator. Course media orchestration is owned by Course Factory / Course Builder and `lib/course-factory/media-service.ts`.
6. A destructive script must support a dry-run or require an explicit destructive flag and must log what it changes.
7. One-time migration scripts should be retired after their migration path is proven and no package/workflow references remain.

## Canonical commands

Use the root `package.json` as the command registry. It is the controlling source for supported checks and workflows rather than copying a second command catalog into this README.

Common categories include:

- build/type/lint checks for Marketing, LMS, and Admin;
- `production:gate` and deployment verification;
- architecture and integrity checks;
- Supabase schema/migration verification;
- Course Builder / Course Factory verification;
- accessibility and production smoke tests.

Run commands through the repository-pinned package manager (`pnpm`) and Node version defined by the repository/deployment configuration.

## Course and media scripts

Current course authoring flows through Course Builder and Course Factory. Blueprints define course structure; canonical database rows are written to `courses`, `course_modules`, and `course_lessons`.

Standalone program-specific media generators are legacy unless they are explicitly referenced by the canonical Course Factory. For lesson media, use the Course Builder media action/queue and shared rendering services. Utility upload or rollback scripts must resolve canonical lesson IDs from the database rather than maintaining separate UUID maps.

## Deployment scripts

Northflank and production scripts must use the canonical service-target configuration and exact commit SHA. Do not create alternate deployment paths merely to recover one service. Recovery tooling must preserve the same service ownership and environment contracts as normal deployment.

## Historical scripts

Some old audit documents mention scripts that no longer exist. Historical documents are evidence, not current operating instructions. When a script is removed, current architecture docs and package commands take precedence over archived audit text.

## Validation before removal

Do not delete a script because it has no obvious import. Classify it first:

- **KEEP** — active operational dependency.
- **FINISH** — useful capability whose implementation is incomplete.
- **MERGE** — useful behavior belongs in an existing canonical service.
- **MIGRATE-FIRST** — callers/data must be moved before deletion.
- **DELETE** — superseded, placeholder, duplicate, or nonfunctional with a proven replacement.
- **ARCHIVE** — useful historical evidence but not runtime authority.

For deletion, verify package scripts, workflow references, imports, documentation references, and replacement behavior before removal.
