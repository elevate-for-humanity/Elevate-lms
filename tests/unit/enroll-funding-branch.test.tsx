import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Pins the funding branch on the shared /enroll/[programId] page (owner rule,
// 2026-11-28): a deposit may be asked ONLY of self-paying applicants. The
// branch renders for every priced program — it is not HVAC-specific.

let programId = 'business-administration';
vi.mock('next/navigation', () => ({
  useParams: () => ({ programId }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
vi.mock('@/components/ui/Breadcrumbs', () => ({ Breadcrumbs: () => null }));
vi.mock('@/components/programs/ProgramDepositCalculator', () => ({ default: () => null }));
import EnrollPage from '../../apps/marketing/app/enroll/[programId]/page';

const PROGRAMS: Record<string, any> = {
  'business-administration': { id: 'prog-biz', name: 'Business Management', slug: 'business-administration', duration_weeks: 5, description: 'Business fundamentals.', price: 4900, total_cost: 4900, is_free: false, funding_eligible: false, requires_license: false },
  'barber-apprenticeship': { id: 'prog-barber', name: 'Barber Apprenticeship', slug: 'barber-apprenticeship', duration_weeks: 50, description: 'Registered apprenticeship.', price: 4980, total_cost: 4980, is_free: false, funding_eligible: false, requires_license: false },
  'hvac-technician': { id: 'prog-hvac', name: 'HVAC Technician', slug: 'hvac-technician', duration_weeks: 24, description: 'HVAC training.', price: 5000, total_cost: 5000, is_free: false, funding_eligible: true, requires_license: false },
};

function stubFetch() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
    url.includes('/api/enroll/program/') ? { program: PROGRAMS[programId] } : {},
  ), { status: url.includes('payment-status') ? 401 : 200 })));
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('enroll page funding branch (shared component)', () => {
  it.each(['business-administration', 'hvac-technician', 'barber-apprenticeship'])(
    'asks for a funding path before any payment UI on %s',
    async (slug) => {
      programId = slug;
      stubFetch();
      render(<EnrollPage />);
      expect(await screen.findByText('How will you fund this program?')).toBeInTheDocument();
      expect(screen.queryByText('How would you like to pay?')).not.toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Workforce funding/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Employer sponsored/ })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /Self-pay/ })).toBeInTheDocument();
      // Funding-eligible programs (HVAC) default to the funded checkout, so
      // their button stays "Complete Enrollment"; every other priced program
      // waits for an explicit funding choice.
      if (slug === 'hvac-technician') expect(screen.getByRole('button', { name: /Complete Enrollment/ })).toBeInTheDocument();
      else expect(screen.getByRole('button', { name: /Choose a funding path to continue/ })).toBeInTheDocument();
    },
  );

  it('shows the payment UI only after self-pay is chosen', async () => {
    programId = 'business-administration';
    stubFetch();
    render(<EnrollPage />);
    fireEvent.click(await screen.findByRole('radio', { name: /Self-pay/ }));
    expect(await screen.findByText('How would you like to pay?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue to Secure Payment/ })).toBeInTheDocument();
    expect(screen.queryByText('No deposit required')).not.toBeInTheDocument();
  });

  it('funded path shows no payment UI and offers the Admissions-review application', async () => {
    programId = 'business-administration';
    stubFetch();
    render(<EnrollPage />);
    fireEvent.click(await screen.findByRole('radio', { name: /Workforce funding/ }));
    expect(await screen.findByText('No deposit required')).toBeInTheDocument();
    expect(screen.queryByText('How would you like to pay?')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Continue to funded application/ }).length).toBeGreaterThan(0);
  });

  it('employer sponsorship is also a no-deposit path', async () => {
    programId = 'hvac-technician';
    stubFetch();
    render(<EnrollPage />);
    fireEvent.click(await screen.findByRole('radio', { name: /Employer sponsored/ }));
    expect(await screen.findByText('No deposit required')).toBeInTheDocument();
    expect(screen.queryByText('How would you like to pay?')).not.toBeInTheDocument();
  });
});
