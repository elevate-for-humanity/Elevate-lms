import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareLegacy83Config } from './prepare-legacy83-config.mjs';

test('preserves customer headers and redirects while applying the shared build preset', () => {
  const output=prepareLegacy83Config(`import type { NextConfig } from 'next';
const nextConfig: NextConfig = {output:'standalone', async headers(){return [{source:'/(.*)',headers:[{key:'X-Frame-Options',value:'SAMEORIGIN'}]}]}, async redirects(){return []}};
export default nextConfig;`);
  assert.match(output,/withBuildMemoryDefaults\(nextConfig\)/);
  assert.match(output,/SAMEORIGIN/);assert.match(output,/async redirects/);
  assert.doesNotMatch(output,/ignoreBuildErrors:\s*true/);
});
test('refuses an unfamiliar export contract',()=>assert.throws(()=>prepareLegacy83Config('export default {};'),/requires review/));
