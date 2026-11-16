import { it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
const refresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
const finalize = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('@/lib/lms/useTheoryTimeclock', () => ({ useTheoryTimeclock: () => ({ finalize }) }));
vi.mock('@/components/lms/TheoryTimeclock', () => ({ TheoryTimeclockPanel: () => null }));
vi.mock('@/components/lms/WorkbookNarration', () => ({ default: () => null }));
import LessonProgressClient from '@/apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/LessonProgressClient';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
const props = {
  courseId: 'course',
  lessonId: 'lesson',
  lessonType: 'quiz',
  moduleOrder: 1,
  passingScore: 80,
  questions: [{ question: 'A saved test', options: ['one', 'two'] }],
  theoryClockEnabled: false,
  savedPassingScore: 100,
};
it('finishes remaining completion without submitting an already-passed quiz again', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ completed: true }), { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  render(<LessonProgressClient {...props} />);
  expect(screen.getByText('Saved passing result: 100%.')).toBeInTheDocument();
  expect(screen.queryByRole('radio')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Finish assessment completion' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
  expect(fetch.mock.calls[0][0]).toBe('/api/courses/course/lessons/lesson/complete');
  expect(refresh).toHaveBeenCalledOnce();
});
it('keeps an existing completed lesson completed on reload', () => {
  render(<LessonProgressClient {...props} initiallyCompleted />);
  expect(screen.queryByRole('button', { name: 'Finish assessment completion' })).toBeNull();
  expect(screen.queryByRole('radio')).toBeNull();
});

it('keeps navigation and completion unchanged when the server rejects a workbook gate', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Complete workbook first' }), { status: 403 }),
      ),
  );
  render(<LessonProgressClient {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Finish assessment completion' }));
  await screen.findByText('Complete workbook first');
  expect(refresh).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Finish assessment completion' })).toBeEnabled();
});
