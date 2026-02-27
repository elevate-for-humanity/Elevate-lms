import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — no authentication required
/**
 * DEPRECATED: Use /api/license/webhook instead
 * 
 * This endpoint forwards to the canonical license webhook handler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
  logger.warn('Deprecated webhook endpoint called', { 
    path: '/api/store/licenses/webhook',
    canonical: '/api/license/webhook'
  });

  const body = await request.text();
  
  const response = await fetch(new URL('/api/license/webhook', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': request.headers.get('stripe-signature') || '',
    },
    body,
  });

  const data = await response.text();
  return new NextResponse(data, { 
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
}
export const POST = withApiAudit('/api/store/licenses/webhook', _POST, { actor_type: 'webhook', skip_body: true });
