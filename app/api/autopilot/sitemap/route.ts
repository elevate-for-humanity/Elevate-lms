import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { generateSitemap } from '@/lib/autopilot/deploy-prep';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const result = await generateSitemap();
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Sitemap generation failed', details: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;


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
export const GET = withApiAudit('/api/autopilot/sitemap', _GET);
export const POST = withApiAudit('/api/autopilot/sitemap', _POST);
