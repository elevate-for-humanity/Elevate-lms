import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StoreDemoAdvisor from '@/components/store/StoreDemoAdvisor';

vi.mock('@/components/paris/ParisChat', () => ({
  default: ({ voiceEnabled }: { voiceEnabled: boolean }) => (
    <div data-testid="demo-advisor" data-autoplay={String(voiceEnabled)}>
      Advisor ready
    </div>
  ),
}));
afterEach(cleanup);

describe('store demo advisor is requested by the visitor', () => {
  it('does not mount or start voice on arrival and unmounts when closed', async () => {
    const { container } = render(<StoreDemoAdvisor label="Admin Dashboard" />);
    expect(screen.queryByTestId('demo-advisor')).not.toBeInTheDocument();
    const details = container.querySelector('details')!;
    act(() => {
      details.open = true;
      fireEvent(details, new Event('toggle'));
    });
    expect(await screen.findByTestId('demo-advisor')).toHaveAttribute('data-autoplay', 'false');
    act(() => {
      details.open = false;
      fireEvent(details, new Event('toggle'));
    });
    expect(screen.queryByTestId('demo-advisor')).not.toBeInTheDocument();
  });
});
