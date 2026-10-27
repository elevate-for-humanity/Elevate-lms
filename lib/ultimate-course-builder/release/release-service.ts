import 'server-only';
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
    if ((!lessonBuildId && b.status !== 'built') || (lessonBuildId && ['archived','cancelled'].includes(b.status)))
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
      .select('id,lesson_key,competency_id,status,artifacts')
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
  async publishReadyLessons(buildId: string, actorId: string) {
    const build = await this.db.from('ultimate_course_builds').select('course_id,profile').eq('id',buildId).single();
    if (build.error || !build.data) throw build.error ?? new Error('ULTIMATE_BUILD_NOT_FOUND');
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
      await this.applyPackage(packageForLesson,actorId);
      published.push(id);
    }
    return published;
  }
  async applyPackage(p: any, actorId: string) {
    if (p.contractVersion !== ULTIMATE_LESSON_CONTRACT_VERSION || !p.lessons?.length)
      throw new Error('ULTIMATE_RELEASE_CONTRACT_REQUIRED');
    for (const lesson of p.lessons) {
      if (lesson.preservedPublished) {
        if (p.profile.publishCompletedLessons !== true ||
            !p.profile.preservedPublishedLessonIds?.includes(lesson.canonicalLessonId))
          throw new Error('ULTIMATE_PRESERVED_PUBLICATION_MAPPING_REQUIRED');
      } else assertCompleteLesson(lesson.contractArtifacts,p.profile,lesson.competencyId);
    }
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
      const { data: canonical, error: canonicalError } = await this.db.from('course_lessons')
        .select('id,module_id').eq('course_id', p.courseId);
      if (canonicalError) throw canonicalError;
      const existingLesson = canonical?.find((lesson: any) => lesson.module_id &&
        p.lessons.some((release: any) => release.canonicalLessonId === lesson.id));
      if (existingLesson) m = { id: existingLesson.module_id };
    }
    if (!m) {
      const { data: modules, error: modulesError } = await this.db.from('course_modules')
        .select('order_index').eq('course_id', p.courseId);
      if (modulesError) throw modulesError;
      const q = await this.db
        .from('course_modules')
        .insert({
          course_id: p.courseId,
          title: p.title,
          slug: 'ultimate-core',
          order_index: Math.max(0, ...(modules ?? []).map((module: any) => module.order_index ?? 0)) + 1,
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
    const { error: modulePublishError } = await this.db.from('course_modules')
      .update({ is_published: true, is_draft: false }).eq('id', m!.id);
    if (modulePublishError) throw modulePublishError;
    for (const l of p.lessons) {
      if (l.preservedPublished) {
        const prior = await this.db.from('course_lessons')
          .select('status,is_published,video_status,video_url')
          .eq('id',l.canonicalLessonId).eq('course_id',p.courseId).single();
        if (prior.error) throw prior.error;
        if (prior.data?.status !== 'published' || prior.data.is_published !== true ||
            prior.data.video_status !== 'complete' || prior.data.video_url !== l.videoUrl)
          throw new Error('ULTIMATE_PRESERVED_PUBLICATION_CHANGED');
        continue;
      }
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
            ...(l.content.flashcards?.length ? {flashcards: l.content.flashcards} : {}),
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
            videoUrl: renderMediaUrl(l.contractArtifacts.lesson_film_render.render),
            playbackUrl: l.videoUrl,
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
        .select('id,module_id,slug,lesson_type,practical_required,order_index,content_json,quiz_questions')
        .eq('course_id', p.courseId)
        .eq(l.canonicalLessonId ? 'id' : 'slug', l.canonicalLessonId ?? l.slug)
        .maybeSingle();
      if (ee) throw ee;
      if (!e) throw new Error('ULTIMATE_CANONICAL_DRAFT_REQUIRED');
      row.lesson_type = e.lesson_type ?? row.lesson_type;
      row.practical_required = e.practical_required === true || l.practicalRequired === true;
      row.order_index = e.order_index ?? row.order_index;
      // Retain existing assessments and their stable IDs; new source-reviewed
      // checks may be added, but video regeneration never deletes old checks.
      const oldChecks=(e.content_json as any)?.experience?.knowledgeChecks??[];
      const newChecks=row.content_json.experience.knowledgeChecks;
      const existingIds=new Set(oldChecks.map((q:any)=>q.id).filter(Boolean));
      row.content_json={...(e.content_json as any),...row.content_json,experience:{...(e.content_json as any)?.experience,...row.content_json.experience,
        knowledgeChecks:[...oldChecks,...newChecks.filter((q:any)=>!existingIds.has(q.id))]}};
      const oldReassessment=(e.content_json as any)?.experience?.reassessment??[];
      const oldRetryIds=new Set(oldReassessment.map((q:any)=>q.id).filter(Boolean));
      row.content_json.experience.reassessment=[...oldReassessment,...row.content_json.experience.reassessment.filter((q:any)=>!oldRetryIds.has(q.id))];
      if (row.practical_required && !row.content_json.experience.practicalTask)
        row.content_json.experience.practicalTask = (e.content_json as any)?.experience?.practicalTask;
      row.content_json.mediaAttachment = {...(e.content_json as any)?.mediaAttachment,
        publicationPending:false,publishedAt:now,sourceLessonBuildId:l.sourceLessonBuildId};
      // Record the already rendered, fully verified Ultimate film for the
      // canonical publication guard. This never queues the retired renderer.
      const mediaJobId = await this.recordApprovedFilm(p, l, e.id, actorId, now);
      row.video_job_id = mediaJobId;
      row.video_status = 'complete';
      row.media_quality_status = 'approved';
      row.media_quality_evidence = l.contractArtifacts.finished_media_qa.mediaQA.inspection;
      if (e?.module_id && e.module_id !== m!.id) {
        const { error: publishError } = await this.db.from('course_modules')
          .update({ is_published: true, is_draft: false }).eq('id', e.module_id);
        if (publishError) throw publishError;
      }
      const q = e
        ? await this.db
            .from('course_lessons')
            .update({ ...row, module_id: e.module_id ?? m!.id, slug: e.slug })
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
      version = await this.nextVersion(p.courseId),
      now = await this.applyPackage(p, actorId);
    const superseded = await this.db
      .from('ultimate_release_versions')
      .update({ status: 'superseded' })
      .eq('course_id', p.courseId)
      .eq('status', 'released');
    if (superseded.error) throw superseded.error;
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
        generation_status: 'published',
        generation_progress: 100,
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
    const next = await this.nextVersion(courseId),
      now = await this.applyPackage(p, actorId);
    const superseded = await this.db
      .from('ultimate_release_versions')
      .update({ status: 'superseded' })
      .eq('course_id', courseId)
      .eq('status', 'released');
    if (superseded.error) throw superseded.error;
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
  private async recordApprovedFilm(p: any, l: any, lessonId: string, actorId: string, now: string) {
    // Approval derives from current evidence for all twenty steps, including
    // delivered-MP4 inspection and the learner runthrough.
    assertCompleteLesson(l.contractArtifacts, p.profile, l.competencyId);
    const film = l.contractArtifacts.lesson_film_render.render;
    if (renderPlaybackUrl(film) !== l.videoUrl) throw new Error('ULTIMATE_RELEASE_FILM_MISMATCH');
    const { data: existing, error: lookupError } = await this.db.from('video_jobs')
      .select('id,status,lease_expires_at')
      .eq('course_id', p.courseId).eq('lesson_id', lessonId)
      .eq('asset_kind', 'lesson').is('asset_key', null).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.status === 'rendering' ||
        (existing?.lease_expires_at && new Date(existing.lease_expires_at).getTime() > Date.now()))
      throw new Error('ULTIMATE_PRIMARY_MEDIA_JOB_ACTIVE');
    const media = {
      course_id: p.courseId, lesson_id: lessonId, lesson_title: l.title,
      asset_kind: 'lesson', asset_key: null, status: 'complete',
      provider: film.provider ?? 'remotion', video_url: renderPlaybackUrl(film),
      script: l.script, scene_data: l.storyboard,
      duration_seconds: Math.ceil(film.duration),
      scene_count: l.storyboard?.scenes?.length ?? l.segments.length,
      completed_at: now, review_status: 'approved', reviewed_by: actorId,
      reviewed_at: now,
      review_notes: 'Current required Ultimate lesson contract passed; release authorized by the configured course owner.',
      quality_evidence: {
        ...l.contractArtifacts.finished_media_qa.mediaQA.inspection,
        ultimateBuildId: p.buildId,
        sourceLessonBuildId: l.sourceLessonBuildId,
        contractVersion: p.contractVersion,
      },
    };
    const query = existing
      ? this.db.from('video_jobs').update(media).eq('id', existing.id)
          .eq('status', existing.status).is('lease_token', null)
      : this.db.from('video_jobs').insert(media);
    const { data: recorded, error: writeError } = await query.select('id').maybeSingle();
    if (writeError) throw writeError;
    if (!recorded) throw new Error('ULTIMATE_PRIMARY_MEDIA_JOB_CHANGED');
    return recorded.id;
  }
  private async nextVersion(courseId: string) {
    const { data, error } = await this.db
      .from('ultimate_release_versions')
      .select('version')
      .eq('course_id', courseId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data?.version ?? 0) + 1;
  }
}
