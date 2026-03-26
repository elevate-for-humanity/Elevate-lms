import { requireAdmin } from '@/lib/auth';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { barberFullOnboardingEmail } from '@/lib/email/templates/barber-full-onboarding';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

/**
 * POST /api/admin/barber-onboarding-blast
 *
 * Sends the full onboarding email to all approved barber applicants
 * who have not yet received it. Generates a unique confirm token per
 * applicant (stored in submit_token). Admin-only — requires service role.
 *
 * Body: { dryRun?: boolean }
 *   dryRun=true → returns the list without sending
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    // Fetch all approved barber applicants who haven't been sent the onboarding email yet
    // We use status = 'approved' (not 'confirmed' or 'declined' — those already responded)
    const { data: applicants, error } = await admin
      .from('applications')
      .select('id, first_name, last_name, email, phone, program_interest, status, submit_token')
      .or('program_interest.ilike.%barber%,program_interest.ilike.%Barber%')
      .eq('status', 'approved')
      .order('last_name');

    if (error) {
      logger.error('[BarberBlast] Query error:', error.message);
      logger.error('Request failed', error instanceof Error ? error : undefined); return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!applicants?.length) {
      return NextResponse.json({ message: 'No approved barber applicants to email', count: 0 });
    }

    // Deduplicate by email (keep most recent)
    const byEmail = new Map<string, typeof applicants[0]>();
    for (const a of applicants) {
      const email = (a.email || '').toLowerCase().trim();
      if (!email) continue;
      // Keep the first one (sorted by last_name, so alphabetical)
      if (!byEmail.has(email)) byEmail.set(email, a);
    }
    const unique = Array.from(byEmail.values());

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        count: unique.length,
        applicants: unique.map((a) => ({
          name: `${a.first_name} ${a.last_name}`,
          email: a.email,
          phone: a.phone,
        })),
      });
    }

    // Send emails
    const results: { name: string; email: string; success: boolean; error?: string }[] = [];

    for (const applicant of unique) {
      // Generate confirm token if not already set
      let token = applicant.submit_token;
      if (!token) {
        token = randomUUID();
        await admin
          .from('applications')
          .update({ submit_token: token })
          .eq('id', applicant.id);
      }

      const emailData = barberFullOnboardingEmail({
        firstName: applicant.first_name || '',
        lastName: applicant.last_name || '',
        email: applicant.email || '',
        applicationId: applicant.id,
        confirmToken: token,
      });

      const result = await sendEmail({
        to: applicant.email,
        subject: emailData.subject,
        html: emailData.html,
        bcc: ADMIN_EMAIL,
      });

      results.push({
        name: `${applicant.first_name} ${applicant.last_name}`,
        email: applicant.email,
        success: result.success,
        error: result.error,
      });

      // Small delay between sends to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    logger.info(`[BarberBlast] Sent ${sent}/${unique.length} onboarding emails (${failed} failed)`);

    return NextResponse.json({
      success: true,
      total: unique.length,
      sent,
      failed,
      results,
    });
  } catch (err) {
    logger.error('[BarberBlast] Error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
