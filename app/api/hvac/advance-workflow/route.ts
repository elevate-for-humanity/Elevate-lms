export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { advanceHvacWorkflow } from '@/lib/courses/hvac-completion-workflow';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

/**
 * POST /api/hvac/advance-workflow
 *
 * Called after:
 * - Student completes all HVAC modules
 * - Student uploads OSHA 10 certificate
 * - Student uploads CPR certificate
 * - Student uploads EPA 608 certificate
 *
 * Checks credential status and sends the next email in the sequence.
 */
async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await advanceHvacWorkflow(user.id);
    logger.info('[hvac-workflow] Advanced', { userId: user.id, ...result });
    return NextResponse.json(result);
  } catch (error) {
    logger.error('[hvac-workflow] Error:', error);
    return NextResponse.json({ error: 'Workflow error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/hvac/advance-workflow', _POST);
