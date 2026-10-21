import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import {
  renderMediaUrl,
  renderPlaybackUrl,
} from '@/lib/ultimate-course-builder/media/playback-source.mjs';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'strict');
  if (limited) return limited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const input = await req.json().catch(() => null);
  const uuid = (v: unknown) => typeof v === 'string' && /^[a-f0-9-]{36}$/i.test(v);
  if (
    !uuid(input?.buildId) ||
    !uuid(input?.lessonBuildId) ||
    !uuid(input?.artifactVersionId) ||
    !['approve', 'reject', 'request_change'].includes(input?.action)
  )
    return NextResponse.json(
      { error: 'Select an exact saved video version and review action.' },
      { status: 400 },
    );
  try {
    const db = await requireAdminClient();
    const artifact = await db
      .from('ultimate_artifacts')
      .select('id')
      .eq('build_id', input.buildId)
      .eq('lesson_build_id', input.lessonBuildId)
      .eq('stage', 'lesson_film_render')
      .eq('artifact_type', 'stage_output')
      .single();
    if (artifact.error || !artifact.data)
      return NextResponse.json({ error: 'Saved lesson video not found.' }, { status: 404 });
    const version = await db
      .from('ultimate_artifact_versions')
      .select('id,version,content')
      .eq('id', input.artifactVersionId)
      .eq('artifact_id', artifact.data.id)
      .single();
    if (
      version.error ||
      !version.data ||
      !(
        renderMediaUrl(version.data.content?.render) ??
        renderPlaybackUrl(version.data.content?.render)
      )
    )
      return NextResponse.json(
        { error: 'This version has no saved video to review.' },
        { status: 409 },
      );
    const saved = await db
      .from('ultimate_review_decisions')
      .insert({
        artifact_version_id: version.data.id,
        action: input.action,
        reviewer_id: auth.id,
        comment: typeof input.comment === 'string' ? input.comment.slice(0, 4000) : null,
      });
    if (saved.error) throw saved.error;
    return NextResponse.json({
      ok: true,
      message: `Review recorded for video version ${version.data.version}. Automated quality checks remain separate.`,
    });
  } catch (error) {
    return safeInternalError(error, 'Lesson review failed', 'The video review could not be saved.');
  }
}
