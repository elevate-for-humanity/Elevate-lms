'use client';

/**
 * CurriculumPanel — wraps LessonManagerClient.
 * Reads modules/lessons from CourseProvider, writes via upsertLesson.
 *
 * Normalizer: StudioLesson (20+ fields) → LessonManagerClient.Lesson (8 fields).
 * Reverse normalizer merges the saved result back over the existing StudioLesson
 * so fields like lesson_type, module_id, is_published, approved are preserved.
 */

import dynamic from 'next/dynamic';
import { useCourse } from '../CourseProvider';
import type { StudioLesson } from '@/lib/studio/course-session';
import { BookOpen } from 'lucide-react';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const LessonManagerClient = dynamic(
  () => import('../../../apps/admin/app/admin/studio/courses/[courseId]/content/LessonManagerClient'),
  { ssr: false, loading: () => <PanelSkeleton label="Curriculum" /> }
);

// StudioLesson (20+ fields) → LessonManagerClient.Lesson (8 required fields)
function toClientLesson(l: StudioLesson) {
  return {
    id: l.id,
    course_id: l.course_id,
    title: l.title,
    content: l.content ?? null,
    video_url: l.video_url ?? null,
    order_index: l.order_index,
    duration_minutes: l.duration_minutes ?? null,
    created_at: l.created_at,
  };
}

// LessonManagerClient.Lesson → StudioLesson: merge saved fields back over
// the existing StudioLesson so lesson_type, module_id, is_published, approved
// and all other StudioLesson fields are preserved rather than silently dropped.
function mergeBackToStudio(
  saved: { id: string; title: string; content: string | null; video_url: string | null; order_index: number; duration_minutes: number | null; created_at: string },
  existing: StudioLesson | undefined,
  courseId: string,
): StudioLesson {
  return {
    // Defaults for a brand-new lesson (existing is undefined on create)
    lesson_type: 'lesson',
    module_id: null,
    is_published: false,
    approved: false,
    slug: null,
    video_config: null,
    activities: null,
    quiz_questions: null,
    passing_score: null,
    ai_generated: false,
    updated_at: new Date().toISOString(),
    // Spread existing StudioLesson fields (preserves lesson_type, module_id, etc.)
    ...(existing ?? {}),
    // Spread the freshly-saved fields (authoritative from DB)
    ...saved,
    course_id: courseId,
  } as StudioLesson;
}

export function CurriculumPanel() {
  const { state, upsertLesson, deleteLesson, appendAIMemory } = useCourse();
  const { course, modules, lessons } = state;

  return (
    <div className="p-6">
      <PanelHeader
        icon={<BookOpen className="w-5 h-5" />}
        title="Curriculum"
        subtitle={`${lessons.length} lesson${lessons.length !== 1 ? 's' : ''} across ${modules.length} module${modules.length !== 1 ? 's' : ''}`}
      />
      <LessonManagerClient
        course={course}
        courseId={course.id}
        initialLessons={lessons.map(toClientLesson)}
        onLessonSaved={(saved) => {
          const existing = lessons.find(l => l.id === saved.id);
          upsertLesson(mergeBackToStudio(saved, existing, course.id));
          appendAIMemory({
            role: 'action',
            content: `Lesson saved: "${saved.title}"`,
            source: 'curriculum',
          });
        }}
        onLessonDeleted={(lessonId) => {
          deleteLesson(lessonId);
          appendAIMemory({
            role: 'action',
            content: `Lesson deleted: ${lessonId}`,
            source: 'curriculum',
          });
        }}
      />
    </div>
  );
}
