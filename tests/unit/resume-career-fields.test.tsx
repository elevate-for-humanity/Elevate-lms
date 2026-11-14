import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ResumeBuilder } from '@/components/career/ResumeBuilder';
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }));
afterEach(cleanup);
it('saves training, skills, and earned credentials together and includes them in the preview', async () => {
  const save = vi.fn(async () => {});
  render(<ResumeBuilder initialData={{ personal_info: { full_name: 'QA Learner', email: 'qa@example.invalid', phone: '', location: '' }, summary: 'Career preparation' }} onSave={save} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add training' }));
  fireEvent.change(screen.getByLabelText('Program or qualification'), { target: { value: 'HVAC training' } });
  fireEvent.change(screen.getByLabelText('School or training provider'), { target: { value: 'Elevate for Humanity' } });
  fireEvent.change(screen.getByLabelText('Training completion date'), { target: { value: '2026-10' } });
  fireEvent.change(screen.getByLabelText('Skill to add'), { target: { value: 'Safety procedures' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add skill' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add credential' }));
  fireEvent.change(screen.getByLabelText('Credential name'), { target: { value: 'QA sample credential' } });
  fireEvent.change(screen.getByLabelText('Issued by'), { target: { value: 'QA issuer' } });
  fireEvent.change(screen.getByLabelText('Date earned'), { target: { value: '2026-10-27' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Resume' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({
    summary: 'Career preparation',
    education: [{ degree: 'HVAC training', school: 'Elevate for Humanity', graduation_date: '2026-10' }],
    skills: ['Safety procedures'],
    certifications: [{ name: 'QA sample credential', issuer: 'QA issuer', date: '2026-10-27' }],
  })));
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  expect(screen.getByRole('region', { name: 'Resume preview' })).toHaveTextContent('QA sample credential');
  expect(screen.getByRole('region', { name: 'Resume preview' })).toHaveTextContent('HVAC training');
  expect(screen.getByRole('region', { name: 'Resume preview' })).toHaveTextContent('Safety procedures');
});
