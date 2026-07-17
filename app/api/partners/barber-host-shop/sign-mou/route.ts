import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

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
  } = body;

  if (!shop_name || !signer_name || !signature_data) {
    return safeError('shop_name, signer_name, and signature_data are required', 400);
  }

  const db = await requireAdminClient();
  const email = user.email?.toLowerCase().trim() ?? '';
  const signedAt = signed_at ?? new Date().toISOString();

  let { data: partner } = await db
    .from('partners')
    .select('id, name')
    .eq('contact_email', email)
    .or('program_type.eq.barber,program_type.is.null')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!partner) {
    const { data: bpa } = await db
      .from('barbershop_partner_applications')
      .select(
        'id, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, can_supervise_and_verify, mou_signed_at, mou_signature_data, status',
      )
      .eq('contact_email', email)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!bpa) {
      return safeError(
        'No approved barbershop application found for this account. Contact support if you were recently approved.',
        404,
      );
    }

    const provisioned = await provisionPartnerFromBarberApplication(db, bpa, {
      linkUserId: user.id,
    });
    if (!provisioned) {
      return safeError('Could not create partner record. Please contact support.', 500);
    }

    partner = { id: provisioned.partnerId, name: shop_name };
  }

  const { error: sigErr } = await db.from('mou_signatures').insert({
    user_id: user.id,
    organization_name: shop_name,
    contact_name: signer_name,
    contact_title: signer_title ?? '',
    contact_email: user.email,
    signer_name,
    signer_title: signer_title ?? '',
    supervisor_name: supervisor_name ?? '',
    supervisor_license: supervisor_license ?? '',
    compensation_model: compensation_model ?? '',
    compensation_rate: compensation_rate ?? '',
    digital_signature: signature_data,
    signature_data,
    agreed: true,
    agreed_at: signedAt,
    signed_at: signedAt,
    mou_version: mou_version ?? '2025-barber-01',
    partner_type: 'barber',
  });

  if (sigErr) {
    logger.error('Barbershop MOU signature insert error:', sigErr);
    return safeInternalError(sigErr, 'Failed to record MOU signature');
  }

  const { error: updateErr } = await db
    .from('partners')
    .update({ mou_signed: true, mou_signed_at: signedAt })
    .eq('id', partner.id);

  if (updateErr) {
    logger.error('Barbershop partner mou_signed update error:', updateErr);
  }

  await db
    .from('barbershop_partner_applications')
    .update({
      mou_signed_at: signedAt,
      mou_signature_data: signature_data,
      mou_signer_name: signer_name,
    })
    .eq('contact_email', email)
    .eq('status', 'approved');

  logger.info(`Barbershop MOU signed: partner ${partner.id} — ${shop_name}`);
  return NextResponse.json({ success: true }, { status: 200 });
}
