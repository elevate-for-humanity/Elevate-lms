import { safeInternalError } from '@/lib/api/safe-error';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

/**
 * POST /api/funnel/lead
 * Captures a funnel lead from /check-eligibility or /apply/start.
 * Stores in applications table and sends admin notification email.
 */
export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const limited = await applyRateLimit(req, 'contact');
  if (limited) return limited;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, phone, email, program, employment, goals, source, qualifierAnswers } = body;

  if (!name?.trim() || !phone?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Name, phone, and email are required.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const firstName = name.trim().split(' ')[0] || name.trim();
  const lastName = name.trim().split(' ').slice(1).join(' ') || '';
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone.trim();

  const supportNotes = [
    program ? `Program: ${program}` : '',
    employment ? `Employment: ${employment}` : '',
    goals ? `Goals: ${goals}` : '',
    qualifierAnswers
      ? `Qualifier: unemployed=${qualifierAnswers.unemployedOrUnder}, indiana=${qualifierAnswers.indianaResident}, wantsCert=${qualifierAnswers.wantsCert}`
      : '',
  ].filter(Boolean).join(' | ');

  const db = createAdminClient();

  // Store in leads table
  let applicationId: string | null = null;
  if (db) {
    try {
      const { data, error } = await db
        .from('leads')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
          phone: normalizedPhone,
          program_interest: program || 'Not specified',
          source: source || 'funnel',
          status: 'new',
        })
        .select('id')
        .single();

      if (error) {
        logger.error('[funnel/lead] DB insert failed', new Error(`${error.code}: ${error.message}`));
      } else {
        applicationId = data?.id || null;
        logger.info('[funnel/lead] Lead stored', { applicationId, email: normalizedEmail, source });
      }
    } catch (err) {
      logger.error('[funnel/lead] DB error', err as Error);
    }
  }

  // Admin notification email
  const sgKey = process.env.SENDGRID_API_KEY;
  if (sgKey) {
    const logoUrl = `${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;
    const sourceLabel =
      source === 'check-eligibility' ? 'Eligibility Check' :
      source === 'workforce-partners' ? 'Agency Partner Inquiry' :
      'Direct Application';
    const html = `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
  <div style="text-align:center;padding:24px">
    <img src="${logoUrl}" alt="Elevate for Humanity" width="130" style="max-width:130px;height:auto" />
  </div>
  <div style="padding:0 24px 32px">
    <h2 style="color:#dc2626;margin:0 0 4px">New Lead — ${sourceLabel}</h2>
    <p style="color:#666;font-size:13px;margin:0 0 20px">${new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9;width:140px">Name</td><td style="padding:8px 12px">${name.trim()}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9">Phone</td><td style="padding:8px 12px"><a href="tel:${normalizedPhone}" style="color:#dc2626;font-weight:bold">${normalizedPhone}</a></td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9">Email</td><td style="padding:8px 12px"><a href="mailto:${normalizedEmail}" style="color:#dc2626">${normalizedEmail}</a></td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9">Program</td><td style="padding:8px 12px">${program || '—'}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9">Employment</td><td style="padding:8px 12px">${employment || '—'}</td></tr>
      ${goals ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9">Goals</td><td style="padding:8px 12px">${goals}</td></tr>` : ''}
      ${qualifierAnswers ? `<tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9">Qualifier</td><td style="padding:8px 12px">Unemployed: ${qualifierAnswers.unemployedOrUnder} &middot; Indiana: ${qualifierAnswers.indianaResident} &middot; Wants cert: ${qualifierAnswers.wantsCert}</td></tr>` : ''}
      <tr><td style="padding:8px 12px;font-weight:bold;background:#f9f9f9">Source</td><td style="padding:8px 12px">${sourceLabel}</td></tr>
    </table>
    <div style="margin-top:24px;text-align:center">
      <a href="${SITE_URL}/admin/applications" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:bold;font-size:14px">View in Admin</a>
    </div>
    <p style="margin-top:20px;font-size:12px;color:#999;text-align:center">Respond within 24 hours for best conversion.</p>
  </div>
</div>`;

    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
        reply_to: { email: normalizedEmail, name: name.trim() },
        personalizations: [{ to: [{ email: ADMIN_EMAIL }] }],
        subject: `[NEW LEAD] ${name.trim()} — ${program || 'Program TBD'} (${sourceLabel})`,
        content: [{ type: 'text/html', value: html }],
      }),
    }).catch((err) => logger.error('[funnel/lead] Admin email failed', err));
  }

  return NextResponse.json({ success: true, applicationId });
}
