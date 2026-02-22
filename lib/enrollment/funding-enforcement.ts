/**
 * Funding Pathway Enforcement
 * 
 * This module enforces the three funding pathways and prevents
 * enrollment without completed intake and assigned pathway.
 */

import { createClient } from '@/lib/supabase/server';
import {
  FundingPathway,
  IntakeStatus,
  IntakeRecord,
  BridgePaymentPlan,
  BRIDGE_PLAN_CONSTRAINTS,
  EMPLOYER_SPONSORSHIP_CONSTRAINTS,
} from '@/types/enrollment';

// =====================================================
// INTAKE VALIDATION
// =====================================================

export interface IntakeValidationResult {
  valid: boolean;
  errors: string[];
  canProceed: boolean;
  nextStep: IntakeStatus | null;
}

export async function validateIntakeCompletion(
  intakeId: string
): Promise<IntakeValidationResult> {
  const supabase = await createClient();
  
  const { data: intake, error } = await supabase
    .from('intake_records')
    .select('*')
    .eq('id', intakeId)
    .single();
  
  if (error || !intake) {
    return {
      valid: false,
      errors: ['Intake record not found'],
      canProceed: false,
      nextStep: null,
    };
  }
  
  const errors: string[] = [];
  
  // Check all required steps
  if (!intake.identity_verified) {
    errors.push('Identity verification not completed');
  }
  
  if (!intake.workforce_screening_completed) {
    errors.push('Workforce eligibility screening not completed');
  }
  
  if (!intake.employer_screening_completed) {
    errors.push('Employer sponsorship screening not completed');
  }
  
  // Financial readiness only required for structured tuition
  if (intake.funding_pathway === 'structured_tuition') {
    if (!intake.financial_readiness_completed) {
      errors.push('Financial readiness confirmation not completed');
    }
    if (!intake.can_pay_down_payment) {
      errors.push('Down payment capability not confirmed');
    }
    if (!intake.can_commit_monthly) {
      errors.push('Monthly payment commitment not confirmed');
    }
    if (!intake.accepts_auto_payment) {
      errors.push('Auto-payment acceptance required');
    }
    if (!intake.understands_90_day_limit) {
      errors.push('90-day limit acknowledgment required');
    }
  }
  
  if (!intake.program_readiness_completed) {
    errors.push('Program readiness confirmation not completed');
  }
  
  if (!intake.funding_pathway) {
    errors.push('Funding pathway not assigned');
  }
  
  if (!intake.acknowledgment_signed) {
    errors.push('Acknowledgment not signed');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    canProceed: errors.length === 0,
    nextStep: errors.length === 0 ? null : determineNextStep(intake),
  };
}

function determineNextStep(intake: any): IntakeStatus {
  if (!intake.identity_verified) return 'identity_pending';
  if (!intake.workforce_screening_completed) return 'workforce_screening';
  if (!intake.employer_screening_completed) return 'employer_screening';
  if (!intake.financial_readiness_completed && intake.funding_pathway === 'structured_tuition') {
    return 'financial_readiness';
  }
  if (!intake.program_readiness_completed) return 'program_readiness';
  if (!intake.acknowledgment_signed) return 'pending_signature';
  return 'completed';
}

// =====================================================
// ENROLLMENT ENFORCEMENT
// =====================================================

export interface EnrollmentValidationResult {
  canEnroll: boolean;
  errors: string[];
  fundingPathway: FundingPathway | null;
}

export async function validateEnrollmentEligibility(
  userId: string,
  programId: string
): Promise<EnrollmentValidationResult> {
  const supabase = await createClient();
  
  // Check for completed intake
  const { data: intake, error } = await supabase
    .from('intake_records')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .eq('status', 'completed')
    .single();
  
  if (error || !intake) {
    return {
      canEnroll: false,
      errors: ['Intake not completed. Complete intake before enrollment.'],
      fundingPathway: null,
    };
  }
  
  // Validate intake completion
  const validation = await validateIntakeCompletion(intake.id);
  
  if (!validation.valid) {
    return {
      canEnroll: false,
      errors: validation.errors,
      fundingPathway: null,
    };
  }
  
  // Verify funding pathway is assigned
  if (!intake.funding_pathway) {
    return {
      canEnroll: false,
      errors: ['Funding pathway not assigned'],
      fundingPathway: null,
    };
  }
  
  return {
    canEnroll: true,
    errors: [],
    fundingPathway: intake.funding_pathway as FundingPathway,
  };
}

// =====================================================
// BRIDGE PAYMENT PLAN ENFORCEMENT
// =====================================================

export interface BridgePlanValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateBridgePlanTerms(
  downPayment: number,
  monthlyPayment: number,
  termMonths: number
): BridgePlanValidationResult {
  const errors: string[] = [];
  
  if (downPayment < BRIDGE_PLAN_CONSTRAINTS.MIN_DOWN_PAYMENT) {
    errors.push(`Down payment must be at least $${BRIDGE_PLAN_CONSTRAINTS.MIN_DOWN_PAYMENT}`);
  }
  
  if (monthlyPayment < BRIDGE_PLAN_CONSTRAINTS.MIN_MONTHLY_PAYMENT) {
    errors.push(`Monthly payment must be at least $${BRIDGE_PLAN_CONSTRAINTS.MIN_MONTHLY_PAYMENT}`);
  }
  
  if (termMonths > BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_MONTHS) {
    errors.push(`Payment plan cannot exceed ${BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_MONTHS} months`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function createBridgePaymentPlan(
  enrollmentId: string,
  userId: string,
  totalAmount: number
): Promise<{ success: boolean; planId?: string; error?: string }> {
  const supabase = await createClient();
  
  // Validate terms
  const validation = validateBridgePlanTerms(
    BRIDGE_PLAN_CONSTRAINTS.MIN_DOWN_PAYMENT,
    BRIDGE_PLAN_CONSTRAINTS.MIN_MONTHLY_PAYMENT,
    BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_MONTHS
  );
  
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') };
  }
  
  const planStartDate = new Date();
  const planEndDate = new Date();
  planEndDate.setDate(planEndDate.getDate() + BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_DAYS);
  
  const { data, error } = await supabase
    .from('bridge_payment_plans')
    .insert({
      enrollment_id: enrollmentId,
      user_id: userId,
      down_payment_amount: BRIDGE_PLAN_CONSTRAINTS.MIN_DOWN_PAYMENT,
      monthly_payment_amount: BRIDGE_PLAN_CONSTRAINTS.MIN_MONTHLY_PAYMENT,
      max_term_months: BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_MONTHS,
      total_amount: totalAmount,
      plan_start_date: planStartDate.toISOString().split('T')[0],
      plan_end_date: planEndDate.toISOString().split('T')[0],
      auto_payment_enabled: true,
      credential_hold: true,
    })
    .select('id')
    .single();
  
  if (error) {
    return { success: false, error: 'Operation failed' };
  }
  
  return { success: true, planId: data.id };
}

// =====================================================
// CREDENTIAL ISSUANCE ENFORCEMENT
// =====================================================

export async function canIssueCredential(
  enrollmentId: string
): Promise<{ canIssue: boolean; reason?: string }> {
  const supabase = await createClient();
  
  // Check for outstanding balance
  const { data: plan } = await supabase
    .from('bridge_payment_plans')
    .select('balance_remaining, status')
    .eq('enrollment_id', enrollmentId)
    .single();
  
  if (plan && plan.balance_remaining > 0) {
    return {
      canIssue: false,
      reason: `Outstanding balance of $${plan.balance_remaining}. Credential cannot be issued until balance is resolved.`,
    };
  }
  
  // Check enrollment status
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('status, intake_completed, funding_pathway')
    .eq('id', enrollmentId)
    .single();
  
  if (!enrollment) {
    return { canIssue: false, reason: 'Enrollment not found' };
  }
  
  if (!enrollment.intake_completed) {
    return { canIssue: false, reason: 'Intake not completed' };
  }
  
  if (enrollment.status !== 'completed') {
    return { canIssue: false, reason: 'Program not completed' };
  }
  
  return { canIssue: true };
}

// =====================================================
// ACADEMIC ACCESS ENFORCEMENT
// =====================================================

export async function checkAcademicAccess(
  userId: string,
  enrollmentId: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  const supabase = await createClient();
  
  // Check enrollment status
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('status, funding_pathway')
    .eq('id', enrollmentId)
    .eq('user_id', userId)
    .single();
  
  if (!enrollment) {
    return { hasAccess: false, reason: 'Enrollment not found' };
  }
  
  if (enrollment.status === 'paused') {
    return { hasAccess: false, reason: 'Enrollment paused due to payment issue' };
  }
  
  if (enrollment.status !== 'active') {
    return { hasAccess: false, reason: `Enrollment status: ${enrollment.status}` };
  }
  
  // For structured tuition, check payment plan status
  if (enrollment.funding_pathway === 'structured_tuition') {
    const { data: plan } = await supabase
      .from('bridge_payment_plans')
      .select('academic_access_paused, academic_access_paused_reason, down_payment_paid')
      .eq('enrollment_id', enrollmentId)
      .single();
    
    if (plan) {
      if (!plan.down_payment_paid) {
        return { hasAccess: false, reason: 'Down payment required before access' };
      }
      
      if (plan.academic_access_paused) {
        return { 
          hasAccess: false, 
          reason: plan.academic_access_paused_reason || 'Access paused due to payment issue' 
        };
      }
    }
  }
  
  return { hasAccess: true };
}

// =====================================================
// EMPLOYER SPONSORSHIP ENFORCEMENT
// =====================================================

export function validateEmployerSponsorshipTerms(
  monthlyReimbursement: number,
  termMonths: number
): BridgePlanValidationResult {
  const errors: string[] = [];
  
  if (monthlyReimbursement < EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_MONTHLY_REIMBURSEMENT) {
    errors.push(`Monthly reimbursement must be at least $${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_MONTHLY_REIMBURSEMENT}`);
  }
  
  if (monthlyReimbursement > EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_MONTHLY_REIMBURSEMENT) {
    errors.push(`Monthly reimbursement cannot exceed $${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_MONTHLY_REIMBURSEMENT}`);
  }
  
  if (termMonths < EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_TERM_MONTHS) {
    errors.push(`Term must be at least ${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_TERM_MONTHS} months`);
  }
  
  if (termMonths > EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_TERM_MONTHS) {
    errors.push(`Term cannot exceed ${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_TERM_MONTHS} months`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function handleEmployerSeparation(
  sponsorshipId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('employer_sponsorships')
    .update({
      employment_ended: true,
      employment_ended_at: new Date().toISOString(),
      employment_end_reason: reason,
      reimbursement_stopped_at: new Date().toISOString(),
      status: 'separated',
    })
    .eq('id', sponsorshipId);
  
  if (error) {
    return { success: false, error: 'Operation failed' };
  }
  
  return { success: true };
}

// =====================================================
// FUNDING PATHWAY ASSIGNMENT
// =====================================================

export async function assignFundingPathway(
  intakeId: string,
  pathway: FundingPathway,
  assignedBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  // Verify intake exists and is ready for pathway assignment
  const { data: intake } = await supabase
    .from('intake_records')
    .select('workforce_screening_completed, employer_screening_completed')
    .eq('id', intakeId)
    .single();
  
  if (!intake) {
    return { success: false, error: 'Intake record not found' };
  }
  
  if (!intake.workforce_screening_completed || !intake.employer_screening_completed) {
    return { success: false, error: 'Screening steps must be completed before pathway assignment' };
  }
  
  const { error } = await supabase
    .from('intake_records')
    .update({
      funding_pathway: pathway,
      funding_pathway_assigned_at: new Date().toISOString(),
      funding_pathway_assigned_by: assignedBy,
    })
    .eq('id', intakeId);
  
  if (error) {
    return { success: false, error: 'Operation failed' };
  }
  
  return { success: true };
}
