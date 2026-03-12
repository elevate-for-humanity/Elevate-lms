import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/sendgrid';
import { workoneOnboardingEmail } from '@/lib/email/templates/workone-onboarding';
import { barberOnboardingEmail } from '@/lib/email/templates/barber-onboarding';
import { logger } from '@/lib/logger';

const ADMIN_BCC = 'admin@elevateforhumanity.org';

/**
 * Cron: resend onboarding email to applicants who haven't responded within 24 hours.
 * Runs daily. Only follows up once (follow_up_count < 1).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find emails sent > 24 hours ago that haven't been followed up and haven't responded
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pending, error } = await supabase
    .from('onboarding_email_log')
    .select('*')
    .eq('status', 'sent')
    .eq('follow_up_count', 0)
    .lt('sent_at', cutoff);

  if (error) {
    logger.error('[Onboarding Follow-up] Query error:', error);
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
  }

  if (!pending?.length) {
    return NextResponse.json({ message: 'No follow-ups needed', count: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const record of pending) {
    const firstName = (record.applicant_name || '').split(' ')[0] || 'there';
    const programName = formatProgramName(record.program || 'your program');

    // Generate the follow-up email (same template with follow-up subject line)
    const isBarber = record.email_type === 'barber';
    const template = isBarber
      ? barberOnboardingEmail({ firstName, programName, applicantEmail: record.applicant_email })
      : workoneOnboardingEmail({ firstName, programName, applicantEmail: record.applicant_email });

    const result = await sendEmail({
      to: record.applicant_email,
      subject: `Follow-Up: ${template.subject}`,
      html: template.html,
      bcc: ADMIN_BCC,
    });

    if (result.success) {
      await supabase
        .from('onboarding_email_log')
        .update({
          follow_up_sent_at: new Date().toISOString(),
          follow_up_count: 1,
          status: 'followed_up',
        })
        .eq('id', record.id);
      sent++;
    } else {
      logger.error(`[Onboarding Follow-up] Failed for ${record.applicant_email}:`, result.error);
      failed++;
    }

    // Rate limit: 100ms between sends
    await new Promise((r) => setTimeout(r, 100));
  }

  return NextResponse.json({
    message: `Follow-up complete: ${sent} sent, ${failed} failed`,
    sent,
    failed,
    total: pending.length,
  });
}

function formatProgramName(slug: string): string {
  const map: Record<string, string> = {
    'cna-cert': 'CNA Certification',
    'cna-certification': 'CNA Certification',
    'phlebotomy-technician': 'Phlebotomy Technician',
    'dental-assistant': 'Dental Assistant',
    'hvac-technician': 'HVAC Technician',
    'cdl-training': 'CDL Commercial Driving',
    'cybersecurity-analyst': 'Cybersecurity Analyst',
    'barber-apprenticeship': 'Barber Apprenticeship',
    'nail-technician': 'Nail Technician',
    'electrical': 'Electrical Technician',
    'peer-recovery-specialist-jri': 'Peer Recovery Specialist',
    'bookkeeping': 'Bookkeeping',
    'tax-prep-financial-services': 'Tax Preparation & Financial Services',
    'beauty-career-educator': 'Beauty Career Educator',
    'home-health-aide': 'Home Health Aide',
  };
  if (map[slug]) return map[slug];
  // Title-case the slug
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
