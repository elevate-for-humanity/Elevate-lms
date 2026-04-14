// app/api/privacy/delete/route.ts
// GDPR/CCPA: Right to be forgotten
//
// IDOR fix: previously accepted an email in the request body and anonymized
// that user's account. An authenticated user could delete any other user's
// account by supplying a different email. Now the deletion is always scoped
// to the authenticated session user.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent, AuditActions, getRequestMetadata } from '@/lib/audit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  // Auth: require authenticated session
  const { createClient: createAuthClient } = await import('@/lib/supabase/server');
  const authSupabase = await createAuthClient();
  const { data: { session: authSession } } = await authSupabase.auth.getSession();
  if (!authSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Deletion is always for the authenticated user — never caller-supplied email
  const sessionUserId = authSession.user.id;

  const supabase = await getAdminClient();
  const { reason } = await req.json().catch(() => ({ reason: undefined }));

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, email, tenant_id')
    .eq('id', sessionUserId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Soft-delete: anonymize personal identifiers, retain compliance data
  const anonymizedEmail = `deleted+${user.id}@example.local`;

  await supabase
    .from('profiles')
    .update({
      email: anonymizedEmail,
      full_name: 'Deleted User',
      phone: null,
      address: null,
      deleted_at: new Date().toISOString(),
      delete_reason: reason || 'user_request',
    })
    .eq('id', user.id);

  const { ipAddress, userAgent } = getRequestMetadata(req);
  await logAuditEvent({
    tenantId: user.tenant_id,
    userId: user.id,
    action: AuditActions.DATA_DELETED,
    resourceType: 'user',
    resourceId: user.id,
    metadata: { reason, anonymized_email: anonymizedEmail },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    status: 'ok',
    message: 'User data has been anonymized and marked for deletion',
  });
}
