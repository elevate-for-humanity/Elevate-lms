import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';

describe('host shop slideshow playback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  const items = [{url:'/one.jpg',alt:'First photo'}, {url:'/two.jpg',alt:'Second photo'}];
  it('rotates automatically, pauses, and resumes', () => {
    render(<HostShopMediaCarousel shopName="Shop" items={items} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Pause slideshow'}));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Play slideshow'}));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toBeInTheDocument();
  });
  it('does not get stuck on an unplayed video, and waits while a video plays', () => {
    const {container} = render(<HostShopMediaCarousel shopName="Shop" items={items} videoUrl="/tour.mp4" />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Previous image'}));
    fireEvent.play(container.querySelector('video')!);
    act(() => vi.advanceTimersByTime(10000));
    expect(container.querySelector('video')).not.toBeNull();
    fireEvent.ended(container.querySelector('video')!);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toBeInTheDocument();
  });
});
