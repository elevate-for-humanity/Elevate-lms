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
      .select('role, employer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['employer', 'admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Reporting period is required' }, { status: 400 });
    }

    const invalidMetric = [participantsServed, completions, placements, retention90].some(
      (n) => !Number.isFinite(n) || n < 0,
    );
    if (invalidMetric) {
      return NextResponse.json({ error: 'Metrics must be non-negative numbers' }, { status: 400 });
    }

    const reportPayload = {
      report_type: 'employer_wioa_submission',
      due_date: periodEnd,
      status: 'submitted',
      auto_generated: false,
      submission_method: submissionMethod,
      created_by: user.id,
      filters: JSON.stringify({
        employer_id: profile.employer_id || user.id,
        period_start: periodStart,
        period_end: periodEnd,
        metrics: {
          participants_served: participantsServed,
          completions,
          placements,
          retention_90_day: retention90,
        },
        notes,
        submitted_from: 'employer_portal',
      }),
    };

    let report: any = null;

    const insertPrimary = await supabase
      .from('wioa_compliance_reports')
      .insert(reportPayload)
      .select('id, report_type, due_date, status, submission_method, created_at')
      .maybeSingle();

    if (insertPrimary.error) {
      // Fallback for environments with reduced schema.
      const insertFallback = await supabase
        .from('wioa_compliance_reports')
        .insert({
          report_type: 'employer_wioa_submission',
          due_date: periodEnd,
          status: 'submitted',
        })
        .select('id, report_type, due_date, status, created_at')
        .maybeSingle();

      if (insertFallback.error) {
        logger.error('[employer/reports/submit] Failed to insert report', insertFallback.error);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
      }

      report = insertFallback.data;
    } else {
      report = insertPrimary.data;
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
