'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const ADMIN_EMAIL = 'info@elevateforhumanity.org';

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
    'hvac technician': 'hvac technician',
    'hvac': 'hvac technician',
    'hvac tech': 'hvac technician',
  };
  const { data: courses } = await supabase.from('training_courses').select('id, title');
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
 * Auto-approve: create auth user + profile on application submit.
 * Does NOT enroll — student must complete onboarding + WorkOne approval first.
 */
/**
 * Creates an auth account and profile so the student can log in and complete
 * onboarding. Application stays 'pending' — approval happens after all
 * onboarding steps (profile, agreements, documents, orientation) are done.
 *
 * Flow: pending → onboarding → approved → enrolled
 */
async function createStudentAccount(
  supabase: any,
  applicationId: string,
  email: string,
  firstName: string,
  lastName: string,
  programInterest: string,
): Promise<{ userId?: string; accountCreated: boolean }> {
  try {
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
      logger.error('Account creation failed — could not create user', { email: normalizedEmail });
      return { accountCreated: false };
    }

    // Resolve course ID for tracking
    const courseId = await resolveCourseId(supabase, programInterest);

    // Resolve program ID from programs table (used by enrollment system)
    const slug = programInterest.toLowerCase().replace(/\s+/g, '-').trim();
    const { data: programRow } = await supabase
      .from('programs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    const programId = programRow?.id || courseId || null;

    // Link user to application — keep status 'pending' until onboarding is complete
    await supabase
      .from('applications')
      .update({
        status: 'pending',
        user_id: userId,
        program_id: programId,
      })
      .eq('id', applicationId);

    // Create program_enrollments record in 'onboarding' state.
    // Student must complete: profile → agreements → documents → orientation
    // Only after all steps → admin reviews → status becomes 'approved' → 'enrolled'
    try {
      await supabase
        .from('program_enrollments')
        .insert({
          user_id: userId,
          program_id: programId,
          email: normalizedEmail,
          full_name: `${firstName} ${lastName}`,
          amount_paid_cents: 0,
          funding_source: 'pending',
          status: 'pending',
          enrollment_state: 'onboarding',
          next_required_action: 'COMPLETE_PROFILE',
        });
    } catch (enrollErr) {
      // Non-fatal — admin can create enrollment manually
      logger.error('Failed to create program_enrollment record', enrollErr as Error);
    }

    logger.info('Student account created — pending onboarding', { applicationId, userId, email: normalizedEmail });
    return { userId, accountCreated: true };
  } catch (err) {
    logger.error('Account creation failed', err as Error);
    return { accountCreated: false };
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
  const referenceNumber = generateReferenceNumber();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const programLabel = payload.programInterest.replace(/-/g, ' ');

  // ── Helper: send both emails (student confirmation + admin notification) ──
  async function sendApplicationEmails() {
    // Student: application received — complete onboarding to get approved
    await sendEmailDirect(
      payload.email,
      `Application Received — Complete Your Onboarding [${referenceNumber}]`,
      [
        `<h2>Hi ${payload.firstName},</h2>`,
        `<p>We received your application for <strong>${programLabel}</strong> at Elevate for Humanity.</p>`,
        `<p>Your reference number: <strong>${referenceNumber}</strong></p>`,
        `<h3>Next Steps to Complete Your Enrollment:</h3>`,
        `<ol>`,
        `<li><strong>Set your password:</strong> Go to <a href="${siteUrl}/forgot-password">${siteUrl}/forgot-password</a> and enter your email: <strong>${payload.email}</strong></li>`,
        `<li><strong>Log in:</strong> Go to <a href="${siteUrl}/login">${siteUrl}/login</a></li>`,
        `<li><strong>Complete your profile:</strong> Fill in your full name, address, and contact info</li>`,
        `<li><strong>Review and sign agreements:</strong> Student handbook, enrollment agreement, and code of conduct</li>`,
        `<li><strong>Upload required documents:</strong> Government-issued ID and any supporting documents</li>`,
        `<li><strong>Complete orientation:</strong> Watch the orientation video and acknowledge program expectations</li>`,
        `</ol>`,
        `<p><strong>Your application will be reviewed and approved after all onboarding steps are complete.</strong></p>`,
        `<p>If you're applying for WIOA funding, register at <a href="https://indianacareerconnect.com">indianacareerconnect.com</a> — this is required for eligibility.</p>`,
        `<p>Questions? Reply to this email or call us.</p>`,
        `<p>— Elevate for Humanity</p>`,
      ].join(''),
    ).catch(() => {});

    // Admin notification
    await sendEmailDirect(
      ADMIN_EMAIL,
      `[PENDING] ${payload.firstName} ${payload.lastName} — ${programLabel} [${referenceNumber}]`,
      [
        `<h3>New ${payload.source.replace(/-/g, ' ')}</h3>`,
        `<p style="color:orange"><strong>Status: PENDING — awaiting onboarding completion</strong></p>`,
        `<table style="border-collapse:collapse;width:100%;max-width:500px">`,
        `<tr><td style="padding:6px;font-weight:bold">Name</td><td style="padding:6px">${payload.firstName} ${payload.lastName}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px"><a href="mailto:${payload.email}">${payload.email}</a></td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Phone</td><td style="padding:6px"><a href="tel:${payload.phone}">${payload.phone}</a></td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Program</td><td style="padding:6px">${programLabel}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">City / ZIP</td><td style="padding:6px">${payload.city} ${payload.zip}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Reference</td><td style="padding:6px">${referenceNumber}</td></tr>`,
        payload.supportNotes ? `<tr><td style="padding:6px;font-weight:bold">Details</td><td style="padding:6px">${payload.supportNotes}</td></tr>` : '',
        `</table>`,
        `<p>Student account created — they can log in and begin onboarding.</p>`,
        `<p>Approve after they complete: profile, agreements, documents, and orientation.</p>`,
        supabase ? `<p><a href="${siteUrl}/admin/applications">View in Admin Dashboard</a></p>` : `<p style="color:orange"><em>Database unavailable — application received via email only.</em></p>`,
      ].filter(Boolean).join(''),
    ).catch(() => {});
  }

  // ── Path A: Supabase available — full DB + auto-approve flow ──
  if (supabase) {
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
        logger.error(`[Application] DB insert failed for ${payload.email}`, new Error(error.message));
        // Fall through to email-only path
      } else {
        const accountResult = await createStudentAccount(
          supabase,
          data.id,
          payload.email,
          payload.firstName,
          payload.lastName,
          payload.programInterest,
        );

        await sendApplicationEmails();
        revalidatePath('/admin/applications');
        return { success: true, applicationId: data.id, referenceNumber };
      }
    } catch (error) {
      logger.error(`[Application] DB error for ${payload.email}`, error as Error);
      // Fall through to email-only path
    }
  }

  // ── Path B: Email-only — no Supabase or DB insert failed ──
  try {
    await sendApplicationEmails();
    logger.info(`[Application] Email-only submission for ${payload.email} [${referenceNumber}]`);
    return { success: true, applicationId: `email-${referenceNumber}`, referenceNumber };
  } catch (emailError) {
    logger.error(`[Application] Email send failed for ${payload.email}`, emailError as Error);
    return { success: false, error: 'We could not process your application. Please email us directly at info@elevateforhumanity.org with your name, phone number, and program interest.' };
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
