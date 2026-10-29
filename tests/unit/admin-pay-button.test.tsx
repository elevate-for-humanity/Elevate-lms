import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApprovePayButton from '@/apps/admin/app/payout-queue/ApprovePayButton';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Admin payment controls', () => {
  it('hands QuickBooks payments to QuickBooks instead of claiming a bank transfer', () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    render(<ApprovePayButton enrollmentId="enrollment" amount={1867.50} holderName="Partner" qbConnected provider="quickbooks" />);
    expect(screen.getByRole('link', { name: /Pay in QuickBooks/ }).getAttribute('href')).toBe('https://qbo.intuit.com/app/contractors');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('does not offer PayPal payment without an amount', () => {
    render(<ApprovePayButton enrollmentId="enrollment" qbConnected provider="paypal" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Approved payout schedule required')).toBeTruthy();
  });
  it('requires confirmation and sends the reviewed amount; submission is not marked paid', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ released: true }) });
    vi.stubGlobal('fetch', fetcher);
    render(<ApprovePayButton enrollmentId="enrollment" amount={1867.50} holderName="Partner" qbConnected provider="paypal" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pay with PayPal' }));
    await waitFor(() => expect(screen.getByText('Submitted — awaiting confirmation')).toBeTruthy());
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ enrollment_id: 'enrollment', expected_amount_cents: 186750 });
    expect(screen.queryByText('Paid')).toBeNull();
  });
});
