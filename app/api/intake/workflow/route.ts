/**
 * Intake Workflow API
 * 
 * Enforces step-based intake workflow before enrollment.
 * No enrollment can proceed without completed intake.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateIntakeCompletion } from '@/lib/enrollment/funding-enforcement';
import { IntakeStatus, FundingPathway } from '@/types/enrollment';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET: Retrieve intake record for user/program
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('programId');
  const intakeId = searchParams.get('intakeId');
  
  let query = db
    .from('intake_records')
    .select('*');
  
  if (intakeId) {
    query = query.eq('id', intakeId);
  } else if (programId) {
    query = query.eq('user_id', user.id).eq('program_id', programId);
  } else {
    query = query.eq('user_id', user.id);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
  return NextResponse.json({ intakes: data });
}

// POST: Create new intake record
async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { programId } = body;
  
  if (!programId) {
    return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
  }
  
  // Check for existing intake
  const { data: existing } = await db
    .from('intake_records')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('program_id', programId)
    .single();
  
  if (existing) {
    return NextResponse.json({ 
      error: 'Intake already exists',
      intakeId: existing.id,
      status: existing.status
    }, { status: 409 });
  }
  
  // Create new intake
  const { data, error } = await db
    .from('intake_records')
    .insert({
      user_id: user.id,
      program_id: programId,
      status: 'not_started',
      intake_started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  
  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
  return NextResponse.json({ 
    success: true, 
    intakeId: data.id,
    message: 'Intake started. Complete all steps before enrollment.'
  });
}

// PATCH: Update intake step
async function _PATCH(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { intakeId, step, data: stepData } = body;
  
  if (!intakeId || !step) {
    return NextResponse.json({ error: 'Intake ID and step required' }, { status: 400 });
  }
  
  // Verify ownership or staff role
  const { data: intake } = await db
    .from('intake_records')
    .select('user_id, status')
    .eq('id', intakeId)
    .single();
  
  if (!intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 });
  }
  
  // Check user role for staff operations
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  const isStaff = profile?.role && ['admin', 'advisor', 'super_admin'].includes(profile.role);
  
  if (intake.user_id !== user.id && !isStaff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // Process step update
  let updateData: Record<string, any> = {};
  let newStatus: IntakeStatus = intake.status;
  
  switch (step) {
    case 'identity':
      updateData = {
        identity_verified: stepData.verified,
        identity_verified_at: stepData.verified ? new Date().toISOString() : null,
        identity_document_type: stepData.documentType,
        status: 'identity_pending',
      };
      if (stepData.verified) {
        newStatus = 'workforce_screening';
      }
      break;
      
    case 'workforce_screening':
      updateData = {
        workforce_screening_completed: true,
        workforce_screening_at: new Date().toISOString(),
        workforce_eligible: stepData.eligible,
        workforce_agency: stepData.agency,
        workforce_case_manager: stepData.caseManager,
        workforce_funding_type: stepData.fundingType,
        status: 'employer_screening',
      };
      newStatus = 'employer_screening';
      break;
      
    case 'employer_screening':
      updateData = {
        employer_screening_completed: true,
        employer_screening_at: new Date().toISOString(),
        employer_eligible: stepData.eligible,
        employer_name: stepData.employerName,
        employer_contact: stepData.contact,
        employer_reimbursement_confirmed: stepData.reimbursementConfirmed,
      };
      // Determine next step based on pathway
      if (stepData.eligible) {
        newStatus = 'program_readiness';
      } else {
        newStatus = 'financial_readiness';
      }
      updateData.status = newStatus;
      break;
      
    case 'financial_readiness':
      // Only for structured tuition pathway
      updateData = {
        financial_readiness_completed: true,
        financial_readiness_at: new Date().toISOString(),
        can_pay_down_payment: stepData.canPayDownPayment,
        can_commit_monthly: stepData.canCommitMonthly,
        accepts_auto_payment: stepData.acceptsAutoPayment,
        understands_90_day_limit: stepData.understands90DayLimit,
        status: 'program_readiness',
      };
      
      // Validate all financial readiness requirements
      if (!stepData.canPayDownPayment || !stepData.canCommitMonthly || 
          !stepData.acceptsAutoPayment || !stepData.understands90DayLimit) {
        return NextResponse.json({ 
          error: 'All financial readiness requirements must be confirmed for structured tuition',
          canProceed: false
        }, { status: 400 });
      }
      newStatus = 'program_readiness';
      break;
      
    case 'program_readiness':
      updateData = {
        program_readiness_completed: true,
        program_readiness_at: new Date().toISOString(),
        start_date_confirmed: stepData.startDateConfirmed,
        attendance_requirements_understood: stepData.attendanceUnderstood,
        technology_access_confirmed: stepData.technologyConfirmed,
        time_commitment_acknowledged: stepData.timeCommitmentAcknowledged,
        outcome_expectations_explained: stepData.outcomeExpectationsExplained,
        status: 'pending_signature',
      };
      newStatus = 'pending_signature';
      break;
      
    case 'funding_pathway':
      // Staff only
      if (!isStaff) {
        return NextResponse.json({ error: 'Staff only operation' }, { status: 403 });
      }
      
      const pathway = stepData.pathway as FundingPathway;
      if (!['workforce_funded', 'employer_sponsored', 'structured_tuition'].includes(pathway)) {
        return NextResponse.json({ error: 'Invalid funding pathway' }, { status: 400 });
      }
      
      updateData = {
        funding_pathway: pathway,
        funding_pathway_assigned_at: new Date().toISOString(),
        funding_pathway_assigned_by: user.id,
      };
      break;
      
    case 'signature':
      if (!stepData.signed) {
        return NextResponse.json({ error: 'Signature required' }, { status: 400 });
      }
      
      updateData = {
        acknowledgment_signed: true,
        acknowledgment_signed_at: new Date().toISOString(),
        acknowledgment_signature_data: stepData.signatureData,
        acknowledgment_ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        status: 'completed',
        intake_completed_at: new Date().toISOString(),
      };
      newStatus = 'completed';
      break;
      
    default:
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  }
  
  // Update intake record
  const { error } = await db
    .from('intake_records')
    .update(updateData)
    .eq('id', intakeId);
  
  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  
  // If completed, validate entire intake
  if (newStatus === 'completed') {
    const validation = await validateIntakeCompletion(intakeId);
    if (!validation.valid) {
      // Revert status
      await db
        .from('intake_records')
        .update({ status: 'pending_signature' })
        .eq('id', intakeId);
      
      return NextResponse.json({ 
        error: 'Intake validation failed',
        errors: validation.errors
      }, { status: 400 });
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    status: newStatus,
    message: newStatus === 'completed' 
      ? 'Intake completed. You may now proceed with enrollment.'
      : `Step completed. Next: ${newStatus}`
  });
}
export const GET = withApiAudit('/api/intake/workflow', _GET);
export const POST = withApiAudit('/api/intake/workflow', _POST);
export const PATCH = withApiAudit('/api/intake/workflow', _PATCH);
