
export const maxDuration = 60;

/**
 * Federal Forms API
 * Generate pre-filled federal grant forms
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  generateAllFederalForms,
  generateSF424,
  generateSF424A,
  generateSFLLL,
} from '@/lib/grants/federal-forms';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { action, applicationId, entityId, grantId, formData } = body;

    switch (action) {
      case 'generate_all':
        if (!applicationId) {
          return NextResponse.json(
            { error: 'applicationId required' },
            { status: 400 }
          );
        }
        const allForms = await generateAllFederalForms(applicationId);
        return NextResponse.json(allForms);

      case 'generate_sf424':
        if (!entityId || !grantId || !formData) {
          return NextResponse.json(
            { error: 'entityId, grantId, and formData required' },
            { status: 400 }
          );
        }
        const sf424 = await generateSF424(
          entityId,
          grantId,
          formData.projectTitle,
          formData.projectDates,
          formData.funding
        );
        return NextResponse.json(sf424);

      case 'generate_sf424a':
        if (!entityId || !grantId || !formData) {
          return NextResponse.json(
            { error: 'entityId, grantId, and formData required' },
            { status: 400 }
          );
        }
        const sf424a = await generateSF424A(
          entityId,
          grantId,
          formData.budgetCategories
        );
        return NextResponse.json(sf424a);

      case 'generate_sflll':
        if (!entityId || !grantId) {
          return NextResponse.json(
            { error: 'entityId and grantId required' },
            { status: 400 }
          );
        }
        const sflll = await generateSFLLL(entityId, grantId);
        return NextResponse.json(sflll);

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: generate_all, generate_sf424, generate_sf424a, or generate_sflll',
          },
          { status: 400 }
        );
    }
  } catch (error) { 
    logger.error('Federal forms error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/grants/forms', _POST);
