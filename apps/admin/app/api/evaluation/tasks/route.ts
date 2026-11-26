/**
 * GET /api/evaluation/tasks
 *
 * Task definitions for the AI Evaluation Studio (/evaluation page).
 * Backed by the evaluation_tasks table; the page renders an empty state
 * when no task definitions have been created yet.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const { data, error } = await db
    .from('evaluation_tasks')
    .select('id, status, version, created_at, updatedat')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return safeInternalError(error, 'Failed to load evaluation tasks');

  return NextResponse.json({
    data: (data ?? []).map((t) => ({
      id: t.id,
      name: '',
      slug: '',
      domain: '',
      category: '',
      objective: '',
      status: t.status ?? 'draft',
      createdAt: t.created_at,
    })),
  });
}
