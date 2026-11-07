# PARIS output integrity audit — November 7, 2026

This audit follows the owner request to remove fabricated results and inspect the remaining library-level success paths. Baseline: `fa4843aed86556884d829c58567db9c3fa754039`. Integrated with PR #2479 at `be2fe4766a2d30d652b9f468f17309485606276a`, preserving its canonical execution/provider delegation and measured analytics. A source correction is not evidence that production has deployed it.

## Scope and reproducibility

Reviewed the known fabricated-output functions line by line, their callers, every success/ready/executed assignment inventoried in the PARIS libraries, database persistence boundaries, and the canonical command/repair status adapters. The accompanying scanner inventories 44 files under `lib/paris` and the surrounding AI/Dev Studio adapters. It checks known fabrication signatures and inventories success claims; it cannot establish that arbitrary unseen defects do not exist or prove live deployment.

Run:

```sh
node scripts/audit-paris-output-integrity.mjs
node node_modules/vitest/vitest.mjs run tests/unit/paris-output-integrity.test.ts --maxWorkers=1
node --max-old-space-size=4096 node_modules/typescript/bin/tsc -p tsconfig.paris-integrity-check.json --pretty false
```

The GitHub PR diff preserves exact before/after lines, including comments. Scanner output includes current source line numbers for every inventoried claim.

## Findings and source corrections

| Source and function | Unsupported behavior before correction | Corrected behavior / evidence required |
|---|---|---|
| `lib/ai/paris-ai.ts` / `sendMessage` | Missing credentials, HTTP errors, and network failures produced demo success replies | Delegates to the canonical provider runtime; errors propagate and empty responses fail |
| Same / `executeCommand` | Parsed model JSON or free text could claim successful execution without any tool invocation | Requires authenticated context and delegates to the real command controller; success requires its completed execution receipt |
| `lib/paris/media-studio/api.ts` / `generateImage` | Random Picsum stock image labeled as generated | Calls the configured image provider with the actual requested prompt; returns its artifact only; unavailable/empty provider fails |
| Same / `editImage` | Appended `?nobg=true`, returned unrelated stock, or returned the unchanged input as a successful edit | No success until an actual editing integration exists; reports the exact missing capability |
| Same / `generateAltText`, `optimizeImage` | Fixed image description and unperformed transformations represented by arbitrary URL parameters | Missing inspection/transformation integration is explicit; no invented description or transformed artifact |
| Same / stock search | Provider failure looked like a successful search with zero results | Provider failures/configuration gaps are errors, not measured zero results |
| Same / brand assets | Invented default logo paths substituted for absent organization assets | Returns mapped stored brand values or missing/error evidence |
| Same / search/statistics | Stored snake_case values were cast to camelCase, causing incorrect usage/size results; AI search always returned zero | Maps the actual stored fields, preserves unknown file size as null, and searches saved AI assets within the organization |
| Same / save and collections | Prefixed non-UUID IDs and camelCase columns incompatible with the current schema | UUID identifiers and actual database column names; returned stored row is authoritative |
| `lib/paris/marketing/index.ts` / `analyzeContentPerformance` | Every item received score 75 with canned findings | Returns actual stored published-post measurements; missing measurements fail; normalized score remains null without a defined methodology |
| `lib/paris/marketing/content-generator.ts` | Sample examples could be copied into output; ignored database insert errors; invalid prefixed IDs | Drafts use supplied facts, are labeled template drafts, use UUIDs, and require matching returned saved IDs |
| `lib/paris/marketing/video-creator.ts` | Script objects did not explicitly distinguish draft text from rendered media | Script results identify template/draft provenance and `rendered: false` |
| `lib/paris/dev-studio.ts` / command results | Claimed content queued with no queue operation; analysis called an API connection or completed import; training agent called ready | Explicit missing publish receipt; analysis/drafting/training statuses accurately described |
| `lib/paris/import-engine/api-importer.ts` | Invented `api.example.com` server; generated nonfunctional endpoint returned success | Resolves the actual specification server against its source; unresolved server variables fail; unimplemented generated endpoint returns HTTP 501 and success false |
| `lib/paris/import-engine/github-analyzer.ts` | Supplied token was never used; assumed branch; denied contents treated as empty | Identity is passed on all requests; actual default branch is used; denied/unavailable repository reads fail |
| Same / dependency/security/license analysis | `deps.apollo-server` and `.replace()` on RegExp broke analysis; unknown license defaulted compatible; guessed fonts; dependency presence treated as verified vulnerability | Correct property/regex handling; source indicators distinguished from proof; unknown licensing unverified; no guessed fonts |
| `lib/paris/import-engine/compatibility-reporter.ts` | Static confidence numbers and “ready” states could imply verification | Static heuristic provenance and `runtimeVerified: false`; candidates require testing; report uses actual owner/repository fields |
| `lib/paris/licensing-platform.ts` | New objects automatically active/published/production ready/WIOA eligible with assumed renewals and renewal prices | Pending license, draft curriculum, eligibility/production unverified; unknown measurements null; current offer and actual seats required for renewal quote |
| `lib/paris/qa-designer.ts` | Empty denominators scored 100; generated licensing metadata scored perfect and asserted maintenance entitlement | Empty evidence scores zero; no fabricated licensing evidence; structural estimate separated from live readiness |
| `lib/paris/paris-knowledge.ts` | Duplicate exported blueprint constants broke module loading; interview score produced assumed 25/50/75 percent funding | Both blueprint collections preserved with original overlap precedence; funding percentage unknown until actual funder authorization |
| `lib/paris/workforce/agent-manager.ts` | Invalid prefixed IDs; persistence errors ignored; local IDs returned even when saves failed; clone metadata/copy failures hidden | UUID IDs, stored-row receipts, query errors surfaced, clone and cleanup failures checked |
| `lib/paris/workforce/approval-workflow.ts` | Assumed missing amount was zero, missing records were empty; unverified rate window passed; approval writes and expiration ignored errors | Required facts cannot be invented; unverified window requires review; compare-and-set pending state and saved-row receipts; console log explicitly not notification delivery |
| `lib/paris/workforce/index.ts` | Pending approval returned success; running/advisory work logged completed; role reassignment silently ignored requested role | Pending is unexecuted; completion status requires actual completed execution; unsupported reassignment fails explicitly |
| `lib/paris/application-self-service.ts` | Requirement query failures treated as no requirements; decisions/answers returned after unchecked saves | Required reads and writes must succeed; application state must return a saved row before acknowledgement |
| `lib/devstudio/paris-code-engineer.ts` | Candidate SHA logged as main SHA | Candidate SHA is accurately named; existing independent validation, write readback and live-release gates remain enforced |

## Retained and distinguished

- Real command execution already distinguishes accepted/running, completed, approval required, failed, and advisory. `executed: false` advisory responses are not deployment or mutation receipts.
- Portal incident acknowledgements require an actual authenticated incident ID.
- Interview provisioning returns success only after its checked persistence operations. No additional enrollment or live-data mutation was performed by this audit.
- Question rubrics, creative draft structure, configuration defaults, unique identifiers, and input-field hint text are not measured outcomes. They must not be mislabeled as approvals, provider execution, rendered media, or saved records.
- Static compatibility/readiness scores are explicitly estimates. Existing draft templates remain authoring inputs; sample examples are no longer copied into generated marketing output.

## Verified schema evidence

Read `information_schema.columns` in Supabase project `cuxzzpsyufcewtmicszk`. `ai_agents`, `agent_activities`, `agent_knowledge`, `agent_memories`, `approval_workflows`, `generated_content`, `media_items`, and `media_collections` use UUID primary keys. Media fields include `thumbnail_url`, `used_on`, `used_count`, `file_size`, `created_at` and `updated_at`. Brand logo/color/font fields are individual snake_case columns. This audit changed source mappings, not production rows or schema.

## Validation and limits

- 33 audit behavioral regressions cover unavailable providers, model-only success claims, actual provider artifact propagation, unimplemented edits/analytics, database failure and missing receipts, current schema mappings, actual GitHub credentials/default branch, denied repository reads, imported endpoint scaffolding, unknown funding, and source regression scanning. The combined focused set with existing PR #2479 tests and the corrected receipt fixtures passes 84 tests; the worker readback/deployment/log/caption set passes 23 tests.
- Scoped TypeScript check for the PARIS library tree and its new tests passes after correcting the legacy module defects surfaced by that check.
- ESLint and whitespace validation pass for the audited library changes.
- The isolated audit branch full run found the same seven known outdated receipt assertions fixed in PR #2478, plus one test-worker process exit. Its corrected three Vitest fixtures and caption-helper binding are included in this integration; runtime receipt guards remain enforced. The earlier PR #2478 full run passed 6,740 tests with five skipped. These are distinct runs, not a claim that the final combined branch has passed the full suite.
- Full combined suite / protected CI and deployment receipts must be checked separately. No claim that this audit branch is live, that missing image editing/vision integrations now exist, or that autonomous PARIS repair acceptance has passed.

Remaining capability dependencies are explicit: editing provider, verified image inspection/optimization, actual stored publishing measurements, real publishing job receipt, notification delivery integration, verified licensing and funder terms, and live release/repair acceptance. A missing dependency is never replaced with invented values.
