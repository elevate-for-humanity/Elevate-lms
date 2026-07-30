/**
 * GET /api/ping
 *
 * Liveness probe - verifies the process is alive, node is running,
 * and the container is alive. NO database checks.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: 'admin',
      commit: process.env.GIT_SHA ?? process.env.GITHUB_SHA ?? 'unknown',
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
