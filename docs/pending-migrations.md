# Pending Migrations

**Status as of 2026-07-01:** Four new migrations added this session. Apply in order.
Previous migrations from 2026-06-02 remain pending (see below).

## Apply Now — New (2026-07-01)

Run these in Supabase Dashboard → SQL Editor **in order**:

| # | File | What it does |
|---|---|---|
| 1 | `20260701000001_fix_completion_trigger_table_split.sql` | Fixes certificate triggers for `course_lessons`-based programs (were silently no-oping) |
| 2 | `20260701000002_stale_application_archive.sql` | Adds `archive_stale_applications()` DB function used by cron |
| 3 | `20260701000003_program_integrity_view.sql` | Creates `program_integrity` view (scores programs 0-100) |
| 4 | `20260630000006_program_cleanup.sql` | Archives AI test artifacts, deduplicates program slugs, activates canonical programs, adds `short_description`/`display_order`/`category` columns |

After applying #4, verify:
```sql
SELECT status, count(*) FROM public.programs GROUP BY status ORDER BY status;
-- Should show: active ~80+, archived ~30+, no test slugs in active set

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'programs'
  AND column_name IN ('short_description', 'display_order', 'category');
-- Should return 3 rows
```

19 tables declared in migration files that do not yet exist in the live DB.
Assessed by app code reference count. Apply in Supabase Dashboard SQL Editor.

## Apply Now — App Code References These Tables

Run these in the Supabase Dashboard SQL Editor in the order listed.
Each file is idempotent (CREATE TABLE IF NOT EXISTS).

| Table                           | Migration file                                  | App refs               |
| ------------------------------- | ----------------------------------------------- | ---------------------- |
| `consent_records`               | `20260320000008_ferpa_consent_compliance.sql`   | 1                      |
| `data_deletion_requests`        | `20260320000008_ferpa_consent_compliance.sql`   | 0 (same file as above) |
| `tenant_compliance_records`     | `20260320000008_ferpa_consent_compliance.sql`   | 0 (same file)          |
| `provider_program_approvals`    | `20260320000003_provider_program_approvals.sql` | 4                      |
| `provider_compliance_artifacts` | `20260321000003_provider_governance_schema.sql` | 5                      |
| `provider_onboarding_steps`     | `20260321000003_provider_governance_schema.sql` | 5                      |
| `provider_applications`         | `20260321000005_provider_applications.sql`      | 3                      |
| `page_sections`                 | `20260322000001_page_builder_engine.sql`        | 2                      |
| `forms`                         | `20260322000002_forms_engine.sql`               | 1                      |
| `form_fields`                   | `20260322000002_forms_engine.sql`               | 0 (same file)          |
| `form_submissions`              | `20260322000002_forms_engine.sql`               | 1                      |
| `webinars`                      | `20260503000003_webinars_messages.sql`          | 1                      |
| `webinar_registrations`         | `20260503000003_webinars_messages.sql`          | 0 (same file)          |

**Also apply the new forward reconciliation migrations (in order):**

1. `20260602000001_forward_schema_reconciliation.sql` — adds missing cols to `pages`, `placement_records`, `program_modules`
2. `20260602000002_messages_additive_columns.sql` — adds `is_read`, `thread_id`, `parent_id`, `updated_at` to `messages`
3. `20260602000003_tax_clients_column_aliases.sql` — adds `date_of_birth`, address cols to `tax_clients`

## Defer — No App References

These tables have no app code references. Do not apply blindly.
Review intent before applying; some may be obsolete design artifacts.

| Table                        | Migration file                                  | Notes                                                   |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `cron_runs`                  | `20260321000004_cron_runs_and_audit_fixes.sql`  | Infrastructure table — apply if cron jobs are active    |
| `partner_site_inspections`   | `20260401000014_partner_site_inspections.sql`   | Feature not yet built                                   |
| `preparer_payouts`           | `20260125000000_franchise_management.sql`       | Tax franchise feature — apply when building payout UI   |
| `program_curriculum_modules` | `20260503000006_program_operational_tables.sql` | Overlaps with `course_modules` — review before applying |
| `program_enrollment_tracks`  | `20260503000006_program_operational_tables.sql` | No feature built yet                                    |
| `tax_fee_schedules`          | `20260125000000_franchise_management.sql`       | Tax franchise feature                                   |

## Verification SQL

After applying, confirm tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'consent_records', 'data_deletion_requests', 'tenant_compliance_records',
    'provider_program_approvals', 'provider_compliance_artifacts',
    'provider_onboarding_steps', 'provider_applications',
    'page_sections', 'forms', 'form_fields', 'form_submissions',
    'webinars', 'webinar_registrations'
  )
ORDER BY table_name;
```

Expected: 13 rows.
