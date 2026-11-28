import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ programId: 'nail-technician-apprenticeship' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
vi.mock('@/components/ui/Breadcrumbs', () => ({ Breadcrumbs: () => null }));
vi.mock('@/components/programs/ProgramDepositCalculator', () => ({ default: () => null }));
import EnrollPage from '../../apps/marketing/app/enroll/[programId]/page';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('enrollment program details', () => {
  it.each([null, 0, 12])('renders nullable duration %s without an incomplete label', async weeks => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
      url.includes('/api/enroll/program/') ? { program: {
        id: 'program-id', name: 'Nail Technician Apprenticeship',
        slug: 'nail-technician-apprenticeship', duration_weeks: weeks,
        description: 'Registered competency-based apprenticeship.',
        price: 6000, total_cost: 6000, is_free: false, funding_eligible: false,
      } } : {},
    ), { status: url.includes('payment-status') ? 401 : 200 })));
    render(<EnrollPage />);
    expect(await screen.findByRole('heading', { name: 'Full Enrollment Application — Nail Technician Apprenticeship' })).toBeInTheDocument();
    if (weeks) expect(screen.getByText('Duration: 12 weeks')).toBeInTheDocument();
    else expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
    // Owner rule (2026-11-28): the funding path is chosen before any payment
    // step, so the initial button asks for that choice instead of payment.
    expect(screen.getByRole('button', { name: 'Choose a funding path to continue' })).toBeInTheDocument();
  });
});
