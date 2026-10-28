import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getBlogImage } from '../../lib/blog/images';

describe('published blog artwork', () => {
  it('preserves an explicit image over the featured image', () => {
    expect(
      getBlogImage({ image: '/images/editorial.webp', featured_image: '/images/featured.webp' }),
    ).toBe('/images/editorial.webp');
  });
  it('uses featured_image for published database rows with no legacy image', () => {
    expect(getBlogImage({ image: null, featured_image: '/images/heroes-hq/jri-hero.jpg' })).toBe(
      '/hero-images/jri-hero.webp',
    );
  });
  it('ignores empty legacy values and trims the usable source', () => {
    expect(getBlogImage({ image: '  ', featured_image: ' /images/featured.webp ' })).toBe(
      '/images/featured.webp',
    );
  });
  it.each(['jri', 'employer', 'success', 'programs', 'funding'])(
    'resolves retired %s artwork to an existing asset',
    (topic) => {
      const image = getBlogImage({ featured_image: `/images/heroes-hq/${topic}-hero.jpg` });
      expect(fs.existsSync(path.resolve('public', image.slice(1)))).toBe(true);
    },
  );
  it('uses existing local artwork if neither image field is usable', () => {
    expect(getBlogImage({ image: null, featured_image: null })).toBe(
      '/images/pages/social-media-1.webp',
    );
  });
});
