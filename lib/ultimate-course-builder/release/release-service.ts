import 'server-only';
import { assertCompleteLesson, ULTIMATE_LESSON_CONTRACT_VERSION } from '../core/lesson-contract';
import type { SupabaseClient } from '@supabase/supabase-js';
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
    if (b.status !== 'built') throw new Error('ULTIMATE_BUILD_NOT_RELEASE_READY');
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
    for (const lesson of ls) assertCompleteLesson(lesson.artifacts as any, b.profile);
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
          canonicalLessonId: /^[0-9a-f-]{36}$/i.test(l.competency_id) ? l.competency_id : null,
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
          videoUrl: r.videoUrl ?? r.outputPath ?? null,
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
  async applyPackage(p: any, actorId: string) {
    if (p.contractVersion !== ULTIMATE_LESSON_CONTRACT_VERSION || !p.lessons?.length)
      throw new Error('ULTIMATE_RELEASE_CONTRACT_REQUIRED');
    for (const lesson of p.lessons) assertCompleteLesson(lesson.contractArtifacts, p.profile);
    const now = new Date().toISOString();
    const { data: existingModule, error: me } = await this.db
      .from('course_modules')
      .select('id')
      .eq('course_id', p.courseId)
      .eq('slug', 'ultimate-core')
      .maybeSingle();
    if (me) throw me;
    let m = existingModule;
    if (!m) {
      const q = await this.db
        .from('course_modules')
        .insert({
          course_id: p.courseId,
          title: p.title,
          slug: 'ultimate-core',
          order_index: 1,
          is_required: true,
          is_published: true,
          is_draft: false,
          created_by: actorId,
        })
        .select('id')
        .single();
      if (q.error) throw q.error;
      m = q.data;
    }
    for (const l of p.lessons) {
      const row: any = {
        course_id: p.courseId,
        module_id: m.id,
        slug: l.slug,
        title: l.title,
        order_index: l.orderIndex,
        lesson_type: 'lesson',
        is_required: true,
        status: 'published',
        is_published: true,
        generation_status: 'completed',
        ai_generated: true,
        approved: true,
        learning_objectives: l.objectives,
        video_url: l.videoUrl,
        script_text: typeof l.script === 'string' ? l.script : JSON.stringify(l.script ?? {}),
        scene_data: l.storyboard,
        practical_required: l.practicalRequired,
        content_json: {
          ultimate: true,
          buildId: p.buildId,
          sourceLessonBuildId: l.sourceLessonBuildId,
          competencyId: l.competencyId,
          learning: l.content,
          experience: {
            knowledgeChecks: l.assessment.questions.map((q: any) => ({
              ...q,
              question: q.prompt,
              options: q.choices,
              correct: q.answerIndex,
            })),
            remediation: {
              passingScore: l.assessment.passingScore,
              activities: l.content.activities,
              objectiveMap: l.assessment.questions.map((q: any) => q.objectiveIds[0]),
              reviewMessage: l.content.activities.find((a: any) => a.type === 'remediation')
                ?.prompt,
              targetedActions: l.content.activities
                .filter((a: any) => a.type === 'remediation')
                .map((a: any) => ({ action: a.prompt, reason: a.feedback })),
            },
            reassessment: l.assessment.reassessment.map((q: any) => ({
              ...q,
              question: q.prompt,
              options: q.choices,
              correct: q.answerIndex,
            })),
            narrationScript: l.script,
            readingGuide: {
              summary: l.segments[0]?.text,
              sections: l.segments.map((s: any) => ({
                heading: s.stage.replace(/_/g, ' '),
                body: s.text,
              })),
              keyTakeaways: l.objectives,
            },
            exercises: l.content.activities
              .filter((a: any) => ['guided_practice', 'independent_practice'].includes(a.type))
              .map((a: any) => ({
                id: a.id,
                title: a.type.replace(/_/g, ' '),
                instructions: [a.prompt],
                expectedArtifact: a.feedback,
              })),
            practicalTask: l.practicalRequired
              ? {
                  title: l.title,
                  instructions: l.content.activities
                    .filter((a: any) => a.type === 'independent_practice')
                    .map((a: any) => a.prompt),
                  competencyKeys: [l.competencyId],
                  rubric: l.assessment.practicalRubric,
                }
              : undefined,
            interactiveVideo: {
              transcript: l.timeline.segments.map((s: any) => ({
                start: s.startSeconds,
                end: s.endSeconds,
                text: s.text,
              })),
            },
            instructionalTimeline: {
              scenes: l.timeline.segments.map((s: any) => ({
                id: s.segmentId,
                startTime: s.startSeconds,
                endTime: s.endSeconds,
                narration: s.text,
              })),
              events: [],
            },
          },
          contractVersion: p.contractVersion,
          film: {
            videoUrl: l.videoUrl,
            captionsUrl: l.captionsUrl,
            transcriptUrl: l.transcriptUrl,
          },
          assessment: l.assessment,
          remediation: l.remediation,
          traceability: l.traceability,
        },
        published_at: now,
        published_by: actorId,
        updated_at: now,
      };
      const { data: e, error: ee } = await this.db
        .from('course_lessons')
        .select('id,module_id,slug')
        .eq('course_id', p.courseId)
        .eq(l.canonicalLessonId ? 'id' : 'slug', l.canonicalLessonId ?? l.slug)
        .maybeSingle();
      if (ee) throw ee;
      const q = e
        ? await this.db
            .from('course_lessons')
            .update({ ...row, module_id: e.module_id, slug: e.slug })
            .eq('id', e.id)
        : await this.db.from('course_lessons').insert(row);
      if (q.error) throw q.error;
      const { data: readback, error: readError } = await this.db
        .from('course_lessons')
        .select('video_url,content_json,status')
        .eq('course_id', p.courseId)
        .eq(l.canonicalLessonId ? 'id' : 'slug', l.canonicalLessonId ?? l.slug)
        .single();
      if (
        readError ||
        readback?.video_url !== l.videoUrl ||
        readback?.content_json?.contractVersion !== p.contractVersion ||
        readback?.status !== 'published'
      )
        throw new Error('ULTIMATE_CANONICAL_PUBLICATION_READBACK_FAILED');
    }
    return now;
  }
  async publish(buildId: string, actorId: string) {
    const p: any = await this.derive(buildId),
      now = await this.applyPackage(p, actorId),
      version = await this.nextVersion(p.courseId);
    await this.db
      .from('ultimate_release_versions')
      .update({ status: 'superseded' })
      .eq('course_id', p.courseId)
      .eq('status', 'released');
    const q = await this.db
      .from('ultimate_release_versions')
      .insert({
        build_id: buildId,
        course_id: p.courseId,
        version,
        package: p,
        status: 'released',
        released_by: actorId,
      })
      .select('*')
      .single();
    if (q.error) throw q.error;
    const u = await this.db
      .from('courses')
      .update({
        status: 'published',
        is_active: true,
        review_status: 'approved',
        published_at: now,
        published_by: actorId,
        version,
        total_lessons: p.lessons.length,
        updated_at: now,
      })
      .eq('id', p.courseId);
    if (u.error) throw u.error;
    return q.data;
  }
  async rollback(courseId: string, version: number, actorId: string) {
    const q = await this.db
      .from('ultimate_release_versions')
      .select('*')
      .eq('course_id', courseId)
      .eq('version', version)
      .single();
    if (q.error || !q.data) throw q.error ?? new Error('ULTIMATE_RELEASE_NOT_FOUND');
    const p = { ...(q.data.package as any), buildId: q.data.build_id, courseId };
    const now = await this.applyPackage(p, actorId),
      next = await this.nextVersion(courseId);
    await this.db
      .from('ultimate_release_versions')
      .update({ status: 'superseded' })
      .eq('course_id', courseId)
      .eq('status', 'released');
    const n = await this.db
      .from('ultimate_release_versions')
      .insert({
        build_id: q.data.build_id,
        course_id: courseId,
        version: next,
        package: p,
        status: 'released',
        released_by: actorId,
        rolled_back_from: q.data.id,
      })
      .select('*')
      .single();
    if (n.error) throw n.error;
    const u = await this.db
      .from('courses')
      .update({ version: next, updated_at: now })
      .eq('id', courseId);
    if (u.error) throw u.error;
    return n.data;
  }
  private async nextVersion(courseId: string) {
    const { data } = await this.db
      .from('ultimate_release_versions')
      .select('version')
      .eq('course_id', courseId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.version ?? 0) + 1;
  }
}
