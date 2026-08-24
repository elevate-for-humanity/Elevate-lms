/**
 * GET /api/health/dependencies
 *
 * Diagnostics endpoint - reports on external services
 * (Supabase, Redis, SendGrid, etc.). Does NOT affect readiness.
 */

import { NextResponse } from 'next/server';
import { checkDependencies } from '@/lib/health/dependency-checks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const checks = await checkDependencies();

  return NextResponse.json(
    {
      service: process.env.SERVICE_NAME || 'lms',
      dependencies: checks,
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
