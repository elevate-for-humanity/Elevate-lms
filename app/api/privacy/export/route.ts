
// app/api/privacy/export/route.ts
// GDPR/CCPA: Data export endpoint
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent, AuditActions, getRequestMetadata } from '@/lib/audit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
    // Auth: require authenticated user
    const { createClient: createAuthClient } = await import('@/lib/supabase/server');
    const authSupabase = await createAuthClient();
    const { data: { session: authSession } } = await authSupabase.auth.getSession();
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


  const supabase = await getAdminClient();
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = user.id;

  // Pull key data from multiple tables
  const [enrollments, completions, activity, grades] = await Promise.all([
    supabase.from('course_enrollments').select('*').eq('user_id', userId),
    supabase.from('course_completions').select('*').eq('user_id', userId),
    supabase.from('user_activity_events').select('*').eq('user_id', userId),
    supabase.from('grades').select('*').eq('user_id', userId)
  ]);

  const exportPayload = {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    enrollments: enrollments.data || [],
    completions: completions.data || [],
    activity: activity.data || [],
    grades: grades.data || [],
    export_date: new Date().toISOString()
  };

  // Log the export request
  const { ipAddress, userAgent } = getRequestMetadata(req);
  await logAuditEvent({
    tenantId: user.tenant_id,
    userId: user.id,
    action: AuditActions.DATA_EXPORTED,
    resourceType: 'user',
    resourceId: user.id,
    metadata: { email, export_type: 'full_data_export' },
    ipAddress,
    userAgent
  });

  return NextResponse.json(exportPayload, {
    headers: {
      'Content-Disposition': `attachment; filename="efh-data-export-${userId}.json"`,
      'Content-Type': 'application/json'
    }
  });
}
