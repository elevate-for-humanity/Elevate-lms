import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * DEPRECATED: Use /api/checkout/learner instead
 * 
 * This handler forwards to the canonical learner checkout.
 * Will be removed in a future release.
 */
export async function POST(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;
logger.warn('Deprecated checkout endpoint called', { 
    path: '/api/checkout/student',
    redirect: '/api/checkout/learner'
  });

  // Forward to canonical endpoint
  const response = await fetch(new URL('/api/checkout/learner', request.url), {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ type: 'subscription', tier: 'student' }),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
