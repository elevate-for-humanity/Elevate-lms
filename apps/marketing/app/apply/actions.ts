'use server';

import { getAdminClient } from '@/lib/supabase/admin';

export async function submitStudentApplication(data: {
  role?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zipCode?: string;
  programInterest?: string;
  requestedFundingSource?: string;
  goals?: string;
  applicationType?: string;
  source?: string;
  password?: string;
  personalStatement?: string;
  fundingSource?: string;
}) {
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const email = data.email?.trim().toLowerCase();
  const phone = data.phone?.trim();
  const program = data.programInterest?.trim();

  if (!firstName || !lastName || !email || !phone || !program) {
    throw new Error('Missing required application fields.');
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    throw new Error('Application service is temporarily unavailable.');
  }

  const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;
  const notes = [
    `Reference: ${referenceNumber}`,
    `Program Interest: ${program}`,
    data.requestedFundingSource
      ? `Funding Source: ${data.requestedFundingSource}`
      : '',
    data.goals ? `Goals: ${data.goals}` : '',
    data.applicationType ? `Application Type: ${data.applicationType}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      first_name: firstName,
      last_name: lastName,
      phone,
      email,
      city: 'Not provided',
      zip: data.zipCode?.trim() || '00000',
      program_interest: program,
      support_notes: notes,
      status: 'submitted',
      source: data.source || `program-page-${program}`,
      contact_preference: 'phone',
      reference_number: referenceNumber,
    })
    .select('id, reference_number')
    .maybeSingle();

  if (error || !application) {
    console.error('[submitStudentApplication] insert failed', {
      code: error?.code,
      message: error?.message,
      program,
      email,
    });
    throw new Error('Failed to save application.');
  }

  return {
    success: true,
    applicationId: application.id,
    referenceNumber: application.reference_number || referenceNumber,
    message: 'Application received. You will be contacted shortly.',
  };
}
