# pdfjs-dist / @napi-rs/canvas production warnings

**Symptom (admin/LMS container logs):**

```text
Warning: Cannot load "@napi-rs/canvas" package: Error: Cannot find module '@napi-rs/canvas'
Warning: Cannot polyfill `DOMMatrix` / `ImageData` / `Path2D`
Require stack: ... pdfjs-dist/legacy/build/pdf.mjs
```

## Cause

`pdf-parse@2.x` depends on `pdfjs-dist@5.x`, which uses native canvas on Node for server-side PDF parsing.

Our **admin** standalone image ran `scripts/prune-admin-standalone.mjs`, which previously deleted:

- `pdfjs-dist`
- entire `@napi-rs` scope (including `@napi-rs/canvas`)

So routes that `import('pdf-parse')` still executed, but pdfjs could not load canvas.

## Not a deploy failure

These are **stderr warnings** at runtime when a code path loads pdfjs. They do **not** stop `next build` or Northflank health checks unless the process crashes afterward (uncommon).

Failed deploys were separate: ENOSPC, LMS build timeout, probe timing.

## Fix (2026-06)

1. **`@napi-rs/canvas`** added as a direct dependency in `package.json`.
2. **Prune lists:** removed `pdfjs-dist` and `@napi-rs` from shared prune; LMS-only prune still drops PDF stack on **www** container (no admin document APIs).
3. **`serverExternalPackages`:** `pdf-parse`, `pdfjs-dist`, `@napi-rs/canvas` externalized so standalone retains them for admin.
4. **`lib/insurance/scan-approve-strict.ts`:** dynamic `import('pdf-parse')` (no top-level load at boot).

## Affected routes (admin)

- `/api/admin/courses/parse-file`
- `/api/admin/documents/extract`
- `/api/admin/contracts/extract`
- `/api/admin/courses/generate/parse`
- `/api/ocr/extract` (LMS — pdf-parse pruned on LMS; OCR falls back)

## Verify after deploy

```bash
pnpm tsx scripts/northflank/verify-health-checks.ts
# In admin container (if shell available):
node -e "require('@napi-rs/canvas'); console.log('canvas ok')"
```

## If warnings persist

- Confirm admin build ran **after** prune-list change.
- Run `pnpm install` so lockfile includes `@napi-rs/canvas`.
- Do not add `pdfjs-dist` back to `SHARED_STANDALONE_PRUNE_PACKAGES`.

## Options matrix (generic Next.js advice vs Elevate)

| Approach | Generic advice | Elevate decision |
|----------|----------------|------------------|
| **1. Install `@napi-rs/canvas`** | Recommended | **Done** — direct dep + lockfile; admin standalone no longer prunes canvas/pdfjs |
| **2. Browser-only `pdfjs-dist`** | Good for in-app PDF viewers | **N/A today** — no `import "pdfjs-dist"` in app code; only `pdf-parse` on **server** API routes |
| **3. Global DOM polyfill shim** | Works in some setups | **Skipped** — native canvas is cleaner when we already ship the binary |
| **4. Pin `pdfjs-dist@4.10.38`** | Fixes many deploys | **Not used** — `pdf-parse@2.4.5` requires `pdfjs-dist@5.4.296`; downgrading breaks pdf-parse |
| **Docker `pnpm install --frozen-lockfile`** | Required | **Already** in `Dockerfile.northflank-*`; avoid `--prod` that strips optionals |

### PDF stacks on Elevate (do not conflate)

| Library | Use | Canvas needed? |
|---------|-----|----------------|
| `pdf-parse` + `pdfjs-dist` | Admin text extract from uploads | **Yes** (admin container) |
| `pdf-lib` / `pdfkit` | Generate MOUs, certs, grants | No pdfjs |
| `@react-pdf/renderer` | Listed in package.json; **no app imports found** | Separate from pdfjs-dist warnings |

### If we add a client PDF viewer later

Use `next/dynamic` with `{ ssr: false }` — do not import `pdfjs-dist` in Server Components or root layout.

### Northflank / ECS

Redeploy **elevate-admin** after merges **#258** and **#259**. LMS may still log warnings only if something calls `pdf-parse` on www (unlikely; LMS prunes PDF stack).
