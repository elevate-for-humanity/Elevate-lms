import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  downPaymentCents,
  firstWeeklyInvoiceDate,
  programInstallmentTerms,
} from '@/lib/programs/installment-terms';
import ProgramDepositCalculator from '@/components/programs/ProgramDepositCalculator';
import { useState } from 'react';
afterEach(cleanup);

describe('barber deposit and weekly plan', () => {
  it.each([
    [60000, 15104, 15088],
    [200000, 10276, 10272],
  ])('keeps the exact $4,980 total with %i cents down', (down, weekly, final) => {
    const terms = programInstallmentTerms('barber-apprenticeship', 498000, down);
    expect(terms).toMatchObject({
      downPaymentCents: down,
      cadence: 'weekly',
      installmentCents: weekly,
      installmentCount: 29,
      finalInstallmentCents: final,
    });
    expect(down + weekly * 28 + final).toBe(498000);
  });
  it('defaults to $600 and does not invent installments for full tuition or a one-cent balance', () => {
    expect(programInstallmentTerms('barber-apprenticeship', 498000).downPaymentCents).toBe(60000);
    expect(programInstallmentTerms('barber-apprenticeship', 498000, 498000).installmentCount).toBe(
      0,
    );
    expect(programInstallmentTerms('barber-apprenticeship', 498000, 497999)).toMatchObject({
      installmentCount: 1,
      finalInstallmentCents: 1,
    });
  });
  it.each([0, 59999, 498001, 60000.1, NaN, Infinity])('rejects invalid down payment %s', (down) => {
    expect(() => programInstallmentTerms('barber-apprenticeship', 498000, down)).toThrow();
  });
  it('preserves cents and rejects unsupported precision', () => {
    expect(downPaymentCents('600.01')).toBe(60001);
    expect(downPaymentCents('600.001')).toBeNaN();
    expect(downPaymentCents('')).toBeNaN();
  });
  it.each([
    ['2026-11-13T15:00:00Z', '2026-11-20'],
    ['2026-11-13T02:00:00Z', '2026-11-13'],
    ['2026-03-08T08:00:00Z', '2026-03-13'],
  ])('uses the following Indianapolis Friday from %s', (now, date) => {
    expect(firstWeeklyInvoiceDate(new Date(now))).toBe(date);
  });
  it('updates the displayed weekly amount when a learner changes the down payment', () => {
    function Calculator() {
      const [down, setDown] = useState('600');
      return (
        <ProgramDepositCalculator
          slug="barber-apprenticeship"
          tuitionCents={498000}
          value={down}
          onChange={setDown}
        />
      );
    }
    render(<Calculator />);
    expect(screen.getByText('$151.04')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2000' } });
    expect(screen.getByText('$102.76')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '599' } });
    expect(screen.getByRole('alert')).toHaveTextContent('between $600.00 and $4980.00');
  });
});
