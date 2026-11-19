import type { ReactElement } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';

describe('host shop slideshow playback', () => {
  let enterViewport: () => void = () => {};
  const renderVisible = (element: ReactElement) => {
    const result = render(element);
    act(() => enterViewport());
    return result;
  };
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
        enterViewport = () => callback([{ isIntersecting: true }]);
      }
      observe() {}
      disconnect() {}
    });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  const items = [
    { url: '/one.jpg', alt: 'First photo' },
    { url: '/two.jpg', alt: 'Second photo' },
  ];
  it('defers distant photos while retaining the loaded photo during a transition', () => {
    renderVisible(
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
    renderVisible(<HostShopMediaCarousel shopName="Shop" items={items} />);
    // Portraits and logos remain completely visible in a stable frame.
    expect(screen.getByAltText('First photo').className).toContain('object-contain');
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play slideshow' }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toBeInTheDocument();
  });
  it('does not invert a pointer click on the Pause control during focus', () => {
    renderVisible(<HostShopMediaCarousel shopName="Shop" items={items} compact />);
    const pause = screen.getByRole('button', { name: 'Pause slideshow' });
    const matches = vi.spyOn(pause, 'matches').mockReturnValue(false);
    fireEvent.focus(pause);
    matches.mockRestore();
    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
  });
  it('does not restart autoplay when the Pause control receives focus-visible before click', () => {
    renderVisible(<HostShopMediaCarousel shopName="Shop" items={items} compact />);
    const pause = screen.getByRole('button', { name: 'Pause slideshow' });
    const matches = vi.spyOn(pause, 'matches').mockReturnValue(true);
    fireEvent.focus(pause);
    matches.mockRestore();
    expect(screen.getByRole('button', { name: 'Pause slideshow' })).toBeInTheDocument();
    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
  });
  it('pauses automatic rotation on keyboard focus until explicitly restarted', () => {
    renderVisible(<HostShopMediaCarousel shopName="Shop" items={items} compact />);
    const nextButton = screen.getByRole('button', { name: 'Next image' });
    const matches = vi.spyOn(nextButton, 'matches').mockReturnValue(true);
    fireEvent.focus(nextButton);
    matches.mockRestore();
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play slideshow' }));
    expect(screen.getByRole('button', { name: 'Pause slideshow' })).toBeInTheDocument();
  });
  it('keeps the video separate from rotating photos and pauses photos during playback', () => {
    const { container } = renderVisible(
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
    renderVisible(<HostShopMediaCarousel shopName="Shop" items={items} />);
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
    renderVisible(<HostShopMediaCarousel shopName="Shop" items={items} />);
    fireEvent.load(screen.getByAltText('First photo'));
    fireEvent.error(screen.getByAltText('Second photo'));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByAltText('First photo')).toHaveStyle({ opacity: '1' });
    expect(screen.getByAltText('Second photo')).toHaveStyle({ opacity: '0' });
  });

  it('fills compact shop cards consistently while retaining a single playback control', () => {
    const { container } = renderVisible(<HostShopMediaCarousel shopName="Shop" items={items} compact />);
    const first = screen.getByAltText('First photo');
    expect(screen.getByAltText('Second photo')).toBeInTheDocument();
    fireEvent.load(first);
    expect(first.className).toContain('object-contain');
    expect(container.querySelector('[class*="aspect-[16/10]"]')).not.toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    const second = screen.getByAltText('Second photo');
    fireEvent.load(second);
    expect(second).toHaveStyle({ opacity: '1' });
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(10000));
    expect(second).toHaveStyle({ opacity: '1' });
  });
});
