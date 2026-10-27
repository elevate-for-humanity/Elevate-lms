import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getStaticProgram } from '@/data/programs';
import { resolveProgramFundingStatus } from '@/lib/programs/funding-visibility';
import ProgramFundingGate from '@/components/programs/ProgramFundingGate';

afterEach(cleanup);
describe('apprenticeship self-pay enrollment', () => {
  it.each(['barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship'])('publishes %s with self-pay only', (slug) => {
    const program = getStaticProgram(slug);
    expect(program).toBeDefined();
    if (!program) throw new Error('Missing canonical program');
    expect(program.fundingOptions).toEqual(['self_pay']);
    expect(program.fundingStatement).toMatch(/self-pay only/i);
    const status = resolveProgramFundingStatus(program);
    expect(status.showWorkforceFundingProcess).toBe(false);
    expect(status.isImpactFundable).toBe(false);
    expect(status.isEmployerFunded).toBe(false);
  });
  it('offers a self-pay application without funded routes in the eligibility card', () => {
    render(<ProgramFundingGate selfPayOnly programName="Barber Apprenticeship" applyHref="/programs/barber-apprenticeship/apply" selfPayCost="$4,980" depositAmount="$1,743" depositHref="/deposit" fullPayHref="/full" />);
    expect(screen.getByRole('heading', { name: 'Self-pay enrollment only' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Apply and review self-pay options' })).toHaveAttribute('href', '/programs/barber-apprenticeship/apply');
    expect(screen.queryByText(/WIOA|FSSA|Workforce Ready Grant/)).toBeNull();
  });
});
