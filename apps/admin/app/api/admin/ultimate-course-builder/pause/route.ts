import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const input = await req.json().catch(() => null);
  if (!/^[a-f0-9-]{36}$/i.test(input?.buildId ?? ''))
    return NextResponse.json({ error: 'Select a saved build.' }, { status: 400 });
  try {
    const db = await requireAdminClient();
    const { data: build, error } = await db
      .from('ultimate_course_builds')
      .select('id,status,profile')
      .eq('id', input.buildId)
      .single();
    if (error) throw error;
    if (['published', 'archived', 'built'].includes(build.status))
      return NextResponse.json({ error: 'This revision has finished.' }, { status: 409 });
    const profile = build.profile as Record<string, unknown>;
    const now = new Date().toISOString();
    const saved = await db
      .from('ultimate_course_builds')
      .update({
        profile: {
          ...profile,
          ownerPaused: true,
          pauseResumeAudit: { action: 'explicit-admin-pause', pausedBy: auth.id, pausedAt: now },
        },
        updated_at: now,
      })
      .eq('id', build.id)
      .eq('profile', JSON.stringify(profile))
      .eq('status', build.status)
      .select('id');
    if (saved.error) throw saved.error;
    if (saved.data?.length !== 1)
      return NextResponse.json(
        { error: 'The build advanced. Refresh and try Pause again.' },
        { status: 409 },
      );
    return NextResponse.json({
      ok: true,
      message:
        'Pause saved. Active work finishes its current checkpoint; the worker stops before the next one. Resume preserves saved progress.',
    });
  } catch (error) {
    return safeInternalError(
      error,
      'Course pause failed',
      'The pause could not be saved. Refresh the build before retrying.',
    );
  }
}
