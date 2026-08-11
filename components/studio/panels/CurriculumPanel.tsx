'use client';

import dynamic from 'next/dynamic';
import { BookOpen } from 'lucide-react';
import { useCourse } from '../CourseProvider';
import type { StudioLesson } from '@/lib/studio/course-session';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const LessonManagerClient = dynamic(
  () => import('@/apps/admin/app/admin/studio/courses/[courseId]/content/LessonManagerClient').then((module) => module.default),
  { ssr: false, loading: () => <PanelSkeleton label="Curriculum" /> },
);

function toClientLesson(value: StudioLesson) {
  const lesson = value as StudioLesson & { content?: string | null };
  return {
    id: lesson.id,
    course_id: lesson.course_id,
    title: lesson.title,
    content: lesson.content ?? null,
    video_url: lesson.video_url ?? null,
    order_index: lesson.order_index,
    duration_minutes: lesson.duration_minutes ?? null,
    created_at: lesson.created_at,
  };
}

function mergeBackToStudio(
  saved: { id: string; title: string; content: string | null; video_url: string | null; order_index: number; duration_minutes: number | null; created_at: string },
  existing: StudioLesson | undefined,
  courseId: string,
): StudioLesson {
  return {
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
    ...(existing ?? {}),
    ...saved,
    course_id: courseId,
  } as StudioLesson;
}

export function CurriculumPanel() {
  const { state, upsertLesson, deleteLesson, appendAIMemory } = useCourse();
  const { course, modules, lessons } = state;

  return (
    <div className="p-6">
      <PanelHeader icon={<BookOpen className="w-5 h-5" />} title="Curriculum" subtitle={`${lessons.length} lesson${lessons.length !== 1 ? 's' : ''} across ${modules.length} module${modules.length !== 1 ? 's' : ''}`} />
      <LessonManagerClient
        course={course}
        courseId={course.id}
        initialLessons={lessons.map(toClientLesson)}
        onLessonSaved={(saved) => {
          const existing = lessons.find((lesson) => lesson.id === saved.id);
          upsertLesson(mergeBackToStudio(saved, existing, course.id));
          appendAIMemory({ role: 'action', content: `Lesson saved: "${saved.title}"`, source: 'curriculum' });
        }}
        onLessonDeleted={(lessonId) => {
          deleteLesson(lessonId);
          appendAIMemory({ role: 'action', content: `Lesson deleted: ${lessonId}`, source: 'curriculum' });
        }}
      />
    </div>
  );
}
