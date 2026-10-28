# Studio integration verification — 2026-10-28

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

- Studio/devstudio unit suite: **39 files, 187 tests passed**.
- Changed production components: targeted ESLint passed.
- Initial Admin typecheck passed. Production compilation and all 145 static routes passed; build trace collection was still running when this record was written. Final generated-route typecheck/build status must be checked separately rather than inferred from successful compilation. The build wrapper runs TypeScript after Next completes.
- Browser runtime release/configuration checks: 5 passed.
- No schema migrations, RLS changes, credential changes, or auth bypasses were made.

## Outstanding acceptance gates

1. Confirm the repair commit is the live `/api/version` commit, then inspect desktop and mobile layout and repeat browser/upload checks.
2. Run a complete Studio task through save, execution, repository write, deployment, and exact live-version verification. Current canonical health explicitly says this is unverified.
3. Investigate recurring provider refresh throttling with correlated server/provider logs if it persists; reducing browser poll overlap is not proof of a full authentication fix.
4. Tax self-filing remains a separate gate: the live attempted return stopped at administrator MFA/account verification, before dependents and filing. IRS test acceptance and real filing readiness have not been established by this Studio audit.
