# Admin heap and CI runner audit — 2026-11-23

## Failures established

Admin compilation/static generation completed, but the subsequent monolithic TypeScript check exhausted its 4096 MiB heap (exit 134). A warm 5120 MiB check passed; a cold check at that limit was killed after 51 seconds at approximately 4188 MiB RSS. A source-only cold probe was also killed. A larger heap or omission of route validation is not sufficient evidence of repair. SIGKILL alone does not establish an OS/cgroup OOM.

The measured Admin baseline has 2697 configured roots and an 8435-file resolved graph: 1205 generated route files, 1498 Admin files, 1201 shared files and 4531 dependency files. Counts are observations, not fixed production limits.

Marketing also reproduced SIGKILL with filesystem caching enabled at a 3072 MiB heap and approximately 4844 MiB child RSS. With that cache disabled, the same heap completed compilation, standalone packaging, CSS budgets and every generated-route check at 3079 MiB peak child RSS, approximately 36% less than the failed run. The OS cause of SIGKILL remains unverified.

The PR required gate could hold an Ubuntu runner polling browser completion for up to 135 minutes. Waiting receipt jobs can consume capacity needed by browser shards.

## Line-by-line corrections

| Source | Before | After |
| --- | --- | --- |
| `scripts/build-next-app.mjs` postcompile command | One `tsc --noEmit` graph | Sequential compiler processes covering every configured source root and generated validation block |
| `scripts/typecheck-next-app.mjs` planner | No separate planner | Parses the full graph in a short-lived process to discover global scripts and transitive ambient/module augmentations |
| Compiler lifetime | All semantic types retained in one process | At most 300 ordinary roots or generated validation blocks per fresh process, plus dependencies and original/transitive globals |
| Generated `validator.ts` | One large semantic graph | In-memory groups preserve common declarations, every block exactly once and diagnostic line/column positions; generated files are not edited |
| Incremental state | Warm state could hide the cold resource requirement | Each group validates cold and writes no build-info cache |
| Canonical typecheck commands | Direct `tsc` could recreate the same failure after a build | All three app commands use the same runner under existing bounded admission |
| Marketing cache | Unconditional Next-selected filesystem cache | Honors `DISABLE_WEBPACK_FILESYSTEM_CACHE`; bounded builders default to `1`, persistent-cache builders may explicitly opt in with `0` |
| CI TypeScript cache | Restored/uploaded monolithic build-info | Removes cache transfer that the cold grouped checker does not consume |
| PR receipt job | Polls while occupying a runner | One exact-head inspection; pending evidence fails closed and releases the runner |
| Browser completion | No event-driven receipt continuation | Trusted completion finalizer retries only the existing failed receipt after all diagnostics and exact-head browser evidence pass |
| CI regressions | Existing memory/gate suites | Adds cold coverage, ambient scope, error propagation, cache controls and bounded completion-order/race tests |

The shared heap/cgroup budget, build lock, production Next compilation, authentication, application records, branch protection and release gates are preserved. This repairs build-time memory use; no Admin runtime memory improvement is claimed.

## Completed local verification

All three standalone production build commands passed with a 3072 MiB heap on baseline `8d75cba78741cf8fe69dceaf261853f0f4723024` plus this repair:

| Application | Complete build | Cold compiler groups | Measured memory |
| --- | --- | --- | --- |
| Admin | Passed, 755 seconds | 2697 roots / 14 groups | 2327 MiB semantic-check peak; 1420 MiB planner; 2994 MiB full-build child peak |
| Marketing | Passed, 601 seconds | 2418 roots / 13 groups | 3079 MiB full-build child peak |
| LMS | Passed, 364 additional seconds | 1632 roots / 9 groups | Marketing/LMS combined run never exceeded 3079 MiB child RSS |

No type or lint failure was ignored to obtain these passes. Database/network-dependent catalogue completeness is not certified by a build command.

- 30 build/memory tests, 51 CI policy/receipt tests and five Marketing cache boundary tests passed: 86 total.
- Changed-file ESLint, repository lint, workflow YAML validation, whitespace checks and the eight packaged Admin critical-route files passed verification.
- Negative tests prove source and final generated-group errors still fail, and transitive global declarations remain visible in every group.
- A standalone startup reached Next readiness but correctly rejected missing runtime Supabase settings. No placeholder service-role credential was supplied; authenticated runtime acceptance is not claimed.

## CI completion safety

`resume-ci-browser-gate.yml` listens to completion of CI and desktop E2E, supporting either completion order. Its privileged `workflow_run` executes only the immutable default-branch SHA, checks out no PR code and restores no PR cache/artifact. Actions write permission is used only to retry the existing failed receipt job.

The controller requires all eight diagnostic jobs, a unique current open main-targeting PR, latest successful exact-head browser execution and all required browser jobs. Changed head/base/repository, incomplete inventories, failed/skipped diagnostics, failed/pending browsers, superseded CI events and previously retried CI runs cannot trigger a retry. There is at most one automatic receipt retry per original CI run. No successful required check is fabricated.

The workflow becomes automatic only after reaching the default branch. Initial rollout may need one normal gate-job rerun after its browsers finish. Live event-driven completion is unverified until an actual workflow run proves it.

## Integration and release evidence

After local builds, main advanced to `158600e73ef7962490f0d69d036b26179fdae65e`. The repair was integrated onto that baseline without conflicts or changes to its existing Admin, PWA, email, HVAC or OpenHands updates. Local build results above do not certify a different source commit: fresh exact-head CI is required after this integration.

No production deployment is established by these local results. Production evidence requires exact-commit CI, the Google immutable image/ready revision and live runtime SHA. No application record, contractor eligibility or payment was changed by this repair.
