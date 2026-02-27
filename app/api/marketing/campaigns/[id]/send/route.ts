export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Using Node.js runtime for email compatibility
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
// import { resend } from '@/lib/resend'; // your Resend client - add later

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

  const { id } = await params;
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // 1) Load campaign
    const { data: campaign, error: cErr } = await db
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (cErr || !campaign) throw cErr || new Error('Campaign not found');

    // 2) Build audience (simple version: all active contacts not unsubscribed)
    // Later: apply target_segment filters
    const { data: contacts, error: contactsErr } = await db
      .from('marketing_contacts')
      .select('*')
      .eq('unsubscribed', false);
    if (contactsErr) throw contactsErr;

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts to send to' },
        { status: 400 }
      );
    }

    // 3) Create send records
    const sendRows = contacts.map((c) => ({
      campaign_id: campaign.id,
      contact_id: c.id,
      email: c.email,
      status: 'queued',
    }));

    const { error: sendsErr } = await db
      .from('marketing_campaign_sends')
      .insert(sendRows);
    if (sendsErr) throw sendsErr;

    // 4) Mark campaign as sending
    // Later: call Resend in a background job / cron
    await db
      .from('marketing_campaigns')
      .update({
        status: 'sending',
        scheduled_at: campaign.scheduled_at ?? new Date().toISOString(),
      })
      .eq('id', campaign.id);

    // 5) Update stats
    await db
      .from('marketing_campaigns')
      .update({
        stats: {
          sent: sendRows.length,
          opened: 0,
          clicked: 0,
          bounced: 0,
        },
      })
      .eq('id', campaign.id);

    return NextResponse.json({
      message: `Queued ${sendRows.length} recipients for campaign`,
      count: sendRows.length,
    });
  } catch (err: any) {
    logger.error(
      'POST /marketing/campaigns/[id]/send error',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Failed to queue campaign' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/marketing/campaigns/[id]/send', _POST);
