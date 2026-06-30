import { safeInternalError } from '@/lib/api/safe-error';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (prof?.role !== 'admin') return new Response('Forbidden', { status: 403 });

  // Get delegates with program holder and user info
  const { data: delegates, error } = await supabase
    .from('delegates')
    .select(
      `
      id,
      can_view_reports,
      can_view_learners,
      can_edit_courses,
      can_view_financials,
      program_holder:program_holder_id(name),
      user:user_id(email)
    `,
    )
    .order('created_at', { ascending: false });

  if (error) return safeInternalError(error as Error, 'Internal server error');

  const mapped = (delegates || []).map((r: Record<string, any>) => ({
    id: r.id,
    ph_name: r.program_holder?.name || 'Unknown',
    email: r.user?.email || 'Unknown',
    can_view_reports: r.can_view_reports,
    can_view_learners: r.can_view_learners,
    can_edit_courses: r.can_edit_courses,
    can_view_financials: r.can_view_financials,
  }));

  return Response.json(mapped);
}
export const GET = withApiAudit('/api/delegates/list', _GET);
