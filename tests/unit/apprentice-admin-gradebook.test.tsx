import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
vi.mock('next/dynamic', () => ({ default: () => () => null }));
import { GradebookClient } from '@/apps/admin/app/gradebook/[courseId]/GradebookClient';
it('uses actual assignment maxima and the same per-result average as the learner gradebook', () => {
  render(
    <GradebookClient
      courseId="course"
      enrollments={[
        {
          id: 'enrollment',
          user_id: 'learner',
          progress: 25,
          status: 'active',
          profiles: { full_name: 'Test Learner', email: '' },
        },
      ]}
      submissions={[
        {
          id: 'one',
          user_id: 'learner',
          assignment_id: 'a',
          course_id: 'course',
          grade: 40,
          max_points: 50,
          assignment_title: 'Consultation',
          status: 'graded',
          submitted_at: '',
        },
        {
          id: 'two',
          user_id: 'learner',
          assignment_id: 'b',
          course_id: 'course',
          grade: 0,
          max_points: 50,
          assignment_title: 'Sanitation',
          status: 'graded',
          submitted_at: '',
        },
      ]}
      quizAttempts={[
        {
          id: 'attempt',
          user_id: 'learner',
          quiz_id: 'lesson',
          course_id: 'course',
          score: 100,
          max_score: 100,
          status: 'completed',
          created_at: '',
        },
      ]}
    />,
  );
  expect(screen.getByText('40.0%')).toBeTruthy();
  expect(screen.getByText('60%')).toBeTruthy();
  expect(screen.getByText('25%')).toBeTruthy();
  expect(screen.queryByTitle('Click to override progress')).toBeNull();
});
