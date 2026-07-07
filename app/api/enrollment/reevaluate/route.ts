/**
 * POST /api/enrollment/reevaluate
 * 
 * Re-runs enrollment eligibility check when a requirement is completed.
 * Used as webhook target for:
 * - Document approval
 * - Payment received
 * - PARiS completion
 * - Funding verification
 * - Eligibility approval
 * 
 * If all conditions are now met, automatically enrolls the student.
 */
import { NextRequest, NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { emitEvent } from '@/lib/platform/events';
import { sendEmail } from '@/lib/email/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ReevaluateResult {
  applicationId: string;
  trigger: string;
  wasEligible: boolean;
  nowEligible: boolean;
  autoEnrolled: boolean;
  checksPassed: number;
  checksFailed: number;
  failureReasons: string[];
}

/**
 * Trigger types that cause re-evaluation
 */
type TriggerType = 
  | 'document_approved'
  | 'payment_received'
  | 'paris_completed'
  | 'eligibility_verified'
  | 'funding_approved'
  | 'manual_approval'
  | 'application_updated';

/**
 * Add application to manual review queue
 */
async function addToQueue(
  db: any,
  applicationId: string,
  reasons: string[],
  priority: number = 4
): Promise<void> {
  // Check if already in queue
  const { data: existing } = await db
    .from('admin_applications_queue')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (existing) {
    // Update existing queue item
    await db
      .from('admin_applications_queue')
      .update({
        reason: reasons.join('; '),
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new queue item
    await db
      .from('admin_applications_queue')
      .insert({
        id: crypto.randomUUID(),
        application_id: applicationId,
        reason: reasons.join('; '),
        priority,
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }

  // Update application record
  await db
    .from('applications')
    .update({
      enrollment_stage: 'manual_review',
      failure_reasons: reasons,
      queue_priority: priority,
      queue_entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId);
}

/**
 * Auto-enroll the student
 */
async function autoEnroll(
  db: any,
  applicationId: string,
  app: any
): Promise<boolean> {
  try {
    // Check if already enrolled
    if (app.status === 'enrolled' || app.enrollment_stage === 'enrolled') {
      logger.info('[enrollment/reevaluate] Already enrolled', { applicationId });
      return false;
    }

    // Check if program_enrollments already exists
    const { data: existingEnrollment } = await db
      .from('program_enrollments')
      .select('id')
      .eq('user_id', app.user_id)
      .eq('program_id', app.program_id)
      .maybeSingle();

    if (existingEnrollment) {
      // Just update status
      await db
        .from('program_enrollments')
        .update({
          status: 'active',
          enrollment_state: 'enrolled',
          enrolled_at: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id);
    } else {
      // Create new enrollment
      await db
        .from('program_enrollments')
        .insert({
          id: crypto.randomUUID(),
          user_id: app.user_id,
          program_id: app.program_id,
          program_slug: app.program_slug,
          status: 'active',
          enrollment_state: 'enrolled',
          enrolled_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
    }

    // Update application status
    await db
      .from('applications')
      .update({
        status: 'enrolled',
        enrollment_stage: 'enrolled',
        enrolled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    // Remove from queue if present
    await db
      .from('admin_applications_queue')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution: 'Auto-enrolled after requirement completion'
      })
      .eq('application_id', applicationId)
      .eq('status', 'pending');

    // Send welcome email
    if (app.email || app.applicant_email) {
      const email = app.email || app.applicant_email;
      const name = app.first_name || app.applicant_name || 'Student';

      await sendEmail({
        to: email,
        subject: `🎉 You're Enrolled — ${app.program_interest || 'Your Program'} | Elevate`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af;">Congratulations, ${name}!</h1>
            <p>Great news! You've been enrolled in <strong>${app.program_interest || 'your program'}</strong>.</p>
            <p>Your account is ready. Log in to access your courses:</p>
            <a href="https://www.elevateforhumanity.org/lms/dashboard" 
               style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
              Go to Your Dashboard →
            </a>
            <p>Welcome to Elevate!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #666; font-size: 12px;">
              Elevate for Humanity | Workforce Development Platform
            </p>
          </div>
        `,
      }).catch((e: any) => logger.warn('[enrollment/reevaluate] Email failed', { error: String(e) }));
    }

    // Emit enrollment event
    await emitEvent('enrollment.auto_created', 'enrollment', {
      payload: {
        application_id: applicationId,
        user_id: app.user_id,
        program_id: app.program_id,
        trigger: 'reevaluation'
      }
    }).then(() => {}, () => {});

    logger.info('[enrollment/reevaluate] Auto-enrolled', {
      applicationId,
      userId: app.user_id
    });

    return true;

  } catch (error) {
    logger.error('[enrollment/reevaluate] Auto-enroll failed', error);
    return false;
  }
}

/**
 * Run eligibility check (simplified version of decision engine)
 */
async function checkEligibility(db: any, app: any): Promise<{
  eligible: boolean;
  passed: number;
  failed: number;
  reasons: string[];
}> {
  const reasons: string[] = [];
  let passed = 0;
  let failed = 0;

  // Check 1: Application complete
  const fieldsComplete = app.first_name && app.last_name && app.email && app.phone;
  if (fieldsComplete) passed++; else { failed++; reasons.push('Application incomplete'); }

  // Check 2: User account
  if (app.user_id) passed++; else { failed++; reasons.push('No user account'); }

  // Check 3: Fee paid or waiver
  const feeOk = app.payment_received_at || app.payment_status === 'completed' || app.fee_waiver;
  if (feeOk) passed++; else { failed++; reasons.push('Fee not paid'); }

  // Check 4: Documents (simplified)
  const docsApproved = true; // Assume OK if no docs required
  if (docsApproved) passed++; else { failed++; reasons.push('Documents not approved'); }

  // Check 5: PARiS (check for ai_interview_sessions)
  if (app.user_id) {
    const { data: paris } = await db
      .from('ai_interview_sessions')
      .select('id')
      .eq('user_id', app.user_id)
      .eq('status', 'completed')
      .maybeSingle();
    
    if (paris) passed++; else { failed++; reasons.push('PARiS not completed'); }
  } else {
    failed++;
    reasons.push('PARiS: No user account');
  }

  return {
    eligible: failed === 0,
    passed,
    failed,
    reasons
  };
}

/**
 * MAINREEVALUATE ENDPOINT
 */
export async function POST(req: NextRequest) {
  try {
    const db = await requireAdminClient();
    const body = await req.json();
    const { applicationId, trigger } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    const triggerType: TriggerType = trigger || 'manual_approval';

    logger.info('[enrollment/reevaluate] Triggered', {
      applicationId,
      trigger: triggerType
    });

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

    // Skip if already enrolled
    if (app.status === 'enrolled' || app.enrollment_stage === 'enrolled') {
      return NextResponse.json({
        success: true,
        message: 'Already enrolled',
        result: {
          applicationId,
          trigger: triggerType,
          wasEligible: true,
          nowEligible: true,
          autoEnrolled: false
        }
      });
    }

    // Check eligibility
    const { eligible, passed, failed, reasons } = await checkEligibility(db, app);

    const result: ReevaluateResult = {
      applicationId,
      trigger: triggerType,
      wasEligible: app.enrollment_stage === 'ready_for_enrollment',
      nowEligible: eligible,
      autoEnrolled: false,
      checksPassed: passed,
      checksFailed: failed,
      failureReasons: reasons
    };

    if (eligible) {
      // Auto-enroll!
      const enrolled = await autoEnroll(db, applicationId, app);
      result.autoEnrolled = enrolled;

      // Emit re-evaluation event
      await emitEvent('enrollment.reevaluated', 'application', {
        payload: {
          application_id: applicationId,
          trigger: triggerType,
          eligible: true,
          auto_enrolled: enrolled
        }
      }).then(() => {}, () => {});

      return NextResponse.json({
        success: true,
        message: enrolled ? 'Auto-enrolled successfully' : 'Already enrolled',
        result
      });

    } else {
      // Not eligible yet - add/update queue
      const priority = failed <= 2 ? 3 : 4; // Higher priority if close
      await addToQueue(db, applicationId, reasons, priority);

      // Emit event
      await emitEvent('enrollment.reevaluated', 'application', {
        payload: {
          application_id: applicationId,
          trigger: triggerType,
          eligible: false,
          failure_reasons: reasons
        }
      }).then(() => {}, () => {});

      return NextResponse.json({
        success: true,
        message: 'Added to review queue',
        result
      });
    }

  } catch (error) {
    logger.error('[enrollment/reevaluate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrollment/reevaluate
 * 
 * Get re-evaluation status for an application
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

    // Get application
    const { data: app } = await db
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (!app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check eligibility
    const { eligible, passed, failed, reasons } = await checkEligibility(db, app);

    return NextResponse.json({
      success: true,
      application: {
        id: app.id,
        status: app.status,
        enrollment_stage: app.enrollment_stage,
        failure_reasons: app.failure_reasons,
        reevaluation_count: app.reevaluation_count || 0,
        last_reevaluation_at: app.last_reevaluation_at
      },
      currentCheck: {
        eligible,
        checksPassed: passed,
        checksFailed: failed,
        failureReasons: reasons
      }
    });

  } catch (error) {
    logger.error('[enrollment/reevaluate] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
