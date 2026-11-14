import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ServiceBillingPanel } from '@/components/admin/ServiceBillingPanel';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const record = {
  serviceId: 'twilio',
  revision: 'original',
  enabled: true,
  currency: 'USD',
  balance: 12,
  warningBalance: 20,
  criticalBalance: 5,
  amountDue: null,
  dueDate: null,
  paymentStatus: 'unknown',
  warningDays: 7,
  observedAt: new Date().toISOString(),
  source: 'manual',
  reference: '',
  notes: '',
};

it('keeps payment navigation available when current records cannot load', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({}, { status: 503 })));
  render(<ServiceBillingPanel />);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.getByRole('link', { name: /Open Cloud billing/ })).toHaveAttribute(
    'href',
    'https://console.cloud.google.com/billing?project=elegant-racer-299721',
  );
  expect(
    screen
      .getAllByRole('button', { name: 'Update verified billing' })
      .every((b) => b.hasAttribute('disabled')),
  ).toBe(true);
});

it('retains the opened form revision when fresher data arrives before save', async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ records: [record] }))
    .mockResolvedValueOnce(
      Response.json({ records: [{ ...record, revision: 'newer', balance: 80 }] }),
    )
    .mockResolvedValueOnce(
      Response.json(
        { error: 'A newer billing record exists. Refresh before saving.' },
        { status: 409 },
      ),
    );
  vi.stubGlobal('fetch', request);
  render(<ServiceBillingPanel />);
  await waitFor(() => expect(screen.queryByText('Loading records…')).not.toBeInTheDocument());
  const card = screen.getByRole('heading', { name: 'Twilio', exact: true }).closest('article')!;
  fireEvent.click(within(card).getByRole('button', { name: 'Update verified billing' }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh billing' }));
  await waitFor(() => expect(within(card).getByText('$80.00')).toBeInTheDocument());
  expect(screen.getByLabelText('Available balance (USD)')).toHaveValue(12);
  fireEvent.click(screen.getByRole('button', { name: 'Save verified record' }));
  await screen.findByText('A newer billing record exists. Refresh before saving.');
  const body = JSON.parse(request.mock.calls[2][1].body);
  expect(body.expectedRevision).toBe('original');
  expect(body.record.balance).toBe(12);
});

it('reopening a refreshed service resets values with the snapshot revision', async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ records: [record] }))
    .mockResolvedValueOnce(
      Response.json({ records: [{ ...record, revision: 'newer', balance: 80 }] }),
    )
    .mockResolvedValueOnce(
      Response.json({
        record: { ...record, revision: 'saved', balance: 80 },
        alertsAvailable: true,
      }),
    );
  vi.stubGlobal('fetch', request);
  render(<ServiceBillingPanel />);
  await waitFor(() => expect(screen.queryByText('Loading records…')).not.toBeInTheDocument());
  const card = screen.getByRole('heading', { name: 'Twilio', exact: true }).closest('article')!;
  fireEvent.click(within(card).getByRole('button', { name: 'Update verified billing' }));
  fireEvent.change(screen.getByLabelText('Available balance (USD)'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh billing' }));
  await waitFor(() => expect(within(card).getByText('$80.00')).toBeInTheDocument());
  fireEvent.click(within(card).getByRole('button', { name: 'Update verified billing' }));
  expect(screen.getByLabelText('Available balance (USD)')).toHaveValue(80);
  fireEvent.click(screen.getByRole('button', { name: 'Save verified record' }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(3));
  const body = JSON.parse(request.mock.calls[2][1].body);
  expect(body.expectedRevision).toBe('newer');
  expect(body.record.balance).toBe(80);
});
it('prevents switching editors while a save is in flight', async () => {
  let finish!: (value: Response) => void;
  const request = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ records: [record] }))
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
  vi.stubGlobal('fetch', request);
  render(<ServiceBillingPanel />);
  await waitFor(() => expect(screen.queryByText('Loading records…')).not.toBeInTheDocument());
  const card = screen.getByRole('heading', { name: 'Twilio', exact: true }).closest('article')!;
  fireEvent.click(within(card).getByRole('button', { name: 'Update verified billing' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save verified record' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled());
  expect(
    screen
      .getAllByRole('button', { name: 'Update verified billing' })
      .every((b) => b.hasAttribute('disabled')),
  ).toBe(true);
  finish(Response.json({ record, alertsAvailable: true }));
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Saving…' })).not.toBeInTheDocument(),
  );
});
