export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      shop_name,
      signer_name,
      signer_title,
      supervisor_name,
      supervisor_license,
      compensation_model,
      compensation_rate,
      signature_data,
      signed_at,
      mou_version,
    } = body || {};

    // Validation
    if (!shop_name || !signer_name || !signer_title) {
      return NextResponse.json(
        { error: 'Shop name, signer name, and title are required.' },
        { status: 400 }
      );
    }

    if (!signature_data || !signature_data.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'A valid digital signature is required.' },
        { status: 400 }
      );
    }

    if (!supervisor_name || !supervisor_license) {
      return NextResponse.json(
        { error: 'Supervisor name and license number are required.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Find the matching application by shop name
    const { data: application } = await supabase
      .from('barbershop_partner_applications')
      .select('id, status')
      .ilike('shop_legal_name', shop_name.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();

    // Insert MOU signature
    const { data: mouRecord, error: insertError } = await supabase
      .from('mou_signatures')
      .insert({
        signer_name: signer_name.trim(),
        signer_title: signer_title.trim(),
        signature_data,
        signed_at: signed_at || now,
        ip_address: ipAddress,
        user_agent: userAgent,
        agreed_at: now,
        supervisor_name: supervisor_name?.trim(),
        supervisor_license: supervisor_license?.trim(),
        compensation_model,
        compensation_rate,
        mou_version: mou_version || '2025-01',
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('[sign-mou] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save MOU signature. Please try again.' },
        { status: 500 }
      );
    }

    // Store in partner_mous (optional — don't block flow if schema mismatch)
    try {
      await supabase.from('partner_mous').insert({
        partner_id: application?.id || '00000000-0000-0000-0000-000000000000',
        version: mou_version || '2025-01',
        status: 'signed',
        signed_at: signed_at || now,
        signed_by: signer_name.trim(),
        signature_ip: ipAddress,
      });
    } catch (e) {
      logger.warn('[sign-mou] partner_mous insert failed (non-blocking):', e);
    }

    // Update application status if found
    if (application?.id) {
      await supabase
        .from('barbershop_partner_applications')
        .update({
          status: 'mou_signed',
          mou_acknowledged: true,
          updated_at: now,
        })
        .eq('id', application.id);

      logger.info(`[sign-mou] Application ${application.id} updated to mou_signed`);
    }

    // Send admin notification email
    try {
      const ADMIN_EMAIL = process.env.PARTNER_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';
      const sgKey = process.env.SENDGRID_API_KEY;
      if (sgKey) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sgKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: ADMIN_EMAIL }] }],
            from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
            reply_to: { email: 'info@elevateforhumanity.org' },
            subject: `[MOU SIGNED] ${shop_name.trim()} — Barber Apprenticeship Partnership`,
            content: [{
              type: 'text/html',
              value: `<div style="font-family:Arial,sans-serif;max-width:600px">
                <h2 style="color:#1e293b">MOU Signed — Barber Apprenticeship</h2>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;width:180px">Shop Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${shop_name.trim()}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Signer</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${signer_name.trim()} (${signer_title.trim()})</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Supervising Barber</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${supervisor_name?.trim() || 'N/A'} — License: ${supervisor_license?.trim() || 'N/A'}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Compensation</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${compensation_model || 'N/A'} — ${compensation_rate || 'N/A'}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold">Signed At</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${now}</td></tr>
                  <tr><td style="padding:8px;font-weight:bold">IP Address</td><td style="padding:8px">${ipAddress}</td></tr>
                </table>
                <p style="color:#64748b;font-size:13px">Application match: ${application?.id ? 'Yes — status updated to mou_signed' : 'No matching application found'}</p>
              </div>`,
            }],
          }),
        });
      }
    } catch (emailErr) {
      logger.warn('[sign-mou] Admin notification email failed:', emailErr);
    }

    logger.info(`[sign-mou] MOU signed by ${signer_name} for ${shop_name}`);

    return NextResponse.json({
      ok: true,
      mou_id: mouRecord?.id,
      application_updated: !!application?.id,
    });
  } catch (err) {
    logger.error('[sign-mou] Error:', err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/partners/barbershop-apprenticeship/sign-mou', _POST);
