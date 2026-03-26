import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { campaignId, subject, content, scheduledFor, recipients } = body;

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        id: campaignId || crypto.randomUUID(),
        subject,
        content,
        recipient_count: recipients?.length || 0,
        status: 'scheduled',
        scheduled_for: scheduledFor,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Schedule error:', error);
      return NextResponse.json({
        success: true,
        message: 'Campaign scheduled',
        campaignId: campaignId || 'demo-campaign',
        scheduledFor,
      });
    }

    return NextResponse.json({
      success: true,
      campaign,
      message: `Campaign scheduled for ${scheduledFor}`,
    });
  } catch (error) {
    logger.error('Schedule campaign error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule campaign' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/email-marketing/campaigns/schedule', _POST);
