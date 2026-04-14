// PUBLIC ROUTE: anonymous usage tracking
import { safeInternalError } from '@/lib/api/safe-error';

import { getAdminClient } from '@/lib/supabase/admin';

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

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
    // Primary domain
    'www.elevateforhumanity.org',
    'elevateforhumanity.org',
    // Second owned domain
    'www.elevateforhumanityeducation.com',
    'elevateforhumanityeducation.com',
    // Hosting / dev
    'elevate317.netlify.app',
    '.netlify.app',          // Netlify deploy previews
    '.gitpod.dev',           // Gitpod dev environments
    'localhost',
  ];
};

async function _POST(request: NextRequest) {
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
      logger.error('[DMCA] Unauthorized site copy detected:', domain, url);

      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

      // Run all three in parallel: alert owner, log evidence, send DMCA takedown
      await Promise.allSettled([
        sendAlertEmail({ domain, url, referrer, userAgent, timestamp }),
        logUnauthorizedAccess({ domain, url, referrer, userAgent, timestamp, ip }),
        sendDMCATakedown({ domain, url, timestamp }),
      ]);

      return NextResponse.json(
        {
          status: 'unauthorized',
          message:
            'This appears to be an unauthorized copy of Elevate for Humanity',
          action: 'Legal team has been notified. DMCA takedown initiated.',
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
  const { sendEmail } = await import('@/lib/email/sendgrid');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 20px; text-align: center; border-bottom: 2px solid #e5e7eb;">
        <h1 style="margin: 0;">Unauthorized Site Copy Detected</h1>
      </div>
      <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb;">
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
    const db = await getAdminClient();
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
 * Resolve hosting provider abuse contacts and send a formal DMCA takedown notice.
 * Uses common abuse email patterns and known provider mappings.
 */
async function sendDMCATakedown(data: {
  domain: string;
  url: string;
  timestamp: string;
}) {
  const { sendEmail } = await import('@/lib/email/sendgrid');

  // Check if we already sent a takedown for this domain in the last 24h (avoid spam)
  try {
    const db = await getAdminClient();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await db
      .from('unauthorized_access_log')
      .select('id')
      .eq('domain', data.domain)
      .eq('cease_desist_sent', true)
      .gte('logged_at', oneDayAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      logger.info('[DMCA] Takedown already sent for', data.domain, 'in last 24h — skipping');
      return;
    }
  } catch {
    // Continue even if dedup check fails
  }

  // Known hosting provider abuse emails by domain pattern
  const abuseContacts: Record<string, string> = {
    'vercel.app': 'dmca@vercel.com',
    'vercel.com': 'dmca@vercel.com',
    'netlify.app': 'abuse@netlify.com',
    'netlify.com': 'abuse@netlify.com',
    'github.io': 'dmca@github.com',
    'pages.dev': 'abuse@cloudflare.com',
    'cloudflare.com': 'abuse@cloudflare.com',
    'herokuapp.com': 'abuse@heroku.com',
    'render.com': 'abuse@render.com',
    'onrender.com': 'abuse@render.com',
    'railway.app': 'abuse@railway.app',
    'fly.dev': 'abuse@fly.io',
    'azurewebsites.net': 'abuse@microsoft.com',
    'web.app': 'abuse@google.com',
    'firebaseapp.com': 'abuse@google.com',
    'amplifyapp.com': 'abuse@amazonaws.com',
    'godaddysites.com': 'abuse@godaddy.com',
    'wixsite.com': 'abuse@wix.com',
    'squarespace.com': 'abuse@squarespace.com',
    'shopify.com': 'abuse@shopify.com',
    'myshopify.com': 'abuse@shopify.com',
    'hostinger.com': 'abuse@hostinger.com',
    'bluehost.com': 'abuse@bluehost.com',
    'siteground.com': 'abuse@siteground.com',
    'namecheap.com': 'abuse@namecheap.com',
  };

  // Find matching abuse contact
  let abuseEmail: string | null = null;
  for (const [pattern, email] of Object.entries(abuseContacts)) {
    if (data.domain.endsWith(pattern)) {
      abuseEmail = email;
      break;
    }
  }

  // Formal DMCA takedown notice (17 U.S.C. § 512(c))
  const dmcaNotice = `
DMCA TAKEDOWN NOTICE PURSUANT TO 17 U.S.C. § 512(c)

Date: ${new Date().toISOString().split('T')[0]}

To Whom It May Concern:

I am writing to report an instance of copyright infringement on a website hosted by your service.

COPYRIGHTED WORK:
The website located at https://www.elevateforhumanity.org, including all text, images, code, course content, and design elements, is the copyrighted property of Elevate for Humanity Career & Technical Institute.

INFRINGING MATERIAL:
An unauthorized copy of our website has been detected at:
- Domain: ${data.domain}
- URL: ${data.url}
- First detected: ${data.timestamp}

This material was copied without authorization and infringes on our copyright.

REQUESTED ACTION:
I request that you immediately remove or disable access to the infringing material described above.

GOOD FAITH STATEMENT:
I have a good faith belief that the use of the copyrighted material described above is not authorized by the copyright owner, its agent, or the law.

ACCURACY STATEMENT:
The information in this notification is accurate, and under penalty of perjury, I am authorized to act on behalf of the copyright owner.

CONTACT INFORMATION:
Elevate for Humanity Career & Technical Institute
8888 Keystone Crossing Suite 1300
Indianapolis, IN 46240
Email: elevate4humanityedu@gmail.com
Phone: (317) 314-3757
Website: https://www.elevateforhumanity.org

This notice is sent pursuant to the Digital Millennium Copyright Act (17 U.S.C. § 512(c)).

Sincerely,
Elevate for Humanity Career & Technical Institute
  `.trim();

  const dmcaHtml = `
    <div style="font-family: 'Courier New', monospace; max-width: 700px; margin: 0 auto; padding: 24px; border: 2px solid #991b1b; background: #fff;">
      <div style="text-align: center; padding: 16px; border-bottom: 2px solid #e5e7eb; color: #1e293b; margin: -24px -24px 24px -24px;">
        <h1 style="margin: 0; font-size: 18px;">DMCA TAKEDOWN NOTICE</h1>
        <p style="margin: 4px 0 0; font-size: 12px;">Pursuant to 17 U.S.C. § 512(c)</p>
      </div>
      <pre style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${dmcaNotice}</pre>
    </div>
  `;

  // Send to hosting provider if we found their abuse contact
  if (abuseEmail) {
    const providerResult = await sendEmail({
      to: abuseEmail,
      subject: `DMCA Takedown Notice — Unauthorized copy of elevateforhumanity.org on ${data.domain}`,
      html: dmcaHtml,
      text: dmcaNotice,
    });

    if (providerResult.success) {
      logger.info('[DMCA] Takedown notice sent to hosting provider:', abuseEmail);
    } else {
      logger.error('[DMCA] Failed to send to provider:', abuseEmail, providerResult.error);
    }
  } else {
    logger.info('[DMCA] No known abuse contact for domain:', data.domain);
  }

  // Always send a copy to yourself with the DMCA notice + who to contact
  await sendEmail({
    to: 'elevate4humanityedu@gmail.com',
    subject: `DMCA Takedown ${abuseEmail ? 'SENT' : 'MANUAL ACTION NEEDED'}: ${data.domain}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${abuseEmail ? '#059669' : '#d97706'}; color: white; padding: 16px; text-align: center;">
          <h2 style="margin: 0;">${abuseEmail ? 'Automatic DMCA Takedown Sent' : 'Manual DMCA Takedown Required'}</h2>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <p><strong>Clone domain:</strong> <a href="http://${data.domain}">${data.domain}</a></p>
          <p><strong>Clone URL:</strong> <a href="${data.url}">${data.url}</a></p>
          <p><strong>Detected:</strong> ${data.timestamp}</p>
          ${abuseEmail
            ? `<p><strong>Takedown sent to:</strong> ${abuseEmail}</p>
               <p style="color: #059669;">The hosting provider has been notified. Most providers respond within 24-72 hours.</p>`
            : `<p style="color: #d97706;"><strong>Could not identify hosting provider.</strong> You need to:</p>
               <ol>
                 <li>Look up the domain's hosting provider at <a href="https://who.is/whois/${data.domain}">who.is</a></li>
                 <li>Find their abuse/DMCA contact</li>
                 <li>Forward the DMCA notice below to them</li>
               </ol>`
          }
          <hr style="margin: 20px 0;" />
          <details>
            <summary style="cursor: pointer; font-weight: bold;">View DMCA Notice Text</summary>
            <pre style="white-space: pre-wrap; font-size: 12px; background: white; padding: 16px; border: 1px solid #ddd; margin-top: 8px;">${dmcaNotice}</pre>
          </details>
        </div>
      </div>
    `,
  });

  // Mark in database that takedown was sent
  try {
    const db = await getAdminClient();
    await db
      .from('unauthorized_access_log')
      .update({ cease_desist_sent: true, cease_desist_date: new Date().toISOString() })
      .eq('domain', data.domain)
      .eq('cease_desist_sent', false);
  } catch {
    // Non-fatal
  }
}

/**
 * GET endpoint to check tracking status
 */
async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  // Only allow from authorized domains
  const origin = request.headers.get('origin') || '';
  const officialDomains = getOfficialDomains();
  const isAuthorized = officialDomains.some((d) => origin.includes(d));

  if (!isAuthorized && origin !== '') {
    return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
  }

  return NextResponse.json({
    status: 'active',
    message: 'DMCA tracking is active',
    official_domains: officialDomains,
  });
}
export const GET = withApiAudit('/api/track-usage', _GET);
export const POST = withApiAudit('/api/track-usage', _POST);
