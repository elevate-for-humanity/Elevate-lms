// PUBLIC ROUTE: Partner site integration wizard — generates embed scripts for external sites.
// Saves the integration request as a partner application for follow-up.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://elevateforhumanity.org';

function generateEmbedScript(siteId: string, apiKey: string, features: string[]): string {
  return `<!-- ${PLATFORM_DEFAULTS.orgName} LMS Integration -->
<script>
  window.ElevateConfig = {
    siteId: "${siteId}",
    apiKey: "${apiKey}",
    features: ${JSON.stringify(features)},
    baseUrl: "${SITE_URL}"
  };
</script>
<script src="${SITE_URL}/embed/elevate-lms.js" async defer></script>`;
}

function generateSetupSteps(platform: string): string[] {
  const base = [
    'Copy the embed script above',
    'Paste it before the closing </body> tag on your site',
    'Add a container element where you want the LMS to appear: <div id="elevate-lms"></div>',
    'Save and publish your changes',
    'Contact us at ${PLATFORM_DEFAULTS.supportPhone} to activate your integration',
  ];

  const platformSteps: Record<string, string[]> = {
    wordpress: [
      'In WordPress, go to Appearance → Theme Editor → footer.php',
      'Paste the script before </body>',
      'Add the shortcode [elevate_lms] where you want the widget',
      'Install the Elevate LMS WordPress plugin (contact us for access)',
      'Contact us at ${PLATFORM_DEFAULTS.supportPhone} to activate',
    ],
    wix: [
      'In Wix Editor, click Add → Embed → Custom Code',
      'Paste the script and set placement to "Body - end"',
      'Add an HTML iframe element where you want the LMS',
      'Publish your site',
      'Contact us at ' + PLATFORM_DEFAULTS.supportPhone + ' to activate',
    ],
    squarespace: [
      'In Squarespace, go to Settings → Advanced → Code Injection',
      'Paste the script in the Footer section',
      'Add a Code Block where you want the LMS to appear',
      'Save and publish',
      'Contact us at ' + PLATFORM_DEFAULTS.supportPhone + ' to activate',
    ],
    shopify: [
      'In Shopify Admin, go to Online Store → Themes → Edit Code',
      'Open theme.liquid and paste before </body>',
      'Add a custom section for the LMS widget',
      'Save the theme',
      'Contact us at ' + PLATFORM_DEFAULTS.supportPhone + ' to activate',
    ],
  };

  return platformSteps[platform?.toLowerCase()] || base;
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body?.url || !body?.platform) {
    return safeError('url and platform are required', 400);
  }

  const { url, platform, features = ['courses', 'enrollment', 'dashboard'] } = body;

  // Generate integration credentials
  const siteId = `site_${randomBytes(8).toString('hex')}`;
  const apiKey = `ek_${randomBytes(16).toString('hex')}`;

  const embedScript = generateEmbedScript(siteId, apiKey, features);
  const setupSteps = generateSetupSteps(platform);
  const shopName = (() => {
    try {
      return `Integration Request: ${new URL(url).hostname}`;
    } catch {
      return 'Integration Request';
    }
  })();

  // Save integration request as a partner application for follow-up.
  // Keep non-student integration leads out of the student applications queue.
  try {
    const db = await requireAdminClient();
    if (db) {
      await db.from('partner_applications').insert({
        shop_name: shopName,
        owner_name: 'Integration Request',
        contact_email: `integration+${siteId}@pending.${PLATFORM_DEFAULTS.canonicalDomain}`,
        phone: 'N/A',
        address_line1: 'Not provided',
        city: 'Not provided',
        state: 'IN',
        zip: '00000',
        programs_requested: ['lms-integration'],
        agreed_to_terms: true,
        status: 'pending',
        intake: {
          platform,
          url,
          features,
          site_id: siteId,
          api_key: apiKey,
        },
      });
    }
  } catch (err) {
    // Non-fatal — log but still return the integration to the user
    logger.warn('[build-remote] Failed to save integration request', err);
  }

  const integration = {
    siteId,
    apiKey,
    platform,
    embedScript,
    setupSteps,
    platformSpecific: {
      containerHtml: `<div id="elevate-lms" data-site="${siteId}"></div>`,
      widgetUrl: `${SITE_URL}/embed/widget?site=${siteId}`,
    },
    components: features.map((f) => ({
      name: f.charAt(0).toUpperCase() + f.slice(1),
      embedCode: `<div class="elevate-${f}" data-site="${siteId}"></div>`,
      description: `Embed the ${f} module on any page`,
    })),
  };

  return NextResponse.json({ success: true, integration });
}
