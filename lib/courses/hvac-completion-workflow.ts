/**
 * HVAC Course Completion Workflow
 *
 * Orchestrates the post-module credential flow:
 * 1. Student completes all 16 HVAC modules + quizzes
 * 2. Email: "Complete OSHA 10" with CareerSafe link
 * 3. Student uploads OSHA 10 certificate
 * 4. Email: "Complete CPR/AED" with CareerSafe link
 * 5. Student uploads CPR certificate
 * 6. Email: "Schedule EPA 608 proctored exam"
 * 7. Student passes EPA 608 → uploads cert
 * 8. Email: Certificate of Completion from Elevate for Humanity
 *
 * Each step is triggered by checking the student's credential status
 * and sending the next email in the sequence.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { setAuditContext } from '@/lib/audit-context';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { HVAC_COURSE_ID, HVAC_PROGRAM_ID } from './hvac-uuids';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.elevateforhumanity.org';

// Credential steps in order
export const HVAC_CREDENTIAL_STEPS = [
  {
    id: 'osha-10',
    name: 'OSHA 10-Hour Construction',
    provider: 'CareerSafe',
    externalUrl: 'https://www.careersafeonline.com',
    requiredBefore: 'cpr',
  },
  {
    id: 'cpr',
    name: 'CPR/AED/First Aid',
    provider: 'CareerSafe',
    externalUrl: 'https://www.careersafeonline.com',
    requiredBefore: 'epa-608',
  },
  {
    id: 'epa-608',
    name: 'EPA 608 Universal Certification',
    provider: 'ESCO/Mainstream Engineering',
    externalUrl: null, // Scheduled by Elevate
    requiredBefore: 'completion',
  },
] as const;

interface StudentInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9fafb;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="background:#1e293b;padding:30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:24px;">Elevate for Humanity</h1>
<p style="color:#94a3b8;margin:8px 0 0;font-size:14px;">HVAC Technician Training Program</p>
</td></tr>
<tr><td style="padding:40px 30px;">${content}</td></tr>
<tr><td style="padding:20px 30px;background:#f1f5f9;text-align:center;">
<p style="color:#64748b;font-size:12px;margin:0;">Elevate for Humanity | ETPL #10004322</p>
<p style="color:#64748b;font-size:12px;margin:4px 0 0;">info@elevateforhumanity.org</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Send OSHA 10 completion email after all HVAC modules are done.
 */
export async function sendOsha10Email(student: StudentInfo) {
  const html = emailWrapper(`
    <h2 style="color:#1e293b;margin:0 0 16px;">Congratulations, ${student.firstName}!</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;">
      You've completed all HVAC course modules. Your next step is to complete your
      <strong>OSHA 10-Hour Construction Safety</strong> certification through CareerSafe.
    </p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">
      Your CareerSafe login credentials were provided during enrollment. If you need them resent,
      contact your case manager.
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="https://www.careersafeonline.com" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
        Go to CareerSafe →
      </a>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#1e40af;font-size:14px;margin:0;"><strong>After completing OSHA 10:</strong></p>
      <ol style="color:#1e40af;font-size:14px;margin:8px 0 0;padding-left:20px;">
        <li>Download your CareerSafe certificate (PDF)</li>
        <li>Upload it in your <a href="${APP_URL}/lms/certificates" style="color:#2563eb;">student portal</a></li>
        <li>We'll send your next step (CPR/AED certification)</li>
      </ol>
    </div>
  `);

  return sendEmail({
    to: student.email,
    subject: 'Next Step: Complete OSHA 10-Hour Construction Safety',
    html,
  });
}

/**
 * Send CPR/AED email after OSHA 10 is uploaded.
 */
export async function sendCprEmail(student: StudentInfo) {
  const html = emailWrapper(`
    <h2 style="color:#1e293b;margin:0 0 16px;">OSHA 10 Complete — Next: CPR/AED</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;">
      ${student.firstName}, your OSHA 10-Hour Construction Safety certificate has been verified.
      Your next credential is <strong>CPR/AED/First Aid</strong> through CareerSafe.
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="https://www.careersafeonline.com" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
        Go to CareerSafe →
      </a>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#1e40af;font-size:14px;margin:0;"><strong>After completing CPR/AED:</strong></p>
      <ol style="color:#1e40af;font-size:14px;margin:8px 0 0;padding-left:20px;">
        <li>Download your CPR/AED certificate (PDF)</li>
        <li>Upload it in your <a href="${APP_URL}/lms/certificates" style="color:#2563eb;">student portal</a></li>
        <li>We'll schedule your EPA 608 proctored exam</li>
      </ol>
    </div>
  `);

  return sendEmail({
    to: student.email,
    subject: 'Next Step: Complete CPR/AED/First Aid Certification',
    html,
  });
}

/**
 * Send EPA 608 scheduling email after CPR is uploaded.
 */
export async function sendEpa608SchedulingEmail(student: StudentInfo) {
  const html = emailWrapper(`
    <h2 style="color:#1e293b;margin:0 0 16px;">CPR Complete — Schedule Your EPA 608 Exam</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;">
      ${student.firstName}, you've completed all prerequisite credentials. You're now eligible to take the
      <strong>EPA Section 608 Universal Certification</strong> proctored exam.
    </p>
    <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#92400e;font-size:14px;margin:0;"><strong>Exam Details:</strong></p>
      <ul style="color:#92400e;font-size:14px;margin:8px 0 0;padding-left:20px;">
        <li>Administered by an EPA-approved certifying organization</li>
        <li>Covers Core, Type I, Type II, and Type III sections</li>
        <li>70% passing score on each section for Universal certification</li>
        <li>Open-book format with EPA-provided reference materials</li>
      </ul>
    </div>
    <p style="color:#334155;font-size:16px;line-height:1.6;">
      Your program coordinator will contact you within 48 hours to schedule your exam date and location.
      You can also reply to this email to request a specific date.
    </p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${APP_URL}/courses/epa-608" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
        Review EPA 608 Study Materials →
      </a>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      After passing, upload your EPA 608 certification card in your student portal to receive your
      Certificate of Completion from Elevate for Humanity.
    </p>
  `);

  return sendEmail({
    to: student.email,
    subject: 'Schedule Your EPA 608 Universal Certification Exam',
    html,
  });
}

/**
 * Send final Certificate of Completion email after EPA 608 is uploaded.
 */
export async function sendCompletionCertificateEmail(
  student: StudentInfo,
  certificateUrl: string,
  verificationCode: string,
) {
  const verifyUrl = `${APP_URL}/verify/${verificationCode}`;

  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:30px;">
      <div style="display:inline-block;width:80px;height:80px;background:#dcfce7;border-radius:50%;line-height:80px;font-size:40px;">&#10003;</div>
    </div>
    <h2 style="color:#1e293b;margin:0 0 16px;text-align:center;">Program Complete!</h2>
    <p style="color:#334155;font-size:16px;line-height:1.6;text-align:center;">
      ${student.firstName}, congratulations on completing the <strong>HVAC Technician Training Program</strong>
      at Elevate for Humanity.
    </p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:24px 0;">
      <h3 style="color:#166534;margin:0 0 12px;">Credentials Earned:</h3>
      <ul style="color:#166534;font-size:14px;margin:0;padding-left:20px;">
        <li>EPA Section 608 Universal Certification</li>
        <li>OSHA 10-Hour Construction Safety</li>
        <li>CPR/AED/First Aid</li>
        <li>Residential HVAC Certification 1</li>
        <li>Residential HVAC Certification 2</li>
      </ul>
    </div>
    <div style="text-align:center;margin:30px 0;">
      <a href="${certificateUrl}" style="display:inline-block;padding:14px 32px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
        Download Your Certificate →
      </a>
    </div>
    <p style="color:#64748b;font-size:14px;text-align:center;">
      Verification: <a href="${verifyUrl}" style="color:#2563eb;">${verifyUrl}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:30px 0;">
    <h3 style="color:#1e293b;margin:0 0 12px;">What's Next?</h3>
    <ul style="color:#334155;font-size:14px;line-height:1.8;padding-left:20px;">
      <li>Your career services coordinator will reach out about job placement</li>
      <li>Update your resume with your new credentials</li>
      <li>Join our alumni network for ongoing support</li>
    </ul>
  `);

  return sendEmail({
    to: student.email,
    subject: 'Certificate of Completion — HVAC Technician Training Program',
    html,
  });
}

/**
 * Check student's credential status and trigger the next email in the sequence.
 * Called after:
 * - All modules completed (triggers OSHA 10 email)
 * - OSHA 10 cert uploaded (triggers CPR email)
 * - CPR cert uploaded (triggers EPA 608 scheduling email)
 * - EPA 608 cert uploaded (triggers completion certificate email)
 */
export async function advanceHvacWorkflow(userId: string): Promise<{
  action: string;
  emailSent: boolean;
}> {
  const db = await getAdminClient();
  if (!db) return { action: 'error', emailSent: false };

  await setAuditContext(db, { systemActor: 'hvac_completion_workflow' });

  // Get student info
  const { data: profile } = await db
    .from('profiles')
    .select('id, email, full_name, first_name, last_name')
    .eq('id', userId)
    .single();

  if (!profile?.email) return { action: 'no_profile', emailSent: false };

  const student: StudentInfo = {
    userId,
    email: profile.email,
    firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Student',
    lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
  };

  // Check certification submissions for this student + HVAC program
  const { data: submissions } = await db
    .from('certification_submissions')
    .select('certification_name, status')
    .eq('user_id', userId)
    .eq('program_id', 'hvac-technician');

  const approved = (name: string) =>
    submissions?.some((s) => s.certification_name === name && s.status === 'approved') ?? false;

  const oshaComplete = approved('OSHA 10-Hour Construction');
  const cprComplete = approved('CPR/AED/First Aid');
  const epa608Complete = approved('EPA 608 Universal');

  // Check if all internal lessons are complete
  const { data: lessonProgress } = await db
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('course_id', HVAC_COURSE_ID)
    .eq('completed', true);

  const { data: allLessons } = await db
    .from('training_lessons')
    .select('id')
    .eq('course_id_uuid', HVAC_COURSE_ID);

  const totalLessons = allLessons?.length || 94;
  const completedLessons = lessonProgress?.length || 0;
  const allModulesComplete = completedLessons >= totalLessons;

  // Check what emails have already been sent (prevent duplicates)
  const { data: sentEmails } = await db
    .from('email_logs')
    .select('type')
    .eq('user_id', userId)
    .in('type', ['hvac-osha10', 'hvac-cpr', 'hvac-epa608-schedule', 'hvac-completion']);

  const alreadySent = (templateId: string) =>
    sentEmails?.some((e) => e.type === templateId) ?? false;

  // Log email send to prevent duplicates
  async function logEmailSent(templateId: string) {
    await db.from('email_logs').insert({
      user_id: userId,
      type: templateId,
      recipient_email: student.email,
      subject: `HVAC workflow: ${templateId}`,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }).then(() => {});
  }

  // Determine next action
  if (epa608Complete) {
    if (!alreadySent('hvac-completion')) {
      // Issue certificate and send completion email
      const { data: cert } = await db
        .from('certificates')
        .insert({
          user_id: userId,
          certificate_type: 'PROGRAM_COMPLETION',
          certificate_subtype: 'hvac-technician',
          issued_at: new Date().toISOString(),
          metadata: JSON.stringify({
            program: 'HVAC Technician',
            credentials: ['EPA 608 Universal', 'OSHA 10', 'CPR/AED', 'Residential HVAC 1', 'Residential HVAC 2'],
            completedLessons,
            totalLessons,
          }),
        })
        .select('id, verification_code')
        .single();

      const certUrl = `${APP_URL}/certificates/${cert?.id || ''}`;
      const verCode = cert?.verification_code || cert?.id || '';
      await sendCompletionCertificateEmail(student, certUrl, verCode);
      await logEmailSent('hvac-completion');
      return { action: 'completion_certificate_sent', emailSent: true };
    }
    return { action: 'already_complete', emailSent: false };
  }

  if (cprComplete && !epa608Complete) {
    if (!alreadySent('hvac-epa608-schedule')) {
      await sendEpa608SchedulingEmail(student);
      await logEmailSent('hvac-epa608-schedule');
      return { action: 'epa608_scheduling_sent', emailSent: true };
    }
    return { action: 'awaiting_epa608', emailSent: false };
  }

  if (oshaComplete && !cprComplete) {
    if (!alreadySent('hvac-cpr')) {
      await sendCprEmail(student);
      await logEmailSent('hvac-cpr');
      return { action: 'cpr_email_sent', emailSent: true };
    }
    return { action: 'awaiting_cpr', emailSent: false };
  }

  if (allModulesComplete && !oshaComplete) {
    if (!alreadySent('hvac-osha10')) {
      await sendOsha10Email(student);
      await logEmailSent('hvac-osha10');
      return { action: 'osha10_email_sent', emailSent: true };
    }
    return { action: 'awaiting_osha10', emailSent: false };
  }

  return {
    action: `in_progress_${completedLessons}/${totalLessons}`,
    emailSent: false,
  };
}
