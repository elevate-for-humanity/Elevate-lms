import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';

describe('host shop slideshow playback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });
  const items = [
    { url: '/one.jpg', alt: 'First photo' },
    { url: '/two.jpg', alt: 'Second photo' },
  ];
  it('defers distant photos while retaining the loaded photo during a transition', () => {
    render(
      <HostShopMediaCarousel
        shopName="Shop"
        items={[
          ...items,
          { url: '/three.jpg', alt: 'Third photo' },
          { url: '/four.jpg', alt: 'Fourth photo' },
        ]}
      />,
    );
    const first = screen.getByAltText('First photo');
    fireEvent.load(first);
    expect(screen.queryByAltText('Third photo')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Fourth photo')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(first).toBeInTheDocument();
    expect(screen.getByAltText('Third photo')).toBeInTheDocument();
    expect(screen.queryByAltText('Fourth photo')).not.toBeInTheDocument();
    fireEvent.load(screen.getByAltText('Second photo'));
    expect(screen.queryByAltText('First photo')).not.toBeInTheDocument();
  });
  it('rotates automatically, pauses, and resumes', () => {
    render(<HostShopMediaCarousel shopName="Shop" items={items} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play slideshow' }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toBeInTheDocument();
  });
  it('keeps the video separate from rotating photos and pauses photos during playback', () => {
    const { container } = render(
      <HostShopMediaCarousel shopName="Shop" items={items} videoUrl="/tour.mp4" />,
    );
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    const video = container.querySelector('video')!;
    fireEvent.play(container.querySelector('video')!);
    act(() => vi.advanceTimersByTime(10000));
    expect(container.querySelector('video')).toBe(video);
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.ended(container.querySelector('video')!);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toBeInTheDocument();
  });
  it('keeps the decoded first picture visible until the next one is ready', () => {
    render(<HostShopMediaCarousel shopName="Shop" items={items} />);
    const first = screen.getByAltText('First photo');
    const second = screen.getByAltText('Second photo');
    fireEvent.load(first);
    act(() => vi.advanceTimersByTime(5000));
    expect(first).toHaveStyle({ opacity: '1' });
    expect(second).toHaveStyle({ opacity: '0' });
    fireEvent.load(second);
    expect(second).toHaveStyle({ opacity: '1' });
    expect(first).toHaveStyle({ opacity: '0' });
  });
  it('keeps a working photo when a later shop photo fails', () => {
    render(<HostShopMediaCarousel shopName="Shop" items={items} />);
    fireEvent.load(screen.getByAltText('First photo'));
    fireEvent.error(screen.getByAltText('Second photo'));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toHaveStyle({ opacity: '1' });
    expect(screen.getByAltText('Second photo')).toHaveStyle({ opacity: '0' });
  });

  it('provides compact shop cards with a single playback control and uncropped photos', () => {
    const { container } = render(<HostShopMediaCarousel shopName="Shop" items={items} compact />);
    const first = screen.getByAltText('First photo');
    const second = screen.getByAltText('Second photo');
    fireEvent.load(first);
    fireEvent.load(second);
    expect(first.className).toContain('object-contain');
    expect(container.querySelector('.max-h-\\[160px\\]')).not.toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(second).toHaveStyle({ opacity: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    act(() => vi.advanceTimersByTime(10000));
    expect(second).toHaveStyle({ opacity: '1' });
  });
});
