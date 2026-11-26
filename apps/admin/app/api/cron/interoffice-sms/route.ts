import { NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { processInterofficeSmsOutbox } from '@/lib/notifications/interoffice-sms-outbox';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: Request) {
  await hydrateProcessEnv();
  if (
    !process.env.CRON_SECRET ||
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const delivery = await processInterofficeSmsOutbox();
    return NextResponse.json(delivery);
  } catch {
    return NextResponse.json({ error: 'Interoffice SMS queue failed' }, { status: 503 });
  }
}
