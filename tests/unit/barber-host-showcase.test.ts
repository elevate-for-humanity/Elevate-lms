import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('barber host-shop showcase', () => {
  const showcase = readFileSync(
    resolve(process.cwd(), 'components/programs/beauty/HostShopShowcase.tsx'),
    'utf8',
  );
  const partners = readFileSync(
    resolve(process.cwd(), 'components/programs/beauty/FeaturedHostPartners.tsx'),
    'utf8',
  );

  it('renders one foreground video without a duplicate poster backdrop', () => {
    const videoBranch = showcase.slice(
      showcase.indexOf("image?.kind === 'video'"),
      showcase.indexOf("image && !failedImages.has(image.src)"),
    );
    expect(videoBranch).toContain('<video');
    expect(videoBranch).not.toContain('<Image');
  });

  it('does not run page narration over the narrated Razor video', () => {
    expect(partners).toContain("enableNarration={programSlug !== 'barber-apprenticeship'}");
    expect(showcase).toContain('data-scroll-narration={enableNarration ? true : undefined}');
  });
});
