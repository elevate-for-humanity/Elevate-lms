import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { trainingMilestones } from '@/lib/program-holder/training-milestones';
import { ProgramHolderTrainingLogForm } from '@/components/program-holder/ProgramHolderTrainingLogForm';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
it.each(['bookkeeping-quickbooks', 'tax-preparation', 'business-management', 'brand-new-program', null])('keeps trade-specific requirements out of %s', slug => {
  expect(trainingMilestones(slug)).toContain('Guided practice and skill development');
  expect(trainingMilestones(slug)).not.toContain('Refrigerant handling and environmental rules');
});
it('preserves the existing HVAC categories', () => {
  expect(trainingMilestones('hvac-technician')).toContain('Refrigerant handling and environmental rules');
});
it('switches categories and clears a prior milestone when the student program changes', () => {
  render(<ProgramHolderTrainingLogForm programs={[]} enrollments={[
    { id: 'hvac-student', full_name: 'HVAC Learner', program_slug: 'hvac-technician' },
    { id: 'bookkeeping-student', full_name: 'Bookkeeping Learner', program_slug: 'bookkeeping-quickbooks' },
  ]} />);
  const student = screen.getByRole('combobox', { name: 'Student' });
  fireEvent.change(student, { target: { value: 'hvac-student' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Milestone' }), { target: { value: 'Refrigerant handling and environmental rules' } });
  fireEvent.change(student, { target: { value: 'bookkeeping-student' } });
  expect(screen.queryByRole('option', { name: 'Refrigerant handling and environmental rules' })).toBeNull();
  expect((screen.getByRole('combobox', { name: 'Milestone' }) as HTMLSelectElement).value).toBe('');
});
