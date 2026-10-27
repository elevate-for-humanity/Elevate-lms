import { NextRequest, NextResponse } from 'next/server';

import { authorizeOneRoster, isOneRosterEnabled } from '@/lib/integrations/oneroster/auth';
import { oneRosterUnauthorized, oneRosterUnavailable } from '@/lib/integrations/oneroster/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isOneRosterEnabled()) return oneRosterUnavailable();
  if (!(await authorizeOneRoster(request))) return oneRosterUnauthorized();

  return NextResponse.json({
    orgs: [
      {
        sourcedId: process.env.ONEROSTER_ORG_SOURCED_ID || 'elevate-for-humanity',
        status: 'active',
        dateLastModified: process.env.ONEROSTER_ORG_UPDATED_AT || '2026-01-01T00:00:00.000Z',
        name: process.env.ONEROSTER_ORG_NAME || 'Elevate for Humanity',
        type: 'school',
        identifier: process.env.ONEROSTER_ORG_IDENTIFIER || 'elevate-for-humanity',
        children: [],
      },
    ],
  });
}

