

/**
 * Grant Eligibility API
 * Check entity eligibility for grants
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  checkEntityEligibility,
  checkGrantEligibility,
  batchCheckEligibility,
} from '@/lib/grants/eligibility-engine';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);


    const body = await req.json();
    const { action, entityId, grantId } = body;

    switch (action) {
      case 'check_entity':
        if (!entityId) {
          return NextResponse.json(
            { error: 'entityId required' },
            { status: 400 }
          );
        }
        const entityResult = await checkEntityEligibility(entityId);
        return NextResponse.json(entityResult);

      case 'check_grant':
        if (!entityId || !grantId) {
          return NextResponse.json(
            { error: 'entityId and grantId required' },
            { status: 400 }
          );
        }
        const grantResult = await checkGrantEligibility(grantId, entityId);
        return NextResponse.json(grantResult);

      case 'batch_check':
        const batchResult = await batchCheckEligibility();
        return NextResponse.json(batchResult);

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: check_entity, check_grant, or batch_check' },
          { status: 400 }
        );
    }
  } catch (error) { 
    logger.error('Eligibility check error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/grants/eligibility', _POST);
