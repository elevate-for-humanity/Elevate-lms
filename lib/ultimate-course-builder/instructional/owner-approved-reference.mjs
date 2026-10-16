/**
 * The verified owner-approved cosmetology film is an output example, not a
 * universal source-asset requirement. This contract describes its observed
 * delivery characteristics without manufacturing an unrecovered render recipe.
 *
 * Future lessons: resolve their own source footage, images, narration, captions,
 * and course lesson IDs. Keep media security, rights, and publication QA intact.
 */
export const OWNER_APPROVED_LESSON_REFERENCE = Object.freeze({
  courseId: 'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',
  lessonId: 'e1e53bfd-2504-46b0-a814-a31c74a0090a',
  sourceBuildId: '45bbd784-08c2-4b13-9c6f-c00952caa70b',
  artifactVersion: 25,
  output: {
    url: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/generated-lessons/lesson-e1e53bfd-2504-46b0-a814-a31c74a0090a-mv93v9ru-a87df139-4b23-4c59-b6f6-b05cc22ea7ae.mp4',
    sha256: '6921ebb2f049e0183fa2f5cfebaa1a9a6e2a8242a672daebbdcb251ca0a96fc2',
    width: 1920, height: 1080, durationSeconds: 351.318,
    videoCodec: 'h264', audioCodec: 'aac',
  },
  review: {
    mode: 'explicit-owner-approval',
    approvedForThisLesson: true,
    automatedAcceptanceComplete: false,
    retainedFinding: 'MEDIA_TEXT_UNREADABLE:3:390',
  },
});

/** Presentation is configured by course/lesson, never guessed from a fixed ID list. */
export function standardLessonDelivery({ sceneAssets, narrationSegments, captionsUrl, transcriptUrl }) {
  if (!Array.isArray(sceneAssets) || !sceneAssets.length)
    throw new Error('LESSON_SCENE_ASSETS_REQUIRED');
  if (!Array.isArray(narrationSegments) || !narrationSegments.length)
    throw new Error('LESSON_NARRATION_REQUIRED');
  if (!captionsUrl || !transcriptUrl)
    throw new Error('LESSON_ACCESSIBLE_MEDIA_REQUIRED');
  return { sceneAssets, narrationSegments, captionsUrl, transcriptUrl,
    referenceStyle: 'owner-approved-cosmetology-lesson',
    output: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac',
      width: 1920, height: 1080 },
  };
}

/**
 * Course assessment structure. Every chapter ends with a multiple-choice recap,
 * followed by one cumulative multiple-choice final exam for the entire course.
 * Question totals follow the course's approved assessment settings, not a
 * globally hard-coded subject or course ID.
 */
export function validateCourseAssessments({
  chapters,
  finalExam,
  recapQuestionsPerChapter = 5,
  finalExamQuestions = 25,
}) {
  if (!Array.isArray(chapters) || chapters.length === 0)
    throw new Error('COURSE_CHAPTERS_REQUIRED');
  const validateQuestions = (questions, expected, code) => {
    if (!Array.isArray(questions) || questions.length !== expected)
      throw new Error(code + '_COUNT');
    for (const question of questions) {
      const options = question?.options ?? question?.choices;
      const answer = question?.correctAnswer ?? question?.correct_answer;
      if (!String(question?.prompt ?? question?.question ?? '').trim() ||
          !Array.isArray(options) || options.length < 2 ||
          !options.every(value => String(typeof value === 'string' ? value : value?.text ?? '').trim()) ||
          !(Number.isInteger(answer) ? answer >= 0 && answer < options.length
            : typeof answer === 'string' && options.some(option =>
                (typeof option === 'string' ? option : option?.text) === answer)))
        throw new Error(code + '_INVALID_MULTIPLE_CHOICE');
    }
  };
  for (const [i, chapter] of chapters.entries()) {
    if (!chapter?.id && !chapter?.title)
      throw new Error('CHAPTER_IDENTITY_REQUIRED:' + (i + 1));
    validateQuestions(chapter.recap?.questions, recapQuestionsPerChapter,
      'CHAPTER_RECAP_REQUIRED:' + (chapter.id ?? i + 1));
  }
  if (!finalExam?.cumulative)
    throw new Error('FULL_COURSE_CUMULATIVE_FINAL_REQUIRED');
  validateQuestions(finalExam.questions, finalExamQuestions, 'FULL_COURSE_FINAL_REQUIRED');
  return { chapterRecaps: chapters.length, finalExamQuestions: finalExam.questions.length,
    finalExamPosition: 'after-last-chapter' };
}
