#!/usr/bin/env tsx
/**
 * Email all CNA applicants/leads that enrollment is open + send admin roster.
 *
 *   pnpm tsx scripts/send-cna-enrollment-open-emails.ts --dry-run
 *   pnpm tsx scripts/send-cna-enrollment-open-emails.ts --send
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENDGRID_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildCnaEnrollmentOpenAdminRosterEmail,
  buildCnaEnrollmentOpenApplicantEmail,
  CNA_ENROLLMENT_OPEN_REPLY_TO,
  type CnaContactRow,
} from '../lib/email/cna-enrollment-open';
import { sendEmail } from '../lib/email/sendgrid';

const DRY_RUN = !process.argv.includes('--send');
const ADMIN_TO = [CNA_ENROLLMENT_OPEN_REPLY_TO];

async function fetchCnaContacts(): Promise<CnaContactRow[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: apps, error: appErr } = await sb
    .from('applications')
    .select('first_name, last_name, email, phone, city, created_at, source')
    .or('program_slug.eq.cna,program_interest.ilike.%cna%');

  if (appErr) throw appErr;

  const { data: leads, error: leadErr } = await sb
    .from('leads')
    .select('first_name, last_name, full_name, email, phone, program_interest, created_at, source')
    .or('program_interest.ilike.%cna%,notes.ilike.%cna%');

  if (leadErr) throw leadErr;

  const map = new Map<string, CnaContactRow>();

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
      source: `lead (${l.program_interest ?? 'CNA'})`,
      createdAt: l.created_at ?? '',
    });
  }

  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function main() {
  console.log(`\n=== CNA Enrollment Open Email Blast ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (add --send to actually send)' : 'LIVE'}`);
  console.log('');

  const contacts = await fetchCnaContacts();
  console.log(`Found ${contacts.length} CNA contacts`);

  if (contacts.length === 0) {
    console.log('No contacts to email. Exiting.');
    return;
  }

  let sent = 0, failed = 0, skipped = 0;

  for (const contact of contacts) {
    if (DRY_RUN) {
      console.log(`  [DRY] Would send to: ${contact.email} (${contact.firstName} ${contact.lastName})`);
      sent++;
    } else {
      try {
        const result = await sendEmail({
          to: contact.email,
          from: CNA_ENROLLMENT_OPEN_REPLY_TO,
          replyTo: CNA_ENROLLMENT_OPEN_REPLY_TO,
          subject: '🎉 CNA Training Special — $650 OFF with Code CNAJULY!',
          html: buildCnaEnrollmentOpenApplicantEmail(contact.firstName),
        });
        if (result.success) {
          console.log(`  ✓ Sent to: ${contact.email}`);
          sent++;
        } else {
          console.log(`  ✗ Failed: ${contact.email}`);
          failed++;
        }
      } catch (err) {
        console.log(`  ✗ Error: ${contact.email}`, err);
        failed++;
      }
    }
  }

  console.log(`\nSummary: ${sent} sent, ${failed} failed, ${skipped} skipped`);

  // Send admin roster
  if (!DRY_RUN) {
    await sendEmail({
      to: ADMIN_TO,
      subject: `CNA Enrollment Open — ${sent} emails sent`,
      html: buildCnaEnrollmentOpenAdminRosterEmail(contacts, { sent, failed, skipped }),
    });
    console.log('Admin roster sent.');
  }
}

main().catch(console.error);
