# Redirect Parity Checklist (Phase 3)

## Scope

Validate redirect behavior parity before moving stable rules from Next.js into edge infrastructure.

Primary coverage:
- Public routes
- Intake/apply flows
- Program pages
- Admin auth transitions
- Canonical tags
- Sitemap integrity
- Redirect chains

## Inputs

- redirect inventory: `artifacts/audits/redirect-alias-classification-2026-05-14.csv`
- proposed manifest: `artifacts/audits/redirect-manifest-proposed-2026-05-14.csv`
- layer split: `artifacts/audits/redirect-layer-split-2026-05-14.csv`

## Test Matrix

| Area | Check | Expected |
|---|---|---|
| Public routes | Legacy URL -> target route | 1 hop max, correct final page |
| Intake/apply | `/apply/*`, `/intake`, campaign aliases | Form loads, no state loss, no loop |
| Program pages | legacy program aliases | Correct program target, no 404 |
| Admin auth | `/auth/*`, `/student/*`, `/partner*`, `/lms` | role-safe destination, no auth bypass |
| Canonical | canonical link on destination | canonical URL matches target route |
| Sitemap | sitemap excludes legacy aliases | only canonical URLs listed |
| Redirect chains | source -> final | no chain >1, no circular redirect |

## Execution Steps

1. Baseline capture (current Next.js behavior)
- Record status code, Location header, final URL, and hop count for all 57 shell redirects.
- Capture canonical tag on final destination pages.

2. Category-focused validation
- required_legacy_url: verify login/session transitions and role-gated destinations.
- marketing_alias: verify campaign params survive when applicable.
- temporary_compat_path: verify destinations still referenced and active.
- duplicate_deadweight: verify canonical destination already serves full behavior.

3. Negative checks
- Confirm no redirect loops.
- Confirm no mixed-protocol downgrade (https -> http).
- Confirm no open-redirect behavior on query-based redirect params.

4. SEO checks
- Verify canonical tag present and correct on destination.
- Verify legacy aliases are not indexable if policy requires canonical-only indexing.

5. Performance checks
- Compare TTFB and hop count before/after any migration.
- Ensure no extra edge hop introduced.

## Promotion Gates

All must pass before edge migration:
- 100% parity on status code + Location for in-scope routes.
- 0 redirect loops.
- 0 chain depth >1.
- 0 auth transition regressions.
- 0 canonical mismatches on tested destinations.

## Migration Order (Recommended)

1. duplicate_deadweight (3)
2. seo_alias stable rules
3. external-target redirect(s) after parity
4. marketing_alias (only stable campaigns)
5. required_legacy_url last (high blast radius)

## Rollback Criteria

Immediate rollback to Next.js-only for any of:
- Auth flow regression
- Intake/apply submission failure
- Program page 404 spike
- Redirect loop detected
- Canonical mismatch on production pages

## Evidence to retain

- Request/response capture for each route
- Before/after parity diff
- Crawl sample for canonical + sitemap validation
- Incident log for any failed migration candidate
