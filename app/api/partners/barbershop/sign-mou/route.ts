import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  let body: Record<string, string>;
  try { body = await request.json(); }
  catch { return safeError('Invalid JSON', 400); }

  const {
    shop_name, owner_name, contact_name, ein, phone, contact_email,
    address_line1, city, state, zip, website, apprentice_capacity,
    license_number, license_state, license_expiry,
    signature, agreed,
  } = body;

  if (!shop_name || !owner_name || !contact_email || !signature || !agreed) {
    return safeError('shop_name, owner_name, contact_email, signature, and agreed are required', 400);
  }

  const db = createAdminClient();
  const now = new Date().toISOString();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';

  try {
    // 1. Upsert partner record with all profile data
    const { data: partner, error: partnerErr } = await db
      .from('partners')
      .upsert({
        name: shop_name,
        shop_name,
        owner_name,
        contact_name: contact_name || owner_name,
        contact_email,
        ein,
        phone,
        address_line1,
        city,
        state: state || 'Indiana',
        zip,
        website,
        apprentice_capacity: apprentice_capacity ? parseInt(apprentice_capacity) : null,
        license_number,
        license_state: license_state || 'Indiana',
        license_expiry,
        partner_type: 'training_site',
        type: 'barber_apprenticeship',
        programs: ['BARBER'],
        mou_signed: true,
        mou_signed_at: now,
        onboarding_step: 'mou_signed',
        updated_at: now,
      }, { onConflict: 'contact_email' })
      .select('id')
      .single();

    if (partnerErr) {
      logger.error('Partner upsert failed', partnerErr);
      return safeError('Failed to save partner record', 500);
    }

    // 2. Store MOU signature record
    await db.from('mou_signatures').insert({
      organization_name: shop_name,
      contact_name: owner_name,
      contact_title: 'Owner',
      contact_email,
      digital_signature: signature,
      agreed: true,
      ip_address: ip,
      user_agent: ua,
    });

    // 3. Send confirmation email to partner
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: contact_email }] }],
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
        reply_to: { email: 'info@elevateforhumanity.org' },
        subject: 'MOU Signed — Barber Apprenticeship Program | Elevate for Humanity',
        content: [{
          type: 'text/html',
          value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2>MOU Signed Successfully</h2>
            <p>Hi ${owner_name},</p>
            <p>Your Memorandum of Understanding for the Barber Apprenticeship Program has been recorded.</p>
            <p><strong>Next step:</strong> Please complete your Employer Agreement to finalize your onboarding.</p>
            <p><strong>Signed:</strong> ${now}</p>
            <p><strong>Shop:</strong> ${shop_name}</p>
            <p>Thank you,<br/>Elevate for Humanity</p>
          </div>`
        }],
      }),
    }).catch(() => {}); // non-blocking

    // 4. Send copy to Elevate
    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: process.env.ALERT_EMAIL_TO || 'elevate4humanityedu@gmail.com' }] }],
        from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
        subject: `[MOU SIGNED] ${shop_name} — ${owner_name}`,
        content: [{
          type: 'text/html',
          value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2>MOU Signed — Barbershop Partner</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:6px;font-weight:bold">Shop</td><td>${shop_name}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Owner</td><td>${owner_name}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Email</td><td>${contact_email}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Phone</td><td>${phone}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">EIN</td><td>${ein}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">License #</td><td>${license_number}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">License Expiry</td><td>${license_expiry}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Address</td><td>${address_line1}, ${city}, ${state} ${zip}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">Signed At</td><td>${now}</td></tr>
              <tr><td style="padding:6px;font-weight:bold">IP</td><td>${ip}</td></tr>
            </table>
          </div>`
        }],
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, partner_id: partner.id });
  } catch (err) {
    return safeInternalError(err, 'MOU signing failed');
  }
}

export const POST = withApiAudit('/api/partners/barbershop/sign-mou', _POST);
