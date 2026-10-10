import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TalkingDemoGuide } from '@/components/store/TalkingDemoGuide';

const stop = vi.fn();
vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ stop, play: vi.fn(), isPlaying: false, isPaused: false, isLoading: false }),
}));

describe('demo narration follows the selected workspace', () => {
  it('changes the explanation and stops old narration when a tab changes', () => {
    const steps = [{title:'Overview',narration:'Operating summary'}, {title:'Students',narration:'Search sample learners'}];
    const onStepChange = vi.fn();
    const { rerender } = render(<TalkingDemoGuide productName="Admin" steps={steps} activeIndex={0} onStepChange={onStepChange} />);
    stop.mockClear();
    rerender(<TalkingDemoGuide productName="Admin" steps={steps} activeIndex={1} onStepChange={onStepChange} />);
    expect(screen.getByText('Search sample learners')).toBeInTheDocument();
    expect(screen.queryByText('Operating summary')).not.toBeInTheDocument();
    expect(stop).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name:'Back', exact:true}));
    expect(onStepChange).toHaveBeenCalledWith(0);
  });
});
