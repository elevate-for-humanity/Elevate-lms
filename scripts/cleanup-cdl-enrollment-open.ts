/**
 * One-time CDL data cleanup:
 * - Remove duplicate applications (same email)
 * - Migrate waitlist contacts into applications
 * - Clear CDL waitlist rows
 * - Backfill program_slug on legacy CDL applications
 *
 * Usage: pnpm tsx scripts/cleanup-cdl-enrollment-open.ts [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const PROGRAM_SLUG = 'cdl-training';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function splitName(full: string): { first_name: string; last_name: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: 'Unknown', last_name: '' };
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

async function main() {
  const sb = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const { data: program } = await sb
    .from('programs')
    .select('id')
    .eq('slug', PROGRAM_SLUG)
    .maybeSingle();

  const { data: apps, error: appsErr } = await sb
    .from('applications')
    .select('id, email, created_at, program_slug, program_interest')
    .or(`program_slug.eq.${PROGRAM_SLUG},program_interest.ilike.%cdl%`)
    .order('created_at', { ascending: true });

  if (appsErr) throw appsErr;

  const byEmail = new Map<string, NonNullable<typeof apps>>();
  for (const row of apps ?? []) {
    const key = (row.email ?? '').toLowerCase().trim();
    if (!key) continue;
    const list = byEmail.get(key) ?? [];
    list.push(row);
    byEmail.set(key, list);
  }

  const duplicateIds: string[] = [];
  for (const [, rows] of byEmail) {
    if (rows.length <= 1) continue;
    const keep = rows[rows.length - 1];
    for (const row of rows) {
      if (row.id !== keep.id) duplicateIds.push(row.id);
    }
  }

  const { data: waitlist, error: wlErr } = await sb
    .from('waitlist')
    .select('*')
    .eq('program_slug', PROGRAM_SLUG);

  if (wlErr) throw wlErr;

  const migrated: string[] = [];
  const waitlistDeleteIds: string[] = [];

  for (const row of waitlist ?? []) {
    waitlistDeleteIds.push(row.id);
    const email = (row.email ?? '').toLowerCase().trim();
    if (!email || byEmail.has(email)) continue;

    const { first_name, last_name } = splitName(row.name ?? '');
    const payload = {
      first_name,
      last_name,
      email,
      phone: row.phone ?? null,
      city: 'Indianapolis',
      state: 'Indiana',
      zip: '46201',
      program_interest: PROGRAM_SLUG,
      program_slug: PROGRAM_SLUG,
      program_id: program?.id ?? null,
      status: 'submitted',
      requested_funding_source: row.funding_interest ?? null,
      support_notes: [
        'Migrated from CDL waitlist (enrollment open)',
        row.notes ? `Waitlist notes: ${row.notes}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
      source: 'waitlist_migration',
      type: 'student',
    };

    if (DRY_RUN) {
      migrated.push(email);
      continue;
    }

    const { data: inserted, error: insErr } = await sb
      .from('applications')
      .insert(payload)
      .select('id')
      .single();

    if (insErr) {
      console.error('Failed to migrate waitlist row', email, insErr.message);
      continue;
    }
    migrated.push(email);
    byEmail.set(email, [{ id: inserted.id, email, created_at: new Date().toISOString() }]);
  }

  const backfillIds = (apps ?? [])
    .filter((a) => !a.program_slug && a.program_interest?.toLowerCase().includes('cdl'))
    .map((a) => a.id);

  console.log(DRY_RUN ? '[DRY RUN]' : '[LIVE]', {
    duplicateDeletes: duplicateIds.length,
    waitlistDeletes: waitlistDeleteIds.length,
    waitlistMigrated: migrated.length,
    slugBackfill: backfillIds.length,
  });

  if (!DRY_RUN) {
    if (duplicateIds.length) {
      const { error } = await sb.from('applications').delete().in('id', duplicateIds);
      if (error) throw error;
    }
    if (backfillIds.length) {
      const { error } = await sb
        .from('applications')
        .update({ program_slug: PROGRAM_SLUG, program_interest: PROGRAM_SLUG })
        .in('id', backfillIds);
      if (error) throw error;
    }
    if (waitlistDeleteIds.length) {
      const { error } = await sb.from('waitlist').delete().in('id', waitlistDeleteIds);
      if (error) throw error;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
