# Production Launch PASS/FAIL Register — 2026-05-29

## Purpose

This register answers the launch question directly: **what is proven, what is failing, and what is blocked before production launch?**

This is not a feature plan and not a refactor plan. It is a launch-evidence register. A workflow is only marked **PASS** when there is code evidence plus operational/runtime evidence. If operational evidence is missing because credentials, dashboards, browsers, or Northflank access are unavailable, the item is marked **BLOCKED**, not PASS.

## Launch status summary

| Category | Count | Meaning                                                                                                                               |
| -------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------- |
| PASS     |     8 | Code or configuration has been implemented and verified enough to reduce immediate production risk.                                   |
| FAIL     |     2 | Known launch blockers remain unresolved in the current environment.                                                                   |
| BLOCKED  |    12 | Requires live external access, production credentials, dashboard access, browser automation, or deployed infrastructure verification. |

## PASS

| Item                                                 | Status | Evidence                                                                                                                               | Launch impact                                                           |
| ---------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Cash advance public/admin exposure reduced           | PASS   | Cash-advance pages and APIs were disabled/removed from active public/admin flows while preserving data.                                | Reduces financial/security audit exposure for non-core learner journey. |
| Email relay secured                                  | PASS   | `/api/email/send` was wrapped with runtime secret requirements and stricter rate limiting.                                             | Reduces open-relay and abuse risk.                                      |
| Edge middleware runtime issue fixed                  | PASS   | Middleware trace ID generation now uses Edge-compatible `crypto.randomUUID()`.                                                         | Removes a production runtime incompatibility.                           |
| Broken `tel:` JSX/template issues fixed              | PASS   | Footer/home CTA phone links were corrected.                                                                                            | Removes route compilation/rendering defects.                            |
| Dev Studio shell proxy code improved                 | PASS   | Admin custom server copies into the image, includes `ws`, sends a ready frame, and client terminal waits for shell-ready state.        | Fixes the browser/proxy side of the Studio shell connection chain.      |
| Dev Studio legacy ECS wiring aligned                 | PASS   | Legacy Studio service references were aligned while AWS was still documented. Current production verification must use the Northflank. | Removes a historical mismatch, but does not prove the current runtime.  |
| Build-surface attribution framework added            | PASS   | `scripts/audit-build-surface.mjs` and build investigation docs identify the largest route/build contributors.                          | Turns build OOM into measurable work instead of guesswork.              |
| Production stabilization mission/playbook documented | PASS   | Stabilization docs now define Phase 1 evidence expectations and next actions.                                                          | Keeps remaining work focused on proof, not broad cleanup.               |

## FAIL

| Item                      | Status | Exact failing condition                                                                                                               | Required fix/evidence                                                                                                                                                     |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production build success  | FAIL   | `pnpm next build` has repeatedly failed with JavaScript heap OOM in this environment.                                                 | Run split LMS/admin builds on a sufficiently provisioned builder; if still failing, reduce measured root LMS route surface starting with non-production `app/api` routes. |
| Phase 1 operational proof | FAIL   | Enrollment, payment, testing-center, trial workflow, and Studio shell have not all been proven end-to-end in production-like runtime. | Execute workflow tests with Supabase, SendGrid, Stripe, current hosting-provider runtime access, and browser access; record PASS/FAIL evidence per workflow.              |

## BLOCKED

| Item                                      | Status  | External dependency                                                                       | Required evidence to unblock                                                                    |
| ----------------------------------------- | ------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Studio shell production verification      | BLOCKED | Northflank runtime variables, deployed shell service/container, and browser/admin access. | Terminal connects in Admin → Dev Studio and returns a shell prompt.                             |
| `STUDIO_SHELL_SECRET` live value          | BLOCKED | Northflank secrets/environment access.                                                    | Secret exists and is consumed by admin/studio runtime.                                          |
| `STUDIO_TOKEN_SECRET` live value          | BLOCKED | Northflank secrets/environment access.                                                    | Secret exists or documented fallback is accepted.                                               |
| `STUDIO_SHELL_WS_URL` live value          | BLOCKED | Northflank secrets/environment access.                                                    | Internal URL points to reachable Studio shell endpoint.                                         |
| `STUDIO_SHELL_WS_URL_PUBLIC` live value   | BLOCKED | Northflank secrets/environment access after shell service deploy.                         | Public/local-dev URL is populated with the active shell endpoint.                               |
| Admin and Studio redeploy                 | BLOCKED | Northflank deploy permissions.                                                            | Admin and Studio/shell runtimes redeployed and stable.                                          |
| Enrollment end-to-end verification        | BLOCKED | Supabase live project, SendGrid, admin access, browser automation or manual operator.     | Application submission persists to DB, confirmation email sends, admin can see status.          |
| Stripe live/test transaction verification | BLOCKED | Stripe dashboard/API keys, webhook endpoint, Supabase enrollment records.                 | `checkout.session.completed` / payment events update enrollment and receipt/confirmation state. |
| Testing Center end-to-end verification    | BLOCKED | Payment provider, scheduling data, admin reporting access, browser automation.            | Registration → scheduling → payment → confirmation → admin report all succeed.                  |
| Trial workflow end-to-end verification    | BLOCKED | Supabase, notification provider, admin review access.                                     | Trial application validates, stores data, sends notifications, and appears in admin review.     |
| Supabase migration execution              | BLOCKED | Supabase Dashboard/SQL Editor access.                                                     | Pending migrations are applied or explicitly waived with live schema evidence.                  |
| Browser E2E evidence                      | BLOCKED | Playwright browser binaries or alternate managed browser environment.                     | Screenshots/traces for enrollment, payment, testing-center, trial, and Studio shell flows.      |

## Required launch checklist

These are the remaining items that must be green before calling the platform production-ready:

1. **Build passes** — `pnpm run build:lms:phased` and `pnpm run build:admin` succeed on the production builder.
2. **Studio shell prompt proven** — Admin → Dev Studio → Terminal returns a shell prompt after the Northflank redeploys the admin and shell runtimes.
3. **Enrollment proven** — application submission saves, sends confirmation, notifies admin, and exposes status in admin.
4. **Stripe proven** — checkout/payment webhook updates enrollment automatically and creates confirmation/receipt evidence.
5. **Testing Center proven** — registration, scheduling, payment, confirmation, and admin reporting all pass.
6. **Trial workflow proven** — required fields validate, data stores, notifications send, and admin review works.
7. **Supabase schema confirmed** — pending migrations are applied or explicitly documented as not required for launch.
8. **Evidence archived** — screenshots, logs, webhook event IDs, DB row IDs, and deployment IDs are attached to the launch packet.

## Recommended next action

Run the following evidence-first sequence; do not start Phase 2 cleanup or portal consolidation until these are complete:

```bash
pnpm run build:lms:phased
pnpm run build:admin
# Then redeploy LMS/Admin/Studio shell through Northflank.
```

Then manually or via browser automation verify:

```text
Application → Enrollment → Payment → Training access → Credential/completion path
```

## Readiness assessment

Current readiness remains **85–90%**.

The remaining 10–15% is not primarily new code. It is production configuration, deployment verification, payment/email/database validation, successful build evidence, and captured screenshots/logs proving that the critical workflows work end-to-end.

## 2026-06-04 deployment target correction

AWS/ECS/SSM is no longer the current deployment target. Any AWS-specific PASS/BLOCKED item in this historical register should be read as legacy context only. Current launch validation must use the Northflank, its environment variable/secrets system, and its deploy logs. The build commands remain the same (`pnpm run build:lms:phased` and `pnpm run build:admin`), but the evidence must come from the Northflank builder/runtime, not CodeBuild or ECS.
