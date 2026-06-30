import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    const checks = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('programs').select('id', { count: 'exact', head: true }),
      db.from('program_enrollments').select('id', { count: 'exact', head: true }),
    ]);

    const [profiles, programs, enrollments] = checks;
    return NextResponse.json({
      ok: true,
      projectConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      counts: {
        profiles: profiles.count ?? 0,
        programs: programs.count ?? 0,
        program_enrollments: enrollments.count ?? 0,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeInternalError(error, 'Supabase debug check failed');
  }
}
