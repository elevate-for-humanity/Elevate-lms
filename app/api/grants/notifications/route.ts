
/**
 * Grant Notifications API
 * Manage grant notifications and alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  sendGrantNotification,
  notifyDraftGenerated,
  notifyPackageReady,
  notifyGrantSubmitted,
  notifyDeadlineApproaching,
} from '@/lib/grants/notification-system';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  const supabaseAdmin = await getAdminClient();

    const body = await req.json();
    const { action, applicationId, grantId, submittedBy, confirmationNumber, daysRemaining } = body;

    switch (action) {
      case 'notify_draft':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }
        await notifyDraftGenerated(applicationId);
        return NextResponse.json({ success: true, message: 'Draft notification sent' });

      case 'notify_package':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }
        await notifyPackageReady(applicationId);
        return NextResponse.json({ success: true, message: 'Package notification sent' });

      case 'notify_submitted':
        if (!applicationId || !submittedBy) {
          return NextResponse.json(
            { error: 'applicationId and submittedBy required' },
            { status: 400 }
          );
        }
        await notifyGrantSubmitted(applicationId, submittedBy, confirmationNumber);
        return NextResponse.json({ success: true, message: 'Submission notification sent' });

      case 'notify_deadline':
        if (!grantId || daysRemaining === undefined) {
          return NextResponse.json(
            { error: 'grantId and daysRemaining required' },
            { status: 400 }
          );
        }
        await notifyDeadlineApproaching(grantId, daysRemaining);
        return NextResponse.json({ success: true, message: 'Deadline notification sent' });

      case 'check_deadlines':
        const { checkDeadlinesAndNotify } = await import('@/lib/grants/submission-tracker');
        await checkDeadlinesAndNotify();
        return NextResponse.json({ success: true, message: 'Deadline check completed' });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: notify_draft, notify_package, notify_submitted, notify_deadline, or check_deadlines',
          },
          { status: 400 }
        );
    }
  } catch (error) { 
    logger.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabaseAdmin = await getAdminClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let query = supabaseAdmin
      .from('grant_notifications')
      .select('*, grant:grant_opportunities(title), entity:entities(name)')
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query.limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ notifications });
  } catch (error) { 
    logger.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}

async function _PATCH(req: NextRequest) {
  // grants-audit: exempt — mark-read update only; no system actor applies.
  // User-initiated read-state toggle, not a grants system write.
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = await getAdminClient();
    const { error } = await supabaseAdmin
      .from('grant_notifications')
      .update({ read: read !== false })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Notification updated' });
  } catch (error) { 
    logger.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/grants/notifications', _GET);
export const POST = withApiAudit('/api/grants/notifications', _POST);
export const PATCH = withApiAudit('/api/grants/notifications', _PATCH);
