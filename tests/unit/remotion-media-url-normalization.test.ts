import { describe, expect, it } from 'vitest';

import { normalizeRemotionMediaUrl, normalizeSlideLessonScenes } from '@/lib/video/remotion-render';

describe('normalizeRemotionMediaUrl', () => {
  it('keeps valid remote URL strings', () => {
    expect(normalizeRemotionMediaUrl('https://cdn.example.com/scene.jpg')).toBe(
      'https://cdn.example.com/scene.jpg',
    );
  });

  it('unwraps common provider response objects', () => {
    expect(normalizeRemotionMediaUrl({ url: 'https://cdn.example.com/scene.jpg' })).toBe(
      'https://cdn.example.com/scene.jpg',
    );
    expect(normalizeRemotionMediaUrl({ src: 'https://cdn.example.com/clip.mp4' })).toBe(
      'https://cdn.example.com/clip.mp4',
    );
  });

  it('rejects objects and unsafe or malformed values', () => {
    expect(normalizeRemotionMediaUrl({ unexpected: 'value' })).toBeNull();
    expect(normalizeRemotionMediaUrl('[object Object]')).toBeNull();
    expect(normalizeRemotionMediaUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('normalizeSlideLessonScenes', () => {
  it('sanitizes every final media prop after provider and storage resolution', () => {
    const [scene] = normalizeSlideLessonScenes([
      {
        id: 'scene-1',
        title: 'Clean boundaries',
        narration: 'Explain the procedure.',
        durationFrames: 90,
        clipUrl: { url: 'https://cdn.example.com/clip.mp4' } as unknown as string,
        imageUrl: '[object Object]',
        audioSrc: { src: 'https://cdn.example.com/narration.mp3' } as unknown as string,
      },
    ]);

    expect(scene.clipUrl).toBe('https://cdn.example.com/clip.mp4');
    expect(scene.imageUrl).toBeNull();
    expect(scene.audioSrc).toBe('https://cdn.example.com/narration.mp3');
  });
});
