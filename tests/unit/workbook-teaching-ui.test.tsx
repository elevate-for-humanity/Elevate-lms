// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkbookTeaching from '@/components/lms/WorkbookTeaching';
import ScenarioSimulator from '@/components/lms/ScenarioSimulator';
import { WELDING_WELD_BOOTH_SIMULATION } from '@/lib/lms/simulations/welding-simulation';

describe('WorkbookTeaching', () => {
  it('renders the diagram, instruction, worked example path, and self-check for a registered section', () => {
    render(<WorkbookTeaching slug="welding-foundations-guided-practice" number={11} />);
    expect(screen.getByText('Learn and work through the example')).toBeTruthy();
    // Diagram is in the main flow with its step labels as the accessible name.
    expect(screen.getByRole('img', { name: /Read print \+ symbols/ })).toBeTruthy();
    expect(screen.getByText(/Self-check:/)).toBeTruthy();
    expect(screen.getByText(/Instruction 1 of/)).toBeTruthy();
  });

  it('renders nothing for a workbook without authored teaching', () => {
    const { container } = render(<WorkbookTeaching slug="hvac-epa608-guided-practice" number={1} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('ScenarioSimulator', () => {
  it('renders every authored step and gates the score button until all steps are answered', () => {
    render(
      <ScenarioSimulator
        interaction={{
          id: 'welding-13-simulation',
          type: 'simulation',
          title: WELDING_WELD_BOOTH_SIMULATION.title,
          position: 'end',
          completed: false,
          attempts: 0,
          data: WELDING_WELD_BOOTH_SIMULATION,
        }}
        courseId="2bc64349-856c-41c4-a852-4ef6a309eeb6"
        lessonId="00000000-0000-0000-0000-000000000000"
      />,
    );
    expect(screen.getByText(/Step 1 — PPE and booth check/)).toBeTruthy();
    expect(screen.getByText(/Step 7 — Disposition the crack/)).toBeTruthy();
    const button = screen.getByRole('button', { name: /Complete every step to score/ });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
