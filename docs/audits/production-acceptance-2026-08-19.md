# Production Acceptance Audit — 2026-08-19

Release candidate source SHA: `5405ae51a373ea05d11207b1da03dfe38f95e0c3`.

This branch exists only to force the full pull-request verification suite against the current production-hardening code. Runtime behavior is unchanged by this document.

Acceptance gates:

1. Repository integrity and canonical architecture.
2. TypeScript, lint, unit/integration, architecture, duplicate, compliance, security, migration, and multi-container build gates.
3. Supabase RLS and privileged RPC verification.
4. Role-based authentication and authorization boundaries.
5. Store/trial/subscription lifecycle.
6. Website Builder, Course Builder, Course Factory, Dev Studio, and PWA runtime contracts.
7. ESB v2 course structure, assessments, media, progress, completion, and certificate behavior.
8. Accessibility and responsive UI acceptance.
9. Public claim/evidence integrity.
10. Observability, backup/recovery, rollback, and incident readiness.
11. Exact-SHA Northflank deployment verification.
12. Post-deployment production smoke and role-based journey evidence.

No gate is accepted by absence of errors alone; a release requires positive pass evidence.
