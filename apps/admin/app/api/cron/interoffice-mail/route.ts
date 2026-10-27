import { NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { processInterofficeOutbox, queueInterviewFollowups } from '@/lib/email/interoffice-outbox';
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
    // Existing approved messages must not be blocked by a failure in follow-up discovery.
    const delivery = await processInterofficeOutbox();
    let followups: { queued: number } | { error: string };
    try {
      followups = await queueInterviewFollowups();
    } catch {
      followups = { error: 'Follow-up discovery failed; existing outbox was still processed' };
    }
    return NextResponse.json({ ...delivery, followups });
  } catch {
    return NextResponse.json({ error: 'Interoffice queue failed' }, { status: 503 });
  }
}
