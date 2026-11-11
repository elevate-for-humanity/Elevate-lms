import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps browser CI images aligned with the locked test driver and executes every browser check', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const version = pkg.devDependencies['@playwright/test'];
  expect(pkg.devDependencies.playwright).toBe(version);
  for (const [file, jobs] of [
    ['design-repair-verification.yml', ['responsive-marketing', 'learning-workspace']],
    ['compliance-gate.yml', ['e2e-enrollment', 'accessibility']],
  ] as const) {
    const source = readFileSync(`.github/workflows/${file}`, 'utf8');
    for (const id of jobs) {
      const start = source.indexOf(`  ${id}:\n`);
      expect(start).toBeGreaterThan(-1);
      const tail = source.slice(start + 1);
      const next = tail.search(/\n  [a-z][a-z0-9-]*:\n/);
      const block = source.slice(start, next === -1 ? undefined : start + 1 + next);
      const image = block.match(/image: mcr\.microsoft\.com\/playwright:v([\d.]+)-noble@sha256:[a-f0-9]{64}/);
      expect(image?.[1]).toBe(version);
      expect(block).toContain('shell: bash');
      expect(block).toContain('node scripts/verify-playwright-runtime.mjs');
      expect(block).not.toContain('playwright install');
      expect(block).toMatch(/playwright test|node tests\/browser\/learning-workspace-layout\.mjs/);
    }
  }
});
