import { NextRequest, NextResponse } from 'next/server';


import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import URLHealthMonitor from '@/lib/new-ecosystem-services/URLHealthMonitor';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminRole } from '@/lib/api/requireAdminRole';
export const runtime = 'nodejs';
export const maxDuration = 120;

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const adminCheck = await requireAdminRole();
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const monitor = new URLHealthMonitor();
    const result = await monitor.run(body);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    logger.error('URL health check error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: toErrorMessage(error) || 'URL health check failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/ecosystem/url-health', _POST);
