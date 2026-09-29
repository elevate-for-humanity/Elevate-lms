import type { SupabaseClient } from '@supabase/supabase-js';

import type { UltimateLearnerRuntimeEvidence, UltimateLearnerRuntimePort } from '../core/ports';
import { LMS_RUNTIME_ACCESSIBILITY_EVIDENCE } from '../accessibility/lms-runtime-accessibility';

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
    const [lessonResult, videoProgressResult, lessonCompletionResult] = await Promise.all([
      this.db
        .from('course_lessons')
        .select('id')
        .eq('id', input.lessonId)
        .eq('course_id', input.courseId)
        .maybeSingle(),
      this.db
        .from('learner_video_progress')
        .select('progress_percent,last_position_seconds,completed,completed_at')
        .eq('lesson_id', input.lessonId)
        .limit(1),
      this.db
        .from('lesson_progress')
        .select('progress_percent,last_position_seconds,completed,completed_at')
        .eq('lesson_id', input.lessonId)
        .limit(1),
    ]);

    const courseLesson = !lessonResult.error && Boolean(lessonResult.data?.id);
    const playableFilm = isPlayableUrl(input.videoUrl);
    const videoProgressStore = !videoProgressResult.error;
    const lessonCompletionStore = !lessonCompletionResult.error;

    return {
      progress_save: courseLesson && playableFilm && videoProgressStore,
      resume: courseLesson && playableFilm && videoProgressStore,
      completion: courseLesson && playableFilm && videoProgressStore && lessonCompletionStore,
      evidence: {
        courseLesson,
        playableFilm,
        videoProgressStore,
        lessonCompletionStore,
        accessibility: LMS_RUNTIME_ACCESSIBILITY_EVIDENCE,
        checkedAt: new Date().toISOString(),
      },
    };
  }
}
