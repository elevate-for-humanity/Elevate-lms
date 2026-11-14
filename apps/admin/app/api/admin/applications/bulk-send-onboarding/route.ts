import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { runPostApprovalActions } from '@/lib/enrollment/post-approval';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/applications/bulk-send-onboarding
 *
 * Sends onboarding emails to guest applicants (user_id = null, onboarding_sent_at = null).
 * Processes up to 50 at a time to stay within the 60s timeout.
 *
 * Body: { limit?: number } — defaults to 50
 */
async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(body.limit ?? 50, 50);

  // Fetch guest apps with no onboarding email sent
  const { data: apps, error } = await db
    .from('applications')
    .select('id, email, first_name, last_name, phone, program_slug, program_interest, program_id, funding_type, status')
    .is('user_id', null)
    .is('onboarding_sent_at', null)
    .in('status', ['submitted', 'pending_admin_review', 'under_review', 'approved'])
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !apps) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }

  const results = { sent: 0, failed: 0, skipped: 0, emails: [] as string[] };

  for (const app of apps) {
    if (!app.email) { results.skipped++; continue; }

    // Resolve program slug
    let programSlug = app.program_slug || app.program_interest || null;
    if (!programSlug && app.program_id) {
      const { data: prog } = await db
        .from('programs').select('slug').eq('id', app.program_id).maybeSingle();
      if (prog?.slug) programSlug = prog.slug;
    }

    const studentName = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.email;

    try {
      await runPostApprovalActions({
        db,
        applicationId: app.id,
        programSlug,
        studentEmail: app.email,
        studentName,
        studentPhone: app.phone ?? null,
        fundingType: app.funding_type ?? null,
        tempPassword: null,
        enrollmentId: null,
      });

      await db
        .from('applications')
        .update({ onboarding_sent_at: new Date().toISOString() })
        .eq('id', app.id);

      results.sent++;
      results.emails.push(app.email);
    } catch (err) {
      logger.error('[bulk-send-onboarding] Failed for', undefined, { email: app.email, err });
      results.failed++;
    }
  }

  logger.info('[bulk-send-onboarding] Complete', { ...results, adminId: auth.id });
  return NextResponse.json({ success: true, ...results, total: apps.length });
}

export const POST = _POST;
