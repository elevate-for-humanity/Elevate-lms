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
  const barberPage = readFileSync(
    resolve(process.cwd(), 'apps/marketing/app/programs/barber-apprenticeship/page.tsx'),
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

  it('connects the Kountry Kutz hero and barber journey to scroll narration', () => {
    expect(barberPage).toContain(
      '<div data-scroll-narration data-narration={KOUNTRY_KUTZ_HERO_TRANSCRIPT}>',
    );
    expect(barberPage.match(/data-scroll-narration/g)?.length).toBeGreaterThanOrEqual(6);
  });
});
