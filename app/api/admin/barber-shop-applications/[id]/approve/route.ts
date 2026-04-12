import { logger } from '@/lib/logger';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/barber-shop-applications/[id]/approve
 *
 * Approves a barbershop partner application by updating
 * barbershop_partner_applications.status = 'approved'.
 * Sends a notification email to the applicant.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const { id } = await params;

  // Verify admin session
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch the application
  const { data: application, error: fetchError } = await supabase
    .from('barbershop_partner_applications')
    .select('id, status, contact_email, contact_name, owner_name, shop_legal_name')
    .eq('id', id)
    .single();

  if (fetchError || !application) {
    logger.error('barbershop application fetch error', undefined, { id, detail: fetchError?.message });
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  if (application.status === 'approved') {
    return NextResponse.json({ success: true, status: 'approved', message: 'Already approved' });
  }

  // Update status
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

  // =========================================================================
  // PROVISION SHOP + SUPERVISOR ROWS
  // Creates the canonical identity records used by OJT enforcement and
  // supervisor verification. Must happen at approval — not at application time,
  // because user_id is not known until the supervisor claims their account.
  //
  // shops row: the physical training site
  // shop_supervisors row: the licensed barber who will verify apprentice reps
  //   user_id is null until the supervisor completes account claim via the
  //   onboarding email link. The verify-rep route falls back to email matching
  //   until user_id is populated.
  // =========================================================================
  let provisionedShopId: string | null = null;

  try {
    // Upsert shop — idempotent on re-approval
    const { data: shopRow, error: shopErr } = await supabase
      .from('shops')
      .upsert(
        {
          name:    application.shop_legal_name,
          address1: application.shop_address_line1 ?? application.shop_physical_address ?? null,
          city:    application.shop_city ?? null,
          state:   application.shop_state ?? null,
          zip:     application.shop_zip ?? null,
          email:   application.contact_email,
          active:  true,
        },
        { onConflict: 'name,city,state' }  // prevent duplicate shops on re-approval
      )
      .select('id')
      .single();

    if (shopErr) {
      logger.warn('[barber-approve] shops upsert failed (non-fatal)', { id, detail: shopErr.message });
    } else {
      provisionedShopId = shopRow.id;

      // Upsert shop_supervisors row.
      // user_id is null — populated when supervisor claims account via email link.
      // name + email are the durable identity anchors until then.
      const { error: supervisorErr } = await supabase
        .from('shop_supervisors')
        .upsert(
          {
            shop_id:        provisionedShopId,
            user_id:        null,           // claimed post-approval via onboarding link
            name:           application.supervisor_name ?? application.contact_name ?? application.owner_name,
            email:          application.contact_email,
            phone:          application.contact_phone ?? null,
            license_number: application.supervisor_license_number ?? null,
            license_type:   'barber',
            is_active:      true,
          },
          { onConflict: 'shop_id,email' }
        );

      if (supervisorErr) {
        logger.warn('[barber-approve] shop_supervisors upsert failed (non-fatal)', { id, detail: supervisorErr.message });
      } else {
        logger.info('[barber-approve] shop + supervisor provisioned', {
          applicationId: id,
          shopId: provisionedShopId,
          supervisorEmail: application.contact_email,
        });
      }
    }
  } catch (provisionErr) {
    // Non-fatal — approval is recorded. Admin can manually provision if needed.
    logger.warn('[barber-approve] Provisioning failed (non-fatal)', { id, error: String(provisionErr) });
  }

  // Send approval notification email (non-blocking)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    await sendEmail({
      to: application.contact_email,
      subject: `Your Barbershop Partner Application Has Been Approved — Elevate for Humanity`,
      html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
<p>Hi ${application.contact_name || application.owner_name || 'there'},</p>

<p>Congratulations! <strong>${application.shop_legal_name}</strong> has been approved as a partner training site for the Elevate for Humanity Barber Apprenticeship Program.</p>

<p>Our team will be in touch shortly with next steps, including your MOU finalization and apprentice placement details.</p>

<p>Questions? Call us at (317) 314-3757 or visit <a href="${siteUrl}">${siteUrl}</a>.</p>

<p>— Elevate for Humanity</p>
</div>
      `,
    });
  } catch (emailErr) {
    // Non-fatal — approval is recorded, email can be sent manually
    logger.warn('Approval notification email failed (non-fatal)', { id, error: String(emailErr) });
  }

  logger.info('Barbershop application approved', { id, approvedBy: user.id });

  await logAdminAudit({
    action: AdminAction.APPLICATION_APPROVED,
    actorId: user.id,
    entityType: 'barbershop_partner_applications',
    entityId: id,
    metadata: { shop_name: application.shop_legal_name, contact_email: application.contact_email },
    req: request,
  }).catch(e => logger.warn('[barber-approve] Audit log failed', e));

  return NextResponse.json({ success: true, status: 'approved' });
}
