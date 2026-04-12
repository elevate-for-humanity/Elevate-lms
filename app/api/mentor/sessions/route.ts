import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api').catch(() => null);
    if (rateLimited) return rateLimited;

    const auth = await apiAuthGuard(request);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => null);
    if (!body?.mentee_email || !body?.scheduled_at) {
      return safeError('mentee_email and scheduled_at are required', 400);
    }

    const db = await getAdminClient();
    if (!db) return safeError('Service unavailable', 503);

    const { data, error } = await db
      .from('mentor_sessions')
      .insert({
        mentee: body.mentee_email,
        scheduled_at: body.scheduled_at,
        session_type: body.session_type || 'general',
        status: 'scheduled',
        ...(body.topic ? { program: body.topic } : {}),
      })
      .select('id')
      .single();

    if (error) return safeDbError(error, 'Failed to schedule session');
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return safeError('Internal server error', 500);
  }
}
