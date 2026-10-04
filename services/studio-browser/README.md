# Studio browser: direct CDP

Studio's embedded browser and Course Builder browser jobs share this service. The
repository audit at `fee9b35fe04c9e8bb3347a155d4e6d26a044abb6` found the existing
shared REST service and Playwright Chromium launcher, but no independent CDP
transport to reuse. This implementation replaces that launcher inside the same
service. It does not create a second browser service, session database, or course
pipeline. The earlier draft's `cdp-session` Playwright bridge is superseded.

## Ownership and connections

- `cdp-transport.mjs` starts Chromium and owns its private debugging pipe, command
  IDs, session routing, limits, timeouts, and process/profile cleanup. No debugger
  TCP port or raw CDP socket is exposed to dashboard clients.
- `cdp-browser.mjs` owns isolated browser contexts, tabs, lifecycle events, iframe
  targets, navigation, screenshots, downloads, dialogs, uploads, request cookies,
  and browser evidence. It implements the methods consumed by the existing service.
- `cdp-dom.mjs` resolves controls and dispatches Chromium keyboard/mouse input,
  including frame offsets and open shadow roots.
- `cdp-storage.mjs` preserves the existing cookies, localStorage, and IndexedDB
  state shape so the encrypted provider-session store remains the source of truth.
- `server.mjs` retains authenticated REST endpoints, owner/session scoping, URL
  validation, provider verification pauses, downloads, imports, and browser jobs.
  Per-session action batches are serialized. Human input pauses automation before
  its next action; starting/resuming a task explicitly releases manual control.

Ultimate Course Builder is the primary consumer for this migration. Its
`worker/request-media-dependency.ts` links missing-media jobs to the existing
`/studio/browser?acquisitionRunId=...` workspace; its
`adapters/platform-learner-runtime.ts` uses the authenticated browser worker for
learner verification. Those paths keep their existing orchestration and persistence.

The dashboard verifies the active tab using authenticated `GET /sessions/:id/cdp`.
This endpoint actually sends `Page.getFrameTree`; a label alone does not establish
connectivity. Course Builder consumers continue using the same service contract.
The service package and production image have no Playwright dependency. Unrelated
repository Playwright tests remain available.

## Running and verifying

Use Node 22, Chromium, and `zip` (the production Dockerfile installs these).
`STUDIO_BROWSER_EXECUTABLE_PATH` defaults to `/usr/bin/chromium`. Existing service
secrets, provider-session encryption configuration, storage directory, and port
settings retain their names and behavior.

```sh
npm --prefix services/studio-browser ci
STUDIO_BROWSER_EXECUTABLE_PATH=/usr/bin/chromium npm --prefix services/studio-browser run check
```

The executable variable enables real-browser tests. Without it, the integration
fixtures explicitly report skipped; that is not release evidence. The dedicated
`studio-cdp-validation.yml` workflow builds the actual production Dockerfile and
runs every service test with its installed Chromium under the nonroot service user.

Local verification on 2026-10-04:

- 88 service checks passed, zero skipped, using real Chromium 153; includes all
  14 HTTP foundation checks, navigation, trusted input, same/cross-site iframes,
  popups, mobile geometry, open shadow roots, upload/download/dialog handling,
  cookie isolation, storage restoration, evidence ZIPs, and manual takeover.
- Combined Ultimate, dashboard/API, practical review, and staged QA regression tests pass; see the PR for the final count.
- Scoped Studio and full Admin TypeScript checks passed.
- Changed TypeScript files and new CDP modules passed ESLint.
- Service `npm ci` and lockfile validation passed.
- Admin production build passed (142 static pages). It required a complete source
  checkout, `GIT_SHA`, and a 6 GiB Node heap; type/lint were run separately because
  the repository build configuration skips those checks.

## Compatibility boundaries and release checks

This is a purpose-built adapter for existing Studio consumers, not the complete
Playwright API. Closed shadow roots are not traversed. Cross-shadow selectors use
chained locators. IndexedDB values unsupported by the state encoder fail explicitly
rather than silently losing data. Evidence ZIPs contain `cdp-evidence.json` in
`studio-cdp-evidence-v1` format; they are not Playwright Trace Viewer archives.

Before release, require the Docker/Chromium workflow and Admin production build,
then exercise authenticated provider login/resume and a complete course import in
the deployment environment. Local fixture tests do not prove external provider
compatibility. Live provider acceptance has not been established by these scoped checks. No deployment is implied by this PR.

Roll back by deploying the previous service and Admin revisions together. Retain
the existing encrypted provider state and encryption key; no second browser
session store is introduced.


## Integration audit follow-up

The deeper predeployment audit found and repaired missing main-document lifecycle
notifications (OAuth checkpoints), public storage-helper tabs (focus theft),
unhandled browser restart failures, leaked renderer processes, concurrent session
capacity oversubscription, and SSE disconnects invalidating browser checkpoints.
Learner verification now selects the exact lesson build being processed.

Media arrival is now atomic with the existing worker queue. Apply
`20261004150000_ultimate_media_dependency_wakeup.sql` through the official migration
workflow before deploying the changed Admin or Ultimate worker. Both deployment
workflows check the read-only schema capability before installation/build work.
The migration regression executes the actual SQL in PostgreSQL and covers stale
worker yield/failure/completion, merged arrivals, targeted acceptance scope, and
already-published builds. The forward migration remains compatible with the
previous worker; rollback code does not require deleting queue state.

Missing media uses the existing durable Studio acquisition request. Its browser
execution begins when the owner opens the acquisition workspace; there is no
separate background browser runner. The course resumes after licensed files are
actually attached, not merely selected or requested. Practical-required staged learner acceptance now uses the same submission/review
policy as the published workflow with an isolated adapter in the existing QA run
record. The runner uploads an actual, explicitly synthetic PNG, submits through
the QA UI, exercises rejection and revision before approval, checks persistence,
and signs the artifact metadata and review history into its evidence. It neither
creates a real learner enrollment nor awards mastery, hours, or credentials.

For published lessons, the existing practical submission/review tables now feed
the actual completion gate, and the existing instructor review area exposes the
queue. Authorized reviewers must explicitly confirm every required competency.
The latest rejection or requested revision overrides older approvals. Missing
rubrics remain blocked; other playback/assessment/workplace requirements remain
part of normal lesson completion.


Read-only CI checks compare the configured Browser/Admin/Ultimate/LMS connections,
credential equality (without printing secrets), auth-volume attachment, and actual
required database columns with zero learner rows requested. Configured provider
storage readiness includes a private write/fsync/delete probe; unavailable storage
makes the service unhealthy instead of silently losing logins at restart.
