// PUBLIC ROUTE: LTI tool configuration — public per LTI spec
// AUTH: Intentionally public — no authentication required

// app/api/lti/config/route.ts
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const toolUrl = process.env.LTI_TOOL_URL || PLATFORM_DEFAULTS.siteUrl;

  const config = {
    title: 'Elevate for Humanity LMS',
    description: 'Workforce & apprenticeship training LMS by Elevate for Humanity',
    jwks_uri: `${toolUrl}/api/lti/jwks`,
    initiate_login_uri: `${toolUrl}/api/lti/login`,
    redirect_uris: [`${toolUrl}/api/lti/launch`],
    scopes: ['openid', 'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly'],
    extensions: [
      {
        platform: 'canvas.instructure.com',
        settings: {
          placements: [
            {
              placement: 'course_navigation',
              message_type: 'LtiResourceLinkRequest',
              target_link_uri: `${toolUrl}/api/lti/launch`,
              label: PLATFORM_DEFAULTS.orgName,
            },
          ],
        },
      },
    ],
  };

  return NextResponse.json(config);
}
export const GET = withApiAudit('/api/lti/config', _GET);
