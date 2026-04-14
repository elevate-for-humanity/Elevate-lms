import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const { userId } = await params;
  const supabase = await createClient();

  // Auth: session user must match URL param (or be admin)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isAdmin = ['admin', 'super_admin', 'staff', 'org_admin'].includes(profile?.role ?? '');
  if (!isAdmin && user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch user progress across courses and programs
  const [enrollmentsResult, progressResult, certificatesResult] = await Promise.all([
    supabase
      .from('program_enrollments')
      .select('id, status, program_id, created_at')
      .eq('user_id', userId),
    supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('certificates')
      .select('id, program_id, issued_at')
      .eq('user_id', userId),
  ]);

  const enrollments = enrollmentsResult.data || [];
  const progress = progressResult.data || [];
  const certificates = certificatesResult.data || [];

  return NextResponse.json({
    enrollments,
    progress,
    certificates,
    summary: {
      total_enrollments: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      certificates_earned: certificates.length,
    },
  });
}
export const GET = withApiAudit('/api/users/[userId]/progress', _GET);
