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

it('opens a course at full width when requested and keeps activities available', () => {
  const { container } = render(
    <LearningWorkspace
      initialView="preview"
      instructionLabel="Workbook & lesson activities"
      previewLabel="Theory lesson & video"
      instructions={<textarea aria-label="Lesson answer" />}
      preview={<video aria-label="Lesson film" />}
    />,
  );
  expect(container.querySelector('[data-learning-workspace]')).toHaveAttribute(
    'data-view',
    'preview',
  );
  expect(screen.getByRole('button', { name: 'Theory lesson & video' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Workbook & lesson activities' }));
  expect(screen.getByRole('textbox', { name: 'Lesson answer' })).toBeInTheDocument();
});

it('expands the complete lesson across the viewport and restores the same mounted player and answers', () => {
  const { container } = render(
    <LearningWorkspace
      instructions={<textarea aria-label="Workbook answer" />}
      preview={<video aria-label="Full lesson video" />}
    />,
  );
  const textarea = screen.getByRole('textbox', { name: 'Workbook answer' });
  const video = screen.getByLabelText('Full lesson video');
  fireEvent.change(textarea, { target: { value: 'Unsubmitted saved work stays mounted' } });
  fireEvent.click(screen.getByRole('button', { name: 'Full screen lesson' }));
  expect(document.body.style.overflow).toBe('hidden');
  expect(container.querySelector('[data-learning-workspace]')).toHaveAttribute('data-expanded', 'true');
  expect(container.querySelector('[data-learning-workspace]')).toHaveAttribute('data-view', 'preview');
  expect(screen.getByLabelText('Full lesson video')).toBe(video);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.body.style.overflow).toBe('');
  expect(container.querySelector('[data-learning-workspace]')).toHaveAttribute('data-expanded', 'false');
  expect(screen.getByRole('textbox', { name: 'Workbook answer' })).toBe(textarea);
  expect(textarea).toHaveValue('Unsubmitted saved work stays mounted');
});
