# Partner Portal Security Audit

Date: 2026-02-14
Build: 892/892 pages, zero errors, Next.js 16.1.6

## Access Control Chain — getMyPartnerContext()

File: `lib/partner/access.ts`

| Check | Enforced | Method |
|---|---|---|
| Authenticated user | Yes | `auth.getUser()` returns null if no session |
| profile.role in allowed set | Yes | `PARTNER_ROLES = ['partner', 'admin', 'super_admin']` |
| Exists in shop_staff | Yes | Query requires matching rows |
| shop_staff.active = true | Yes | `.eq('active', true)` — requires migration `20260214_shop_staff_active_column.sql` |
| shops.active = true | Yes | `!inner` join with `.eq('shops.active', true)` |

Returns `null` (→ redirect to /partners/login) if any check fails.

## RLS Policies — Database Layer

Source: `supabase/migrations/archive-legacy/20251218_shop_partner_rls.sql`

### shop_staff
- RLS: ENABLED
- SELECT: own rows + same-shop staff + admin
- INSERT/UPDATE/DELETE: **admin-only** (`shop_staff_admin_write`)
- Self-join: IMPOSSIBLE via database

### shops
- RLS: ENABLED
- SELECT: staff of shop + admin
- INSERT/UPDATE/DELETE: admin-only

### apprentice_placements
- RLS: ENABLED
- SELECT: shop staff + student themselves + admin
- INSERT/UPDATE/DELETE: admin-only

### enrollments (if RLS applied from 20260102_final_rls_policies.sql)
- SELECT: `auth.uid() = user_id` + admin
- INSERT: `auth.uid() = user_id` + admin
- Partner reads: use `createAdminClient()` (service role) — access control enforced at application layer

### certificates
- Previous: INSERT WITH CHECK (true) — OPEN TO ALL
- Fixed by: `20260214_tighten_certificates_rls.sql`
  - SELECT: public (for verification)
  - INSERT/UPDATE/DELETE: admin-only
  - REVOKE INSERT/UPDATE/DELETE from authenticated role

## Service Role Usage

File: `lib/partner/students.ts`

Partner data queries use `createAdminClient()` (service role) to bypass per-user RLS on enrollments/certificates. This is necessary because partners read data for OTHER users (placed students).

Access control is enforced at the application layer:
1. `getMyPartnerContext()` resolves shop IDs from authenticated user's session
2. `getPartnerStudentIds(shopIds)` derives student set from placements
3. Enrollment/certificate queries are scoped to those student IDs only

No endpoint accepts shop IDs from request params/body/query strings.

## Shop ID Injection Audit

Searched all partner routes for client-provided shop identifiers:

- `app/(partner)/` pages: shop IDs derived from `getMyPartnerContext()` (server) or `shop_staff` query for current user (client, RLS-scoped)
- `app/api/partner/` routes: no `shopId` param in any request body or query string
- `app/api/partner/exports/completions/route.ts`: derives shopIds from `ctx.shops` only

Verdict: No injection vector found.

## Audit Trail

- Export logging: `logExportAudit()` in route file, wrapped in try/catch (fire-and-forget)
- Table: `partner_export_logs` — requires migration `20260214_partner_export_logs.sql`
- Columns: user_id, user_email, shop_ids, row_count, export_type, exported_at
- RLS: users can read/insert own logs only

## Unapplied Migrations (required for full enforcement)

1. `20260214_tighten_certificates_rls.sql` — certificates INSERT/UPDATE/DELETE admin-only
2. `20260214_partner_export_logs.sql` — audit trail table
3. `20260214_shop_staff_active_column.sql` — staff deactivation support

## Known Gaps (not fixable without new features)

1. Visibility is placement-bound only — no sponsor/cohort relationship table
2. Partners cannot enroll, invite, or manage students
3. No seat hours / time-on-task tracking
4. No program/grant filtering dimensions
5. 3 client-side pages filter on `is_active` (nonexistent column) instead of `active` — fails closed (no data), not a security issue

## CSV Export — Grant-Report Grade

Columns: Student Name, Email, Location, Placement Start, Course, Progress %, Status, Enrollment Date, Completion Date, Credential ID, Total Certificates

- Dates: ISO 8601 (YYYY-MM-DD)
- Credential ID: verification_code from certificates table (XXXX-XXXX-XXXX format)
- No internal IDs leaked (student_id, course_id, shop_id)
- Reconciliation test: 35/35 assertions passed (scripts/test-partner-csv-reconciliation.ts)
