import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const supabase = createAdminClient();
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    logger.error('barbershop application approval failed', undefined, { id, detail: updateError.message });
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
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

  return NextResponse.json({ success: true, status: 'approved' });
}
