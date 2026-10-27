// pre-auth-registry: exempt - requireProgramHolder enforces holder-scoped access.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { isEpaTestingProgram } from '@/lib/program-holder/enrollment-identity';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function checkEpaProgram(db: any, programId: string) {
  const { data: program, error } = await db.from('programs').select('slug').eq('id', programId).maybeSingle();
  if (error) return NextResponse.json({ error: 'Program eligibility could not be verified.' }, { status: 503 });
  if (!isEpaTestingProgram(program?.slug)) return NextResponse.json({ error: 'EPA testing readiness is only available for the approved HVAC pathway.' }, { status: 400 });
  return null;
}
export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    studentId?: string;
    source?: 'enrollment' | 'holder_student';
  };
  const studentId = String(body.studentId || '');
  if (!UUID.test(studentId) || !['enrollment', 'holder_student'].includes(String(body.source))) {
    return NextResponse.json({ error: 'A valid student record is required.' }, { status: 400 });
  }

  let studentName = 'Student';
  let programId: string | null = null;
  let studentUserId: string | null = null;

  if (body.source === 'enrollment') {
    const { data: enrollment } = await ctx.db
      .from('program_enrollments')
      .select('id,user_id,program_id,full_name,email')
      .eq('id', studentId)
      .eq('program_holder_id', ctx.holderId)
      .maybeSingle();

    if (!enrollment || !ctx.programIds.includes(enrollment.program_id)) {
      return NextResponse.json({ error: 'This student is not in your assigned roster.' }, { status: 403 });
    }

    const eligibilityError = await checkEpaProgram(ctx.db, enrollment.program_id);
    if (eligibilityError) return eligibilityError;
    studentName = enrollment.full_name || enrollment.email || 'Student';
    programId = enrollment.program_id;
    studentUserId = enrollment.user_id;

    const { error } = await ctx.db
      .from('program_enrollments')
      .update({
        next_required_action: 'EPA 608 testing requested — Admin review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .eq('program_holder_id', ctx.holderId);

    if (error) {
      return NextResponse.json({ error: 'Testing readiness could not be saved.' }, { status: 500 });
    }
  } else {
    const { data: holderStudent } = await ctx.db
      .from('program_holder_students')
      .select('id,student_id,user_id,program_id,applicant_name,applicant_email')
      .eq('id', studentId)
      .eq('program_holder_id', ctx.holderId)
      .maybeSingle();

    if (!holderStudent || !ctx.programIds.includes(holderStudent.program_id)) {
      return NextResponse.json({ error: 'This student is not in your assigned roster.' }, { status: 403 });
    }

    const eligibilityError = await checkEpaProgram(ctx.db, holderStudent.program_id);
    if (eligibilityError) return eligibilityError;
    studentName = holderStudent.applicant_name || holderStudent.applicant_email || 'Student';
    programId = holderStudent.program_id;
    studentUserId = holderStudent.student_id || holderStudent.user_id;

    const { error } = await ctx.db
      .from('program_holder_students')
      .update({
        work_progress: 'EPA 608 testing requested — Admin review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .eq('program_holder_id', ctx.holderId);

    if (error) {
      return NextResponse.json({ error: 'Testing readiness could not be saved.' }, { status: 500 });
    }
  }

  const { error: notificationError } = await ctx.db.from('staff_notifications').insert({
    type: 'student_ready_for_testing',
    title: `EPA 608 test requested for ${studentName}`,
    message: `${ctx.profile.full_name || 'A Program Holder'} requested EPA 608 testing review for ${studentName}. Verify training hours, progress, and eligibility before scheduling.`,
    severity: 'action_required',
    metadata: {
      source: body.source,
      student_record_id: studentId,
      student_user_id: studentUserId,
      program_holder_id: ctx.holderId,
      program_id: programId,
      submitted_by: ctx.user.id,
      submitted_at: new Date().toISOString(),
    },
  });

  if (notificationError) {
    return NextResponse.json({ error: 'Admin could not be alerted.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
