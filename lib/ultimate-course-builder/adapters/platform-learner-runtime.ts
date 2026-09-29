import type { SupabaseClient } from '@supabase/supabase-js';

import type { UltimateLearnerRuntimeEvidence, UltimateLearnerRuntimePort } from '../core/ports';
import { LMS_RUNTIME_ACCESSIBILITY_EVIDENCE } from '../accessibility/lms-runtime-accessibility';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlayableUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export class UltimatePlatformLearnerRuntime implements UltimateLearnerRuntimePort {
  constructor(private db: SupabaseClient) {}

  async verify(input: {
    courseId: string;
    lessonId: string;
    videoUrl: string;
  }): Promise<UltimateLearnerRuntimeEvidence> {
    const persistedLessonId = UUID_PATTERN.test(input.lessonId) ? input.lessonId : null;
    const lessonQuery = persistedLessonId
      ? this.db
          .from('course_lessons')
          .select('id')
          .eq('id', persistedLessonId)
          .eq('course_id', input.courseId)
          .maybeSingle()
      : this.db
          .from('ultimate_lesson_builds')
          .select('id,ultimate_course_builds!inner(course_id)')
          .eq('competency_id', input.lessonId)
          .eq('ultimate_course_builds.course_id', input.courseId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
    const progressQuery = (table: 'learner_video_progress' | 'lesson_progress') => {
      let query = this.db
        .from(table)
        .select('progress_percent,last_position_seconds,completed,completed_at');
      if (persistedLessonId) query = query.eq('lesson_id', persistedLessonId);
      return query.limit(1);
    };
    const [lessonResult, videoProgressResult, lessonCompletionResult] = await Promise.all([
      lessonQuery,
      progressQuery('learner_video_progress'),
      progressQuery('lesson_progress'),
    ]);

    const courseLesson = !lessonResult.error && Boolean(lessonResult.data?.id);
    const stagedLesson = !persistedLessonId && courseLesson;
    const playableFilm = isPlayableUrl(input.videoUrl);
    const videoProgressStore = !videoProgressResult.error;
    const lessonCompletionStore = !lessonCompletionResult.error;

    return {
      progress_save: courseLesson && playableFilm && videoProgressStore,
      resume: courseLesson && playableFilm && videoProgressStore,
      completion: courseLesson && playableFilm && videoProgressStore && lessonCompletionStore,
      evidence: {
        courseLesson,
        stagedLesson,
        resolvedLessonId: persistedLessonId,
        playableFilm,
        videoProgressStore,
        lessonCompletionStore,
        accessibility: LMS_RUNTIME_ACCESSIBILITY_EVIDENCE,
        checkedAt: new Date().toISOString(),
      },
    };
  }
}
