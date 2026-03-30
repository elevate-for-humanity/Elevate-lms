import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/lms/evidence/[evidenceId]/review
// Instructor approves or rejects a lab/assignment submission.
// Requires role: instructor, admin, super_admin, or staff.
// Body: { status: 'approved' | 'rejected', feedback?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ evidenceId: string }> }
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['instructor', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const { evidenceId } = await params;

  let body: { status?: string; feedback?: string };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { status, feedback } = body;
  if (!status || !['approved', 'rejected'].includes(status)) {
    return safeError('status must be "approved" or "rejected"', 400);
  }

  const { error } = await supabase
    .from('step_submissions')
    .update({
      instructor_status: status,
      instructor_feedback: feedback ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', evidenceId);

  if (error) return safeDbError(error, 'Failed to save review');

  return NextResponse.json({ ok: true });
}
