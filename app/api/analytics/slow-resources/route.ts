export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const data = await parseBody<Record<string, any>>(request);

    // Log slow resource loading
    logger.warn('[Slow Resources]', data);

    // Send to monitoring service for analysis
    if (process.env.SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureMessage('Slow Resource Loading', {
          level: 'warning',
          extra: data,
          tags: {
            resource_type: data.resourceType,
            duration: data.duration,
          },
        });
      } catch (sentryError) {
        logger.error('Failed to send to Sentry:', sentryError);
      }
    }

    // Store in database for analytics
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/logs/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'slow_resource',
          data: data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (logError) {
      logger.error('Failed to log to database:', logError);
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    logger.error('[Slow Resources] Error:', error);
    return NextResponse.json({ error: 'Failed to log resources' }, { status: 500 });
  }
}
