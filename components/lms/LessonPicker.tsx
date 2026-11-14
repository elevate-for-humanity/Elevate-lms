'use client';

import { useRouter } from 'next/navigation';

export default function LessonPicker({
  courseId,
  lessonId,
  lessons,
}: {
  courseId: string;
  lessonId: string;
  lessons: { id: string; title: string }[];
}) {
  const router = useRouter();
  return (
    <label className="block font-bold text-slate-900">
      Choose a lesson
      <select
        value={lessonId}
        onChange={(event) => router.push(`/lms/courses/${courseId}/lessons/${event.target.value}`)}
        className="mt-2 min-h-12 w-full rounded-xl border border-slate-400 bg-white p-3 text-base font-normal"
      >
        {lessons.map((lesson, index) => (
          <option key={lesson.id} value={lesson.id}>
            {index + 1}. {lesson.title}
          </option>
        ))}
      </select>
    </label>
  );
}
