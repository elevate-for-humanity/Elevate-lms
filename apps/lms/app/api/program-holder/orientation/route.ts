// pre-auth-registry: exempt - requireProgramHolder enforces owner context before playback or acknowledgement writes.
import { NextRequest, NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { nextOrientationPosition } from '@/lib/program-holder/orientation-progress';
import media from '@/lib/program-holder/onboarding-media.json';
export const dynamic = 'force-dynamic';
const privateHeaders = { 'Cache-Control': 'private, no-store' };
export async function GET() {
  const ctx = await requireProgramHolder({ allowPendingApproval: true });
  if (ctx.mode !== 'holder')
    return NextResponse.json(
      { error: 'Use your own partner account to complete orientation.' },
      { status: 403 },
    );
  const { error: assignmentError } = await ctx.db
    .from('onboarding_video_assignments')
    .upsert(
      {
        user_id: ctx.user.id,
        video_key: media.version,
        duration_seconds: Math.ceil(media.durationSeconds),
      },
      { onConflict: 'user_id,video_key', ignoreDuplicates: true },
    );
  if (assignmentError)
    return NextResponse.json(
      { error: 'Orientation progress could not be initialized.' },
      { status: 503 },
    );
  const [progress, ack] = await Promise.all([
    ctx.db
      .from('onboarding_video_assignments')
      .select('watch_seconds,completion_percentage,status')
      .eq('user_id', ctx.user.id)
      .eq('video_key', media.version)
      .single(),
    ctx.db
      .from('program_holder_acknowledgements')
      .select('acknowledged_at,full_name')
      .eq('user_id', ctx.user.id)
      .eq('document_type', media.version)
      .maybeSingle(),
  ]);
  if (progress.error || ack.error)
    return NextResponse.json({ error: 'Orientation records could not load.' }, { status: 503 });
  return NextResponse.json(
    { ...progress.data, acknowledgement: ack.data },
    { headers: privateHeaders },
  );
}
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const ctx = await requireProgramHolder({ allowPendingApproval: true });
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Partner session required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const row = await ctx.db
    .from('onboarding_video_assignments')
    .select('id,watch_seconds,updated_at')
    .eq('user_id', ctx.user.id)
    .eq('video_key', media.version)
    .single();
  if (row.error || !row.data)
    return NextResponse.json(
      { error: 'Open orientation and start playback first.' },
      { status: 409 },
    );
  if (body?.action === 'acknowledge') {
    const signer = typeof body.signer === 'string' ? body.signer.trim() : '';
    if (
      row.data.watch_seconds < Math.ceil(media.durationSeconds) - 1 ||
      body.understood !== true ||
      signer.length < 2 ||
      signer.length > 150 ||
      body.agreementAnswer !== 'individual' ||
      body.bankAnswer !== 'provider' ||
      body.paymentAnswer !== 'review'
    )
      return NextResponse.json(
        {
          error:
            'Finish playback, answer the review questions, then enter your signature and confirm understanding.',
        },
        { status: 400 },
      );
    const existing = await ctx.db
      .from('program_holder_acknowledgements')
      .select('id')
      .eq('user_id', ctx.user.id)
      .eq('document_type', media.version)
      .maybeSingle();
    if (existing.error)
      return NextResponse.json(
        { error: 'Your acknowledgement could not be checked.' },
        { status: 503 },
      );
    if (!existing.data) {
      const result = await ctx.db
        .from('program_holder_acknowledgements')
        .insert({
          user_id: ctx.user.id,
          document_type: media.version,
          full_name: signer,
          title:
            ctx.profile.role === 'site_coordinator'
              ? 'Site Coordinator — video watched and understood'
              : 'Program Holder — video watched and understood',
          ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0',
          user_agent: request.headers.get('user-agent')?.slice(0, 500) || 'unknown',
        });
      if (result.error)
        return NextResponse.json(
          { error: 'Your acknowledgement could not be saved.' },
          { status: 503 },
        );
    }
    return NextResponse.json({ acknowledged: true }, { headers: privateHeaders });
  }
  if (body?.action !== 'progress' || typeof body.position !== 'number')
    return NextResponse.json({ error: 'Valid playback progress is required.' }, { status: 400 });
  const now = new Date();
  const next = nextOrientationPosition(
    Number(row.data.watch_seconds || 0),
    body.position,
    (now.getTime() - Date.parse(row.data.updated_at)) / 1000,
    media.durationSeconds,
  );
  if (next === null)
    return NextResponse.json(
      { error: 'Resume from your saved position to record the remaining playback.' },
      { status: 409 },
    );
  const completed = next >= Math.ceil(media.durationSeconds) - 1;
  const update = await ctx.db
    .from('onboarding_video_assignments')
    .update({
      watch_seconds: Math.floor(next),
      completion_percentage: completed ? 100 : Math.floor((next / media.durationSeconds) * 100),
      status: completed ? 'completed' : 'in_progress',
      completed_at: completed ? now.toISOString() : null,
      updated_at: now.toISOString(),
    })
    .eq('id', row.data.id)
    .eq('user_id', ctx.user.id)
    .eq('updated_at', row.data.updated_at)
    .select('id')
    .maybeSingle();
  if (update.error || !update.data)
    return NextResponse.json(
      { error: 'Progress changed in another window. Reload orientation.' },
      { status: 409 },
    );
  return NextResponse.json({ watched: Math.floor(next), completed }, { headers: privateHeaders });
}
