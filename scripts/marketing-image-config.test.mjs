import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import marketingConfig from '../apps/marketing/next.config.mjs';

const require = createRequire(import.meta.url);
const { getImgProps } = require('next/dist/shared/lib/get-img-props');
const { imageConfigDefault } = require('next/dist/shared/lib/image-config');
const defaultLoader = require('next/dist/shared/lib/image-loader').default;
const imgConf = { ...imageConfigDefault, ...marketingConfig.images };
const renderImage = (src, quality = 75) => getImgProps(
  { src, alt: 'Published artwork', width: 1200, height: 630, quality },
  { defaultLoader, imgConf },
).props;

test('published legacy blog artwork renders through the actual Next image loader', () => {
  const posts = readFileSync(new URL('../content/blog/durable-posts.ts', import.meta.url), 'utf8');
  const urls = [...new Set([...posts.matchAll(/"image":\s*"(https:\/\/cdn\.durable\.co\/[^"\\]+)"/g)].map(match => match[1]))];
  assert.ok(urls.some(url => url.includes('/getty-f/')), 'include the source that crashed E2E');
  for (const url of urls) {
    const image = renderImage(url);
    assert.ok(image.src.includes(encodeURIComponent(url)), `missing optimized source: ${url}`);
    assert.ok(image.srcSet.includes('w=1200'));
  }
});

test('published artwork qualities render without configuration warnings', (context) => {
  const warnings = context.mock.method(console, 'warn', () => {});
  for (const quality of [75, 85, 90, 95, 100]) {
    const image = renderImage('/images/logo.png', quality);
    assert.ok(image.src.includes(`q=${quality}`));
  }
  assert.equal(warnings.mock.callCount(), 0);
});

test('unapproved and insecure remote image sources remain rejected', () => {
  for (const url of ['https://unapproved.example/artwork.jpg', 'http://cdn.durable.co/artwork.jpg']) {
    assert.throws(() => renderImage(url), /not configured/);
  }
});
