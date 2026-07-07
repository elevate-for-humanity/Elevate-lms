/**
 * POST /api/enrollment/decision
 * 
 * Evaluates enrollment eligibility for the Virtual Admissions Office.
 * Checks all conditions and returns decision.
 * 
 * This is the CORE decision engine that gates automatic enrollment.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { emitEvent } from '@/lib/platform/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface EnrollmentCheck {
  name: string;
  passed: boolean;
  required: boolean;
  failureReason?: string;
  details?: string;
}

interface EnrollmentDecisionResult {
  eligible: boolean;
  applicationId: string;
  checks: EnrollmentCheck[];
  failureReasons: string[];
  priority: number;
  recommendedAction: 'auto_enroll' | 'add_to_queue' | 'pending_requirements';
}

/**
 * Check 1: Application Fee
 * Returns true if fee is paid OR waiver is approved
 */
async function checkFeeSatisfied(
  db: any,
  applicationId: string,
  app: any
): Promise<EnrollmentCheck> {
  // Check if fee is paid
  const feePaid = app.payment_received_at || 
                  app.payment_status === 'completed' ||
                  app.payment_status === 'paid';

  // Check if waiver is approved
  const waiverApproved = app.fee_waiver === true || 
                         app.payment_status === 'waived';

  const passed = feePaid || waiverApproved;

  return {
    name: 'fee_satisfied',
    passed,
    required: true,
    failureReason: passed ? undefined : 'Application fee not paid and no waiver on file',
    details: feePaid ? 'Payment received' : waiverApproved ? 'Fee waived' : 'Payment required'
  };
}

/**
 * Check 2: Required Documents
 * Returns true if all required documents are approved
 */
async function checkDocumentsApproved(
  db: any,
  applicationId: string
): Promise<EnrollmentCheck> {
  const { data: docs } = await db
    .from('documents')
    .select('id, status, document_type')
    .eq('application_id', applicationId);

  if (!docs || docs.length === 0) {
    // No documents required for this application
    return {
      name: 'documents_approved',
      passed: true,
      required: true,
      details: 'No documents required'
    };
  }

  // Check for required documents that need approval
  const pendingDocs = docs.filter((d: any) => d.status !== 'approved');
  
  const passed = pendingDocs.length === 0;

  return {
    name: 'documents_approved',
    passed,
    required: true,
    failureReason: passed ? undefined : `${pendingDocs.length} document(s) require approval`,
    details: passed ? 'All documents approved' : `${pendingDocs.length} pending`
  };
}

/**
 * Check 3: PARiS Interview Completion
 * Returns true if PARiS interview is complete
 * 
 * Note: PARiS uses ai_interview_sessions table
 * Table: public.ai_interview_sessions
 */
async function checkPARISComplete(
  db: any,
  userId: string | null,
  applicationId: string
): Promise<EnrollmentCheck> {
  if (!userId) {
    return {
      name: 'paris_completed',
      passed: false,
      required: true,
      failureReason: 'No user account associated with application'
    };
  }

  // Check for PARiS/AI Interview session completion
  // Table: ai_interview_sessions (from 20260705000001_paris_career_guidance.sql)
  const { data: parisSession } = await db
    .from('ai_interview_sessions')
    .select('id, status, completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .maybeSingle();

  // Alternative: check for career_counseling_conversations
  if (!parisSession) {
    const { data: careerConv } = await db
      .from('career_counseling_conversations')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .maybeSingle();

    if (!careerConv) {
      return {
        name: 'paris_completed',
        passed: false,
        required: true,
        failureReason: 'PARiS career interview not completed'
      };
    }
  }

  return {
    name: 'paris_completed',
    passed: true,
    required: true,
    details: 'PARiS interview completed'
  };
}

/**
 * Check 4: Eligibility Verification
 * Returns true if workforce eligibility is verified OR self-pay
 */
async function checkEligibilityVerified(
  db: any,
  app: any
): Promise<EnrollmentCheck> {
  // Self-pay doesn't need eligibility verification
  if (app.funding_source === 'self_pay' || 
      app.funding_source === 'payment_plan' ||
      app.payment_status === 'paid') {
    return {
      name: 'eligibility_verified',
      passed: true,
      required: true,
      details: 'Self-pay (eligibility check not required)'
    };
  }

  // Workforce funding requires verification
  const verified = app.eligibility_status === 'verified' || 
                   app.eligibility_status === 'approved' ||
                   app.eligibility_verified_at !== null;

  return {
    name: 'eligibility_verified',
    passed: verified,
    required: true,
    failureReason: verified ? undefined : 'Workforce eligibility not yet verified',
    details: verified ? 'Eligibility verified' : 'Pending verification'
  };
}

/**
 * Check 5: Funding Approval
 * Returns true if funding is approved OR self-pay
 */
async function checkFundingApproved(
  db: any,
  app: any
): Promise<EnrollmentCheck> {
  // Self-pay is always approved
  if (app.funding_source === 'self_pay' || 
      app.funding_source === 'payment_plan') {
    return {
      name: 'funding_approved',
      passed: true,
      required: true,
      details: 'Self-pay selected'
    };
  }

  // For workforce funding, check approval status
  const approved = app.funding_status === 'approved' ||
                   app.funding_status === 'verified' ||
                   app.payment_status === 'paid';

  return {
    name: 'funding_approved',
    passed: approved,
    required: true,
    failureReason: approved ? undefined : 'Funding not yet approved',
    details: approved ? 'Funding approved' : 'Awaiting funding approval'
  };
}

/**
 * Check 6: Application Completeness
 * Returns true if application has all required fields
 */
async function checkApplicationComplete(
  db: any,
  applicationId: string,
  app: any
): Promise<EnrollmentCheck> {
  const requiredFields = ['first_name', 'last_name', 'email', 'phone'];
  const missingFields = requiredFields.filter(
    field => !app[field] || app[field].trim() === ''
  );

  const passed = missingFields.length === 0;

  return {
    name: 'application_complete',
    passed,
    required: true,
    failureReason: passed ? undefined : `Missing required fields: ${missingFields.join(', ')}`,
    details: passed ? 'All required fields present' : `${missingFields.length} missing`
  };
}

/**
 * Check 7: User Account Exists
 * Returns true if user account is created
 */
async function checkUserAccount(
  db: any,
  userId: string | null
): Promise<EnrollmentCheck> {
  const passed = userId !== null && userId !== undefined;

  return {
    name: 'user_account_exists',
    passed,
    required: true,
    failureReason: passed ? undefined : 'Student account not yet created',
    details: passed ? 'User account exists' : 'No user account'
  };
}

/**
 * Calculate priority based on failure reasons
 * 1 = urgent, 2 = high, 3 = medium, 4 = low, 5 = normal
 */
function calculatePriority(failureReasons: string[]): number {
  const urgentFlags = ['identity', 'compliance', 'fraud'];
  const highFlags = ['documents', 'fee', 'payment', 'account'];
  const mediumFlags = ['funding', 'eligibility', 'paris'];

  for (const reason of failureReasons) {
    const lower = reason.toLowerCase();
    if (urgentFlags.some(f => lower.includes(f))) return 1;
    if (highFlags.some(f => lower.includes(f))) return 2;
    if (mediumFlags.some(f => lower.includes(f))) return 3;
  }
  return 4;
}

/**
 * MAIN DECISION ENDPOINT
 * 
 * POST /api/enrollment/decision
 * Body: { applicationId: string }
 * 
 * Returns: EnrollmentDecisionResult
 */
export async function POST(req: NextRequest) {
  try {
    const db = await requireAdminClient();
    const body = await req.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    // Get application
    const { data: app, error: appError } = await db
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    logger.info('[enrollment/decision] Evaluating application', {
      applicationId,
      email: app.email,
      status: app.status
    });

    // Run all checks in parallel for performance
    const [
      feeCheck,
      docsCheck,
      parisCheck,
      eligibilityCheck,
      fundingCheck,
      completenessCheck,
      userCheck
    ] = await Promise.all([
      checkFeeSatisfied(db, applicationId, app),
      checkDocumentsApproved(db, applicationId),
      checkPARISComplete(db, app.user_id, applicationId),
      checkEligibilityVerified(db, app),
      checkFundingApproved(db, app),
      checkApplicationComplete(db, applicationId, app),
      checkUserAccount(db, app.user_id)
    ]);

    const checks: EnrollmentCheck[] = [
      completenessCheck,
      userCheck,
      feeCheck,
      docsCheck,
      parisCheck,
      eligibilityCheck,
      fundingCheck
    ];

    // Determine results
    const requiredChecks = checks.filter(c => c.required);
    const passedChecks = requiredChecks.filter(c => c.passed);
    const failedChecks = requiredChecks.filter(c => !c.passed);
    const failureReasons = failedChecks.map(c => c.failureReason).filter(Boolean) as string[];

    const eligible = passedChecks.length === requiredChecks.length;
    const priority = eligible ? 5 : calculatePriority(failureReasons);

    const result: EnrollmentDecisionResult = {
      eligible,
      applicationId,
      checks,
      failureReasons,
      priority,
      recommendedAction: eligible 
        ? 'auto_enroll' 
        : failureReasons.length > 0 
          ? 'add_to_queue' 
          : 'pending_requirements'
    };

    // Log decision
    logger.info('[enrollment/decision] Decision made', {
      applicationId,
      eligible,
      passed: passedChecks.length,
      failed: failedChecks.length,
      priority
    });

    // Emit event for tracking
    await emitEvent('enrollment.decision_made', 'application', {
      payload: {
        application_id: applicationId,
        eligible,
        failure_reasons: failureReasons,
        priority
      }
    }).then(() => {}, () => {});

    return NextResponse.json({
      success: true,
      decision: result,
      summary: {
        total_checks: requiredChecks.length,
        passed: passedChecks.length,
        failed: failedChecks.length,
        eligible_for_auto_enrollment: eligible
      }
    });

  } catch (error) {
    logger.error('[enrollment/decision] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrollment/decision
 * 
 * Get current enrollment status for an application
 * 
 * Query params: applicationId
 */
export async function GET(req: NextRequest) {
  try {
    const db = await requireAdminClient();
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    // Get application with enrollment status
    const { data: app } = await db
      .from('applications')
      .select('id, status, enrollment_stage, failure_reasons, queue_priority, assigned_reviewer, queue_entered_at')
      .eq('id', applicationId)
      .single();

    if (!app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get queue info if in manual review
    let queueInfo = null;
    if (app.enrollment_stage === 'manual_review' || app.queue_entered_at) {
      const { data: queue } = await db
        .from('admin_applications_queue')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();
      
      queueInfo = queue;
    }

    return NextResponse.json({
      success: true,
      application: {
        id: app.id,
        status: app.status,
        enrollment_stage: app.enrollment_stage,
        failure_reasons: app.failure_reasons,
        priority: app.queue_priority,
        assigned_reviewer: app.assigned_reviewer,
        queue_entered_at: app.queue_entered_at
      },
      queue: queueInfo
    });

  } catch (error) {
    logger.error('[enrollment/decision] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
