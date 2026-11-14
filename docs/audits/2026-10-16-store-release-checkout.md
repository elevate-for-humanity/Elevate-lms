# Store deployment and checkout audit — 2026-10-16

## Live observations

At approximately 21:00:52 UTC, the public Store /api/ping, /api/health and /store returned HTTP 200. The direct Google service /api/health also returned 200. Both health responses identified commit ad774208f3f247f9e21997026885636f56d089ae and revision elevate-store-migration-rad774208-38954287754-1, with Supabase healthy. Earlier Store probes timed out; no evidence establishes their exact cause. They are not proof of a persistent outage.

Deployment run 38954287754/job 117153245168 previously verified this revision and its 100% traffic assignment. This is historical traffic evidence, not a fresh control-plane inventory.

## Line-by-line traced boundaries

| Surface | Confirmed result / repair |
|---|---|
| deploy-google-store-runtime.yml image update | The update lacked --no-traffic before the separate activation step. Added it so candidate health and immutable revision checks precede promotion. Existing resource settings preserved. |
| public-runtime-service.ts | Cloud Run K_SERVICE selects Store identity; Marketing cannot be relabeled by a stale Store flag. Tests pass. |
| Marketing middleware probe boundary | Exact ping/readiness/health endpoints bypass tenant and authentication routing. Tests pass. |
| Marketing middleware Store boundary | The existing cart called /api/apps/upgrade but Store middleware redirected it to Marketing. Added an exact path exception; the handler still authenticates users and validates plans. Unrelated app APIs remain outside the exception. Regression failed before repair and passes afterward. |
| store/checkout/page.tsx | Obsolete page rendered raw card fields and posted to nonexistent /api/store/checkout. Replaced with the existing StoreCartView, which uses authenticated hosted QuickBooks invoice checkout and the current cart model. |
| StoreCartView checkout requests | Normal cart uses /api/store/cart-checkout; individual apps use /api/apps/upgrade. Both now reach Store handlers. |
| StoreCartView payment state | Removed premature cart clearing before payment and erroneous network-error-to-login handling. Explicit HTTP 401 still initiates login; failed requests retain the cart and display an error. |
| Store database configuration | Only missing database settings are inherited from the approved Google-owned configuration; unrelated provider/admin secrets are excluded. Existing Store credentials remain authoritative. Tests pass. |

## Validation

- Store middleware routing: 23 tests pass, including app checkout and negative scope cases.
- Candidate activation/deployment: 30 tests pass, including zero-traffic Store candidate requirement.
- Store/runtime identity, database configuration, public health and runtime readiness: 15 tests pass.
- Marketing TypeScript check passes after restoring missing sparse-checkout source directories.
- Scoped ESLint passes with the repository's existing pages-directory warning.
- Store workflow YAML parses and git diff --check passes.

## Limits

No deployment initiated and no invoice, payment or purchase created. Public health establishes process/database health, not live QuickBooks credential readiness or completed checkout. Signed-in end-to-end checkout is not demonstrated. This audit covers the Store deployment, runtime routing and checkout path; it does not claim every product page or every integration has been audited. Twilio is the current phone provider; Store fixes do not restore Telnyx.
