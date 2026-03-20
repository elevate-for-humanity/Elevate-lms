/**
 * RAPIDS CSV Export for Bulk Upload
 * 
 * Generates CSV files formatted for RAPIDS bulk upload portal.
 * RAPIDS accepts CSV uploads for:
 * - New apprentice registrations
 * - Progress updates (hours)
 * - Completions
 * - Cancellations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RAPIDS_CONFIG } from './rapids-config';
import { setAuditContext } from '@/lib/audit-context';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase configuration for RAPIDS export');
  }
  
  return createClient(url, key);
}

/**
 * RAPIDS CSV Column Headers for New Registrations
 */
const REGISTRATION_HEADERS = [
  'Sponsor_Program_Number',
  'Apprentice_Last_Name',
  'Apprentice_First_Name',
  'Apprentice_Middle_Name',
  'SSN',
  'Date_of_Birth',
  'Gender',
  'Race_Ethnicity',
  'Veteran_Status',
  'Disability_Status',
  'Education_Level',
  'Registration_Date',
  'Occupation_Code',
  'Occupation_Title',
  'Term_Length_Hours',
  'Related_Instruction_Hours',
  'Employer_Name',
  'Employer_FEIN',
  'Employer_Address',
  'Employer_City',
  'Employer_State',
  'Employer_Zip',
  'Starting_Wage',
  'Apprentice_Address',
  'Apprentice_City',
  'Apprentice_State',
  'Apprentice_Zip',
  'Apprentice_Phone',
  'Apprentice_Email',
];

/**
 * RAPIDS CSV Column Headers for Progress Updates
 */
const PROGRESS_HEADERS = [
  'Sponsor_Program_Number',
  'SSN',
  'Apprentice_Last_Name',
  'Apprentice_First_Name',
  'Report_Date',
  'OJT_Hours_Completed',
  'RTI_Hours_Completed',
  'Current_Wage',
  'Status',
];

/**
 * RAPIDS CSV Column Headers for Completions
 */
const COMPLETION_HEADERS = [
  'Sponsor_Program_Number',
  'SSN',
  'Apprentice_Last_Name',
  'Apprentice_First_Name',
  'Completion_Date',
  'Final_OJT_Hours',
  'Final_RTI_Hours',
  'Final_Wage',
  'Certificate_Number',
];

/**
 * RAPIDS CSV Column Headers for Cancellations
 */
const CANCELLATION_HEADERS = [
  'Sponsor_Program_Number',
  'SSN',
  'Apprentice_Last_Name',
  'Apprentice_First_Name',
  'Cancellation_Date',
  'Cancellation_Reason_Code',
  'Cancellation_Reason_Description',
  'OJT_Hours_At_Cancellation',
  'RTI_Hours_At_Cancellation',
];

/**
 * Cancellation reason codes per RAPIDS
 */
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
};

/**
 * Export new apprentice registrations to CSV
 */
export async function exportNewRegistrations(
  startDate?: string,
  endDate?: string
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];
  
  // Query enrollments that need RAPIDS registration
  const supabase = getSupabaseAdmin();
  await setAuditContext(supabase, { systemActor: 'rapids_export' });
  let query = supabase
    .from('program_enrollments')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email,
        phone,
        date_of_birth,
        gender,
        address,
        city,
        state,
        zip,
        ssn_encrypted,
        veteran_status,
        disability_status,
        education_level,
        race_ethnicity
      ),
      programs:program_id (
        name,
        slug,
        type,
        occupation_code,
        total_hours,
        related_instruction_hours
      )
    `)
    .eq('rapids_submitted', false)
    .in('status', ['active', 'enrolled'])
    .is('revoked_at', null);

  if (startDate) {
    query = query.gte('enrolled_at', startDate);
  }
  if (endDate) {
    query = query.lte('enrolled_at', endDate);
  }

  const { data: enrollments, error } = await query;

  if (error) {
    return { csv: '', count: 0, errors: ['Export failed'] };
  }

  if (!enrollments || enrollments.length === 0) {
    return { csv: '', count: 0, errors: ['No new registrations to export'] };
  }

  // Build CSV rows
  const rows: string[][] = [];
  
  for (const enrollment of enrollments) {
    const profile = enrollment.profiles;
    const program = enrollment.programs;
    
    if (!profile || !program) {
      errors.push(`Missing profile or program for enrollment ${enrollment.id}`);
      continue;
    }

    // Parse name
    const nameParts = (profile.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    // Get program config
    const programConfig = Object.values(RAPIDS_CONFIG.programs).find(
      p => p.slug === program.slug
    );

    const row = [
      RAPIDS_CONFIG.programNumber,
      lastName,
      firstName,
      middleName,
      profile.ssn_encrypted ? '***-**-****' : '', // SSN needs decryption
      formatDate(profile.date_of_birth),
      profile.gender || 'X',
      profile.race_ethnicity || '',
      profile.veteran_status ? 'Y' : 'N',
      profile.disability_status ? 'Y' : 'N',
      profile.education_level || '',
      formatDate(enrollment.enrolled_at),
      programConfig?.occupationCode || program.occupation_code || '',
      programConfig?.name || program.name || '',
      String(programConfig?.totalHours || program.total_hours || 2000),
      String(programConfig?.relatedInstructionHours || program.related_instruction_hours || 144),
      enrollment.employer_name || RAPIDS_CONFIG.programBrand,
      enrollment.employer_fein || '',
      enrollment.employer_address || '8888 Keystone Crossing, Suite 1300',
      enrollment.employer_city || 'Indianapolis',
      enrollment.employer_state || 'IN',
      enrollment.employer_zip || '46240',
      String(enrollment.starting_wage || 0),
      profile.address || '',
      profile.city || '',
      profile.state || 'IN',
      profile.zip || '',
      profile.phone || '',
      profile.email || '',
    ];

    rows.push(row);
  }

  // Generate CSV
  const csv = generateCSV(REGISTRATION_HEADERS, rows);

  return { csv, count: rows.length, errors };
}

/**
 * Export progress updates to CSV
 */
export async function exportProgressUpdates(
  reportDate: string = new Date().toISOString().split('T')[0]
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];

  // Query active apprentices with hours logged
  const supabase = getSupabaseAdmin();
  const { data: enrollments, error } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        ssn_encrypted
      ),
      programs:program_id (
        name,
        slug
      )
    `)
    .eq('status', 'active')
    .eq('rapids_submitted', true);

  if (error) {
    return { csv: '', count: 0, errors: ['Export failed'] };
  }

  if (!enrollments || enrollments.length === 0) {
    return { csv: '', count: 0, errors: ['No active apprentices to report'] };
  }

  const rows: string[][] = [];

  for (const enrollment of enrollments) {
    const profile = enrollment.profiles;
    
    if (!profile) continue;

    const nameParts = (profile.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';

    // Get hours from consolidated hour_entries table
    const { data: hoursData } = await supabase
      .from('hour_entries')
      .select('hours_claimed, accepted_hours, source_type')
      .eq('user_id', profile.id)
      .eq('status', 'approved');

    let ojlHours = 0;
    let rtiHours = 0;

    (hoursData || []).forEach((h: any) => {
      const hrs = Number(h.accepted_hours) || Number(h.hours_claimed) || 0;
      if (h.source_type === 'ojl' || h.source_type === 'host_shop' || h.source_type === 'timeclock' || h.source_type === 'manual') {
        ojlHours += hrs;
      } else if (h.source_type === 'rti' || h.source_type === 'in_state_barber_school' || h.source_type === 'continuing_education') {
        rtiHours += hrs;
      }
    });

    const row = [
      RAPIDS_CONFIG.programNumber,
      profile.ssn_encrypted ? '***-**-****' : '',
      lastName,
      firstName,
      reportDate,
      String(ojlHours),
      String(rtiHours),
      String(enrollment.current_wage || 0),
      'Active',
    ];

    rows.push(row);
  }

  const csv = generateCSV(PROGRESS_HEADERS, rows);

  return { csv, count: rows.length, errors };
}

/**
 * Export completions to CSV
 */
export async function exportCompletions(
  startDate?: string,
  endDate?: string
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('program_enrollments')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        ssn_encrypted
      ),
      programs:program_id (
        name,
        slug
      )
    `)
    .eq('status', 'completed')
    .eq('rapids_completion_submitted', false);

  if (startDate) {
    query = query.gte('completed_at', startDate);
  }
  if (endDate) {
    query = query.lte('completed_at', endDate);
  }

  const { data: enrollments, error } = await query;

  if (error) {
    return { csv: '', count: 0, errors: ['Export failed'] };
  }

  if (!enrollments || enrollments.length === 0) {
    return { csv: '', count: 0, errors: ['No completions to export'] };
  }

  const rows: string[][] = [];

  for (const enrollment of enrollments) {
    const profile = enrollment.profiles;
    
    if (!profile) continue;

    const nameParts = (profile.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';

    const row = [
      RAPIDS_CONFIG.programNumber,
      profile.ssn_encrypted ? '***-**-****' : '',
      lastName,
      firstName,
      formatDate(enrollment.completed_at),
      String(enrollment.final_ojt_hours || 0),
      String(enrollment.final_rti_hours || 0),
      String(enrollment.final_wage || 0),
      enrollment.certificate_number || '',
    ];

    rows.push(row);
  }

  const csv = generateCSV(COMPLETION_HEADERS, rows);

  return { csv, count: rows.length, errors };
}

/**
 * Export cancellations to CSV
 */
export async function exportCancellations(
  startDate?: string,
  endDate?: string
): Promise<{ csv: string; count: number; errors: string[] }> {
  const errors: string[] = [];
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('program_enrollments')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        ssn_encrypted
      ),
      programs:program_id (
        name,
        slug
      )
    `)
    .in('status', ['cancelled', 'terminated', 'withdrawn'])
    .eq('rapids_cancellation_submitted', false);

  if (startDate) {
    query = query.gte('cancelled_at', startDate);
  }
  if (endDate) {
    query = query.lte('cancelled_at', endDate);
  }

  const { data: enrollments, error } = await query;

  if (error) {
    return { csv: '', count: 0, errors: ['Export failed'] };
  }

  if (!enrollments || enrollments.length === 0) {
    return { csv: '', count: 0, errors: ['No cancellations to export'] };
  }

  const rows: string[][] = [];

  for (const enrollment of enrollments) {
    const profile = enrollment.profiles;
    
    if (!profile) continue;

    const nameParts = (profile.full_name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';

    const reasonCode = enrollment.cancellation_reason_code || '10';
    const reasonDesc = CANCELLATION_REASONS[reasonCode as keyof typeof CANCELLATION_REASONS] || enrollment.cancellation_reason || 'Other';

    const row = [
      RAPIDS_CONFIG.programNumber,
      profile.ssn_encrypted ? '***-**-****' : '',
      lastName,
      firstName,
      formatDate(enrollment.cancelled_at),
      reasonCode,
      reasonDesc,
      String(enrollment.ojt_hours_at_cancellation || 0),
      String(enrollment.rti_hours_at_cancellation || 0),
    ];

    rows.push(row);
  }

  const csv = generateCSV(CANCELLATION_HEADERS, rows);

  return { csv, count: rows.length, errors };
}

/**
 * Generate CSV string from headers and rows
 */
function generateCSV(headers: string[], rows: string[][]): string {
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map(row => row.map(escapeCSV).join(','));

  return [headerLine, ...dataLines].join('\n');
}

/**
 * Format date for RAPIDS (MM/DD/YYYY)
 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Mark enrollments as submitted to RAPIDS
 */
export async function markAsSubmitted(
  enrollmentIds: string[],
  type: 'registration' | 'completion' | 'cancellation'
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAdmin();
  const updateField = {
    registration: 'rapids_submitted',
    completion: 'rapids_completion_submitted',
    cancellation: 'rapids_cancellation_submitted',
  }[type];

  const { error } = await supabase
    .from('program_enrollments')
    .update({ 
      [updateField]: true,
      [`${updateField}_at`]: new Date().toISOString(),
    })
    .in('id', enrollmentIds);

  if (error) {
    return { success: false, error: 'Operation failed' };
  }

  return { success: true };
}
