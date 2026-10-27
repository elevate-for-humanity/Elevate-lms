/**
 * Owner-approved course-production reference, reconstructed from persisted
 * Supabase ultimate_lesson_builds artifact 45bbd784-08c2-4b13-9c6f-c00952caa70b
 * and the owner-reviewed course_lessons record (not an invented render recipe).
 *
 * New courses use the same delivery pattern but NEVER reuse the example's
 * footage, course ID, scene IDs, signed image URLs, or barber asset references.
 */
export const APPROVED_LESSON_EXAMPLE = Object.freeze({
  sourceCourseId: 'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',
  sourceLessonId: 'e1e53bfd-2504-46b0-a814-a31c74a0090a',
  sourceBuildId: '45bbd784-08c2-4b13-9c6f-c00952caa70b',
  artifactVersion: 25,
  video: {
    url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/generated-lessons/lesson-e1e53bfd-2504-46b0-a814-a31c74a0090a-mv93v9ru-a87df139-4b23-4c59-b6f6-b05cc22ea7ae.mp4',
    sha256: '6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2',
    width: 1920, height: 1080, videoCodec: 'h264', audioCodec: 'aac',
    durationSeconds: 351.318,
  },
  observedProduction: {
    storyboardScenes: 13,
    narrationSegments: 13,
    narrationProvider: 'kokoro',
    visualAssignments: 13,
    layoutVersion: 4,
    presentationVersion: 'approved-moment-cues-v2',
    cropMode: 'contain', transition: 'crossfade',
  },
  approval: { approvedForThisLesson: true, automatedAcceptanceComplete: false,
    retainedFinding: 'MEDIA_TEXT_UNREADABLE:3:390' },
});

function assertQuestion(question, at) {
  const prompt = String(question?.question ?? question?.prompt ?? '').trim();
  const choices = question?.choices ?? question?.options;
  const correct = question?.correctAnswer ?? question?.correct_answer ?? question?.answerIndex;
  if (!prompt || !Array.isArray(choices) || choices.length < 2 ||
      !choices.every(c => String(typeof c === 'string' ? c : c?.text ?? '').trim()) ||
      !(Number.isInteger(correct) && correct >= 0 && correct < choices.length))
    throw new Error('INVALID_MULTIPLE_CHOICE_QUESTION:' + at);
}

/** New-course release contract: recap after EVERY chapter + one cumulative final. */
export function verifyNewCourseAssessmentContract(course, {
  recapCount = 5, finalCount = 25,
} = {}) {
  if (!course || !Array.isArray(course.chapters) || !course.chapters.length)
    throw new Error('COURSE_CHAPTERS_REQUIRED');
  const chapterIds = new Set();
  for (const [i, chapter] of course.chapters.entries()) {
    if (!chapter?.id || chapterIds.has(chapter.id)) throw new Error('CHAPTER_ID_INVALID:' + i);
    chapterIds.add(chapter.id);
    if (!Array.isArray(chapter.recapQuestions) || chapter.recapQuestions.length !== recapCount)
      throw new Error('CHAPTER_MULTIPLE_CHOICE_RECAP_REQUIRED:' + chapter.id);
    chapter.recapQuestions.forEach((q,j) => assertQuestion(q, chapter.id + ':' + j));
  }
  if (!course.finalExam || course.finalExam.position !== 'after-last-chapter' ||
      course.finalExam.cumulative !== true ||
      !Array.isArray(course.finalExam.questions) ||
      course.finalExam.questions.length !== finalCount)
    throw new Error('CUMULATIVE_FINAL_EXAM_REQUIRED');
  course.finalExam.questions.forEach((q,j) => assertQuestion(q, 'final:' + j));
  return { passed: true, chapters: chapterIds.size,
    recaps: chapterIds.size, finalQuestions: finalCount };
}

/** Renderer input: always course-local assets, natural narration and captions. */
export function createLessonProductionRequest({ courseId, lessonId, scenes, narration,
  captionsUrl, transcriptUrl }) {
  if (!courseId || !lessonId || !Array.isArray(scenes) || !scenes.length ||
      !Array.isArray(narration) || scenes.length !== narration.length ||
      !scenes.every(s => s?.assetId && s?.relevanceReason) ||
      !narration.every(s => s?.text && s?.audioUrl) ||
      !captionsUrl || !transcriptUrl)
    throw new Error('COURSE_PRODUCTION_INPUT_INCOMPLETE');
  return { courseId, lessonId, scenes, narration, captionsUrl, transcriptUrl,
    output: { container: 'mp4', width: 1920, height: 1080,
      videoCodec: 'h264', audioCodec: 'aac' },
    imageLayout: { fit: 'contain', transition: 'crossfade' } };
}

/** Validate the actual authored assessment shape produced by UltimatePlatformAssessment. */
export function requireChapterRecap(assessment, chapterId, expected = 5) {
  if (!Array.isArray(assessment?.questions) || assessment.questions.length < expected)
    throw new Error('CHAPTER_RECAP_QUESTIONS_MISSING:' + chapterId);
  assessment.questions.slice(0,expected).forEach((q,i) => assertQuestion(q,chapterId + ':' + i));
  return assessment.questions.slice(0,expected);
}
