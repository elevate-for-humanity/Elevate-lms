// PUBLIC ROUTE: sign-in endpoint — no auth possible
/**
 * Auth API - Sign In
 * Authenticates user with email and password.
 * Protected with rate limiting and input validation.
 *
 * Session tokens are persisted only through Supabase's shared-domain cookie
 * response. They are intentionally not echoed into JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { signInSchema } from '@/lib/api/validation-schemas';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emailService } from '@/lib/notifications/email';

const OWNER_ALERT_PROFILE_ID = '964dc85a-bce8-4e67-92eb-198ffafb2384';

const _POST = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited as NextResponse;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Authentication service is temporarily unavailable.', code: 'AUTH_UNAVAILABLE' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body', code: 'BAD_REQUEST' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const validated = signInSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid sign-in request.', code: 'VALIDATION_ERROR' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { email, password } = validated.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw APIErrors.unauthorized('Invalid email or password');
    }
    if (error.message.includes('Email not confirmed')) {
      throw APIErrors.unauthorized('Please confirm your email before signing in');
    }
    throw APIErrors.external('Supabase Auth');
  }

  if (!data.user || !data.session) {
    throw APIErrors.internal('Authentication failed');
  }

  // Notify the platform owner when a real apprentice or Host Shop user signs in.
  // Alert delivery is isolated so a mail-provider failure never blocks authentication.
  try {
    const db = await requireAdminClient();
    const [{ data: profile }, { data: apprentice }, { data: partnerLinks }, { data: owner }] = await Promise.all([
      db.from('profiles').select('full_name,email').eq('id', data.user.id).maybeSingle(),
      db.from('apprentices').select('id').eq('user_id', data.user.id).eq('status', 'active').maybeSingle(),
      db.from('partner_users').select('partner_id,status,partners(name,shop_name,status,approval_status,is_active,partner_type)').eq('user_id', data.user.id).in('status', ['active','approved']),
      db.from('profiles').select('email').eq('id', OWNER_ALERT_PROFILE_ID).maybeSingle(),
    ]);
    const activeHostLink = (partnerLinks ?? []).find((link: any) => {
      const partner = link.partners;
      return partner && partner.status === 'active' && partner.approval_status === 'approved' && partner.is_active !== false &&
        ['host_shop','barber','training_site','cosmetology_school','salon'].includes(String(partner.partner_type || ''));
    });
    const portalKind = apprentice ? 'Apprentice' : activeHostLink ? 'Host Shop' : null;
    if (portalKind && owner?.email) {
      const displayName = profile?.full_name || profile?.email || data.user.email || 'Portal user';
      const shopName = activeHostLink ? ((activeHostLink as any).partners?.shop_name || (activeHostLink as any).partners?.name) : null;
      const signedInAt = new Date().toISOString();
      await emailService.send({
        to: owner.email,
        subject: `${portalKind} portal sign-in: ${displayName}`,
        text: `${displayName}${shopName ? ` (${shopName})` : ''} signed into the ${portalKind} portal at ${signedInAt}.`,
        html: `<p><strong>${String(displayName).replace(/[&<>"]/g, '')}</strong>${shopName ? ` (${String(shopName).replace(/[&<>"]/g, '')})` : ''} signed into the ${portalKind} portal.</p><p>Time: ${signedInAt}</p>`,
      });
    }
  } catch {
    // Authentication succeeded; monitoring is best-effort and isolated.
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name,
        lastName: data.user.user_metadata?.last_name,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, private, max-age=0',
      },
    },
  );
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const POST = withApiAudit('/api/auth/signin', _POST);
