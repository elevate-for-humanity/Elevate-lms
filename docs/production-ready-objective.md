# Production-ready objective for Elevate for Humanity

This is the standing objective for Codex, Devin, Dev Studio, and any other implementation agent working on Elevate for Humanity.

## Objective

Deliver a production-ready Elevate for Humanity platform: workforce development, LMS, admin operations, Dev Studio, AI tooling, payments, compliance, credentialing, workflows, and deployment must work end-to-end in the running application.

Do not optimize for isolated fixes. Continue auditing, fixing, testing, and documenting until documented functionality is either:

1. **Validated complete** with end-to-end evidence, or
2. **Explicitly blocked** with the exact missing dependency and the steps required to unblock it.

## Completion standard

Do **not** report a feature as complete unless it is fully functional end-to-end in the running application.

A feature may be marked complete only when all of these are true:

- The UI/page/API/workflow exists and is reachable through the production route or admin route.
- The implementation is wired to live services/data where available: Supabase, Stripe, Northflank, GitHub Actions, AI providers, storage buckets, email, or external credential/workforce APIs.
- Mock data, placeholder responses, fake success states, local-only stubs, and hardcoded production fallbacks have been removed or explicitly gated to test/development mode.
- Auth, authorization, rate limiting, audit logging, and safe error responses match the repository standards for that route.
- Required migrations, buckets, environment variables, webhooks, and third-party accounts are documented and verified.
- Evidence exists: passing automated tests, smoke-test output, screenshots for UI changes, workflow run evidence, or live API results.

If any item is missing, the feature is **not validated**.

## Required work loop

1. Reconcile documentation against code with `pnpm run audit:doc-code`.
2. For each documented feature, verify the corresponding route, page, API, workflow, and integration exists.
3. Replace production mock data and placeholders with live integrations where the live service exists.
4. If a live service cannot be used, document the exact blocker: missing secret, missing account, blocked egress, unapplied migration, missing bucket, missing webhook, or unavailable third-party approval.
5. Add or run tests and smoke checks that exercise the actual user/operator workflow.
6. Capture evidence before marking anything complete.
7. Commit the changes and include the evidence in the PR/final report.

## Non-negotiable blockers

These block production-ready status until resolved or explicitly accepted by the owner:

- Container or deployment runner cannot reach GitHub/Northflank and no alternate GitHub Actions/operator deploy path is confirmed.
- Dashboard cards display hardcoded metrics where live DB/provider data is available.
- Admin or Dev Studio actions show fake success without performing the operation.
- AI features bypass the canonical AI service or silently fall back to mock production responses.
- Payment, credentialing, compliance, tax, workforce, or enrollment workflows lack live provider validation where required.
- API routes handling user data lack canonical auth/role guards.
- Migrations needed by documented features have not been applied and verified in Supabase.

## Reporting format

Every completion report must include:

- Documents reviewed.
- Features validated complete, each with evidence.
- Features implemented in the current pass, with changed files.
- Features still incomplete or blocked, with exact technical blockers.
- Mock/placeholder/hardcoded data removed or still remaining.
- Tests/checks run and their outputs.
- Commit hashes.
- Deployment status, including whether the code is actually live.
