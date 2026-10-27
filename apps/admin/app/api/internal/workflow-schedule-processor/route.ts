import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hydrateProcessEnv } from '@/lib/secrets';
import { enqueueDueWorkflowSchedules } from '@/lib/workflows/scheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 55;

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await hydrateProcessEnv();
    const result = await enqueueDueWorkflowSchedules(await requireAdminClient());
    return NextResponse.json({ ok: result.failed === 0 && result.truncated === 0, ...result }, {
      status: result.failed || result.truncated ? 500 : 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Workflow schedule queue unavailable.' }, { status: 500 });
  }
}
