# Storage Audit

Generated: 2026-03-27  
Auditor: Ona

---

## Supabase Storage Buckets

| Bucket | Code Refs | Used By | Canonical | Problems |
|--------|----------|---------|-----------|---------|
| `documents` | 7 | `app/api/documents/upload/route.ts`, `app/api/apprentice/documents/route.ts`, `app/api/enrollment/upload-document/route.ts` | Yes | Storage helpers use deprecated Supabase shims |
| `media` | 5 | `app/api/media/upload/route.ts`, `app/api/media/delete/route.ts`, `app/api/media/files/route.ts` | Yes | None |
| `course-videos` | 2 | `app/store/courses/hvac-technician-course-license/page.tsx` (hardcoded URL), `courses/hvac/modules.ts` | Legacy | Hardcoded public URLs in HVAC pages — not accessed via storage helper |
| `files` | 2 | `app/api/files/route.ts` | Yes | Generic — purpose unclear |
| `videos` | 1 | `app/api/admin/videos/upload/route.ts` | Yes | None |
| `mous` | 1 | `lib/mou-storage.ts` | Yes | Uses `createBrowserClient` — wrong for server context |
| `module-certificates` | 1 | `app/api/certificates/issue-module/route.ts` | Yes | None |
| `avatars` | 1 | `app/api/ai/generate-image/route.ts` | Yes | None |

### Buckets Referenced in Code but Not Confirmed in Supabase

The following bucket names appear in code but cannot be confirmed as existing without Supabase Dashboard access:

- `compliance-evidence` — referenced in `lib/storage/complianceEvidence.ts`
- `audit-archive` — referenced in `netlify/functions/audit-export-cron.ts`

---

## External Storage (Cloudflare R2 / AWS S3)

| System | File | Bucket | Purpose |
|--------|------|--------|---------|
| Cloudflare R2 / AWS S3 | `lib/storage/file-storage.ts` | `elevate-media` (env: `R2_BUCKET` or `AWS_S3_BUCKET`) | Digital product downloads via `/api/store/download/[productId]` |

**Config:** Falls back to S3 if R2 env vars not set. Bucket name defaults to `elevate-media`.

---

## Storage Helper Files

| File | Bucket | Problem | Action |
|------|--------|---------|--------|
| `lib/mou-storage.ts` | `mous` | Uses `createBrowserClient` — wrong for server context. Should use `lib/supabase/server.ts`. | Fix in Phase 12 |
| `lib/storage/complianceEvidence.ts` | `compliance-evidence` | Uses deprecated `lib/supabase-api` shim | Fix in Phase 12 |
| `lib/storage/file-storage.ts` | R2/S3 | Canonical for digital downloads | Keep |

---

## Public URL Patterns (hardcoded in code)

| Pattern | Used By | Problem |
|---------|---------|---------|
| `https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/hvac/` | `app/courses/hvac/module1/lesson1/page.tsx`, `app/store/courses/hvac-technician-course-license/page.tsx`, `courses/hvac/modules.ts` | Hardcoded Supabase project URL. Breaks if project changes. HVAC legacy path only. |
| `https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/media/` | Various media routes | Same issue |

---

## Canonical Storage Conventions

For new code:

| Asset Type | Bucket | Access Pattern |
|-----------|--------|----------------|
| User documents (compliance, enrollment) | `documents` | `supabase.storage.from('documents').upload(path, file)` via `lib/supabase/server.ts` |
| Media (images, videos) | `media` | `supabase.storage.from('media').upload(path, file)` |
| MOU PDFs | `mous` | `supabase.storage.from('mous').createSignedUrl(filename, 60)` |
| Certificate PDFs | `module-certificates` | `supabase.storage.from('module-certificates').upload(path, file)` |
| Digital downloads | R2/S3 | `lib/storage/file-storage.ts` — `getDownloadUrl(key)` |
| Course videos | `course-videos` | Do not hardcode URLs. Use `supabase.storage.from('course-videos').getPublicUrl(path)` |

**Rule:** Never hardcode Supabase project URLs. Always use the storage client to generate URLs.

---

## Actions Taken

- Phase 12: Fix `lib/mou-storage.ts` to use `lib/supabase/server.ts`
- Phase 12: Fix `lib/storage/complianceEvidence.ts` to use `lib/supabase/server.ts`
- Phase 11 (AGENTS.md): Document canonical storage conventions
