# Canonical Admin AI / Studio Architecture

## Ownership and product model

- Elevate Admin owns the only privileged application shell.
- `/studio` is the single conversation-first Admin AI operating surface.
- Operators state the outcome in plain language; Admin AI selects internal tools and capabilities.
- Course Builder, website/content tools, workflows, repository, browser, deployments, evaluations, and other Studio capabilities are internal tools or advanced inspection surfaces, not competing primary products.
- `/studio/ai` is legacy and redirects to `/studio`; a second AI/chat workspace must not be introduced.
- `lib/devstudio/workspace-registry.ts` lists advanced capability/audit surfaces only.
- `StudioNavigation` provides contextual links only; it must not become a second application shell.
- Marketing Studio routes are informational product pages only.
- LMS does not own an operational Admin Studio.

## Shared Admin surface

Every Studio surface inherits the canonical Admin header, authenticated session controls, notifications, support/branding, and page lifecycle. The Admin root layout must never special-case `/studio` into a standalone product shell.

The primary `/studio` experience uses the light Admin design system. Advanced engineering views may use specialist editor styling only inside the tool surface where it materially improves the task.

## Authorization and approval

- `/studio` requires an explicit server-side Admin role boundary in addition to Admin middleware.
- Privileged Admin access requires AAL2 MFA in production policy.
- High-impact AI operations are staged in `ellie_pending_actions`; Admin AI presents Confirm/Cancel controls and execution is performed only through the audited approval endpoint.
- Canonical Studio conversation/log data is protected by Admin + AAL2 RLS.

## Tool/plugin model

Admin AI may route requests to specialized capabilities, but the operator should not need to choose a builder first.

Examples:

- "Build a course for medical assistants" → canonical Course Factory toolchain.
- "Review pending applications" → live Admin operations data and staged approval actions.
- "Check why Admin failed to deploy" → deployment/build diagnostics.
- "Audit this program" → registry, schema, content, compliance, and evidence tools.
- "Publish the website" → governed website/publishing capability once validation passes.

A capability may expose a direct route for inspection or manual recovery, but the direct route is secondary to the Admin AI operating model.

## Course authoring authority

`lib/course-factory` is the only generation, validation, governance, and persistence authority for generated courses. Course Builder UI, Admin AI, scripts, and compatibility endpoints must delegate to Course Factory. Parallel direct writes to course/module/lesson tables are prohibited.

The Admin AI compatibility draft endpoint may generate a reviewable blueprint through Course Factory generation code, but persistence must cross `courseFactory()` and the government procurement/publish gates.

## Runtime boundaries

- `/api/devstudio/*` contains operational Admin AI/Studio runtime APIs.
- `/api/admin/dev-studio/*` contains capability-specific Admin health and configuration APIs.
- `/api/admin/ai-assistant/*` contains live Admin operations conversation and staged-action approval APIs.
- The architecture gate rejects duplicate relative implementations across runtime namespaces.
- `lib/devstudio/*` owns shared Studio runtime behavior; domain-specific systems retain their canonical domain services.

## Canonical Studio persistence

Active Studio/Admin AI persistence:

- `studio_conversations` — governed Admin AI conversation persistence.
- `devstudio_chat_log` — governed Admin AI/Studio execution log.
- `ai_deployments` — AI-triggered deployment tracking.
- `workflows` + `workflow_runs` — canonical automation definition and execution state.

Verified empty, unreferenced duplicate Studio tables were removed rather than kept as competing sources of truth.

## Browser runtime

`services/studio-browser` is an isolated Playwright/Chromium HTTP service. It provides:

- short-lived browser sessions;
- an allowlisted target-domain policy and private-network blocking;
- live MJPEG screenshots;
- mouse, keyboard, navigation and scrolling controls;
- console, page error, failed request and HTTP failure evidence;
- automatic session expiration and capacity controls;
- optional OpenAI Computer Use through the Admin server, invoked only by an explicit user action.

The browser works manually without OpenAI. OpenAI Computer Use is optional and can consume API credits.

## Required production configuration

Create the browser service with `Dockerfile.studio-browser`, then configure Admin and the browser service with the same random `STUDIO_BROWSER_SECRET`.

Admin:

```text
STUDIO_BROWSER_URL=<private Northflank browser service URL>
STUDIO_BROWSER_PUBLIC_URL=https://browser.elevateforhumanity.org
NEXT_PUBLIC_STUDIO_BROWSER_URL=https://browser.elevateforhumanity.org
STUDIO_BROWSER_SECRET=<shared random secret>
OPENAI_API_KEY=<optional secret>
OPENAI_COMPUTER_MODEL=gpt-5.6
```

Browser service:

```text
STUDIO_BROWSER_SECRET=<same shared random secret>
STUDIO_BROWSER_ADMIN_ORIGIN=https://admin.elevateforhumanity.org
STUDIO_BROWSER_ALLOWED_DOMAINS=elevateforhumanity.org
```

## Enforcement

Run:

```bash
pnpm check:studio-architecture
pnpm typecheck:studio
bash scripts/dev-studio-integration-gate.sh
node scripts/audit-course-builder-procurement.mjs
```

These checks must prevent an Admin-shell bypass, a second AI/chat workspace, standalone Studio application shells, registered redirect-only workspaces, duplicate API implementations, independent course persistence, and removal of the browser/runtime governance contracts.
