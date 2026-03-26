/**
 * POST /api/system/reconcile-payment
 *
 * Checks Stripe live for a paid session tied to an application,
 * repairs the enrollment if missing, and returns the current state.
 *
 * Called by:
 *   - Dashboard auto-repair (user lands on dashboard, paid but not enrolled)
 *   - Admin manual trigger
 *   - Cron reconciliation job
 *
 * Auth: authenticated user (own application_id) OR admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import * as Sentry from '@sentry/nextjs';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const SYSTEM_ACTOR = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Auth: must be authenticated
  const { createClient } = await import('@/lib/supabase/server');
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  let body: { application_id?: string };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { application_id } = body;
  if (!application_id) return safeError('application_id required', 400);

  // Authorization: user can only reconcile their own application unless admin
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['admin', 'super_admin', 'staff'].includes(profile?.role ?? '');

  if (!isAdmin) {
    const { data: app } = await db
      .from('applications')
      .select('user_id')
      .eq('id', application_id)
      .single();
    if (!app || app.user_id !== user.id) {
      return safeError('Forbidden', 403);
    }
  }

  try {
    return await reconcileApplication(db, application_id, user.id);
  } catch (err) {
    Sentry.captureException(err, { tags: { subsystem: 'reconcile_payment' } });
    return safeInternalError(err, 'Reconciliation failed');
  }
}

async function reconcileApplication(
  db: ReturnType<typeof createAdminClient>,
  applicationId: string,
  actorId: string,
) {
  // 1. Load application
  const { data: app, error: appErr } = await db!
    .from('applications')
    .select('id, user_id, program_slug, status, payment_status, funding_verified')
    .eq('id', applicationId)
    .single();

  if (appErr || !app) return safeError('Application not found', 404);

  // 2. Check existing enrollment
  const { data: existingEnrollment } = await db!
    .from('program_enrollments')
    .select('id, enrollment_state')
    .eq('user_id', app.user_id)
    .eq('program_slug', app.program_slug)
    .maybeSingle();

  if (existingEnrollment?.enrollment_state === 'active') {
    return NextResponse.json({
      status: 'already_enrolled',
      enrollment_id: existingEnrollment.id,
      action: 'none',
    });
  }

  // 3. Check stripe_sessions_staging (synced from Stripe)
  const { data: stagingSession } = await db!
    .from('stripe_sessions_staging')
    .select('session_id, amount, created_at')
    .eq('application_id', applicationId)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 4. If not in staging, check Stripe live
  let stripeSession = stagingSession;
  if (!stripeSession && stripe) {
    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
        expand: ['data.payment_intent'],
      });
      const match = sessions.data.find(
        s => s.metadata?.application_id === applicationId && s.payment_status === 'paid'
      );
      if (match) {
        // Upsert into staging so future checks are fast
        await db!.rpc('upsert_stripe_session', {
          _session_id:     match.id,
          _payment_intent: typeof match.payment_intent === 'string'
            ? match.payment_intent
            : (match.payment_intent as any)?.id ?? null,
          _email:          match.customer_details?.email ?? null,
          _amount:         match.amount_total ?? 0,
          _currency:       match.currency ?? 'usd',
          _created_at:     new Date(match.created * 1000).toISOString(),
          _application_id: applicationId,
          _program_slug:   match.metadata?.program_slug ?? app.program_slug,
          _user_id:        match.metadata?.user_id ?? null,
          _student_id:     match.metadata?.student_id ?? null,
          _kind:           match.metadata?.kind ?? 'program_enrollment',
          _raw:            match as any,
        });
        stripeSession = { session_id: match.id, amount: match.amount_total ?? 0, created_at: new Date(match.created * 1000).toISOString() };
        logger.info('[reconcile] Found Stripe session live, upserted to staging', { applicationId, sessionId: match.id });
      }
    } catch (stripeErr) {
      logger.warn('[reconcile] Stripe live check failed', stripeErr);
    }
  }

  if (!stripeSession && !app.funding_verified) {
    return NextResponse.json({
      status: 'no_payment_found',
      action: 'none',
      message: 'No paid Stripe session and no verified funding for this application.',
    });
  }

  // 5. Payment confirmed — attempt enrollment via RPC
  // Update application to ready_to_enroll if needed so RPC state gate passes,
  // OR use stripe_repair source to bypass state gate
  const { data: result, error: rpcErr } = await db!.rpc('enroll_application', {
    p_application_id: applicationId,
    p_actor_id:       actorId ?? SYSTEM_ACTOR,
    p_source:         'stripe_repair',
  });

  if (rpcErr) {
    logger.error('[reconcile] enroll_application RPC failed', rpcErr);

    // Log the failure for admin review
    await db!.from('payment_integrity_flags').insert({
      entity_type: 'program_enrollment',
      entity_id:   app.user_id, // best proxy without enrollment id
      flag_type:   'reconcile_rpc_failed',
      flag_reason: rpcErr.message,
      metadata: { application_id: applicationId, rpc_error: rpcErr.message },
    }).then(() => {}).catch(() => {});

    return safeError(`Enrollment failed: ${rpcErr.message}`, 422);
  }

  logger.info('[reconcile] Enrollment repaired', { applicationId, result });

  return NextResponse.json({
    status: 'repaired',
    enrollment_id: result?.enrollment_id,
    delivery_model: result?.delivery_model,
    stripe_paid: result?.stripe_paid,
    action: 'enrolled',
  });
}
