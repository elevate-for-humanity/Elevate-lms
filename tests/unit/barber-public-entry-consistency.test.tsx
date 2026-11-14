import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getProgramPricing } from '@/lib/programs/program-pricing';
import { BARBER_PROGRAM } from '@/lib/programs/catalog';
import BarberEligibilityPage from '@/apps/marketing/app/programs/barber-apprenticeship/eligibility/page';
import BarberPaymentPlanner from '@/components/programs/beauty/BarberPaymentPlanner';
import { BeautyEnrollmentPromotion } from '@/components/promotions/BeautyEnrollmentPromotion';

vi.mock('@/components/marketing/HeroVideo', () => ({ default: () => null }));
beforeEach(() => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ program_slug: 'barber-apprenticeship', program_name: 'Barber Apprenticeship', tuition_cents: 498000, deposit_default_cents: 60000 }),
})));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('keeps both older price catalogs aligned with the standard deposit and exact balance', () => {
  expect(getProgramPricing('barber-apprenticeship')).toMatchObject({ fullPrice: 4980, depositAmount: 600 });
  expect(BARBER_PROGRAM.pricing).toMatchObject({ full_price: 4980, setup_fee_amount: 600, remaining_balance: 4380 });
});

it('lets eligibility visitors change their deposit and see the same weekly terms as checkout', async () => {
  render(BarberEligibilityPage());
  const down = await screen.findByRole('spinbutton', { name: 'Down payment calculator' });
  expect(down).toHaveValue(600);
  expect(screen.getByText('$151.04')).toBeInTheDocument();
  fireEvent.change(down, { target: { value: '2000' } });
  expect(screen.getByText('$102.76')).toBeInTheDocument();
  expect(screen.getByText('Transfer Hours Calculator')).toBeInTheDocument();
  expect(screen.queryByText(/weekly payment is fixed/i)).not.toBeInTheDocument();
});

it('keeps the older planner on the standard deposit and accepts coupon input without advertising an expired special', async () => {
  render(<BarberPaymentPlanner />);
  expect(await screen.findByRole('spinbutton', { name: 'Down payment calculator' })).toHaveValue(600);
  expect(screen.getByRole('textbox', { name: /Coupon or promotion code/i })).toBeInTheDocument();
  expect(screen.queryByText(/October enrollment special/i)).not.toBeInTheDocument();
});

it('does not advertise expired public codes while keeping admissions-issued codes available', () => {
  const { container } = render(<BeautyEnrollmentPromotion programSlug="barber-apprenticeship" />);
  expect(container).not.toHaveTextContent(/OCT300|PAYFULL600/);
  expect(screen.getByText(/Enter a code provided by admissions/i)).toBeInTheDocument();
});
