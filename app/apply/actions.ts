'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

async function sendEmailDirect(to: string, subject: string, html: string) {
  try {
    const result = await sendEmail({ to, subject, html });
    return result.success;
  } catch (err) {
    console.error('[Email] Send failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Application-only submission. No auth user created at submit time.
 * User accounts are created later upon admin approval.
 * All inserts use admin client (service role) to bypass RLS.
 */

export type ApplicationRole = 'student' | 'program_holder' | 'employer' | 'staff' | 'instructor';

export interface BaseApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: ApplicationRole;
}

export interface StudentApplicationData extends BaseApplicationData {
  role: 'student';
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  programInterest?: string;
  employmentStatus?: string;
  educationLevel?: string;
  goals?: string;
}

export interface ProgramHolderApplicationData extends BaseApplicationData {
  role: 'program_holder';
  organizationName: string;
  organizationType?: string;
  website?: string;
  numberOfStudents?: string;
  programsOffered?: string;
  partnershipGoals?: string;
}

export interface EmployerApplicationData extends BaseApplicationData {
  role: 'employer';
  companyName: string;
  industry?: string;
  companySize?: string;
  website?: string;
  hiringNeeds?: string;
  positionsAvailable?: string;
}

export interface StaffApplicationData extends BaseApplicationData {
  role: 'staff' | 'instructor';
  position: string;
  experience?: string;
  education?: string;
  certifications?: string;
  availability?: string;
  coverLetter?: string;
}

export type ApplicationData =
  | StudentApplicationData
  | ProgramHolderApplicationData
  | EmployerApplicationData
  | StaffApplicationData;

function generateReferenceNumber(): string {
  return `EFH-${Date.now().toString(36).toUpperCase()}`;
}

async function insertApplication(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  zip: string;
  programInterest: string;
  supportNotes: string;
  source: string;
}): Promise<{ success: true; applicationId: string; referenceNumber: string } | { success: false; error: string }> {
  const supabase = createAdminClient();

  if (!supabase) {
    return { success: false, error: 'Application system is temporarily unavailable. Please try again later.' };
  }

  const referenceNumber = generateReferenceNumber();

  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        city: payload.city,
        zip: payload.zip,
        program_interest: payload.programInterest,
        support_notes: `Reference: ${referenceNumber} | ${payload.supportNotes}`,
        status: 'pending',
        source: payload.source,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`[Application] Insert failed for ${payload.email}:`, error.message);
      return { success: false, error: 'Failed to save application. Please try again or use our contact form at /contact.' };
    }

    // Application saved — send notifications

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Send confirmation to applicant (non-blocking)
    sendEmailDirect(
      payload.email,
      `Application Received [${referenceNumber}] - Elevate for Humanity`,
      `<p>Hi ${payload.firstName},</p><p>We received your application (Ref: <strong>${referenceNumber}</strong>). Our team will review it and contact you within 2 business days.</p><p>— Elevate for Humanity</p>`,
    ).catch(() => {});

    // Notify admin (non-blocking)
    sendEmailDirect(
      ADMIN_EMAIL,
      `New Application: ${payload.firstName} ${payload.lastName} — ${payload.programInterest} [${referenceNumber}]`,
      [
        `<h3>New ${payload.source.replace(/-/g, ' ')} received</h3>`,
        `<p><strong>Name:</strong> ${payload.firstName} ${payload.lastName}</p>`,
        `<p><strong>Email:</strong> <a href="mailto:${payload.email}">${payload.email}</a></p>`,
        `<p><strong>Phone:</strong> <a href="tel:${payload.phone}">${payload.phone}</a></p>`,
        `<p><strong>Program:</strong> ${payload.programInterest}</p>`,
        `<p><strong>City:</strong> ${payload.city} | <strong>ZIP:</strong> ${payload.zip}</p>`,
        `<p><strong>Reference:</strong> ${referenceNumber}</p>`,
        payload.supportNotes ? `<p><strong>Details:</strong> ${payload.supportNotes}</p>` : '',
        `<p><a href="${siteUrl}/admin/applications">View in Admin Dashboard</a></p>`,
      ].filter(Boolean).join(''),
    ).catch(() => {});

    revalidatePath('/admin/applications');
    return { success: true, applicationId: data.id, referenceNumber };
  } catch (error) {
    console.error(`[Application] Unexpected error for ${payload.email}:`, error);
    return { success: false, error: 'An error occurred' };
  }
}

export async function submitStudentApplication(data: StudentApplicationData) {
  const result = await insertApplication({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    city: data.city || 'Not provided',
    zip: data.zipCode || '00000',
    programInterest: data.programInterest || 'Not specified',
    supportNotes: [
      data.employmentStatus ? `Employment: ${data.employmentStatus}` : '',
      data.educationLevel ? `Education: ${data.educationLevel}` : '',
      data.goals ? `Goals: ${data.goals}` : '',
      data.dateOfBirth ? `DOB: ${data.dateOfBirth}` : '',
      data.address ? `Address: ${data.address}` : '',
      data.state ? `State: ${data.state}` : '',
    ].filter(Boolean).join(' | '),
    source: 'student-application',
  });

  if (result.success) {
    return { success: true, applicationId: result.applicationId, referenceNumber: result.referenceNumber, redirectTo: `/apply/success?role=student&ref=${result.referenceNumber}` };
  }
  return result;
}

export async function submitProgramHolderApplication(data: ProgramHolderApplicationData) {
  const result = await insertApplication({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    city: 'Not provided',
    zip: '00000',
    programInterest: 'Program Holder',
    supportNotes: [
      `Organization: ${data.organizationName}`,
      data.organizationType ? `Type: ${data.organizationType}` : '',
      data.website ? `Website: ${data.website}` : '',
      data.numberOfStudents ? `Students: ${data.numberOfStudents}` : '',
      data.programsOffered ? `Programs: ${data.programsOffered}` : '',
      data.partnershipGoals ? `Goals: ${data.partnershipGoals}` : '',
    ].filter(Boolean).join(' | '),
    source: 'program-holder-application',
  });

  if (result.success) {
    return { success: true, applicationId: result.applicationId, referenceNumber: result.referenceNumber, redirectTo: `/apply/success?role=program-holder&ref=${result.referenceNumber}` };
  }
  return result;
}

export async function submitEmployerApplication(data: EmployerApplicationData) {
  const result = await insertApplication({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    city: 'Not provided',
    zip: '00000',
    programInterest: 'Employer Partnership',
    supportNotes: [
      `Company: ${data.companyName}`,
      data.industry ? `Industry: ${data.industry}` : '',
      data.companySize ? `Size: ${data.companySize}` : '',
      data.website ? `Website: ${data.website}` : '',
      data.hiringNeeds ? `Hiring: ${data.hiringNeeds}` : '',
      data.positionsAvailable ? `Positions: ${data.positionsAvailable}` : '',
    ].filter(Boolean).join(' | '),
    source: 'employer-application',
  });

  if (result.success) {
    return { success: true, applicationId: result.applicationId, referenceNumber: result.referenceNumber, redirectTo: `/apply/success?role=employer&ref=${result.referenceNumber}` };
  }
  return result;
}

export async function submitStaffApplication(data: StaffApplicationData) {
  const result = await insertApplication({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    city: 'Not provided',
    zip: '00000',
    programInterest: `Staff: ${data.position}`,
    supportNotes: [
      `Role: ${data.role}`,
      `Position: ${data.position}`,
      data.experience ? `Experience: ${data.experience}` : '',
      data.education ? `Education: ${data.education}` : '',
      data.certifications ? `Certifications: ${data.certifications}` : '',
      data.availability ? `Availability: ${data.availability}` : '',
      data.coverLetter ? 'Cover letter provided' : '',
    ].filter(Boolean).join(' | '),
    source: 'staff-application',
  });

  if (result.success) {
    return { success: true, applicationId: result.applicationId, referenceNumber: result.referenceNumber, redirectTo: `/apply/success?role=staff&ref=${result.referenceNumber}` };
  }
  return result;
}

export async function getApplicationStatus(identifier: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: byRef } = await supabase
    .from('applications')
    .select('*')
    .ilike('support_notes', `%${identifier}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (byRef) return byRef;

  const { data: byEmail } = await supabase
    .from('applications')
    .select('*')
    .eq('email', identifier)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return byEmail;
}
