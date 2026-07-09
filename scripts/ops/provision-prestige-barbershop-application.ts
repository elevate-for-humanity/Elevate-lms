#!/usr/bin/env tsx
/**
 * Move Prestige Elevation from host_shop_applications into barbershop_partner_applications
 * (canonical barber host track) and email MOU PDF + document checklist.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/provision-prestige-barbershop-application.ts
 */
import { createClient } from '@supabase/supabase-js';
import { generateMOUPdf } from '@/lib/documents/generate-mou-pdf';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { outboundSiteUrl } from './outbound-site-url';
import { buildJourneyLinks, journeyStepsHtml } from './outreach-auth-link';
import { assertOutreachEmailAllowed } from './outreach-email-guard';

const SITE_URL = outboundSiteUrl();
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const PARTNER_ID = '9dffa854-1002-42e7-bad3-a8d626326d6e';
const CONTACT_EMAIL = 'info@prestigeelevation.com';

const HOST_SHOP_APP = {
  shop_name: 'Prestige Elevation Barber and Beauty Institute LLC',
  owner_name: 'Elizabeth L. Greene',
  phone: '(317) 760-7908',
  address: '6331 N Keystone Ave, Indianapolis, IN 46220',
  license_number: 'BA11000095',
  supervisor_name: 'Elizabeth L. Greene',
};

async function loadSendGridKey(db: ReturnType<typeof createClient>) {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db
    .from('platform_secrets')
    .select('value')
    .eq('key', 'SENDGRID_API_KEY')
    .maybeSingle();
  if (data?.value) return data.value as string;
  const { data: app } = await db
    .from('app_secrets')
    .select('value')
    .eq('key', 'SENDGRID_API_KEY')
    .maybeSingle();
  return (app?.value as string) ?? null;
}

async function main() {
  assertOutreachEmailAllowed('provision-prestige-barbershop-application.ts');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) process.exit(1);

  const db = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from('barbershop_partner_applications')
    .select('id')
    .ilike('shop_legal_name', '%Prestige Elevation%')
    .maybeSingle();

  const row = {
    shop_legal_name: HOST_SHOP_APP.shop_name,
    owner_name: HOST_SHOP_APP.owner_name,
    contact_name: HOST_SHOP_APP.owner_name,
    contact_email: CONTACT_EMAIL,
    contact_phone: HOST_SHOP_APP.phone,
    shop_address_line1: '6331 N Keystone Ave',
    shop_city: 'Indianapolis',
    shop_state: 'IN',
    shop_zip: '46220',
    indiana_shop_license_number: HOST_SHOP_APP.license_number,
    supervisor_name: HOST_SHOP_APP.supervisor_name,
    supervisor_license_number: HOST_SHOP_APP.license_number,
    compensation_model: 'commission',
    employment_model: 'commission',
    has_workers_comp: true,
    workers_comp_status: 'verified',
    can_supervise_and_verify: true,
    mou_acknowledged: true,
    consent_acknowledged: true,
    status: 'approved',
    notes: 'Migrated from host_shop_applications — canonical barber host track',
    updated_at: now,
  };

  if (existing?.id) {
    await db.from('barbershop_partner_applications').update(row).eq('id', existing.id);
    console.log('  ✅ barbershop_partner_applications updated', existing.id);
  } else {
    const { data: inserted, error } = await db
      .from('barbershop_partner_applications')
      .insert(row)
      .select('id')
      .single();
    if (error) throw error;
    console.log('  ✅ barbershop_partner_applications created', inserted.id);
  }

  await db
    .from('partners')
    .update({
      approval_status: 'approved',
      status: 'active',
      programs: ['barber', 'cosmetology'],
      license_number: HOST_SHOP_APP.license_number,
      updated_at: now,
    })
    .eq('id', PARTNER_ID);

  const sgKey = await loadSendGridKey(db);
  if (!sgKey) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  const { steps } = await buildJourneyLinks(db, CONTACT_EMAIL, 'partner');
  const stepsHtml = journeyStepsHtml(steps, { primaryIndex: 0 });
  const pdfBytes = await generateMOUPdf({
    shop_name: HOST_SHOP_APP.shop_name,
    signer_name: HOST_SHOP_APP.owner_name,
    signer_title: 'Owner / Program Director',
    supervisor_name: HOST_SHOP_APP.supervisor_name,
    supervisor_license: HOST_SHOP_APP.license_number,
    compensation_model: 'commission',
    signed_at: now,
    mou_version: '2025-barber-01',
  });

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1e293b;max-width:600px">
<p>Dear Elizabeth,</p>
<p><strong>Attached:</strong> Barber Host Shop MOU PDF for <strong>${HOST_SHOP_APP.shop_name}</strong> (now on the canonical <code>barbershop_partner_applications</code> track).</p>
${stepsHtml}
<p><strong>Required documents on file / please resend if updated:</strong></p>
<ol>
<li>IRS EIN Assignment Letter (CP 575)</li>
<li>W-9</li>
<li>Indiana Barbershop License</li>
<li>Workers` Compensation COI</li>
<li>General Liability COI</li>
<li>Supervising Barber License</li>
</ol>
<p>Please <strong>reply to this email</strong> with PDF attachments for each item above.</p>
<p>— ${PLATFORM_DEFAULTS.orgName}</p>
</body></html>`;

  const res = await fetch(`https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: CONTACT_EMAIL, name: HOST_SHOP_APP.owner_name }], cc: [{ email: ELEVATE_COPY }] }],
      from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
      reply_to: { email: ELEVATE_COPY },
      subject: `Barber Host Shop MOU — ${HOST_SHOP_APP.shop_name}`,
      content: [{ type: 'text/html', value: html }],
      attachments: [{
        content: Buffer.from(pdfBytes).toString('base64'),
        type: 'application/pdf',
        filename: 'Elevate-Barber-Host-MOU-Prestige-Elevation.pdf',
        disposition: 'attachment',
      }],
    }),
  });
  if (res.status !== 202) throw new Error(await res.text());
  console.log('  ✅ MOU PDF emailed to', CONTACT_EMAIL);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
