'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

// info@elevateforhumanity.org removed — domain MX points to Resend/SES inbound
// but no mailbox exists there, so emails bounce and get re-suppressed in a loop.
// Use only the Gmail address until MX records are updated or Resend forwarding is configured.
const ADMIN_EMAILS = [
  'elevate4humanityedu@gmail.com',
];

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
  userPassword?: string,
): Promise<{ userId?: string; accountCreated: boolean; magicLink?: string | null; programId?: string | null }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    let userId: string | null = null;

    // Use the password the student provided on the application form.
    // Fall back to a generated password only if none was provided (e.g. admin-initiated enrollment).
    const password = userPassword || (() => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      const randomPart = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `Efh-${randomPart}!`;
    })();

    // Check profiles first
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingProfile?.id) {
      userId = existingProfile.id;
      // Update password to the one the student provided
      await supabase.auth.admin.updateUserById(userId, { password });
    } else {
      // Create new auth user with student-provided password
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
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
        // User exists in auth but not profiles — look up directly by email
        const { data: authLookup } = await supabase.rpc('get_user_id_by_email', { lookup_email: normalizedEmail }).maybeSingle();
        if (authLookup?.id) {
          userId = authLookup.id;
        } else {
          // Fallback: single-page listUsers filtered lookup
          const { data: batch } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const found = batch?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
          if (found) userId = found.id;
        }
        if (userId) {
          await Promise.all([
            supabase.auth.admin.updateUserById(userId, { password }),
            supabase.from('profiles').upsert({
              id: userId,
              email: normalizedEmail,
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`,
              role: 'student',
            }, { onConflict: 'id' }),
          ]);
        }
      }
    }

    if (!userId) {
      logger.error('Account creation failed — could not create user', { email: normalizedEmail });
      return { accountCreated: false };
    }

    // Resolve course, program, and generate magic link in parallel
    const slug = programInterest.toLowerCase().replace(/\s+/g, '-').trim();
    const [courseId, programResult, linkResult] = await Promise.all([
      resolveCourseId(supabase, programInterest),
      supabase.from('programs').select('id').eq('slug', slug).maybeSingle(),
      supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/onboarding/learner` },
      }).catch((err: any) => { logger.warn('Could not generate magic link', err); return null; }),
    ]);

    const programId = programResult?.data?.id || courseId || null;
    const magicLink = linkResult && 'data' in linkResult ? linkResult.data?.properties?.action_link || null : null;

    // Link user to application
    await supabase
      .from('applications')
      .update({ user_id: userId, program_id: programId })
      .eq('id', applicationId);

    logger.info('Student account created — awaiting onboarding completion for enrollment', { applicationId, userId, email: normalizedEmail, programId });
    return { userId, accountCreated: true, magicLink, programId };
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
  password: string;
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
  password?: string;
  city: string;
  zip: string;
  programInterest: string;
  supportNotes: string;
  source: string;
}): Promise<{ success: true; applicationId: string; referenceNumber: string; email?: string } | { success: false; error: string }> {
  const supabase = createAdminClient();
  const referenceNumber = generateReferenceNumber();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const programLabel = payload.programInterest.replace(/-/g, ' ');

  // Auto-enrollment: insert application, create account, enroll in courses, send onboarding email.

  async function sendEnrollmentEmails(magicLink?: string | null) {
    const onboardingUrl = `${siteUrl}/onboarding/learner`;
    const ctaLink = magicLink || `${siteUrl}/login`;
    const logoUrl = `${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;

    // ── Shared email chrome — clean white layout, single accent ──
    const emailHeader = [
      `<div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1a1a1a;background:#ffffff">`,
      `<div style="text-align:center;padding:32px 24px 24px">`,
      `<img src="${logoUrl}" alt="Elevate for Humanity" width="160" style="max-width:160px;height:auto" />`,
      `</div>`,
      `<div style="padding:0 32px 32px">`,
    ].join('');
    const emailFooter = [
      `<div style="border-top:1px solid #e0e0e0;margin-top:32px;padding-top:20px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#999">`,
      `<p style="margin:0 0 4px">Elevate for Humanity Career & Technical Institute</p>`,
      `<p style="margin:0 0 4px">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>`,
      `<p style="margin:0"><a href="${siteUrl}" style="color:#999;text-decoration:underline">www.elevateforhumanity.org</a> &nbsp;|&nbsp; (317) 314-3757</p>`,
      `</div>`,
      `</div></div>`,
    ].join('');

    // ── ETPL program lists ──
    const etplPrograms = [
      'Building Maintenance', 'Building Maintenance Technician',
      'Business Startup & Marketing', 'CDL (Commercial Driver\'s License)',
      'Cybersecurity', 'Cybersecurity Fundamentals',
      'Drug & Alcohol Specimen Collector', 'Electrical Apprenticeship',
      'Emergency Health & Safety Tech', 'Home Health Aide',
      'HVAC Technician', 'IT Support Specialist', 'Medical Assistant',
      'Peer Recovery Specialist', 'Phlebotomy Technician',
      'Plumbing Apprenticeship', 'Public Safety Reentry Specialist',
      'Welding Certification',
    ];
    const waitlistPrograms = [
      'Barber Apprenticeship', 'Beauty Career Educator',
      'CNA (Certified Nursing Assistant)', 'Cosmetology Apprenticeship',
      'Esthetician Apprenticeship', 'Nail Technician', 'Tax Preparation',
    ];

    const etplList = etplPrograms.map(p => `<li style="padding:1px 0">${p}</li>`).join('');
    const waitlistList = waitlistPrograms.map(p => `<li style="padding:1px 0">${p}</li>`).join('');

    // Login reminder — no password in email, student set it on the form
    const credentialsBlock = [
      `<table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #e0e0e0">`,
      `<tr style="background:#f9f9f9"><td colspan="2" style="padding:12px 16px;font-weight:bold;font-size:14px;border-bottom:1px solid #e0e0e0">Your Login</td></tr>`,
      `<tr><td style="padding:10px 16px;color:#666;width:80px;border-bottom:1px solid #f0f0f0">Email</td><td style="padding:10px 16px;border-bottom:1px solid #f0f0f0">${payload.email}</td></tr>`,
      `<tr><td style="padding:10px 16px;color:#666">Password</td><td style="padding:10px 16px">The password you created on the application form</td></tr>`,
      `</table>`,
      `<p style="margin:0 0 20px;font-size:13px;color:#888;font-family:Arial,sans-serif">Forgot your password? Reset it anytime at <a href="${siteUrl}/reset-password" style="color:#888">${siteUrl}/reset-password</a></p>`,
    ].join('');

    // Admin notification FIRST — send before student email so serverless
    // timeout doesn't prevent admin from being notified about new applications.
    const adminSubject = `[NEW APPLICATION] ${payload.firstName} ${payload.lastName} — ${programLabel} [${referenceNumber}]`;
    const adminHtml = [
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
      ].filter(Boolean).join('');

    await Promise.allSettled(
      ADMIN_EMAILS.map((addr) =>
        sendEmailDirect(addr, adminSubject, adminHtml)
      ),
    ).then((results) => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          logger.error(`[Apply] Admin notification to ${ADMIN_EMAILS[i]} failed:`, r.reason);
        }
      });
    });

    // Send student confirmation email
    await sendEmailDirect(
      payload.email,
      `Welcome to Elevate for Humanity — ${programLabel} [${referenceNumber}]`,
      [
        emailHeader,

        `<h2 style="font-weight:normal;font-size:22px;margin:0 0 20px;color:#1a1a1a">Hi ${payload.firstName},</h2>`,

        `<p style="font-size:15px;line-height:1.7;margin:0 0 16px">Thank you for your interest in <strong>${programLabel}</strong> at Elevate for Humanity. We received your inquiry and we'd love to help you take the next step.</p>`,

        `<p style="font-size:15px;line-height:1.7;margin:0 0 16px">We've created your account. You can log in using the email and password you provided on the application form.</p>`,

        // Onboarding — first thing after greeting
        `<h3 style="font-size:17px;font-weight:bold;margin:0 0 12px;color:#1a1a1a">Your Next Steps</h3>`,
        `<p style="font-size:14px;line-height:1.7;margin:0 0 12px">Log in and complete your onboarding to secure your spot:</p>`,
        `<ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#333;font-family:Arial,sans-serif;line-height:1.9">`,
        `<li>Complete your profile</li>`,
        `<li>Upload your documents (photo ID, proof of residency)</li>`,
        `<li>Confirm your funding source</li>`,
        `<li>Select your schedule</li>`,
        `<li>Complete orientation</li>`,
        `</ol>`,

        `<div style="text-align:center;margin:24px 0">`,
        `<a href="${ctaLink}" style="display:inline-block;padding:14px 40px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px">Log In &amp; Start Onboarding</a>`,
        `</div>`,
        `<p style="text-align:center;font-size:12px;color:#999;font-family:Arial,sans-serif;margin:0 0 24px">For the best experience, please use a laptop, desktop, or iPad.</p>`,

        // Divider
        `<div style="border-top:1px solid #e0e0e0;margin:28px 0"></div>`,

        // Credentials
        credentialsBlock,

        // CTA — schedule meeting
        `<div style="text-align:center;margin:28px 0">`,
        `<a href="${siteUrl}/schedule-consultation" style="display:inline-block;padding:14px 40px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px">Schedule a Meeting with an Advisor</a>`,
        `</div>`,
        `<p style="text-align:center;font-size:13px;color:#888;font-family:Arial,sans-serif;margin:-12px 0 24px">We'll walk you through your options — no commitment required.</p>`,

        // Divider
        `<div style="border-top:1px solid #e0e0e0;margin:28px 0"></div>`,

        // Funding section
        `<h3 style="font-size:17px;font-weight:bold;margin:0 0 12px;color:#1a1a1a">How Funding Works</h3>`,

        `<p style="font-size:14px;line-height:1.7;margin:0 0 12px">Many of our programs are listed on Indiana's <strong>Eligible Training Provider List (ETPL)</strong>, which means they can be fully funded through WIOA or other workforce grants — at no cost to you.</p>`,

        // ETPL programs
        `<p style="font-size:14px;font-weight:bold;margin:20px 0 8px">Programs eligible for federal funding:</p>`,
        `<ul style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#444;font-family:Arial,sans-serif;line-height:1.8">`,
        etplList,
        `</ul>`,

        // IndianaCareerConnect instructions
        `<p style="font-size:14px;line-height:1.7;margin:0 0 8px"><strong>If your program is on this list</strong>, here's what to do:</p>`,
        `<ol style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#333;font-family:Arial,sans-serif;line-height:1.9">`,
        `<li>Visit <a href="https://www.indianacareerconnect.com" style="color:#1a1a1a;font-weight:bold">www.indianacareerconnect.com</a> and create an account</li>`,
        `<li>Schedule an appointment with your local WorkOne office</li>`,
        `<li>Let them know you'd like to enroll in <strong>${programLabel}</strong> at Elevate for Humanity</li>`,
        `<li>They'll confirm your eligibility and issue a training voucher</li>`,
        `</ol>`,

        // Divider
        `<div style="border-top:1px solid #e0e0e0;margin:28px 0"></div>`,

        // Waiting list
        `<h3 style="font-size:17px;font-weight:bold;margin:0 0 12px;color:#1a1a1a">Programs Pending ETPL Approval</h3>`,
        `<p style="font-size:14px;line-height:1.7;margin:0 0 8px">The following programs are in the process of being added to the ETPL. Once approved, they'll be eligible for federal funding. In the meantime, you can join the waiting list and we'll notify you as soon as funding opens up:</p>`,
        `<ul style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#444;font-family:Arial,sans-serif;line-height:1.8">`,
        waitlistList,
        `</ul>`,

        // Divider
        `<div style="border-top:1px solid #e0e0e0;margin:28px 0"></div>`,

        // Self-pay
        `<h3 style="font-size:17px;font-weight:bold;margin:0 0 12px;color:#1a1a1a">Don't Want to Wait? Start Now</h3>`,
        `<p style="font-size:14px;line-height:1.7;margin:0 0 12px">If you'd rather not wait for funding approval — or if your program isn't on the ETPL yet — you can begin classes right away with one of these options:</p>`,
        `<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#333;font-family:Arial,sans-serif;line-height:1.9">`,
        `<li><strong>Self-Pay</strong> — pay tuition upfront and start immediately</li>`,
        `<li><strong>Buy Now, Pay Later</strong> — split your tuition into monthly payments</li>`,
        `<li><strong>Deposit + Payment Plan</strong> — put down a deposit and pay the balance over time</li>`,
        `</ul>`,
        `<p style="font-size:14px;line-height:1.7;margin:0 0 16px">To discuss which option works best for you, <a href="${siteUrl}/schedule-consultation" style="color:#1a1a1a;font-weight:bold">schedule a Zoom meeting</a> with our enrollment team or call us at <strong>(317) 314-3757</strong>.</p>`,

        // Closing
        `<div style="border-top:1px solid #e0e0e0;margin:28px 0"></div>`,
        `<p style="font-size:14px;line-height:1.7;margin:0 0 8px">If you have any questions at all, just reply to this email or give us a call at <strong>(317) 314-3757</strong>. We're here to help.</p>`,
        `<p style="font-size:14px;line-height:1.7;margin:0 0 4px">Looking forward to working with you,</p>`,
        `<p style="font-size:14px;margin:0 0 4px"><strong>The Elevate for Humanity Team</strong></p>`,
        `<p style="font-size:12px;color:#999;font-family:Arial,sans-serif;margin:16px 0 0">Ref: ${referenceNumber}</p>`,

        emailFooter,
      ].join(''),
    ).catch((err) => { logger.error('[Apply] Student confirmation email failed:', err instanceof Error ? err.message : err); });
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
          payload.password,
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
              enrollment_state: 'active',
              funding_source: 'pending',
              amount_paid_cents: 0,
            }, { onConflict: 'user_id,program_id', ignoreDuplicates: true })
            .then(({ error: peError }) => {
              if (peError) logger.error('[Apply] program_enrollments insert failed:', peError.message);
              else logger.info('[Apply] program_enrollments created', { userId: accountResult.userId, programId: accountResult.programId });
            });
        }

        await sendEnrollmentEmails(accountResult.magicLink);
        revalidatePath('/admin/applications');
        return { success: true, applicationId: data.id, referenceNumber, email: payload.email };
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
    password: data.password,
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
      email: result.email || data.email,
    };
  }
  return result;
}

export async function submitProgramHolderApplication(data: ProgramHolderApplicationData) {
  // Server-side validation — browser required attrs are not enforcement
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const email = data.email?.trim().toLowerCase();
  const phone = data.phone?.trim();
  const organizationName = data.organizationName?.trim();

  if (!firstName || !lastName || !email || !phone || !organizationName) {
    return { success: false, error: 'Required fields missing: first name, last name, email, phone, and organization name are all required.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please provide a valid email address.' };
  }

  const adminDb = createAdminClient();
  if (!adminDb) {
    return { success: false, error: 'Service temporarily unavailable. Please try again later.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;

  // Step 1: Create or retrieve the auth account.
  // The applicant fills out the form first — we create their account automatically
  // so they don't have to sign up separately before applying.
  let userId: string | null = null;
  let magicLink: string | null = null;

  // Track whether we created the auth user in this request.
  // If the RPC subsequently fails, we delete only users we just created —
  // never an existing user's account.
  let userCreatedInThisRequest = false;

  // Check if account already exists
  const { data: existingProfile } = await adminDb
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingProfile?.id) {
    userId = existingProfile.id;
  } else {
    // Generate a temporary password — applicant will use the magic link to log in
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const tempPassword = `Efh-${Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}!`;

    const { data: newUser, error: createError } = await adminDb.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        role: 'program_holder',
      },
    });

    if (createError || !newUser?.user) {
      logger.error('[Apply] Program holder account creation failed', createError);
      return { success: false, error: 'Could not create your account. Please contact us at info@elevateforhumanity.org.' };
    }

    userId = newUser.user.id;
    userCreatedInThisRequest = true;

    // Upsert profile with program_holder role
    await adminDb.from('profiles').upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      role: 'program_holder',
    }, { onConflict: 'id' });
  }

  // Generate magic link so they can log straight into onboarding
  const linkResult = await adminDb.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/program-holder/onboarding` },
  }).catch((err: any) => { logger.warn('[Apply] Magic link generation failed', err); return null; });

  magicLink = (linkResult as any)?.data?.properties?.action_link || null;

  // Step 2: Atomic DB write — both applications + program_holders in one transaction.
  const { data: rpcResult, error: rpcError } = await adminDb.rpc(
    'submit_program_holder_application',
    {
      p_first_name:         firstName,
      p_last_name:          lastName,
      p_email:              email,
      p_phone:              phone,
      p_organization_name:  organizationName,
      p_user_id:            userId,
      p_organization_type:  data.organizationType || null,
      p_website:            data.website || null,
      p_programs_offered:   data.programsOffered || null,
      p_partnership_goals:  data.partnershipGoals || null,
      p_number_of_students: data.numberOfStudents || null,
      p_reference_number:   referenceNumber,
    }
  );

  if (rpcError) {
    logger.error('[Apply] Program holder RPC failed', rpcError);
    // Clean up the auth user we just created so the applicant can retry cleanly.
    // Do not delete pre-existing accounts.
    if (userCreatedInThisRequest && userId) {
      await adminDb.auth.admin.deleteUser(userId).catch((err: any) =>
        logger.error('[Apply] Failed to clean up orphaned auth user after RPC failure', err)
      );
    }
    return { success: false, error: 'We could not save your application. Please try again or call 317-314-3757.' };
  }

  const applicationId = (rpcResult as any)?.application_id as string;
  logger.info('[Apply] Program holder application submitted', {
    applicationId,
    holderId: (rpcResult as any)?.holder_id,
    userId,
    org: organizationName,
  });

  // Step 3: Send onboarding email to applicant + internal notification.
  // Non-blocking — email failure does not fail the submission.
  try {
    const loginUrl = magicLink || `${siteUrl}/login`;

    await sendEmailDirect(
      email,
      `Welcome to Elevate for Humanity — Complete Your Program Holder Onboarding [Ref: ${referenceNumber}]`,
      `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#ea580c 0%,#dc2626 100%);padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">Application Received</h1>
          <p style="color:#fecaca;margin:8px 0 0;font-size:14px">Program Holder — Elevate for Humanity</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="color:#334155;font-size:16px;line-height:1.7;margin:0 0 16px">Hi ${firstName},</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">
            We received your program holder application for <strong>${organizationName}</strong>.
            Your account has been created — click the button below to access your onboarding portal.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:24px 0">
              <a href="${loginUrl}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:bold;font-size:16px">
                Complete Onboarding →
              </a>
            </td></tr>
          </table>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 8px">
            <strong>Reference number:</strong> ${referenceNumber}
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0">
            Our team will review your application and follow up within 1–3 business days.
            Questions? Call <a href="tel:3173143757" style="color:#dc2626">317-314-3757</a> or
            email <a href="mailto:info@elevateforhumanity.org" style="color:#dc2626">info@elevateforhumanity.org</a>.
          </p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="color:#64748b;font-size:13px;margin:0">Elevate for Humanity | Indianapolis, IN |
            <a href="${siteUrl}" style="color:#ea580c;text-decoration:none">elevateforhumanity.org</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
    );

    await sendEmailDirect(
      'elevate4humanityedu@gmail.com',
      `New Program Holder Application [${referenceNumber}]: ${firstName} ${lastName} — ${organizationName}`,
      `<p><strong>Name:</strong> ${firstName} ${lastName}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Phone:</strong> ${phone}</p>
       <p><strong>Organization:</strong> ${organizationName}</p>
       <p><strong>Type:</strong> ${data.organizationType || '—'}</p>
       <p><strong>Programs Offered:</strong> ${data.programsOffered || '—'}</p>
       <p><strong>Goals:</strong> ${data.partnershipGoals || '—'}</p>
       <p><strong>Reference:</strong> ${referenceNumber}</p>
       <p><strong>Account created:</strong> ${userId}</p>`
    );
  } catch (emailErr) {
    logger.error('[Apply] Program holder onboarding email failed', emailErr as Error);
  }

  return {
    success: true,
    applicationId,
    referenceNumber,
    redirectTo: `/apply/success?role=program-holder&ref=${referenceNumber}`,
  };
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
