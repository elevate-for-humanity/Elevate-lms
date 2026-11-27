import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// #2855 blocker (2026-11-26): an approved Host Shop with no database-sourced
// public phone must still show the verified curated public number on its
// direct profile — otherwise the shop (e.g. B-52's) loses its Call button.
const page = readFileSync('apps/marketing/app/host-shops/[slug]/page.tsx', 'utf8');
const network = readFileSync('lib/programs/host-shop-network.ts', 'utf8');
const loader = readFileSync('lib/programs/host-shops.ts', 'utf8');

describe('host shop direct profile phone', () => {
  it('direct profile falls back to the network-resolved curated number', () => {
    expect(page).toContain("phone: approvedRecord.phone || entry.phone || ''");
  });

  it('network resolves curated featured phone before public profile phone', () => {
    expect(network).toContain(
      'phone: featured?.phone || shop.phone || publicProfile?.phone || undefined',
    );
  });

  it('database-sourced public phone stays primary in the loader enrichment', () => {
    expect(loader).toContain('phone: sourceVerifiedPublicPhone');
    expect(loader).toContain(
      'profile?.phone && (profile.source_url || profile.website_url || profile.website)',
    );
  });

  it('application contact numbers are never published as the shop phone', () => {
    // The enriched application-backed entries replace the intake number with
    // the source-verified public number (or nothing).
    const enrichment = loader.slice(loader.indexOf('const applicationBacked'));
    expect(enrichment).toContain('phone: sourceVerifiedPublicPhone');
    expect(enrichment).not.toContain('phone: shop.contact_phone');
    expect(enrichment).not.toContain('phone: shop.phone ??');
  });
});
