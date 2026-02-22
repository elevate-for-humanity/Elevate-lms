/**
 * Compliance Audit API
 * 
 * Generates and manages monthly compliance audits with auto-flagging.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { COMPLIANCE_THRESHOLDS } from '@/types/enrollment';
import { applyRateLimit } from '@/lib/api/withRateLimit';

// GET: Get audit for specific month/year or list all
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const auditId = searchParams.get('id');

  let query = db.from('compliance_audits').select('*');

  if (auditId) {
    query = query.eq('id', auditId);
  } else if (month && year) {
    query = query.eq('audit_month', parseInt(month)).eq('audit_year', parseInt(year));
  }

  const { data, error } = await query.order('audit_year', { ascending: false })
    .order('audit_month', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ audits: data });
}

// POST: Generate new audit for month/year
export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { month, year } = body;

  if (!month || !year) {
    return NextResponse.json({ error: 'Month and year required' }, { status: 400 });
  }

  // Check if audit already exists
  const { data: existing } = await db
    .from('compliance_audits')
    .select('id')
    .eq('audit_month', month)
    .eq('audit_year', year)
    .single();

  if (existing) {
    return NextResponse.json({ 
      error: 'Audit already exists for this period',
      auditId: existing.id 
    }, { status: 409 });
  }

  // Calculate date range for the audit period
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  // Gather enrollment data
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('id, funding_pathway, intake_completed, status, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const totalEnrollments = enrollments?.length || 0;
  const completedIntakes = enrollments?.filter(e => e.intake_completed).length || 0;
  const enrollmentsWithoutIntake = enrollments?.filter(e => !e.intake_completed && e.status !== 'pending').length || 0;

  // Count by funding pathway
  const workforceFunded = enrollments?.filter(e => e.funding_pathway === 'workforce_funded').length || 0;
  const employerSponsored = enrollments?.filter(e => e.funding_pathway === 'employer_sponsored').length || 0;
  const structuredTuition = enrollments?.filter(e => e.funding_pathway === 'structured_tuition').length || 0;

  const lane3Percentage = totalEnrollments > 0 
    ? (structuredTuition / totalEnrollments) * 100 
    : 0;

  // Check payment plans
  const { data: paymentPlans } = await db
    .from('bridge_payment_plans')
    .select('id, status, balance_remaining, plan_start_date, academic_access_paused')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const accountsCurrent = paymentPlans?.filter(p => p.status === 'active' && !p.academic_access_paused).length || 0;
  const accountsMissedPayment = paymentPlans?.filter(p => p.academic_access_paused).length || 0;
  const accountsPaused = paymentPlans?.filter(p => p.status === 'paused').length || 0;
  
  // Check for plans beyond 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const accountsBeyond90Days = paymentPlans?.filter(p => {
    const startDate = new Date(p.plan_start_date);
    return startDate < ninetyDaysAgo && p.balance_remaining > 0;
  }).length || 0;

  // Auto-flag issues
  const autoFlaggedIssues: Array<{ type: string; description: string; enrollmentId?: string }> = [];

  // Flag enrollments without intake
  if (enrollmentsWithoutIntake > 0) {
    autoFlaggedIssues.push({
      type: 'enrollment_without_intake',
      description: `${enrollmentsWithoutIntake} enrollment(s) without completed intake`,
    });
  }

  // Flag excessive Lane 3 usage
  if (lane3Percentage > COMPLIANCE_THRESHOLDS.MAX_LANE3_PERCENTAGE) {
    autoFlaggedIssues.push({
      type: 'excessive_lane3',
      description: `Lane 3 usage at ${lane3Percentage.toFixed(1)}% (threshold: ${COMPLIANCE_THRESHOLDS.MAX_LANE3_PERCENTAGE}%)`,
    });
  }

  // Flag accounts beyond 90 days
  if (accountsBeyond90Days > 0) {
    autoFlaggedIssues.push({
      type: 'accounts_beyond_90_days',
      description: `${accountsBeyond90Days} account(s) with balance beyond 90-day limit`,
    });
  }

  // Create audit record
  const { data: audit, error } = await db
    .from('compliance_audits')
    .insert({
      audit_month: month,
      audit_year: year,
      total_enrollments: totalEnrollments,
      completed_intakes: completedIntakes,
      enrollments_without_intake: enrollmentsWithoutIntake,
      workforce_funded_count: workforceFunded,
      employer_sponsored_count: employerSponsored,
      structured_tuition_count: structuredTuition,
      lane3_percentage: lane3Percentage,
      lane3_threshold_exceeded: lane3Percentage > COMPLIANCE_THRESHOLDS.MAX_LANE3_PERCENTAGE,
      accounts_current: accountsCurrent,
      accounts_missed_payment: accountsMissedPayment,
      accounts_paused: accountsPaused,
      accounts_beyond_90_days: accountsBeyond90Days,
      auto_flagged_issues: autoFlaggedIssues,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    auditId: audit.id,
    summary: {
      totalEnrollments,
      completedIntakes,
      enrollmentsWithoutIntake,
      lane3Percentage: lane3Percentage.toFixed(1),
      flaggedIssues: autoFlaggedIssues.length,
    }
  });
}

// PATCH: Update audit (manual entries, sign-offs)
export async function PATCH(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { auditId, action, data: actionData } = body;

  if (!auditId || !action) {
    return NextResponse.json({ error: 'auditId and action required' }, { status: 400 });
  }

  let updateData: Record<string, any> = {};

  switch (action) {
    case 'update_manual_entries':
      // Update manual review sections
      updateData = {
        script_samples_reviewed: actionData?.scriptSamplesReviewed,
        script_deviations_found: actionData?.scriptDeviationsFound,
        intake_files_reviewed: actionData?.intakeFilesReviewed,
        intake_issues_found: actionData?.intakeIssuesFound,
        executive_exceptions: actionData?.executiveExceptions,
        staff_exceptions: actionData?.staffExceptions,
        status: 'in_progress',
      };
      break;

    case 'sign_admissions_lead':
      updateData = {
        admissions_lead_signed: true,
        admissions_lead_signed_at: new Date().toISOString(),
        admissions_lead_id: user.id,
      };
      break;

    case 'sign_program_director':
      updateData = {
        program_director_signed: true,
        program_director_signed_at: new Date().toISOString(),
        program_director_id: user.id,
      };
      break;

    case 'sign_executive':
      updateData = {
        executive_signed: true,
        executive_signed_at: new Date().toISOString(),
        executive_id: user.id,
      };

      // Check if all signatures are complete
      const { data: audit } = await db
        .from('compliance_audits')
        .select('admissions_lead_signed, program_director_signed')
        .eq('id', auditId)
        .single();

      if (audit?.admissions_lead_signed && audit?.program_director_signed) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.status = 'pending_signoff';
      }
      break;

    case 'submit_for_signoff':
      updateData = {
        status: 'pending_signoff',
      };
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const { error } = await db
    .from('compliance_audits')
    .update(updateData)
    .eq('id', auditId);

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `Action '${action}' completed` });
}
