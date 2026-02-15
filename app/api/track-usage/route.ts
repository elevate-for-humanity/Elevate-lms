
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * DMCA Tracking Endpoint
 *
 * This endpoint receives tracking data from your watermarked pages.
 * If someone copies your site, this will alert you when their copy is accessed.
 *
 * How it works:
 * 1. Your site sends tracking data on every page load
 * 2. We check if the domain matches your official domain
 * 3. If it doesn't match, we know someone copied your site
 * 4. We send you an alert email/notification
 */

const getOfficialDomains = () => {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const domain = siteUrl
    .replace('https://', '')
    .replace('http://', '')
    .split('/')[0];
  return [
    domain,
    'www.elevateforhumanity.org',
    'www.www.elevateforhumanity.org',
    'localhost',
    
  ];
};

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);

    const { siteId, owner, url, referrer, timestamp, userAgent } = body;

    // Get the domain from the URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Check if this is an unauthorized copy
    const officialDomains = getOfficialDomains();
    const isUnauthorized = !officialDomains.some((officialDomain) =>
      domain.includes(officialDomain)
    );

    if (isUnauthorized) {
      // ALERT! Someone copied your site
      logger.error('🚨 UNAUTHORIZED SITE COPY DETECTED!');
      logger.error('Domain:', domain);
      logger.error('URL:', url);
      logger.error('Referrer:', referrer);
      logger.error('User Agent:', userAgent);
      logger.error('Timestamp:', timestamp);

      // Send alert email (implement this)
      await sendAlertEmail({
        domain,
        url,
        referrer,
        userAgent,
        timestamp,
      });

      // Log to database for evidence
      await logUnauthorizedAccess({
        domain,
        url,
        referrer,
        userAgent,
        timestamp,
        ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      });

      // Return response indicating unauthorized use
      return NextResponse.json(
        {
          status: 'unauthorized',
          message:
            'This appears to be an unauthorized copy of Elevate for Humanity',
          action: 'Legal team has been notified',
        },
        { status: 403 }
      );
    }

    // Authorized access - just log it
    logger.info('[Tracking] Authorized access:', domain);

    return NextResponse.json({
      status: 'ok',
      message: 'Tracking recorded',
    });
  } catch (error) { /* Error handled silently */ 
    logger.error('Tracking error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

/**
 * Send alert email when unauthorized copy is detected
 */
async function sendAlertEmail(data: {
  domain: string;
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
}) {
  // Email sending via SendGrid when configured
  // Set SENDGRID_API_KEY and ALERT_EMAIL_TO in environment variables

  const emailContent = `
    🚨 UNAUTHORIZED SITE COPY DETECTED

    Someone has copied your website and is hosting it at:
    Domain: ${data.domain}
    Full URL: ${data.url}

    Details:
    - Referrer: ${data.referrer}
    - User Agent: ${data.userAgent}
    - Timestamp: ${data.timestamp}

    IMMEDIATE ACTIONS REQUIRED:
    1. Screenshot the unauthorized site
    2. Save all evidence
    3. Send cease and desist letter
    4. File DMCA takedown notice
    5. Contact attorney

    Evidence folder: /Evidence/unauthorized-copies/${data.domain}/

    Legal contacts:
    - IP Attorney: [YOUR ATTORNEY]
    - DMCA Agent: legal@www.elevateforhumanity.org
  `;

  logger.info('[ALERT EMAIL]', emailContent);

  // Uncomment when you have email service configured:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  await sgMail.send({
    to: 'elizabeth@www.elevateforhumanity.org',
    from: 'alerts@www.elevateforhumanity.org',
    subject: '🚨 URGENT: Unauthorized Site Copy Detected',
    text: emailContent,
    html: emailContent.replace(/\n/g, '<br>')
  });
  */
}

/**
 * Log unauthorized access to database for legal evidence
 */
async function logUnauthorizedAccess(data: {
  domain: string;
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  ip: string;
}) {
  // Database logging for legal evidence
  // Logs to console and can be extended to database when needed

  logger.info('[EVIDENCE LOG]', {
    type: 'UNAUTHORIZED_COPY',
    ...data,
    logged_at: new Date().toISOString(),
  });

  // Uncomment when you have database configured:
  /*
  const { createClient } = require('@/lib/supabase/server');
  const supabase = await createClient();

  await supabase.from('unauthorized_access_log').insert({
    domain: data.domain,
    url: data.url,
    referrer: data.referrer,
    user_agent: data.userAgent,
    ip_address: data.ip,
    detected_at: data.timestamp,
    logged_at: new Date().toISOString()
  });
  */
}

/**
 * GET endpoint to check tracking status
 */
export async function GET(request: NextRequest) {
  // Only allow from authorized domains
  const origin = request.headers.get('origin') || '';
  const isAuthorized = OFFICIAL_DOMAINS.some((domain) =>
    origin.includes(domain)
  );

  if (!isAuthorized && origin !== '') {
    return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
  }

  return NextResponse.json({
    status: 'active',
    message: 'DMCA tracking is active',
    official_domains: OFFICIAL_DOMAINS,
  });
}
