# Studio integration verification — 2026-10-28

**Final release status: blocked by an absent required GitHub App private-key secret.** The Studio repairs are published and tested, but Admin still serves `34fb71e`. The tested image rollout stopped before changing traffic with `PARIS_APP_SECRET_NOT_FOUND`.

This records a targeted source review and live integration audit. It is not a certification of every repository line, every RLS policy, or IRS filing readiness. No credentials or customer data were included in the test fixture.

## Live/source comparison

The live Admin version endpoint reported commit `34fb71e516617cb97b2dbe32687e9943e0129498`, revision `elevate-admin-migration-00293-t2g`, built October 26. Repository main was `9006a5c5e168fcdec48b5e9e9a7854daecfbc861` at review. The four Studio UI components changed in this repair were identical between that live commit and main before editing; their usability problems therefore existed in source as well as production.

| Connection | Evidence observed | Limit |
| --- | --- | --- |
| Admin runtime | `/api/health` healthy/ready; required configuration present | A health response is not a complete workflow test |
| Browser control | Live Chromium acceptance: all 15 checks passed, including keyboard/pointer, uploads, downloads, tabs, viewport restoration and navigation | Does not establish uninterrupted operation for every user session |
| Repository | Canonical Studio health verified GitHub token against repository; repository capability health healthy | No generated-code-to-deployment end-to-end run was performed |
| Supabase schema | All 66 literal `.from(...)` table names found in the Studio API and `lib/devstudio` existed | Dynamic names, every column, RPC, and all RLS combinations were not exhaustively checked |
| Task persistence | Live tasks health successfully queried `ai_tasks` | Does not prove every worker can finish every task |
| Upload persistence | Live UI uploaded `studio-connection-check.txt`; database confirmed one document, extracted text, documents bucket, unexpired signed URL | First attempt returned `Failed to fetch`; refresh then retry succeeded. Intermittent reliability remains to monitor |
| Private document storage | `documents` bucket exists, private, 50 MB limit; upload columns match route insert | No bucket access policies were weakened |
| AI runtime | Canonical health: private owned model verified reachable (HTTP 200); Cloudflare reachable/authenticated | Other provider key presence is configuration evidence, not a successful generation test |
| Google environments | Containers health: Marketing, LMS, Admin, Store healthy/ready | No arbitrary container provisioning test performed |
| Execution pipeline | Canonical health: prerequisites configured; `verifiedEndToEnd: false` | Must not present this as a completed end-to-end workflow |
| Authentication | Browser console recorded refresh throttling/retry-window errors | Successful authenticated health calls do not eliminate intermittent refresh problems |

## Source repairs

- `StudioCommandWorkspace.tsx`: always expose desktop tools sidebar; enlarge header and tool text; add visible upload label connected to the existing attachment input; preserve mounted browser across tool switches.
- `StudioCapabilityRail.tsx`: readable tool names, neutral background, direct link to existing environment-variable manager, clearer environments/containers label.
- `UnifiedEllieChat.tsx`: expose input ID for workspace upload control, keep Files control visible on mobile, use neutral assistant bubble background.
- `CloudBrowserWorkspace.tsx`: show browser controls initially; fit normal browsing to width instead of shrinking the page to fit height; preserve sign-in screen fitting; serialize status polls; stop polling on authorization rejection; surface interrupted control status and sign-in recovery; handle malformed status responses.

## Validation

- Studio/devstudio unit suite: **42 files, 195 tests passed**.
- Changed production components: targeted ESLint passed.
- Initial Admin typecheck passed. Production compilation and all 145 static routes passed; build trace collection was still running when this record was written. Final generated-route typecheck/build status must be checked separately rather than inferred from successful compilation. The build wrapper runs TypeScript after Next completes.
- Browser runtime release/configuration checks: 5 passed.
- No schema migrations, RLS changes, credential changes, or auth bypasses were made. The repository metadata index was populated as described below.

## Outstanding acceptance gates

1. Confirm the repair commit is the live `/api/version` commit, then inspect desktop and mobile layout and repeat browser/upload checks.
2. Run a complete Studio task through save, execution, repository write, deployment, and exact live-version verification. Current canonical health explicitly says this is unverified.
3. Investigate recurring provider refresh throttling with correlated server/provider logs if it persists; reducing browser poll overlap is not proof of a full authentication fix.
4. Tax self-filing remains a separate gate: the live attempted return stopped at administrator MFA/account verification, before dependents and filing. IRS test acceptance and real filing readiness have not been established by this Studio audit.

## Follow-up findings and repairs

- The editor initially did not list the newly published audit. Opening Runtime + Terminal synchronized its checkout; the terminal then verified `84c40749a4bfdae5072cc0c97052763447ffaa28`, which also matched repository main at that check. A saved terminal can reconnect without synchronizing, and the editor itself previously provided neither revision comparison nor sync control. The repair exposes both revisions, a status refresh, and the existing safe fast-forward synchronization action. Pending editor changes disable synchronization.
- `ai_repo_index` existed but contained zero records. Its schema uses `file_path`, `file_type`, and `metadata`; the old live `34fb71e` search queried nonexistent `language` and `symbols` columns and swallowed errors as empty results. Main already repairs that column contract, but it still must deploy.
- Production Admin images contain compiled bundles, so indexing the local server filesystem is not authoritative. The follow-up indexer reads GitHub at one pinned main commit, rejects truncated trees, bounds the request to 1–2000 files, and writes path metadata in batches. Metadata explicitly records `content_indexed: false`; this is path search, not semantic/content indexing. Explicit local `roots` workflows retain content/symbol extraction.
- To restore the empty data source immediately, 400 path records from verified repository commit `84c40749a4bfdae5072cc0c97052763447ffaa28` were inserted without overwriting existing records. A subsequent count verified all 400 snapshot records. The live old search still returned empty because of its column mismatch; deployment is required to expose the corrected query. An empty index will report degraded after the route repair.
- Plugins panel: GPU renderer is configured but not ready; Cloudflare control-plane credentials are not configured. Cloudflare Workers AI is a separate, authenticated working connection. These optional capabilities were not relabelled healthy.
- Provider logs in the 03:36–03:38 UTC window recorded three HTTP 429 authentication responses. Console refresh throttling was also observed. These are real reliability findings, not evidence of a missing Supabase database.
- Supabase advisor results include existing policy/performance notices. Missing-policy informational notices on three Ultimate build tables were not automatically fixed: service-only access can intentionally use RLS without browser policies. No unused indexes were removed based solely on advisory labels. MFA options and one unrelated pacing function require separate security review ([MFA guidance](https://supabase.com/docs/guides/auth/auth-mfa), [function guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)).
- Fast-forward runtime synchronization tests: 2 passed, including preservation of tracked/untracked changes and refusal of conflicts or a mismatched repository origin.
- First repair production Admin build and generated-route typecheck passed. Follow-up compilation/static generation passed; final build trace/typecheck verification remains in progress at this report update.

## Final local validation and release queue repair

- Both Admin production builds completed successfully, including generated-route TypeScript analysis. The follow-up bundles were inspected for the new GitHub indexer and checkout synchronization controls.
- AST-based comparison of 99 literal Studio insert/update/upsert objects across 26 tables found no missing write columns. This does not cover dynamic objects, every select expression, or RPC signatures.
- GitHub rejected the follow-up request with `SUPERSEDED_RELEASE_REQUEST` before its build because newer main requests existed. Newer resume changes were confirmed descendants of the Studio repairs.
- The Admin rollout guard also rejected successfully built/uploaded images whenever a newer request existed. Its replacement still requires the trusted Admin build/upload job to have succeeded, binds the exact run SHA, fails closed on unreadable job history, and refuses an older image if any newer Admin rollout has begun. Immutable image-digest verification, zero-traffic candidate testing, live exact-version acceptance, and the latest-request check before expensive builds remain in place.
- Release guard/activation/concurrency tests: 48 passed. Workflow syntax tests: 2 passed. The release-policy change itself does not require recompiling application source.
- At the last live check, Admin still reported `34fb71e`; no new source revision is claimed live until the deployed version confirms it.

## Final verified state and owner action

| Public service | Observed live commit | Build timestamp |
| --- | --- | --- |
| marketing | `818d274c` | 2026-10-28T04:43:54Z |
| lms | `293130a9` | 2026-10-28T04:46:18Z |
| admin | `34fb71e5` | 2026-10-26T11:25:42Z |
| store | `4e4b064e` | 2026-10-28T04:39:11Z |

- The full required CI gate passed for `4f81559e`: lint, TypeScript for Admin/LMS/Marketing, functional tests, enrollment database checks, and repository hygiene.
- Google built and uploaded the core Admin image at `4f81559e` and the responsive-header image at `293130a9`. The latter preserves access to the enlarged title, upload, and navigation controls on narrow screens; its five targeted UI tests and lint passed.
- A duplicate `completed_at` property in a concurrent course-persistence change caused TS1117. Commit `4f81559e` removes only the duplicate; latest-main Admin typechecking passed afterward.
- The revised tested-image rollout gate passed in the real deployment. Google capacity preflight also passed. Rollout then stopped at the missing App-key secret, before creating a new Admin revision or moving traffic.
- Read-only credential inventory completed at 05:06 UTC. Runtime configuration and Secret Manager names were readable. Admin has a repository token, but no configured App private key, key-file binding, or key-file content. The expected dedicated App-key secret was absent. Supabase's canonical and legacy stores also had no App private-key entry. OAuth client credentials are a separate integration.
- The inventory emitted only binding names and presence flags; six metadata-redaction/workflow-syntax tests passed. It did not expose credential payloads or change production configuration.
- Additional schema comparison: 170 literal select expressions across 63 tables had no missing selected root columns. Both directly referenced RPCs exist and their argument names match the callers. Dynamic expressions, related-resource embedding, and destructive RPC execution were not certified.

**Required owner action:** restore the existing RSA private key for GitHub App `5477907` to Secret Manager secret `paris-engineer-github-private-key` in Google project `elegant-racer-299721`, or set `PARIS_GITHUB_APP_SECRET` to the correct existing App-key secret name. Use the protected secret store for the value. Once available, rerun the failed deployment job for the already tested image; its digest, candidate health, and exact live-version checks remain enabled.

The new Studio frontend walkthrough remains pending deployment. Optional GPU readiness and Cloudflare control-plane configuration remain incomplete. A complete automated Studio engineering workflow and IRS test acceptance have not been established. The attempted tax self-file flow stopped at account/MFA verification before dependents and filing.
