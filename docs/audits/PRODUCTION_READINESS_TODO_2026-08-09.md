# Production Readiness TODO — August 9, 2026

This checklist captures the remaining production-readiness work identified from the August 9 live audit across Marketing, LMS, Admin, applications, host shops, and Studio.

## Current assessment

**Current overall readiness estimate after the deeper audit: 6.5–7/10.**

The platform has improved substantially, but multiple generations of Marketing, LMS, Admin, catalog, funding, metadata, and location data are still competing with each other. The primary remaining problem is now source-of-truth consolidation and authorization architecture rather than missing page construction.

| Surface | Current assessment | Remaining concern |
| --- | --- | --- |
| Marketing homepage | Stronger and functioning | Data architecture / competing sources of truth |
| Individual major program pages | Mostly substantially improved | Stale indexed variants still need cleanup |
| Program category hubs | High-risk | SSR/indexing incomplete or client-only |
| Program catalog | Critical | Multiple sources of truth |
| Funding classifications | Critical | Contradictory funding language across live surfaces |
| LMS | Improved | Intermittent 503 risk, employer-route auth inconsistency, authenticated verification |
| Admin | Critical authorization concern | Inconsistent server-side protection and authenticated CRUD/API/workflow verification |
| Applications | Major improvement | Must verify submission → Supabase → Admin review end to end |
| Barber / Host Shops | Strong | Normalize names, addresses, maps, phones, imagery, and canonical data source |
| SEO / legacy metadata | High | Old templates, unresolved variables, stale routes, crawler policy |
| Addresses / locations | High | Competing authoritative addresses and unclear location taxonomy |
| Duplication / data integrity | Not finished | Competing public routes and inconsistent records remain |

## P0 — Production blockers

- [ ] Eliminate intermittent LMS `503 Service Unavailable` behavior.
  - Confirm container health and restart history.
  - Verify `/lms/dashboard` repeatedly under load and after deployments.
  - Confirm health checks point at the correct LMS runtime and port.
  - Confirm no stale/unhealthy upstream remains in the active Northflank service.

- [ ] Centralize Program + Funding data into one canonical source of truth.
  - One authoritative program record must control:
    - slug / canonical route;
    - public name;
    - category;
    - duration;
    - tuition / price;
    - credentials;
    - delivery type;
    - funding eligibility by source;
    - application slug / CTA;
    - visibility / status;
    - ETPL / WRG / WIOA classifications where applicable.
  - Remove competing program/funding logic from page-local arrays, application catalogs, funding copy, and legacy program records.
  - Resolve the contradiction where `/programs` presents only four confirmed workforce-funded programs while individual descriptions and the student application advertise funding for additional self-pay programs.
  - Treat the confirmed funding matrix as authoritative until records are explicitly updated.
  - Ensure CNA, Medical Assistant, Barber, Phlebotomy, IT Help Desk, Bookkeeping, HVAC, CDL, Peer Recovery, Tax Preparation, and every other program display the same funding classification everywhere.
  - Ensure Workforce Ready Grant statements agree everywhere, including the current confirmed CDL/HVAC treatment unless authoritative records change.
  - Add a regression test that fails when a program is labeled both self-pay and WIOA/WRG-funded from conflicting sources.

- [ ] Fix Admin server-side authorization globally.
  - Every private Admin page must require authentication before rendering HTML.
  - Audit `/applications`, `/students`, `/programs`, `/crm`, surveys, Studio, System Health, Funding, Partners, Compliance, API Keys, and all nested Admin routes.
  - Do not rely on client-side React guards for private route protection.
  - Add `noindex, nofollow` to private Admin route metadata/layouts.
  - Ensure WorkOne Funding Survey UI is not publicly crawlable.
  - Ensure unauthenticated requests never receive private application-management UI shells such as `Send Survey to All Applicants`, `All Responses`, `Needs Callback`, or `Persuaded Away (Urgent)`.
  - Apply server-side authorization to administrative APIs as well as pages.
  - Verify auth middleware coverage with an automated route matrix.

- [ ] Fix program category-page SSR / indexability.
  - `/programs/healthcare` must server-render its actual catalog/content.
  - `/programs/skilled-trades` must server-render its actual catalog/content.
  - `/programs/technology` must server-render its actual catalog/content.
  - `/programs/business` must server-render its actual catalog/content.
  - Do not depend on client hydration for primary program descriptions, cards, prices, credentials, funding labels, or CTAs.
  - Verify Google/Bing/AI crawlers receive substantive HTML, not only the global shell and page heading.
  - Add SSR smoke assertions for category-page program card content.

- [ ] Verify Admin Studio / Workflow Studio end to end.
  - [ ] `/studio` loads for an authenticated admin.
  - [ ] `/studio/workflows/new` exists and creates a real workflow.
  - [ ] `/api/admin/workflows/run` executes a persisted workflow.
  - [ ] Workflow runs write real `workflow_runs` / step logs.
  - [ ] Errors are surfaced in Studio instead of silently succeeding.
  - [ ] Course Builder is controlled through the unified Studio architecture rather than a second standalone implementation.
  - [ ] Live/open-source preview shows while AI work is being generated.
  - [ ] Studio deploy controls target the actual production container/deployment path.
  - [ ] Every visible Studio control is wired to a real route/API or explicitly marked unavailable.

- [ ] Remove stale Maryland / legacy-shell organization data globally.
  - Search for and remove `123 Main St, Suite 200, Columbia, MD 21044`.
  - Audit generic LMS login/footer/contact shells.
  - Audit older training-provider and micro-program pages.
  - Ensure Indianapolis organization identity is sourced from one canonical config.

- [ ] Canonicalize duplicate barber apprenticeship routes.
  - Keep `/programs/barber-apprenticeship` as the canonical public route.
  - Redirect or remove `/barber-apprenticeship` and any other parallel public aliases.
  - Verify sitemap, internal links, metadata, and search indexing use the canonical route only.
  - Remove stale indexed barber hour structures that conflict with the current canonical `2,000 OJL + 144 RTI` structure.

- [ ] Normalize Host Site / Host Shop records from one authoritative data source.
  - [ ] `Salon Saloon LLC` / `Salon Saloon` — remove `Salon Salon LLC` typo and `South, Bend` formatting.
  - [ ] `Style and Scissor Salon` — remove `Style and Scissors Salon` naming drift.
  - [ ] `Generations Hair LLC` — resolve public address conflict between `134 N Sycamore St` and `2005 Deer Lake Dr` against the authoritative partner record.
  - [ ] Every shop must have normalized legal name, DBA, address, city/state/ZIP, phone when verified, map/directions, website/social/booking links, and apprenticeship relationship.
  - [ ] One media policy per shop; no duplicate or canceled images.

- [ ] Authenticated application function test.
  - [ ] Student application submits successfully through all five steps.
  - [ ] Barber application submits successfully.
  - [ ] Transfer-hour evidence upload persists.
  - [ ] Host Site application submits successfully.
  - [ ] Business/shop license upload persists.
  - [ ] Liability insurance COI upload persists.
  - [ ] Workers' compensation certificate/exemption upload persists.
  - [ ] Supervisor professional license upload persists.
  - [ ] EIN verification / W-9 upload persists.
  - [ ] Optional occupancy/business document upload persists.
  - [ ] Protected identity workflow keeps full SSN outside the ordinary application table.
  - [ ] Hash / last-four behavior matches the intended protected identity design.
  - [ ] Submitted records appear in the correct Supabase tables only once.
  - [ ] Account creation completes.
  - [ ] Enrollment and binder creation complete where required.
  - [ ] Admin can open, review, update, approve/reject, and audit each submission.
  - [ ] LMS assignment occurs after the correct approval/enrollment event.

## P1 — Authentication / portal access

- [ ] Complete login/role audit across Marketing, LMS, and Admin.
- [ ] Confirm one valid admin identity can access every authorized portal without role-loop, 403, or 404 failures.
- [ ] Apply centralized admin override consistently to lower-level role guards.
- [ ] Verify session behavior across `www.`, `app.`, and `admin.` subdomains.
- [ ] Verify redirects preserve the intended destination for apprentice, host shop, employer, workforce, instructor, program-holder, learner, and admin portals.
- [ ] Verify password reset and magic-link flows for each specialized portal.
- [ ] Inspect `/employer/dashboard` specifically and make its authentication behavior consistent with Student, Apprentice, Parent, Host Shop, and Workforce routes.
- [ ] Ensure employer routes do not depend only on client-side hydration to enforce access.

## P1 — Hero banners / visual system

- [ ] Audit every Marketing hero for canonical responsive sizing.
- [ ] Fix undersized, oversized, stretched, cropped, or overlapping hero media.
- [ ] Ensure Store hero/video does not skip or overlap slides.
- [ ] Once a hero video starts, scrolling away must not stop it before completion.
- [ ] Hero video/audio must stop immediately on route change/unmount.
- [ ] Remove duplicate hero implementations and route pages through the shared hero system.
- [ ] Verify mobile and desktop heights against the page-design standard.

## P1 — Contrast / accessibility

- [ ] Run a full low-contrast audit across Marketing, Store, LMS, and Admin.
- [ ] Replace low-contrast `text-slate-400`/light-brand text where it fails WCAG contrast on white/light backgrounds.
- [ ] Verify dark Store sections use readable text and button contrast.
- [ ] Verify focus states, disabled states, error states, and helper text remain readable.
- [ ] Verify hero micro-labels, Store badges, cards, tabs, and demo controls meet contrast requirements.
- [ ] Remove semantic duplicate announcement text from the homepage marquee.
  - Keep visual repetition for animation if needed.
  - Mark duplicated animation-only content appropriately so screen readers/crawlers do not receive the same announcement sequence twice.

## P1 — Store sales / conversion audit

- [ ] Rewrite Store from a catalog into a buyer-oriented sales experience.
- [ ] Every major product must clearly state:
  - who it is for;
  - what problem it solves;
  - what outcome the buyer gets;
  - what Elevate replaces;
  - what makes Elevate different from a standalone product;
  - what happens after the buyer clicks Start / Trial / Buy.
- [ ] Expand descriptions for Website Builder, CRM, booking, forms, email, SMS, invoicing, SEO, Marketing Autopilot, AI assistants, Course Builder, Course Factory, LMS, Student Management, Testing Center, Workforce, Apprenticeship, Employer Portal, Compliance, SAM.gov Manager, Grants Discovery, Dev Studio, Workflow Studio, integrations, and licensing.
- [ ] Use one authoritative sales-positioning source so product cards and detail pages do not drift.

## P1 — Store demos

- [ ] Every demo must show benefits, not just screens/features.
- [ ] Add a visible `Business benefit` section to each demo.
- [ ] Add a visible `Why Elevate is different` section to each demo.
- [ ] Add a visible `What it can replace` section to each demo.
- [ ] Identify the target buyer for each demo.
- [ ] Keep interactive demo actions isolated from production data.
- [ ] Verify videos stop when switching demo tabs or navigating away.
- [ ] Make narrated demos explain the business value while showing the workflow.

## P1 — Website Builder / guided AI flow

- [ ] Fix mismatch between Store `ZeroCodeSetup` and the authenticated Website Builder.
  - Store currently generates `?setup=guided&...` query parameters.
  - The protected Website Builder does not currently consume that context.
- [ ] Carry guided setup answers through login/trial and into the AI Website Builder.
- [ ] Default first-time users to the PARIS AI-guided interview, not the manual blank-site path.
- [ ] Keep `Start manually` as a secondary/advanced option only.
- [ ] Make the AI workflow visibly progressive: interview → generation → live preview → refine → publish.
- [ ] Show the real generated/open-source preview while AI is building rather than synthetic placeholder progress.
- [ ] Verify AI generation persists the generated configuration and opens the exact generated draft.
- [ ] Ensure manual editing, AI generation, import, preview, domain, and publish all operate on one Website Builder implementation.

## P1 — Store commerce / checkout

- [ ] Function-test the full Store checkout path end to end.
- [ ] Verify every Store CTA routes to a real sellable product, trial, or explicit enterprise/contact path.
- [ ] Verify cart → checkout → Stripe → webhook → order/license/subscription/enrollment completion.
- [ ] Confirm no Store form posts to a missing API route.
- [ ] Remove any legacy/manual card-entry UI that bypasses the canonical Stripe flow.
- [ ] Verify tax behavior matches current business requirements and canonical pricing rules.
- [ ] Verify trial provisioning and existing-subscription handling.

## P1 — SEO / legacy contamination

- [ ] Remove unresolved template variables from all public/indexable metadata and content.
  - Search for literal `${PLATFORM_DEFAULTS.orgName}` and related unresolved template strings.
  - Audit Store metadata, Community Services metadata, old contract pages, training-provider templates, and legacy content factories.
- [ ] Add a valid primary-domain `/robots.txt`.
- [ ] Explicitly define crawler policy for Marketing, Admin, LMS, legacy routes, previews, demos, and private application/admin pages.
- [ ] Ensure sitemap contains only canonical public routes.
- [ ] Add `noindex` to Admin/LMS/private application surfaces that should not appear in search.
- [ ] Delete or redirect obsolete `/videos/*` landing pages and other stale indexed content.
- [ ] Verify canonical URLs and redirects with a crawler after cleanup.

## P1 — Organization locations / address taxonomy

- [ ] Create one authoritative organization-location registry.
- [ ] Explicitly classify every location as one of:
  - legal/administrative address;
  - enrollment office;
  - instructional/training location;
  - appointment-only office;
  - partner/host-site location.
- [ ] Reconcile `120 E Market St, Suite 930, Indianapolis, IN 46204` with `8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240` using explicit labels instead of allowing both to appear as an undefined “main” address.
- [ ] Ensure About, Contact, Locations, maps, footer, structured data, and program pages use the correct address type.
- [ ] Audit `Supersonic Fast Cash - Main` and remove/replace any placeholder-looking `(317) 555-0300` number unless independently verified as intentional and legitimate.
- [ ] Remove other 555/test/placeholder contact values from public pages.

## P1 — Claims / evidence / public credibility

- [ ] Audit every quantitative and testimonial claim before production certification.
- [ ] Verify the public `90%+ credential pass rate` claim against supporting records.
- [ ] Verify Careers claims such as `100% Free with WIOA`, `50+ Employer Partners`, and specific employee-benefit claims.
- [ ] Verify named WIOA success stories, wages, life histories, and testimonials have real supporting records and appropriate releases.
- [ ] Verify Success Stories page narratives and outcomes.
- [ ] If evidence/releases are unavailable, convert examples to clearly labeled illustrative examples or remove the claim.
- [ ] Maintain a claims registry linking each public claim to its authoritative evidence source.

## P2 — Marketing / content integrity

- [ ] Continue consolidation of duplicate public pages and parallel routes.
- [ ] Remove stale/deprecated content from search indexing.
- [ ] Confirm every program has one canonical hero, one canonical CTA path, and one authoritative program record.
- [ ] Remove duplicate images and repeated hero artwork across program pages.
- [ ] Verify current organization address, phone, legal name, approvals, and partner facts globally.
- [ ] Preserve the stronger current individual program pages while eliminating old indexed variants.
- [ ] Keep Barber’s current `2,000 OJL + 144 RTI` structure canonical unless the authoritative apprenticeship record changes.

## Deep-audit priority order

1. [ ] Centralize program/funding data.
2. [ ] Fix Admin server-side authorization.
3. [ ] Fix category-page SSR for Healthcare, Skilled Trades, Business, and Technology.
4. [ ] Normalize address/location records with explicit location taxonomy.
5. [ ] Delete/redirect legacy templates, unresolved metadata, stale routes, and indexed placeholders.
6. [ ] Verify the complete application transaction: public application → Supabase → account → identity → documents → enrollment/binder → Admin review → LMS assignment.
7. [ ] Test Employer/LMS authentication consistency.
8. [ ] Complete SEO cleanup: robots, sitemap, canonical URLs, private-route noindex, metadata, redirects, and crawl verification.

## Production verification gate

Do not mark the platform production-clean until all of the following pass together:

- [ ] Marketing smoke test
- [ ] Canonical program/funding consistency test
- [ ] Program category SSR/indexability test
- [ ] LMS authenticated smoke test
- [ ] Employer dashboard authentication test
- [ ] Admin anonymous-route denial test
- [ ] Admin authenticated CRUD/API smoke test
- [ ] Studio workflow create/run/log/deploy test
- [ ] Application submit/upload/review test
- [ ] Identity/enrollment/binder creation verification
- [ ] Store trial and checkout test
- [ ] Website Builder AI-guided create/preview/publish test
- [ ] Cross-subdomain authentication test
- [ ] Hero/media lifecycle test
- [ ] Accessibility/contrast sweep
- [ ] Canonical route / stale-content crawl
- [ ] Robots/sitemap/noindex verification
- [ ] Organization location registry consistency test
- [ ] Public claims/evidence review
- [ ] Repeated health checks with no intermittent 500/503 responses

## Exit criteria

Target condition: one canonical route per feature, one authoritative Program + Funding source, one authoritative organization/location registry, one authoritative partner record per host site, one authentication model with server-side enforcement, one Studio control plane, one Website Builder, one Course Builder, no unresolved template variables, no placeholder organization data, no private Admin/LMS UI in search results, no intermittent 5xx responses, and all critical mutations verified against production-backed data paths before release certification.

---

## Internal GitHub + Supabase production audit addendum

This addendum records the deeper internal findings from the connected GitHub repository and live production Supabase project. The dashboard problem is no longer primarily missing UI. Most major dashboards are real. The current risk is that several dashboards depend on competing, empty, stale, or unsynchronized data models while the authentication and database-security layers still require production hardening.

### Internal readiness snapshot

| Subsystem | Internal assessment | Main blocker |
| --- | --- | --- |
| Marketing | 6.5–7/10 | Source-of-truth cleanup and legacy/indexing issues |
| Student LMS dashboard | ~6/10 | Progress sources disagree |
| Host Shop dashboard | ~6/10 | OJT calculation reads the wrong/empty projection |
| Employer dashboard | ~5.5/10 | Apprenticeship KPI reads an empty legacy table |
| Admin operational layer | ~5.5/10 | Queue integrity, metric-failure semantics, permissions |
| Studio Workflows | ~4/10 operationally | Real engine, but active workflows have no enabled steps |
| Database / security | ~4/10 | Broad privileged RPC execution, RLS/policy/security-advisor findings |

## P0 — Session stability / Supabase Auth

- [ ] Fix the Admin/LMS Supabase refresh-token race before other authenticated feature work.
  - Investigate repeated HTTP `429` refresh-token rate-limit responses from Admin and LMS.
  - Investigate `refresh_token_already_used` warnings.
  - Identify concurrent refresh calls from middleware, server components, browser clients, parallel requests, or multiple auth helpers.
  - Ensure only the intended layer refreshes the session.
  - Ensure refreshed Supabase cookies are propagated onto the outgoing response, not only mutated in request context.
  - Test multiple browser tabs and concurrent requests without a refresh storm.
  - Verify dashboards do not randomly log out, oscillate between authenticated/unauthenticated state, or repeatedly retry session refresh.
  - Add telemetry for refresh attempts, 429s, session invalidation, and refresh-token reuse.

## P0 — Supabase SECURITY DEFINER / RPC hardening

- [ ] Review every `SECURITY DEFINER` function flagged by the Supabase Security Advisor.
- [ ] Revoke unnecessary execution from `PUBLIC` / `anon`.
- [ ] Revoke unnecessary broad execution from `authenticated` where role-scoped access is required.
- [ ] Explicitly grant execution only to the roles/services that require each privileged operation.
- [ ] Verify every remaining callable privileged RPC performs its own authorization checks where appropriate.
- [ ] Prioritize functions equivalent to:
  - `approve_application_atomic`;
  - `approve_application_and_grant_access_atomic`;
  - `advance_application_state`;
  - `admin_approve_progress_entries`;
  - `approve_and_provision_program_holder`;
  - `rpc_approve_partner`;
  - `rpc_enroll_student`;
  - `publish_course`;
  - `complete_enrollment_payment`;
  - `suspend_license`;
  - `schema_inspect`;
  - `get_table_columns`;
  - `get_table_indexes`;
  - `get_table_policies`;
  - `get_view_def`.
- [ ] Add regression tests proving anonymous users cannot invoke privileged state-changing or schema-inspection RPCs.
- [ ] Review mutable function `search_path` findings and pin safe search paths.
- [ ] Review `vector` and `pg_net` exposure in the public schema and move/restrict where appropriate.
- [ ] Resolve MFA/security-advisor authentication recommendations appropriate for Admin and other privileged users.

## P0 — RLS / database policy gaps

- [ ] Add and test the required policy for `workone_progress_updates` if RLS is enabled and the table is meant to be used.
- [ ] Audit all RLS-enabled tables for `enabled but no policy` conditions.
- [ ] Verify service-role operations are separated from user-scoped operations.
- [ ] Test anonymous, learner, employer, host-shop, workforce, staff, admin, and service-role access against sensitive tables.

## P0 — Repair live Postgres failures

- [ ] Fix the scheduled `auto_clock_out_if_needed(15)` invocation.
  - Confirm the actual function signature expects a UUID apprentice/hour-entry identifier.
  - Replace the invalid integer invocation with the correct cron strategy and parameter source.
  - Verify the scheduled job executes successfully in production.
- [ ] Resolve the code/schema mismatch referencing nonexistent `funding_options.type`.
- [ ] Repair current permission failures involving:
  - `program_enrollments`;
  - `program_completion_certificates`;
  - `program_pricing`;
  - `employment_outcomes`;
  - `job_postings`;
  - `site_settings`;
  - `is_super_admin`.
- [ ] Add error-rate monitoring so repeated Postgres permission/schema errors are visible as production incidents rather than silent dashboard degradation.

## P0 — Canonical dashboard data model

- [ ] Define one authoritative model for Student progress.
  - Current production counts observed in the audit: `program_enrollments = 19`, `course_enrollments = 14`, `student_enrollments = 1`.
  - Current lesson model observed: `course_lessons = 345`, `program_lessons = 264`, `lesson_progress = 0`.
  - Program enrollment progress values can be greater than zero while lesson-derived components still report zero completed lessons.
  - Decide whether authoritative progress is computed from lesson completion, stored enrollment progress, or a synchronized projection.
  - Remove dashboard logic that treats program enrollments and course enrollments interchangeably without an explicit domain rule.
  - Add reconciliation tests so learner progress cannot disagree between dashboard widgets.

- [ ] Define one authoritative model for Host Shop OJT progress.
  - Current production counts observed: `apprentice_placements = 2`, `hour_entries = 40`, `ojt_placements = 0`.
  - The Host Shop dashboard currently depends on `ojt_placements` and can display zero OJT progress despite recorded hours.
  - Choose one design:
    - aggregate approved `hour_entries` directly; or
    - maintain `ojt_placements` as a guaranteed synchronized projection.
  - Verify approved/rejected/pending hour semantics and required-hour targets.
  - Test the board with a real placed apprentice and recorded hours.

- [ ] Define one authoritative model for Employer apprenticeship metrics.
  - Current production counts observed: `apprenticeships = 0` versus `apprenticeship_programs = 74`.
  - Stop deriving the employer KPI from an empty/legacy table if `apprenticeship_programs` is authoritative.
  - Verify employer-visible program counts, active apprentices, open positions, placement, and progress metrics against the same apprenticeship domain model.

## P0 — Competing production tables / domain consolidation

- [ ] Produce a canonical-table decision record and migration plan for each duplicated domain.
- [ ] Reconcile current competing production tables observed in the audit:
  - `applications = 508` versus `student_applications = 4`;
  - `program_enrollments = 19` versus `course_enrollments = 14` versus `student_enrollments = 1`;
  - `programs = 82` versus `training_programs = 26` versus `apprenticeship_programs = 74`;
  - `host_shops = 9` versus `shops = 6` versus `apprenticeship_shops = 1`;
  - `hour_entries = 40` versus `apprentice_hours = 2`.
- [ ] For each domain, designate:
  - canonical table;
  - temporary compatibility view/projection if required;
  - deprecated tables;
  - migration/backfill path;
  - write owner;
  - read owner;
  - deletion/archival date.
- [ ] Prevent new code from introducing another parallel table for the same domain.

## P0 — Admin metrics must distinguish zero from failure

- [ ] Change centralized Admin metric loaders so failed queries do not silently become `0`.
- [ ] Represent at least three states:
  - real zero records;
  - valid non-zero count;
  - metric unavailable/query failed.
- [ ] Surface degraded metrics in Admin with an explicit warning and correlation/error reference.
- [ ] Add dashboard health metadata identifying which source query produced each KPI.

## P1 — Admin application queue integrity

- [ ] Reconcile the production application queue.
  - Audit snapshot: `508` total applications.
  - Status distribution observed: `433 submitted`, `57 under review`, `9 approved`, `5 pending admin review`, `2 rejected`, `1 enrolled`, `1 withdrawn`.
  - Approximately 97.4% of records are currently in submitted/under-review/pending-admin-review states.
- [ ] Classify records as current actionable, historical, imported, test, duplicate, withdrawn/abandoned, or superseded.
- [ ] Add age/last-activity indicators to the Admin queue.
- [ ] Add filters for fresh actionable applications versus historical/imported residue.
- [ ] Reconcile `508 applications` against `19 program enrollments` and document expected conversion states.
- [ ] Prevent duplicate application records from inflating operational KPIs.

## P1 — Binder/document reconciliation

- [ ] Reconcile `digital_binders = 235` with `binder_documents = 0`.
- [ ] Identify which table/storage path the current application document flow is actually writing to.
- [ ] Decide whether `binder_documents` is canonical, deprecated, or missing a synchronization/backfill path.
- [ ] Verify each submitted application can resolve its expected binder and uploaded documents from one authoritative relationship.

## P1 — Finish Studio Workflows operationally

- [ ] Treat current workflow infrastructure as implemented but not operationally complete.
- [ ] Production audit observed five active workflows:
  - Certificate Issued Alert;
  - Enrollment Welcome Email;
  - Daily Progress Summary;
  - Exam Booking Confirmation;
  - At-Risk Student Alert.
- [ ] Add real enabled steps to each intended production workflow.
- [ ] Confirm workflow definitions are not empty shells before allowing `active = true`.
- [ ] Execute one controlled workflow end to end through `/api/admin/workflows/run`.
- [ ] Verify `workflow_runs` receives run records.
- [ ] Verify step logs, retries, failures, and dead-letter behavior.
- [ ] Verify Studio UI reflects actual persisted step status and run history.
- [ ] Reconcile `devstudio_jobs` activity with Studio workflow tracking so the distinction between Dev Studio jobs and workflow runs is explicit.

## P1 — Middleware / defense-in-depth consistency

- [ ] Keep page-level `requireRole(...)` protections, but add centralized middleware coverage for all private Admin route families where practical.
- [ ] Ensure a newly added Admin page cannot accidentally become reachable because the developer forgot a page-level guard.
- [ ] Add an automated route-access matrix covering middleware + page/server authorization + API authorization.

## Internal production repair order

1. [ ] Fix Admin/LMS Supabase refresh-token race and session propagation.
2. [ ] Lock down `SECURITY DEFINER` RPC execution, RLS policy gaps, mutable search paths, and privileged-user MFA posture.
3. [ ] Repair live Postgres failures: invalid cron signature, missing column reference, and permission errors.
4. [ ] Unify dashboard sources of truth for Student progress, Host Shop OJT, Employer apprenticeships, and duplicated domain tables.
5. [ ] Finish Studio Workflows with real enabled steps and a controlled end-to-end execution.
6. [ ] Clean/reclassify the Admin application queue and reconcile the application-to-enrollment gap.
7. [ ] Reconcile binders/documents and remaining operational projections.
8. [ ] Then finish SEO, routes, Store, heroes, contrast, and other visual/content cleanup.

## Additional internal production verification gates

Do not certify sensitive administrative operations until all of the following also pass:

- [ ] No Supabase refresh-token 429 storm under normal concurrent browsing.
- [ ] No `refresh_token_already_used` loop during standard Admin/LMS navigation.
- [ ] Privileged RPC execution audit completed and least-privilege grants deployed.
- [ ] `workone_progress_updates` RLS policy state resolved.
- [ ] Supabase Security Advisor critical/high findings reviewed and remediated or explicitly accepted with rationale.
- [ ] Scheduled `auto_clock_out_if_needed` job executes successfully.
- [ ] No recurring production permission/schema errors for the audited tables/functions.
- [ ] Student progress reconciles across all dashboard components.
- [ ] Host Shop OJT hours reflect authoritative approved hours.
- [ ] Employer apprenticeship KPI reads the canonical apprenticeship source.
- [ ] Admin failed metrics render as unavailable, never false zero.
- [ ] Application queue is classified and operationally actionable.
- [ ] Binder/document linkage is verified.
- [ ] At least one Studio workflow creates a persisted run with real step execution and logs.

### Internal exit criterion

Sensitive administrative operations are production-certifiable only when authentication is stable under concurrent requests, privileged database execution follows least privilege, production Postgres jobs run without recurring schema/permission errors, dashboards read one canonical domain model, workflow definitions contain executable steps, and operational KPIs distinguish true zero values from failed queries.