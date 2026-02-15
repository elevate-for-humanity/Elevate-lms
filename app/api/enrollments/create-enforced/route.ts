/**
 * Enforced Enrollment API
 * 
 * Creates enrollment ONLY after intake is completed and funding pathway assigned.
 * This endpoint replaces the legacy enrollment flow.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  validateEnrollmentEligibility,
  createBridgePaymentPlan,
} from '@/lib/enrollment/funding-enforcement';
import { FundingPathway, BRIDGE_PLAN_CONSTRAINTS } from '@/types/enrollment';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { programId } = await request.json();

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ENFORCEMENT: Validate intake completion and funding pathway
    const eligibility = await validateEnrollmentEligibility(user.id, programId);
    
    if (!eligibility.canEnroll) {
      return NextResponse.json({
        error: 'Enrollment blocked',
        reason: 'Intake not completed or funding pathway not assigned',
        details: eligibility.errors,
        action: 'Complete intake workflow before enrollment'
      }, { status: 403 });
    }

    // Get intake record for linking
    const { data: intake } = await supabase
      .from('intake_records')
      .select('id, funding_pathway, employer_name')
      .eq('user_id', user.id)
      .eq('program_id', programId)
      .eq('status', 'completed')
      .single();

    if (!intake) {
      return NextResponse.json({
        error: 'Completed intake record not found',
        action: 'Complete intake workflow before enrollment'
      }, { status: 403 });
    }

    // Check for existing enrollment
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('program_id', programId)
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'Already enrolled in this program',
        enrollmentId: existing.id,
        status: existing.status
      }, { status: 409 });
    }

    // Get program details for tuition amount
    const { data: program } = await supabase
      .from('programs')
      .select('price, name')
      .eq('id', programId)
      .single();

    const tuitionAmount = program?.price || 5000;

    // Create enrollment with funding pathway
    const enrollmentData: Record<string, any> = {
      user_id: user.id,
      program_id: programId,
      funding_pathway: intake.funding_pathway,
      intake_record_id: intake.id,
      intake_completed: true,
      status: 'pending', // Will be activated after payment setup
      enrolled_at: new Date().toISOString(),
    };

    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert(enrollmentData)
      .select('id')
      .single();

    if (enrollError) {
      logger.error('Enrollment creation error:', enrollError);
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    // Handle funding pathway specific setup
    let paymentSetup: any = null;

    switch (intake.funding_pathway as FundingPathway) {
      case 'workforce_funded':
        // No payment setup needed - funded by agency
        await supabase
          .from('enrollments')
          .update({ status: 'active', payment_status: 'paid' })
          .eq('id', enrollment.id);
        break;

      case 'employer_sponsored':
        // Create employer sponsorship record
        const { data: sponsorship } = await supabase
          .from('employer_sponsorships')
          .insert({
            enrollment_id: enrollment.id,
            user_id: user.id,
            employer_name: intake.employer_name || 'Pending',
            total_tuition: tuitionAmount,
            monthly_reimbursement: 300, // Default, can be adjusted
            term_months: 16, // Default, can be adjusted
            status: 'pending',
          })
          .select('id')
          .single();

        paymentSetup = {
          type: 'employer_sponsored',
          sponsorshipId: sponsorship?.id,
          message: 'Employer sponsorship record created. Awaiting agreement.'
        };
        break;

      case 'structured_tuition':
        // Create bridge payment plan
        const planResult = await createBridgePaymentPlan(
          enrollment.id,
          user.id,
          tuitionAmount
        );

        if (!planResult.success) {
          // Rollback enrollment
          await supabase
            .from('enrollments')
            .delete()
            .eq('id', enrollment.id);

          return NextResponse.json({
            error: 'Failed to create payment plan',
            details: planResult.error
          }, { status: 500 });
        }

        paymentSetup = {
          type: 'bridge_plan',
          planId: planResult.planId,
          downPaymentRequired: BRIDGE_PLAN_CONSTRAINTS.MIN_DOWN_PAYMENT,
          monthlyPayment: BRIDGE_PLAN_CONSTRAINTS.MIN_MONTHLY_PAYMENT,
          maxTermMonths: BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_MONTHS,
          message: 'Bridge payment plan created. Down payment required to activate enrollment.'
        };
        break;
    }

    logger.info('Enrollment created with enforcement', {
      enrollmentId: enrollment.id,
      userId: user.id,
      programId,
      fundingPathway: intake.funding_pathway,
    });

    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      fundingPathway: intake.funding_pathway,
      paymentSetup,
      message: intake.funding_pathway === 'workforce_funded'
        ? 'Enrollment activated. You may begin your program.'
        : intake.funding_pathway === 'employer_sponsored'
        ? 'Enrollment created. Awaiting employer agreement.'
        : 'Enrollment created. Complete down payment to activate access.'
    });

  } catch (error) {
    logger.error('Enforced enrollment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
