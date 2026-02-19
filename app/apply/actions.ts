'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

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
 * Resolve program_interest to a course UUID.
 */
async function resolveCourseId(supabase: any, programInterest: string): Promise<string | null> {
  if (!programInterest) return null;
  const normalized = programInterest.toLowerCase().replace(/-/g, ' ').trim();
  const ALIASES: Record<string, string> = {
    'cna certification': 'cna training',
    'cna': 'cna training',
    'cosmetology apprenticeship': 'hair stylist esthetician apprenticeship',
    'accounting': 'bookkeeping',
    'home health aide': 'direct support professional',
    'entrepreneurship': 'entrepreneurship small business',
    'phlebotomy': 'phlebotomy technician',
    'barber apprenticeship': 'barber',
  };
  const { data: courses } = await supabase.from('courses').select('id, title');
  if (!courses?.length) return null;
  const exact = courses.find((c: any) => c.title.toLowerCase() === normalized);
  if (exact) return exact.id;
  const alias = ALIASES[normalized];
  if (alias) {
    const m = courses.find((c: any) => c.title.toLowerCase().includes(alias));
    if (m) return m.id;
  }
  const partial = courses.find((c: any) => {
    const t = c.title.toLowerCase();
    return t.includes(normalized) || normalized.includes(t.replace(/\(.*\)/, '').trim());
  });
  return partial?.id || null;
}

/**
 * Auto-approve: create auth user + profile + enrollment on application submit.
 */
async function autoApproveAndEnroll(
  supabase: any,
  applicationId: string,
  email: string,
  firstName: string,
  lastName: string,
  programInterest: string,
): Promise<{ userId?: string; courseId?: string; enrolled: boolean }> {
  try {
    // 1. Resolve course
    const courseId = await resolveCourseId(supabase, programInterest);
    if (!courseId) {
      logger.error('Auto-enroll: no course match', { programInterest });
      return { enrolled: false };
    }

    // 2. Find or create auth user
    const normalizedEmail = email.toLowerCase().trim();
    let userId: string | null = null;

    // Check profiles first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingProfile?.id) {
      userId = existingProfile.id;
    } else {
      // Create new auth user
      const tempPassword = `Elevate-${Date.now().toString(36)}!`;
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (newUser?.user) {
        userId = newUser.user.id;
        await supabase.from('profiles').upsert({
          id: userId,
          email: normalizedEmail,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          role: 'student',
        }, { onConflict: 'id' });
      } else if (createError) {
        // User may exist in auth but not profiles — scan for them
        let page = 1;
        while (page <= 6 && !userId) {
          const { data: batch } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
          if (!batch?.users?.length) break;
          const found = batch.users.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
          if (found) {
            userId = found.id;
            await supabase.from('profiles').upsert({
              id: userId,
              email: normalizedEmail,
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`,
              role: 'student',
            }, { onConflict: 'id' });
          }
          page++;
        }
      }
    }

    if (!userId) {
      logger.error('Auto-enroll: could not create user', { email: normalizedEmail });
      return { enrolled: false };
    }

    // 3. Create enrollment (skip if already enrolled)
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!existing) {
      await supabase.from('enrollments').insert({
        user_id: userId,
        course_id: courseId,
        status: 'active',
        progress: 0,
        enrolled_at: new Date().toISOString(),
      });
    }

    // 4. Update application to enrolled
    await supabase
      .from('applications')
      .update({ status: 'enrolled', program_id: courseId, user_id: userId })
      .eq('id', applicationId);

    logger.info('Auto-enrolled student', { applicationId, userId, courseId, email: normalizedEmail });
    return { userId, courseId, enrolled: true };
  } catch (err) {
    logger.error('Auto-enroll failed', err as Error);
    return { enrolled: false };
  }
}

/**
 * Application submission with auto-approve and auto-enroll.
 * On submit: save application → create auth user → enroll in course → send welcome email.
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

    // Auto-approve and enroll immediately
    const enrollResult = await autoApproveAndEnroll(
      supabase,
      data.id,
      payload.email,
      payload.firstName,
      payload.lastName,
      payload.programInterest,
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Send welcome/onboarding email to student
    if (enrollResult.enrolled) {
      sendEmailDirect(
        payload.email,
        `You're Enrolled! Welcome to Elevate for Humanity [${referenceNumber}]`,
        [
          `<h2>Welcome, ${payload.firstName}!</h2>`,
          `<p>You've been enrolled in <strong>${payload.programInterest.replace(/-/g, ' ')}</strong> at Elevate for Humanity.</p>`,
          `<h3>Next Steps:</h3>`,
          `<ol>`,
          `<li><strong>Log in</strong> at <a href="${siteUrl}/signin">${siteUrl}/signin</a> using your email: <strong>${payload.email}</strong></li>`,
          `<li>If this is your first time, click <strong>"Forgot Password"</strong> to set your password</li>`,
          `<li>Once logged in, go to <strong>My Courses</strong> to start your lessons</li>`,
          `</ol>`,
          `<p>Your reference number: <strong>${referenceNumber}</strong></p>`,
          `<p>Questions? Reply to this email or call us.</p>`,
          `<p>— Elevate for Humanity</p>`,
        ].join(''),
      ).catch(() => {});
    } else {
      // Fallback: send basic confirmation if auto-enroll failed
      sendEmailDirect(
        payload.email,
        `Application Received [${referenceNumber}] - Elevate for Humanity`,
        `<p>Hi ${payload.firstName},</p><p>We received your application (Ref: <strong>${referenceNumber}</strong>). Our team will review it and contact you within 2 business days.</p><p>— Elevate for Humanity</p>`,
      ).catch(() => {});
    }

    // Notify admin (non-blocking)
    sendEmailDirect(
      ADMIN_EMAIL,
      `${enrollResult.enrolled ? '[AUTO-ENROLLED]' : '[PENDING]'} ${payload.firstName} ${payload.lastName} — ${payload.programInterest} [${referenceNumber}]`,
      [
        `<h3>New ${payload.source.replace(/-/g, ' ')} received</h3>`,
        enrollResult.enrolled ? `<p style="color:green"><strong>✅ Auto-enrolled successfully</strong></p>` : `<p style="color:orange"><strong>⚠️ Auto-enroll failed — manual action needed</strong></p>`,
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
