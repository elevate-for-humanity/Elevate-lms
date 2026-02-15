export const runtime = 'nodejs';
export const maxDuration = 60;

// app/api/lti/jwks/route.ts
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
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
