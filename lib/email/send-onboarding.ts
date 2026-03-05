/**
 * Sends the appropriate onboarding email (WorkOne or Barber) after
 * an application is submitted. Logs to onboarding_email_log for
 * follow-up tracking. BCC's admin on every send.
 *
 * Called automatically from application submission routes.
 */

import { sendEmail } from './sendgrid';
import { workoneOnboardingEmail } from './templates/workone-onboarding';
import { barberOnboardingEmail } from './templates/barber-onboarding';
import { logger } from '@/lib/logger';

const ADMIN_BCC = 'elevate4humanityedu@gmail.com';

const BARBER_KEYWORDS = ['barber', 'nail', 'beauty', 'cosmet'];

const PROGRAM_NAMES: Record<string, string> = {
  'cna-cert': 'CNA Certification',
  'cna-certification': 'CNA Certification',
  'CNA (Certified Nursing Assistant)': 'CNA Certification',
  'phlebotomy-technician': 'Phlebotomy Technician',
  'dental-assistant': 'Dental Assistant',
  'hvac-technician': 'HVAC Technician',
  'HVAC Technician': 'HVAC Technician',
  'cdl-training': 'CDL Commercial Driving',
  'cybersecurity-analyst': 'Cybersecurity Analyst',
  'barber-apprenticeship': 'Barber Apprenticeship',
  'Barber Apprenticeship': 'Barber Apprenticeship',
  'nail-technician': 'Nail Technician',
  'electrical': 'Electrical Technician',
  'peer-recovery-specialist-jri': 'Peer Recovery Specialist',
  'bookkeeping': 'Bookkeeping',
  'tax-prep-financial-services': 'Tax Preparation & Financial Services',
  'Home Health Aide': 'Home Health Aide',
  'Accounting': 'Accounting',
  'Entrepreneurship': 'Entrepreneurship',
  'not-sure': 'Career Training',
  'Other': 'Career Training',
};

function formatProgramName(slug: string): string {
  if (PROGRAM_NAMES[slug]) return PROGRAM_NAMES[slug];
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function isBarberProgram(program: string): boolean {
  const p = (program || '').toLowerCase();
  return BARBER_KEYWORDS.some((k) => p.includes(k));
}

interface SendOnboardingParams {
  email: string;
  name: string;
  program: string;
}

/**
 * Send onboarding email with next steps and Calendly scheduling link.
 * Non-blocking — catches all errors internally.
 */
export async function sendOnboardingEmail(params: SendOnboardingParams): Promise<void> {
  try {
    const firstName = (params.name || '').split(' ')[0] || 'there';
    const programName = formatProgramName(params.program);
    const isBarber = isBarberProgram(params.program);
    const emailType = isBarber ? 'barber' : 'workone';

    const template = isBarber
      ? barberOnboardingEmail({ firstName, programName, applicantEmail: params.email })
      : workoneOnboardingEmail({ firstName, programName, applicantEmail: params.email });

    const result = await sendEmail({
      to: params.email,
      subject: `Action Required: Schedule Your ${programName} Orientation - Elevate for Humanity`,
      html: template.html,
      bcc: ADMIN_BCC,
    });

    if (result.success) {
      logger.info(`[Onboarding] ${emailType} email sent to ${params.email} (${programName})`);

      // Log to DB for follow-up tracking (non-blocking)
      logOnboardingEmail(params.email, params.name, params.program, emailType).catch((err) => {
        logger.error('[Onboarding] DB log failed (non-blocking):', err);
      });
    } else {
      logger.error(`[Onboarding] Failed to send to ${params.email}:`, result.error);
    }
  } catch (err) {
    logger.error('[Onboarding] Unexpected error:', err);
  }
}

async function logOnboardingEmail(
  email: string,
  name: string,
  program: string,
  emailType: string,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  await fetch(`${supabaseUrl}/rest/v1/onboarding_email_log`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      applicant_email: email.toLowerCase(),
      applicant_name: name,
      program,
      email_type: emailType,
      status: 'sent',
    }),
  });
}
