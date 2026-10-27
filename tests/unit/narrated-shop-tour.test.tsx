import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NarratedShopTour from '@/components/partners/NarratedShopTour';

const voice = vi.hoisted(() => ({ play: vi.fn(), pause: vi.fn(), resume: vi.fn(), stop: vi.fn(), isPaused: false, isLoading: false, isPlaying: false, error: null }));
vi.mock('@/components/voice/useNaturalVoice', () => ({ useNaturalVoice: () => voice }));
const script = 'Welcome to Salon Saloon in South Bend. Explore our styling stations and supervised cosmetology training.';

describe('shop tour narration controls', () => {
  beforeEach(() => { vi.clearAllMocks(); voice.isPaused = false; voice.isLoading = false; voice.isPlaying = false; voice.play.mockResolvedValue(true); });
  afterEach(cleanup);
  it('plays the salon-specific script from the video control', () => {
    const onPlaybackChange = vi.fn();
    render(<NarratedShopTour src="/tour.mp4" script={script} shopName="Salon Saloon" onPlaybackChange={onPlaybackChange} />);
    fireEvent.play(screen.getByLabelText('Salon Saloon narrated tour'));
    expect(voice.play).toHaveBeenCalledWith(script, expect.objectContaining({ style: 'instructor' }));
    expect(onPlaybackChange).toHaveBeenCalledWith(true);
    expect(screen.getByText(script)).toBeVisible();
  });
  it('cancels pending narration when the video is paused', () => {
    voice.isLoading = true;
    render(<NarratedShopTour src="/tour.mp4" script={script} shopName="Salon Saloon" />);
    fireEvent.pause(screen.getByLabelText('Salon Saloon narrated tour'));
    expect(voice.stop).toHaveBeenCalledOnce();
  });
  it('resumes paused narration instead of restarting the script', () => {
    voice.isPaused = true;
    render(<NarratedShopTour src="/tour.mp4" script={script} shopName="Salon Saloon" />);
    fireEvent.play(screen.getByLabelText('Salon Saloon narrated tour'));
    expect(voice.resume).toHaveBeenCalledOnce();
    expect(voice.play).not.toHaveBeenCalled();
  });
  it('keeps a short video repeating until the longer script completes', () => {
    voice.isPlaying = true;
    render(<NarratedShopTour src="/tour.mp4" script={script} shopName="Salon Saloon" />);
    expect(screen.getByLabelText('Salon Saloon narrated tour')).toHaveAttribute('loop');
    expect(screen.getByRole('status')).toHaveTextContent('The video repeats until the script finishes');
  });

});
