import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import ContentAutomation from '@/lib/new-ecosystem-services/ContentAutomation';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminRole } from '@/lib/api/requireAdminRole';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const adminCheck = await requireAdminRole();
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const automation = new ContentAutomation();
    const result = await automation.run(body);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error('Content automation error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: toErrorMessage(error) || 'Content automation failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/ecosystem/content-automation', _POST);
