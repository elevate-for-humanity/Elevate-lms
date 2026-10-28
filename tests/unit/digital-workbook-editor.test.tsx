import { fireEvent, render, screen, waitFor, within, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DigitalWorkbook from '@/components/lms/DigitalWorkbook';
import { emptyWorkbookAnswers } from '@/lib/lms/workbook-validation';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const workbook = {
  id: 'book',
  slug: 'prestige-elevation-cosmetology',
  title: 'Prestige Elevation Cosmetology Apprenticeship Workbook',
  program_id: 'program',
  cover_image: '/images/pexels/cosmetology.webp',
};
const sections = [1, 2].map((number) => ({
  id: `section-${number}`,
  workbook_id: 'book',
  section_number: number,
  title: `Study topic ${number}`,
  unit: 'Orientation',
  pdf_page: number * 2 + 3,
  prompts: [
    'Explain your learning goal.',
    'Describe a respectful response.',
    'Plan your next practice.',
  ],
  lesson_id: null,
}));

it('shows one section at a time and restores saved answers on reopening', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ section_id: 'section-1', version: 1 }), { status: 200 }),
    );
  vi.stubGlobal('fetch', fetchMock);
  const view = render(
    <DigitalWorkbook
      accountId="current-user"
      workbook={workbook}
      sections={sections}
      responses={[]}
      readOnly={false}
    />,
  );
  const region = screen.getByRole('region', { name: '1. Study topic 1' });
  fireEvent.change(within(region).getAllByRole('textbox')[0], {
    target: { value: 'My saved learning notes' },
  });
  fireEvent.click(within(region).getAllByRole('button', { name: 'Save answers' })[0]);
  await waitFor(() =>
    expect(within(region).getByRole('status')).toHaveTextContent('Saved to your account'),
  );
  fireEvent.change(screen.getByLabelText('Choose a workbook section'), {
    target: { value: 'section-2' },
  });
  expect(screen.queryByRole('region', { name: '1. Study topic 1' })).toBeNull();
  expect(screen.getByRole('region', { name: '2. Study topic 2' })).toBeVisible();
  view.unmount();
  render(
    <DigitalWorkbook
      workbook={workbook}
      sections={sections}
      responses={[
        {
          section_id: 'section-1',
          answers: { ...emptyWorkbookAnswers(), notes: 'My saved learning notes' },
          reviewed: false,
          version: 1,
          updated_at: 'now',
        },
      ]}
      readOnly={false}
    />,
  );
  expect(
    within(screen.getByRole('region', { name: '1. Study topic 1' })).getAllByRole('textbox')[0],
  ).toHaveValue('My saved learning notes');
});

it('keeps administrator previews read-only', () => {
  render(
    <DigitalWorkbook
      accountId="current-user"
      workbook={workbook}
      sections={sections}
      responses={[]}
      readOnly
    />,
  );
  expect(screen.getByText(/Read-only preview/)).toBeVisible();
  for (const input of screen.getAllByRole('textbox')) expect(input).toBeDisabled();
  for (const button of screen.getAllByRole('button', { name: 'Save answers' }))
    expect(button).toBeDisabled();
});
