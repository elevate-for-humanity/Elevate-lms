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

- 73 service checks passed, zero skipped, using real Chromium 153; includes all
  14 HTTP foundation checks, navigation, trusted input, same/cross-site iframes,
  popups, mobile geometry, open shadow roots, upload/download/dialog handling,
  cookie isolation, storage restoration, evidence ZIPs, and manual takeover.
- 31 focused dashboard/API/planner tests passed.
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
compatibility. Marketing/LMS production builds and live provider acceptance have
not been established by these scoped checks. No deployment is implied by this PR.

Roll back by deploying the previous service and Admin revisions together. Retain
the existing encrypted provider state and encryption key; no schema migration or
second session store is introduced.
