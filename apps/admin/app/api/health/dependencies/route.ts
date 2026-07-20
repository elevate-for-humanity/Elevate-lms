/**
 * GET /api/health/dependencies
 *
 * Diagnostics endpoint - reports on external services
 * (Supabase, Redis, SendGrid, etc.). Does NOT affect readiness.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const checks = {
    supabase: false,
    redis: false,
    sendgrid: false,
  };

  // TODO: Add actual dependency checks here

  return NextResponse.json(
    {
      service: process.env.SERVICE_NAME || 'admin',
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
