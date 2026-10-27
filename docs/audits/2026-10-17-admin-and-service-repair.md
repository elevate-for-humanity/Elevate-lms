# Admin and service repair — 2026-10-17

## Scope and evidence

The authenticated Admin menu exposed 158 unique destinations. Each was opened in the browser and inspected after loading. The source inventory contains 474 Admin pages and 152 default-navigation destinations; every default destination has a source page. This navigation sweep does not certify every mutation, dynamic record, responsive viewport, or external integration.

Browser observations are in `2026-10-17-admin-navigation.json`. No approvals, payments, messages, course restarts, or record deletions were performed for navigation testing.

## Implemented changes

- Preserve two horizontally scrolling Admin navigation rows, with section selection and page links at every breakpoint. Remove the hidden All Tools catalog. Normalize the obsolete configured `/instructors` destination to the existing `/staff` page.
- Place communication notifications within the Studio viewport allocation. Embedded tools omit duplicate Admin chrome, retaining middleware and page authentication. Add a Suspense boundary for search-parameter-driven chrome.
- Replace unverified “operational” claims on account-less Student, Apprentice, and Host Shop previews with honest account-selection instructions; preserve preview restrictions.
- Provide Chat and Work modes, a visible tools row, and an immediately accessible browser. Load tools on first use and preserve their mounted state across mode changes.
- Route Course Builder audits to course status, Course Builder health, and Studio/browser readiness, independently of the generic Studio diagnostic.
- Evaluate actual task payloads before marking Studio steps verified. Persist verification failures promptly. Separate successful task execution from failed plan-checkpoint storage, and report a failed canonical run on unexpected planner errors.
- Give blocked hours entries a read-only detail panel with same-day ledger evidence and student navigation. Preserve submission, duplicate-credit, snapshot, and authorization checks. This does not implement automatic duplicate resolution or submit an apprentice's draft.
- Read Modules and Admin Store records through the privileged server client only after the existing Admin role guard. Live grant checks confirmed that authenticated SELECT is denied for modules, training_modules, store_products, purchases, and license_purchases; no table grants were broadened. Four authorization-boundary regressions pass.
- Correct instructor submission list and detail relationships against the live Supabase schema. Resolve profile names explicitly because submission/actor foreign keys reference `auth.users`, not `profiles`. Use the actual lesson FK name.
- Remove recursive Docker exclusions for `reports` and `logs`, which excluded Next pages and APIs. Root generated reports/logs and secrets remain excluded. Validate the specific paths using the Docker-compatible matcher and a repository-wide route-collision regression check.
- Correct the course-dispatch regression test: execution/deployment workflows own the shared worker lane; the delegating queue-request workflow owns a separate lane to avoid deadlock.

## Service observations

Google inventory run: https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/39028066991 (2026-10-17 11:16 UTC). The inventory authenticated successfully. Its `ready: null` values reflect an incomplete condition projection and must not be interpreted as healthy or unhealthy.

| Service | Observed serving source/revision | Evidence / outstanding work |
| --- | --- | --- |
| Marketing | 43e37c9d9b55; r43e37c9d-39016126670-1 | Public health HTTP 200, ready, Supabase auth/database checks passed. Full public layout verification remains. |
| LMS | 8ef29879f3d9; 00167-xj2 | Public health HTTP 200, ready, Supabase checks passed. Individual learner/role workflows remain. |
| Admin | aa10c18af951; 00189-p6g | Public health HTTP 200. Browser sweep found report 404s, old instructor link, Modules error, submissions error, Store query error, and Studio workflow failures. |
| Store | 43e37c9d9b55; r43e37c9d-39016165723-1 | Initial custom-domain health timed out; follow-up readiness and homepage HTTP 200, Google service health HTTP 200 with database checks passing. Admin Store query error remains a separate issue. |
| Studio Browser | serving 00009-rf2 | Latest-ready revision differs from traffic revision. Browser task returned a useful read-only course audit after navigation; aborted browser requests remain in its evidence. |
| Course Builder job | latest execution elevate-course-builder-9w92l | Configured 4 vCPU/8 GiB, one task/parallelism one. Current media QA reports a 4.40-second freeze, repeated moving sequence, and stale/unconfirmed supervisor heartbeat. Production completion is not verified. |
| Video render job | latest execution elevate-video-render-ggtsk | Configured 8 vCPU/32 GiB. Latest execution identifier alone is not proof of current activity or success. |
| Notifications | run 39026777120 | Google authentication passed, GET review reported 1,027 held items; processing failed. Do not release held messages as part of an audit. |

Observed us-central1 effective quota: 20,000 milli-vCPU and 42,949,672,960 bytes (40 GiB). Configured web-service maximum estimate: 15 vCPU/32 GiB. This is not measured concurrent allocation and excludes job/rollout overlap. No quota or scaling settings were changed.

Latest course recovery run 39025733850 failed in `execute-course-job.test.mjs` before Google auth; the delegator lane assertion was stale. Latest Admin deployment run 39016137492 rejected a superseded commit before Google auth/build, rather than proving an authentication failure.

## Verification

- 57 focused Vitest tests passed across Admin layout/navigation, hours approval/review, planner, conversation preservation, and task reconciliation.
- The exact 50-test course-dispatch preflight suite passed after the concurrency-contract test correction.
- Two Next route/build-context tests passed; Docker-compatible path checks retain report/log routes and exclude credentials/dependencies/generated root artifacts.
- Admin TypeScript check passed before the final layout Suspense addition; production build includes a fresh generated-route typecheck.
- Full lint passed before the final small test/layout additions; final verification is recorded at release time.

## Still open

Post-deployment readback of the Modules and Admin Store query repairs; course media QA and heartbeat/dispatch completion; natural voice input/output device verification; all-device/PWA layout acceptance; phone/email/payment integration acceptance; additional infrastructure/services beyond the selected Cloud Run inventory. These are not certified by a successful page load or basic health endpoint.

Automatic workspace maintenance removed earlier unpublished public-media/intake changes. They were not recovered from GitHub and are not represented by this repair diff. The earlier live configuration change removing the unused drug-screen requirement is separate from this source release.

A broader source scan found 95 Admin pages that reference tables without direct authenticated SELECT alongside the session client. This is a candidate list requiring receiver/authorization review: some pages also use a privileged backend. It is not proof that all 95 pages fail. Full service/backend coverage remains in progress.

Four server data authorization tests and 20 existing portal access/preview tests passed after the private-table client and preview-copy changes.

## Release verification update

- 81 tests passed in one bounded 13-file Vitest run after all application changes.
- Full repository lint passed, followed by a fresh quiet lint of changed source/test files.
- Admin, Marketing, and LMS production compilation and generated-route typechecks all passed before publishing.
- The existing ownership-inventory workflow now runs when its read-only script changes. Its script enumerates every Cloud Run service/job returned for us-central1, existing Compute VMs/disks, scheduler jobs, storage metadata, and recent course/video executions. These additions do not change IAM, quotas, scaling, traffic, secrets, or jobs.
- QuickBooks plugin company lookup succeeded for Elevate for Humanity. The website integration page separately reports not connected and token-refresh/reconnection failure. The plugin connection is not proof that the website OAuth connection works.
- A receiver-specific follow-up scan identified session-client queries against restricted tables in 67 Admin, 31 LMS, and 38 Marketing pages. These require individual role/ownership review; no blanket table grants or automatic service-client replacements were made.
