# PARIS false-success repair — November 7, 2026

Base examined: fa4843aed86556884d829c58567db9c3fa754039.

## Changes

- Legacy ParisAI uses canonical inference and authenticated command execution. Provider errors propagate; AI prose cannot certify execution.
- Legacy media generation uses actual provider output. The media picker uses saved assets and the existing authenticated image generation/persistence route.
- Unsupported editing, vision descriptions and URL-only image transformations fail explicitly. Stock/API/database errors are no longer presented as empty successful searches.
- Performance analysis returns stored published-post measurements, with no invented numeric quality score.
- Missing publish reports block publishing instead of fabricating changes, migrations and scores.
- API scaffolds return 501 until implemented. Generated API clients resolve actual specification origins, encode path/query parameters and reject upstream errors. Import analysis no longer claims a repository was imported or an API was connected.
- Client job PATCH requests cannot mark execution completed. Server diagnostics store their actual result; incomplete billing repairs fail explicitly. Diagnostic handoff completion is distinct from repair completion.
- Source-linked jobs cannot enter the GitHub App recovery path documented as source-free. Existing workflow tests retain independent readback verification and reflect current diagnostic guidance.
- RAPIDS and UI-3 helpers do not fabricate successful agency updates, request IDs or reports. Blueprint registry comparisons do not claim external currency, and console output is not a delivered notification.
- Compatibility recommendations identify static scoring as a heuristic, not acceptance evidence.

## Authorized database replacement

Executed scripts/operations/replace-completed-devstudio-jobs.sql atomically against project cuxzzpsyufcewtmicszk. All 162 historical completed Dev Studio jobs were superseded, with complete original snapshots preserved in their existing rows. Exactly 162 replacement jobs were created, with reciprocal links, reset execution state, and stage `awaiting_verified_replan`. Readback confirmed zero completed jobs, 162 new queued jobs, and 162 preserved originals. No historical command was replayed. New queued records are not evidence that a worker has accepted or executed them.

## Validation

- PARIS worker regressions: 115 passed, zero failed or skipped.
- Studio browser service regressions: 147 passed, zero failed, four skipped by their existing environment requirements. These are isolated service tests, not live browser acceptance.
- Targeted route, compatibility, media, publishing, agency and blueprint behavior tests: 29 passed.
- Scoped production-source lint passed after fixing two unnecessary catch wrappers.
- TypeScript transpilation found no syntax diagnostics.
- Full Admin typecheck attempted through the bounded validation runner, but exited 137 before producing a result. The pnpm lint launcher first attempted dependency reconciliation and was killed; direct scoped ESLint subsequently passed. Full platform typechecks, lint and production builds remain unverified.

## Limits and remaining work

This is a targeted source and live-record audit, not a claim that every repository line or authenticated user flow has passed. The 162 replacements require verified replanning and execution; generic queued Dev Studio commands do not have a universal background executor. Agency submission/editing/vision adapters remain unavailable, with explicit errors rather than fabricated success. Actual deployment, authenticated dashboard acceptance, immutable image verification and an autonomous PARIS repair remain to be demonstrated separately.
