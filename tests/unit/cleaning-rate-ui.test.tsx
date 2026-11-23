import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TenantProviderRate } from '@/components/tenant/TenantProviderRate';
import { TenantCleaningMembership } from '@/components/tenant/TenantCleaningMembership';
vi.mock('@/components/tenant/TenantPreviewContext', () => ({ useTenantRequestHeaders: () => ({}), useReadOnlyTenantPreview: () => false }));
afterEach(cleanup);
describe('cleaning provider rate selector', () => {
  it('shows the provider payment and the customer price separately', () => {
    render(<TenantProviderRate value="30" onChange={() => {}} />);
    expect(screen.getByText('$90.00')).toBeTruthy();
    expect(screen.getByText('$120.00')).toBeTruthy();
    expect(screen.getByText(/not yet have enough verified bookings/)).toBeTruthy();
    expect(screen.queryByText(/most likely to get booked/i)).toBeNull();
  });
  it('accepts provider changes through a labelled number field', () => {
    const change = vi.fn();
    render(<TenantProviderRate value="30" onChange={change} required />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '35' } });
    expect(change).toHaveBeenCalledWith('35');
    expect(screen.getByLabelText(/requested rate per cleaner-hour/)).toBeTruthy();
  });
});
describe('membership terms', () => {
  it('discloses the approved corrected plan and never claims an invoice request is payment', () => {
    render(<TenantCleaningMembership accent="#101820" />);
    expect(screen.getByText('$19.00 / month')).toBeTruthy();
    expect(screen.getByText(/Save 10%.*up to \$50/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue to secure invoice' })).toBeTruthy();
    expect(screen.getByText(/Benefits begin after payment verification/)).toBeTruthy();
  });
});
