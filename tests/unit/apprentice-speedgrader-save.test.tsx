import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import SpeedGrader from '@/components/gradebook/SpeedGrader';
it('keeps the current submission and exposes an error when the server rejects grading', async () => {
  const onGrade = vi.fn().mockRejectedValue(new Error('Grade was not saved'));
  render(<SpeedGrader assignment={{ id: 'assignment', title: 'Consultation', points: 50 }}
    submissions={['one','two'].map((id) => ({ id, assignmentId: 'assignment', studentId: id,
      submittedAt: new Date(), content: `Evidence ${id}`, status: 'submitted' as const, isLate: false }))}
    onGrade={onGrade} />);
  fireEvent.click(screen.getByRole('button', { name: 'Next →' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Grade was not saved'));
  expect(screen.getByText('Grading 1 of 2')).toBeTruthy();
  expect(screen.queryByText('Grade saved.')).toBeNull();
  expect(onGrade).toHaveBeenCalledWith('one', expect.objectContaining({ points: 50, maxPoints: 50 }));
});
