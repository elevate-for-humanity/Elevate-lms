import 'server-only';
import {prepareUltimatePublication} from './prepare-publication';
import { assertCompleteLesson, ULTIMATE_LESSON_CONTRACT_VERSION } from '../core/lesson-contract';
import type { SupabaseClient } from '@supabase/supabase-js';
import { renderPlaybackUrl } from '../media/playback-source.mjs';
const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'lesson';
export class UltimateReleaseService {
  constructor(private db: SupabaseClient) {}
  async derive(buildId: string) {
    const { data: b, error } = await this.db
      .from('ultimate_course_builds')
      .select('id,course_id,profile,status')
      .eq('id', buildId)
      .single();
    if (error || !b) throw error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
    if (!['built','published'].includes(b.status)) throw new Error('ULTIMATE_BUILD_NOT_RELEASE_READY');
    const { data: ls, error: le } = await this.db
      .from('ultimate_lesson_builds')
      .select('id,lesson_key,competency_id,status,artifacts')
      .eq('build_id', buildId)
      .order('created_at');
    if (le) throw le;
    if (
      !ls?.length ||
      ls.some(
        (x: any) => x.status !== 'built' || x.artifacts?.finished_media_qa?.mediaQA?.pass !== true,
      )
    )
      throw new Error('ULTIMATE_LESSONS_NOT_RELEASE_READY');
    if (
      ls.length !== ((b.profile as any)?.competencies ?? []).length ||
      new Set(ls.map((l: any) => l.competency_id)).size !== ls.length
    )
      throw new Error('ULTIMATE_ALL_COMPETENCIES_REQUIRED');
    for (const lesson of ls) assertCompleteLesson(lesson.artifacts as any, b.profile, lesson.competency_id);
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
          orderIndex: i + 1,
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
