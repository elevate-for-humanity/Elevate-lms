# Redirect Audit — Elevate LMS (2026-06)

Exhaustive audit of every redirect mechanism in the application, each mapped to its
**final ("chronological") destination**, with redirect chains collapsed and the
live parallel-route divergence resolved.

## Methodology

Redirects exist in four layers. All four were enumerated programmatically
(`redirect-audit*.mjs`) plus manual review of the middleware:

| Layer | Mechanism | Where |
|---|---|---|
| 1. Static config | `redirects()` array (301/308) + image manifest | `next.config.mjs`, `lib/routes/canonical-routes.json` |
| 2. Middleware | `NextResponse.redirect` (host/auth/role/lifecycle) | `proxy.ts` |
| 3. Server | `redirect()` / `permanentRedirect()` from `next/navigation` | `app/**` (725 call sites) |
| 4. Client | `router.push/replace`, `window.location` | `app/**`, `components/**` |

Post-auth landing destinations are centralized in `lib/auth/role-destinations.ts`,
`lib/portal/router.ts`, and `lib/portal/resolve-student-home.ts`.

## Layer 2 — Middleware (`proxy.ts`) redirect rules, in order

| # | Condition | Action | Status |
|---|---|---|---|
| 1 | host `app.elevateforhumanity.org` `/admin*` | rewrite → `/admin/dashboard` (tenant) | rewrite |
| 2 | `/admin` or `/admin/*` on non-admin host | → `${NEXT_PUBLIC_ADMIN_URL}{path}` | 301 |
| 3 | `/student-portal/education*` | → `/learner/dashboard` | 301 |
| 4 | host `elevateforhumanity.org` (apex) | → `https://www.elevateforhumanity.org{path}` | 308 |
| 5 | unknown custom/tenant host | rewrite to tenant site | rewrite |
| 6 | protected/auth route + Supabase env missing | → `/login?redirect=…` (fail-closed) | 307 |
| 7 | protected/auth route + not authenticated | → `/login?redirect=…` | 307 |
| 8 | authenticated + idle > `SESSION_TIMEOUT_MINUTES` | → `/login?redirect=…&reason=idle` | 307 |
| 9 | protected route + role not in `PROTECTED_ROUTES[route]` | → `/unauthorized` | 307 |
| 10 | onboarding-required route + `!onboarding_completed` (non-admin) | → `/onboarding/legal` | 307 |
| 11 | enrollment-required route + terminal enrollment state | → `/unauthorized` | 307 |
| 12 | enrollment-required route + in-progress state | → `/enrollment/{confirmed\|orientation\|documents}` | 307 |
| 13 | partner route + no/!active partner application | → `/partner/{apply\|documents\|onboarding}` | 307 |

Notes: admin namespace is owned by the admin host; the LMS middleware only
canonicalizes it. `redirect` query param is preserved and validated
(`lib/auth/validate-redirect.ts`) before use.

## Post-auth landing map (chronological destination by role)

Single source of truth: `lib/auth/role-destinations.ts` (`getRoleDestination`).
`?redirect=` always wins when present and valid.

| Role | Final destination |
|---|---|
| super_admin / admin / org_admin | `https://admin.elevateforhumanity.org/admin/dashboard` |
| platform_operator | `…/admin/dev-studio` |
| staff | `…/admin/staff-portal/dashboard` |
| instructor | `…/admin/instructor/dashboard` |
| mentor | `/mentor/dashboard` |
| creator | `/creator/products` |
| case_manager | `/case-manager/dashboard` |
| workforce_board | `/workforce-board/dashboard` |
| program_holder | `/program-holder/dashboard` |
| provider_admin | `/provider/dashboard` |
| sponsor / employer | `/employer/dashboard` |
| partner / partner_admin | `/partner/dashboard` |
| grant_client | `/lms/dashboard` |
| student (general) | `/learner/dashboard` |
| student (apprentice, active enrollment) | `/portal/{program}` — barber/cosmetology/esthetician/nail-technician/culinary/electrical/plumbing |
| delegate / unknown | `/learner/dashboard` (fallback) |

Apprentice student resolution order (`resolveStudentHomePath`):
active `program_enrollments.program_slug` → `/portal/{program}` (canonical) →
cached `portal_type` → `/portal/{type}` → `PORTAL_FALLBACK` `/learner/dashboard`.

## Redirect chains found & collapsed (this PR)

9 multi-hop static chains were collapsed so each source now 301s **directly** to
its terminal destination (single hop — better SEO + latency). Intermediate
redirects are retained.

| Source | Was (2 hops) | Now (1 hop) |
|---|---|---|
| `/wioa-training` | → `/wioa-funded-training-indiana` → `/wioa-eligibility` | → `/wioa-eligibility` |
| `/wioa-training-indiana` | → `/wioa-funded-training-indiana` → `/wioa-eligibility` | → `/wioa-eligibility` |
| `/wioa-funded-training` | → `/wioa-funded-training-indiana` → `/wioa-eligibility` | → `/wioa-eligibility` |
| `/programs/wioa` | → `/wioa-funded-training-indiana` → `/wioa-eligibility` | → `/wioa-eligibility` |
| `/programs/wioa-funding` | → `/wioa-funded-training-indiana` → `/wioa-eligibility` | → `/wioa-eligibility` |
| `/programs/construction` | → `/programs/construction-trades-certification` → `/programs/skilled-trades` | → `/programs/skilled-trades` |
| `/programs/drug-test` | → `/programs/drug-collector` → `/programs/drug-alcohol-specimen-collector` | → `/programs/drug-alcohol-specimen-collector` |
| `/governance/security` | → `/disclosures` → `/legal/disclosures` | → `/legal/disclosures` |
| `/legal/agreements` | → `/terms-of-service` → `/legal` | → `/legal` |

Verified after the change: detector reports **0 remaining chains**, and live
`curl` confirms each source returns a single 308 to the final target.

## Parallel routes

### Resolved: apprentice dashboard divergence (this PR)
Two competing dashboards existed for apprentices:
- **Canonical (rich, per-program):** `/portal/{program}` — `ApprenticePortalShell`,
  `SLUG_TO_PORTAL`, the `ApprenticeSubNav` "Dashboard" tab, and
  `tests/unit/portal-routing.test.ts` all use these.
- **Generic hub:** `/apprentice` (+ `/apprentice/*` tools).

The login resolver map (`lib/portal/apprenticeship-portal-paths.ts`) had diverged
to send every apprentice to the generic `/apprentice`, which **failed** the unit
test (`expected '/apprentice' to be '/portal/barber'`) and split login routing
from the rest of the app. Fixed: the resolver map and the cached-`portal_type`
fallback now return the canonical `/portal/{program}`. `/apprentice` remains the
tools hub used during onboarding (pre-active states); the rich per-program
dashboard is the post-login landing for active apprentices.

### Already-consolidated parallel trees (kept as redirects, intentional)
These legacy trees are not duplicate live routes — each 301s to one canonical
target and is retained to preserve inbound links/SEO:
`/employer-portal/* → /employer/*`, `/student* & /student-portal/* → /learner/dashboard`,
`/program-holders/* → /program-holder/*`, `/program-holder-portal/* → /program-holder/*`,
`/partners/{dashboard,portal,hours,…} → /partner/*`, `/client-portal/* → /learner/dashboard`,
`/learners/* → /lms/*`, `/dashboards/* → /lms/*`, `/tax-*/* → /tax/*` (then external),
plus the admin path consolidations (`/admin/leads → /admin/crm/leads`, etc.).

## Risks / recommendations (not changed here)

- `redirect()` to `/login` appears at **254** server call sites and `/unauthorized`
  at **42** — these are page-level auth guards layered on top of `proxy.ts`. They
  are redundant-but-correct; consolidating onto `requireUser()`/guards is the
  documented Phase-2 work (needs test coverage) — out of scope for a redirect audit.
- Cross-host redirects (admin/tax/apex) depend on `NEXT_PUBLIC_ADMIN_URL` and DNS;
  validated against the canonical-host list in `proxy.ts`.
- `window.location` redirects are mostly dynamic (post-payment/enrollment); no
  literal redirect loops detected.

---

## Static redirects summary
- next.config.mjs + canonical-routes.json route redirects: **436**
- of which cross-host/external (admin/tax/r2/apex): **13**
- asset (image/video) redirects: **6**
- conditional (has/missing): **3**

### Cross-host / external static redirects
- `/` -> `https://www.elevateforhumanity.org/`
- `/:path+` -> `https://www.elevateforhumanity.org/:path+`
- `/portal/staff/dashboard` -> `https://admin.elevateforhumanity.org/admin/staff-portal/dashboard`
- `/instructor` -> `https://admin.elevateforhumanity.org/admin/instructor/dashboard`
- `/instructor/:path*` -> `https://admin.elevateforhumanity.org/admin/instructor/:path*`
- `/staff-portal` -> `https://admin.elevateforhumanity.org/admin/staff-portal/dashboard`
- `/staff-portal/:path*` -> `https://admin.elevateforhumanity.org/admin/staff-portal/:path*`
- `/receptionist/:path*` -> `https://admin.elevateforhumanity.org/admin/staff-portal/:path*`
- `/tax` -> `https://www.supersonicfastermoney.com/tax`
- `/tax-self-prep` -> `https://www.supersonicfastermoney.com/tax-self-prep`
- `/admin-portal` -> `https://admin.elevateforhumanity.org/login`
- `/admin-login` -> `https://admin.elevateforhumanity.org/login`
- `/rise` -> `https://www.supersonicfastermoney.com/tax`

### Top server-side redirect() destinations (app/)
total redirect() call sites: 725 (literal-target: 599, dynamic/var: 126)
- `/login` x254
- `/unauthorized` x42
- `/program-holder/onboarding` x21
- `/learner/dashboard` x13
- `${loginUrl}` x13
- `/lms/courses` x11
- `/onboarding/learner` x11
- `/employer/dashboard` x9
- `/lms/courses/${courseId}` x8
- `/partner/dashboard` x8
- `/apprentice` x6
- `/partner/students` x5
- `/portals` x5
- `/programs/barber-apprenticeship/apply/apprentice` x4
- `/apply` x4
- `/admin/dashboard` x4
- `${siteUrl}${fallbackPath}` x4
- `${baseUrl}/store/cart` x4
- `${base}/admin/settings/social-media` x4
- `/programs/${program}` x3
- `/partner/apply` x3
- `/org/create` x3
- `/lms/messages` x3
- `/program-holder/dashboard` x3
- `/apps/grants` x3

### Top client router.push/replace destinations
total: 0 (literal: 0, dynamic: 0)

### Top window.location redirects
total: 185 (literal: 40, dynamic: 145)
- `/login` x14
- `/apply` x2
- `/programs/${programSlug}/enroll/payment` x2
- `${link}` x2
- `/enroll/payment` x2
- `/pay` x1
- `/programs/hvac-technician/apply/success${applicationId ` x1
- `/courses/${courseId}` x1
- `/preview/${config.meta.previewId}` x1
- `/enrollment/${enrollmentId}/wioa-verification` x1
- `/enrollment/${enrollmentId}/scholarship-review` x1
- `/programs/barber-apprenticeship/apply/success` x1
- `/store/add-ons/${productId}` x1
- `/lms/payments/checkout` x1
- `/lms/courses` x1
- `/student/courses/${courseId}` x1
- `/learner/dashboard` x1
- `/api/affirm/capture` x1
- `/onboarding/learner` x1
- `/onboarding/employer` x1

## Appendix — full static redirect table (0 rows)

| Source | → Destination | Perm | Cond | Defined in |
|---|---|---|---|---|
| `/` | `https://www.elevateforhumanity.org/` | 301 | has | next.config |
| `/:path+` | `https://www.elevateforhumanity.org/:path+` | 301 | has | next.config |
| `/about/founder` | `/about/team` | 301 |  | next.config |
| `/acceptable-use-policy` | `/legal/acceptable-use` | 301 |  | next.config |
| `/admin-login` | `https://admin.elevateforhumanity.org/login` | 307 |  | next.config |
| `/admin-portal` | `https://admin.elevateforhumanity.org/login` | 301 |  | next.config |
| `/admin/accreditation/evidence/new` | `/admin/accreditation` | 301 |  | next.config |
| `/admin/applicants` | `/admin/applications` | 301 |  | next.config |
| `/admin/blog/new` | `/admin/blog` | 301 |  | next.config |
| `/admin/campaigns` | `/admin/crm/campaigns` | 301 |  | next.config |
| `/admin/completions` | `/admin/analytics/learning` | 301 |  | next.config |
| `/admin/compliance-audit` | `/admin/compliance` | 301 |  | next.config |
| `/admin/contacts` | `/admin/crm/contacts` | 301 |  | next.config |
| `/admin/copilot` | `/admin/studio` | 301 |  | next.config |
| `/admin/course-builder` | `/admin/studio` | 301 |  | next.config |
| `/admin/course-generator` | `/admin/studio` | 301 |  | next.config |
| `/admin/course-import` | `/admin/studio` | 301 |  | next.config |
| `/admin/course-studio` | `/admin/studio` | 301 |  | next.config |
| `/admin/course-templates` | `/admin/studio` | 301 |  | next.config |
| `/admin/courses/generate` | `/admin/studio` | 301 |  | next.config |
| `/admin/courses/manage` | `/admin/courses` | 301 |  | next.config |
| `/admin/courses/pipeline` | `/admin/studio` | 301 |  | next.config |
| `/admin/curriculum` | `/admin/studio` | 301 |  | next.config |
| `/admin/dight` | `/admin/dashboard` | 301 |  | next.config |
| `/admin/dight/:path*` | `/admin/dashboard/:path*` | 301 |  | next.config |
| `/admin/email-marketing` | `/admin/crm/campaigns` | 301 |  | next.config |
| `/admin/enrollment` | `/admin/students` | 301 |  | next.config |
| `/admin/external-courses` | `/admin/courses` | 301 |  | next.config |
| `/admin/leads` | `/admin/crm/leads` | 301 |  | next.config |
| `/admin/leads/new` | `/admin/crm/leads/new` | 301 |  | next.config |
| `/admin/license` | `/admin/licenses` | 301 |  | next.config |
| `/admin/license-requests` | `/admin/licenses` | 301 |  | next.config |
| `/admin/live-sessions` | `/admin/dashboard` | 301 |  | next.config |
| `/admin/live-sessions/new` | `/admin/dashboard` | 307 |  | next.config |
| `/admin/marketing` | `/admin/crm` | 301 |  | next.config |
| `/admin/media-studio` | `/admin/studio` | 301 |  | next.config |
| `/admin/outcomes` | `/admin/analytics` | 301 |  | next.config |
| `/admin/progress` | `/admin/analytics/learning` | 301 |  | next.config |
| `/admin/quiz-builder` | `/admin/studio` | 301 |  | next.config |
| `/admin/social-media` | `/admin/crm/campaigns` | 301 |  | next.config |
| `/admin/syllabus-generator` | `/admin/studio` | 301 |  | next.config |
| `/admin/users` | `/admin/staff` | 301 |  | next.config |
| `/admin/users/invite` | `/admin/staff` | 301 |  | next.config |
| `/admin/video-generator` | `/admin/studio` | 301 |  | next.config |
| `/admin/video-manager` | `/admin/studio` | 301 |  | next.config |
| `/admin/wioa/documents/upload` | `/admin/wioa/documents` | 301 |  | next.config |
| `/agency-referral-workforce-training` | `/agency-referral-workforce-training-indiana` | 301 |  | next.config |
| `/ai-chat-standalone` | `/ai-chat` | 301 |  | next.config |
| `/ai-instructor` | `/ai-tutor` | 301 |  | next.config |
| `/alumni/:path*` | `/about` | 301 |  | next.config |
| `/apply` | `/programs/barber-apprenticeship/apply` | 301 | has | next.config |
| `/apply/barber` | `/partners/barber-host-shop/apply` | 301 |  | next.config |
| `/apply/barber-apprenticeship` | `/programs/barber-apprenticeship/apply` | 301 |  | next.config |
| `/apply/cosmetology` | `/partners/cosmetology-host-shop/apply` | 301 |  | next.config |
| `/apply/fssa` | `/apply` | 301 |  | next.config |
| `/apply/fssa/success` | `/apply` | 301 |  | next.config |
| `/apply/full` | `/apply/student` | 301 |  | next.config |
| `/apply/impact` | `/apply` | 301 |  | next.config |
| `/apply/quick` | `/apply` | 301 |  | next.config |
| `/apply/start` | `/apply` | 301 |  | next.config |
| `/apprentice/dashboard` | `/apprentice` | 301 |  | next.config |
| `/apprentice/progress` | `/apprentice/hours` | 301 |  | next.config |
| `/auth/forgot-password` | `/reset-password` | 301 |  | next.config |
| `/auth/signin` | `/login` | 301 |  | next.config |
| `/auth/signup` | `/signup` | 301 |  | next.config |
| `/auth/verify-email` | `/verify-email` | 301 |  | next.config |
| `/barber-apprenticeship` | `/programs/barber-apprenticeship` | 301 |  | next.config |
| `/career-fair/:path*` | `/career-services/:path*` | 301 |  | next.config |
| `/career-training-illinois` | `/career-training-indiana` | 301 |  | next.config |
| `/career-training-ohio` | `/career-training-indiana` | 301 |  | next.config |
| `/career-training-tennessee` | `/career-training-indiana` | 301 |  | next.config |
| `/career-training-texas` | `/career-training-indiana` | 301 |  | next.config |
| `/career-uplift-services/:path*` | `/career-services` | 301 |  | next.config |
| `/case-manager` | `/case-manager/dashboard` | 301 |  | next.config |
| `/cert/verify` | `/verify` | 301 |  | next.config |
| `/cert/verify/:id` | `/verify/:id` | 301 |  | next.config |
| `/certificates/verify` | `/verify` | 301 |  | next.config |
| `/certificates/verify/:id` | `/verify/:id` | 301 |  | next.config |
| `/certification` | `/certificates` | 301 |  | next.config |
| `/certifications` | `/certificates` | 301 |  | next.config |
| `/checkout/barber-apprenticeship` | `/programs/barber-apprenticeship/payment-setup` | 301 |  | next.config |
| `/client-portal/:path*` | `/learner/dashboard` | 301 |  | next.config |
| `/cm` | `/case-manager/dashboard` | 301 |  | next.config |
| `/cm/:path*` | `/case-manager/:path*` | 301 |  | next.config |
| `/cm/learners/:id` | `/case-manager/participants/:id` | 301 |  | next.config |
| `/community` | `/community-services` | 301 |  | next.config |
| `/community` | `/contact` | 301 |  | canonical-routes |
| `/community-services-illinois` | `/community-services-indiana` | 301 |  | next.config |
| `/community-services-ohio` | `/community-services-indiana` | 301 |  | next.config |
| `/community-services-tennessee` | `/community-services-indiana` | 301 |  | next.config |
| `/community-services-texas` | `/community-services-indiana` | 301 |  | next.config |
| `/community/:path*` | `/community-services` | 301 |  | next.config |
| `/community/groups` | `/community-services` | 307 |  | next.config |
| `/community/groups` | `/contact` | 301 |  | canonical-routes |
| `/compare-programs/:path*` | `/programs/:path*` | 301 |  | next.config |
| `/connects` | `/connect` | 301 |  | next.config |
| `/courses` | `/programs` | 301 |  | next.config |
| `/credentials/:path+` | `/programs` | 307 |  | next.config |
| `/credentials/checksheets` | `/programs` | 307 |  | next.config |
| `/credentials/hvac-standards` | `/programs/hvac-technician` | 307 |  | next.config |
| `/curriculumupload` | `/admin/curriculum/upload` | 301 |  | next.config |
| `/dashboard/sub-offices/new` | `/dashboard` | 301 |  | next.config |
| `/dashboards/:path*` | `/lms/:path*` | 301 |  | next.config |
| `/demo/admin` | `/contact` | 301 |  | canonical-routes |
| `/disclosures` | `/legal/disclosures` | 301 |  | next.config |
| `/docs/:path*` | `/resources` | 301 |  | next.config |
| `/docs/students/certificates` | `/credentials` | 301 |  | next.config |
| `/donations` | `/donate` | 301 |  | next.config |
| `/ebook/barber-theory` | `/lms/courses` | 301 |  | next.config |
| `/ebook/barber-theory` | `/programs/barber-apprenticeship` | 301 |  | canonical-routes |
| `/elevate-platform-overview.pdf` | `/resources` | 307 |  | next.config |
| `/employer-portal` | `/employer/dashboard` | 301 |  | next.config |
| `/employer-portal/:path*` | `/employer/:path*` | 301 |  | next.config |
| `/employer-portal/analytics` | `/employer/analytics` | 301 |  | next.config |
| `/employer-portal/applications` | `/employer/dashboard` | 301 |  | next.config |
| `/employer-portal/candidates` | `/employer/candidates` | 301 |  | next.config |
| `/employer-portal/company` | `/employer/company` | 301 |  | next.config |
| `/employer-portal/dashboard` | `/employer/dashboard` | 301 |  | next.config |
| `/employer-portal/interviews` | `/employer/candidates` | 301 |  | next.config |
| `/employer-portal/jobs` | `/employer/jobs` | 301 |  | next.config |
| `/employer-portal/messages` | `/employer/dashboard` | 301 |  | next.config |
| `/employer-portal/programs` | `/employer/opportunities` | 301 |  | next.config |
| `/employer-portal/settings` | `/employer/settings` | 301 |  | next.config |
| `/employer-portal/wotc` | `/employer/wotc` | 301 |  | next.config |
| `/employer-workforce-partnerships` | `/employer-workforce-partnerships-indiana` | 301 |  | next.config |
| `/employer/applications` | `/employer/dashboard` | 301 |  | next.config |
| `/employer/apprentices/new` | `/employer/dashboard` | 301 |  | next.config |
| `/employer/apprentices/new` | `/for-employers` | 301 |  | canonical-routes |
| `/employer/apprenticeship` | `/employer/dashboard` | 301 |  | next.config |
| `/employer/apprenticeship/new` | `/employer/dashboard` | 301 |  | next.config |
| `/employer/login` | `/login` | 301 |  | next.config |
| `/employer/postings/new` | `/employer/dashboard` | 301 |  | next.config |
| `/employer/register` | `/apply/employer` | 301 |  | next.config |
| `/employers/apprenticeships` | `/employer/apprenticeships` | 301 |  | next.config |
| `/employers/benefits` | `/employer/dashboard` | 301 |  | next.config |
| `/employers/post-job` | `/employer/post-job` | 301 |  | next.config |
| `/employers/talent-pipeline` | `/employer/dashboard` | 301 |  | next.config |
| `/enroll/barber-apprenticeship` | `/programs/barber-apprenticeship/apply` | 301 |  | next.config |
| `/enrollment-agreement` | `/legal/enrollment-agreement` | 301 |  | next.config |
| `/etpl-programs` | `/pathways` | 301 |  | next.config |
| `/eula` | `/legal/eula` | 301 |  | next.config |
| `/ferpa/reports` | `/program-holder/compliance` | 301 |  | canonical-routes |
| `/financial-aid` | `/funding` | 301 |  | next.config |
| `/financial-support` | `/funding` | 301 |  | next.config |
| `/for-workforce-boards` | `/workforce-board` | 301 |  | next.config |
| `/for/students` | `/for-students` | 301 |  | next.config |
| `/forgotpassword` | `/reset-password` | 301 |  | next.config |
| `/forum/:path*` | `/blog` | 301 |  | next.config |
| `/forums/:path*` | `/blog` | 301 |  | next.config |
| `/fssa-impact` | `/snap/snap-et` | 301 |  | next.config |
| `/fssa-partnership-request` | `/snap/snap-et` | 301 |  | next.config |
| `/funding-impact` | `/funding` | 301 |  | next.config |
| `/funding/state-programs` | `/funding` | 301 |  | canonical-routes |
| `/fundingimpact` | `/funding` | 301 |  | next.config |
| `/get-started` | `/start` | 301 |  | next.config |
| `/governance` | `/legal/governance` | 301 |  | next.config |
| `/governance/compliance` | `/legal/governance/platform-overview` | 301 |  | next.config |
| `/governance/security` | `/legal/disclosures` | 301 |  | canonical-routes |
| `/health-services` | `/programs/healthcare` | 301 |  | next.config |
| `/healthcare-training` | `/healthcare-training-indianapolis` | 301 |  | next.config |
| `/home1` | `/` | 301 |  | next.config |
| `/hvac` | `/programs/hvac-technician` | 301 |  | next.config |
| `/hvac` | `/programs/hvac-technician` | 301 |  | canonical-routes |
| `/industries` | `/programs` | 301 |  | canonical-routes |
| `/industries/healthcare` | `/programs/healthcare` | 301 |  | next.config |
| `/industries/healthcare` | `/programs/healthcare` | 301 |  | canonical-routes |
| `/institute` | `/` | 301 |  | next.config |
| `/instructor` | `https://admin.elevateforhumanity.org/admin/instructor/dashboard` | 301 |  | next.config |
| `/instructor/:path*` | `https://admin.elevateforhumanity.org/admin/instructor/:path*` | 301 |  | next.config |
| `/intake` | `/apply` | 301 |  | next.config |
| `/it-certification-training` | `/it-certification-training-indianapolis` | 301 |  | next.config |
| `/learners/:path*` | `/lms/:path*` | 301 |  | next.config |
| `/legal/agreements` | `/legal` | 301 |  | canonical-routes |
| `/legal/governance/lms` | `/legal/governance/lms-standards` | 301 |  | next.config |
| `/legal/governance/store` | `/legal/governance/store-payments` | 301 |  | next.config |
| `/legal/terms-of-service` | `/legal` | 301 |  | next.config |
| `/license-agreement` | `/legal/license-agreement` | 301 |  | next.config |
| `/lms-portal` | `/lms/dashboard` | 301 |  | next.config |
| `/lms/catalog` | `/lms/courses` | 301 |  | next.config |
| `/lms/messages/new` | `/lms/messages` | 301 |  | next.config |
| `/lms/messages/support/new` | `/lms/messages` | 301 |  | next.config |
| `/lms/my-courses` | `/lms/courses` | 301 |  | next.config |
| `/logout` | `/login` | 307 |  | next.config |
| `/marketplace` | `/store/digital` | 301 |  | next.config |
| `/mentor` | `/mentor/dashboard` | 307 |  | next.config |
| `/mentor/apply` | `/mentor/dashboard` | 301 |  | next.config |
| `/mentorship/apply` | `/apply` | 301 |  | next.config |
| `/micro-classes` | `/microclasses` | 301 |  | next.config |
| `/mission` | `/about` | 307 |  | next.config |
| `/my-dashboard` | `/learner/dashboard` | 301 |  | next.config |
| `/news/:path*` | `/blog/:path*` | 301 |  | next.config |
| `/onboarding/barber-apprenticeship` | `/programs/barber-apprenticeship/orientation` | 301 |  | next.config |
| `/org/cohorts` | `/program-holder/dashboard` | 301 |  | canonical-routes |
| `/org/invites` | `/program-holder/dashboard` | 301 |  | canonical-routes |
| `/outcomes/indiana` | `/about` | 307 |  | next.config |
| `/partner-application/:path*` | `/partners/:path*` | 301 |  | next.config |
| `/partner-courses/:path*` | `/partners/:path*` | 301 |  | next.config |
| `/partner-playbook/:path*` | `/partners/:path*` | 301 |  | next.config |
| `/partner-portal` | `/partner/dashboard` | 301 |  | next.config |
| `/partner-portal/:path*` | `/partner/:path*` | 301 |  | next.config |
| `/partner-with-us` | `/for-providers` | 301 |  | next.config |
| `/partner/refer` | `/for-providers` | 301 |  | next.config |
| `/partners/attendance` | `/partner/attendance` | 301 |  | next.config |
| `/partners/attendance` | `/program-holder/dashboard` | 301 |  | canonical-routes |
| `/partners/barber-host-shop/onboarding` | `/login?redirect=/partners/barber-host-shop/forms` | 301 |  | next.config |
| `/partners/barbershop-apprenticeship/:path*` | `/partners/barber-host-shop/:path*` | 301 |  | next.config |
| `/partners/cosmetology-apprenticeship/:path*` | `/partners/cosmetology-host-shop/:path*` | 301 |  | next.config |
| `/partners/cosmetology-apprenticeship/documents` | `/program-holder/documents` | 301 |  | canonical-routes |
| `/partners/cosmetology-partner-shop/:path*` | `/partners/cosmetology-host-shop/:path*` | 301 |  | next.config |
| `/partners/dashboard` | `/partner/dashboard` | 301 |  | next.config |
| `/partners/documents` | `/partner/documents` | 301 |  | next.config |
| `/partners/hours` | `/partner/hours` | 301 |  | next.config |
| `/partners/join` | `/partners/apply` | 301 |  | next.config |
| `/partners/login` | `/partner/login` | 301 |  | next.config |
| `/partners/portal` | `/partner/dashboard` | 301 |  | next.config |
| `/partners/students` | `/partner/students` | 301 |  | next.config |
| `/partners/students` | `/program-holder/students` | 301 |  | canonical-routes |
| `/partners/training` | `/for-providers` | 301 |  | next.config |
| `/partners/training-provider` | `/for-providers` | 301 |  | next.config |
| `/pathways/partners` | `/for-providers` | 301 |  | next.config |
| `/platform/licensing` | `/licensing` | 301 |  | next.config |
| `/platform/partners` | `/for-providers` | 301 |  | next.config |
| `/platform/program-holders` | `/for-providers` | 301 |  | next.config |
| `/platform/providers` | `/for-providers` | 301 |  | next.config |
| `/policies/:path*` | `/legal/disclosures` | 301 |  | next.config |
| `/policies/grievance` | `/grievance` | 301 |  | next.config |
| `/portal` | `/portals` | 301 |  | next.config |
| `/portal/staff/dashboard` | `https://admin.elevateforhumanity.org/admin/staff-portal/dashboard` | 301 |  | next.config |
| `/privacy` | `/legal/privacy` | 301 |  | next.config |
| `/privacy-policy` | `/legal/privacy` | 301 |  | next.config |
| `/program-finder/:path*` | `/programs/:path*` | 301 |  | next.config |
| `/program-holder-portal/:path*` | `/program-holder/:path*` | 301 |  | next.config |
| `/program-holder/apply` | `/apply/program-holder` | 301 |  | next.config |
| `/program-holder/courses` | `/program-holder/programs` | 301 |  | canonical-routes |
| `/program-holder/portal` | `/program-holder/dashboard` | 301 |  | next.config |
| `/program-holder/portal/attendance` | `/program-holder/dashboard` | 301 |  | next.config |
| `/program-holder/portal/live-qa` | `/program-holder/support` | 301 |  | next.config |
| `/program-holder/portal/messages` | `/program-holder/support` | 301 |  | next.config |
| `/program-holder/portal/reports` | `/program-holder/reports` | 301 |  | next.config |
| `/program-holder/portal/students` | `/program-holder/students` | 301 |  | next.config |
| `/program-holder/programs/new` | `/program-holder/programs` | 301 |  | next.config |
| `/program-holders` | `/program-holder` | 301 |  | next.config |
| `/program-holders/:path*` | `/program-holder/:path*` | 301 |  | next.config |
| `/program-holders/acknowledgement` | `/program-holder/rights-responsibilities` | 301 |  | next.config |
| `/program-holders/apply` | `/apply/program-holder` | 301 |  | next.config |
| `/program-holders/onboarding` | `/program-holder/onboarding` | 301 |  | next.config |
| `/program-holders/portal` | `/program-holder/dashboard` | 301 |  | next.config |
| `/program-holders/sign-mou` | `/program-holder/sign-mou` | 301 |  | next.config |
| `/program-holders/training-providers` | `/program-holder` | 301 |  | next.config |
| `/program-holders/universal-mou` | `/legal/program-host-agreement` | 301 |  | next.config |
| `/programs-catalog/:path*` | `/programs/:path*` | 301 |  | next.config |
| `/programs/admin` | `/program-holder/dashboard` | 301 |  | next.config |
| `/programs/admin/:path*` | `/program-holder/:path*` | 301 |  | next.config |
| `/programs/barber` | `/programs/barber-apprenticeship` | 301 |  | next.config |
| `/programs/barber` | `/programs/barber-apprenticeship` | 301 |  | canonical-routes |
| `/programs/barber-2024` | `/programs/barber-apprenticeship` | 301 |  | next.config |
| `/programs/barber-apprenticeship/inquiry` | `/programs/barber-apprenticeship/request-info` | 301 |  | next.config |
| `/programs/beauty-educator` | `/programs/beauty-career-educator` | 301 |  | canonical-routes |
| `/programs/bloodborne-pathogens` | `/programs/cpr-first-aid` | 301 |  | canonical-routes |
| `/programs/bookkeeping-fundamentals` | `/programs/bookkeeping` | 301 |  | next.config |
| `/programs/bookkeeping-quickbooks` | `/programs/bookkeeping` | 301 |  | canonical-routes |
| `/programs/building-maintenance` | `/programs/building-services-technician` | 301 |  | canonical-routes |
| `/programs/building-maintenance-wrg` | `/programs/building-services-technician` | 301 |  | next.config |
| `/programs/building-services-technician/apply` | `/apply?program=building-services-technician` | 301 |  | next.config |
| `/programs/business-admin` | `/programs/business-administration` | 301 |  | canonical-routes |
| `/programs/business-financial` | `/programs/bookkeeping` | 301 |  | canonical-routes |
| `/programs/business-management` | `/programs/business-administration` | 301 |  | canonical-routes |
| `/programs/cad` | `/programs/cad-drafting` | 301 |  | canonical-routes |
| `/programs/careersafe` | `/programs/emergency-health-safety` | 301 |  | canonical-routes |
| `/programs/cdl` | `/programs/cdl-training` | 301 |  | canonical-routes |
| `/programs/cdl-class-a` | `/programs/cdl-training` | 301 |  | canonical-routes |
| `/programs/cdl-class-a-training` | `/programs/cdl-training` | 301 |  | canonical-routes |
| `/programs/cdl-transportation` | `/programs/cdl-training` | 301 |  | canonical-routes |
| `/programs/certified-nursing-assistant` | `/programs/cna` | 301 |  | canonical-routes |
| `/programs/certified-peer-recovery-coach` | `/programs/peer-recovery-specialist` | 301 |  | canonical-routes |
| `/programs/certified-recovery-specialist` | `/programs/peer-recovery-specialist` | 301 |  | next.config |
| `/programs/chw-cert` | `/programs` | 301 |  | next.config |
| `/programs/cna-cert` | `/programs/cna` | 301 |  | next.config |
| `/programs/cna-cert` | `/programs/cna` | 301 |  | canonical-routes |
| `/programs/cna-certification` | `/programs/cna` | 301 |  | canonical-routes |
| `/programs/cna-certification/:path*` | `/programs/cna/:path*` | 301 |  | canonical-routes |
| `/programs/cna-training` | `/programs/cna` | 301 |  | next.config |
| `/programs/cna-training` | `/programs/cna` | 301 |  | canonical-routes |
| `/programs/cna-training-wrg` | `/programs/cna` | 301 |  | canonical-routes |
| `/programs/cna/apply` | `/apply?program=cna` | 301 |  | next.config |
| `/programs/comptia` | `/programs/it-help-desk` | 301 |  | canonical-routes |
| `/programs/construction` | `/programs/skilled-trades` | 301 |  | canonical-routes |
| `/programs/construction-trades-certification` | `/programs/skilled-trades` | 301 |  | next.config |
| `/programs/cosmetology` | `/programs/cosmetology-apprenticeship` | 301 |  | next.config |
| `/programs/cosmetology` | `/programs/cosmetology-apprenticeship` | 301 |  | canonical-routes |
| `/programs/cpr` | `/programs/cpr-first-aid` | 301 |  | canonical-routes |
| `/programs/cpr-aed` | `/programs/cpr-first-aid` | 301 |  | canonical-routes |
| `/programs/cpr-cert` | `/programs/cpr-first-aid` | 301 |  | next.config |
| `/programs/cpr-certification` | `/programs/cpr-first-aid` | 301 |  | canonical-routes |
| `/programs/cpr-first-aid-hsi` | `/programs/cpr-first-aid` | 301 |  | canonical-routes |
| `/programs/cpr-first-aid-hsi/:path*` | `/programs/cpr-first-aid/:path*` | 301 |  | canonical-routes |
| `/programs/cybersecurity` | `/programs/cybersecurity-analyst` | 301 |  | next.config |
| `/programs/cybersecurity` | `/programs/cybersecurity-analyst` | 301 |  | canonical-routes |
| `/programs/direct-support` | `/programs/direct-support-professional` | 301 |  | canonical-routes |
| `/programs/drug-collector` | `/programs/drug-alcohol-specimen-collector` | 301 |  | next.config |
| `/programs/drug-test` | `/programs/drug-alcohol-specimen-collector` | 301 |  | canonical-routes |
| `/programs/dsp-training` | `/programs/direct-support-professional` | 301 |  | next.config |
| `/programs/early-childhood-education` | `/contact?program=early-childhood-education` | 301 |  | canonical-routes |
| `/programs/electrical-technician` | `/programs/electrical` | 301 |  | next.config |
| `/programs/emergency-health` | `/programs/emergency-health-safety` | 301 |  | canonical-routes |
| `/programs/emergency-health-safety-training` | `/programs/emergency-health-safety` | 301 |  | canonical-routes |
| `/programs/entrepreneurship-small-business` | `/programs/entrepreneurship` | 301 |  | next.config |
| `/programs/entrepreneurship-training` | `/programs/entrepreneurship` | 301 |  | canonical-routes |
| `/programs/first-aid` | `/programs/cpr-first-aid` | 301 |  | canonical-routes |
| `/programs/food-handler` | `/programs/culinary-apprenticeship` | 301 |  | canonical-routes |
| `/programs/forklift-certification` | `/programs/forklift` | 301 |  | canonical-routes |
| `/programs/forklift-operator` | `/programs/forklift` | 301 |  | next.config |
| `/programs/forklift-operator` | `/programs/forklift` | 301 |  | canonical-routes |
| `/programs/graphic-design-program` | `/programs/graphic-design` | 301 |  | canonical-routes |
| `/programs/health-safety` | `/programs/cpr-first-aid` | 301 |  | next.config |
| `/programs/hha` | `/programs/home-health-aide` | 301 |  | canonical-routes |
| `/programs/home-health` | `/programs/home-health-aide` | 301 |  | canonical-routes |
| `/programs/hsi` | `/programs/cpr-first-aid` | 301 |  | canonical-routes |
| `/programs/hvac` | `/programs/hvac-technician` | 301 |  | canonical-routes |
| `/programs/hvac-2024` | `/programs/hvac-technician` | 301 |  | next.config |
| `/programs/hvac-tech` | `/programs/hvac-technician` | 301 |  | canonical-routes |
| `/programs/hvac-technician-program` | `/programs/hvac-technician` | 301 |  | canonical-routes |
| `/programs/hvac-technician-wrg` | `/programs/hvac-technician` | 301 |  | canonical-routes |
| `/programs/hvac-training` | `/programs/hvac-technician` | 301 |  | canonical-routes |
| `/programs/it-certifications` | `/programs/technology` | 301 |  | canonical-routes |
| `/programs/it-support` | `/programs/it-help-desk` | 301 |  | next.config |
| `/programs/it-support` | `/programs/it-help-desk` | 301 |  | canonical-routes |
| `/programs/it-support-specialist` | `/programs/it-help-desk` | 301 |  | next.config |
| `/programs/it-support-specialist` | `/programs/it-help-desk` | 301 |  | canonical-routes |
| `/programs/it-technician` | `/programs/it-help-desk` | 301 |  | canonical-routes |
| `/programs/medical-billing` | `/programs/office-administration` | 301 |  | canonical-routes |
| `/programs/micro-programs` | `/programs/catalog` | 301 |  | canonical-routes |
| `/programs/nail-tech` | `/programs/nail-technician-apprenticeship` | 301 |  | canonical-routes |
| `/programs/nail-tech-apprenticeship` | `/programs/nail-technician-apprenticeship` | 301 |  | next.config |
| `/programs/nail-technician` | `/programs/nail-technician-apprenticeship` | 301 |  | next.config |
| `/programs/nail-technician` | `/programs/nail-technician-apprenticeship` | 301 |  | canonical-routes |
| `/programs/network-support` | `/programs/network-administration` | 301 |  | canonical-routes |
| `/programs/nha-medical-assistant` | `/programs/medical-assistant` | 301 |  | next.config |
| `/programs/nha-pharmacy-technician` | `/programs/pharmacy-technician` | 301 |  | next.config |
| `/programs/nha-phlebotomy` | `/programs/phlebotomy` | 301 |  | next.config |
| `/programs/nrf` | `/programs/technology` | 301 |  | canonical-routes |
| `/programs/nrf-riseup` | `/programs` | 301 |  | next.config |
| `/programs/office-admin` | `/programs/office-administration` | 301 |  | canonical-routes |
| `/programs/osha` | `/programs/emergency-health-safety` | 301 |  | canonical-routes |
| `/programs/osha-30` | `/programs/emergency-health-safety` | 301 |  | canonical-routes |
| `/programs/osha-safety` | `/programs/emergency-health-safety` | 301 |  | canonical-routes |
| `/programs/peer-recovery` | `/programs/peer-recovery-specialist` | 301 |  | canonical-routes |
| `/programs/peer-recovery-coach` | `/programs/peer-recovery-specialist` | 301 |  | canonical-routes |
| `/programs/peer-recovery-specialist-jri` | `/programs/peer-recovery-specialist` | 301 |  | next.config |
| `/programs/peer-recovery-specialist-jri` | `/programs/peer-recovery-specialist` | 301 |  | canonical-routes |
| `/programs/peer-support` | `/programs/peer-recovery-specialist` | 301 |  | next.config |
| `/programs/peer-support` | `/programs/peer-recovery-specialist` | 301 |  | canonical-routes |
| `/programs/peer-support-professional` | `/programs/peer-recovery-specialist` | 301 |  | canonical-routes |
| `/programs/phlebotomy-technician` | `/programs/phlebotomy` | 301 |  | next.config |
| `/programs/plumbing-technician` | `/programs/plumbing` | 301 |  | next.config |
| `/programs/professional-esthetician` | `/programs/esthetician-apprenticeship` | 301 |  | canonical-routes |
| `/programs/project-mgmt` | `/programs/project-management` | 301 |  | canonical-routes |
| `/programs/qma/apply` | `/apply?program=qma` | 301 |  | next.config |
| `/programs/recovery-coach` | `/programs/peer-recovery-specialist` | 301 |  | next.config |
| `/programs/recovery-coach` | `/programs/peer-recovery-specialist` | 301 |  | canonical-routes |
| `/programs/sanitation` | `/programs/sanitation-infection-control` | 301 |  | canonical-routes |
| `/programs/small-business` | `/programs/entrepreneurship` | 301 |  | canonical-routes |
| `/programs/snap-et` | `/snap/snap-et` | 301 |  | canonical-routes |
| `/programs/software-dev` | `/programs/software-development` | 301 |  | canonical-routes |
| `/programs/tax-entrepreneurship` | `/programs/entrepreneurship` | 301 |  | canonical-routes |
| `/programs/web-design` | `/programs/web-development` | 301 |  | canonical-routes |
| `/programs/wioa` | `/wioa-eligibility` | 301 |  | canonical-routes |
| `/programs/wioa-funding` | `/wioa-eligibility` | 301 |  | canonical-routes |
| `/programs/workforce-readiness` | `/programs/reentry-specialist` | 301 |  | canonical-routes |
| `/programs/workforce-ready-grant` | `/tuition` | 301 |  | canonical-routes |
| `/programs/wrg` | `/tuition` | 301 |  | canonical-routes |
| `/pwa/barber` | `/pwa/barber/onboarding` | 301 |  | next.config |
| `/pwa/barber` | `/programs/barber-apprenticeship` | 301 |  | canonical-routes |
| `/pwa/barber/enroll` | `/programs/barber-apprenticeship/apply` | 301 |  | next.config |
| `/pwa/barber/log-hours` | `/programs/barber-apprenticeship` | 307 |  | next.config |
| `/pwa/barber/profile` | `/account/profile` | 301 |  | next.config |
| `/pwa/barber/progress` | `/programs/barber-apprenticeship` | 307 |  | next.config |
| `/pwa/barber/training` | `/lms/courses/3fb5ce19-1cde-434c-a8c6-f138d7d7aa17` | 301 |  | next.config |
| `/pwa/cosmetology` | `/programs/cosmetology-apprenticeship` | 301 |  | next.config |
| `/pwa/cosmetology` | `/programs/cosmetology-apprenticeship` | 301 |  | canonical-routes |
| `/pwa/esthetician` | `/programs/esthetician-apprenticeship` | 301 |  | canonical-routes |
| `/pwa/nail-tech` | `/programs/nail-technician-apprenticeship` | 301 |  | canonical-routes |
| `/receptionist/:path*` | `https://admin.elevateforhumanity.org/admin/staff-portal/:path*` | 301 |  | next.config |
| `/register` | `/signup` | 301 |  | next.config |
| `/resetpassword` | `/reset-password` | 301 |  | next.config |
| `/rise` | `https://www.supersonicfastermoney.com/tax` | 301 |  | next.config |
| `/sheets` | `/programs` | 301 |  | next.config |
| `/sign-in` | `/login` | 301 |  | next.config |
| `/signin` | `/login` | 301 |  | next.config |
| `/sitemap` | `/site-map` | 301 |  | next.config |
| `/sitemap-page` | `/sitemap.xml` | 301 |  | next.config |
| `/skilled-trades-training` | `/skilled-trades-training-indiana` | 301 |  | next.config |
| `/snap` | `/snap/snap-et` | 301 |  | next.config |
| `/staff-portal` | `https://admin.elevateforhumanity.org/admin/staff-portal/dashboard` | 301 |  | next.config |
| `/staff-portal/:path*` | `https://admin.elevateforhumanity.org/admin/staff-portal/:path*` | 301 |  | next.config |
| `/store/codebase-clone` | `/store/licenses#clone` | 307 |  | next.config |
| `/store/demo` | `/store/demos` | 301 |  | next.config |
| `/store/licenses/managed` | `/store/licenses` | 301 |  | next.config |
| `/store/licensing` | `/store/licenses` | 301 |  | next.config |
| `/store/licensing/:path*` | `/store/licenses/:path*` | 301 |  | next.config |
| `/store/licensing/enterprise` | `/store/licenses/enterprise-license` | 301 |  | next.config |
| `/store/licensing/managed` | `/store/licenses` | 301 |  | next.config |
| `/store/licensing/partnerships` | `/store/licenses` | 301 |  | next.config |
| `/store/licensing/success` | `/store/licenses/success` | 301 |  | next.config |
| `/store/orders` | `/store` | 301 |  | next.config |
| `/store/trial` | `/launch` | 307 |  | next.config |
| `/student` | `/learner/dashboard` | 301 |  | next.config |
| `/student-handbook` | `/legal/student-handbook` | 301 |  | next.config |
| `/student-portal` | `/learner/dashboard` | 301 |  | next.config |
| `/student-portal/:path*` | `/learner/dashboard` | 301 |  | next.config |
| `/student/:path*` | `/learner/dashboard` | 301 |  | next.config |
| `/student/support` | `/contact` | 307 |  | next.config |
| `/support/documentation` | `/support/help` | 301 |  | next.config |
| `/tax` | `https://www.supersonicfastermoney.com/tax` | 301 |  | next.config |
| `/tax-filing/:path*` | `/tax/:path*` | 301 |  | next.config |
| `/tax-self-prep` | `https://www.supersonicfastermoney.com/tax-self-prep` | 301 |  | next.config |
| `/tax-services/:path*` | `/tax/:path*` | 301 |  | next.config |
| `/tax-software/:path*` | `/tax/:path*` | 301 |  | next.config |
| `/terms` | `/legal` | 301 |  | next.config |
| `/terms-of-service` | `/legal` | 301 |  | next.config |
| `/training-institute` | `/programs` | 301 |  | next.config |
| `/training-providers` | `/for-providers` | 301 |  | next.config |
| `/training/cna` | `/programs/cna` | 301 |  | next.config |
| `/training/hvac-technician` | `/programs/hvac-technician` | 301 |  | next.config |
| `/training/hvac-technician` | `/programs/hvac-technician` | 301 |  | canonical-routes |
| `/update-password` | `/auth/reset-password` | 301 |  | next.config |
| `/usermanagement` | `/admin/reports/users` | 301 |  | next.config |
| `/verify-credential` | `/verify` | 301 |  | next.config |
| `/verifycertificate/:path*` | `/verify/:path*` | 301 |  | next.config |
| `/verifyemail` | `/verify-email` | 301 |  | next.config |
| `/wioa-funded-training` | `/wioa-eligibility` | 301 |  | next.config |
| `/wioa-funded-training-indiana` | `/wioa-eligibility` | 301 |  | canonical-routes |
| `/wioa-training` | `/wioa-eligibility` | 301 |  | next.config |
| `/wioa-training-indiana` | `/wioa-eligibility` | 301 |  | next.config |
| `/workforce-training` | `/workforce-training-indianapolis` | 301 |  | next.config |
| `/workforce-training-indiana` | `/workforce-training-indianapolis` | 301 |  | next.config |
