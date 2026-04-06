import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const SECRET = 'mig-kingGreene08-run'

const MIGRATIONS = [
  '20260322000006_seed_credential_registry.sql',
  '20260402000010_fix_limbo_approved_applications.sql',
  '20260402000011_admin_real_data.sql',
  '20260404000001_checkout_contexts_price_columns.sql',
  '20260404000001_rls_assignment_submissions_support_tickets.sql',
  '20260404000002_bnpl_missing_columns.sql',
  '20260406000001_profiles_onboarding_columns.sql',
  '20260602000001_forward_schema_reconciliation.sql',
  '20260602000002_messages_additive_columns.sql',
  '20260602000003_tax_clients_column_aliases.sql',
  '20260602000004_page_sections_canonical.sql',
  '20260602000005_direct_messages_canonical.sql',
  '20260602000006_rls_forms_webinars_provider.sql',
  '20260602000007_fix_rls_and_conversations.sql',
  '20260603000001_normalize_funding_source.sql',
  '20260603000002_stripe_event_log.sql',
  '20260603000003_publish_hvac_program.sql',
  '20260604000001_course_generation_control.sql',
  '20260604000002_barber_billing_schema.sql',
  '20260604000003_schema_drift_waiver_columns.sql',
  '20260604000004_applications_payment_columns.sql',
  '20260604000005_crm_leads.sql',
  '20260604000006_barber_post_payment_schema.sql',
  '20260604000007_course_discussions_schema.sql',
  '20260604000008_exam_bookings_payment_gate.sql',
  '20260604000009_testing_slots_and_enforcement.sql',
  '20260605000001_sync_hvac_course_lessons_from_curriculum.sql',
  '20260605000002_fix_lms_lessons_step_type.sql',
  '20260606000001_backfill_hvac_quiz_questions.sql',
  '20260606000002_stripe_webhook_secret_app_secrets.sql',
  '20260607000001_booth_rental_tables.sql',
  '20260608000001_exam_bookings_add_on.sql',
  '20260608000001_fix_hyphenated_tables_missing_tables_rls_indexes.sql',
  '20260608000002_exam_booking_leads.sql',
  '20260609000001_program_lessons_add_checkpoint_type.sql',
]

export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  if (secret !== SECRET) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const pool = new Pool({
    host: '52.200.122.185', // db.cuxzzpsyufcewtmicszk.supabase.co IPv4
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'kingGreene08$$$',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  const results: { file: string; ok: boolean; error?: string }[] = []

  for (const file of MIGRATIONS) {
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', file)
    let sql: string
    try {
      sql = fs.readFileSync(filePath, 'utf8')
    } catch {
      results.push({ file, ok: false, error: 'file not found' })
      continue
    }

    try {
      await pool.query(sql)
      results.push({ file, ok: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ file, ok: false, error: msg.slice(0, 300) })
    }
  }

  await pool.end()
  return NextResponse.json({ results })
}
