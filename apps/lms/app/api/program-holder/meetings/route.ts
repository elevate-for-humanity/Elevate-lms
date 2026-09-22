// pre-auth-registry: exempt - requireProgramHolder and holder filters authorize every operation.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { ensureLiveKitRoom, liveKitReadiness } from '@/lib/communications/livekit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function holderWorkspace(ctx: Awaited<ReturnType<typeof requireProgramHolder>>) {
  let query = ctx.db.from('communication_workspaces').select('id,phone_system_id,status').limit(1);
  query = ctx.tenantId ? query.eq('tenant_id', ctx.tenantId) : query.is('tenant_id', null);
  const tenantResult = await query.maybeSingle();
  if (tenantResult.data || tenantResult.error || !ctx.tenantId) return tenantResult;

  const { data: platformWorkspace, error: platformError } = await ctx.db
    .from('communication_workspaces')
    .select('phone_system_id')
    .is('tenant_id', null)
    .limit(1)
    .maybeSingle();
  if (platformError) return { data: null, error: platformError };

  const created = await ctx.db
    .from('communication_workspaces')
    .insert({
      tenant_id: ctx.tenantId,
      phone_system_id: platformWorkspace?.phone_system_id ?? null,
      name: 'Elevate Communications',
      status: liveKitReadiness().ready ? 'active' : 'setup',
    })
    .select('id,phone_system_id,status')
    .single();
  if (!created.error) return created;

  // A concurrent first meeting may have created the unique tenant workspace.
  return ctx.db
    .from('communication_workspaces')
    .select('id,phone_system_id,status')
    .eq('tenant_id', ctx.tenantId)
    .limit(1)
    .maybeSingle();
}

export async function GET() {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }
  await hydrateProcessEnv();
  const [{ data, error }, { data: applicants }] = await Promise.all([
    ctx.db
      .from('program_holder_meetings')
      .select('*')
      .eq('program_holder_id', ctx.holderId)
      .order('starts_at'),
    ctx.db
      .from('program_holder_students')
      .select('id,applicant_name,user_id')
      .eq('program_holder_id', ctx.holderId)
      .in('status', ['applied', 'pending', 'enrolled'])
      .order('applicant_name'),
  ]);
  return error
    ? NextResponse.json({ error: 'Unable to load meetings.' }, { status: 500 })
    : NextResponse.json({
        meetings: data ?? [],
        applicants: applicants ?? [],
        videoReady: liveKitReadiness().ready,
      });
}

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const studentId = String(body.programHolderStudentId || '');
  const startsAt = String(body.startsAt || '');
  const method = String(body.meetingMethod || 'phone');
  const duration = Number(body.durationMinutes || 30);
  if (
    !studentId ||
    !startsAt ||
    Number.isNaN(new Date(startsAt).getTime()) ||
    !['phone', 'video', 'in_person'].includes(method) ||
    !Number.isInteger(duration) ||
    duration < 10 ||
    duration > 240
  ) {
    return NextResponse.json(
      { error: 'Applicant, valid date, time, method, and duration are required.' },
      { status: 400 },
    );
  }
  const { data: student } = await ctx.db
    .from('program_holder_students')
    .select('id,applicant_name,user_id')
    .eq('id', studentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  if (!student) {
    return NextResponse.json(
      { error: 'Applicant is not assigned to this Program Holder.' },
      { status: 404 },
    );
  }

  const title = String(
    body.title || `Enrollment meeting with ${student.applicant_name || 'applicant'}`,
  )
    .trim()
    .slice(0, 180);
  const agenda =
    String(body.agenda || '')
      .trim()
      .slice(0, 2000) || null;
  let communicationRoomId: string | null = null;
  let meetingUrl: string | null = null;

  if (method === 'video') {
    if (!student.user_id) {
      return NextResponse.json(
        {
          error:
            'This applicant needs an active Student Portal account before a secure video room can be scheduled.',
        },
        { status: 400 },
      );
    }
    await hydrateProcessEnv();
    const readiness = liveKitReadiness();
    if (!readiness.ready) {
      return NextResponse.json(
        { error: 'Secure dashboard video is not connected yet. Choose phone or in person.' },
        { status: 503 },
      );
    }
    const { data: workspace } = await holderWorkspace(ctx);
    if (!workspace?.id || workspace.status !== 'active') {
      return NextResponse.json(
        { error: 'The communications workspace is not active.' },
        { status: 503 },
      );
    }
    const roomKey = `holder-${ctx.holderId}-${crypto.randomUUID()}`;
    await ensureLiveKitRoom(roomKey, 20);
    const { data: room, error: roomError } = await ctx.db
      .from('communication_rooms')
      .insert({
        workspace_id: workspace.id,
        room_key: roomKey,
        title,
        description: agenda,
        room_type: 'meeting',
        host_profile_id: ctx.user.id,
        status: 'open',
        scheduled_at: new Date(startsAt).toISOString(),
        max_participants: 20,
        allow_screen_share: true,
        allow_chat: true,
      })
      .select('id')
      .single();
    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Unable to create the secure video room.' },
        { status: 500 },
      );
    }
    communicationRoomId = room.id;
    meetingUrl = `/program-holder/meetings/${room.id}`;
    const { data: studentProfile } = await ctx.db
      .from('profiles')
      .select('full_name,email')
      .eq('id', student.user_id)
      .maybeSingle();
    const { error: participantError } = await ctx.db
      .from('communication_room_participants')
      .insert([
        {
          room_id: room.id,
          profile_id: ctx.user.id,
          display_name: ctx.profile.full_name || ctx.profile.email || 'Program Holder',
          role: 'host',
          invite_status: 'accepted',
        },
        {
          room_id: room.id,
          profile_id: student.user_id,
          email: studentProfile?.email || null,
          display_name: studentProfile?.full_name || student.applicant_name || 'Student',
          role: 'participant',
          invite_status: 'sent',
        },
      ]);
    if (participantError) {
      await ctx.db.from('communication_rooms').delete().eq('id', room.id);
      return NextResponse.json(
        { error: 'Unable to secure the meeting participants.' },
        { status: 500 },
      );
    }
  }

  const { data, error } = await ctx.db
    .from('program_holder_meetings')
    .insert({
      program_holder_id: ctx.holderId,
      program_holder_student_id: student.id,
      title,
      starts_at: new Date(startsAt).toISOString(),
      duration_minutes: duration,
      meeting_method: method,
      meeting_url: meetingUrl,
      communication_room_id: communicationRoomId,
      location:
        String(body.location || '')
          .trim()
          .slice(0, 500) || null,
      agenda,
      created_by: ctx.user.id,
    })
    .select('*')
    .single();
  if (error) {
    if (communicationRoomId) {
      await ctx.db.from('communication_rooms').delete().eq('id', communicationRoomId);
    }
    return NextResponse.json({ error: 'Unable to schedule meeting.' }, { status: 500 });
  }
  return NextResponse.json({ meeting: data }, { status: 201 });
}
