import { NextRequest, NextResponse } from 'next/server';
import { POST as processEvents } from '../orchestration/process/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

// Keep the scheduler's established URL on the canonical event claim/execution path.
// Its HTTP failure gate must also observe partially failed event batches.
export async function POST(request: NextRequest) {
  const response = await processEvents(request);
  if (response.status === 207) {
    return NextResponse.json(await response.json(), {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  return response;
}
