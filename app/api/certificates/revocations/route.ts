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
  if (!['admin', 'partner'].includes(prof?.role)) return new Response('Forbidden', { status: 403 });

  const { data, error }: any = await supabase.from('cert_revocation_log').select('*');
  if (error) return safeInternalError(error as Error, 'Internal server error');
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
        .join(','),
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
export const GET = withApiAudit('/api/cert/revocations', _GET);
