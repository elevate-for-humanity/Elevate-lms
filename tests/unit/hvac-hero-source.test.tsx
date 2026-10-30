// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HvacLabHero } from '@/components/programs/HvacTrainingShowcase';

describe('server-rendered HVAC hero source', () => {
  it('puts the original MP4 directly on the autoplay element and buffers the complete film', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<HvacLabHero />);
    const video = root.querySelector('video');
    expect(video?.getAttribute('src')).toBe('/videos/hvac-recruitment-20261029.mp4');
    expect(video?.getAttribute('preload')).toBe('auto');
    expect(video?.querySelector('source')).toBeNull();
    for (const attribute of ['autoplay', 'muted', 'loop', 'playsinline', 'controls']) {
      expect(video?.hasAttribute(attribute), attribute).toBe(true);
    }
    expect(video?.getAttribute('poster')).toBe('/images/programs/hvac/elevate-20261029/lab-overview.webp');
    expect(video?.className).toContain('object-contain');
    expect(video?.className).not.toContain('object-cover');
  });
});
