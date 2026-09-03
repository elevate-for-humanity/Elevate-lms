import { describe, expect, it } from 'vitest';

import { getProgramPaymentOptions } from '@/components/programs/ProgramApplyForm';

describe('program payment options', () => {
  it('keeps public workforce sources off self-pay program forms', () => {
    const labels = getProgramPaymentOptions(['self_pay']).map((option) => option.label);

    expect(labels).not.toContain('WIOA / WorkOne');
    expect(labels).not.toContain('Workforce Ready Grant');
    expect(labels).toContain('Self-Pay');
  });

  it('shows WIOA without WRG for Business Administration and Financial Literacy', () => {
    const labels = getProgramPaymentOptions(['wioa', 'self_pay']).map((option) => option.label);

    expect(labels).toContain('WIOA / WorkOne');
    expect(labels).not.toContain('Workforce Ready Grant');
  });

  it('shows both verified sources for CDL and HVAC', () => {
    const labels = getProgramPaymentOptions(['wioa', 'wrg', 'self_pay']).map(
      (option) => option.label,
    );

    expect(labels).toContain('WIOA / WorkOne');
    expect(labels).toContain('Workforce Ready Grant');
  });
});
