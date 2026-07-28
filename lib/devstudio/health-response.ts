import { NextRequest, NextResponse } from 'next/server';


import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import type { CapabilityHealth } from '@/lib/devstudio/capability-health';


export async function capabilityHealthResponse(
  request: NextRequest,
  resolveHealth: () => Promise<CapabilityHealth>,
): Promise<NextResponse> {
  const auth = await apiRequireDevStudio(request);


  if (auth.error) {
    return auth.error;
  }


  try {
    const result = await resolveHealth();


    const status =
      result.status === 'unavailable'
        ? 503
        : 200;


    return NextResponse.json(result, {
      status,
      headers: {
        'Cache-Control': 'no-store',
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
            message:
              error instanceof Error
                ? error.message
                : 'Capability health check failed.',
          },
        ],
        checkedAt: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
