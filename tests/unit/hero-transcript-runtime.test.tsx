import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HeroPicture from '@/components/marketing/HeroPicture';
import HeroVideo from '@/components/marketing/HeroVideo';

vi.mock('@/components/video/CanonicalVideo', () => ({
  default: ({ src, poster, className }: { src: string; poster?: string; className?: string }) => (
    <video data-testid="canonical-video" src={src} poster={poster} className={className} />
  ),
}));

describe('marketing hero transcript runtime behavior', () => {
  it('renders HeroPicture brand bug without leaking source comments into the DOM', () => {
    render(
      <HeroPicture
        src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp"
        alt="Training classroom"
        showBrandBug
        transcript="A still image transcript."
      />,
    );

    expect(screen.queryByText(/IMAGE-CONTRACT/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /image transcript/i })).toBeInTheDocument();
  });

  it('keeps one native poster owner while video is available', () => {
    const poster = '/images/heroes/hero-homepage.webp';
    const { container } = render(
      <HeroVideo
        videoSrcDesktop="/videos/hero.mp4"
        posterImage={poster}
      />,
    );

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('poster', poster);

    expect(container.querySelector(`[style*="${poster}"]`)).toBeNull();
  });

  it('mounts an exact first frame beneath video without a native poster', () => {
    const firstFrame = '/images/heroes/hero-home-first-frame.webp';
    const { container } = render(
      <HeroVideo
        videoSrcDesktop="/videos/hero.mp4"
        posterImage="/images/heroes/unrelated-poster.webp"
        mountedFrameImage={firstFrame}
      />,
    );

    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).not.toHaveAttribute('poster');
    expect(container.querySelector(`[style*="${firstFrame}"]`)).not.toBeNull();
  });

  it('toggles the HeroVideo transcript without throwing at runtime', () => {
    render(
      <HeroVideo
        videoSrcDesktop="/videos/hero.mp4"
        posterImage="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/heroes/hero-homepage.webp"
        transcript="A video transcript."
      />,
    );

    const transcriptButton = screen.getByRole('button', { name: /video transcript/i });
    expect(transcriptButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('A video transcript.')).not.toBeInTheDocument();

    fireEvent.click(transcriptButton);

    expect(transcriptButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('A video transcript.')).toBeInTheDocument();
  });
});
