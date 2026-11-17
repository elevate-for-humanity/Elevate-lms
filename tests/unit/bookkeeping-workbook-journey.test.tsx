import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DigitalWorkbook from '@/components/lms/DigitalWorkbook';
import BookkeepingStudyGuide from '@/components/learner/BookkeepingStudyGuide';
import {
  BOOKKEEPING_COURSE_ID,
  BOOKKEEPING_WORKBOOK_SLUG,
} from '@/lib/lms/bookkeeping-workbook-contract';
import { bookkeepingWorkedExample } from '@/lib/lms/bookkeeping-workbook-guidance';
import { loadLessonWorkbook } from '@/lib/lms/lesson-workbook';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});
const workbook = {
  id: 'book',
  slug: BOOKKEEPING_WORKBOOK_SLUG,
  title: 'Elevate Bookkeeping — Exam Preparation and Applied Practice Workbook',
  program_id: 'program',
  cover_image: '/cover.svg',
};
const sections = [1, 2].map((number) => ({
  id: `section-${number}`,
  workbook_id: 'book',
  section_number: number,
  title: `Bookkeeping topic ${number}`,
  unit: 'Accounting Basics',
  pdf_page: number,
  prompts: ['Explain the calculation.', 'Show your working.', 'Explain your correction.'],
  lesson_id: `lesson-${number}`,
  course_id: BOOKKEEPING_COURSE_ID,
}));
const answers = {
  notes: 'My detailed lesson notes.',
  practice1: 'My worked calculation.',
  practice2: 'My independent working.',
  practice3: 'My explained correction.',
  nextGoal: 'I will practice reconciliation next.',
};

it('puts a visible picture, start instructions and chapter picker before the activities', () => {
  render(
    <DigitalWorkbook
      workbook={workbook}
      sections={sections}
      responses={[]}
      accountId="learner"
      readOnly={false}
    />,
  );
  expect(screen.getByRole('heading', { name: 'Bookkeeping practice workbook' })).toBeVisible();
  const picture = screen.getByRole('img', { name: `${workbook.title} cover` });
  expect(picture).toBeVisible();
  expect(picture.closest('details')).toBeNull();
  expect(screen.getByRole('region', { name: 'How to use this workbook' })).toBeVisible();
  expect(screen.getByRole('combobox', { name: 'Choose a workbook section' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Open the matching course lesson' })).toHaveAttribute(
    'href',
    `/lms/courses/${BOOKKEEPING_COURSE_ID}/lessons/lesson-1`,
  );
  expect(screen.queryByText(/Read and answer on the left/)).toBeNull();
});

it('waits for a confirmed saved review, then lets the learner choose Next chapter without losing answers', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ section_id: 'section-1', version: 1 }), { status: 200 }),
      ),
  );
  render(
    <DigitalWorkbook
      workbook={workbook}
      sections={sections}
      responses={[
        { section_id: 'section-1', answers, reviewed: false, version: 0, updated_at: 'now' },
      ]}
      accountId="learner"
      readOnly={false}
    />,
  );
  expect(screen.getByRole('button', { name: 'Next chapter', exact: true })).toBeDisabled();
  for (let step = 0; step < 5; step++) {
    fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true }));
    await waitFor(() =>
      expect(screen.getByRole('progressbar', { name: 'Section screens' })).toHaveAttribute(
        'value',
        String(step + 2),
      ),
    );
  }
  expect(screen.getByRole('heading', { name: 'Review your work' })).toBeVisible();
  fireEvent.click(screen.getByRole('checkbox'));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Next chapter', exact: true })).toBeEnabled(),
  );
  expect(screen.getByRole('region', { name: '1. Bookkeeping topic 1' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Next chapter', exact: true }));
  expect(screen.getByRole('region', { name: '2. Bookkeeping topic 2' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Previous chapter', exact: true }));
  expect(screen.getByText(answers.notes)).toBeVisible();
});

it('recommends a computer for spreadsheet files while preserving phone study and workbook access', () => {
  render(<BookkeepingStudyGuide />);
  expect(
    screen.getByText('Use a desktop or laptop for spreadsheets and the month-end case.'),
  ).toBeVisible();
  expect(
    screen.getByText(
      /You can still read lessons, watch videos, and write and save workbook answers on your phone/,
    ),
  ).toBeVisible();
  expect(screen.getByRole('link', { name: 'Open my workbook' })).toHaveAttribute(
    'href',
    `/workbooks/${BOOKKEEPING_WORKBOOK_SLUG}`,
  );
});

it('separates the worked example from the task while preserving every amount and instruction', () => {
  const prompt =
    'Apply this to a second fictional business: Assets are $17,000; liabilities are $5,000 and equity is $12,000. Explain each source document, journal entry, ledger balance and statement effect. Then change one amount.';
  const parts = bookkeepingWorkedExample(prompt)!;
  expect(parts.example).toBe('Assets are $17,000; liabilities are $5,000 and equity is $12,000.');
  expect(`Apply this to a second fictional business: ${parts.example} ${parts.activity}`).toBe(
    prompt,
  );
  expect(bookkeepingWorkedExample('An unrelated prompt stays unchanged.')).toBeNull();
});

it('loads only the matching bookkeeping chapter and keeps administrator inspection read-only', async () => {
  const filters: unknown[] = [];
  const db: any = {
    from: vi.fn((table: string) => {
      const chain: any = {
        select: () => chain,
        eq: (key: string, value: string) => {
          filters.push([table, key, value]);
          return chain;
        },
        maybeSingle: async () => ({
          data: table === 'digital_workbooks' ? workbook : sections[0],
          error: null,
        }),
      };
      return chain;
    }),
  };
  const result = await loadLessonWorkbook(db, BOOKKEEPING_COURSE_ID, 'lesson-1', 'learner', true);
  expect(filters).toContainEqual(['digital_workbooks', 'slug', BOOKKEEPING_WORKBOOK_SLUG]);
  expect(filters).toContainEqual(['digital_workbook_sections', 'lesson_id', 'lesson-1']);
  expect(result?.section.course_id).toBe(BOOKKEEPING_COURSE_ID);
  expect(result?.readOnly).toBe(true);
});
