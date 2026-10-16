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
