import { logger } from '@/lib/logger';

/**
 * Enrollment Actions - Server-side functions for creating and managing enrollments
 *
 * Handles:
 * - Creating new enrollments with funding selection
 * - Initializing module progress
 * - Applying transfer hours
 * - Updating funding amounts
 */
'use server';
import { supabaseAdmin } from '../supabaseAdmin';
import { revalidatePath } from 'next/cache';
// ============================================================================
// TYPES
// ============================================================================
export interface CreateEnrollmentInput {
  student_id: string;
  program_id: string;
  funding_program_id: string;
  employer_of_record?: 'efh' | 'external_employer' | 'none';
  employer_name?: string;
  employer_contact_email?: string;
  employer_contact_phone?: string;
  start_date?: string;
  expected_end_date?: string;
  // Optional: set funding amounts immediately
  wage_rate_hour?: number;
  stipend_total_amount?: number;
  tuition_covered_amount?: number;
  external_case_id?: string;
}
export interface AddTransferHoursInput {
  enrollment_id: string;
  source_school_name: string;
  source_state: string;
  license_type?: string;
  hours_theory_submitted: number;
  hours_practical_submitted: number;
  hours_other_submitted?: number;
  proof_doc_path?: string;
  notes?: string;
}
export interface ApproveTransferHoursInput {
  transfer_hours_id: string;
  hours_theory_accepted: number;
  hours_practical_accepted: number;
  hours_other_accepted?: number;
  effective_date: string;
  notes?: string;
}
export interface UpdateFundingAmountsInput {
  enrollment_id: string;
  wage_rate_hour?: number;
  stipend_total_amount?: number;
  tuition_covered_amount?: number;
  external_case_id?: string;
}
// ============================================================================
// CREATE ENROLLMENT
// ============================================================================
export async function createEnrollment(input: CreateEnrollmentInput) {
  try {
    // 1. Verify student exists
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, first_name, last_name, email')
      .eq('id', input.student_id)
      .single();
    if (studentError || !student) {
      throw new Error(`Student not found: ${input.student_id}`);
    }
    // 2. Verify program exists and is active
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, slug, name, is_apprenticeship')
      .eq('id', input.program_id)
      .eq('active', true)
      .single();
    if (programError || !program) {
      throw new Error(`Program not found or inactive: ${input.program_id}`);
    }
    // 3. Verify funding program is allowed for this program
    const { data: fundingOption, error: fundingError } = await supabaseAdmin
      .from('program_funding_options')
      .select(
        `
        *,
        funding_program:funding_programs(*)
      `
      )
      .eq('program_id', input.program_id)
      .eq('funding_program_id', input.funding_program_id)
      .single();
    if (fundingError || !fundingOption) {
      throw new Error(`Funding program not allowed for this program`);
    }
    // 4. Check for existing active enrollment
    const { data: existingEnrollment } = await supabaseAdmin
      .from('student_enrollments')
      .select('id, status')
      .eq('student_id', input.student_id)
      .eq('program_id', input.program_id)
      .eq('status', 'active')
      .maybeSingle();
    if (existingEnrollment) {
      throw new Error(
        `Student already has an active enrollment in this program`
      );
    }
    // 5. Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('student_enrollments')
      .insert({
        student_id: input.student_id,
        program_id: input.program_id,
        funding_program_id: input.funding_program_id,
        employer_of_record: input.employer_of_record || 'efh',
        employer_name: input.employer_name,
        employer_contact_email: input.employer_contact_email,
        employer_contact_phone: input.employer_contact_phone,
        employer_pays_wage: false, // Default: state/funding pays, not EFH
        start_date: input.start_date || new Date().toISOString().split('T')[0],
        expected_end_date: input.expected_end_date,
        wage_rate_hour: input.wage_rate_hour,
        stipend_total_amount: input.stipend_total_amount,
        tuition_covered_amount: input.tuition_covered_amount,
        external_case_id: input.external_case_id,
        status: 'active',
      })
      .select()
      .single();
    if (enrollmentError || !enrollment) {
      // Error: $1
      throw new Error(
        `Failed to create enrollment: ${enrollmentError?.message}`
      );
    }
    // 6. Get all required modules for this program
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('course_modules')
      .select('id, title, is_required')
      .eq('program_id', input.program_id)
      .order('order_index');
    if (modulesError) {
      // Error: $1
      throw new Error(`Failed to fetch modules: ${modulesError.message}`);
    }
    // 7. Create module_progress rows for all required modules
    if (modules && modules.length > 0) {
      const moduleProgressRows = modules
        .filter((m) => m.is_required)
        .map((module) => ({
          enrollment_id: enrollment.id,
          module_id: module.id,
          status: 'not_started',
        }));
      const { error: progressError } = await supabaseAdmin
        .from('enrollment_module_progress')
        .insert(moduleProgressRows);
      if (progressError) {
        logger.error('Module progress error:', progressError);
        // Don't fail the whole enrollment, but log it
      } else {
        /* Module progress created successfully */
      }
    }
    // 8. If this is an apprenticeship program, create apprenticeship_enrollments record
    if (program.is_apprenticeship) {
      const { error: apprenticeError } = await supabaseAdmin
        .from('apprenticeship_enrollments')
        .insert({
          student_id: input.student_id,
          program_id: input.program_id,
          enrollment_id: enrollment.id,
          status: 'pending',
          related_instruction_hours: 0,
          on_the_job_hours: 0,
          transferred_related_instruction_hours: 0,
          transferred_ojt_hours: 0,
        });
      if (apprenticeError) {
        logger.error('Apprenticeship enrollment error:', apprenticeError);
        // Don't fail the whole enrollment
      } else {
        /* Apprenticeship enrollment created successfully */
      }
    }
    // 9. Revalidate relevant paths
    revalidatePath('/admin/enrollments');
    revalidatePath(`/admin/students/${input.student_id}`);
    revalidatePath(`/admin/programs/${program.slug}`);
    return {
      success: true,
      enrollment_id: enrollment.id,
      message: `Enrollment created successfully for ${student.first_name} ${student.last_name} in ${program.name}`,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error:
        'Operation failed',
    };
  }
}
// ============================================================================
// ADD TRANSFER HOURS
// ============================================================================
export async function addTransferHours(input: AddTransferHoursInput) {
  try {
    // 1. Verify enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('student_enrollments')
      .select('id, student_id, program_id')
      .eq('id', input.enrollment_id)
      .single();
    if (enrollmentError || !enrollment) {
      throw new Error(`Enrollment not found: ${input.enrollment_id}`);
    }
    // 2. Create transfer hours record
    const { data: transferHours, error: transferError } = await supabaseAdmin
      .from('transfer_hours')
      .insert({
        enrollment_id: input.enrollment_id,
        source_school_name: input.source_school_name,
        source_state: input.source_state,
        license_type: input.license_type,
        hours_theory_submitted: input.hours_theory_submitted,
        hours_practical_submitted: input.hours_practical_submitted,
        hours_other_submitted: input.hours_other_submitted || 0,
        hours_theory_accepted: 0, // Will be set when approved
        hours_practical_accepted: 0,
        hours_other_accepted: 0,
        proof_doc_path: input.proof_doc_path,
        notes: input.notes,
        status: 'pending',
      })
      .select()
      .single();
    if (transferError || !transferHours) {
      // Error: $1
      throw new Error(
        `Failed to create transfer hours: ${transferError?.message}`
      );
    }
    // 3. Revalidate paths
    revalidatePath(`/admin/enrollments/${input.enrollment_id}`);
    revalidatePath(`/admin/students/${enrollment.student_id}/transfer-hours`);
    return {
      success: true,
      transfer_hours_id: transferHours.id,
      message: `Transfer hours from ${input.source_school_name} (${input.source_state}) added successfully. Status: Pending Review`,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error:
        'Operation failed',
    };
  }
}
// ============================================================================
// APPROVE TRANSFER HOURS
// ============================================================================
export async function approveTransferHours(input: ApproveTransferHoursInput) {
  try {
    // 1. Get transfer hours record
    const { data: transferHours, error: fetchError } = await supabaseAdmin
      .from('transfer_hours')
      .select(
        `
        *,
        enrollment:student_enrollments(
          id,
          student_id,
          program_id,
          program:programs(is_apprenticeship)
        )
      `
      )
      .eq('id', input.transfer_hours_id)
      .single();
    if (fetchError || !transferHours) {
      throw new Error(
        `Transfer hours record not found: ${input.transfer_hours_id}`
      );
    }
    // 2. Validate accepted hours don't exceed submitted hours
    if (input.hours_theory_accepted > transferHours.hours_theory_submitted) {
      throw new Error(
        `Accepted theory hours (${input.hours_theory_accepted}) cannot exceed submitted hours (${transferHours.hours_theory_submitted})`
      );
    }
    if (
      input.hours_practical_accepted > transferHours.hours_practical_submitted
    ) {
      throw new Error(
        `Accepted practical hours (${input.hours_practical_accepted}) cannot exceed submitted hours (${transferHours.hours_practical_submitted})`
      );
    }
    // 3. Update transfer hours record
    const { error: updateError } = await supabaseAdmin
      .from('transfer_hours')
      .update({
        hours_theory_accepted: input.hours_theory_accepted,
        hours_practical_accepted: input.hours_practical_accepted,
        hours_other_accepted: input.hours_other_accepted || 0,
        effective_date: input.effective_date,
        status: 'approved',
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.transfer_hours_id);
    if (updateError) {
      // Error: $1
      throw new Error(
        `Failed to approve transfer hours: ${updateError.message}`
      );
    }
    // 4. If this is an apprenticeship, update apprenticeship_enrollments
    if (transferHours.enrollment?.program?.is_apprenticeship) {
      // Calculate total transferred hours for this enrollment
      const { data: allTransfers } = await supabaseAdmin
        .from('transfer_hours')
        .select(
          'hours_theory_accepted, hours_practical_accepted, hours_other_accepted'
        )
        .eq('enrollment_id', transferHours.enrollment_id)
        .eq('status', 'approved');
      if (allTransfers) {
        const totalTheory = allTransfers.reduce(
          (sum, t) => sum + (t.hours_theory_accepted || 0),
          0
        );
        const totalPractical = allTransfers.reduce(
          (sum, t) => sum + (t.hours_practical_accepted || 0),
          0
        );
        const totalOther = allTransfers.reduce(
          (sum, t) => sum + (t.hours_other_accepted || 0),
          0
        );
        // Update apprenticeship record
        await supabaseAdmin
          .from('apprenticeship_enrollments')
          .update({
            transferred_related_instruction_hours: totalTheory,
            transferred_ojt_hours: totalPractical + totalOther,
            updated_at: new Date().toISOString(),
          })
          .eq('enrollment_id', transferHours.enrollment_id);
      }
    }
    // 5. Revalidate paths
    revalidatePath(`/admin/enrollments/${transferHours.enrollment_id}`);
    revalidatePath(
      `/admin/students/${transferHours.enrollment?.student_id}/transfer-hours`
    );
    return {
      success: true,
      message: `Transfer hours approved: ${input.hours_theory_accepted} theory + ${input.hours_practical_accepted} practical hours`,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error:
        'Operation failed',
    };
  }
}
// ============================================================================
// REJECT TRANSFER HOURS
// ============================================================================
export async function rejectTransferHours(
  transfer_hours_id: string,
  reason: string
) {
  try {
    const { error } = await supabaseAdmin
      .from('transfer_hours')
      .update({
        status: 'rejected',
        notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transfer_hours_id);
    if (error) {
      throw new Error(
        `Failed to reject transfer hours: ${'Operation failed'}`
      );
    }
    return {
      success: true,
      message: 'Transfer hours rejected',
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error:
        'Operation failed',
    };
  }
}
// ============================================================================
// UPDATE FUNDING AMOUNTS
// ============================================================================
export async function updateFundingAmounts(input: UpdateFundingAmountsInput) {
  try {
    // 1. Verify enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('student_enrollments')
      .select('id, student_id')
      .eq('id', input.enrollment_id)
      .single();
    if (enrollmentError || !enrollment) {
      throw new Error(`Enrollment not found: ${input.enrollment_id}`);
    }
    // 2. Update funding amounts
    const { error: updateError } = await supabaseAdmin
      .from('student_enrollments')
      .update({
        wage_rate_hour: input.wage_rate_hour,
        stipend_total_amount: input.stipend_total_amount,
        tuition_covered_amount: input.tuition_covered_amount,
        external_case_id: input.external_case_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.enrollment_id);
    if (updateError) {
      // Error: $1
      throw new Error(
        `Failed to update funding amounts: ${updateError.message}`
      );
    }
    // 3. Revalidate paths
    revalidatePath(`/admin/enrollments/${input.enrollment_id}`);
    revalidatePath(`/admin/students/${enrollment.student_id}`);
    return {
      success: true,
      message: 'Funding amounts updated successfully',
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error:
        'Operation failed',
    };
  }
}
// ============================================================================
// GET ENROLLMENT WITH FULL DETAILS
// ============================================================================
export async function getEnrollmentDetails(enrollment_id: string) {
  try {
    const { data, error }: any = await supabaseAdmin
      .from('student_enrollments')
      .select(
        `
        *,
        student:students(*),
        program:programs(*),
        funding_program:funding_programs(*),
        transfer_hours(
          *,
          order: created_at.desc
        ),
        module_progress:enrollment_module_progress(
          *,
          module:course_modules(
            *,
            scorm_packages(*)
          )
        ),
        apprenticeship:apprenticeship_enrollments(*)
      `
      )
      .eq('id', enrollment_id)
      .single();
    if (error) {
      throw new Error(
        `Failed to fetch enrollment: ${'Operation failed'}`
      );
    }
    // Calculate hours summary
    const transferHours = data.transfer_hours || [];
    const approvedTransfers = transferHours.filter(
      (t: Record<string, any>) => t.status === 'approved'
    );
    const totalTransferredTheory = approvedTransfers.reduce(
      (data: any) => sum + (t.hours_theory_accepted || 0),
      0
    );
    const totalTransferredPractical = approvedTransfers.reduce(
      (data: any) => sum + (t.hours_practical_accepted || 0),
      0
    );
    const totalTransferredOther = approvedTransfers.reduce(
      (data: any) => sum + (t.hours_other_accepted || 0),
      0
    );
    return {
      success: true,
      data: {
        ...data,
        hours_summary: {
          transferred: {
            theory: totalTransferredTheory,
            practical: totalTransferredPractical,
            other: totalTransferredOther,
            total:
              totalTransferredTheory +
              totalTransferredPractical +
              totalTransferredOther,
          },
        },
      },
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error:
        'Operation failed',
    };
  }
}
