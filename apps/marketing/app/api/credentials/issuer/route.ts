import { NextResponse } from 'next/server';
import { OPEN_BADGES_CONTEXT, getOpenBadgeIssuerProfile } from '@/lib/credentials/open-badges';

export const dynamic = 'force-dynamic';

export async function GET() {
  const issuer = getOpenBadgeIssuerProfile();

  return NextResponse.json(
    {
      '@context': [OPEN_BADGES_CONTEXT],
      ...issuer,
    },
    {
      headers: {
        'Content-Type': 'application/ld+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
}
