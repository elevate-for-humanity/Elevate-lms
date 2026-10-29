import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { workbookVisualAssignments } from '@/lib/lms/workbook-visuals';
import WorkbookLessonPicture from '@/components/lms/WorkbookLessonPicture';

afterEach(cleanup);
const sections = [
  { id: 'first', title: 'Client Consultation', section_number: 6 },
  { id: 'second', title: 'Client Consultation', section_number: 12 },
  { id: 'other', title: 'Hair Growth Cycle', section_number: 9 },
];
it('does not repeat an image when a workbook repeats a lesson title or invent a generic fallback', () => {
  const result = workbookVisualAssignments('prestige-elevation-barbering', sections);
  expect(result.first.src).toContain('barber-consultation.webp');
  expect(result.second).toBeUndefined();
  expect(result.other).toBeUndefined();
  expect(workbookVisualAssignments('unrelated-book', sections)).toEqual({});
});
it('keeps topics in their own workbook and matches titles rather than section positions', () => {
  const manicure = [{ id: 'n', title: 'Basic Manicure Procedure', section_number: 99 }];
  expect(workbookVisualAssignments('prestige-elevation-nail-technology', manicure).n.src).toContain(
    'nail-manicure.webp',
  );
  expect(workbookVisualAssignments('prestige-elevation-barbering', manicure)).toEqual({});
});
it('preserves the full frame, describes generated imagery, and never substitutes a random picture on failure', () => {
  const visual = workbookVisualAssignments('prestige-elevation-barbering', sections).first;
  render(<WorkbookLessonPicture visual={visual} />);
  const image = screen.getByRole('img');
  expect(image).toHaveClass('object-contain');
  expect(screen.getByText(/AI-generated/)).toBeVisible();
  expect(screen.getByText(visual.caption)).toBeVisible();
  fireEvent.error(image);
  expect(screen.queryByRole('img')).toBeNull();
  expect(screen.getByRole('status')).toHaveTextContent('could not load');
});

it('gives each workbook a distinct opening picture instead of opening as a text-only page', () => {
  const openings = [
    ['prestige-elevation-barbering', 'Introduction to Barbering'],
    ['prestige-elevation-cosmetology', 'Welcome to Cosmetology Apprenticeship'],
    ['prestige-elevation-esthetics', 'Welcome to Esthetician Apprenticeship'],
    ['prestige-elevation-nail-technology', 'Welcome to Nail Technician Apprenticeship'],
  ];
  const sources = openings.map(([slug, title]) => {
    const visual = workbookVisualAssignments(slug, [
      { id: 'opening', title, section_number: 1 },
    ]).opening;
    expect(visual.generated).toBe(true);
    expect(visual.src).toContain('/intro-');
    return visual.src;
  });
  expect(new Set(sources).size).toBe(4);
});
