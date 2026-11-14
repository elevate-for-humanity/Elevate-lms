#!/usr/bin/env tsx
/**
 * QMA (Qualified Medication Aide) enrollment-open blast.
 *
 *   pnpm tsx scripts/send-qma-enrollment-open-emails.ts --dry-run
 *   pnpm tsx scripts/send-qma-enrollment-open-emails.ts --send
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildQmaEnrollmentOpenAdminRosterEmail,
  buildQmaEnrollmentOpenApplicantEmail,
  isQmaProgram,
  QMA_ENROLLMENT_OPEN_REPLY_TO,
  type QmaContactRow,
} from '../lib/email/qma-enrollment-open';
import { hydrateProcessEnv } from '../lib/secrets';
import { sendEmail } from '../lib/email/sendgrid';
import { mkdirSync, writeFileSync } from 'fs';

const DRY_RUN = !process.argv.includes('--send');
const INCLUDE_TEST = process.argv.includes('--include-test');
const ADMIN_TO = [QMA_ENROLLMENT_OPEN_REPLY_TO];

function isSkippedTestEmail(email: string): boolean {
  if (INCLUDE_TEST) return false;
  const e = email.toLowerCase();
  return (
    /@example\.com$/i.test(e) ||
    e === 'test@test.com' ||
    /^audit@/i.test(e) ||
    /^audit-test@/i.test(e) ||
    e.includes('jozanna.test.elevate')
  );
}

async function fetchQmaContacts(): Promise<QmaContactRow[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: apps, error: appErr } = await sb
    .from('applications')
    .select(
      'first_name, last_name, email, phone, city, created_at, source, status, payment_status, program_slug, program_interest',
    )
    .or(
      'program_slug.eq.qma,program_interest.eq.qma,program_slug.ilike.%qma%,program_interest.ilike.%qma%,program_interest.ilike.%medication aide%,program_interest.ilike.%qualified medication%',
    )
    .order('created_at', { ascending: false });

  if (appErr) throw appErr;

  const { data: leads, error: leadErr } = await sb
    .from('leads')
    .select(
      'first_name, last_name, full_name, email, phone, program_interest, created_at, source, status, notes',
    )
    .or(
      'program_interest.ilike.%qma%,program_interest.ilike.%medication aide%,program_interest.ilike.%qualified medication%,notes.ilike.%qma%',
    );

  if (leadErr) throw leadErr;

  const map = new Map<string, QmaContactRow>();

  for (const a of apps ?? []) {
    const slug = `${a.program_slug ?? ''} ${a.program_interest ?? ''}`.trim();
    if (!isQmaProgram(slug)) continue;
    const email = (a.email ?? '').toLowerCase().trim();
    if (!email || !email.includes('@')) continue;
    const label = a.program_slug || a.program_interest || 'qma';
    const row: QmaContactRow = {
      firstName: a.first_name ?? '',
      lastName: a.last_name ?? '',
      email,
      phone: a.phone ?? '',
      city: a.city ?? '',
      status: [a.status, a.payment_status].filter(Boolean).join(' / '),
      programLabel: label,
      source: `application${a.source ? ` (${a.source})` : ''}`,
      createdAt: a.created_at ?? '',
    };
    const existing = map.get(email);
    if (!existing || row.createdAt > existing.createdAt) map.set(email, row);
  }

  for (const l of leads ?? []) {
    const slug = `${l.program_interest ?? ''} ${l.notes ?? ''}`.trim();
    if (!isQmaProgram(slug)) continue;
    const email = (l.email ?? '').toLowerCase().trim();
    if (!email || !email.includes('@') || map.has(email)) continue;
    const parts = (l.full_name ?? '').trim().split(/\s+/).filter(Boolean);
    map.set(email, {
      firstName: l.first_name ?? parts[0] ?? '',
      lastName: l.last_name ?? parts.slice(1).join(' ') ?? '',
      email,
      phone: l.phone ?? '',
      city: '',
      status: l.status ?? '',
      programLabel: l.program_interest ?? 'qma',
      source: `lead (${l.program_interest ?? 'QMA'})`,
      createdAt: l.created_at ?? '',
    });
  }

  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function main() {
  await hydrateProcessEnv();
  if (!process.env.SENDGRID_API_KEY && !DRY_RUN) {
    console.error('SENDGRID_API_KEY required for --send');
    process.exit(1);
  }

  const allContacts = await fetchQmaContacts();
  const contacts = allContacts.filter((c) => !isSkippedTestEmail(c.email));
  const skippedTest = allContacts.filter((c) => isSkippedTestEmail(c.email));

  console.log(`QMA pool: ${allContacts.length} unique; emailing ${contacts.length}`);
  if (skippedTest.length) console.log('Skipped:', skippedTest.map((c) => c.email).join(', '));

  contacts.forEach((c, i) =>
    console.log(
      `${i + 1}. ${c.firstName} ${c.lastName} <${c.email}> — ${c.programLabel} (${c.status})`,
    ),
  );

  mkdirSync('exports', { recursive: true });
  writeFileSync(
    'exports/qma-applicants.json',
    JSON.stringify({ pulled_at: new Date().toISOString(), contacts: allContacts }, null, 2),
  );

  const subject = 'QMA training is open for enrollment — your next steps';
  let sent = 0;
  let failed = 0;
  const emailed: QmaContactRow[] = [];

  for (const c of contacts) {
    const html = buildQmaEnrollmentOpenApplicantEmail(c.firstName || c.lastName || 'Friend');
    if (DRY_RUN) {
      console.log(`[dry-run] ${c.email}`);
      emailed.push(c);
      sent++;
      continue;
    }
    const result = await sendEmail({
      to: c.email,
      subject,
      html,
      replyTo: QMA_ENROLLMENT_OPEN_REPLY_TO,
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

  const adminHtml = buildQmaEnrollmentOpenAdminRosterEmail(allContacts, emailed, {
    sent,
    failed,
    skipped: skippedTest.length,
  });

  const adminSubject =
    contacts.length === 0
      ? 'QMA blast — 0 applicants in database (roster report)'
      : `QMA blast — ${emailed.length} applicants emailed (contact list)`;

  if (DRY_RUN) {
    console.log(`[dry-run] admin roster → ${ADMIN_TO.join(', ')}`);
  } else {
    const adminResult = await sendEmail({
      to: ADMIN_TO,
      subject: adminSubject,
      html: adminHtml,
      replyTo: QMA_ENROLLMENT_OPEN_REPLY_TO,
    });
    if (!adminResult.success) {
      console.error('Admin roster failed', adminResult.error);
      process.exit(1);
    }
    console.log(`Contact list emailed to ${ADMIN_TO.join(', ')}`);
  }

  console.log(JSON.stringify({ mode: DRY_RUN ? 'dry-run' : 'send', sent, failed, total: contacts.length }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
