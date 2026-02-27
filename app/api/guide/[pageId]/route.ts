import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getPageGuide } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
const { pageId } = await params;

  try {
    const guide = await getPageGuide(pageId);
    
    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    logger.error('Guide API error:', error);
    return NextResponse.json({ error: 'Failed to fetch guide' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/guide/[pageId]', _GET);
