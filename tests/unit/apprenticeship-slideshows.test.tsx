import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';
import CosmetologyVisualExperience from '@/components/programs/beauty/CosmetologyVisualExperience';
import KountryKutzTourSlideshow from '@/components/programs/beauty/KountryKutzTourSlideshow';
import NailDesignShowcase from '@/components/programs/beauty/NailDesignShowcase';
vi.mock('@/components/voice/useNaturalVoice', () => ({stopAllNaturalVoicePlayback:vi.fn()}));
describe('apprenticeship slideshow rotation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {cleanup();vi.useRealTimers();});
  it('advances cosmetology photographs', () => {
    render(<CosmetologyVisualExperience />);
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByText('2 / 4')).toBeInTheDocument();
  });
  it('advances the barber photo tour', () => {
    const {container}=render(<KountryKutzTourSlideshow />);
    const photos=()=>container.querySelectorAll('img[aria-hidden="false"]');
    const first=photos()[0]?.getAttribute('src');
    act(() => vi.advanceTimersByTime(6000));
    expect(photos()[0]?.getAttribute('src')).not.toBe(first);
  });
  it('advances nail designs', () => {
    const {container}=render(<NailDesignShowcase program="nail-technician" />);
    const first=container.querySelector('img[aria-hidden="false"]')?.getAttribute('src');
    act(() => vi.advanceTimersByTime(6500));
    expect(container.querySelector('img[aria-hidden="false"]')?.getAttribute('src')).not.toBe(first);
  });
  it('continues past unplayed tours and resumes after a complete tour', () => {
    const shops=[{slug:'test',name:'Test salon',city:'City',state:'IN',zip:'00000',address:'Test',programs:['cosmetology-apprenticeship']}];
    const mediaSequence=[{shopSlug:'test',media:{src:'/tour.mp4',alt:'Tour',kind:'video' as const}},{shopSlug:'test',media:{src:'/photo.jpg',alt:'Salon photo',kind:'photo' as const}}];
    const {container}=render(<HostShopShowcase shops={shops} mediaSequence={mediaSequence} />);
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByAltText('Salon photo')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    fireEvent.play(container.querySelector('video')!);
    act(() => vi.advanceTimersByTime(12000));
    expect(container.querySelector('video')).not.toBeNull();
    fireEvent.ended(container.querySelector('video')!);
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByAltText('Salon photo')).toBeInTheDocument();
  });
});
