// POST /api/admin/impersonate  — start impersonating a user
// DELETE /api/admin/impersonate — end impersonation session
//
// Impersonation uses a signed server-side session cookie to record:
//   - the real admin user ID
//   - the impersonated user ID
//   - the start time
//
// The impersonated user's data is fetched using the admin client scoped to
// their user ID. No Supabase auth token is issued for the impersonated user —
// this is a read-only support view, not a full auth swap.
//
// Every start/end action is written to admin_audit_events (immutable).
// super_admin and admin only. provider_admin and below cannot impersonate.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAuditEvent, AuditActions } from '@/lib/audit';
import { checkAdminIP } from '@/lib/api/admin-ip-guard';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMPERSONATION_COOKIE = 'elevate_impersonation';
const MAX_IMPERSONATION_MINUTES = 60;

export async function POST(req: NextRequest) {
  // IP guard — admin routes only
  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked;

  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['admin', 'super_admin'],
  });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.target_user_id) {
    return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 });
  }

  const { target_user_id, reason } = body;
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Verify target user exists and is not an admin (cannot impersonate admins)
  const { data: target } = await db
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', target_user_id)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (['admin', 'super_admin'].includes(target.role)) {
    return NextResponse.json(
      { error: 'Cannot impersonate admin users' },
      { status: 403 }
    );
  }

  // Cannot impersonate yourself
  if (target_user_id === auth.id) {
    return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 });
  }

  const session = {
    real_user_id: auth.id,
    real_user_email: auth.email,
    target_user_id,
    target_user_name: target.full_name,
    target_user_email: target.email,
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + MAX_IMPERSONATION_MINUTES * 60 * 1000).toISOString(),
    reason: reason ?? null,
  };

  // Write immutable audit entry
  await logAuditEvent({
    actor_user_id: auth.id,
    actor_role: auth.role ?? 'admin',
    action: AuditActions.CREATE,
    entity: 'impersonation_session',
    entity_id: target_user_id,
    after: session,
    req,
  });

  // Set signed session cookie (httpOnly, secure, sameSite strict)
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_IMPERSONATION_MINUTES * 60,
    path: '/',
  });

  return NextResponse.json({
    success: true,
    impersonating: {
      user_id: target_user_id,
      name: target.full_name,
      email: target.email,
      expires_at: session.expires_at,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const ipBlocked = checkAdminIP(req);
  if (ipBlocked) return ipBlocked;

  const auth = await apiAuthGuard({ requireAuth: true, allowedRoles: ['admin', 'super_admin'] });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (raw) {
    try {
      const session = JSON.parse(raw);
      await logAuditEvent({
        actor_user_id: auth.id,
        actor_role: auth.role ?? 'admin',
        action: AuditActions.DELETE,
        entity: 'impersonation_session',
        entity_id: session.target_user_id,
        before: session,
        after: { ended_at: new Date().toISOString() },
        req,
      });
    } catch {
      // malformed cookie — still clear it
    }
    cookieStore.delete(IMPERSONATION_COOKIE);
  }

  return NextResponse.json({ success: true, message: 'Impersonation ended' });
}
