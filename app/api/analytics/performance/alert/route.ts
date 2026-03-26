
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const data = await parseBody<Record<string, any>>(request);
    const supabase = await createClient();

    // Store performance alert for analysis
    const { error } = await supabase.from('performance_alerts').insert({
      type: data.type,
      value: data.value,
      message: data.message,
      url: data.url,
      user_agent: request.headers.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Error storing performance alert:', error);
    }

    // Send Slack alert if configured
    if (process.env.SLACK_WEBHOOK_URL && data.value > 10 * 1024 * 1024) {
      // 10MB+
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `⚠️ Performance Alert: ${data.message}`,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '⚠️ Performance Alert',
                },
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Type:*\n${data.type}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Value:*\n${(data.value / 1024 / 1024).toFixed(2)} MB`,
                  },
                ],
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*URL:*\n${data.url}`,
                },
              },
            ],
          }),
        });
      } catch (slackError) {
        logger.error('Slack notification error:', slackError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error(
      'Performance alert API error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        success: false,
        error: toErrorMessage(error) || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/analytics/performance/alert', _POST);
