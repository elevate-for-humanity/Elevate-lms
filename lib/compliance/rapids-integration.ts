import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import { decryptSSN, formatSSN } from '@/lib/security/ssn-helper';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';
/**
 * RAPIDS Integration (Registered Apprenticeship Partners Information Data System)
 *
 * Integrates with DOL RAPIDS for apprenticeship reporting.
 * RAPIDS is the U.S. Department of Labor's system for tracking registered apprenticeships.
 */

export interface RAPIDSApprentice {
  first_name: string;
  last_name: string;
  ssn: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'X';
  race_ethnicity: string;
  veteran_status: boolean;

  // Apprenticeship details
  program_number: string; // From env: NEXT_PUBLIC_RAPIDS_PROGRAM_NUMBER
  sponsor_name: string; // From env: NEXT_PUBLIC_RAPIDS_SPONSOR_NAME
  occupation_code: string; // DOT code
  occupation_title: string;

  // Dates
  registration_date: string;
  completion_date?: string;
  cancellation_date?: string;
  cancellation_reason?: string;

  // Progress
  hours_completed: number;
  hours_required: number | null;
  related_instruction_hours: number;

  // Employment
  employer_name: string;
  employer_fein: string;
  wage_at_entry: number;
  current_wage: number;
}

export interface RAPIDSSubmission {
  submission_id: string;
  submission_date: string;
  apprentices: RAPIDSApprentice[];
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  errors?: string[];
}


/**
 * Prepare apprentice data for RAPIDS submission
 */
export async function prepareRAPIDSData(enrollmentIds: string[]): Promise<RAPIDSApprentice[]> {
  if (!enrollmentIds.length) return [];
  const ids = [...new Set(enrollmentIds)];
  const db = await requireAdminClient();
  const {data:rows,error} = await db.from('rapids_apprentices').select('*').in('enrollment_id',ids);
  if (error) throw error;
  if (rows?.length !== ids.length) throw new Error('RAPIDS_APPRENTICE_RECORDS_MISSING');
  const result: RAPIDSApprentice[] = [];
  for (const row of rows) {
    const context = await resolveApprenticeshipRuntimeContext(db,{enrollmentId:row.enrollment_id,requireRegisteredStandard:true});
    if (!context?.contract) throw new Error('RAPIDS_REGISTERED_CONTRACT_MISSING');
    const progress = await loadRegisteredApprenticeshipProgress(db,context);
    if (!row.ssn_encrypted || !['M','F','X'].includes(row.gender) || typeof row.veteran_status !== 'boolean' || row.wage_at_entry == null || row.current_wage == null) throw new Error('RAPIDS_REQUIRED_PERSONAL_OR_WAGE_DATA_MISSING');
    const record: RAPIDSApprentice = {
      first_name:row.first_name,last_name:row.last_name,ssn:formatSSN(decryptSSN(row.ssn_encrypted)),date_of_birth:row.date_of_birth,
      gender:row.gender,race_ethnicity:row.race_ethnicity,veteran_status:row.veteran_status,
      program_number:context.contract.sponsor.registrationNumber,sponsor_name:context.contract.sponsor.sponsor,
      occupation_code:context.contract.standard.rapidsCode,occupation_title:context.contract.standard.occupationTitle,
      registration_date:row.registration_date,completion_date:row.completion_date,cancellation_date:row.cancellation_date,cancellation_reason:row.cancellation_reason,
      hours_completed:progress.ojl.approvedHours,hours_required:context.contract.completion.fixedOjlCompletionHours,
      related_instruction_hours:progress.rti.verifiedHours,employer_name:row.employer_name,employer_fein:row.employer_fein,
      wage_at_entry:Number(row.wage_at_entry),current_wage:Number(row.current_wage),
    };
    const validation=validateRAPIDSData(record);
    if (!validation.valid) throw new Error(`RAPIDS_DATA_INVALID:${row.enrollment_id}:${validation.errors.join('; ')}`);
    result.push(record);
  }
  return result;
}

/**
 * Submit apprentice data to RAPIDS
 */
export async function submitToRAPIDS(apprentices: RAPIDSApprentice[]): Promise<RAPIDSSubmission> {
  throw new Error('RAPIDS_SUBMISSION_UNAVAILABLE: no submission was sent and no agency receipt exists.');
}

/**
 * Update apprentice progress in RAPIDS
 */
export async function updateRAPIDSProgress(
  apprenticeId: string,
  hoursCompleted: number,
  relatedInstructionHours: number,
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'RAPIDS_PROGRESS_UNAVAILABLE: no agency update was submitted.' };
}

/**
 * Report apprentice completion to RAPIDS
 */
export async function reportRAPIDSCompletion(
  apprenticeId: string,
  completionDate: string,
  finalWage: number,
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'RAPIDS_COMPLETION_UNAVAILABLE: no completion was reported to the agency.' };
}

/**
 * Report apprentice cancellation to RAPIDS
 */
export async function reportRAPIDSCancellation(
  apprenticeId: string,
  cancellationDate: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'RAPIDS_CANCELLATION_UNAVAILABLE: no cancellation was reported to the agency.' };
}

/**
 * Generate RAPIDS compliance report
 */
export async function generateRAPIDSReport(): Promise<{
  total_apprentices: number; active_apprentices: number; completed_apprentices: number;
  cancelled_apprentices: number; average_completion_rate: string; pending_submissions: number;
  last_submission_date: string | null; next_submission_due: string | null;
}> {
  const db = await requireAdminClient();
  const counts = await Promise.all([
    db.from('rapids_apprentices').select('id',{count:'exact',head:true}),
    db.from('rapids_apprentices').select('id',{count:'exact',head:true}).eq('status','active'),
    db.from('rapids_apprentices').select('id',{count:'exact',head:true}).eq('status','completed'),
    db.from('rapids_apprentices').select('id',{count:'exact',head:true}).eq('status','cancelled'),
    db.from('rapids_submissions').select('id',{count:'exact',head:true}).eq('status','pending'),
  ]);
  for (const count of counts) { if(count.error) throw count.error; if(count.count == null) throw new Error('RAPIDS_REPORT_COUNT_MISSING'); }
  const {data:last,error} = await db.from('rapids_submissions').select('submission_date').not('rapids_confirmation_number','is',null).order('submission_date',{ascending:false}).limit(1).maybeSingle();
  if(error) throw error;
  const [total,active,completed,cancelled,pending] = counts.map(row=>row.count!);
  return {total_apprentices:total,active_apprentices:active,completed_apprentices:completed,cancelled_apprentices:cancelled,
    average_completion_rate:total?`${(completed/total*100).toFixed(1)}%`:'0%',pending_submissions:pending,
    last_submission_date:last?.submission_date ?? null,next_submission_due:null};
}

/**
 * Validate RAPIDS data before submission
 */
export function validateRAPIDSData(apprentice: RAPIDSApprentice): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!apprentice.first_name) errors.push('First name is required');
  if (!apprentice.last_name) errors.push('Last name is required');
  if (!apprentice.ssn) errors.push('SSN is required');
  if (!apprentice.date_of_birth) errors.push('Date of birth is required');
  if (!apprentice.program_number) errors.push('Program number is required');
  if (!apprentice.occupation_code) errors.push('Occupation code is required');
  if (!apprentice.registration_date) errors.push('Registration date is required');
  if (!apprentice.employer_name) errors.push('Employer name is required');
  if (!apprentice.employer_fein) errors.push('Employer FEIN is required');

  // Validate SSN format (XXX-XX-XXXX)
  if (apprentice.ssn && !/^\d{3}-\d{2}-\d{4}$/.test(apprentice.ssn)) {
    errors.push('SSN must be in format XXX-XX-XXXX');
  }

  // Validate dates
  if (apprentice.registration_date) {
    const regDate = new Date(apprentice.registration_date);
    if (isNaN(regDate.getTime())) {
      errors.push('Invalid registration date');
    }
  }

  // Validate hours
  if (apprentice.hours_completed < 0) {
    errors.push('Hours completed cannot be negative');
  }
  if (apprentice.hours_required != null && apprentice.hours_required <= 0) {
    errors.push('Hours required must be positive');
  }
  if (apprentice.hours_required != null && apprentice.hours_completed > apprentice.hours_required) {
    errors.push('Hours completed cannot exceed hours required');
  }

  // Validate wages
  if (apprentice.wage_at_entry < 0) {
    errors.push('Wage at entry cannot be negative');
  }
  if (apprentice.current_wage < 0) {
    errors.push('Current wage cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * DOT occupation codes for common apprenticeships
 */
export const DOT_CODES = {
  HVAC_TECHNICIAN: '637.261-014',
  ELECTRICIAN: '824.261-010',
  PLUMBER: '862.381-030',
  CARPENTER: '860.381-022',
  BARBER: '330.371-010',
  COSMETOLOGIST: '332.271-010',
  AUTOMOTIVE_TECHNICIAN: '620.261-010',
  WELDER: '810.384-014',
  MACHINIST: '600.280-022',
  CNC_OPERATOR: '604.382-010',
};
