import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  const packageId = request.nextUrl.searchParams.get('packageId') ?? request.nextUrl.searchParams.get('package_id');
  if (!packageId) return safeError('packageId is required', 400);
  try {
    const db = await requireAdminClient();
    if (!db) return safeError('Service unavailable', 503);
    const { data, error } = await db.from('scorm_packages').select('id, title, launch_path, version, status').eq('id', packageId).maybeSingle();
    if (error) return safeDbError(error, 'SCORM package lookup failed');
    if (!data) return safeError('SCORM package not found', 404);
    return NextResponse.json({ package: data, launchUrl: `/api/scorm/content/${packageId}/${data.launch_path ?? 'index.html'}` });
  } catch (error) {
    return safeInternalError(error, 'SCORM player lookup failed');
  }
}
