'use client';

import CourseInteractionStudio from '@/components/admin/course-builder/CourseInteractionStudio';
import { useCourse } from '../CourseProvider';

export function InteractionsPanel() {
  const { state } = useCourse();
  const modules = state.modules.map((module) => ({
    ...module,
    lessons: state.lessons.filter((lesson) => lesson.module_id === module.id),
  }));

  return <CourseInteractionStudio courseTitle={state.course.title} modules={modules} />;
}
