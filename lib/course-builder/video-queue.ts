/**
 * @deprecated Course media orchestration is owned by lib/course-factory/media-service.
 * This compatibility export remains only while downstream imports are migrated.
 */
export {
  queueCourseLessonVideos,
  type QueueCourseLessonVideosInput,
  type QueueCourseLessonVideosResult,
} from '@/lib/course-factory/media-service';
