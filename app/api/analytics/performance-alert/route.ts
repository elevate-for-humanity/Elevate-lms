export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const data = await parseBody<Record<string, any>>(request);

    // Log performance alert
    logger.warn('[Performance Alert]', data);

    // Send to monitoring service if configured
    if (process.env.SENTRY_DSN) {
      try {
        // Sentry integration
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureMessage('Performance Alert', {
          level: 'warning',
          extra: data,
        });
      } catch (sentryError) {
        logger.error('Failed to send to Sentry:', sentryError);
      }
    }

    // Log to database for internal tracking
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/logs/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_alert',
          data: data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (logError) {
      logger.error('Failed to log to database:', logError);
    }

    return NextResponse.json({ success: true });
  } catch (error) { /* Error handled silently */ 
    logger.error('[Performance Alert] Error:', error);
    return NextResponse.json({ error: 'Failed to log alert' }, { status: 500 });
  }
}
