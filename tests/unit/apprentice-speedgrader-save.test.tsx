import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import SpeedGrader from '@/components/gradebook/SpeedGrader';
it('keeps the current submission and exposes an error when the server rejects grading', async () => {
  const onGrade = vi.fn().mockRejectedValue(new Error('Grade was not saved'));
  render(
    <SpeedGrader
      assignment={{ id: 'assignment', title: 'Consultation', points: 50 }}
      submissions={['one', 'two'].map((id) => ({
        id,
        assignmentId: 'assignment',
        studentId: id,
        submittedAt: new Date(),
        content: `Evidence ${id}`,
        status: 'submitted' as const,
        isLate: false,
      }))}
      onGrade={onGrade}
    />,
  );
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Grade was not saved'));
  expect(screen.getByText('Grading 1 of 2')).toBeTruthy();
  expect(screen.queryByText('Grade saved.')).toBeNull();
  expect(onGrade).toHaveBeenCalledWith(
    'one',
    expect.objectContaining({ points: 50, maxPoints: 50 }),
  );
});

it('requires an entered score for ungraded work rather than awarding full points', async () => {
  const onGrade = vi.fn();
  render(
    <SpeedGrader
      assignment={{ id: 'a', title: 'Practice', points: 50 }}
      submissions={[
        {
          id: 's',
          assignmentId: 'a',
          studentId: 'u',
          submittedAt: new Date(),
          content: 'Evidence',
          status: 'submitted',
          isLate: false,
        },
      ]}
      onGrade={onGrade}
    />,
  );
  expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Save Grade' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Enter points'));
  expect(onGrade).not.toHaveBeenCalled();
});
it('preserves a saved zero grade and feedback', () => {
  render(
    <SpeedGrader
      assignment={{ id: 'a', title: 'Practice', points: 50 }}
      submissions={[
        {
          id: 's',
          assignmentId: 'a',
          studentId: 'u',
          submittedAt: new Date(),
          content: 'Evidence',
          status: 'graded',
          isLate: false,
          existingGrade: 0,
          existingFeedback: 'Needs revision',
        },
      ]}
      onGrade={vi.fn()}
    />,
  );
  expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('0');
  expect(screen.getByDisplayValue('Needs revision')).toBeTruthy();
});
