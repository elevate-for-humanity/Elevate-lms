import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PENDING_APPLICATION_STATUSES } from '@/lib/admin/application-statuses';
import { safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const q = new URL(request.url).searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query q must be at least 2 characters' }, { status: 400 });
  }
  const db = await requireAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  try {
    const escaped = q.replace(/[%_,]/g, '');
    const { data, error } = await db
      .from('applications')
      .select('id, first_name, last_name, full_name, email, status, program_interest, program_slug, created_at, source')
      .or(`first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) throw error;
    return NextResponse.json({
      query: q,
      total: data?.length ?? 0,
      applications: data ?? [],
    });
  } catch (err) {
    return safeInternalError(err, 'Lookup failed');
  }
}
