
import { createAdminClient } from '@/lib/supabase/admin';
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
  } catch (error) { 
    logger.error('Tracking error:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}

/**
 * Send alert email when unauthorized copy is detected.
 * Uses Resend via the shared sendEmail helper.
 */
async function sendAlertEmail(data: {
  domain: string;
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
}) {
  const { sendEmail } = await import('@/lib/email/resend');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Unauthorized Site Copy Detected</h1>
      </div>
      <div style="padding: 24px; background: #fef2f2; border: 1px solid #fecaca;">
        <p style="font-size: 16px; font-weight: bold; color: #991b1b;">Someone has copied your website and is hosting it at:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">Domain</td><td style="padding: 8px; border: 1px solid #ddd;"><a href="http://${data.domain}">${data.domain}</a></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Full URL</td><td style="padding: 8px; border: 1px solid #ddd; word-break: break-all;"><a href="${data.url}">${data.url}</a></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Referrer</td><td style="padding: 8px; border: 1px solid #ddd;">${data.referrer || 'Direct / None'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">User Agent</td><td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${data.userAgent || 'Unknown'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Detected At</td><td style="padding: 8px; border: 1px solid #ddd;">${data.timestamp || new Date().toISOString()}</td></tr>
        </table>
        <h3 style="color: #991b1b;">Recommended Actions:</h3>
        <ol>
          <li>Visit the URL above and screenshot the unauthorized copy</li>
          <li>Save all evidence (this email is logged in your database)</li>
          <li>Send a cease and desist letter to the domain host</li>
          <li>File a DMCA takedown notice with the hosting provider</li>
        </ol>
      </div>
    </div>
  `;

  const result = await sendEmail({
    to: 'elevate4humanityedu@gmail.com',
    subject: `ALERT: Unauthorized site copy detected on ${data.domain}`,
    html,
  });

  if (result.success) {
    logger.info('[DMCA] Alert email sent for domain:', data.domain);
  } else {
    logger.error('[DMCA] Alert email failed:', result.error);
  }
}

/**
 * Log unauthorized access to database for legal evidence.
 * Writes to the unauthorized_access_log table via the admin client.
 */
async function logUnauthorizedAccess(data: {
  domain: string;
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  ip: string;
}) {
  logger.info('[EVIDENCE LOG]', {
    type: 'UNAUTHORIZED_COPY',
    ...data,
    logged_at: new Date().toISOString(),
  });

  try {
    const db = createAdminClient();
    const { error } = await db.from('unauthorized_access_log').insert({
      domain: data.domain,
      url: data.url,
      referrer: data.referrer,
      user_agent: data.userAgent,
      ip_address: data.ip,
      detected_at: data.timestamp,
      logged_at: new Date().toISOString(),
      status: 'active',
    });

    if (error) {
      logger.error('[DMCA] Failed to log to database:', error.message);
    } else {
      logger.info('[DMCA] Evidence logged to unauthorized_access_log');
    }
  } catch (err) {
    logger.error('[DMCA] Database logging error:', err);
  }
}

/**
 * GET endpoint to check tracking status
 */
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
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
