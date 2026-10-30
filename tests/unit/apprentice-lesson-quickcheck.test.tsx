import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const finalize = vi.fn();
vi.mock('@/lib/lms/useTheoryTimeclock', () => ({ useTheoryTimeclock: () => ({ finalize }) }));
vi.mock('@/components/lms/TheoryTimeclock', () => ({ TheoryTimeclockPanel: () => null }));
import LessonProgressClient from '@/apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/LessonProgressClient';
afterEach(() => vi.unstubAllGlobals());
it('saves regular-lesson quick checks through server scoring and leaves completion explicit', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ score: 80, passed: true }) });
  vi.stubGlobal('fetch', fetcher);
  render(
    <LessonProgressClient
      courseId="course"
      lessonId="lesson"
      lessonType="lesson"
      moduleOrder={1}
      passingScore={80}
      questions={[{ id: 'q', question: 'Choose', options: ['A', 'B'], correctAnswer: 0 }]}
    />,
  );
  fireEvent.click(screen.getByRole('radio', { name: 'A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit assessment' }));
  await waitFor(() => expect(screen.getByText(/Passed with 80%/)).toBeTruthy());
  expect(fetcher).toHaveBeenCalledTimes(1);
  const body = JSON.parse(fetcher.mock.calls[0][1].body);
  expect(body).toMatchObject({ answers: { q: 0 }, courseId: 'course' });
  expect(body).not.toHaveProperty('score');
  expect(finalize).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Mark lesson complete' })).toBeTruthy();
});
