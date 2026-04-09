/**
 * import-memoed-students.ts
 *
 * Imports cosmetology students exported from Memo Ed into Elevate LMS.
 *
 * Expected CSV columns (case-insensitive, extra columns ignored):
 *   first_name, last_name, email, phone, start_date,
 *   hours_completed, transfer_hours, status
 *
 * What this script does:
 *   1. Creates a Supabase auth user for each student (invite flow — no password set)
 *   2. Upserts a profiles row
 *   3. Creates a program_enrollments row linked to cosmetology-apprenticeship
 *   4. Creates an apprentice_hours row for any hours_completed > 0 (status: approved,
 *      category: practical, source: memo_ed_transfer)
 *
 * Usage:
 *   pnpm tsx scripts/import-memoed-students.ts --file ./students.csv [--dry-run] [--partner Mesmerized]
 *
 * Flags:
 *   --file      Path to CSV file (required)
 *   --dry-run   Print what would be inserted without writing to DB
 *   --partner   Partner name filter — only import rows where school matches (optional)
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const COSMETOLOGY_PROGRAM_ID  = '0661bc6d-c748-4655-b11b-6d418a4ace4a';
const COSMETOLOGY_PROGRAM_SLUG = 'cosmetology-apprenticeship';
const PARTNER_ID               = '8420fefa-3228-4ec7-9ea7-265b045aa93d'; // Mesmerized by Beauty
const PROGRAM_HOLDER_ID        = '4bc589d3-bd39-4a50-a724-73e50506c1f1';

// ── Arg parsing ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const fileArg  = args[args.indexOf('--file') + 1];
const dryRun   = args.includes('--dry-run');

if (!fileArg) {
  console.error('Usage: pnpm tsx scripts/import-memoed-students.ts --file ./students.csv [--dry-run]');
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemoEdRow {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  start_date?: string;
  hours_completed?: string;
  transfer_hours?: string;
  status?: string;
}

interface ImportResult {
  email: string;
  action: 'created' | 'skipped' | 'error';
  reason?: string;
  userId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeHeaders(row: Record<string, string>): MemoEdRow {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    lower[k.toLowerCase().trim().replace(/\s+/g, '_')] = v?.trim() ?? '';
  }
  return lower as unknown as MemoEdRow;
}

function parseHours(val?: string): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseDate(val?: string): string | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const csvPath = resolve(process.cwd(), fileArg);
  const raw = readFileSync(csvPath, 'utf8');
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`\nMemo Ed import — ${records.length} rows found`);
  if (dryRun) console.log('DRY RUN — no writes will occur\n');

  const results: ImportResult[] = [];
  let created = 0, skipped = 0, errors = 0;

  for (const rawRow of records) {
    const row = normalizeHeaders(rawRow);

    if (!row.email || !row.first_name || !row.last_name) {
      results.push({ email: row.email || '(missing)', action: 'error', reason: 'Missing required fields: first_name, last_name, email' });
      errors++;
      continue;
    }

    const email = row.email.toLowerCase();
    const hoursCompleted = parseHours(row.hours_completed);
    const transferHours  = parseHours(row.transfer_hours);
    const startDate      = parseDate(row.start_date);
    const enrollStatus   = (row.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active';

    if (dryRun) {
      console.log(`  [DRY RUN] Would import: ${row.first_name} ${row.last_name} <${email}> — ${hoursCompleted}h completed`);
      results.push({ email, action: 'created' });
      created++;
      continue;
    }

    try {
      // 1. Check if auth user already exists
      const { data: existingList } = await supabase.auth.admin.listUsers();
      const existing = existingList?.users?.find(u => u.email === email);
      let userId: string;

      if (existing) {
        userId = existing.id;
        console.log(`  [SKIP AUTH] ${email} — auth user already exists`);
      } else {
        // Create auth user via invite (no password — they'll set one on first login)
        const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            first_name: row.first_name,
            last_name: row.last_name,
            role: 'student',
            source: 'memo_ed_import',
          },
        });
        if (inviteErr || !invited?.user) {
          throw new Error(`Auth invite failed: ${inviteErr?.message}`);
        }
        userId = invited.user.id;
        console.log(`  [CREATED] ${email} — auth user created (${userId})`);
      }

      // 2. Upsert profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          first_name: row.first_name,
          last_name: row.last_name,
          email,
          phone: row.phone || null,
          role: 'student',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (profileErr) throw new Error(`Profile upsert failed: ${profileErr.message}`);

      // 3. Check for existing enrollment
      const { data: existingEnrollment } = await supabase
        .from('program_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('program_id', COSMETOLOGY_PROGRAM_ID)
        .maybeSingle();

      if (!existingEnrollment) {
        const { error: enrollErr } = await supabase
          .from('program_enrollments')
          .insert({
            user_id: userId,
            student_id: userId,
            program_id: COSMETOLOGY_PROGRAM_ID,
            program_slug: COSMETOLOGY_PROGRAM_SLUG,
            email,
            full_name: `${row.first_name} ${row.last_name}`,
            phone: row.phone || null,
            status: enrollStatus,
            enrollment_state: 'enrolled',
            program_holder_id: PROGRAM_HOLDER_ID,
            organization_id: PARTNER_ID,
            funding_source: 'self_pay',
            payment_status: 'not_required',
            enrolled_at: startDate || new Date().toISOString(),
            enrollment_confirmed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (enrollErr) throw new Error(`Enrollment insert failed: ${enrollErr.message}`);
      } else {
        console.log(`  [SKIP ENROLL] ${email} — enrollment already exists`);
      }

      // 4. Log transferred hours if any
      const totalTransferHours = hoursCompleted + transferHours;
      if (totalTransferHours > 0) {
        const { data: existingHours } = await supabase
          .from('apprentice_hours')
          .select('id')
          .eq('user_id', userId)
          .eq('discipline', 'cosmetology')
          .eq('category', 'memo_ed_transfer')
          .maybeSingle();

        if (!existingHours) {
          const { error: hoursErr } = await supabase
            .from('apprentice_hours')
            .insert({
              user_id: userId,
              discipline: 'cosmetology',
              date: startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0],
              hours: totalTransferHours,
              minutes: 0,
              total_minutes: Math.round(totalTransferHours * 60),
              category: 'memo_ed_transfer',
              notes: `Hours transferred from Memo Ed. Original hours: ${hoursCompleted}, transfer credit: ${transferHours}`,
              status: 'approved',
              submitted_at: new Date().toISOString(),
            });

          if (hoursErr) throw new Error(`Hours insert failed: ${hoursErr.message}`);
          console.log(`  [HOURS] ${email} — ${totalTransferHours}h logged as approved transfer`);
        } else {
          console.log(`  [SKIP HOURS] ${email} — transfer hours already logged`);
        }
      }

      results.push({ email, action: 'created', userId });
      created++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] ${email} — ${msg}`);
      results.push({ email, action: 'error', reason: msg });
      errors++;
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────');
  console.log(`Import complete`);
  console.log(`  Created/updated : ${created}`);
  console.log(`  Skipped         : ${skipped}`);
  console.log(`  Errors          : ${errors}`);
  console.log('─────────────────────────────────────────\n');

  if (errors > 0) {
    console.log('Errors:');
    results.filter(r => r.action === 'error').forEach(r => {
      console.log(`  ${r.email}: ${r.reason}`);
    });
  }

  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
