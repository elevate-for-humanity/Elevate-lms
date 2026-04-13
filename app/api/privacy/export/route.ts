// app/api/privacy/export/route.ts
// GDPR/CCPA: Data export endpoint
//
// IDOR fix: previously accepted an email in the request body and exported that
// user's data. An authenticated user could export any other user's data by
// supplying a different email. Now the export is always scoped to the
// authenticated session user — the request body email is ignored.
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

  // Export is always for the authenticated user — never caller-supplied email
  const sessionUserId = authSession.user.id;

  const supabase = await getAdminClient();

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at, updated_at, tenant_id')
    .eq('id', sessionUserId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [enrollments, completions, activity, grades] = await Promise.all([
    supabase.from('course_enrollments').select('*').eq('user_id', sessionUserId),
    supabase.from('course_completions').select('*').eq('user_id', sessionUserId),
    supabase.from('user_activity_events').select('*').eq('user_id', sessionUserId),
    supabase.from('grades').select('*').eq('user_id', sessionUserId),
  ]);

  const exportPayload = {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    enrollments: enrollments.data || [],
    completions: completions.data || [],
    activity: activity.data || [],
    grades: grades.data || [],
    export_date: new Date().toISOString(),
  };

  const { ipAddress, userAgent } = getRequestMetadata(req);
  await logAuditEvent({
    tenantId: user.tenant_id,
    userId: user.id,
    action: AuditActions.DATA_EXPORTED,
    resourceType: 'user',
    resourceId: user.id,
    metadata: { export_type: 'full_data_export' },
    ipAddress,
    userAgent,
  });

  return NextResponse.json(exportPayload, {
    headers: {
      'Content-Disposition': `attachment; filename="efh-data-export-${sessionUserId}.json"`,
      'Content-Type': 'application/json',
    },
  });
}
