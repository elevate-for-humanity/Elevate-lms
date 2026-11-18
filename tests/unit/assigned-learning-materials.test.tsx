import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AssignedLearningMaterials from '@/components/lms/AssignedLearningMaterials';
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
afterEach(cleanup);
it('opens the supplied course and interactive workbook directly in the current LMS', () => {
  render(<AssignedLearningMaterials courses={[{ id: 'current', title: 'EPA 608', href: '/lms/courses/current' }]}
    workbooks={[{ id: 'book', title: 'HVAC workbook', href: '/workbooks/hvac' }]} />);
  expect(screen.getByRole('link', { name: 'Open course' })).toHaveAttribute('href', '/lms/courses/current');
  expect(screen.getByRole('link', { name: 'Open interactive workbook' })).toHaveAttribute('href', '/workbooks/hvac');
});
it('does not invent a course or workbook when access has not been supplied', () => {
  const { container } = render(<AssignedLearningMaterials />);
  expect(container).toBeEmptyDOMElement();
});
it('keeps the course available and surfaces a workbook failure with a retry destination', () => {
  render(<AssignedLearningMaterials error="Workbook links could not be loaded."
    courses={[{ id: 'current', title: 'EPA 608', href: '/lms/courses/current' }]} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Workbook links could not be loaded.');
  expect(screen.getByRole('link', { name: 'Open course' })).toHaveAttribute('href', '/lms/courses/current');
  expect(screen.getByRole('link', { name: 'Workbooks' })).toHaveAttribute('href', '/workbooks');
});
