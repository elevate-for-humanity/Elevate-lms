export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { providerApiGuard } from '@/lib/api/provider-guard';

// provider_admin can invite instructor and staff only.
// Only Elevate admins can grant provider_admin role (D9: prevents self-escalation).
const ALLOWED_ROLES = ['instructor', 'staff'];

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const guard = await providerApiGuard();
  if (guard.error) return guard.error;
  const { userId: inviterId, tenantId } = guard;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return safeError('Invalid request body', 400); }

  const { email, role, fullName } = body as Record<string, string>;

  if (!email?.trim()) return safeError('Email is required', 400);
  if (!ALLOWED_ROLES.includes(role)) return safeError('Invalid role. Providers may only invite instructor or staff.', 400);

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: existingUser } = await db.auth.admin.getUserByEmail(email);

  let authUserId: string;

  if (existingUser?.user) {
    authUserId = existingUser.user.id;
    await db.from('profiles').upsert({
      id: authUserId,
      email,
      full_name: fullName || existingUser.user.user_metadata?.full_name || null,
      role,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } else {
    const { data: newUser, error: createError } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || null,
        tenant_id: tenantId,
        invited_by: inviterId,
      },
    });
    if (createError || !newUser?.user) {
      return safeInternalError(createError, 'Failed to create user');
    }
    authUserId = newUser.user.id;

    await db.from('profiles').insert({
      id: authUserId,
      email,
      full_name: fullName || null,
      role,
      tenant_id: tenantId,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
  const { data: magicLinkData } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/provider/dashboard` },
  });
  const loginLink = magicLinkData?.properties?.action_link ?? `${siteUrl}/login`;

  await db.from('notification_outbox').insert({
    to_email: email,
    template_key: 'inquiry_received',
    template_data: {
      name: fullName || email,
      inquiry_type: `staff invitation (${role})`,
      site_url: loginLink,
    },
    status: 'queued',
    scheduled_for: new Date().toISOString(),
  }).catch(() => {});

  return NextResponse.json({ success: true, userId: authUserId });
}
