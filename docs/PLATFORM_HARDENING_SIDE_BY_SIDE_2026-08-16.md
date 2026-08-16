# Elevate Platform Hardening — Canonical Side-by-Side Execution Backlog

Date: 2026-08-16
Branch: `fix/platform-hardening-20260816`

This backlog converts the supplied enterprise-polish roadmap into evidence-based engineering work. Do not mark a row complete because a component, dependency, route, or document exists. `VERIFIED` requires the stated acceptance evidence.

## Immediate release blockers

| Workstream | Current state | Target state | Required fix | Verification evidence | Status |
|---|---|---|---|---|---|
| Affirm | Client checkout and server client exist; `/api/affirm/capture` is missing | Complete BNPL lifecycle | Add server authorize/capture route, validate token/order/program, persist payment reference, call canonical enrollment activator, make operation idempotent, handle failures safely | Sandbox approval + capture + DB payment/enrollment record + replay test + failure test | IN PROGRESS |
| Stripe lifecycle | Checkout/webhook/subscription code exists | Certified payment lifecycle | Exercise checkout -> webhook -> organization subscription/enrollment -> entitlement -> billing portal -> cancellation/failure | Stripe test event IDs, DB records, entitlement result, portal result, cancellation/failure evidence | NOT YET CERTIFIED |
| Role portals | Routes/components exist across roles | Role-by-role production proof | Run authorized smoke matrix for learner, apprentice, host shop, employer, program holder, workforce, instructor, staff, testing center, admin | login, RBAC, canonical landing, core action, logout, unauthorized denial | NOT YET CERTIFIED |
| PWA | Install hooks/components/manifests exist | Supported-device certification | Verify manifest/SW/install/update/offline boundaries on Android, iOS and desktop; never claim offline write support unless proven | device/browser/build matrix with screenshots/logs and explicit offline scenarios | NOT YET CERTIFIED |

## Architecture and code quality

| Roadmap claim/task | Repository-safe interpretation | Gap/fix | Acceptance gate | Status |
|---|---|---|---|---|
| Full code audit | Audit current runtime packages and canonical shared libraries; do not revive archived code | Reconcile duplicates, dead routes, obsolete APIs/components/builders and stale manifests | duplicate/route audit green; no known competing canonical implementation | OPEN |
| Update all packages to latest | Unsafe as a blanket upgrade | Upgrade supported packages in controlled batches; pin runtime-critical versions; test Next/React/Supabase/Stripe compatibility | clean install + typecheck + tests + production builds | OPEN |
| npm/OWASP security scan | Required | Run dependency, secret, auth/API and web security gates; remediate exploitable findings | zero critical/high unaccepted findings; exceptions documented | OPEN |
| Remove dead code | Required after reference tracing | Delete only after imports/routes/build references prove unused | build + route inventory + tests green | OPEN |
| Naming conventions | Standardize prospectively; mass rename only where value exceeds risk | Enforce lint rules and canonical domain terminology | lint gate | OPEN |
| Add comments | Do not add noise comments | Document security-sensitive, payment, tenancy, orchestration and non-obvious business logic | review gate | OPEN |
| ESLint/Prettier | Existing configuration must be reconciled, not replaced blindly with Airbnb | One root policy plus app-specific exceptions only where required | lint/format CI green | OPEN |
| TypeScript strict/no-any | Move incrementally; blanket no-any can break legacy runtime | Strict new/changed code, reduce existing any debt with tracked baseline | no regression over baseline; targeted strict packages green | OPEN |
| 80% coverage | Coverage target is useful only on critical paths | Prioritize auth, RBAC, payments, enrollment, trial, webhooks, course factory, route guards | critical-path coverage threshold + regression tests | OPEN |
| REST consistency | Preserve Next route handlers and canonical endpoints | Remove duplicate/legacy endpoint families; schema-validate request/response | API inventory + contract tests | OPEN |
| Centralized errors/logging | Shared logger/error utilities exist | Enforce structured logs, correlation IDs and sanitized errors on critical APIs | log/error tests; no secret/PII leakage | OPEN |
| JWT refresh tokens | Do not introduce a second auth architecture if Supabase session auth is canonical | Harden canonical Supabase session/cookie flow instead of parallel JWT stack | auth architecture review + session tests | OPEN |
| Rate limiting all endpoints | Prioritize public/auth/payment/mutation endpoints | Central policy with route classes and safe internal exemptions | rate-limit tests + 429 behavior | OPEN |
| Zod/Joi validation | Standardize on the validator already used by repository | Add schemas to payment/auth/public mutation APIs first | malformed-input tests | OPEN |

## Performance, reliability and deployment

| Area | Current evidence | Target | Fix | Verification | Status |
|---|---|---|---|---|---|
| Marketing | Prior deployment instability and duplicate media/route work | Stable production | Build/runtime health, hero/media, broken-resource and route audits | production smoke + synthetic checks | OPEN |
| LMS | Prior 404/503 and service-worker issues | Stable production | Canonical routes, auth, course loading, PWA boundaries | production role smoke + route tests | OPEN |
| Admin | Prior container/build failures and stale routes | Stable production | Build errors, RBAC, stale dashboard/routes, APIs | production admin smoke + CI | OPEN |
| Load time | Checklist previously asserted targets without measurements | Measured budgets | Lighthouse/browser/server timing budgets by surface | stored CI artifacts/results | OPEN |
| API latency | Unknown globally | Endpoint-specific SLOs | Instrument critical APIs; eliminate N+1 and blocking work | p50/p95/p99 metrics | OPEN |
| Uptime | Not proven by code | 99.9% objective | Health/readiness probes, restart analysis, external monitoring | 30-day SLO report | OPEN |
| Multi-region | Not automatically required for enterprise readiness | Evidence-based DR architecture | First establish backups, RTO/RPO, failover and single-region reliability; add multi-region only when justified | DR exercise | OPEN |

## Security hardening

| Control | Gap/fix | Acceptance gate | Status |
|---|---|---|---|
| Authentication | Consolidate canonical Supabase auth/session behavior; remove stale parallel auth | login/reset/logout/session matrix | OPEN |
| RBAC | Verify server-side authorization on every privileged route/API, not UI hiding | negative authorization tests | OPEN |
| Admin MFA | Do not advertise as mandatory until enforcement exists | enrolled test admin denied without required factor; recovery path tested | OPEN |
| Cookies/CSRF | Audit HttpOnly/Secure/SameSite and mutation protections across domains | automated header/session tests | OPEN |
| Secrets | Remove client exposure and stale credentials; validate secret sourcing | secret scan + runtime config audit | OPEN |
| RLS | Close known Supabase policy gaps and SECURITY DEFINER/search_path warnings | database security audit green | OPEN |
| Audit trail | Ensure privileged/payment/enrollment mutations emit immutable audit events | mutation-to-audit tests | OPEN |
| Encryption | Verify provider/platform configuration rather than asserting AES-256 generically | infrastructure evidence | OPEN |
| HIPAA/FERPA/WIOA | Treat as governance scope, not a code checkbox | policy/data-flow/access/retention evidence and legal/compliance review | NOT CERTIFIED |

## UX, accessibility and product polish

| Area | Gap/fix | Acceptance gate | Status |
|---|---|---|---|
| Navigation/routes | Remove stale/legacy aliases after reference tracing; no patch redirects for retired private routes unless migration requires one | route map + 404 crawl | OPEN |
| PWA dashboards | Remove hard-coded/stale overlays and role-inappropriate content | visual + role smoke | OPEN |
| Loading/error/empty states | Standardize on shared components | component/route audit | OPEN |
| Responsive UX | Verify real supported breakpoints | mobile/tablet/desktop visual tests | OPEN |
| Accessibility | Run axe/Lighthouse plus keyboard and screen-reader manual tests | no critical axe issues; documented manual pass | OPEN |
| WCAG 2.1 AA | Do not claim certification from component presence | evidence-backed audit | NOT CERTIFIED |
| Demo/public proof | Public read-only proof separated from authenticated production workspaces | public demo smoke | PARTIALLY COMPLETE |

## Data, integrations and operations

| Area | Gap/fix | Acceptance gate | Status |
|---|---|---|---|
| Application/enrollment model | Competing historical tables/flows require canonical ownership | one documented write path; migrations and consumers reconciled | OPEN |
| Stripe | Complete lifecycle certification and webhook idempotency | test-mode lifecycle evidence | IN PROGRESS |
| Affirm | Complete missing capture/enrollment server path | sandbox lifecycle evidence | IN PROGRESS |
| RAPIDS | Do not claim direct API sync without configured endpoint proof | successful external request/sync evidence | NOT PROVEN |
| Indiana DWD/ETPL | Do not claim direct API sync without configured endpoint proof | successful external request/sync evidence | NOT PROVEN |
| Email/SMS | Verify delivery, retries, suppression and auditability | provider test evidence | OPEN |
| Backups | Verify automated database/storage backups and restoration | restore drill | OPEN |
| Monitoring | Consolidate service health, errors, deployment and critical transaction alerts | alert test + dashboard | OPEN |
| Runbooks | Create incident, rollback, payment, auth and data-recovery runbooks | tabletop exercise | OPEN |

## CI/CD release gates

A production merge is not complete until all applicable gates are green:

1. Clean dependency install.
2. Lint/format policy.
3. Typecheck.
4. Unit/critical integration tests.
5. Marketing, LMS and Admin production builds.
6. Route/link/asset audit.
7. Security/dependency/secret scan.
8. Database migration/schema integrity checks.
9. Payment contract tests.
10. Auth/RBAC negative tests.
11. Accessibility automated gate on priority surfaces.
12. Deployment health/readiness check.
13. Post-deploy smoke on all three production domains.
14. Evidence artifact attached to the release/PR.

## Evidence rules

- `IMPLEMENTED` means code exists.
- `TESTED` means a repeatable automated/manual test was executed against a named build.
- `VERIFIED` means the intended end-to-end lifecycle completed and evidence was captured.
- `PRODUCTION VERIFIED` means the deployed production revision was checked after deployment.
- A green CI job for one service does not make the platform green.
- Estimated valuations, budgets, NPS, uptime, compliance certifications and performance percentages are not engineering facts until backed by evidence.

## Execution order

P0: Affirm completion; Stripe lifecycle; auth/RBAC/role smoke; Marketing/LMS/Admin build and runtime health; PWA install boundaries; security-critical findings.

P1: route/duplicate/dead-code consolidation; application/enrollment canonicalization; RLS/audit controls; accessibility; performance instrumentation; monitoring/backups/restore.

P2: dependency modernization batches; code-style debt; broader coverage; UX polish; operational automation; evidence-backed scaling/DR improvements.
