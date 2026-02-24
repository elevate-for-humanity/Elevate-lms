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
  const { data: courses } = await supabase.from('training_courses').select('id, course_name');
  if (!courses?.length) return null;
  const exact = courses.find((c: any) => c.course_name?.toLowerCase() === normalized);
  if (exact) return exact.id;
  const alias = ALIASES[normalized];
  if (alias) {
    const m = courses.find((c: any) => c.course_name?.toLowerCase().includes(alias));
    if (m) return m.id;
  }
  const partial = courses.find((c: any) => {
    const t = (c.course_name || '').toLowerCase();
    return t.includes(normalized) || normalized.includes(t.replace(/\(.*\)/, '').trim());
  });
  return partial?.id || null;
}

/**
 * Creates an auth account and profile so the student can log in and complete
 * onboarding. Application stays 'pending' until onboarding is complete and
 * documents are verified, then auto-enrolls.
 *
 * Flow: pending → onboarding → docs verified → approved → enrolled
 */
async function createStudentAccount(
  supabase: any,
  applicationId: string,
  email: string,
  firstName: string,
  lastName: string,
  programInterest: string,
): Promise<{ userId?: string; accountCreated: boolean; magicLink?: string | null; generatedPassword?: string; programId?: string | null }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    let userId: string | null = null;

    // Always generate credentials so the student gets them in the email
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const randomPart = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const generatedPassword = `Efh-${randomPart}!`;

    // Check profiles first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingProfile?.id) {
      userId = existingProfile.id;
      // Reset password to the new generated one so credentials in the email are valid
      await supabase.auth.admin.updateUserById(userId, { password: generatedPassword });
    } else {
      // Create new auth user with generated credentials
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: generatedPassword,
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
            // Reset password so credentials in the email are valid
            await supabase.auth.admin.updateUserById(userId, { password: generatedPassword });
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
      return { accountCreated: false, generatedPassword };
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

    // Link user to application — enrollment happens after onboarding completion
    await supabase
      .from('applications')
      .update({
        user_id: userId,
        program_id: programId,
      })
      .eq('id', applicationId);

    // Generate a magic link so the student can log in without setting a password
    let magicLink: string | null = null;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/onboarding/learner` },
      });
      if (linkData?.properties?.action_link) {
        magicLink = linkData.properties.action_link;
      }
    } catch (linkErr) {
      logger.warn('Could not generate magic link — student will use forgot-password', linkErr as Error);
    }

    logger.info('Student account created — awaiting onboarding completion for enrollment', { applicationId, userId, email: normalizedEmail, programId });
    return { userId, accountCreated: true, magicLink, generatedPassword, programId };
  } catch (err) {
    logger.error('Account creation failed', err as Error);
    return { accountCreated: false };
  }
}

/**
 * Application submission.
 * On submit: save application (pending) → create auth user → send onboarding email.
 * Enrollment is automatic after onboarding + document verification.
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

  // Auto-enrollment: insert application, create account, enroll in courses, send onboarding email.

  async function sendEnrollmentEmails(magicLink?: string | null, generatedPassword?: string) {
    const onboardingUrl = `${siteUrl}/onboarding/learner`;

    // Big CTA button — magic link if available, otherwise direct onboarding link
    const ctaLink = magicLink || `${siteUrl}/login`;
    const ctaButton = [
      `<div style="text-align:center;margin:24px 0">`,
      `<a href="${ctaLink}" style="display:inline-block;padding:16px 32px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:18px">Start My Onboarding</a>`,
      `</div>`,
    ].join('');

    // Credentials box — always shown when password was generated
    const credentialsBlock = generatedPassword
      ? [
          `<div style="background:#f0f9ff;border:2px solid #2563eb;border-radius:8px;padding:20px;margin:20px 0">`,
          `<p style="margin:0 0 12px;font-weight:bold;font-size:16px;color:#1e40af">Your Login Credentials</p>`,
          `<table style="width:100%;border-collapse:collapse">`,
          `<tr><td style="padding:8px 0;color:#64748b;width:80px">Email:</td><td style="padding:8px 0;font-weight:bold">${payload.email}</td></tr>`,
          `<tr><td style="padding:8px 0;color:#64748b">Password:</td><td style="padding:8px 0;font-weight:bold;font-family:monospace;font-size:16px">${generatedPassword}</td></tr>`,
          `</table>`,
          `<p style="margin:12px 0 0;font-size:13px;color:#64748b">Save these credentials. You can change your password at <a href="${siteUrl}/reset-password">${siteUrl}/reset-password</a></p>`,
          `</div>`,
        ].join('')
      : '';

    // Student: application received — complete onboarding
    const logoUrl = `${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;
    const emailHeader = [
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">`,
      `<div style="text-align:center;padding:24px 0;border-bottom:2px solid #2563eb">`,
      `<img src="${logoUrl}" alt="Elevate for Humanity" width="180" style="max-width:180px;height:auto" />`,
      `</div>`,
      `<div style="padding:24px">`,
    ].join('');
    const emailFooter = [
      `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">`,
      `<div style="text-align:center;font-size:12px;color:#94a3b8;padding:16px 0">`,
      `<p style="margin:0 0 4px">Elevate for Humanity Career & Technical Institute</p>`,
      `<p style="margin:0 0 4px">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>`,
      `<p style="margin:0"><a href="${siteUrl}" style="color:#2563eb">www.elevateforhumanity.org</a> | (317) 314-3757</p>`,
      `</div>`,
      `</div></div>`,
    ].join('');

    await sendEmailDirect(
      payload.email,
      `Welcome to Elevate! Your Login Credentials & Onboarding Link [${referenceNumber}]`,
      [
        emailHeader,
        `<h2 style="color:#111827">Hi ${payload.firstName},</h2>`,
        `<p>Thank you for applying to <strong>${programLabel}</strong> at Elevate for Humanity. Your account has been created and is ready to go.</p>`,
        credentialsBlock,
        ctaButton,
        `<p style="text-align:center;font-size:13px;color:#64748b;margin-top:-12px">This button logs you in and takes you to your onboarding page.</p>`,
        `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px 16px;margin:16px 0;text-align:center">`,
        `<p style="margin:0;font-size:13px;color:#92400e"><strong>For the best experience, use a laptop, desktop, or iPad.</strong> Cell phones may not display all onboarding steps correctly.</p>`,
        `</div>`,
        `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">`,
        `<h3 style="color:#111827">What happens next?</h3>`,
        `<p>After clicking the button above, complete these onboarding steps to get enrolled:</p>`,
        `<ol style="padding-left:20px;line-height:2">`,
        `<li>Complete your profile</li>`,
        `<li>Upload required documents (photo ID, SSN proof, proof of residency)</li>`,
        `<li>Confirm your funding source</li>`,
        `<li>Select your schedule</li>`,
        `<li>Complete orientation</li>`,
        `</ol>`,
        `<p><strong>Once all steps are done, you are automatically enrolled</strong> and your courses will be available in your student dashboard.</p>`,
        `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0">`,
        `<strong style="color:#1e40af">Need Help? Schedule a Free Consultation</strong>`,
        `<p style="margin:8px 0 0">Have questions about the program, funding, or enrollment? Book a free consultation with our enrollment team:</p>`,
        `<p style="margin:8px 0 0"><a href="${siteUrl}/schedule-consultation" style="color:#dc2626;font-weight:bold">Schedule a Consultation</a> &middot; Call <strong>(317) 314-3757</strong></p>`,
        `</div>`,
        `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">`,
        `<p style="font-size:13px;color:#64748b">Reference number: <strong>${referenceNumber}</strong></p>`,
        `<p style="font-size:13px;color:#64748b">Onboarding page: <a href="${onboardingUrl}">${onboardingUrl}</a></p>`,
        `<p style="font-size:13px;color:#64748b">If you're applying for WIOA funding, register at <a href="https://indianacareerconnect.com">indianacareerconnect.com</a> — this is required for eligibility.</p>`,
        `<p>Questions? Reply to this email or call us at (317) 314-3757.</p>`,
        emailFooter,
      ].join(''),
    ).catch((err) => { logger.error('[Apply] Student confirmation email failed:', err instanceof Error ? err.message : err); });

    // Admin notification — student will auto-enroll after onboarding + doc verification
    await sendEmailDirect(
      ADMIN_EMAIL,
      `[NEW APPLICATION] ${payload.firstName} ${payload.lastName} — ${programLabel} [${referenceNumber}]`,
      [
        emailHeader,
        `<h3>New ${payload.source.replace(/-/g, ' ')}</h3>`,
        `<p style="color:#b45309"><strong>Status: PENDING — student completing onboarding, documents need verification</strong></p>`,
        `<table style="border-collapse:collapse;width:100%;max-width:500px">`,
        `<tr><td style="padding:6px;font-weight:bold">Name</td><td style="padding:6px">${payload.firstName} ${payload.lastName}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Email</td><td style="padding:6px"><a href="mailto:${payload.email}">${payload.email}</a></td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Phone</td><td style="padding:6px"><a href="tel:${payload.phone}">${payload.phone}</a></td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Program</td><td style="padding:6px">${programLabel}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">City / ZIP</td><td style="padding:6px">${payload.city} ${payload.zip}</td></tr>`,
        `<tr><td style="padding:6px;font-weight:bold">Reference</td><td style="padding:6px">${referenceNumber}</td></tr>`,
        payload.supportNotes ? `<tr><td style="padding:6px;font-weight:bold">Details</td><td style="padding:6px">${payload.supportNotes}</td></tr>` : '',
        `</table>`,
        supabase ? `<p><a href="${siteUrl}/admin/applications/review/${referenceNumber}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;margin:8px 0">Review & Approve</a></p>` : '',
        supabase ? `<p><a href="${siteUrl}/admin/applications">View All Applications</a></p>` : '',
        emailFooter,
      ].filter(Boolean).join(''),
    ).catch((err) => { logger.error('[Apply] Admin notification email failed:', err instanceof Error ? err.message : err); });
  }

  // Path A: DB available — insert application, admin enrolls later
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
      } else {
        // Auto-enroll: create account + enroll in courses
        const accountResult = await createStudentAccount(
          supabase,
          data.id,
          payload.email,
          payload.firstName,
          payload.lastName,
          payload.programInterest,
        );

        // Create program_enrollments row — links student to their program
        if (accountResult.userId && accountResult.programId) {
          const programSlug = payload.programInterest.toLowerCase().replace(/\s+/g, '-').trim();
          await supabase
            .from('program_enrollments')
            .upsert({
              user_id: accountResult.userId,
              program_id: accountResult.programId,
              program_slug: programSlug,
              email: payload.email,
              full_name: `${payload.firstName} ${payload.lastName}`.trim(),
              phone: payload.phone || null,
              status: 'active',
              enrollment_state: 'onboarding',
              next_required_action: 'Complete Onboarding',
              funding_source: 'pending',
              amount_paid_cents: 0,
            }, { onConflict: 'user_id,program_id', ignoreDuplicates: true })
            .then(({ error: peError }) => {
              if (peError) logger.error('[Apply] program_enrollments insert failed:', peError.message);
              else logger.info('[Apply] program_enrollments created', { userId: accountResult.userId, programId: accountResult.programId });
            });
        }

        await sendEnrollmentEmails(accountResult.magicLink, accountResult.generatedPassword);
        revalidatePath('/admin/applications');
        return { success: true, applicationId: data.id, referenceNumber, generatedPassword: accountResult.generatedPassword, email: payload.email };
      }
    } catch (error) {
      logger.error(`[Application] DB error for ${payload.email}`, error as Error);
    }
  }

  // Path B: Email-only fallback
  try {
    await sendEnrollmentEmails();
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
    return {
      success: true,
      applicationId: result.applicationId,
      referenceNumber: result.referenceNumber,
      generatedPassword: result.generatedPassword,
      email: result.email || data.email,
    };
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
