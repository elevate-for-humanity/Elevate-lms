import type { SupabaseClient } from '@supabase/supabase-js';
import { renderMediaUrl, renderPlaybackUrl } from '../media/playback-source.mjs';

/** Identity is the immutable artifact version, never a renewable preview URL. */
export async function renderReview(
  db: SupabaseClient,
  buildId: string,
  lessonId: string,
  videoUrl: string,
) {
  const artifact = await db
    .from('ultimate_artifacts')
    .select('id')
    .eq('build_id', buildId)
    .eq('lesson_build_id', lessonId)
    .eq('stage', 'lesson_film_render')
    .eq('artifact_type', 'stage_output')
    .maybeSingle();
  if (artifact.error) throw artifact.error;
  if (!artifact.data) return null;
  const versions = await db
    .from('ultimate_artifact_versions')
    .select('id,version,content')
    .eq('artifact_id', artifact.data.id)
    .order('version', { ascending: false })
    .limit(20);
  if (versions.error) throw versions.error;
  const version = versions.data?.find(
    (v) => (renderMediaUrl(v.content?.render) ?? renderPlaybackUrl(v.content?.render)) === videoUrl,
  );
  if (!version) return null;
  const decisions = await db
    .from('ultimate_review_decisions')
    .select('action,reviewer_id,created_at')
    .eq('artifact_version_id', version.id)
    .in('action', ['approve', 'reject', 'request_change'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (decisions.error) throw decisions.error;
  return {
    artifactVersionId: version.id,
    version: version.version,
    decision: decisions.data?.action ?? 'unreviewed',
  };
}
