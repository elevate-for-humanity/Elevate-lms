import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StorePlatformDemos from '@/components/store/StorePlatformDemos';

let pause: ReturnType<typeof vi.spyOn>;
beforeEach(() => { pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('store narrated product demos', () => {
  it('switches media, caption track, product destination and transcript together, pausing the previous video', () => {
    const { container } = render(<StorePlatformDemos />);
    expect(container.querySelector('source')).toHaveAttribute('src', '/videos/store-platform/website-builder.mp4');
    fireEvent.click(screen.getByRole('button', { name: 'Watch Meet Your AI Support Team' }));
    expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector('source')).toHaveAttribute('src', '/videos/store-platform/ai-assistants.mp4');
    expect(container.querySelector('track')).toHaveAttribute('src', '/videos/store-platform/ai-assistants.vtt');
    expect(screen.getByRole('link', { name: /Explore this product/ })).toHaveAttribute('href', '/store/ai-assistants');
    expect(screen.getByRole('link', { name: 'Download transcript' })).toHaveAttribute('href', '/videos/store-platform/ai-assistants-transcript.txt');
    expect(screen.getByRole('button', { name: 'Watch Meet Your AI Support Team' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Watch Speak It. Build It. Grow Your Business.' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('offers a usable transcript and download on media failure and clears the error when selecting another tour', () => {
    const { container } = render(<StorePlatformDemos />);
    fireEvent.error(container.querySelector('video')!);
    expect(screen.getByRole('alert')).toHaveTextContent('could not load');
    expect(screen.getByRole('link', { name: 'Download video' })).toHaveAttribute('href', '/videos/store-platform/website-builder.mp4');
    expect(screen.getByText(/What if your next business website started/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Watch Choose Your Plan Without Paying for Everything' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Compare plans/ })).toHaveAttribute('href', '/store/plans');
  });
});
