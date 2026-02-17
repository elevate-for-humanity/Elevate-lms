export const runtime = 'nodejs';
export const maxDuration = 60;
// AUTH: Intentionally public — no authentication required

// app/api/lti/config/route.ts
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const toolUrl = process.env.LTI_TOOL_URL || 'https://www.elevateforhumanity.org';

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
              label: 'Elevate for Humanity',
            },
          ],
        },
      },
    ],
  };

  return NextResponse.json(config);
}
