import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createRouteHandlerClient } from '@/lib/auth';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const { data: prof } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!['admin', 'partner'].includes(prof?.role))
    return new Response('Forbidden', { status: 403 });

  const { data, error }: any = await supabase
    .from('cert_revocation_log')
    .select('*');
  if (error) return new Response(toErrorMessage(error), { status: 500 });
  const header =
    'serial,learner_email,course_title,issued_at,expires_at,revoked_at,revoked_reason\n';
  const csv = (data || [])
    .map((r) =>
      [
        r.serial,
        r.learner_email,
        r.course_title,
        r.issued_at,
        r.expires_at,
        r.revoked_at,
        r.revoked_reason,
      ]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');
  return new Response(header + csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="efh_revocation_log.csv"',
    },
  });
}
