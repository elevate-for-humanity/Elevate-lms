import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const layout = readFileSync(resolve('apps/marketing/app/layout.tsx'), 'utf8');
const hero = readFileSync(resolve('components/home/PlatformHubHero.tsx'), 'utf8');

describe('marketing startup priority', () => {
  it('prioritizes the visible hero without preloading a below-the-fold Host Shop image', () => {
    expect(hero).toContain('priority');
    expect(layout).not.toContain(
      '<link rel="preload" as="image" href="/images/partners/salon-saloon/team-interior.webp" />',
    );
  });
});
