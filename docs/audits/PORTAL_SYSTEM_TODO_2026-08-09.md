# Portal System Implementation TODO — August 9, 2026

This checklist records the portal audit status and the implementation work that remains. The audit is complete; the portal system must not be treated as finished until the code fixes, Supabase corrections/migrations, deployment, and production end-to-end verification are complete.

## Audit status

- [x] Repository / commit side-by-side audit complete
- [x] Supabase mapping audit complete
- [x] Portal discoverability audit complete
- [x] Apprenticeship dashboard audit complete
- [ ] Code fixes applied
- [ ] Supabase corrections / migrations applied
- [ ] Deployment completed
- [ ] Production end-to-end verification passed

## P0 — Host Shop authorization

- [ ] Consolidate Host Shop authorization behind one canonical server-side access rule.
- [ ] Verify signed-in Host Shop users are checked against the authoritative partner / host-shop record.
- [ ] Verify approval state, MOU/compliance state, and any legacy fallback cannot conflict with the canonical authorization decision.
- [ ] Ensure unauthenticated and unauthorized users cannot render Host Shop operational data.
- [ ] Ensure approved Host Shop users do not encounter false 403/login loops.
- [ ] Add route-level tests for approved, pending, rejected, legacy, admin, and unauthenticated states.

## P0 — Duplicate apprenticeship routing

- [ ] Identify the canonical apprenticeship dashboard and portal routes.
- [ ] Remove, redirect, or explicitly deprecate duplicate apprenticeship routes.
- [ ] Ensure navigation, middleware, role routers, post-login redirects, and dashboard links all point to the same canonical apprenticeship destinations.
- [ ] Add redirect/canonical tests so duplicate routes cannot drift back into production.

## P0 — Conflicting OJT-hour sources

- [ ] Define one authoritative OJT-hour model.
- [ ] Reconcile competing hour sources used by apprenticeship and Host Shop dashboards.
- [ ] Ensure approved, pending, rejected, transferred, and adjusted hours have explicit semantics.
- [ ] Ensure the Host Shop dashboard and apprentice dashboard calculate the same OJT total for the same apprentice.
- [ ] Backfill or synchronize any required projection table if the portal depends on one.
- [ ] Add reconciliation tests that fail when portal totals disagree.

## P0 — Employer apprenticeship mapping

- [ ] Map the Employer dashboard to the authoritative apprenticeship-program source.
- [ ] Remove reads from empty or legacy apprenticeship tables where they produce false `0` KPIs.
- [ ] Verify employer-visible apprenticeship programs, active apprentices, placements, job openings, and related KPIs use one consistent domain model.
- [ ] Add production-backed tests against the canonical apprenticeship records.

## P0 — Student / RTI progress divergence

- [ ] Define one authoritative learner-progress model for RTI/course completion.
- [ ] Reconcile stored enrollment percentages with lesson/progress-derived calculations.
- [ ] Ensure Student Dashboard, course views, apprenticeship RTI progress, certificates, and Admin progress reporting agree.
- [ ] Prevent a learner from showing non-zero overall progress while lesson-derived widgets show zero unless that state is explicitly valid and explained.
- [ ] Add reconciliation tests for enrollment progress, lesson completion, RTI totals, and completion status.

## P0 — Testing Center role authorization

- [ ] Audit Testing Center route protection and role requirements.
- [ ] Define which roles can access testing operations, scheduling, results, credential administration, and configuration.
- [ ] Apply the same server-side authorization model to pages and APIs.
- [ ] Ensure admin override behavior is explicit and consistent.
- [ ] Test testing-center, admin, staff, instructor/proctor, unauthorized, and unauthenticated access states.

## P1 — Stale Staff / dashboard links

- [ ] Inventory Staff and dashboard navigation links across LMS/Admin/portals.
- [ ] Remove links to obsolete, duplicate, renamed, or missing routes.
- [ ] Update links to canonical portal/dashboard routes.
- [ ] Ensure role-specific navigation does not expose destinations the role cannot access.
- [ ] Add a route/link smoke test so stale links fail CI instead of reaching production.

## P0 — Competing role / router definitions

- [ ] Inventory all role constants, role aliases, permission matrices, post-login routers, middleware matchers, page-level guards, and portal redirect maps.
- [ ] Choose one canonical role taxonomy.
- [ ] Choose one canonical post-login routing map.
- [ ] Choose one canonical authorization matrix for portal access.
- [ ] Remove or deprecate parallel role/router definitions.
- [ ] Ensure `admin` override behavior is implemented once and consumed everywhere rather than re-created in lower-level guards.
- [ ] Verify Marketing, LMS, Admin, Host Shop, Employer, Workforce, Instructor, Testing Center, Program Holder, Apprentice, and Student routes all consume the same role model.
- [ ] Add automated route-matrix tests covering each role against every protected portal class.

## Supabase corrections / migrations

- [ ] Produce migrations/backfills required by the canonical OJT-hour model.
- [ ] Produce migrations/backfills required by the canonical apprenticeship-program mapping if existing portal reads depend on legacy tables.
- [ ] Produce migrations/backfills required by the canonical learner/RTI progress model.
- [ ] Update RLS/policies where portal authorization changes require database-level enforcement.
- [ ] Avoid destructive migration of historical data until a reconciliation report has been reviewed.
- [ ] Record canonical tables, compatibility views/projections, deprecated tables, and migration ownership for each affected domain.

## Implementation gate before deployment

- [ ] Host Shop authorization tests pass.
- [ ] Canonical apprenticeship routing tests pass.
- [ ] Host Shop/apprentice OJT totals reconcile.
- [ ] Employer apprenticeship KPIs use the canonical source.
- [ ] Student/RTI progress reconciles across widgets and records.
- [ ] Testing Center authorization tests pass.
- [ ] Staff/dashboard stale-link scan passes.
- [ ] Role/router matrix tests pass.
- [ ] Required Supabase migrations apply cleanly in the target environment.
- [ ] No new competing table/router/role definition is introduced by the fixes.

## Deployment status

- [ ] Merge reviewed portal fixes.
- [ ] Apply approved Supabase migrations/corrections.
- [ ] Deploy affected LMS service.
- [ ] Deploy affected Admin service if Admin routing/guards are changed.
- [ ] Deploy Marketing only if public portal links/routes are changed.
- [ ] Verify deployed SHA/build for every affected service.

## Production end-to-end verification

The portal system is not production-complete until all of these pass in the deployed environment:

- [ ] Admin login and portal override test
- [ ] Student login → dashboard → course/RTI progress test
- [ ] Apprentice login → apprenticeship dashboard → OJT/RTI test
- [ ] Host Shop login → approved shop dashboard → apprentice/hours workflow test
- [ ] Employer login → dashboard → apprenticeship KPI/program mapping test
- [ ] Workforce login → dashboard/access test
- [ ] Instructor/Staff login → dashboard/navigation test
- [ ] Testing Center authorized-role login → testing operations test
- [ ] Unauthorized-role denial test for every portal class
- [ ] Password reset / magic-link / preserved redirect test where applicable
- [ ] Cross-subdomain session test across `app.` and `admin.`
- [ ] Repeated refresh/navigation test with no auth loop or stale-session behavior
- [ ] Portal links return no unexpected 404/403/redirect loops
- [ ] Portal KPIs agree with their canonical Supabase sources

## Exit criteria

Do not mark the portal system finished until the audit findings have moved through all four implementation stages:

1. [x] Audit and mapping complete.
2. [ ] Code and Supabase corrections complete.
3. [ ] Deployment complete.
4. [ ] Production end-to-end verification complete.

Target condition: one role model, one portal router, one canonical apprenticeship route set, one OJT-hour source, one apprenticeship-program source, one learner/RTI progress source, consistent Testing Center authorization, no stale Staff/dashboard links, and verified production behavior for every portal.