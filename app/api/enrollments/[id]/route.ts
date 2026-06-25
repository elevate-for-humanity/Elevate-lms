import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_ROLES = new Set(['admin', 'admin', 'staff', 'org_admin']);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    let query = db.from('program_enrollments').select('*').eq('id', params.id);
    if (!ADMIN_ROLES.has(auth.role ?? '')) query = query.eq('user_id', auth.id);
    const { data, error } = await query.maybeSingle();
    if (error) return safeDbError(error, 'Enrollment lookup failed');
    if (!data) return safeError('Enrollment not found', 404);
    return NextResponse.json({ enrollment: data });
  } catch (error) {
    return safeInternalError(error, 'Enrollment lookup failed');
  }
}
