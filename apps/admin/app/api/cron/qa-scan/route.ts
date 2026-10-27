import { NextRequest, NextResponse } from 'next/server';
import { queuePlatformQa } from '@/lib/devstudio/queue-platform-qa';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await queuePlatformQa();
  if (result.status === 'failed') {
    const { httpStatus, ...failure } = result;
    return NextResponse.json(failure, { status: httpStatus });
  }
  return NextResponse.json({
    ...result,
    summary: 'TypeScript, lint and build checks run in GitHub CI. Results are pending.',
  }, { status: 202 });
}
