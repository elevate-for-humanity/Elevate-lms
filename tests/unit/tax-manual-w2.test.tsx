import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
const m = vi.hoisted(() => ({ manual: true, push: vi.fn(), fetch: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: m.push }),
  useSearchParams: () => new URLSearchParams('returnId=return-one' + (m.manual ? '&manual=1' : '')),
}));
vi.mock('@/apps/marketing/app/tax-software/_components/TaxSiteShell', () => ({
  TaxSiteShell: ({ children }: any) => <>{children}</>,
}));
import W2Page from '@/apps/marketing/app/tax-software/self-file/w2/confirm/page';
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  sessionStorage.clear();
  m.manual = true;
  vi.stubGlobal('fetch', m.fetch);
  m.fetch.mockImplementation(async (_url: string, options?: { method: string }) =>
    options?.method === 'POST'
      ? { ok: true, json: async () => ({ success: true, w2Id: 'w2' }) }
      : { ok: true, json: async () => ({ taxReturn: { filing_status: 'married_joint' } }) },
  );
});
describe('manual W-2 customer path', () => {
  it('works without an OCR import and saves the selected spouse owner', async () => {
    render(<W2Page />);
    await screen.findByRole('option', { name: 'Spouse' });
    expect(screen.queryByText(/Upload a W-2 first/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Employer EIN'), { target: { value: '12-3456789' } });
    fireEvent.change(screen.getByLabelText('Employer name'), {
      target: { value: 'Fictional employer' },
    });
    fireEvent.change(screen.getByLabelText('Box 1 wages'), { target: { value: '40000' } });
    fireEvent.change(screen.getByLabelText('Whose W-2 is this?'), { target: { value: 'spouse' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Save confirmed W-2 to return' }));
    await waitFor(() =>
      expect(m.push).toHaveBeenCalledWith('/tax-software/self-file/return?returnId=return-one'),
    );
    const post = m.fetch.mock.calls.find((c) => c[1]?.method === 'POST');
    expect(JSON.parse(post![1].body)).toMatchObject({
      returnId: 'return-one',
      incomeOwner: 'spouse',
      wages: '40000',
    });
  });
  it('does not load stale imported income from a different return', async () => {
    m.manual = false;
    sessionStorage.setItem(
      'sfc:w2-import',
      JSON.stringify({ employerName: 'Wrong return employer' }),
    );
    sessionStorage.setItem('sfc:w2-import-return-id', 'different-return');
    render(<W2Page />);
    await screen.findByText(/This import is not linked/);
    expect(screen.getByLabelText('Employer name')).toHaveValue('');
  });
});
