import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/** Check exact session ownership before any privileged storage or telemetry operation. */
export async function requireExamSessionAccess(sessionId: string) {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await requireAdminClient();
  const [profileResult, sessionResult] = await Promise.all([
    db
      .from('profiles')
      .select('role,tenant_id,is_active,suspended')
      .eq('id', user.id)
      .maybeSingle(),
    db
      .from('exam_sessions')
      .select('id,student_id,proctor_id,tenant_id,status,evidence_storage_key')
      .eq('id', sessionId)
      .maybeSingle(),
  ]);
  if (profileResult.error || sessionResult.error)
    return NextResponse.json({ error: 'Session lookup unavailable' }, { status: 503 });
  const profile = profileResult.data;
  const session = sessionResult.data;
  if (!profile || profile.is_active === false || profile.suspended || !session) {
    return NextResponse.json({ error: 'Session unavailable' }, { status: 404 });
  }
  const platformAdmin = ['admin', 'super_admin'].includes(profile.role);
  const sameTenant = !!profile.tenant_id && profile.tenant_id === session.tenant_id;
  const assignedProctor =
    session.proctor_id === user.id &&
    ['proctor', 'test_admin', 'staff', 'instructor'].includes(profile.role);
  if (
    !platformAdmin &&
    session.student_id !== user.id &&
    !assignedProctor &&
    !(sameTenant && ['test_admin', 'staff'].includes(profile.role))
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { db, user, profile, session };
}
