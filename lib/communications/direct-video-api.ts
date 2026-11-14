import 'server-only';
import { NextResponse } from 'next/server';
import { phoneActorResponse } from '@/lib/phone/actor-response';
import { createMeetingToken, ensureLiveKitRoom, endLiveKitRoom, liveKitReadiness } from './livekit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';

type Actor = NonNullable<Awaited<ReturnType<typeof phoneActorResponse>>['actor']>;
const fail = (error: string, status = 503) => NextResponse.json({ error }, { status });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const expired = (created: string) => !Number.isFinite(Date.parse(created)) || Date.now() - Date.parse(created) > 120000;

async function actor(): Promise<{ ctx: Actor; response?: never } | { ctx?: never; response: NextResponse }> {
  const result = await phoneActorResponse();
  if (result.response) return { response: result.response };
  const ctx = result.actor;
  if (ctx.previewing || !ctx.extension?.workspace_id || ctx.system?.status !== 'active') {
    return { response: fail('An active assigned extension is required. Previews cannot place calls.', 403) };
  }
  return { ctx };
}

export async function GET() {
  const auth = await actor();
  if (auth.response) return auth.response;
  const { ctx } = auth;
  const result = await ctx.db.from('communication_room_participants')
    .select('invite_status,communication_rooms!inner(id,title,room_key,workspace_id,host_profile_id,status,created_at)')
    .eq('profile_id', ctx.user.id).in('invite_status', ['pending', 'accepted'])
    .eq('communication_rooms.workspace_id', ctx.extension.workspace_id)
    .eq('communication_rooms.status', 'open').like('communication_rooms.room_key', 'direct-video-%')
    .gte('communication_rooms.created_at', new Date(Date.now() - 2 * 3600000).toISOString()).limit(20);
  if (result.error) return fail('Video invitations could not be loaded.');
  const calls = [];
  for (const entry of result.data ?? []) {
    const room = Array.isArray(entry.communication_rooms) ? entry.communication_rooms[0] : entry.communication_rooms;
    if (!room) continue;
    const participants = await ctx.db.from('communication_room_participants').select('invite_status').eq('room_id', room.id);
    if (participants.error) return fail('Video invitation state could not be verified.');
    const accepted = participants.data?.length === 2 && participants.data.every(person => person.invite_status === 'accepted');
    if (!accepted && expired(room.created_at)) continue;
    calls.push({ roomId: room.id, title: room.title, direction: room.host_profile_id === ctx.user.id ? 'outgoing' : 'incoming', state: accepted ? 'accepted' : 'ringing' });
  }
  return NextResponse.json({ calls }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const auth = await actor();
  if (auth.response) return auth.response;
  const { ctx } = auth;
  const limited = await applyRateLimit(request, 'strict', { key: `video-call:${ctx.user.id}` });
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const extension = String(body.extension || '').trim();
  if (!/^(0|\d{3})$/.test(extension)) return fail('Enter an assigned extension for a video call.', 400);
  const target = await ctx.db.from('communication_extensions').select('profile_id,display_name,ring_mode')
    .eq('workspace_id', ctx.extension.workspace_id).eq('extension', extension).eq('enabled', true).maybeSingle();
  if (target.error) return fail('The extension could not be verified.');
  if (!target.data?.profile_id || target.data.profile_id === ctx.user.id || ['offline', 'do_not_disturb'].includes(target.data.ring_mode)) return fail('That extension is unavailable for a video call.', 409);
  const profile = await ctx.db.from('profiles').select('id,is_active,suspended').eq('id', target.data.profile_id).maybeSingle();
  if (profile.error) return fail('The recipient could not be verified.');
  if (!profile.data || profile.data.is_active === false || profile.data.suspended) return fail('That extension is unavailable.', 409);
  await hydrateProcessEnv();
  if (!liveKitReadiness().ready) return fail('Video calling is not configured.');
  const roomKey = `direct-video-${crypto.randomUUID()}`;
  try {
    const providerRoom = await ensureLiveKitRoom(roomKey, 2);
    if (providerRoom?.name !== roomKey) return fail('The video provider did not confirm the requested room.');
    const title = `${ctx.extension.display_name || 'Extension ' + ctx.extension.extension} → ${target.data.display_name || 'Extension ' + extension}`;
    const saved = await ctx.db.from('communication_rooms').insert({ workspace_id: ctx.extension.workspace_id, room_key: roomKey, title, room_type: 'meeting', host_profile_id: ctx.user.id, status: 'open', max_participants: 2, allow_screen_share: true, allow_chat: true, allow_phone_dial_in: false, recording_enabled: false }).select('id').single();
    if (saved.error || !saved.data) return fail('The video invitation could not be saved.');
    const invitations = await ctx.db.from('communication_room_participants').insert([
      { room_id: saved.data.id, profile_id: ctx.user.id, display_name: ctx.profile.full_name || 'Caller', role: 'host', invite_status: 'accepted' },
      { room_id: saved.data.id, profile_id: target.data.profile_id, display_name: target.data.display_name || extension, role: 'participant', invite_status: 'pending' },
    ]);
    if (invitations.error) {
      await ctx.db.from('communication_rooms').update({ status: 'cancelled', ended_at: new Date().toISOString() }).eq('id', saved.data.id);
      return fail('The recipient invitation could not be saved.');
    }
    return NextResponse.json({ roomId: saved.data.id, title, state: 'ringing' }, { status: 201 });
  } catch { return fail('The video provider is unavailable.'); }
}

async function scopedRoom(ctx: Actor, roomId: string) {
  if (!UUID.test(roomId)) return null;
  const own = await ctx.db.from('communication_room_participants').select('invite_status').eq('room_id', roomId).eq('profile_id', ctx.user.id).maybeSingle();
  if (own.error || !own.data || !['pending', 'accepted'].includes(own.data.invite_status)) return null;
  const result = await ctx.db.from('communication_rooms').select('id,room_key,status,host_profile_id,created_at').eq('id', roomId).eq('workspace_id', ctx.extension.workspace_id).eq('status', 'open').like('room_key', 'direct-video-%').maybeSingle();
  if (result.error || !result.data) return null;
  return { ...result.data, inviteStatus: own.data.invite_status };
}

export async function PATCH(request: Request) {
  const auth = await actor();
  if (auth.response) return auth.response;
  const { ctx } = auth;
  const body = await request.json().catch(() => ({}));
  const room = await scopedRoom(ctx, String(body.roomId || ''));
  if (!room) return fail('This video call is unavailable.', 403);
  if (body.action === 'accept') {
    if (room.host_profile_id === ctx.user.id || (room.inviteStatus !== 'accepted' && expired(room.created_at))) return fail('This invitation has expired or cannot be accepted.', 409);
    const accepted = await ctx.db.from('communication_room_participants').update({ invite_status: 'accepted' }).eq('room_id', room.id).eq('profile_id', ctx.user.id).select('id').single();
    if (accepted.error || !accepted.data) return fail('The invitation could not be accepted.');
  } else if (['end', 'decline'].includes(body.action)) {
    const ended = await ctx.db.from('communication_rooms').update({ status: body.action === 'decline' ? 'cancelled' : 'ended', ended_at: new Date().toISOString() }).eq('id', room.id).eq('status', 'open').select('id').single();
    if (ended.error || !ended.data) return fail('The video call could not be ended.');
    await hydrateProcessEnv();
    try { await endLiveKitRoom(room.room_key); }
    catch { return fail('The invitation is closed, but the video provider has not confirmed disconnection. Leave the room using its controls.'); }
  } else return fail('Unknown video call action.', 400);
  return NextResponse.json({ ok: true });
}

export async function TOKEN(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const auth = await actor();
  if (auth.response) return auth.response;
  const { ctx } = auth;
  const room = await scopedRoom(ctx, (await params).roomId);
  if (!room || room.inviteStatus !== 'accepted') return fail('Accept the invitation before joining this video call.', 403);
  // The caller can prepare the room while ringing; an expired unanswered call cannot issue tokens.
  const participants = await ctx.db.from('communication_room_participants').select('invite_status').eq('room_id', room.id);
  if (participants.error || participants.data?.length !== 2) return fail('Call participants could not be verified.');
  if (!participants.data.every(person => person.invite_status === 'accepted') && expired(room.created_at)) return fail('This video call was not answered.', 409);
  await hydrateProcessEnv();
  try {
    return NextResponse.json(await createMeetingToken({ roomName: room.room_key, identity: ctx.user.id, displayName: ctx.profile.full_name || 'Team member', canPublish: true, canShare: true }), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return fail('The video connection could not be authorized.'); }
}
