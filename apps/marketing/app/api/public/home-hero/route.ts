import { NextResponse } from 'next/server';

import { getApprovedHomeHeroAsset } from '@/lib/media/home-hero-asset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const asset = await getApprovedHomeHeroAsset();
  const response = NextResponse.json({ asset });

  response.headers.set(
    'Cache-Control',
    asset
      ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
      : 'public, max-age=15, s-maxage=30, stale-while-revalidate=300',
  );

  return response;
}
