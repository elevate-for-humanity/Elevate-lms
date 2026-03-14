export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/account/export/route.ts
import { NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logStudentSelfAccess } from '@/lib/audit/ferpa';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const session = await requireApiAuth();
    const email = session.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient();
  const db = supabase;
    const { data: user, error: userError } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      logger.error('Failed to fetch user for export', userError as Error, { email });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch enrollments
    const { data: enrollments, error: enrollmentsError } = await db
      .from('program_enrollments')
      .select('*, course:courses(title)')
      .eq('user_id', user.id);

    if (enrollmentsError) {
      logger.error('Failed to fetch enrollments for export', enrollmentsError as Error, {
        userId: user.id,
      });
    }

    // Fetch exam attempts
    const { data: examAttempts, error: examAttemptsError } = await db
      .from('exam_attempts')
      .select('*, exam:exams(title)')
      .eq('student_id', user.id);

    if (examAttemptsError) {
      logger.error('Failed to fetch exam attempts for export', examAttemptsError as Error, {
        userId: user.id,
      });
    }

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      enrollments: (enrollments || []).map((e: any) => ({
        courseTitle: e.course?.title,
        status: e.status,
        startDate: e.start_date,
        completedAt: e.completed_at,
      })),
      examAttempts: (examAttempts || []).map((a: Record<string, any>) => ({
        examTitle: a.exam?.title,
        status: a.status,
        score: a.score,
        startedAt: a.started_at,
        completedAt: a.completed_at,
      })),
    };

    // FERPA: log student self-access data export
    await logStudentSelfAccess(user.id, 'student_record');

    // Log export event for audit trail
    const { error: auditError } = await db.from('account_export_events').insert({
      user_id: user.id,
      email: user.email,
      format: 'json',
    });

    if (auditError) {
      logger.error('Failed to log account export event', auditError as Error, {
        userId: user.id,
      });
    }

    const body = JSON.stringify(exportData, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="efh-account-export.json"',
      },
    });
  } catch (error) { 
    logger.error('Unexpected error in account export', error as Error);
    return NextResponse.json(
      { error: 'Failed to export account data' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/account/export', _GET);
