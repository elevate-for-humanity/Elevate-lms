import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock('@/apps/marketing/app/tax-software/_components/TaxSecurityVerification', () => ({
  TaxSecurityVerification: () => <p>Two-step verification required</p>,
}));
import { PayrollWorkspace } from '@/apps/marketing/app/tax-software/office/payroll/PayrollWorkspace';
const company = {
  id: '22222222-2222-4222-8222-222222222222',
  office_id: 'office',
  legal_name: 'Fictional payroll client',
  frequency: 'weekly',
  version: 1,
  employees: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Fictional employee',
      reference: 'E-1',
      active: true,
      hourlyRateCents: 2500,
      frequency: 'weekly',
      w4: {
        year: 2026,
        filingStatus: 'single',
        multipleJobs: false,
        exempt: false,
        annualCreditsCents: 0,
        otherIncomeCents: 0,
        deductionsCents: 0,
        extraWithholdingCents: 0,
      },
      indiana: {
        resident: true,
        countyCode: '49',
        personalExemptions: 1,
        dependentExemptions: 0,
        firstTimeDependentExemptions: 0,
        adoptedChildExemptions: 0,
        extraStateCents: 0,
        extraCountyCents: 0,
      },
    },
  ],
};
const input = {
  periodStart: '2026-11-01',
  periodEnd: '2026-11-07',
  payDate: '2026-11-13',
  timesheetsReviewed: true,
  lines: [],
};
let saved: any;
const fetchMock = vi.fn();
beforeEach(() => {
  saved = {
    id: '33333333-3333-4333-8333-333333333333',
    status: 'draft',
    version: 1,
    input,
    calculation: {
      version: 'fixture-only',
      payDate: input.payDate,
      lines: [],
      grossCents: 100000,
      netCents: 79668,
      employeeTaxCents: 20332,
      employerFicaCents: 7650,
      paymentsSent: false,
      taxesFiled: false,
    },
  };
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, options: any) => {
    if (options?.method === 'POST') {
      const b = JSON.parse(options.body);
      expect(b.action).toBe('review_run');
      expect(b.decision).toBe('approve');
      saved = { ...saved, status: 'approved_for_export', version: 2 };
      return Response.json({ run: saved, paymentsSent: false, taxesFiled: false });
    }
    return Response.json(
      url.includes('companyId=')
        ? { company, runs: [saved] }
        : {
            companies: [company],
            offices: [{ id: 'office', office_name: 'Fictional test office' }],
          },
    );
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
async function openRun() {
  fireEvent.click(await screen.findByRole('button', { name: /Fictional payroll client/ }));
  fireEvent.click(await screen.findByRole('button', { name: /2026-11-13.*draft/ }));
}
describe('payroll workspace persisted review controls', () => {
  it('reopens a saved draft and links its exact private CSV without payment controls', async () => {
    render(<PayrollWorkspace />);
    await openRun();
    expect(screen.getByLabelText('Period starts')).toHaveValue('2026-11-01');
    expect(screen.getByRole('link', { name: 'Download payroll review CSV' })).toHaveAttribute(
      'href',
      expect.stringContaining(`companyId=${company.id}&runId=${saved.id}&download=csv`),
    );
    expect(screen.queryByRole('button', { name: /send wages|submit taxes|charge/i })).toBeNull();
    expect(
      fetchMock.mock.calls.every(([u]) => String(u).startsWith('/api/tax/office/payroll')),
    ).toBe(true);
  });
  it('persists export-only approval, retains it after reopening and never calls a provider', async () => {
    const view = render(<PayrollWorkspace />);
    await openRun();
    expect(
      screen.getByRole('button', { name: 'Save & calculate payroll draft' }),
    ).not.toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Approve for export only' }));
    await screen.findByText(
      'Approved for review export. This does not send wages or file tax returns.',
    );
    expect(screen.queryByRole('button', { name: 'Approve for export only' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Save & calculate payroll draft' })).toBeDisabled();
    view.unmount();
    render(<PayrollWorkspace />);
    fireEvent.click(await screen.findByRole('button', { name: /Fictional payroll client/ }));
    fireEvent.click(await screen.findByRole('button', { name: /2026-11-13.*approved for export/ }));
    expect(screen.getByRole('button', { name: 'Save & calculate payroll draft' })).toBeDisabled();
    expect(fetchMock.mock.calls.filter(([, o]) => o?.method === 'POST')).toHaveLength(1);
  });
  it('surfaces failed access instead of showing another company’s cached payroll', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: 'PAYROLL_OWNER_REQUIRED' }, { status: 403 }),
    );
    render(<PayrollWorkspace />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('active office-owner'));
    expect(screen.queryByText(company.legal_name)).toBeNull();
  });
});
