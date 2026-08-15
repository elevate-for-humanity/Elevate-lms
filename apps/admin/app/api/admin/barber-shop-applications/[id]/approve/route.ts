import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await requireAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: application, error: fetchError } = await supabase
    .from('barbershop_partner_applications')
    .select('id, status, contact_email, contact_name, contact_phone, owner_name, shop_legal_name, shop_dba_name, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, shop_physical_address, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, can_supervise_and_verify, mou_signed_at, mou_signature_data')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !application) {
    logger.error('barbershop application fetch error', undefined, { id, detail: fetchError?.message });
    return NextResponse.json({ error: 'Requested application is unavailable' }, { status: 404 });
  }

  if (application.status === 'approved') {
    return NextResponse.json({ success: true, status: 'approved', message: 'Already approved' });
  }

  const { error: updateError } = await supabase
    .from('barbershop_partner_applications')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    logger.error('barbershop application approval failed', undefined, { id, detail: updateError.message });
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }

  let linkUserId: string | undefined;
  try {
    const { data: linkedProfile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', application.contact_email.trim())
      .maybeSingle();
    linkUserId = linkedProfile?.id;
  } catch {
    // Applicant may not have an account yet.
  }

  const provisionedPartner = await provisionPartnerFromBarberApplication(supabase, application, {
    approvedBy: user.id,
    linkUserId,
  });
  if (!provisionedPartner) {
    logger.warn('[barber-approve] partners provisioning failed (non-fatal)', { id });
  }

  let provisionedShopId: string | null = null;
  try {
    const { data: shopRow, error: shopErr } = await supabase
      .from('shops')
      .upsert(
        {
          name: application.shop_legal_name,
          address1: application.shop_address_line1 ?? application.shop_physical_address ?? null,
          city: application.shop_city ?? null,
          state: application.shop_state ?? null,
          zip: application.shop_zip ?? null,
          email: application.contact_email,
          active: true,
        },
        { onConflict: 'name,city,state' },
      )
      .select('id')
      .maybeSingle();

    if (shopErr || !shopRow) {
      logger.warn('[barber-approve] shops upsert failed (non-fatal)', {
        id,
        detail: shopErr?.message,
      });
    } else {
      provisionedShopId = shopRow.id;
      const { error: supervisorErr } = await supabase.from('shop_supervisors').upsert(
        {
          shop_id: provisionedShopId,
          user_id: linkUserId ?? null,
          name: application.supervisor_name ?? application.contact_name ?? application.owner_name,
          email: application.contact_email,
          phone: application.contact_phone ?? null,
          license_number: application.supervisor_license_number ?? null,
          license_type: 'barber',
          is_active: true,
        },
        { onConflict: 'shop_id,email' },
      );

      if (supervisorErr) {
        logger.warn('[barber-approve] shop_supervisors upsert failed (non-fatal)', {
          id,
          detail: supervisorErr.message,
        });
      }
    }
  } catch (provisionErr) {
    logger.warn('[barber-approve] Provisioning failed (non-fatal)', {
      id,
      error: String(provisionErr),
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    await sendEmail({
      to: application.contact_email,
      subject: `Your Barbershop Partner Application Has Been Approved — ${PLATFORM_DEFAULTS.orgName}`,
      html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a"><p>Hi ${application.contact_name || application.owner_name || 'there'},</p><p>Congratulations! <strong>${application.shop_legal_name}</strong> has been approved as a partner training site for the ${PLATFORM_DEFAULTS.orgName} Barber Apprenticeship Program.</p><p>Our team will be in touch shortly with next steps, including your MOU finalization and apprentice placement details.</p><p>Questions? Call us at ${PLATFORM_DEFAULTS.supportPhone} or visit <a href="${siteUrl}">${siteUrl}</a>.</p><p>— ${PLATFORM_DEFAULTS.orgName}</p></div>`,
    });
  } catch (emailErr) {
    logger.warn('Approval notification email failed (non-fatal)', { id, error: String(emailErr) });
  }

  await logAdminAudit({
    action: AdminAction.APPLICATION_APPROVED,
    actorId: user.id,
    entityType: 'barbershop_partner_applications',
    entityId: id,
    metadata: { shop_name: application.shop_legal_name, contact_email: application.contact_email },
    req: request,
  }).catch((e) => logger.warn('[barber-approve] Audit log failed', e));

  return NextResponse.json({ success: true, status: 'approved', shopId: provisionedShopId });
}
