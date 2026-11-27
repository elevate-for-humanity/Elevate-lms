import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TenantCleaningManager } from '@/components/tenant/TenantCleaningManager';

const fetchMock = vi.fn();
const provider = {
  id: '00000000-0000-4000-8000-000000000002',
  lead_id: '00000000-0000-4000-8000-000000000001',
  name: 'Cleaning Company', email: 'provider@example.invalid',
  hourly_cents: 3500, zips: ['46204'], services: ['commercial'],
  opted_in: true, eligibility: 'pending', review_note: '', reviewRevision: 'a'.repeat(64),
};
const data = (row = provider) => ({ providers: [row], applications: [], jobs: [], membershipPayments: [], accounts: [], deliveries: [] });
const success = (value: unknown) => ({ ok: true, status: 200, json: async () => value });

beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('cleaning owner provider review', () => {
  it('shows applicant consent as read-only and prevents approval before permission exists', async () => {
    fetchMock.mockResolvedValue(success(data({ ...provider, opted_in: false })));
    render(<TenantCleaningManager />);
    await screen.findByText(/Provider email permission: Not granted/);
    expect(screen.queryByRole('checkbox', { name: /consented|job-offer emails/ })).toBeNull();
    expect((screen.getByRole('option', { name: 'Eligible after verified review' }) as HTMLOptionElement).disabled).toBe(true);
    expect((screen.getByRole('option', { name: 'Hold / suspend offers' }) as HTMLOptionElement).disabled).toBe(false);
  });

  it('submits the displayed revision and review evidence without inventing provider consent', async () => {
    fetchMock.mockResolvedValueOnce(success(data()))
      .mockResolvedValueOnce(success({ reviewed: true }))
      .mockResolvedValueOnce(success(data({ ...provider, eligibility: 'eligible', reviewRevision: 'b'.repeat(64) })));
    render(<TenantCleaningManager />);
    const save = await screen.findByRole('button', { name: 'Save review decision' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Review decision' }), { target: { value: 'eligible' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Evidence reviewed and applicable requirements' }), { target: { value: 'Reviewed the business evidence and current coverage.' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /I verified the requirements/ }));
    fireEvent.submit(save.closest('form')!);
    await screen.findByText('Action saved. Review the updated status below.');
    const payload = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(payload).toEqual({ action: 'review', id: provider.id, eligibility: 'eligible', reviewRevision: provider.reviewRevision, note: 'Reviewed the business evidence and current coverage.', verified: true });
    expect(payload).not.toHaveProperty('optedIn');
  });

  it('refreshes a stale review and resets confirmation against the new revision without a false success', async () => {
    fetchMock.mockResolvedValueOnce(success(data()))
      .mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'The provider profile changed during review. Refresh and review the current details.' }) })
      .mockResolvedValueOnce(success(data({ ...provider, hourly_cents: 3900, opted_in: false, review_note: 'Updated business evidence', reviewRevision: 'c'.repeat(64) })));
    render(<TenantCleaningManager />);
    const save = await screen.findByRole('button', { name: 'Save review decision' });
    fireEvent.change(screen.getByRole('combobox', { name: 'Review decision' }), { target: { value: 'eligible' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Evidence reviewed and applicable requirements' }), { target: { value: 'Earlier business evidence reviewed.' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /I verified the requirements/ }));
    fireEvent.submit(save.closest('form')!);
    await screen.findByText('The provider profile changed during review. Refresh and review the current details.');
    expect(screen.queryByText(/Action saved/)).toBeNull();
    expect(screen.getByText(/Provider email permission: Not granted/)).toBeTruthy();
    expect((screen.getByRole('checkbox', { name: /I verified the requirements/ }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('combobox', { name: 'Review decision' }) as HTMLSelectElement).value).toBe('suspended');
    expect((screen.getByRole('textbox', { name: 'Evidence reviewed and applicable requirements' }) as HTMLTextAreaElement).value).toBe('Updated business evidence');
    expect((screen.getByRole('option', { name: 'Eligible after verified review' }) as HTMLOptionElement).disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
