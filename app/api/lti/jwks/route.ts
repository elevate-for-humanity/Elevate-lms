export const runtime = 'nodejs';
export const maxDuration = 60;
// AUTH: Intentionally public — no authentication required

// app/api/lti/jwks/route.ts
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
// Replace with actual generated key material
  const jwks = {
    keys: [
      {
        kty: 'RSA',
        use: 'sig',
        kid: 'efh-lti-key-1',
        alg: 'RS256',
        n: process.env.LTI_PUBLIC_KEY_N,
        e: 'AQAB',
      },
    ],
  };

  return NextResponse.json(jwks);
}
export const GET = withApiAudit('/api/lti/jwks', _GET);
