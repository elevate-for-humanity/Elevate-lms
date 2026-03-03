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

    // Insert MOU signature
    const { data: mouRecord, error: insertError } = await supabase
      .from('mou_signatures')
      .insert({
        signer_name: signer_name.trim(),
        signer_title: signer_title.trim(),
        signature_data,
        signed_at: signed_at || new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        agreed_at: new Date().toISOString(),
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

    // Also store in partner_mous with full details
    await supabase.from('partner_mous').insert({
      mou_version: mou_version || '2025-01',
      status: 'signed',
      signed_at: signed_at || new Date().toISOString(),
      terms: {
        shop_name: shop_name.trim(),
        signer_name: signer_name.trim(),
        signer_title: signer_title.trim(),
        supervisor_name: supervisor_name?.trim(),
        supervisor_license: supervisor_license?.trim(),
        compensation_model,
        compensation_rate,
        signature_id: mouRecord?.id,
        ip_address: ipAddress,
      },
    });

    // Update application status if found
    if (application?.id) {
      await supabase
        .from('barbershop_partner_applications')
        .update({
          status: 'mou_signed',
          mou_acknowledged: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);

      logger.info(`[sign-mou] Application ${application.id} updated to mou_signed`);
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
