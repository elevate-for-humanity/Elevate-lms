
// POST /api/provider/applications/[id]/review
// Body: { action: 'approve' | 'deny' | 'under_review', reviewNotes?: string }
//
// Admin-only. Thin wrapper around DB RPCs:
//   approve      → provision_provider() [atomic: tenant + audit] then auth user creation
//   deny         → deny_provider() [atomic: status + audit]
//   under_review → mark_provider_under_review() [atomic: status + audit]
//
// Auth user creation and magic link generation happen here (post-RPC) because
// they require the Supabase admin API, which is not available inside SQL.
// If auth user creation fails after provision_provider() succeeds, the application
// remains 'approved' with tenant_id set — admin can retry and the RPC returns
// idempotent=true, skipping tenant creation.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = ['approve', 'deny', 'under_review'] as const;
type ReviewAction = typeof VALID_ACTIONS[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const { id: applicationId } = await params;

  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  let body: { action: ReviewAction; reviewNotes?: string };
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const { action, reviewNotes } = body;
  if (!VALID_ACTIONS.includes(action)) {
    return safeError('action must be approve, deny, or under_review', 400);
  }

  // ── under_review ──────────────────────────────────────────────────────────
  if (action === 'under_review') {
    const { data, error } = await db.rpc('mark_provider_under_review', {
      p_application_id: applicationId,
      p_admin_user_id: user.id,
    });
    if (error) return safeInternalError(error, 'Failed to update status');
    if (!data?.success) return safeError(data?.message ?? 'Failed to update status', 409);
    return NextResponse.json({ success: true, status: 'under_review' });
  }

  // ── deny ──────────────────────────────────────────────────────────────────
  if (action === 'deny') {
    const { data, error } = await db.rpc('deny_provider', {
      p_application_id: applicationId,
      p_admin_user_id: user.id,
      p_reason: reviewNotes ?? null,
    });
    if (error) return safeInternalError(error, 'Failed to deny application');
    if (!data?.success && !data?.idempotent) {
      return safeError(data?.message ?? 'Denial failed', 409);
    }
    return NextResponse.json({ success: true, status: 'denied' });
  }

  // ── approve ───────────────────────────────────────────────────────────────
  // Step 1: DB-atomic provisioning (tenant + audit + status update)
  const { data: provisionResult, error: provisionError } = await db.rpc('provision_provider', {
    p_application_id: applicationId,
    p_admin_user_id: user.id,
    p_review_notes: reviewNotes ?? null,
  });

  if (provisionError) return safeInternalError(provisionError, 'Provisioning failed');
  if (!provisionResult?.success) {
    const status = provisionResult?.code === 'NOT_FOUND' ? 404
      : provisionResult?.code === 'INVALID_STATUS' ? 409
      : 500;
    return safeError(provisionResult?.message ?? 'Provisioning failed', status);
  }

  const { tenant_id, contact_email, contact_name, org_name, idempotent } = provisionResult;

  // Step 2: Locate or create auth user.
  // getUserByEmail is a targeted O(1) lookup — no list-all enumeration.
  let authUserId: string;
  const { data: existingUser } = await db.auth.admin.getUserByEmail(contact_email);

  if (existingUser?.user) {
    authUserId = existingUser.user.id;
  } else {
    const { data: newUser, error: createError } = await db.auth.admin.createUser({
      email: contact_email,
      email_confirm: true,
      user_metadata: { full_name: contact_name, tenant_id },
    });
    if (createError || !newUser?.user) {
      // Tenant is provisioned and application is approved — safe to retry.
      // 207 signals partial success so the admin UI can prompt for retry.
      return NextResponse.json({
        success: true,
        status: 'approved',
        tenantId: tenant_id,
        warning: 'Tenant provisioned but auth user creation failed. Retry to complete.',
      }, { status: 207 });
    }
    authUserId = newUser.user.id;
  }

  // Step 3: Upsert profile with provider_admin role + tenant_id
  await db.from('profiles').upsert({
    id: authUserId,
    email: contact_email,
    full_name: contact_name,
    role: 'provider_admin',
    tenant_id,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  // Step 4: Generate magic link for first login
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const { data: magicLinkData } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: contact_email,
    options: { redirectTo: `${siteUrl}/provider/dashboard` },
  });
  const loginLink = magicLinkData?.properties?.action_link ?? `${siteUrl}/login`;

  // Step 5: Queue welcome email (non-blocking — failure does not roll back approval)
  await db.from('notification_outbox').insert({
    to_email: contact_email,
    template_key: 'provider_approved',
    template_data: { contact_name, org_name, login_link: loginLink, tenant_id },
    status: 'queued',
    scheduled_for: new Date().toISOString(),
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    status: 'approved',
    tenantId: tenant_id,
    providerUserId: authUserId,
    idempotent: idempotent ?? false,
  });
}
