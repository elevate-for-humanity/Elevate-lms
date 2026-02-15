import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { generateSitemap } from '@/lib/autopilot/deploy-prep';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const result = await generateSitemap();
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Sitemap generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const result = await generateSitemap();
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Sitemap generation failed' },
      { status: 500 }
    );
  }
}
