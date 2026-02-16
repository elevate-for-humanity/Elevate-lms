# Public Submit System — Deployment

## Architecture

```
Browser POST → public-submit (Edge Function, anonymous)
                  ↓
            application_intake (universal buffer, service_role only)
                  ↓
            process-intake (scheduled Edge Function, service_role)
                  ↓
            Destination workflow table (student_applications, etc.)
                  ↓
            application_state_events (audit trail)
```

No direct public writes to workflow tables. Ever.

## Prerequisites

- Supabase CLI installed
- Project linked: `supabase link --project-ref cuxzzpsyufcewtmicszk`

## Step 1 — Run SQL migrations (in order)

Paste into Supabase Dashboard SQL Editor, or use `supabase db push`:

1. `supabase/migrations/20260216_application_intake.sql` — intake buffer table + RLS + rate-limit function
2. `supabase/migrations/20260216_seal_workflow_table_inserts.sql` — locks all 15 workflow tables from anon inserts

## Step 2 — Verify RLS lockdown

Run in SQL Editor after migrations:

```sql
-- Should show only service_role INSERT policies
SELECT tablename, policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'INSERT'
  AND tablename LIKE '%application%'
ORDER BY tablename, policyname;

-- Should return zero rows (no anon insert policies remain)
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'INSERT'
  AND roles::text ILIKE '%anon%'
  AND tablename LIKE '%application%';
```

## Step 3 — Set environment variables

```bash
# Optional: require a submit key
supabase secrets set PUBLIC_SUBMIT_KEY="your-random-key-here"

# Optional: restrict CORS origins
supabase secrets set ALLOWED_ORIGINS="https://www.elevateforhumanity.org,https://elevateforhumanity.org,https://elevate-lms.netlify.app"
```

SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatic.

## Step 4 — Deploy Edge Functions

```bash
# Public endpoint (anonymous access)
supabase functions deploy public-submit --no-verify-jwt

# Internal processor (JWT required — only service_role calls this)
supabase functions deploy process-intake
```

## Step 5 — Test with curl

### Student application

```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/public-submit' \
  -H 'Content-Type: application/json' \
  -d '{
    "application_type": "student",
    "full_name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "555-0199"
  }'
```

Expected (201):
```json
{"ok":true,"id":"uuid","application_type":"student","created_at":"...","message":"Application received. You will be contacted within 2 business days."}
```

### Career application with program_id

```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/public-submit' \
  -H 'Content-Type: application/json' \
  -d '{
    "application_type": "career",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "phone": "555-0200",
    "program_id": "your-program-uuid"
  }'
```

### Employer application

```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/public-submit' \
  -H 'Content-Type: application/json' \
  -d '{
    "application_type": "employer",
    "company_name": "Acme Corp",
    "contact_name": "Bob Jones",
    "email": "bob@acme.example.com"
  }'
```

### Barbershop partner

```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/public-submit' \
  -H 'Content-Type: application/json' \
  -d '{
    "application_type": "barbershop_partner",
    "shop_legal_name": "Classic Cuts LLC",
    "owner_name": "Mike Johnson",
    "contact_name": "Mike Johnson",
    "contact_email": "mike@classiccuts.example.com",
    "contact_phone": "555-0301",
    "shop_address_line1": "100 Main St",
    "shop_city": "Indianapolis",
    "shop_zip": "46201",
    "indiana_shop_license_number": "SH-12345",
    "supervisor_name": "Sarah Lee",
    "supervisor_license_number": "BL-67890",
    "employment_model": "booth_rental"
  }'
```

### Error cases

Missing required field (400):
```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/public-submit' \
  -H 'Content-Type: application/json' \
  -d '{"application_type": "student"}'
```

Invalid type (400):
```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/public-submit' \
  -H 'Content-Type: application/json' \
  -d '{"application_type": "nonexistent"}'
```

Honeypot (silent 200):
```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/public-submit' \
  -H 'Content-Type: application/json' \
  -d '{"application_type": "student", "full_name": "Bot", "email": "bot@spam.com", "hp": "gotcha"}'
```

## Step 6 — Run the processor

Manual:
```bash
curl -X POST \
  'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/process-intake' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

Schedule (pg_cron):
```sql
SELECT cron.schedule(
  'process-intake-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cuxzzpsyufcewtmicszk.supabase.co/functions/v1/process-intake',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

## Step 7 — Verify in database

```sql
-- Intake buffer
SELECT id, application_type, status, resolved_tenant_id, created_at
FROM application_intake ORDER BY created_at DESC LIMIT 10;

-- Processed rows
SELECT id, application_type, destination_table, destination_id, processed_at
FROM application_intake WHERE status = 'processed' ORDER BY processed_at DESC LIMIT 10;

-- Errors
SELECT id, application_type, error, created_at
FROM application_intake WHERE status = 'rejected' ORDER BY created_at DESC;
```

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260216_application_intake.sql` | Intake buffer table, RLS, rate-limit function |
| `supabase/migrations/20260216_seal_workflow_table_inserts.sql` | Locks 15 workflow tables from anon inserts |
| `supabase/functions/public-submit/index.ts` | Public Edge Function (anonymous POST) |
| `supabase/functions/public-submit/application-types.ts` | Per-type routing config (required/allowed fields) |
| `supabase/functions/process-intake/index.ts` | Processor: intake → workflow tables |
| `supabase/functions/public-submit/DEPLOY.md` | This file |

## Supported application types (14)

`application`, `career`, `student`, `employer`, `staff`, `partner`, `barbershop_partner`, `program_holder`, `shop`, `affiliate`, `funding`, `job`, `supersonic`, `tax`, `submission`

## Security layers

1. CORS origin allowlist
2. Optional `x-public-submit-key` header
3. Honeypot fields (silent discard)
4. 30 KB payload cap
5. Per-IP rate limiting (5/15min)
6. Per-type field allowlist (unknown fields stripped)
7. Email format validation
8. program_id validated against programs.is_active + is_published
9. tenant_id resolved server-side from programs.tenant_id
10. Writes only to application_intake — never to workflow tables
11. All workflow tables sealed with service_role-only INSERT policies
