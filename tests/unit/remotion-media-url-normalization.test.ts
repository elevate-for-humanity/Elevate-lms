import { describe, expect, it } from 'vitest';

import { normalizeRemotionMediaUrl } from '@/lib/video/remotion-render';

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
