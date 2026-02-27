# Audit Log Recovery Procedure

## Incident

On 2026-02-26 at ~19:09 UTC, a `TRUNCATE audit_logs` was executed during
tamper-resistance testing via the Supabase Management API. 802 audit log
rows spanning 2026-02-16 to 2026-02-26 were destroyed. Controls have since
been applied to prevent recurrence.

## Recovery Source

A daily physical backup from **2026-02-26 04:09 UTC** exists and contains
~792 of the 802 lost rows. Rows created between 04:09 and ~19:09 UTC (~15
hours) are unrecoverable because PITR is not enabled.

## Steps (requires Supabase Dashboard owner access)

### 1. Create a temporary project for backup restoration

- Go to https://supabase.com/dashboard
- Create a new project in the same region (`us-east-2`)
- Name it `elevate-audit-recovery` (or similar)
- Wait for it to initialize

### 2. Restore the backup

Supabase does not support restoring a backup into a different project via
the free/Pro plan. Instead:

**Option A — Supabase Support (recommended)**
- Open a support ticket at https://supabase.com/dashboard/support
- Request: "Restore the 2026-02-26T04:09:35.891Z backup of project
  `cuxzzpsyufcewtmicszk` to a temporary project, or provide a SQL dump
  of the `audit_logs` table from that backup."
- Reference: 802 rows lost due to accidental TRUNCATE during security
  hardening

**Option B — Self-service (if available on your plan)**
- Go to Project Settings → Database → Backups
- Select the 2026-02-26 04:09 backup
- Click "Restore" (this overwrites the current database — **do NOT do
  this on the production project**)
- If restore-to-new-project is available, use that instead

### 3. Extract audit_logs from the restored backup

Connect to the restored/temporary project and run:

```sql
COPY (
  SELECT * FROM audit_logs
  ORDER BY created_at ASC
) TO STDOUT WITH (FORMAT csv, HEADER true);
```

Save the output as `audit_logs_recovery.csv`.

### 4. Temporarily disable the immutability trigger on production

```sql
-- Log the recovery operation BEFORE disabling
INSERT INTO audit_ddl_events (event_tag, object_type, object_identity, command_text)
VALUES ('RECOVERY', 'procedure', 'audit_logs',
  'Controlled trigger disable for historical row recovery. 802 rows lost to TRUNCATE on 2026-02-26T19:09Z.');

-- Disable immutability trigger
ALTER TABLE audit_logs DISABLE TRIGGER enforce_audit_log_immutability;
```

### 5. Re-insert historical rows

```sql
-- Insert recovered rows, skipping any that already exist
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id,
  metadata, created_at, ip_address, user_agent, actor_id, tenant_id)
SELECT id, user_id, action, resource_type, resource_id,
  metadata, created_at, ip_address, user_agent, actor_id, tenant_id
FROM recovered_audit_logs  -- temp table with CSV data
ON CONFLICT (id) DO NOTHING;
```

### 6. Re-enable the immutability trigger

```sql
ALTER TABLE audit_logs ENABLE TRIGGER enforce_audit_log_immutability;

-- Log the recovery completion
INSERT INTO audit_ddl_events (event_tag, object_type, object_identity, command_text)
VALUES ('RECOVERY_COMPLETE', 'procedure', 'audit_logs',
  'Immutability trigger re-enabled. Historical rows restored from 2026-02-26T04:09Z backup.');
```

### 7. Verify

```sql
SELECT count(*) FROM audit_logs;
-- Expected: ~797 (792 recovered + 5 post-TRUNCATE)

SELECT min(created_at), max(created_at) FROM audit_logs;
-- Expected: earliest ~2026-02-16, latest ~current
```

### 8. Clean up

- Delete the temporary Supabase project
- Run an immediate audit export: `POST /api/admin/audit-export`

## Prevention Controls (already applied)

- `REVOKE TRUNCATE FROM postgres` on audit_logs
- `BEFORE UPDATE/DELETE` immutability trigger
- `FORCE ROW LEVEL SECURITY` on table owner
- DDL event monitoring on audit infrastructure
- Hourly integrity checks via pg_cron
- Offsite export to Supabase Storage (audit-archive bucket)

## Unrecoverable Data

~10 rows created between 2026-02-26 04:09 UTC (backup) and 2026-02-26
~19:09 UTC (TRUNCATE). These include 4 trigger-sourced entries from a
real user signup ("Adam Kriech") at ~15:45 UTC.
