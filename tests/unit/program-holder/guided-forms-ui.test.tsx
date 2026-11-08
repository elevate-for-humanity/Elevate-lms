import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { GuidedInvoiceFields } from '@/components/program-holder/GuidedInvoiceFields';
import { GuidedW9Form } from '@/components/program-holder/GuidedW9Form';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('fills student details and the agreed stage amount while allowing an edited request', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          providerName: 'Example Business',
          students: [
            {
              id: 'student-a',
              name: 'Assigned Learner',
              trainingStart: '2026-11-01',
              trainingEnd: '2026-12-01',
              start: {
                amountCents: 40000,
                source: 'Individual schedule',
                reason: 'Start installment',
              },
              completion: {
                amountCents: 60000,
                source: 'Individual schedule',
                reason: 'Completion installment',
              },
            },
          ],
        }),
        { headers: { 'content-type': 'application/json' } },
      ),
    ),
  );
  render(<GuidedInvoiceFields />);
  await waitFor(() => expect(screen.getByLabelText('Student from your dashboard')).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Student from your dashboard'), {
    target: { value: 'student-a' },
  });
  expect(screen.getByLabelText('Amount requested (USD)')).toHaveValue(400);
  expect(screen.getByLabelText('Training start date')).toHaveValue('2026-11-01');
  expect(
    (screen.getByLabelText('Training / services provided') as HTMLTextAreaElement).value,
  ).toContain('Assigned Learner');
  fireEvent.change(screen.getByLabelText('Amount requested (USD)'), {
    target: { value: '375.00' },
  });
  expect(screen.getByLabelText('Amount requested (USD)')).toHaveValue(375);
  fireEvent.change(screen.getByLabelText('Payment stage'), { target: { value: 'completion' } });
  expect(screen.getByLabelText('Amount requested (USD)')).toHaveValue(600);
});
it('keeps the W-9 signature and certification as the final step without uploading a file', () => {
  render(<GuidedW9Form />);
  fireEvent.click(screen.getByText('Fill, sign and submit my W-9 online'));
  const name = screen.getByLabelText(/Line 1/);
  expect(name).toBeVisible();
  const form = name.closest('form')!;
  fireEvent.submit(form);
  expect(screen.getByText(/Step 2 of 3/)).toBeVisible();
  fireEvent.submit(form);
  expect(screen.getByText(/Step 3 of 3/)).toBeVisible();
  expect(form.querySelector('input[type="file"]')).toBeNull();
  expect(form.querySelector('input[name="signature"]')).toBeRequired();
  expect(form.querySelector('input[name="certified"]')).toBeRequired();
});

it('preserves W-9 entries and certifications when navigating back to review', () => {
  render(<GuidedW9Form />);
  fireEvent.click(screen.getByText('Fill, sign and submit my W-9 online'));
  const name = screen.getByLabelText(/Line 1/);
  fireEvent.change(name, { target: { value: 'Isolated QA Holder' } });
  const form = name.closest('form')!;
  fireEvent.submit(form);
  fireEvent.change(screen.getByLabelText(/Line 5/), { target: { value: '123 Test Street' } });
  fireEvent.submit(form);
  const certification = form.querySelector<HTMLInputElement>('input[name="certified"]')!;
  fireEvent.click(certification);
  fireEvent.click(screen.getByRole('button', { name: 'Back and review' }));
  expect(screen.getByLabelText(/Line 5/)).toHaveValue('123 Test Street');
  fireEvent.click(screen.getByRole('button', { name: 'Back and review' }));
  expect(name).toHaveValue('Isolated QA Holder');
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(certification).toBeChecked();
});
