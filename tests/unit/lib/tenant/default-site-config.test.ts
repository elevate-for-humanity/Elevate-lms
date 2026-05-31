import { describe, it, expect } from 'vitest';
import { buildDefaultSiteConfig, mergeSiteConfig } from '@/lib/tenant/default-site-config';

describe('buildDefaultSiteConfig', () => {
  it('includes org name in hero and branding', () => {
    const cfg = buildDefaultSiteConfig({ organizationName: 'Acme Training' });
    expect(cfg.branding.logoText).toBe('Acme Training');
    expect(cfg.homepage.heroTitle).toContain('Acme Training');
    expect(cfg.programs.length).toBeGreaterThan(0);
    expect(cfg.navigation.some((n) => n.href === '/programs')).toBe(true);
  });
});

describe('mergeSiteConfig', () => {
  it('merges homepage fields without dropping programs', () => {
    const base = buildDefaultSiteConfig({ organizationName: 'Base' });
    const merged = mergeSiteConfig(base, {
      homepage: { heroTitle: 'Custom title' },
    });
    expect(merged.homepage.heroTitle).toBe('Custom title');
    expect(merged.programs).toEqual(base.programs);
  });
});
