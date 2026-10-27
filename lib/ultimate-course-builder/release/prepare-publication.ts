import { assertCompleteLesson, ULTIMATE_LESSON_CONTRACT_VERSION } from '../core/lesson-contract';
import { renderMediaUrl, renderPlaybackUrl } from '../media/playback-source.mjs';

/** Prepare deterministic rows without changing live canonical records. */
export function prepareUltimatePublication(p: any, actorId: string) {
  if (p.contractVersion !== ULTIMATE_LESSON_CONTRACT_VERSION || !p.lessons?.length)
    throw new Error('ULTIMATE_RELEASE_CONTRACT_REQUIRED');
  const now = new Date().toISOString();
  return p.lessons.filter((l: any) => !l.preservedPublished).map((l: any) => {
    assertCompleteLesson(l.contractArtifacts, p.profile, l.competencyId);
    const film = l.contractArtifacts.lesson_film_render.render;
    if (renderPlaybackUrl(film) !== l.videoUrl) throw new Error('ULTIMATE_RELEASE_FILM_MISMATCH');
      const row: any = {
        course_id: p.courseId,
        module_id: null,
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
    const media = {
      course_id: p.courseId, lesson_id: l.canonicalLessonId, lesson_title: l.title,
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
    return {canonicalLessonId:l.canonicalLessonId,slug:l.slug,sourceLessonBuildId:l.sourceLessonBuildId,competencyId:l.competencyId,row,media};
  });
}
