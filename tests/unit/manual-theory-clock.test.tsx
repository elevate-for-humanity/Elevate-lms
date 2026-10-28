import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import LessonProgressClient from '../../apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/LessonProgressClient';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('separate manual theory timeclock', () => {
  it('records no theory on page-open and requires explicit start/stop without marking the lesson complete', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tracked: true,
        sessionId: 'real-session-response',
        weeklyActiveSeconds: 60,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <>
        <div id="theory-timeclock-slot" />
        <LessonProgressClient
          courseId="course"
          lessonId="lesson"
          lessonType="lesson"
          moduleOrder={1}
          passingScore={80}
          questions={[]}
        />
      </>,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Start theory timeclock' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Stop theory timeclock' })).not.toBeDisabled(),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      action: 'start',
      courseId: 'course',
      lessonId: 'lesson',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Stop theory timeclock' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      action: 'stop',
      sessionId: 'real-session-response',
      creditFinal: true,
    });
    expect(fetchMock.mock.calls.some((call) => String(call[0]).endsWith('/complete'))).toBe(false);
  });
});
