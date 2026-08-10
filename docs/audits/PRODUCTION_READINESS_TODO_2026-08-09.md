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
