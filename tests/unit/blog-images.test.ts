import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DURABLE_POSTS } from '../../content/blog/durable-posts';
import { getBlogCardImage, getBlogImage } from '../../lib/blog/images';

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

it('serves an existing WebP thumbnail for every archived Getty card and retains the original article photo', () => {
  for (const post of DURABLE_POSTS.filter(post => post.image?.startsWith('https://cdn.durable.co/getty/') && post.image.endsWith('.jpeg'))) {
    const original = getBlogImage(post);
    const card = getBlogCardImage(original);
    expect(original).toBe(post.image);
    expect(card).toMatch(/^\/images\/blog-cards\/[A-Za-z0-9_-]+\.webp$/);
    const bytes = fs.readFileSync(path.resolve('public', card.slice(1)));
    expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
    expect(bytes.length).toBeLessThan(200_000);
  }
  const custom='https://cdn.durable.co/getty/new-artwork.jpeg';
  expect(getBlogCardImage(custom)).toBe(custom);
  expect(getBlogCardImage('/images/editorial.webp')).toBe('/images/editorial.webp');
});
