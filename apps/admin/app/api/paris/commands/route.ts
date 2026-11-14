import { NextResponse } from 'next/server';

// Keep the existing URL compatible while using the same administrator guard,
// registered tools, durable task evidence, and truthful outcomes as /execute.
export { POST } from '../execute/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/paris/execute',
    compatibilityEndpoint: 'POST /api/paris/commands',
    message: 'Commands use the authenticated PARIS executor. Queued work is reported as running until verified.',
  }, {headers: {'cache-control': 'no-store'}});
}
