import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { runPostApprovalActions } from '@/lib/enrollment/post-approval';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/applications/[id]/resend-onboarding
 *
 * Resends the enrollment/onboarding email for an approved application.
 * Used to unblock applicants who never received or acted on the original email.
 * Also stamps onboarding_sent_at on the application row.
 */
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = await requireAdminClient();

  // Load application
  const { data: app, error: appErr } = await db
    .from('applications')
    .select('id, email, first_name, last_name, phone, program_slug, program_interest, program_id, funding_type, status, user_id')
    .eq('id', id)
    .maybeSingle();

  if (appErr || !app) {
    return NextResponse.json({ error: 'Requested application is unavailable' }, { status: 404 });
  }

  if (!app.email) {
    return NextResponse.json({ error: 'Application has no email address' }, { status: 400 });
  }

  // Resolve program slug — may be null on older applications
  let programSlug = app.program_slug || app.program_interest || null;
  if (!programSlug && app.program_id) {
    const { data: prog } = await db
      .from('programs')
      .select('slug')
      .eq('id', app.program_id)
      .maybeSingle();
    if (prog?.slug) programSlug = prog.slug;
  }

  // Existing provisioned accounts may never have received credentials. Generate
  // a fresh one-time recovery link instead of assuming they know a password.
  const tempPassword: string | null = null;
  let passwordSetupLink: string | null = null;
  let enrollmentId: string | null = null;

  if (app.user_id) {
    const { data: pe } = await db
      .from('program_enrollments')
      .select('id')
      .eq('user_id', app.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    enrollmentId = pe?.id ?? null;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl).trim();
    const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
      type: 'recovery',
      email: app.email,
      options: { redirectTo: `${siteUrl}/auth/callback?redirect=/onboarding/learner` },
    });
    if (!linkError && linkData?.properties?.action_link) {
      passwordSetupLink = linkData.properties.action_link;
    } else {
      logger.warn('[resend-onboarding] Recovery link generation failed; forgot-password remains available', {
        applicationId: id,
        email: app.email,
        error: linkError?.message,
      });
    }
  }

  const studentName = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email;

  try {
    await runPostApprovalActions({
      db,
      applicationId: id,
      programSlug,
      studentEmail: app.email,
      studentName,
      studentPhone: app.phone ?? null,
      fundingType: app.funding_type ?? null,
      tempPassword,
      passwordSetupLink,
      enrollmentId,
    });

    // Stamp onboarding_sent_at
    await db
      .from('applications')
      .update({ onboarding_sent_at: new Date().toISOString() })
      .eq('id', id);

    logger.info('[resend-onboarding] Onboarding email resent', {
      applicationId: id,
      email: app.email,
      adminId: auth.id,
    });

    return NextResponse.json({ success: true, email: app.email });
  } catch (err) {
    logger.error('[resend-onboarding] Failed to resend onboarding email', err);
    return NextResponse.json({ error: 'Failed to send onboarding email' }, { status: 500 });
  }
}

export const POST = _POST;
