import { NextRequest, NextResponse } from 'next/server';

import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import type { CapabilityHealth } from '@/lib/devstudio/capability-health';

/**
 * Capability health is application state, not container health.
 *
 * IMPORTANT: an unconfigured optional Studio capability must not return HTTP 503.
 * A 503 is reserved for service/proxy unavailability and causes browsers,
 * monitoring, service workers, and operators to treat a normal capability state
 * as a production outage. Consumers must read result.status instead.
 */
export async function capabilityHealthResponse(
  request: NextRequest,
  resolveHealth: () => Promise<CapabilityHealth>,
): Promise<NextResponse> {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const result = await resolveHealth();
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('[CAPABILITY_HEALTH_FAILED]', error);

    return NextResponse.json(
      {
        capability: 'unknown',
        status: 'unavailable',
        configured: false,
        checks: [
          {
            name: 'health-check',
            passed: false,
            required: true,
            message: 'Capability health check failed. Review server logs for details.',
          },
        ],
        checkedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      },
    );
  }
}
