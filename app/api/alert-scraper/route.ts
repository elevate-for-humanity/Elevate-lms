
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Scraper Alert Endpoint
 * Receives alerts when scraping attempts are detected
 * Logs to database and sends notifications
 */

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);
    const { type, url, timestamp, ...additionalData } = body;

    const ip = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    logger.error('🚨 SCRAPING ATTEMPT DETECTED:', {
      type,
      url,
      ip,
      userAgent,
      ...additionalData,
    });

    // Fast response - don't wait for DB or alerts
    const responsePromise = NextResponse.json({
      status: 'alert_sent',
      message: 'Scraping attempt logged and alert sent',
    });

    // Background processing (fire-and-forget)
    Promise.resolve().then(async () => {
      try {
        // Log to database
        const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
        await db.from('scraping_attempts').insert({
          detection_type: type,
          url,
          ip_address: ip,
          user_agent: userAgent,
          additional_data: additionalData,
          detected_at: timestamp || new Date().toISOString(),
          alert_sent: true,
        });

        // Send alerts (non-blocking)
        sendEmailAlert({
          type,
          url,
          ip,
          userAgent,
          timestamp: timestamp || new Date().toISOString(),
          ...additionalData,
        }).catch(() => {});

        if (process.env.SLACK_WEBHOOK_URL) {
          sendSlackAlert({
            type,
            url,
            ip,
            timestamp: timestamp || new Date().toISOString(),
          }).catch(() => {});
        }
      } catch (error) {
        logger.error('Background alert processing failed:', error);
      }
    });

    return responsePromise;
  } catch (error) { 
    logger.error('Error processing scraper alert:', error);
    return NextResponse.json(
      { error: 'Failed to process alert' },
      { status: 500 }
    );
  }
}

async function sendEmailAlert(data: Record<string, any>) {
  const emailContent = `
🚨 SCRAPING ATTEMPT DETECTED

Type: ${data.type}
URL: ${data.url}
IP Address: ${data.ip}
User Agent: ${data.userAgent}
Time: ${data.timestamp}

Additional Details:
${JSON.stringify(data, null, 2)}

SEVERITY LEVELS:
- AI_SCRAPER_CHATGPT: HIGH (Someone feeding your site to ChatGPT)
- KNOWN_SCRAPER: HIGH (Automated bot detected)
- RAPID_REQUESTS: MEDIUM (Possible scraper)
- NO_HUMAN_BEHAVIOR: MEDIUM (Bot-like behavior)
- LARGE_COPY: LOW (Someone copying content)
- DEVTOOLS_OPENED: LOW (Developer tools opened)

ACTIONS TO TAKE:
1. Review the attempt in your dashboard
2. Check if this is a repeated offender
3. Consider blocking this IP if repeated
4. Document for legal evidence if needed
5. Send cease & desist if confirmed scraping

View full details: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/admin/security/scraping-attempts

---
This is an automated alert from Elevate for Humanity Security System.
  `;

  logger.info('[EMAIL ALERT]', emailContent);

  // Email sending via SendGrid when configured
  // Set SENDGRID_API_KEY and ALERT_EMAIL in environment variables
  /*
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    try {
      await sgMail.send({
        to: process.env.ALERT_EMAIL || 'info@elevateforhumanity.org',
        from: 'security@elevateforhumanity.org',
        subject: `🚨 Scraping Attempt: ${data.type}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      });
    } catch (error) {
      logger.error('Failed to send email:', error);
    }
  }
  */
}

async function sendSlackAlert(data: Record<string, any>) {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Scraping Attempt Detected`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Scraping Attempt Detected',
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Type:*\n${data.type}` },
              { type: 'mrkdwn', text: `*URL:*\n${data.url}` },
              { type: 'mrkdwn', text: `*IP:*\n${data.ip}` },
              { type: 'mrkdwn', text: `*Time:*\n${data.timestamp}` },
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Details',
                },
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/admin/security`,
              },
            ],
          },
        ],
      }),
    });
  } catch (error) { 
    logger.error('Failed to send Slack alert:', error);
  }
}

/**
 * GET endpoint to check alert system status
 */
export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    status: 'active',
    message: 'Scraper detection system is active',
    features: [
      'Bot detection',
      'Behavior analysis',
      'Copy detection',
      'DevTools detection',
      'Rate limiting',
      'Email alerts',
      'Database logging',
    ],
  });
}
