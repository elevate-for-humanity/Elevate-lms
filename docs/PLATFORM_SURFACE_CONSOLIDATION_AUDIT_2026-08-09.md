# Platform Surface Consolidation Audit — 2026-08-09

Scope: Marketing (`www`), LMS (`app`), Admin (`admin`), public sitemap, shared navigation/footer, compatibility routes, and high-risk duplicated product surfaces.

## Decision rule

No page is removed simply because another page has a similar name. Overlapping routes are compared function-by-function first. Useful functions are merged into the canonical implementation before the old route becomes a compatibility redirect. Intentional informational and operational surfaces remain separate when they serve different users.

## Side-by-side results

| Surface family | Competing / historical surfaces | Canonical implementation | Functions preserved in canonical | Result |
|---|---|---|---|---|
| Host Sites | `/partners/host-shops`, `/partners/barber-host-shop`, `/apprenticeships/host-shop`, `/programs/barber-apprenticeship/host-shops` | Marketing `/partners/host-shops` | Cross-program pathways, application CTA, requirements, responsibilities, approval workflow, live approved-site directory, Host Site portal, sponsor-governance link, visual sections | Old landing pages are noindex compatibility redirects only |
| Host Site application | `/partners/host-shop/apply`, `/partners/barber-host-shop/apply` | Marketing `/partners/host-shop/apply` | One universal application for Barber, Cosmetology, Esthetics, Nail; compliance uploads | Barber-only apply URL remains redirect only |
| Host Site portal | LMS `/host-shop/dashboard`, `/cosmetology-host-shop/dashboard`, historical partner dashboard | LMS `/host-shop/dashboard` | Auth, partner linkage, onboarding/MOU workflow, apprentice/attendance/document operations | Cosmetology/partner identities retained only as compatibility aliases |
| Apprenticeship sponsor information | Employer-facing “Sponsor an Apprentice” labels versus `/apprenticeship-sponsor` | `/apprenticeship-sponsor` is informational governance only | Sponsor-of-record identity, governance, RTI/sponsor responsibilities | Employer CTA renamed to “Become a Host Site”; sponsor page moved to About/governance context |
| Student application | `/apply`, `/apply/student`, full `/enrollment-v2/*` funnel | Marketing `/apply/student` | Program-driven intake, drafts, idempotency, canonical API, funding, Host Site fields, apprenticeship transfer-hour evidence | `/apply` and v2 pages are compatibility redirects; v2 API delegates to canonical services |
| Application API | `/api/applications`, `/api/enrollment-v2/apply` | `/api/applications` | Validation, rate limiting, idempotency, account/provisioning workflow, notifications, audit/job behavior | v2 endpoint is adapter only; no direct application write |
| Application tracking | legacy v2 GET/status logic and canonical tracker | `/api/applications/track` | Reference/email lookup, rate limiting, audit | v2 GET delegates and reshapes response |
| Course Builder | Admin `/course-builder`, Store `/store/course-builder` | Admin `/course-builder` | Full authenticated builder | Store page remains intentional product/information surface; no second builder |
| Website Builder | `/apps/website-builder`, Store `/store/apps/website-builder` | Marketing authenticated `/apps/website-builder` | Create/edit/preview/publish/domain operations | Store page remains intentional product/plan surface |
| Dev Studio | Admin `/studio`, historical dev-studio aliases, Store page | Admin `/studio` | Operational Studio workspace | Store page remains intentional product/information surface |
| Login | Marketing `/login`, LMS `/login`, Admin `/login` | LMS `/login` for learner/platform users; Admin `/login` for staff/admin | Real auth stays on the correct application | Marketing `/login` is noindex redirect; not a duplicate auth UI |
| Testing | Marketing `/testing`, Admin `/testing-center`, Store `/store/testing` | Marketing public `/testing`; Admin operational `/testing-center` | Public exam information/booking discovery; authenticated operations/statistics | Intentional separation retained |
| Business program alias | `/programs/business` -> missing `/programs/business-administration` | `/programs` catalog | No unique working business page existed to preserve | Alias now redirects to maintained catalog; removed from header and sitemap |
| IT Help Desk alias | `/programs/it-help-desk` / `/programs/it-helpdesk` absent | `/programs/technology` | Technology program discovery | Shared route and header point to existing technology page; no thin duplicate page created |

## Navigation / footer / homepage alignment

- Header, footer, homepage employer CTAs, and sitemap now use shared canonical route constants where applicable.
- Employers expose one public apprenticeship employer entry: **Become a Host Site**.
- Portals expose one **Host Site Portal** and one **Student / LMS Portal**.
- Sponsor-of-record information is separated from employer enrollment so “sponsor” does not create a competing Host Site pathway.
- Shared Apply navigation now points directly to `/apply/student`, not the `/apply` compatibility redirect.

## Sitemap decisions

The public sitemap now:

- includes `/partners/host-shops`;
- includes the true application page `/apply/student`;
- retains `/apprenticeship-sponsor` as public governance content;
- includes verified public navigation pages such as `/how-it-works`, `/funding/state-programs`, `/hire-graduates`, and `/success-stories`;
- removes the broken `/programs/business` indexed route;
- deduplicates emitted URLs;
- uses canonical route constants for core pages.

Authenticated Admin and LMS layouts now declare `robots: noindex, nofollow`, preventing portal pages from competing with the public Marketing sitemap.

## Visual / presentation findings

Confirmed and addressed:

- Canonical Host Site page upgraded to a picture-led hero plus multiple visual sections instead of a text-only merged page.
- `/hire-graduates` upgraded from a text/gradient lead section to a picture-first employer page and canonical Employer Portal action.
- New image references were repository-verified before use; two guessed image paths that did not exist were rejected and not shipped.
- Host Site and employer content uses stronger foreground/background contrast.

Confirmed remaining audit category:

- Some public sitemap pages still use text-only lead sections or dark panels and need page-specific visual/contrast remediation rather than a risky global color override. The public media/navigation audit now scans every sitemap/header page for missing lead media, text-heavy layouts, missing assets, broken routes, and contrast-risk patterns.

## Enforcement added

- `scripts/find-duplicate-app-routes.mjs` now scans legacy, Marketing, LMS, and Admin app roots.
- `lib/routes/platform-surface-contracts.json` defines canonical, operational, informational, and compatibility surfaces.
- `scripts/check-platform-surface-contracts.mjs` verifies those contracts and prevents compatibility pages from becoming full duplicate implementations.
- `routes:check` runs exact duplicate-route detection plus semantic surface-contract enforcement.
- `predeploy:check` can now call an actual `routes:check` script instead of a missing command.
- `scripts/platform-doctor-static.mjs` now scans all app surfaces.
- `scripts/audit-public-site-media-nav.mjs` now resolves shared route constants and checks the complete public sitemap/header set for route, sitemap, image, hero/media, text-density, and contrast risks.

## Validation status

Repository source and route relationships were reviewed directly on branch `fix/platform-route-consolidation-20260809`. No full application build or Northflank deployment was triggered during this audit in order to avoid unnecessary build spend. Runtime/build validation remains required before production merge/deploy.
