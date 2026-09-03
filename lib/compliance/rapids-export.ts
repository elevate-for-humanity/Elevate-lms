/**
 * RAPIDS bulk-upload export.
 *
 * Registered-apprenticeship facts must come from the same runtime contract and
 * progress services used by Host Shop and Apprentice surfaces. This exporter
 * must never invent 2,000 OJL hours, 144 RTI hours, a generic employer, or a
 * fixed completion denominator for a competency-based occupation.
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@/lib/supabase';
import { setAuditContext } from '@/lib/audit-context';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';
import { resolveApplicableWage } from '@/lib/apprenticeship/registered-program-contract';

async function getSupabaseAdmin(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration for RAPIDS export');
  return await requireAdminClient();
}

const REGISTRATION_HEADERS = [
  'Sponsor_Program_Number','Apprentice_Last_Name','Apprentice_First_Name','Apprentice_Middle_Name','SSN','Date_of_Birth','Gender','Race_Ethnicity','Veteran_Status','Disability_Status','Education_Level','Registration_Date','Occupation_Code','Occupation_Title','Term_Length_Hours','Related_Instruction_Hours','Employer_Name','Employer_FEIN','Employer_Address','Employer_City','Employer_State','Employer_Zip','Starting_Wage','Apprentice_Address','Apprentice_City','Apprentice_State','Apprentice_Zip','Apprentice_Phone','Apprentice_Email',
];
const PROGRESS_HEADERS = ['Sponsor_Program_Number','SSN','Apprentice_Last_Name','Apprentice_First_Name','Report_Date','OJT_Hours_Completed','RTI_Hours_Completed','Current_Wage','Status'];
const COMPLETION_HEADERS = ['Sponsor_Program_Number','SSN','Apprentice_Last_Name','Apprentice_First_Name','Completion_Date','Final_OJT_Hours','Final_RTI_Hours','Final_Wage','Certificate_Number'];
const CANCELLATION_HEADERS = ['Sponsor_Program_Number','SSN','Apprentice_Last_Name','Apprentice_First_Name','Cancellation_Date','Cancellation_Reason_Code','Cancellation_Reason_Description','OJT_Hours_At_Cancellation','RTI_Hours_At_Cancellation'];

export const CANCELLATION_REASONS = {
  '01': 'Voluntary - Personal reasons',
  '02': 'Voluntary - Found other employment',
  '03': 'Voluntary - Returned to school',
  '04': 'Voluntary - Military service',
  '05': 'Involuntary - Laid off',
  '06': 'Involuntary - Terminated for cause',
  '07': 'Involuntary - Business closed',
  '08': 'Involuntary - Failed to meet standards',
  '09': 'Transfer to another program',
  '10': 'Other',
} as const;

type ExportProfile = {
  id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  ssn_encrypted?: string | null;
  veteran_status?: boolean | null;
  disability_status?: boolean | null;
  education_level?: string | null;
  race_ethnicity?: string | null;
};

function splitName(fullName: string | null | undefined) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
  };
}

function actualWage(enrollment: Record<string, any>) {
  for (const value of [enrollment.current_wage, enrollment.starting_wage, enrollment.final_wage]) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  return null;
}

async function loadExportContext(supabase: SupabaseClient, enrollmentId: string) {
  const context = await resolveApprenticeshipRuntimeContext(supabase, {
    enrollmentId,
    requireRegisteredStandard: true,
  });
  if (!context?.contract) throw new Error(`REGISTERED_RUNTIME_CONTEXT_MISSING:${enrollmentId}`);
  return context;
}

export async function exportNewRegistrations(
  startDate?: string,
  endDate?: string,
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];
  const supabase = await getSupabaseAdmin();
  await setAuditContext(supabase, { systemActor: 'rapids_export' });

  let query = supabase
    .from('program_enrollments')
    .select(`*, profiles:user_id (id, full_name, email, phone, date_of_birth, gender, address, city, state, zip, ssn_encrypted, veteran_status, disability_status, education_level, race_ethnicity)`)
    .eq('rapids_submitted', false)
    .in('status', ['active', 'enrolled', 'in_progress', 'confirmed']);
  if (startDate) query = query.gte('enrolled_at', startDate);
  if (endDate) query = query.lte('enrolled_at', endDate);

  const { data: enrollments, error } = await query;
  if (error) return { csv: '', count: 0, errors: ['Export failed'] };
  if (!enrollments?.length) return { csv: '', count: 0, errors: ['No new registrations to export'] };

  const rows: string[][] = [];
  for (const enrollment of enrollments) {
    try {
      const profile = enrollment.profiles as ExportProfile | null;
      if (!profile) throw new Error('profile missing');
      const context = await loadExportContext(supabase, enrollment.id);
      const contract = context.contract!;
      const { firstName, lastName, middleName } = splitName(profile.full_name);
      const employerName = context.partner?.legal_name || context.partner?.dba || context.partner?.name || context.shop?.name || enrollment.employer_name || '';
      const startingWage = Number(enrollment.starting_wage) > 0
        ? Number(enrollment.starting_wage)
        : contract.employer?.wageSchedule?.startingHourlyRate ?? null;

      if (!employerName) errors.push(`Enrollment ${enrollment.id}: employer identity is missing`);
      if (startingWage == null) errors.push(`Enrollment ${enrollment.id}: starting wage is not recorded`);

      rows.push([
        contract.sponsor.registrationNumber,
        lastName,
        firstName,
        middleName,
        profile.ssn_encrypted ? '***-**-****' : '',
        formatDate(profile.date_of_birth),
        profile.gender || 'X',
        profile.race_ethnicity || '',
        profile.veteran_status ? 'Y' : 'N',
        profile.disability_status ? 'Y' : 'N',
        profile.education_level || '',
        formatDate(enrollment.enrolled_at || enrollment.created_at),
        contract.standard.rapidsCode,
        contract.standard.occupationTitle,
        contract.completion.fixedOjlCompletionHours == null ? '' : String(contract.completion.fixedOjlCompletionHours),
        String(contract.completion.requiredRtiHours),
        employerName,
        enrollment.employer_fein || '',
        enrollment.employer_address || context.shop?.address1 || '',
        enrollment.employer_city || context.shop?.city || '',
        enrollment.employer_state || context.shop?.state || '',
        enrollment.employer_zip || context.shop?.zip || '',
        startingWage == null ? '' : String(startingWage),
        profile.address || '',
        profile.city || '',
        profile.state || '',
        profile.zip || '',
        profile.phone || '',
        profile.email || '',
      ]);
    } catch (err) {
      errors.push(`Enrollment ${enrollment.id}: ${err instanceof Error ? err.message : 'registered contract unavailable'}`);
    }
  }

  return { csv: generateCSV(REGISTRATION_HEADERS, rows), count: rows.length, errors };
}

export async function exportProgressUpdates(
  reportDate: string = new Date().toISOString().split('T')[0],
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];
  const supabase = await getSupabaseAdmin();
  await setAuditContext(supabase, { systemActor: 'rapids_export' });

  const { data: enrollments, error } = await supabase
    .from('program_enrollments')
    .select(`*, profiles:user_id (id, full_name, ssn_encrypted)`)
    .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
    .eq('rapids_submitted', true);
  if (error) return { csv: '', count: 0, errors: ['Export failed'] };
  if (!enrollments?.length) return { csv: '', count: 0, errors: ['No active apprentices to report'] };

  const rows: string[][] = [];
  for (const enrollment of enrollments) {
    try {
      const profile = enrollment.profiles as ExportProfile | null;
      if (!profile) throw new Error('profile missing');
      const context = await loadExportContext(supabase, enrollment.id);
      const progress = await loadRegisteredApprenticeshipProgress(supabase, context);
      const wage = resolveApplicableWage(context.contract!, progress.competencies.completed);
      const recordedWage = actualWage(enrollment);
      const { firstName, lastName } = splitName(profile.full_name);

      if (recordedWage == null) {
        errors.push(`Enrollment ${enrollment.id}: current wage is not recorded; required floor is ${wage.requiredRegisteredRate}`);
      }

      rows.push([
        context.contract!.sponsor.registrationNumber,
        profile.ssn_encrypted ? '***-**-****' : '',
        lastName,
        firstName,
        reportDate,
        String(progress.ojl.approvedHours),
        String(progress.rti.verifiedHours),
        recordedWage == null ? '' : String(recordedWage),
        'Active',
      ]);
    } catch (err) {
      errors.push(`Enrollment ${enrollment.id}: ${err instanceof Error ? err.message : 'progress unavailable'}`);
    }
  }

  return { csv: generateCSV(PROGRESS_HEADERS, rows), count: rows.length, errors };
}

export async function exportCompletions(
  startDate?: string,
  endDate?: string,
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];
  const supabase = await getSupabaseAdmin();
  await setAuditContext(supabase, { systemActor: 'rapids_export' });

  let query = supabase
    .from('program_enrollments')
    .select(`*, profiles:user_id (id, full_name, ssn_encrypted)`)
    .eq('status', 'completed')
    .eq('rapids_completion_submitted', false);
  if (startDate) query = query.gte('completed_at', startDate);
  if (endDate) query = query.lte('completed_at', endDate);

  const { data: enrollments, error } = await query;
  if (error) return { csv: '', count: 0, errors: ['Export failed'] };
  if (!enrollments?.length) return { csv: '', count: 0, errors: ['No completions to export'] };

  const rows: string[][] = [];
  for (const enrollment of enrollments) {
    try {
      const profile = enrollment.profiles as ExportProfile | null;
      if (!profile) throw new Error('profile missing');
      const context = await loadExportContext(supabase, enrollment.id);
      const progress = await loadRegisteredApprenticeshipProgress(supabase, context);
      if (!progress.completionReady) {
        errors.push(`Enrollment ${enrollment.id}: completion blocked — ${progress.competencies.completed}/${progress.competencies.required} competencies and ${progress.rti.verifiedHours}/${progress.rti.requiredHours} RTI hours verified`);
        continue;
      }
      const { firstName, lastName } = splitName(profile.full_name);
      const finalWage = actualWage(enrollment);
      if (finalWage == null) errors.push(`Enrollment ${enrollment.id}: final wage is not recorded`);

      rows.push([
        context.contract!.sponsor.registrationNumber,
        profile.ssn_encrypted ? '***-**-****' : '',
        lastName,
        firstName,
        formatDate(enrollment.completed_at),
        String(progress.ojl.approvedHours),
        String(progress.rti.verifiedHours),
        finalWage == null ? '' : String(finalWage),
        enrollment.certificate_number || '',
      ]);
    } catch (err) {
      errors.push(`Enrollment ${enrollment.id}: ${err instanceof Error ? err.message : 'completion evidence unavailable'}`);
    }
  }

  return { csv: generateCSV(COMPLETION_HEADERS, rows), count: rows.length, errors };
}

export async function exportCancellations(
  startDate?: string,
  endDate?: string,
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];
  const supabase = await getSupabaseAdmin();
  await setAuditContext(supabase, { systemActor: 'rapids_export' });

  let query = supabase
    .from('program_enrollments')
    .select(`*, profiles:user_id (id, full_name, ssn_encrypted)`)
    .in('status', ['cancelled', 'terminated', 'withdrawn'])
    .eq('rapids_cancellation_submitted', false);
  if (startDate) query = query.gte('cancelled_at', startDate);
  if (endDate) query = query.lte('cancelled_at', endDate);

  const { data: enrollments, error } = await query;
  if (error) return { csv: '', count: 0, errors: ['Export failed'] };
  if (!enrollments?.length) return { csv: '', count: 0, errors: ['No cancellations to export'] };

  const rows: string[][] = [];
  for (const enrollment of enrollments) {
    try {
      const profile = enrollment.profiles as ExportProfile | null;
      if (!profile) throw new Error('profile missing');
      const context = await loadExportContext(supabase, enrollment.id);
      const progress = await loadRegisteredApprenticeshipProgress(supabase, context);
      const { firstName, lastName } = splitName(profile.full_name);
      const reasonCode = String(enrollment.cancellation_reason_code || '10') as keyof typeof CANCELLATION_REASONS;
      const reasonDesc = CANCELLATION_REASONS[reasonCode] || enrollment.cancellation_reason || 'Other';

      rows.push([
        context.contract!.sponsor.registrationNumber,
        profile.ssn_encrypted ? '***-**-****' : '',
        lastName,
        firstName,
        formatDate(enrollment.cancelled_at || enrollment.updated_at),
        reasonCode,
        reasonDesc,
        String(progress.ojl.approvedHours),
        String(progress.rti.verifiedHours),
      ]);
    } catch (err) {
      errors.push(`Enrollment ${enrollment.id}: ${err instanceof Error ? err.message : 'cancellation evidence unavailable'}`);
    }
  }

  return { csv: generateCSV(CANCELLATION_HEADERS, rows), count: rows.length, errors };
}

function generateCSV(headers: string[], rows: string[][]): string {
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  return [headers.map(escapeCSV).join(','), ...rows.map((row) => row.map(escapeCSV).join(','))].join('\n');
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

export async function markAsSubmitted(
  enrollmentIds: string[],
  type: 'registration' | 'completion' | 'cancellation',
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseAdmin();
  await setAuditContext(supabase, { systemActor: 'rapids_export' });
  const updateField = {
    registration: 'rapids_submitted',
    completion: 'rapids_completion_submitted',
    cancellation: 'rapids_cancellation_submitted',
  }[type];
  const { error } = await supabase
    .from('program_enrollments')
    .update({ [updateField]: true, [`${updateField}_at`]: new Date().toISOString() })
    .in('id', enrollmentIds);
  if (error) return { success: false, error: 'Operation failed' };
  return { success: true };
}
