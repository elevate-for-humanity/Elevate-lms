# Canonical Dev Studio Architecture

## Ownership

- Elevate Admin owns the only application shell.
- Admin `/studio` is a section inside that shell, not a standalone product surface.
- `lib/devstudio/workspace-registry.ts` is the workspace source of truth.
- `StudioNavigation` provides contextual workspace links only; it must not become a fixed application sidebar.
- Marketing Studio routes are informational product pages only.
- LMS does not own an operational Studio.

## Shared Admin surface

Every Studio workspace inherits the canonical Admin header, session controls, notifications, footer, support widget, branding, and page lifecycle. The Admin root layout must never special-case `/studio` using request headers or pathname detection.

## Runtime boundaries

- `/api/devstudio/*` contains operational runtime APIs.
- `/api/admin/dev-studio/*` contains capability-specific Admin health and configuration APIs.
- The architecture gate rejects duplicate relative routes across those namespaces.
- `lib/devstudio/*` owns shared runtime behavior.
- Course Builder owns course authoring; parallel provider or shell implementations are prohibited.

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
```

These checks prevent an Admin-shell bypass, a standalone Studio sidebar or shell, registered redirect-only workspaces, duplicate API implementations, and removal of the browser runtime contract.
