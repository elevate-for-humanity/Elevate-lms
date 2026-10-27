import { requireAdminClient } from '@/lib/supabase/admin';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['employer', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employer = await getEmployerRecord(supabase, user.id);
    if (profile.role === 'employer' && !employer) return NextResponse.json({ error: 'Employer account is not connected' }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const periodStart = String(body.periodStart || '').trim();
    const periodEnd = String(body.periodEnd || '').trim();
    const submissionMethod = String(body.submissionMethod || 'electronic').trim();
    const notes = String(body.notes || '').trim();

    const participantsServed = Number(body.participantsServed || 0);
    const completions = Number(body.completions || 0);
    const placements = Number(body.placements || 0);
    const retention90 = Number(body.retention90 || 0);

    const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
      && Number.isFinite(Date.parse(value))
      && new Date(value).toISOString().slice(0, 10) === value;
    if (!validDate(periodStart) || !validDate(periodEnd) || periodEnd < periodStart) {
      return NextResponse.json({ error: 'A valid reporting period is required' }, { status: 400 });
    }

    const invalidMetric = [participantsServed, completions, placements, retention90].some(
      (n) => !Number.isSafeInteger(n) || n < 0,
    );
    if (invalidMetric) {
      return NextResponse.json({ error: 'Metrics must be non-negative numbers' }, { status: 400 });
    }

    const periodEndDate = new Date(periodEnd);
    const fiscalYear = periodEndDate.getUTCFullYear();
    const quarter = `${fiscalYear}Q${Math.floor(periodEndDate.getUTCMonth() / 3) + 1}`;

    // Reporting rows remain staff-only; the authenticated employer submits its own scoped payload through this API.
    const writer = await requireAdminClient();
    const { data: report, error: reportError } = await writer
      .from('wioa_compliance_reports')
      .insert({
        report_type: 'employer_wioa_submission', due_date: periodEnd, status: 'submitted',
        quarter, fiscal_year: fiscalYear,
        submitted_by: user.id, submitted_at: new Date().toISOString(),
        data: { employer_id: employer?.id || null, submission_method: submissionMethod,
          period_start: periodStart, period_end: periodEnd,
          metrics: { participants_served: participantsServed, completions, placements, retention_90_day: retention90 },
          notes, submitted_from: 'employer_portal' },
      })
      .select('id,report_type,due_date,status,data,created_at')
      .single();
    if (reportError || !report) {
      logger.error('[employer/reports/submit] Failed to save complete report', reportError);
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 503 });
    }

    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'employer_report_submitted',
        resource_type: 'wioa_compliance_report',
        resource_id: report?.id,
        metadata: {
          period_start: periodStart,
          period_end: periodEnd,
          participants_served: participantsServed,
          completions,
          placements,
          retention_90_day: retention90,
        },
      })
      .then(undefined, (err) => logger.warn('[employer/reports/submit] audit log failed', err));

    return NextResponse.json(
      {
        success: true,
        report,
        message: 'Report submitted successfully',
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error('[employer/reports/submit] Unhandled error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/employer/reports/submit', _POST);
