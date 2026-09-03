#!/usr/bin/env tsx
/**
 * Email all CDL applicants/leads that enrollment is open + send admin roster to Elevate.
 *
 *   pnpm tsx scripts/send-cdl-enrollment-open-emails.ts --dry-run
 *   pnpm tsx scripts/send-cdl-enrollment-open-emails.ts --send
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENDGRID_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildCdlEnrollmentOpenAdminRosterEmail,
  buildCdlEnrollmentOpenApplicantEmail,
  CDL_ENROLLMENT_OPEN_REPLY_TO,
  type CdlContactRow,
} from '../lib/email/cdl-enrollment-open';
import { hydrateProcessEnv } from '../lib/secrets';
import { sendEmail } from '../lib/email/sendgrid';

const DRY_RUN = !process.argv.includes('--send');
const ADMIN_TO = [CDL_ENROLLMENT_OPEN_REPLY_TO];

async function fetchCdlContacts(): Promise<CdlContactRow[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: apps, error: appErr } = await sb
    .from('applications')
    .select('first_name, last_name, email, phone, city, created_at, source')
    .or('program_slug.eq.cdl-training,program_interest.ilike.%cdl%')
    .order('created_at', { ascending: false });

  if (appErr) throw appErr;

  const { data: leads, error: leadErr } = await sb
    .from('leads')
    .select('first_name, last_name, full_name, email, phone, program_interest, created_at, source')
    .or('program_interest.ilike.%cdl%,notes.ilike.%cdl%');

  if (leadErr) throw leadErr;

  const map = new Map<string, CdlContactRow>();

  for (const a of apps ?? []) {
    const email = (a.email ?? '').toLowerCase().trim();
    if (!email || !email.includes('@')) continue;
    if (map.has(email)) continue;
    map.set(email, {
      firstName: a.first_name ?? '',
      lastName: a.last_name ?? '',
      email,
      phone: a.phone ?? '',
      city: a.city ?? '',
      source: `application${a.source ? ` (${a.source})` : ''}`,
      createdAt: a.created_at ?? '',
    });
  }

  for (const l of leads ?? []) {
    const email = (l.email ?? '').toLowerCase().trim();
    if (!email || !email.includes('@')) continue;
    if (map.has(email)) continue;
    const nameParts = (l.full_name ?? '').trim().split(/\s+/);
    map.set(email, {
      firstName: l.first_name ?? nameParts[0] ?? '',
      lastName: l.last_name ?? nameParts.slice(1).join(' ') ?? '',
      email,
      phone: l.phone ?? '',
      city: '',
      source: `lead (${l.program_interest ?? 'CDL'})`,
      createdAt: l.created_at ?? '',
    });
  }

  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function main() {
  await hydrateProcessEnv();
  if (!process.env.SENDGRID_API_KEY && !DRY_RUN) {
    console.error('SENDGRID_API_KEY is required for --send');
    process.exit(1);
  }

  const contacts = await fetchCdlContacts();
  console.log(`CDL contacts (unique emails): ${contacts.length}`);
  contacts.forEach((c) =>
    console.log(`  - ${c.firstName} ${c.lastName} <${c.email}> (${c.source})`),
  );

  const subject = 'CDL training is open for enrollment — your next steps';
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const c of contacts) {
    if (!c.email.includes('@')) {
      skipped++;
      continue;
    }
    const html = buildCdlEnrollmentOpenApplicantEmail(c.firstName || c.lastName || 'Friend');
    if (DRY_RUN) {
      console.log(`[dry-run] would email: ${c.email}`);
      sent++;
      continue;
    }
    const result = await sendEmail({
      to: c.email,
      subject,
      html,
      replyTo: CDL_ENROLLMENT_OPEN_REPLY_TO,
      bcc: ADMIN_TO,
    });
    if (result.success) {
      sent++;
      console.log(`Sent: ${c.email}`);
    } else {
      failed++;
      console.error(`Failed: ${c.email}`, result.error);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const adminHtml = buildCdlEnrollmentOpenAdminRosterEmail(contacts, { sent, failed, skipped });
  const adminSubject = `CDL enrollment open blast — ${contacts.length} contacts (follow-up roster)`;

  if (DRY_RUN) {
    console.log(`[dry-run] would send admin roster to: ${ADMIN_TO.join(', ')}`);
  } else {
    const adminResult = await sendEmail({
      to: ADMIN_TO,
      subject: adminSubject,
      html: adminHtml,
      replyTo: CDL_ENROLLMENT_OPEN_REPLY_TO,
    });
    if (!adminResult.success) {
      console.error('Admin roster email failed', adminResult.error);
      process.exit(1);
    }
    console.log(`Admin roster emailed to ${ADMIN_TO.join(', ')}`);
  }

  console.log({ mode: DRY_RUN ? 'dry-run' : 'send', sent, failed, skipped, total: contacts.length });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
