export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const STUCK_THRESHOLD_HOURS = 24;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'elevate4humanityedu@gmail.com';

/**
 * Cron endpoint to detect partners stuck in approved_pending_user state.
 * 
 * This catches cases where:
 * - Auth user creation failed
 * - Admin didn't complete the approval flow
 * - Network issues interrupted Phase 2
 * 
 * Should be called every 6-12 hours by a scheduled function.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  try {
    // Find partners stuck in approved_pending_user for > threshold
    const thresholdTime = new Date(Date.now() - STUCK_THRESHOLD_HOURS * 60 * 60 * 1000);

    const { data: stuckPartners, error } = await supabase
      .from('partner_applications')
      .select(`
        id,
        shop_name,
        owner_name,
        contact_email,
        partner_id,
        reviewed_at,
        partners!partner_applications_partner_id_fkey (
          id,
          name,
          account_status
        )
      `)
      .eq('approval_status', 'approved_pending_user')
      .lt('reviewed_at', thresholdTime.toISOString());

    if (error) {
      logger.error('[Stuck Approvals] Query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    if (!stuckPartners || stuckPartners.length === 0) {
      return NextResponse.json({
        success: true,
        stuck_count: 0,
        message: 'No stuck approvals found',
      });
    }

    // Log and alert
    logger.warn('[Stuck Approvals] Found partners stuck in approved_pending_user', {
      count: stuckPartners.length,
      partners: stuckPartners.map(p => ({
        id: p.id,
        shop_name: p.shop_name,
        email: p.contact_email,
        reviewed_at: p.reviewed_at,
      })),
    });

    // Queue admin notification
    const partnerList = stuckPartners.map(p => 
      `- ${p.shop_name} (${p.contact_email}) - approved ${new Date(p.reviewed_at).toLocaleDateString()}`
    ).join('\n');

    await supabase.from('notification_outbox').insert({
      to_email: ADMIN_EMAIL,
      template_key: 'admin_alert',
      template_data: {
        alert_type: 'Stuck Partner Approvals',
        message: `${stuckPartners.length} partner(s) have been stuck in "approved_pending_user" state for over ${STUCK_THRESHOLD_HOURS} hours. These require manual intervention to complete the auth user linking.`,
        details: partnerList,
        action_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/admin/partners?status=pending_user`,
        action_label: 'Review Stuck Approvals',
      },
      status: 'queued',
      scheduled_for: new Date().toISOString(),
    });

    // Also create in-app notification for admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'super_admin']);

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'alert',
        title: 'Stuck Partner Approvals',
        message: `${stuckPartners.length} partner(s) need attention - stuck in approval process`,
        action_url: '/admin/partners?status=pending_user',
        action_label: 'Review',
        metadata: {
          alert_type: 'stuck_approvals',
          count: stuckPartners.length,
        },
        read: false,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({
      success: true,
      stuck_count: stuckPartners.length,
      partners: stuckPartners.map(p => ({
        id: p.id,
        shop_name: p.shop_name,
        email: p.contact_email,
      })),
      alert_sent: true,
    });

  } catch (error) {
    logger.error('[Stuck Approvals] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET endpoint to check status without triggering alerts
 */
export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const { data: stuckCount } = await supabase
    .from('partner_applications')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'approved_pending_user');

  return NextResponse.json({
    stuck_count: stuckCount || 0,
    threshold_hours: STUCK_THRESHOLD_HOURS,
  });
}
