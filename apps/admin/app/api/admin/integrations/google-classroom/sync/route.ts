import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { ClassroomSyncError, synchronizeGoogleClassroom } from '@/lib/integrations/google-classroom-sync';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  try {
    return NextResponse.json(await synchronizeGoogleClassroom(db, auth.id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof ClassroomSyncError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Google Classroom synchronization failed' }, { status: 502 });
  }
}
