import 'server-only';
import { prepareUltimatePublication } from './prepare-publication';
import { assertCompleteLesson, ULTIMATE_LESSON_CONTRACT_VERSION } from '../core/lesson-contract';
import type { SupabaseClient } from '@supabase/supabase-js';
import { renderMediaUrl, renderPlaybackUrl } from '../media/playback-source.mjs';
const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'lesson';
export class UltimateReleaseService {
  constructor(private db: SupabaseClient) {}
  async derive(buildId: string, lessonBuildId?: string) {
    const { data: b, error } = await this.db
      .from('ultimate_course_builds')
      .select('id,course_id,profile,status')
      .eq('id', buildId)
      .single();
    if (error || !b) throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    if ((!lessonBuildId && !['built','published'].includes(b.status)) || (lessonBuildId && ['archived','cancelled'].includes(b.status)))
      throw new Error('ULTIMATE_BUILD_NOT_RELEASE_READY');
    const profile = b.profile as any;
    const preservedIds: string[] = !lessonBuildId && profile.publishCompletedLessons === true
      ? [...new Set<string>(profile.preservedPublishedLessonIds ?? [])] : [];
    let preservedRows: any[] = [];
    if (preservedIds.length) {
      if (preservedIds.some(id => !Object.values(profile.canonicalLessonIds ?? {}).includes(id)))
        throw new Error('ULTIMATE_PRESERVED_PUBLICATION_MAPPING_REQUIRED');
      const prior = await this.db.from('course_lessons')
        .select('id,title,slug,order_index,status,is_published,video_status,video_url')
        .eq('course_id',b.course_id).in('id',preservedIds);
      if (prior.error) throw prior.error;
      preservedRows = prior.data ?? [];
      if (preservedRows.length !== preservedIds.length || preservedRows.some(row =>
          row.status !== 'published' || row.is_published !== true || row.video_status !== 'complete' || !row.video_url))
        throw new Error('ULTIMATE_PRESERVED_PUBLICATION_CHANGED');
    }
    let lessonQuery = this.db
      .from('ultimate_lesson_builds')
      .select('id,lesson_key,competency_id,status')
      .eq('build_id', buildId)
      .order('created_at');
    if (lessonBuildId) lessonQuery = lessonQuery.eq('id', lessonBuildId);
    const { data: savedLessons, error: le } = await lessonQuery;
    if (le) throw le;
    let ls: any[] = savedLessons ?? [];
    if (preservedRows.length) ls = (profile.competencies ?? []).map((competency: any) => {
      const prior = preservedRows.find(row => row.id === profile.canonicalLessonIds?.[competency.id]);
      return prior ? {competency_id:competency.id,preservedPublication:prior}
        : ls.find(row => row.competency_id === competency.id);
    }).filter(Boolean);
    // Preserved publications need no artifact payload. Load each remaining
    // lesson separately rather than one course-sized JSON response.
    for (const lesson of ls) {
      if (lesson.preservedPublication) continue;
      const loaded = await this.db.from('ultimate_lesson_builds').select('artifacts')
        .eq('build_id',buildId).eq('id',lesson.id).single();
      if (loaded.error) throw loaded.error;
      if (!loaded.data) throw new Error('ULTIMATE_LESSONS_NOT_RELEASE_READY');
      lesson.artifacts = loaded.data.artifacts;
    }
    if (
      !ls?.length ||
      ls.some(
        (x: any) => !x.preservedPublication && (x.status !== 'built' || x.artifacts?.finished_media_qa?.mediaQA?.pass !== true),
      )
    )
      throw new Error('ULTIMATE_LESSONS_NOT_RELEASE_READY');
    if (
      (!lessonBuildId && ls.length !== ((b.profile as any)?.competencies ?? []).length) ||
      (lessonBuildId && ls.length !== 1) ||
      new Set(ls.map((l: any) => l.competency_id)).size !== ls.length
    )
      throw new Error('ULTIMATE_ALL_COMPETENCIES_REQUIRED');
    for (const lesson of ls) if (!lesson.preservedPublication)
      assertCompleteLesson(lesson.artifacts as any, b.profile, lesson.competency_id);
    // Current automated contract evidence authorizes publication. Historical
    // owner-review policies and optional review records cannot strand a build.

    const p: any = b.profile,
      cm = new Map((p.competencies ?? []).map((c: any) => [String(c.id), c]));
    return {
      schemaVersion: 2,
      contractVersion: ULTIMATE_LESSON_CONTRACT_VERSION,
      buildId,
      courseId: b.course_id,
      title: p.title,
      profile: p,
      lessons: ls.map((l: any, i: number) => {
        if (l.preservedPublication) {
          const prior = l.preservedPublication;
          return {canonicalLessonId:prior.id,competencyId:l.competency_id,
            title:prior.title,slug:prior.slug,orderIndex:prior.order_index,
            videoUrl:prior.video_url,preservedPublished:true};
        }
        const c: any = cm.get(String(l.competency_id)) ?? {},
          a = l.artifacts ?? {},
          r = a.lesson_film_render?.render ?? a.lesson_film_render ?? {};
        return {
          sourceLessonBuildId: l.id,
          canonicalLessonId: p.canonicalLessonIds?.[l.competency_id] ??
            (/^[0-9a-f-]{36}$/i.test(l.competency_id) ? l.competency_id : null),
          contractArtifacts: a,
          competencyId: l.competency_id,
          slug: slug(String(l.lesson_key)),
          title: c.title ?? c.description ?? l.lesson_key,
          orderIndex: Math.max(0, (p.competencies ?? []).findIndex((item: any) => item.id === l.competency_id)) + 1,
          objectives: (a.learning_objectives?.objectives ?? []).map((o: any) => o.text),
          content: a.active_teaching ?? {},
          assessment: a.assessment_alignment?.assessment ?? a.assessment_alignment ?? {},
          remediation: a.selective_repair ?? {},
          traceability: a.credential_release?.release?.rows ?? [],
          videoUrl: renderPlaybackUrl(r),
          script: a.instructor_script?.script?.script ?? null,
          segments: a.instructor_script?.script?.segments ?? [],
          timeline: a.synchronization?.timeline,
          captionsUrl: r.captionsUrl,
          transcriptUrl: r.transcriptUrl,
          storyboard: r.sceneData,
          practicalRequired: c.requiresPracticalEvidence === true,
        };
      }),
    };
  }
  /** Publish only accepted, unpublished lessons. Prior publications are retained. */
  async publishReadyLessons(buildId: string, actorId: string, fence: {jobId: string; workerId: string; generation: number} | null = null) {
    const build = await this.db.from('ultimate_course_builds').select('course_id,profile').eq('id',buildId).single();
    if (build.error || !build.data) throw build.error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    if ((build.data.profile as any)?.publishCompletedLessons !== true) throw new Error('ULTIMATE_PARTIAL_PUBLICATION_NOT_ENABLED');
    const ready = await this.db.from('ultimate_lesson_builds').select('id,competency_id').eq('build_id',buildId).eq('status','built');
    if (ready.error) throw ready.error;
    const canonical = await this.db.from('course_lessons').select('id,status,is_published').eq('course_id',build.data.course_id);
    if (canonical.error) throw canonical.error;
    const published = [];
    for (const lesson of ready.data ?? []) {
      const id = (build.data.profile as any)?.canonicalLessonIds?.[lesson.competency_id];
      const saved = canonical.data?.find(row => row.id === id);
      if (!saved) throw new Error('ULTIMATE_CANONICAL_DRAFT_REQUIRED');
      if (saved.is_published === true || saved.status === 'published') continue;
      const packageForLesson = await this.derive(buildId,lesson.id);
      await this.applyPackage(packageForLesson,actorId,fence);
      published.push(id);
    }
    return published;
  }
  /** One accepted lesson, one fenced database transaction; no course history is invented. */
  async applyPackage(p: any, actorId: string,
    fence: {jobId: string; workerId: string; generation: number} | null = null) {
    if (p.profile?.publishCompletedLessons !== true) throw new Error('ULTIMATE_PARTIAL_PUBLICATION_NOT_ENABLED');
    if (p.lessons?.length !== 1 || p.lessons[0].preservedPublished)
      throw new Error('ULTIMATE_RELEASE_SCOPE_INVALID');
    const rows = prepareUltimatePublication(p, actorId);
    const { data, error } = await this.db.rpc('commit_ultimate_lesson_release', {
      p_package: p, p_rows: rows, p_actor: actorId, p_fence: fence,
    });
    if (error) throw error;
    if (data?.scope !== 'lesson' || !Array.isArray(data.lessonIds) || data.lessonIds.length !== 1 ||
        typeof data.lessonIds[0] !== 'string' || typeof data.committedAt !== 'string' ||
        (p.lessons[0].canonicalLessonId && data.lessonIds[0] !== p.lessons[0].canonicalLessonId))
      throw new Error('ULTIMATE_LESSON_RELEASE_NOT_PERSISTED');
    return data.committedAt;
  }
  private async commitPackage(p: any, actorId: string, rolledBackFrom: string | null = null,
    fence: {jobId: string; workerId: string; generation: number} | null = null) {
    const rows = prepareUltimatePublication(p, actorId);
    const {data, error} = await this.db.rpc('commit_ultimate_release', {
      p_package: p, p_rows: rows, p_actor: actorId,
      p_rolled_back_from: rolledBackFrom, p_fence: fence,
    });
    if (error) throw error;
    if (!Array.isArray(data) || data.length !== 1) throw new Error('ULTIMATE_RELEASE_NOT_PERSISTED');
    return data[0];
  }

  async publish(buildId: string, actorId: string,
    fence: {jobId: string; workerId: string; generation: number} | null = null) {
    const p = await this.derive(buildId);
    return this.commitPackage(p, actorId, null, fence);
  }

  async rollback(courseId: string, version: number, actorId: string) {
    const {data, error} = await this.db.from('ultimate_release_versions').select('*')
      .eq('course_id', courseId).eq('version', version).single();
    if (error || !data) throw error ?? new Error('ULTIMATE_RELEASE_NOT_FOUND');
    const p = {...(data.package as any), buildId: data.build_id, courseId};
    return this.commitPackage(p, actorId, data.id);
  }
}
