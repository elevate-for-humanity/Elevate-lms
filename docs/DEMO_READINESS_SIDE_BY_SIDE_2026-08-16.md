# Elevate Demo Readiness — Side-by-Side Verification

Date: 2026-08-16

This document is the canonical status guide for the sales/demo package. A route, component, SDK reference, or test checklist item is **not** considered proof that an end-to-end workflow passed.

## Status definitions

- **PUBLIC** — intentionally usable without authentication.
- **AUTHENTICATED** — production workspace that requires login/role/entitlement.
- **IMPLEMENTED** — source code exists for the capability.
- **VERIFIED** — observed through the complete intended transaction or user lifecycle.
- **NOT PROVEN** — code or documentation exists, but the complete production lifecycle has not been demonstrated.
- **BLOCKED/BROKEN** — known missing route, bad target, failed transaction, or deployment/runtime failure.

## Side-by-side

| Capability | Previous demo-package claim | Repository/live reality | Canonical path | Current status |
|---|---|---|---|---|
| Barber curriculum demo | Public direct LMS course | LMS course route requires an authenticated user and redirects unauthenticated visitors to login | Public proof: `/programs/barber-apprenticeship`; production LMS: `app.elevateforhumanity.org/lms/courses/<course-id>` | AUTHENTICATED / IMPLEMENTED |
| Website Builder demo | Public production edit workspace | Production editor requires login, Website Builder entitlement, and ownership of the requested site | Public interactive demo: `/store`; production workspace: `/apps/website-builder` | PUBLIC DEMO + AUTHENTICATED EDITOR |
| Website Builder trial | Separate app trial | Legacy per-user app-trial path competed with the organization trial architecture | `/store/trial?product=website-builder` | CONSOLIDATED |
| Store demo | Marketplace/product demo | Public store is available and includes public interactive product demonstrations and pricing | `/store` | PUBLIC |
| Platform subscription | Generic subscription page | Canonical platform checkout is organization/tenant based; legacy `/store/subscriptions` UI called obsolete/missing endpoints | `/store/plans` -> `/api/store/platform-checkout` | IMPLEMENTED; E2E PAYMENT NOT YET CERTIFIED |
| Billing management | Customer portal unknown | Canonical Stripe Billing Portal API exists | `/api/store/billing-portal` | IMPLEMENTED; PORTAL SETTINGS REQUIRE PRODUCTION VERIFICATION |
| Plan upgrade/downgrade | Unclear | Existing active Stripe subscription is updated in place; proration is configured | `/api/store/platform-checkout` | IMPLEMENTED |
| Add-ons | Claimed working | Canonical Stripe checkout supports recurring add-on line items | `/api/store/platform-checkout` | IMPLEMENTED; E2E BILLING NOT YET CERTIFIED |
| Learner/Apprentice/Host/Program Holder apps | Treated as anonymous demos | These are authenticated role workspaces | `/online-apps` links to the appropriate app domain | AUTHENTICATED |
| PWA installation | All platforms marked passed | Install hooks/components exist, but browser/device installation and offline synchronization must be verified per build/device | Role-specific app URLs | IMPLEMENTED / NOT FULLY VERIFIED |
| Offline behavior | Marked passed | Presence of PWA code does not prove every protected route/action works offline | Service-worker/PWA stack | NOT PROVEN |
| Affirm financing | Marked passed | Client checkout and server Affirm client exist; the UI references `/api/affirm/capture`, which was not found in the current LMS API tree during this audit | Program checkout | BLOCKED/NOT CERTIFIED |
| Stripe one-time program checkout | Marked passed | UI references a checkout API and Stripe infrastructure exists, but a real/test end-to-end purchase must prove payment -> webhook -> record -> enrollment/entitlement | Program checkout | NOT FULLY VERIFIED |
| RAPIDS API integration | Described as active REST/OAuth sync | No production RAPIDS OAuth/API implementation was proven by this audit. Registered Apprenticeship workflows and reporting must not be described as automated RAPIDS API sync without endpoint-level proof | Apprenticeship workflows | NOT PROVEN |
| WIOA/ETPL API integration | Described as direct state API | Provider/program workflows exist, but direct automated Indiana DWD API exchange was not proven by this audit | Workforce workflows | NOT PROVEN |
| MFA | Described as required for admin | Do not claim mandatory MFA until auth policy and production enforcement are verified | Auth stack | NOT PROVEN |
| HIPAA compliance | Described as platform compliance | Do not advertise platform-wide HIPAA compliance from feature presence alone; requires scope, policies, BAAs where applicable, security controls, and compliance validation | Governance/security | NOT CERTIFIED BY THIS AUDIT |
| WCAG 2.1 AA | Checklist marked passed | Requires automated + manual accessibility testing; source presence is not certification | All public/app surfaces | NOT CERTIFIED BY THIS AUDIT |
| Performance targets | Checklist marked passed | Requires measured Lighthouse/WebPageTest/browser results on deployed builds | Live domains | NOT CERTIFIED BY THIS AUDIT |

## Canonical demo journey

1. Public prospect enters `/store` or `/online-apps`.
2. Public product proof stays read-only or safely interactive and does not expose customer/learner records.
3. Prospect starts the organization trial through `/store/trial`.
4. User verifies/signs into the platform workspace.
5. Entitled users enter production applications such as Website Builder, LMS, apprenticeship, workforce, or other role portals.
6. Paid platform subscriptions use `/store/plans` and `/api/store/platform-checkout`.
7. Existing subscribers manage billing through `/api/store/billing-portal`.

## Regression gates before marking a demo green

A demo may only be marked VERIFIED when the applicable gates pass:

- Public URL returns a valid rendered page without an authentication leak or 5xx.
- Protected URL redirects unauthenticated users cleanly to the canonical login or trial path.
- Correct test role can authenticate and reaches the intended dashboard without 404/redirect loop.
- Core action writes the intended database record and the UI reflects the result.
- Payment flows prove checkout creation, successful test transaction, webhook/lifecycle processing, database record, entitlement/enrollment, receipt/confirmation, billing portal, cancellation/failure behavior as applicable.
- PWA claims prove manifest/service-worker installation on the named browser/device; offline claims require an explicit offline scenario test.
- Integration claims require a real configured external endpoint and a successful request/response or synchronization record.
- Security/compliance claims require the named control to be enforced and tested, not merely documented.

## Fixes applied in this audit

- Consolidated legacy `/store/subscriptions` onto the canonical `/store/plans` architecture.
- Reworked `/online-apps` so public demos are separated from authenticated production proof.
- Removed the public link to a specific customer-owned Website Builder edit UUID.
- Replaced the Website Builder's separate per-user trial route with the canonical organization trial flow.
- Clarified that role portals are authorization surfaces, not subscription tiers.

## Remaining release blockers for a fully certified package

- Execute and record Stripe subscription lifecycle test: checkout -> Stripe -> webhook -> organization subscription -> entitlement -> billing portal -> cancellation/payment failure.
- Repair or remove the incomplete Affirm checkout path until server capture and downstream enrollment/order handling are proven.
- Run role-by-role authenticated smoke tests using authorized test accounts.
- Run PWA install/offline tests on supported iOS/Android/desktop browsers.
- Prove or remove marketing statements describing direct RAPIDS/Indiana DWD API synchronization.
- Run accessibility, security, and performance suites and attach measured results before marking those checklist rows passed.
