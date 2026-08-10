# Production Readiness TODO — August 9, 2026

This checklist captures the remaining production-readiness work identified from the August 9 live audit across Marketing, LMS, Admin, applications, host shops, and Studio.

## Current assessment

| Surface | Current assessment | Remaining concern |
| --- | --- | --- |
| Marketing | Major improvement | Legacy routes, stale/duplicate data, partner normalization, contrast/hero consistency |
| LMS | Improved | Intermittent 503 risk, stale legacy shell data, authenticated portal verification |
| Admin | Meaningful improvement | Authenticated CRUD/API/workflow verification still required |
| Applications | Major improvement | Must verify submission → Supabase → Admin review end to end |
| Barber / Host Shops | Major improvement | Normalize names, addresses, maps, phones, imagery, and canonical data source |
| Duplication / Data integrity | Not finished | Competing public routes and inconsistent records remain |

## P0 — Production blockers

- [ ] Eliminate intermittent LMS `503 Service Unavailable` behavior.
  - Confirm container health and restart history.
  - Verify `/lms/dashboard` repeatedly under load and after deployments.
  - Confirm health checks point at the correct LMS runtime and port.
  - Confirm no stale/unhealthy upstream remains in the active Northflank service.

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

- [ ] Normalize Host Site / Host Shop records from one authoritative data source.
  - [ ] `Salon Saloon LLC` / `Salon Saloon` — remove `Salon Salon LLC` typo and `South, Bend` formatting.
  - [ ] `Style and Scissor Salon` — remove `Style and Scissors Salon` naming drift.
  - [ ] `Generations Hair LLC` — resolve public address conflict between `134 N Sycamore St` and `2005 Deer Lake Dr` against the authoritative partner record.
  - [ ] Every shop must have normalized legal name, DBA, address, city/state/ZIP, phone when verified, map/directions, website/social/booking links, and apprenticeship relationship.
  - [ ] One media policy per shop; no duplicate or canceled images.

- [ ] Authenticated application function test.
  - [ ] Student application submits successfully.
  - [ ] Barber application submits successfully.
  - [ ] Transfer-hour evidence upload persists.
  - [ ] Host Site application submits successfully.
  - [ ] Business/shop license upload persists.
  - [ ] Liability insurance COI upload persists.
  - [ ] Workers' compensation certificate/exemption upload persists.
  - [ ] Supervisor professional license upload persists.
  - [ ] EIN verification / W-9 upload persists.
  - [ ] Submitted records appear in the correct Supabase tables only once.
  - [ ] Admin can open, review, update, approve/reject, and audit each submission.

## P1 — Authentication / portal access

- [ ] Complete login/role audit across Marketing, LMS, and Admin.
- [ ] Confirm one valid admin identity can access every authorized portal without role-loop, 403, or 404 failures.
- [ ] Apply centralized admin override consistently to lower-level role guards.
- [ ] Verify session behavior across `www.`, `app.`, and `admin.` subdomains.
- [ ] Verify redirects preserve the intended destination for apprentice, host shop, employer, workforce, instructor, program-holder, learner, and admin portals.
- [ ] Verify password reset and magic-link flows for each specialized portal.

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

## P2 — Marketing / content integrity

- [ ] Continue consolidation of duplicate public pages and parallel routes.
- [ ] Remove stale/deprecated content from search indexing.
- [ ] Confirm every program has one canonical hero, one canonical CTA path, and one authoritative program record.
- [ ] Remove duplicate images and repeated hero artwork across program pages.
- [ ] Verify current organization address, phone, legal name, approvals, and partner facts globally.

## Production verification gate

Do not mark the platform production-clean until all of the following pass together:

- [ ] Marketing smoke test
- [ ] LMS authenticated smoke test
- [ ] Admin authenticated CRUD/API smoke test
- [ ] Studio workflow create/run/log/deploy test
- [ ] Application submit/upload/review test
- [ ] Store trial and checkout test
- [ ] Website Builder AI-guided create/preview/publish test
- [ ] Cross-subdomain authentication test
- [ ] Hero/media lifecycle test
- [ ] Accessibility/contrast sweep
- [ ] Canonical route / stale-content crawl
- [ ] Repeated health checks with no intermittent 500/503 responses

## Exit criteria

Target condition: one canonical route per feature, one authoritative data source per business record, one authentication model, one Studio control plane, one Website Builder, one Course Builder, no legacy organization data, no intermittent 5xx responses, and all critical mutations verified against production-backed data paths before release certification.
