import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('public SEO entity contract', () => {
  const nextConfig = read('next.config.mjs');
  const homepageSchema = read('components/StructuredData.tsx');
  const sharedSchema = read('components/seo/StructuredData.tsx');
  const organization = read('lib/config/organization.ts');
  const footer = read('components/site-footer.tsx');

  it('does not block AI discovery on production public pages', () => {
    expect(nextConfig).not.toContain("value: 'noai, noimageai'");
    expect(nextConfig).toContain("value: 'noindex, nofollow, noarchive'");
  });

  it('uses the canonical organization address in every active schema helper', () => {
    expect(organization).toContain('postalAddress:');
    expect(homepageSchema).toContain('...organization.postalAddress');
    expect(sharedSchema.match(/\.\.\.organization\.postalAddress/g)).toHaveLength(3);
    expect(sharedSchema).not.toContain('6331 N Keystone Ave');
  });

  it('does not emit unsupported or unverified organization claims', () => {
    expect(homepageSchema).toContain("shop.businessType === 'BarberShop' ? 'HairSalon'");
    expect(homepageSchema).not.toContain('parentOrganization:');
    expect(sharedSchema).not.toContain('foundingDate:');
    expect(footer).not.toContain('Supersonic Fast Cash');
  });
});
