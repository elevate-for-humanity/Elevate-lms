'use client';

import dynamic from 'next/dynamic';
import { HelpCircle } from 'lucide-react';
import { useCourse } from '../CourseProvider';
import { PanelHeader, PanelSkeleton } from './BlueprintPanel';

const QuizManagerClient = dynamic(
  () => import('@/apps/admin/app/admin/studio/courses/[courseId]/quizzes/QuizManagerClient').then((module) => module.default),
  { ssr: false, loading: () => <PanelSkeleton label="Quizzes" /> },
);

export function QuizPanel() {
  const { state, appendAIMemory } = useCourse();
  const { course, lessons, quizzes } = state;
  const quizLessons = lessons.filter((lesson) => ['quiz', 'checkpoint', 'exam'].includes(lesson.lesson_type));

  return (
    <div className="p-6">
      <PanelHeader icon={<HelpCircle className="w-5 h-5" />} title="Quizzes & Assessments" subtitle={`${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''} · ${quizLessons.length} assessment lesson${quizLessons.length !== 1 ? 's' : ''}`} />
      <QuizManagerClient
        course={{ id: course.id, title: course.title }}
        courseId={course.id}
        initialQuizzes={quizzes.map((quiz) => {
          const value = quiz as typeof quiz & { max_attempts?: number | null; created_at?: string | null };
          return {
            id: value.id,
            course_id: value.course_id,
            title: value.title,
            description: value.description,
            time_limit_minutes: value.time_limit_minutes,
            passing_score: value.passing_score ?? 70,
            question_count: value.question_count ?? 0,
            max_attempts: value.max_attempts ?? 3,
            created_at: value.created_at ?? new Date(0).toISOString(),
          };
        })}
        onQuizSaved={(quiz) => {
          appendAIMemory({ role: 'action', content: `Quiz saved: "${quiz.title}" (passing: ${quiz.passing_score}%)`, source: 'quiz' });
        }}
      />
    </div>
  );
}
