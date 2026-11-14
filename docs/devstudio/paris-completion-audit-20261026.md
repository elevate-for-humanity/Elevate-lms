# PARIS completion audit — October 26, 2026

## Verdict

PARIS is implemented across chat, governed platform tools, Studio engineering,
course monitoring and code repair, but is not fully complete or production
certified. Authentication, deployment wiring and repair discovery defects are
addressed in PR #2165. Installation and live acceptance remain blocking.

This is a current source/data audit, not an assertion that every feature works.
Baseline source: main 57cdd411cca6b70cd4edc84e5e1820da1beb9e2a. Main advanced
to 4ed08595242bd44c8796f87e80a734a2bc63b5fc during audit with an independent
interoffice-mail repair (#2162); preserve that newer work.

## Verified findings and repairs in the one PR

| Finding | Evidence | Result |
| --- | --- | --- |
| Stored App key was unused | Shared resolver accepted GITHUB_TOKEN/workflow token only | Add repository-restricted, expiring App tokens, rotation and fail-closed configuration |
| PARIS test tool bypassed canonical resolver | lib/ai/tools/executor.ts githubToken read legacy env/store directly | Route through canonical resolver; workflow credentials retain precedence |
| Deployment tool pointed at absent deploy-production.yml | dispatchToolRequest used that filename; source lookup returned no file | Route explicit target through existing Google deployment dispatcher (default admin), reject unknown targets |
| OpenHands verifier did not use the App | Default Elevate-lms verifier read legacy key aliases only | Use canonical credentials for Elevate-lms; retain separate-repository behavior |
| Studio health could misreport App availability | Boolean GITHUB_TOKEN presence was treated as write availability | Probe the exact main ref with canonical credentials; do not call writes/dispatch verified |
| New App authentication file was outside repair denylist | Runtime engineer and independent workflow matched github-token but not github-app-token | Protect new credential implementation in both boundaries |
| Optional search failure blocked real repairs | Two recent repairs recorded GitHub code search failed: 401 | On Search 401, require successful exact-repository authorization before allowing directory/list discovery; rejected repository credentials still fail closed |
| Tax source gate rejected reviewed PWA metadata | #2159 added only manifest-supersonic-fast-cash metadata | Preserve immutable upstream digest, record reviewed local revision, test exact one-line difference |

Cloud rollout validates the existing Google secret, App installation and necessary
permissions before producing flags. It mounts a numeric secret version into the
existing zero-traffic Admin candidate, then retains current activation gates.
After exact live activation, an App token dispatches read-only verification; that
workflow must prove the expected runtime SHA and App-only repository access.
Secret names/permission configuration are not proof of successful access.

## Live evidence

Read-only Supabase observation during this audit:

- paris_autopilot_policy enabled, with a limit of 3 repairs/day.
- paris_code_repairs: 10 queued, 25 blocked; no successful repair state in this snapshot.
- Latest repair workflow 40309264415 failed during prepare; validation and publish
  were skipped. Its HTTP client lost the response after approximately five minutes.
  The repair ledger subsequently recorded GitHub code search failed: 401.
- The prior repair 40271246945 also recorded Search 401. Another earlier repair
  recorded an Elevate inference timeout. These are distinct failure categories.
- Past 24h supervision: 28 failed and 18 completed observations. AI chat accounted
  for 24 failures and 18 successful Elevate responses. This proves inference has
  worked, not that a current repair can finish.
- Monitored course jobs: 6 failed, 1 queued. Do not reset/replay these as part of
  an audit; diagnosis and checkpoint-specific recovery are separate.
- ai_tasks has 114 completed, 76 failed, 18 queued, 20 blocked and 15 awaiting
  approval overall; no new ai_tasks in the observed 24-hour window. These
  historical task counts do not certify the current PARIS UI.
- Successful scheduled monitor 40309240633 is not successful code repair.

GitHub App settings directly showed an installation offer for the organization,
not an installed PARIS App. An installation was prepared for Elevate-lms only.
The final Install button was not submitted. Browser disconnected afterward.

Supabase security/performance advisories were read. The PARIS repair-policy and
repair tables have RLS enabled without user policies; their server-only use via
service role is intentional and is not itself a missing-access repair. Runtime
events have a service-role policy. Task policies overlap and some PARIS foreign
keys lack covering indexes; no policies/indexes were altered. Broad database
policy changes are outside this release. See
https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
for the indexing advisory.

## Source capabilities and limits

- /paris uses the canonical Admin AI team page, administrator guard, durable
  Studio conversation and supervision panel.
- Commands run only through registered tools, authenticated actor roles,
  durable task receipts and applicable confirmations. Advisory output is
  distinguished from executed actions; queued work remains running.
- Engineering enqueues an owned repair; the signed workflow stages the patch,
  requires new regression tests, validates applications, then publishes and
  verifies deployment. The key does not grant permission to bypass that process.
- Studio terminal/browser use STUDIO_BROWSER_URL and STUDIO_BROWSER_SECRET;
  GitHub App setup does not configure those runtime connections.
- Course rendering, speech, email/SMS, billing and phone/PBX are separate service
  capabilities. Repository authentication does not certify them.
- Supervision explicitly excludes uninstrumented endpoints/external services.
  A healthy supervision panel does not establish full-platform health.

## Required acceptance before declaring complete

1. Install PARIS Engineer for Elevate on Elevate-lms with reviewed permissions.
2. Confirm existing Google secret name, enabled version, deployment identity
   access and runtime secret access; do not regenerate/copy a configured key.
3. Pass final-head protected CI and merge this one PR.
4. Verify exact Google image digest, ready revision and serving SHA.
5. Require successful App-only live verification and record its run ID. An
   Actions-token diagnostic or dispatch acceptance alone is insufficient.
6. In an authenticated PARIS session, test conversation restore, an actual
   read-only registered tool, durable receipt, approval handling and refresh.
7. Run one bounded owner-authorized repair through patch, regression tests,
   publication and exact deployment; preserve failures and evidence.
8. Verify owned inference, Studio terminal/browser, course checkpoint recovery,
   communications delivery and PBX call/audio/voicemail separately if they are
   included in the requested completion scope.

Forty focused tests and baseline TypeScript/lint checks passed before the deeper
audit fixes. New audit regression tests are wired into CI; they must pass on the
final PR head. Local browser/shell became unavailable; do not claim new local
build or live UI results after that disconnect.
