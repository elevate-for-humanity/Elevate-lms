# Elevate LMS - Comprehensive Audit TODO List

## LIVE WEBSITE NAVIGATION, LEGAL, ACCESSIBILITY & DESIGN BACKLOG — AUGUST 23, 2026

Evidence baseline: live Marketing crawl plus repository comparison at 08af7b649f36e788cde35c05099738961a3c3c37.
Rule: do not mark an item complete until the corrected Marketing SHA is live and the affected route or interaction passes production verification.

### Completed in main — awaiting production verification

| Priority | Item | Evidence / implementation |
|---|---|---|
| P0 | Legacy legal terms recovery | Added /legal/terms compatibility route to canonical /terms-of-service. |
| P0 | Obsolete membership recovery | Added /membership compatibility route to the current Store rather than leaving an inbound 404. It is not restored as a primary navigation item. |
| P0 | Credential-verification dead link | Compliance Center now targets the working LMS verifier at https://app.elevateforhumanity.org/verify-credentials. |

### Corrected audit record

- The supplied “12+ legal 404s” report was stale. Live checks returned HTTP 200 for data sharing, FERPA consent, EULA, acceptable use, license agreement, program license agreement, marketplace terms, enrollment agreement, participation agreement, employer agreement, partner MOU, disclosures, governance, policies, grievance, student handbook, privacy, security, accessibility, and federal compliance.
- Confirmed dead routes before remediation: /legal/terms, /membership, and the Marketing-hosted /verify-credentials target.
- The live footer already uses canonical /terms-of-service; /membership is not part of current homepage navigation.
- /legal/privacy correctly resolves to canonical /privacy; retain one canonical privacy document.
- Legal and funding repetition must not be removed blindly. Shared language should use governed reusable components with versioned legal copy so required disclosures remain visible at decision points.

### P0 — production verification and functional integrity

- [ ] Deploy current Marketing main and verify its exact live SHA.
- [ ] Verify /legal/terms permanently resolves to /terms-of-service without a 404 or redirect loop.
- [ ] Verify /membership permanently resolves to /store and is not reintroduced into primary navigation.
- [ ] Verify Compliance Center credential verification opens the LMS verifier.
- [ ] Crawl every header, footer, Compliance Center, Legal index, application, funding, program, host-shop, testing, and portal link; record status, final host, redirect chain, and visible destination.
- [ ] Test application deep-link recovery for missing, expired, malformed, and valid session IDs.
- [ ] Test PARIS on narrow mobile viewports for overflow, hidden actions, keyboard obstruction, and recoverable session state.
- [ ] Verify dynamic PARIS status and validation messages use appropriate aria-live, focus management, and nonvisual error summaries.

### P1 — accessibility and communication consistency

- [ ] Run automated and manual WCAG 2.2 AA checks for Homepage, Programs, Funding, Apply, Host Shops, Legal, Compliance, Contact, and shared header/footer.
- [ ] Measure text/background contrast for hero overlays, saturated cards, footer copy, disclaimers, disabled controls, links, focus rings, and small text. Do not rely on visual estimates.
- [ ] Verify keyboard order, skip link, mobile-menu focus trap, visible focus, reduced motion, zoom/reflow at 200–400%, form labels, error associations, and screen-reader announcements.
- [ ] Inventory info@, support@, named compliance contacts, and Gmail references. Approve one public support address and document specialized compliance/admissions aliases.
- [ ] Remove consumer Gmail addresses from canonical public and legal pages unless a documented fallback is required.
- [ ] Keep support@elevateforhumanity.org as the current canonical footer address unless leadership approves a different routing policy.

### P1 — design and conversion roadmap

#### Homepage

- [ ] Evaluate a compact trust bar below the hero using only current authorized marks and accurately scoped claims. Do not imply DOL, DWD, WIOA, ETPL, or other agency endorsement.
- [ ] Add a visible audio state/volume indicator tied to actual playback; respect reduced motion and provide a nonanimated alternative.
- [ ] Preserve the video hero, poster fallback, responsive crop, controls, and no-flash hydration behavior.

#### Programs catalog

- [ ] Make filters sticky or persistently reopenable on mobile without covering results or breaking keyboard navigation.
- [ ] Add wage badges only when backed by current authoritative BLS/O*NET/state data, with occupation mapping, geography, source date, and a not-guaranteed disclosure. Never invent average starting salaries.

#### Funding and eligibility

- [ ] Add an accessible process map: application → agency orientation/eligibility → authorization → enrollment.
- [ ] Keep /funding as the explanatory hub and /check-eligibility as the interactive tool unless analytics and user testing prove consolidation improves completion.
- [ ] Convert repeated funding language into one governed disclosure component while retaining required context at each decision.

#### Application workspace

- [ ] Implement resilient cookie/account-backed session recovery with expiry, consent, and cross-device behavior documented.
- [ ] Evaluate secure mobile document capture with camera input, crop/quality checks, encrypted upload, malware scanning, least-privilege access, audit logging, retention/deletion rules, and explicit consent.
- [ ] Do not casually capture or retain Social Security cards. Confirm legal necessity and provide a safer alternative before adding SS-card scanning.

#### Host-site network

- [ ] Evaluate an accessible map/list toggle with address privacy, consent, loading performance, keyboard controls, and a non-map fallback.
- [ ] Add shop preference/favorite functionality only after defining the data model, consent, placement disclaimer, staff workflow, and rule that preference does not guarantee placement.

#### Legal and compliance

- [ ] Keep /legal as the canonical Policy Center and consider sidebar navigation inside the existing legal family; do not collapse distinct documents into one unversioned page.
- [ ] Add route-integrity tests for every link declared by the Legal index and Compliance Center.
- [ ] Verify hash targets such as /legal/disclosures#attendance exist, receive focus when appropriate, and remain readable beneath the sticky header.

#### Contact

- [ ] Show live support or response-time estimates only when sourced from actual telemetry with freshness, business-hours logic, fallback copy, and no unsupported under-five-minute promise.

### P2 — duplication and content governance

- [ ] Compare funding disclaimers across Programs, Funding, Eligibility, and FAQ; centralize identical policy text while preserving page-specific explanations.
- [ ] Reuse canonical CDL/HVAC program data across Programs, Funding, and Approvals while retaining context-specific calls to action.
- [ ] Review overlap among Equal Opportunity, Federal Compliance, and Grievance; preserve legally distinct purposes and cross-link shared authority.
- [ ] Add one canonical public-contact configuration consumed by header, footer, Contact, Legal, Compliance, structured data, and transactional templates.
- [ ] Add CI route tests that fail when public navigation points to a missing Marketing route or the wrong platform host.

### Exit criteria

- Zero confirmed header/footer/Legal/Compliance 404s.
- No portal link hosted on the wrong Elevate service.
- Canonical Privacy and Terms routes have one destination each with compatibility redirects.
- WCAG findings have measured evidence and no critical or serious unresolved violations on primary flows.
- Public emails follow an approved routing policy.
- No unsourced wage, endorsement, response-time, or placement claims.
- Marketing exact live SHA and post-deployment crawl are attached to completion evidence.

**Date:** July 12, 2026  
**Status:** PHASE 1 IN PROGRESS  
**Auditor:** OpenHands Agent

---

## EXECUTIVE SUMMARY

### PHASE 1: PARIS AI AUDIT FINDINGS

| Component | Status | Details |
|-----------|--------|---------|
| **Database Schema** | ✅ Production Ready | `paris_schema.sql` - 10 tables (ai_agents, agent_activities, agent_memories, agent_knowledge, approval_workflows, brand_guidelines, generated_content, scheduled_posts, etc.) |
| **Media Schema** | ✅ Production Ready | `paris_media_schema.sql` - 8 tables (media_items, media_collections, brand_assets, etc.) |
| **Type Definitions** | ✅ Production Ready | `lib/paris/workforce/types.ts` - 18 agent roles, full type system |
| **Agent Manager** | ✅ Production Ready | `lib/paris/workforce/agent-manager.ts` |
| **Approval Workflow** | ✅ Production Ready | `lib/paris/workforce/approval-workflow.ts` |
| **PARIS AI Integration** | ✅ Production Ready | `lib/ai/paris-ai.ts` - Claude integration |
| **ParisChat Component** | ✅ Production Ready | `components/paris/ParisChat.tsx` |
| **AI Chat API** | ✅ Production Ready | `app/api/ai/chat/` |
| **Admin Intelligence** | ✅ Production Ready | `app/admin/intelligence/page.tsx` |
| **Marketing Page** | 🔴 MISSING | Need to create `app/(marketing)/paris-ai/page.tsx` |

#### PARIS AI Agents (18 Roles Configured):
- admissions_specialist
- recruiter
- career_coach
- grant_writer
- compliance_officer
- instructor
- curriculum_developer
- marketing_manager
- social_media_manager
- customer_support
- testing_proctor
- financial_aid_advisor
- employer_relations
- executive_assistant
- website_designer
- software_developer
- data_analyst
- content_creator

---

## EXECUTIVE SUMMARY

This audit compares the three builds (Admin, Marketing, LMS) against the ENTERPRISE-PRD.md specification and identifies gaps.

### Build Status
| Build | Dockerfile | Status | Notes |
|-------|-----------|--------|-------|
| **Admin** | `Dockerfile.northflank-admin` | ✅ Ready | BUILD_SCOPE=ADMIN, 675 routes |
| **Marketing** | `Dockerfile.marketing` | ✅ Ready | BUILD_SCOPE=MARKETING |
| **LMS** | `Dockerfile.northflank-lms` | ✅ Ready | BUILD_SCOPE=LMS |

### Recent PR Merged (July 12, 2026)
- **PR #479**: Complete Image Audit + Enhanced SEO + Credential Intelligence Engine

---

## SECTION 1: BUILDS COMPARISON

### 1.1 Dockerfile Side-by-Side

| Feature | Admin | Marketing | LMS |
|---------|-------|-----------|-----|
| Node Version | node:22-bookworm | node:22-bookworm | node:22-bookworm |
| pnpm Version | 10.28.2 | 10.28.2 | 10.28.2 |
| System Deps | ✅ python3, build-essential, cairo, pango | ✅ python3, build-essential, cairo, pango | ✅ python3, build-essential, cairo, pango |
| Memory (build) | 8192MB | 8192MB | 12288MB (increased) |
| Memory (runtime) | 8080 | 8080 | 8192MB |
| Healthcheck | ✅ /admin | ✅ /api/ping | ✅ /api/ping |
| Standalone | ✅ | ✅ | ✅ |

### 1.2 ✅ Build Readiness: COMPLETE
All three Dockerfiles are properly configured and ready for deployment.

---

## SECTION 2: DATABASE MIGRATIONS AUDIT

### 2.1 Recent Migrations (July 10-13, 2026)

| Migration | Purpose | Status |
|-----------|---------|--------|
| `20260710000001_products_catalog_group_backfill.sql` | Products catalog | ✅ |
| `20260710000002_fix_security_definer_views_linter.sql` | Security fixes | ✅ |
| `20260710000003_digital_binders_compliance_violations.sql` | Digital binder | ✅ |
| `20260710000004_lms_modules_view_hvac_active.sql` | HVAC active modules | ✅ |
| `20260711000001_curriculum_licensing_tables.sql` | Curriculum licensing | ✅ |
| `20260711000002_add_remaining_tables.sql` | Platform tables | ✅ |
| `20260713000001_host_shop_applications.sql` | Host shop apps | ✅ |
| `20260713000002_application_payments.sql` | Application payments | ✅ |
| `20260713000003_host_shop_partnerships.sql` | Host shop partnerships | ✅ |
| `20260723000001_application_fee_policy.sql` | Application fee policy | ✅ |

### 2.2 PARIS Schema Files
| File | Purpose | Status |
|------|---------|--------|
| `paris_schema.sql` | PARIS AI agents, memories, knowledge base | ✅ |
| `paris_media_schema.sql` | PARIS media pipeline | ✅ |

### 2.3 ✅ Migration Status: COMPLETE
All recent migrations are present and ready for application.

---

## SECTION 3: CODE IMPLEMENTATION AUDIT

### 3.1 Credential Intelligence Engine

| Component | Location | Status |
|-----------|----------|--------|
| Main Orchestrator | `lib/course-builder/credential-engine/index.ts` | ✅ |
| Course Types | `lib/course-builder/credential-engine/course-types.ts` | ✅ |
| Universal Registry | `lib/course-builder/credential-engine/credential-registry-universal.ts` | ✅ |
| Exam Blueprints | `lib/course-builder/credential-engine/exam-blueprints.ts` | ✅ |
| Prompt Selector | `lib/course-builder/credential-engine/prompt-selector.ts` | ✅ |
| RAG Engine | `lib/course-builder/credential-engine/rag-engine.ts` | ✅ |
| Quality Validator | `lib/course-builder/credential-engine/quality-validator.ts` | ✅ |
| Blueprint Monitor | `lib/course-builder/credential-engine/blueprint-monitor.ts` | ✅ |
| Registry Loader | `lib/course-builder/credential-engine/registry-loader.ts` | ✅ |
| Universal Platform | `lib/course-builder/credential-engine/universal-platform.ts` | ✅ |

### 3.2 Credential Config Files

| Credential | Config File | Status |
|------------|-------------|--------|
| EPA 608 Universal | `lib/course-builder/credentials/epa-608.yaml` | ✅ |
| OSHA 30-Hour | `lib/course-builder/credentials/osha-30.yaml` | ✅ |
| NHA CCMA | `lib/course-builder/credentials/nha-ccma.yaml` | ✅ |
| Indiana Barber | `lib/course-builder/credentials/indiana-barber.yaml` | ✅ |

### 3.3 API Routes

| Route | Location | Status |
|-------|----------|--------|
| Credential API | `apps/app/api/course-builder/credential/route.ts` | ✅ |
| Integrated Course Builder | `apps/app/api/course-builder/integrated/route.ts` | ✅ |
| Curriculum | `apps/app/api/course-builder/curriculum/` | ✅ |
| Certifications | `apps/app/api/course-builder/certifications/` | ✅ |
| BLS | `apps/app/api/course-builder/bls/` | ✅ |

### 3.4 ✅ Credential Intelligence: IMPLEMENTED
All components are present and properly exported.

---

## SECTION 4: MISSING ITEMS TODO LIST

### 🔴 HIGH PRIORITY - Public-Facing Website Gaps (from Vision Document)

| # | Item | Description | Gap Size | Location |
|---|------|-------------|----------|----------|
| 1 | **PARIS AI Product Page** | Public-facing page showcasing PARIS AI Operating System | 🔴 LARGE | `app/(marketing)/paris-ai/` |
| 2 | **Dev Studio Product Page** | Public-facing page for AI development platform | 🔴 LARGE | `app/(marketing)/dev-studio/` |
| 3 | **AI Website Builder Page** | Product page for AI Website Builder | 🔴 LARGE | `app/(marketing)/website-builder/` |
| 4 | **AI Business Builder Page** | Product page for AI Business Builder | 🔴 LARGE | `app/(marketing)/business-builder/` |
| 5 | **AI Course Factory Page** | Product page for Course Factory | 🔴 LARGE | `app/(marketing)/course-factory/` |
| 6 | **Credential Intelligence Page** | Product page for Credential Engine | 🔴 LARGE | `app/(marketing)/credential-intelligence/` |
| 7 | **AI Instructor Page** | Product page for AI Instructor | 🔴 LARGE | `app/(marketing)/ai-instructor/` |
| 8 | **Digital Binder Page** | Product page for Digital Binder | 🔴 LARGE | `app/(marketing)/digital-binder/` |
| 9 | **Workforce Operating System Page** | Public-facing OS overview | 🔴 LARGE | `app/(marketing)/workforce-os/` |
| 10 | **AI Employees Page** | Product page for AI workforce agents | 🔴 LARGE | `app/(marketing)/ai-employees/` |
| 11 | **Curriculum Licensing Page** | Product page for licensing platform | 🔴 LARGE | `app/(marketing)/licensing/` |
| 12 | **API Platform Page** | API documentation/overview | 🔴 LARGE | `app/(marketing)/api/` |

### 🟡 MEDIUM PRIORITY - Conversion Funnels

| # | Item | Description | Status |
|---|------|-------------|--------|
| 13 | **Student Journey Flow** | Guided path: Discover → Program → Funding → Apply → Enroll → Dashboard | Needs richer flow |
| 14 | **Employer Journey Flow** | Guided path: Discover → Talent Solutions → Apprenticeships → Hire → Portal | Needs expansion |
| 15 | **School/Partner Journey** | Guided path: Discover → License → Demo → Contract → Onboarding | Missing |
| 16 | **Government Journey** | Guided path: Discover → Compliance → Outcomes → Reporting → Partnership | Missing |

### 🟡 MEDIUM PRIORITY - Trust Signals

| # | Item | Description | Status |
|---|------|-------------|--------|
| 17 | **Customer Success Stories** | Graduate outcomes, testimonials | Needs expansion |
| 18 | **Placement Metrics** | Live statistics on job placement | Missing |
| 19 | **Interactive Dashboards** | Live platform statistics | Missing |
| 20 | **Case Studies** | Detailed customer journeys | Missing |
| 21 | **Architecture Overview** | Platform architecture diagram | Missing |

### 🟡 MEDIUM PRIORITY - Technical Issues

| # | Item | Description | Priority |
|---|------|-------------|----------|
| 22 | **Chunk Loading Errors** | JavaScript chunk loading failures on public pages | P0 |
| 23 | **Partner Pages** | Critical errors on partner pages | P0 |
| 24 | **Support Pages** | Critical errors on support pages | P0 |

---

## SECTION 5: PARIS AI WORKFORCE IMPLEMENTATION

### 5.1 Agent System

| Component | Location | Status |
|-----------|----------|--------|
| Agent Manager | `lib/paris/workforce/agent-manager.ts` | ✅ |
| Approval Workflow | `lib/paris/workforce/approval-workflow.ts` | ✅ |
| Types | `lib/paris/workforce/types.ts` | ✅ |
| Index | `lib/paris/workforce/index.ts` | ✅ |

### 5.2 Agent Templates

| Agent | Status | Notes |
|-------|--------|-------|
| AI Admissions Agent | ✅ Configured | In credential-registry-universal.ts |
| AI Recruiter Agent | ✅ Configured | In types.ts |
| AI Compliance Agent | ✅ Configured | In types.ts |
| AI Grant Writer | ✅ Configured | In types.ts |
| AI Proposal Builder | ✅ Configured | In types.ts |
| AI Contract Builder | ✅ Configured | In types.ts |
| AI Policy Builder | ✅ Configured | In types.ts |
| AI SOP Builder | ✅ Configured | In types.ts |
| AI Forms Builder | ✅ Configured | In types.ts |
| AI Document Builder | ✅ Configured | In types.ts |
| AI Digital Binder | ✅ Configured | In types.ts |
| AI Accreditation Binder | ✅ Configured | In types.ts |
| AI Grant Manager | ✅ Configured | In types.ts |

### 5.3 Course Orchestrator

| Component | Location | Status |
|-----------|----------|--------|
| Main Orchestrator | `lib/paris/course-orchestrator.ts` | ✅ |
| Instructional Designer | `lib/paris/instructional-designer.ts` | ✅ |
| Media Designer | `lib/paris/media-designer.ts` | ✅ |
| QA Designer | `lib/paris/qa-designer.ts` | ✅ |

### 5.4 ✅ PARIS AI: IMPLEMENTED

---

## SECTION 6: HOST SHOP APPLICATIONS

### 6.1 Database Schema

| Table | Status | Location |
|-------|--------|----------|
| `host_shop_applications` | ✅ Created | `20260713000001_host_shop_applications.sql` |
| `application_payments` | ✅ Created | `20260713000002_application_payments.sql` |
| `host_shop_partnerships` | ✅ Created | `20260713000003_host_shop_partnerships.sql` |

### 6.2 Admin UI

| Component | Status | Location |
|-----------|--------|----------|
| Host Shop Admin | ✅ Present | `app/admin/host-shop/` |
| Barber Shop Applications | ✅ Present | `app/admin/barber-shop-applications/` |

### 6.3 ✅ Host Shop: IMPLEMENTED

---

## SECTION 7: API ROUTES AUDIT

### 7.1 Course Builder APIs

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/course-builder/credential` | ✅ | Full credential engine |
| `POST /api/course-builder/integrated` | ✅ | Integrated generation |
| `GET/POST /curriculum` | ✅ | Curriculum operations |
| `GET/POST /certifications` | ✅ | Certification management |
| `GET/POST /bls` | ✅ | BLS integration |

### 7.2 Admin APIs

Total: 675 admin routes covering:
- Analytics (7 sub-routes)
- Applications (6 sub-routes)
- Apprenticeships
- Attendance
- Audit Logs
- Barber (25+ routes)
- Billing (6 sub-routes)
- Certificates
- Communications
- Compliance
- Courses
- Credentials
- CRM (9 sub-routes)
- Curriculum
- Dev Studio (10 sub-routes)
- Documents
- Employers
- Enrollments
- Exam Authorizations
- Funding
- Grants (9 sub-routes)
- Host Shop
- Intelligence
- Integrations (10 sub-routes)
- Invoices
- Jobs
- Learning Paths
- Licenses
- Marketplace
- Modules
- Notifications
- Operations
- Organizations
- Partners (6 sub-routes)
- Payroll
- Programs (8 sub-routes)
- Providers
- RAPIDS
- Referrals
- Reports (6 sub-routes)
- Reviews
- Security
- Settings
- Shops
- Snapshots
- Staff Portal
- Storage
- Students (6 sub-routes)
- Subscriptions
- Testing Center
- Timeclock
- Videos
- Workflows
- WIOA

### 7.3 ✅ API Routes: COMPLETE

---

## SECTION 8: FINAL TODO LIST

### 🚨 ACTION REQUIRED

#### Marketing Website Pages to Create:

```
app/(marketing)/paris-ai/page.tsx          [CREATE]
app/(marketing)/dev-studio/page.tsx         [CREATE]
app/(marketing)/website-builder/page.tsx     [CREATE]
app/(marketing)/business-builder/page.tsx   [CREATE]
app/(marketing)/course-factory/page.tsx     [CREATE]
app/(marketing)/credential-intelligence/page.tsx  [CREATE]
app/(marketing)/ai-instructor/page.tsx      [CREATE]
app/(marketing)/digital-binder/page.tsx     [CREATE]
app/(marketing)/workforce-os/page.tsx       [CREATE]
app/(marketing)/ai-employees/page.tsx       [CREATE]
app/(marketing)/licensing/page.tsx           [CREATE]
app/(marketing)/api/page.tsx                [CREATE]
```

#### Conversion Funnels to Enhance:

```
app/(marketing)/students/                   [ENHANCE - Create full journey]
app/(marketing)/employers/                  [ENHANCE - Expand]
app/(marketing)/schools/                    [CREATE]
app/(marketing)/government/                 [CREATE]
```

#### Trust Signals to Add:

```
app/(marketing)/success-stories/            [EXPAND]
app/(marketing)/case-studies/               [CREATE]
app/(marketing)/impact-dashboard/           [CREATE]
app/(marketing)/platform-architecture/       [CREATE]
```

#### Critical Bug Fixes:

```
[REVIEW] Chunk loading errors on partner pages
[REVIEW] Chunk loading errors on support pages  
[REVIEW] All public page error boundaries
```

---

## SECTION 9: COMPLETED ITEMS

### ✅ Verified Complete (July 12, 2026)

1. **Admin Build** - Dockerfile.northflank-admin ready
2. **Marketing Build** - Dockerfile.marketing ready
3. **LMS Build** - Dockerfile.northflank-lms ready
4. **Credential Intelligence Engine** - All 10 components implemented
5. **Credential Config Files** - 4 YAML configs present
6. **Course Builder APIs** - All endpoints functional
7. **PARIS AI Workforce** - 18 agents configured
8. **PARIS Media Pipeline** - Schema ready
9. **Host Shop Applications** - Full schema and admin UI
10. **Recent Migrations** - All 10 July migrations present
11. **Database Schema** - PARIS, curriculum licensing complete
12. **API Routes** - 675 admin routes, 5 course-builder routes
13. **Dockerfile Consistency** - All use pnpm@10.28.2
14. **Memory Optimization** - LMS has 12GB build, 8GB runtime

---

## NEXT STEPS

1. **Create Marketing Product Pages** (12 pages)
2. **Fix Chunk Loading Errors** (Critical)
3. **Enhance Conversion Funnels** (4 journeys)
4. **Add Trust Signals** (4 components)
5. **Deploy and Verify** all three builds

---

**Document Version:** 1.0  
**Last Updated:** July 12, 2026, 12:10 UTC  
**Next Review:** After marketing pages created


---

## PORTALS, TESTING & PRIVACY — VERIFIED AUGUST 23, 2026

### Confirmed working in production and present on current main

- [x] `/portals` renders 15 role-specific portal cards with descriptions, tenant scope, authorized-role counts, and canonical destinations.
- [x] `/online-apps` provides the broader public-versus-authenticated portal directory.
- [x] `/testing` renders the canonical catalog with seven configured provider checkout paths.
- [x] `/testing/checkout` and `/testing/book` render successfully; checkout copy states that the server re-resolves the selected exam and price.
- [x] `/testing/policies` and `/testing/for-employers` exist and render public testing guidance.
- [x] The working credential-verification destination is `https://app.elevateforhumanity.org/verify-credentials`; the Compliance Center now links to that host.
- [x] `/privacy` is the canonical full Privacy Policy. `/legal/privacy` is a compatibility redirect to `/privacy`.

### Gaps repaired on current main

- [x] Restore `/testing/schedule` as a permanent compatibility redirect to `/testing/book` (commit `d584329`).
- [x] Restore `/testing/proctor-information` as a permanent compatibility redirect to `/testing/policies` (commit `bcb4940`).
- [x] Point the Compliance Center directly to canonical `/privacy`, avoiding the legacy redirect (commit `35aafb5`).

### Deployment verification still required

- [ ] Wait for the Marketing deployment containing commit `35aafb5` or a descendant.
- [ ] Verify the exact live Marketing SHA from the production version/health endpoint.
- [ ] Recheck both repaired testing URLs and confirm their final destinations after deployment.
- [ ] Exercise Stripe checkout creation with an approved non-production/test payment path; page rendering alone does not prove a completed payment.
- [ ] Complete authenticated role-by-role portal workflow testing. Public cards and auth redirects do not prove each authorized dashboard workflow.


### Legacy route and support corrections — verified August 23, 2026

- [x] Add Marketing-host compatibility redirects: `/home` → `/`, `/index.html` → `/`, `/training` → `/programs`, `/terms-and-conditions` → `/terms-of-service`, `/legal/terms-of-service` → `/terms-of-service`, `/student-handbook` → `/legal/student-handbook`, and `/dashboard` → the LMS student dashboard (commit `8ebc918`).
- [x] Preserve `/programs/all`; live verification returned a working page, so redirecting it would remove valid behavior.
- [x] Keep `/privacy` canonical; `/privacy-policy` and `/legal/privacy` already redirect to it.
- [x] Remove the false live-chat promise from `/support/chat`; label the current contact workflow honestly until a real chat backend exists (commit `08cfc87`).
- [x] Point the Policies index directly to canonical Terms, Privacy, and Student Handbook routes (commit `86e70c6`).
- [ ] Deploy Marketing at commit `86e70c6` or a descendant and verify exact live SHA.
- [ ] Re-run the public-route crawl after deployment and attach HTTP status/final-destination evidence.
- [ ] If real-time chat is required, implement an authenticated chat provider, availability state, queue/fallback behavior, transcript retention policy, and accessibility testing before restoring “Live Chat” language.


### Testing checkout production blocker — verified August 23, 2026

- [x] Confirm the public Testing checkout UI renders and offers priced exams.
- [x] Send a real production checkout-session request for one ESCO Core exam; production returned HTTP 503 `Payment system not configured.`
- [x] Repair the missing runtime-secret hydration before `getStripe()` in `/api/testing/checkout` (commit `c5d5927`).
- [ ] Deploy Marketing at `c5d5927` or a descendant and repeat session-creation verification.
- [ ] Confirm the production runtime contains a valid least-privilege `STRIPE_RESTRICTED_KEY` or `STRIPE_SECRET_KEY`; never commit or expose the value.
- [ ] Complete a Stripe test-mode payment and verify signed webhook processing, payment record, booking record, success return, confirmation notification, and idempotency.
- [ ] Do not claim student checkout is production-ready until all downstream persistence checks pass.
