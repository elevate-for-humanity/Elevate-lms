import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Email Scheduler - Processes scheduled campaigns
 * Run this endpoint via cron job every 5 minutes
 * Example cron: every 5 minutes - curl https://yoursite.com/api/email/scheduler
 */
export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get scheduled campaigns that are due
    const now = new Date().toISOString();
    const { data: campaigns, error } = await db
      .from('email_campaigns')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (error) throw error;

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No campaigns due for sending',
        processed: 0,
      });
    }

    const results = [];

    for (const campaign of campaigns) {
      try {
        // Mark as sending
        await db
          .from('email_campaigns')
          .update({ status: 'sending' })
          .eq('id', campaign.id);

        // Send campaign
        const sendResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/campaigns/send`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: campaign.id,
              name: campaign.name,
              subject: campaign.subject,
              fromName: campaign.from_name,
              fromEmail: campaign.from_email,
              replyTo: campaign.reply_to,
              customHtml: campaign.html_content,
              recipientList: campaign.recipient_list,
            }),
          }
        );

        const sendResult = await sendResponse.json();

        if (sendResult.success) {
          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            success: true,
            sent: sendResult.summary.sent,
            failed: sendResult.summary.failed,
          });
        } else {
          // Mark as failed
          await db
            .from('email_campaigns')
            .update({
              status: 'failed',
              error_message: sendResult.error,
            })
            .eq('id', campaign.id);

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            success: false,
            error: sendResult.error,
          });
        }
      } catch (error) { 
        logger.error(
          `Error processing campaign ${campaign.id}:`,
          error instanceof Error ? error : new Error(String(error))
        );

        // Mark as failed
        await db
          .from('email_campaigns')
          .update({
            status: 'failed',
            error_message: toErrorMessage(error),
          })
          .eq('id', campaign.id);

        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          success: false,
          error: toErrorMessage(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${campaigns.length} scheduled campaigns`,
      processed: campaigns.length,
      results,
    });
  } catch (error) { 
    logger.error(
      'Scheduler error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger for testing
 */
export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

  return GET(req);
}
