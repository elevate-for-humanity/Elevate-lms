#!/usr/bin/env tsx
/**
 * Combined esthetician + cosmetology + nail technician enrollment-open blast.
 *
 *   pnpm tsx scripts/send-beauty-enrollment-open-emails.ts --dry-run
 *   pnpm tsx scripts/send-beauty-enrollment-open-emails.ts --send
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildBeautyEnrollmentOpenAdminRosterEmail,
  buildBeautyEnrollmentOpenApplicantEmail,
  BEAUTY_ENROLLMENT_OPEN_REPLY_TO,
  resolveBeautyTrack,
  type BeautyContactRow,
  type BeautyTrack,
} from '../lib/email/beauty-enrollment-open';
import { hydrateProcessEnv } from '../lib/secrets';
import { sendEmail } from '../lib/email/sendgrid';
import { writeFileSync, mkdirSync } from 'fs';

const DRY_RUN = !process.argv.includes('--send');
const INCLUDE_TEST = process.argv.includes('--include-test');
const ADMIN_TO = [BEAUTY_ENROLLMENT_OPEN_REPLY_TO];

const BEAUTY_OR_FILTER = [
  'program_slug.ilike.%esthetic%',
  'program_interest.ilike.%esthetic%',
  'program_slug.ilike.%aesthetic%',
  'program_interest.ilike.%aesthetic%',
  'program_slug.ilike.%cosmetolog%',
  'program_interest.ilike.%cosmetolog%',
  'program_slug.ilike.%nail%',
  'program_interest.ilike.%nail%',
].join(',');

function isSkippedTestEmail(email: string): boolean {
  if (INCLUDE_TEST) return false;
  const e = email.toLowerCase();
  return (
    /@example\.com$/i.test(e) ||
    e === 'test@test.com' ||
    /^audit@/i.test(e) ||
    /^audit-test@/i.test(e)
  );
}

function programLabelFromSlug(slug: string, track: BeautyTrack): string {
  if (slug) return slug;
  if (track === 'esthetician') return 'esthetician';
  if (track === 'cosmetology') return 'cosmetology-apprenticeship';
  return 'nail-technician-apprenticeship';
}

function upsertContact(
  map: Map<string, BeautyContactRow>,
  row: BeautyContactRow,
  preferNewer: boolean,
) {
  const email = row.email.toLowerCase().trim();
  if (!email || !email.includes('@')) return;
  const existing = map.get(email);
  if (!existing) {
    map.set(email, row);
    return;
  }
  if (preferNewer && row.createdAt > existing.createdAt) {
    map.set(email, row);
  }
}

async function fetchBeautyContacts(): Promise<BeautyContactRow[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: apps, error: appErr } = await sb
    .from('applications')
    .select(
      'first_name, last_name, email, phone, city, created_at, source, status, payment_status, program_slug, program_interest',
    )
    .or(BEAUTY_OR_FILTER)
    .order('created_at', { ascending: false });

  if (appErr) throw appErr;

  const { data: leads, error: leadErr } = await sb
    .from('leads')
    .select(
      'first_name, last_name, full_name, email, phone, program_interest, created_at, source, status',
    )
    .or(
      'program_interest.ilike.%esthetic%,program_interest.ilike.%aesthetic%,program_interest.ilike.%cosmetolog%,program_interest.ilike.%nail%',
    );

  if (leadErr) throw leadErr;

  const { data: intake, error: intakeErr } = await sb
    .from('apprenticeship_intake')
    .select('full_name, email, phone, city, program_interest, status, created_at')
    .or(
      'program_interest.ilike.%esthetic%,program_interest.ilike.%aesthetic%,program_interest.ilike.%cosmetolog%,program_interest.ilike.%nail%',
    )
    .order('created_at', { ascending: false });

  if (intakeErr) throw intakeErr;

  const map = new Map<string, BeautyContactRow>();

  for (const a of apps ?? []) {
    const slug = (a.program_slug || a.program_interest || '').trim();
    const track = resolveBeautyTrack(slug);
    if (!track) continue;
    const email = (a.email ?? '').toLowerCase().trim();
    upsertContact(
      map,
      {
        firstName: a.first_name ?? '',
        lastName: a.last_name ?? '',
        email,
        phone: a.phone ?? '',
        city: a.city ?? '',
        status: [a.status, a.payment_status].filter(Boolean).join(' / '),
        programLabel: programLabelFromSlug(slug, track),
        track,
        source: `application${a.source ? ` (${a.source})` : ''}`,
        createdAt: a.created_at ?? '',
      },
      true,
    );
  }

  for (const l of leads ?? []) {
    const slug = (l.program_interest ?? '').trim();
    const track = resolveBeautyTrack(slug);
    if (!track) continue;
    const email = (l.email ?? '').toLowerCase().trim();
    const parts = (l.full_name ?? '').trim().split(/\s+/).filter(Boolean);
    upsertContact(
      map,
      {
        firstName: l.first_name ?? parts[0] ?? '',
        lastName: l.last_name ?? parts.slice(1).join(' ') ?? '',
        email,
        phone: l.phone ?? '',
        city: '',
        status: l.status ?? '',
        programLabel: programLabelFromSlug(slug, track),
        track,
        source: `lead (${slug || track})`,
        createdAt: l.created_at ?? '',
      },
      false,
    );
  }

  for (const i of intake ?? []) {
    const slug = (i.program_interest ?? '').trim();
    const track = resolveBeautyTrack(slug);
    if (!track) continue;
    const email = (i.email ?? '').toLowerCase().trim();
    const parts = (i.full_name ?? '').trim().split(/\s+/).filter(Boolean);
    upsertContact(
      map,
      {
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
        email,
        phone: i.phone ?? '',
        city: i.city ?? '',
        status: i.status ?? 'intake',
        programLabel: programLabelFromSlug(slug, track),
        track,
        source: `apprenticeship_intake (${slug})`,
        createdAt: i.created_at ?? '',
      },
      false,
    );
  }

  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function main() {
  await hydrateProcessEnv();
  if (!process.env.SENDGRID_API_KEY && !DRY_RUN) {
    console.error('SENDGRID_API_KEY required for --send');
    process.exit(1);
  }

  const allContacts = await fetchBeautyContacts();
  const contacts = allContacts.filter((c) => !isSkippedTestEmail(c.email));
  const skipped = allContacts.filter((c) => isSkippedTestEmail(c.email));

  console.log(`Beauty pool: ${allContacts.length} unique; emailing ${contacts.length}`);
  if (skipped.length) console.log('Skipped test:', skipped.map((c) => c.email).join(', '));

  contacts.forEach((c, i) =>
    console.log(
      `${i + 1}. [${c.track}] ${c.firstName} ${c.lastName} <${c.email}> — ${c.programLabel} (${c.status})`,
    ),
  );

  mkdirSync('exports', { recursive: true });
  writeFileSync(
    'exports/beauty-applicants-combined.json',
    JSON.stringify({ pulled_at: new Date().toISOString(), contacts: allContacts }, null, 2),
  );

  const subject = 'Beauty & wellness training is open for enrollment — your next steps';
  let sent = 0;
  let failed = 0;
  const emailed: BeautyContactRow[] = [];

  for (const c of contacts) {
    const html = buildBeautyEnrollmentOpenApplicantEmail(
      c.firstName || c.lastName || 'Friend',
      c.track,
    );
    if (DRY_RUN) {
      console.log(`[dry-run] ${c.email} (${c.track})`);
      emailed.push(c);
      sent++;
      continue;
    }
    const result = await sendEmail({
      to: c.email,
      subject,
      html,
      replyTo: BEAUTY_ENROLLMENT_OPEN_REPLY_TO,
    });
    if (result.success) {
      sent++;
      emailed.push(c);
      console.log(`Sent: ${c.email}`);
    } else {
      failed++;
      console.error(`Failed: ${c.email}`, result.error);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const adminHtml = buildBeautyEnrollmentOpenAdminRosterEmail(allContacts, emailed, {
    sent,
    failed,
    skipped: skipped.length,
  });

  if (DRY_RUN) {
    console.log(`[dry-run] admin roster → ${ADMIN_TO.join(', ')}`);
  } else {
    const adminResult = await sendEmail({
      to: ADMIN_TO,
      subject: `Esthetician, cosmetology & nail tech blast — ${emailed.length} emailed (combined roster)`,
      html: adminHtml,
      replyTo: BEAUTY_ENROLLMENT_OPEN_REPLY_TO,
    });
    if (!adminResult.success) {
      console.error('Admin roster failed', adminResult.error);
      process.exit(1);
    }
    console.log(`Combined contact list emailed to ${ADMIN_TO.join(', ')}`);
  }

  console.log(JSON.stringify({ mode: DRY_RUN ? 'dry-run' : 'send', sent, failed, total: contacts.length }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
