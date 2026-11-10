import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import LearningWorkspace from '@/components/lms/LearningWorkspace';
import BeautyWorkbookSimulator from '@/components/lms/BeautyWorkbookSimulator';
import HvacWorkbookTeaching from '@/components/lms/HvacWorkbookTeaching';

vi.mock('@/components/lms/WorkbookNarration', () => ({ default: () => null }));
afterEach(cleanup);

it('preserves the answer and mounted player when switching between phone views', () => {
  const mount = vi.fn();
  function Player() {
    useEffect(() => {
      mount();
    }, []);
    return <video aria-label="Training video" />;
  }
  render(
    <LearningWorkspace
      instructions={
        <label>
          My answer
          <textarea />
        </label>
      }
      preview={<Player />}
    />,
  );
  const answer = screen.getByRole('textbox');
  fireEvent.change(answer, { target: { value: 'My work stays here' } });
  const preview = screen.getByRole('button', { name: 'Lesson preview' });
  fireEvent.click(preview);
  expect(preview).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'Instructions & activities' }));
  expect(screen.getByRole('textbox')).toBe(answer);
  expect(answer).toHaveValue('My work stays here');
  expect(mount).toHaveBeenCalledTimes(1);
});

it('keeps salon controls in instructions and updates the illustration in preview', () => {
  render(
    <LearningWorkspace
      instructions={<BeautyWorkbookSimulator slug="prestige-elevation-cosmetology" />}
      preview={<p>Salon practice</p>}
    />,
  );
  const left = screen.getByRole('region', { name: 'Instructions & activities' });
  const right = screen.getByRole('region', { name: 'Lesson preview' });
  expect(within(left).queryByRole('img')).toBeNull();
  expect(within(right).getByRole('img')).toBeInTheDocument();
  fireEvent.click(within(left).getByRole('radio', { name: /Check the assigned lesson/ }));
  fireEvent.click(within(left).getByRole('button', { name: 'Check my decision' }));
  expect(within(right).getByText('Correct safe decision')).toBeInTheDocument();
});

it('updates the HVAC circuit preview from the controls in the instruction panel', () => {
  render(<LearningWorkspace instructions={<HvacWorkbookTeaching number={3} />} preview={null} />);
  const left = screen.getByRole('region', { name: 'Instructions & activities' });
  const right = screen.getByRole('region', { name: 'Lesson preview' });
  expect(within(right).getByRole('img', { name: /switch open, current 0.00/ })).toBeInTheDocument();
  fireEvent.click(within(left).getByRole('button', { name: 'Close switch' }));
  expect(
    within(right).getByRole('img', { name: /switch closed, current 2.00/ }),
  ).toBeInTheDocument();
  fireEvent.change(within(left).getByRole('slider'), { target: { value: '24' } });
  expect(within(right).getByRole('img', { name: /current 1.00/ })).toBeInTheDocument();
});

it('expands either panel and restores split view without losing state', () => {
  const { container } = render(
    <LearningWorkspace
      instructions={<textarea aria-label="Written answer" />}
      preview={<video aria-label="Lesson film" />}
    />,
  );
  const answer = screen.getByRole('textbox');
  const video = container.querySelector('video');
  fireEvent.change(answer, { target: { value: 'Saved practice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lesson preview' }));
  expect(container.querySelector('[data-learning-workspace]')).toHaveAttribute(
    'data-view',
    'preview',
  );
  expect(container.querySelector('video')).toBe(video);
  fireEvent.click(screen.getByRole('button', { name: 'Split view' }));
  expect(container.querySelector('[data-learning-workspace]')).toHaveAttribute(
    'data-view',
    'split',
  );
  expect(answer).toHaveValue('Saved practice');
});
