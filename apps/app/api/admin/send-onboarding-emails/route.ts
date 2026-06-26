import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendEmail } from '@/lib/email/sendgrid';
import { workoneOnboardingEmail } from '@/lib/email/templates/workone-onboarding';
import { barberOnboardingEmail } from '@/lib/email/templates/barber-onboarding';
import { logger } from '@/lib/logger';

import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const ADMIN_BCC = 'elevate4humanityedu@gmail.com';

// Programs that go through the barber/beauty flow (not WorkOne)
const BARBER_PROGRAMS = [
  'barber-apprenticeship',
  'barber apprenticeship',
  'nail-technician',
  'beauty-career-educator',
  'cosmetology',
];

// Test/diagnostic emails to skip
const SKIP_EMAILS = [
  'test.com',
  'test.elevateforhumanity.org',
  PLATFORM_DEFAULTS.canonicalDomain,
  'elizabethpowell6262', // Owner's test applications (deleted)
];

function isBarberProgram(program: string): boolean {
  const p = (program || '').toLowerCase();
  return BARBER_PROGRAMS.some((bp) => p.includes(bp));
}

function isTestEmail(email: string): boolean {
  const e = (email || '').toLowerCase();
  return SKIP_EMAILS.some((s) => e.includes(s));
}

function formatProgramName(slug: string): string {
  const map: Record<string, string> = {
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
    electrical: 'Electrical Technician',
    'peer-recovery-specialist-jri': 'Peer Recovery Specialist',
    bookkeeping: 'Bookkeeping',
    'tax-prep-financial-services': 'Tax Preparation & Financial Services',
    'beauty-career-educator': 'Beauty Career Educator',
    'Home Health Aide': 'Home Health Aide',
    'home-health-aide': 'Home Health Aide',
    Accounting: 'Accounting',
    Entrepreneurship: 'Entrepreneurship',
    'not-sure': 'Career Training',
    Other: 'Career Training',
  };
  if (map[slug]) return map[slug];
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * POST /api/admin/send-onboarding-emails
 *
 * Sends onboarding emails to all pending applicants.
 * - WorkOne email for non-barber programs
 * - Barber email for barber/beauty programs
 * - BCC admin on every email
 * - Logs each send to onboarding_email_log for follow-up tracking
 * - Skips applicants who already received an onboarding email
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  await hydrateProcessEnv();
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_API_SECRET || process.env.CRON_SECRET;
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await requireAdminClient();

  // Get all pending applications (exclude test emails, already-onboarded Maya, employer partners)
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select('id, email, full_name, first_name, last_name, phone, program_interest, status')
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false });

  if (appError) {
    logger.error('[Send Onboarding] Query error:', appError);
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
  }

  // Get already-sent emails to avoid duplicates
  const { data: alreadySent, error: sentError } = await supabase
    .from('onboarding_email_log')
    .select('applicant_email');
  if (sentError) {
    logger.error('[Send Onboarding] Failed to fetch sent log:', sentError);
    return NextResponse.json({ error: 'Failed to fetch email log' }, { status: 500 });
  }

  const sentEmails = new Set((alreadySent || []).map((r) => r.applicant_email.toLowerCase()));

  // Filter and deduplicate
  const seen = new Set<string>();
  const toSend: Array<{
    email: string;
    name: string;
    program: string;
    isBarber: boolean;
  }> = [];

  for (const app of applications || []) {
    const email = (app.email || '').trim().toLowerCase();
    if (!email || isTestEmail(email) || sentEmails.has(email) || seen.has(email)) continue;

    // Skip employer partnerships
    const prog = (app.program_interest || '').toLowerCase();
    if (prog.includes('employer')) continue;

    const name =
      app.full_name || [app.first_name, app.last_name].filter(Boolean).join(' ') || 'Applicant';

    seen.add(email);
    toSend.push({
      email: app.email.trim(),
      name,
      program: app.program_interest || 'Career Training',
      isBarber: isBarberProgram(app.program_interest || ''),
    });
  }

  const results = {
    workone: { sent: 0, failed: 0, recipients: [] as string[] },
    barber: { sent: 0, failed: 0, recipients: [] as string[] },
    skipped: sentEmails.size,
    total: toSend.length,
  };

  for (const applicant of toSend) {
    const firstName = applicant.name.split(' ')[0] || 'there';
    const programName = formatProgramName(applicant.program);
    const emailType = applicant.isBarber ? 'barber' : 'workone';

    const template = applicant.isBarber
      ? barberOnboardingEmail({ firstName, programName, applicantEmail: applicant.email })
      : workoneOnboardingEmail({ firstName, programName, applicantEmail: applicant.email });

    const result = await sendEmail({
      to: applicant.email,
      subject: template.subject,
      html: template.html,
      bcc: ADMIN_BCC,
    });

    if (result.success) {
      // Log the send
      await supabase.from('onboarding_email_log').insert({
        applicant_email: applicant.email.toLowerCase(),
        applicant_name: applicant.name,
        program: applicant.program,
        email_type: emailType,
      });

      results[emailType].sent++;
      results[emailType].recipients.push(`${applicant.name} <${applicant.email}>`);
    } else {
      logger.error(`[Send Onboarding] Failed for ${applicant.email}:`, result.error);
      results[emailType].failed++;
    }

    // Rate limit: 150ms between sends to stay under SendGrid limits
    await new Promise((r) => setTimeout(r, 150));
  }

  return NextResponse.json({
    message: `Onboarding emails sent. WorkOne: ${results.workone.sent}, Barber: ${results.barber.sent}`,
    results,
  });
}
