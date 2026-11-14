// pre-auth-registry: exempt - requireProgramHolder and holder filters authorize every operation.
import {
  assertGoogleCalendarAvailable,
  CalendarConflictError,
} from '@/lib/calendar/google-calendar';
import { studentContactHolderIds } from '@/lib/email/assigned-student-directory';
import { loadHolderOfficeStudents } from '@/lib/program-holder/office-students';
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { ensureLiveKitRoom, liveKitReadiness } from '@/lib/communications/livekit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

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
  if (ctx.mode === 'admin')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  await hydrateProcessEnv();
  try {
    const [meetings, applicants, contactHolderIds] = await Promise.all([
      ctx.db
        .from('program_holder_meetings')
        .select('*')
        .eq('program_holder_id', ctx.holderId)
        .order('starts_at'),
      loadHolderOfficeStudents(ctx),
      studentContactHolderIds(ctx.db, ctx.user.id),
    ]);
    if (meetings.error) throw new Error('Meetings unavailable.');
    return NextResponse.json({
      readOnly: ctx.mode === 'preview',
      userId: ctx.user.id,
      meetings: meetings.data ?? [],
      contactAccessGranted: contactHolderIds.includes(ctx.holderId),
      applicants: applicants.map((student) =>
        contactHolderIds.includes(ctx.holderId)
          ? student
          : { id: student.id, applicant_name: student.applicant_name, user_id: student.user_id },
      ),
      videoReady: liveKitReadiness().ready,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load meetings and assigned students.' },
      { status: 500 },
    );
  }
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
  let student: any;
  try {
    student = (await loadHolderOfficeStudents(ctx)).find((item) => item.id === studentId);
  } catch {
    return NextResponse.json({ error: 'Assigned student could not be verified.' }, { status: 503 });
  }
  if (!student)
    return NextResponse.json(
      { error: 'Student is not assigned to this Program Holder.' },
      { status: 404 },
    );

  const endsAt = new Date(Date.parse(startsAt) + duration * 60000).toISOString();
  try {
    await assertGoogleCalendarAvailable(ctx.user.id, new Date(startsAt).toISOString(), endsAt);
    const { data: scheduled, error: scheduleError } = await ctx.db
      .from('program_holder_meetings')
      .select('starts_at,duration_minutes')
      .eq('program_holder_id', ctx.holderId)
      .eq('status', 'scheduled')
      .lt('starts_at', endsAt)
      .gte('starts_at', new Date(Date.parse(startsAt) - 240 * 60000).toISOString());
    if (scheduleError)
      throw new Error('Existing appointments could not be checked. Try again before booking.');
    if (
      (scheduled || []).some(
        (meeting: any) =>
          Date.parse(meeting.starts_at) + meeting.duration_minutes * 60000 > Date.parse(startsAt),
      )
    ) {
      throw new CalendarConflictError(
        'This time overlaps an existing dashboard meeting. Choose another time.',
      );
    }
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error ? cause.message : 'Calendar availability could not be checked.',
      },
      { status: cause instanceof CalendarConflictError ? 409 : 503 },
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
          invite_status: 'pending',
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
      program_holder_student_id: student.enrollment_id ? null : student.id,
      enrollment_id: student.enrollment_id || null,
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
  // A saved meeting is not a delivered invitation. Use the student's portal
  // route, never the host-only Program Holder URL.
  let invitationDelivery: 'accepted' | 'failed' | 'missing_email' = 'missing_email';
  const { data: recipient } = student.user_id
    ? await ctx.db.from('profiles').select('email').eq('id', student.user_id).maybeSingle()
    : { data: null };
  if (recipient?.email) {
    const joinUrl = communicationRoomId
      ? `https://app.elevateforhumanity.org/lms/meetings/${communicationRoomId}`
      : 'https://app.elevateforhumanity.org/learner/dashboard';
    const loginUrl = `https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent(new URL(joinUrl).pathname)}`;
    const text = [
      title,
      `Starts: ${new Date(startsAt).toISOString()} (UTC)`,
      `Duration: ${duration} minutes`,
      `Method: ${method.replaceAll('_', ' ')}`,
      agenda || '',
      method === 'in_person' ? String(body.location || '') : '',
      `Sign in with your student account: ${loginUrl}`,
    ]
      .filter(Boolean)
      .join('\n\n');
    const escaped = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    try {
      const delivery = await sendEmail({
        to: recipient.email,
        replyTo: ctx.profile.email || undefined,
        subject: `Meeting invitation: ${title}`,
        text,
        html: `<div style="white-space:pre-wrap">${escaped}</div>`,
        singleAttempt: true,
      });
      invitationDelivery = delivery.success ? 'accepted' : 'failed';
      if (delivery.success && communicationRoomId) {
        const { error: inviteUpdateError } = await ctx.db
          .from('communication_room_participants')
          .update({ invite_status: 'sent' })
          .eq('room_id', communicationRoomId)
          .eq('profile_id', student.user_id);
        if (inviteUpdateError)
          logger.error('[holder-meetings] invitation status update failed', inviteUpdateError);
      }
    } catch (cause) {
      invitationDelivery = 'failed';
      logger.error('[holder-meetings] invitation failed', cause);
    }
  }
  return NextResponse.json({ meeting: data, invitationDelivery }, { status: 201 });
}
