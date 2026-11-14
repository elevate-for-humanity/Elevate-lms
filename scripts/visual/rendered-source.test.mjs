import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderedSource } from './rendered-source.mjs';
test('metadata image is not a second visible picture; runtime duplicates remain', () => {
  const s = 'export const metadata = { image: "/images/a.webp" };\nconst cards = [{ image: "/images/a.webp" }];\nexport default () => <Image src="/images/a.webp" />;';
  const result = renderedSource(s, 'page.tsx');
  assert.equal((result.match(/\/images\/a.webp/g) || []).length, 2);
  assert.equal(result.split('\n').length, s.split('\n').length);
  assert.equal(result.indexOf('const cards'), s.indexOf('const cards'));
});

test('known JSON-LD image metadata is excluded while custom image components remain', async () => {
  const { withoutImageMetadata } = await import('./rendered-source.mjs');
  const s = 'import Meta from "@/components/marketing/ImageMetadata";\nconst x = <><Meta src="/images/a.webp" description="Photo"/><Image src="/images/a.webp"/><CustomImage src="/images/a.webp"/></>;';
  assert.equal((withoutImageMetadata(s, 'page.tsx').match(/\/images\/a.webp/g) || []).length, 2);
});
