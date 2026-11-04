import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/components/lms/WorkbookNarration', () => ({
  default: ({ text }: { text: string }) => <div data-testid="narration">{text}</div>,
}));
import HvacWorkbookTeaching from '@/components/lms/HvacWorkbookTeaching';
afterEach(cleanup);
it('keeps one visible explanation and matching narration while moving through a chapter', () => {
  render(<HvacWorkbookTeaching number={1} />);
  const first = screen.getByTestId('narration').textContent;
  expect(screen.getAllByTestId('narration')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Next explanation' }));
  expect(screen.getAllByTestId('narration')).toHaveLength(1);
  expect(screen.getByTestId('narration').textContent).not.toBe(first);
  const article = screen.getByTestId('narration').closest('article')!;
  expect(screen.getByTestId('narration').textContent).toContain(
    within(article).getByRole('heading').textContent,
  );
});
