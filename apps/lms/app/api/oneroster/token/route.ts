import { NextRequest, NextResponse } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { issueOneRosterToken, isOneRosterEnabled, validateOneRosterClient } from '@/lib/integrations/oneroster/auth';
import { oneRosterUnavailable } from '@/lib/integrations/oneroster/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;
  if (!isOneRosterEnabled()) return oneRosterUnavailable();

  const form = await request.formData();
  let clientId = String(form.get('client_id') ?? '');
  let clientSecret = String(form.get('client_secret') ?? '');
  const basic = request.headers.get('authorization');

  if (basic?.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(basic.slice(6), 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator >= 0) {
        clientId = decoded.slice(0, separator);
        clientSecret = decoded.slice(separator + 1);
      }
    } catch {
      // Invalid Basic credentials fall through to the same generic response.
    }
  }

  if (form.get('grant_type') !== 'client_credentials' || !validateOneRosterClient(clientId, clientSecret)) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  return NextResponse.json({
    access_token: await issueOneRosterToken(clientId),
    token_type: 'Bearer',
    expires_in: 300,
    scope: 'oneroster.read',
  });
}

