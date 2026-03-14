import { NextRequest, NextResponse } from 'next/server';
// AUTH: Intentionally public — no authentication required


export const maxDuration = 60;
import { searchEntities } from '@/lib/integrations/sam-gov';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name') || '';

    if (!name) {
      return NextResponse.json(
        { error: 'name parameter is required' },
        { status: 400 }
      );
    }

    const entities = await searchEntities(name);

    return NextResponse.json({
      ok: true,
      count: entities.length,
      entities,
    });
  } catch (error) { 
    logger.error('SAM.gov search error:', toError(error));
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to search SAM.gov' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/sam-gov/search', _GET);
