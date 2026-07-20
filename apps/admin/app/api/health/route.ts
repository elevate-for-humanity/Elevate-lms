/**
 * GET /api/health
 *
 * Readiness probe - verifies application is initialized
 * and ready to serve requests. Still NO external dependency checks.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      ready: true,
      service: process.env.SERVICE_NAME || 'admin',
      environment: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
