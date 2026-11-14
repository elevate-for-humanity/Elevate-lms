// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HvacTrainingShowcase, { HvacLabHero, HvacProgramFilm } from '@/components/programs/HvacTrainingShowcase';

describe('server-rendered HVAC hero source', () => {
  it('connects the homepage feature to the program, official WorkOne signup and existing orientation', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<HvacTrainingShowcase compact />);
    expect(root.querySelector('video, #hvac-program-film')).toBeNull();
    expect(root.querySelector('h2')).toHaveTextContent('HVAC');
    expect(root.querySelector('a[href="/programs/hvac-technician"]')).toHaveTextContent(
      'View HVAC program',
    );
    const workone = root.querySelector(
      'a[href="https://workoneindy.as.me/schedule/e8f310c0/appointment/91381838"]',
    );
    expect(workone).toHaveTextContent('Sign up to see if you qualify');
    expect(workone).toHaveAttribute('rel', 'noopener noreferrer');
    expect(root.querySelector('a[href="/onboarding/learner/orientation"]')).toHaveTextContent(
      'Complete your orientation',
    );
  });
  it('keeps the film on the dedicated HVAC program page', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<HvacTrainingShowcase />);
    expect(root.querySelector('#hvac-program-film video')).toHaveAttribute(
      'src', '/videos/hvac-recruitment-20261029.mp4',
    );
  });
  it('uses a full-width photo banner with a link to the in-page film', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<HvacLabHero />);
    expect(root.querySelector('video')).toBeNull();
    expect(root.querySelector('img')?.getAttribute('src')).toContain('hvac-training-vibrant-2026.webp');
    expect(root.querySelector('img')?.className).toContain('object-cover');
    expect(root.querySelector('a')?.getAttribute('href')).toBe('#hvac-program-film');
  });

  it('keeps the complete portrait film in its own naturally sized player', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<HvacProgramFilm />);
    const video = root.querySelector('video');
    expect(root.querySelector('#hvac-program-film')).not.toBeNull();
    expect(video?.getAttribute('src')).toBe('/videos/hvac-recruitment-20261029.mp4');
    expect(video?.getAttribute('preload')).toBe('metadata');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('playsinline');
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('width', '720');
    expect(video).toHaveAttribute('height', '900');
    expect(video?.className).toContain('h-auto');
    expect(video?.className).not.toContain('max-h-');
  });
});
