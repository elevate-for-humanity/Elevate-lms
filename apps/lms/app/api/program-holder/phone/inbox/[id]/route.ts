// pre-auth-registry: exempt - phoneActorResponse (requireCommunicationActor) and assigned_profile_id scope every write.
import { NextResponse } from 'next/server';
import { phoneActorResponse } from '@/lib/phone/actor-response';

const STATUSES = new Set(['new', 'acknowledged', 'contacted', 'resolved']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { actor: ctx, response: actorError } = await phoneActorResponse();
  if (actorError) return actorError;
  if (ctx.previewing) {
    return NextResponse.json({ error: 'Administrator portal previews are read-only.' }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status || '');
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: 'Choose a valid callback status.' }, { status: 400 });
  }
  const now = new Date().toISOString();
  const { data, error } = await ctx.db
    .from('phone_callback_tasks')
    .update({ status, read_at: now, updated_at: now })
    .eq('id', id)
    .eq('assigned_profile_id', ctx.user.id)
    .select('id,status,read_at')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Callback status could not be saved.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Callback task not found.' }, { status: 404 });
  return NextResponse.json({ task: data });
}
