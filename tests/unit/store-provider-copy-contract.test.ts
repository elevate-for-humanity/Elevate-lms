import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');

describe('Store billing-provider copy', () => {
  it('does not advertise retired Stripe checkout in active Store catalogs', () => {
    const catalogs = [
      'lib/data/store-products.ts',
      'apps/marketing/app/data/store-products.ts',
      'lib/store/implementation-packages.ts',
    ].map(source);

    for (const catalog of catalogs) {
      expect(catalog).not.toMatch(/Stripe (?:integration|payment|payments)/);
    }
  });

  it('describes the implemented invoice and verified-payment boundary accurately', () => {
    const licensingGuide = source('apps/marketing/app/store/guides/licensing/page.tsx');
    const starterTrial = source(
      'apps/marketing/app/store/licenses/starter-license/trial/page.tsx',
    );

    expect(licensingGuide).toContain(
      'QuickBooks invoice creation and verified-payment entitlement handling',
    );
    expect(licensingGuide).not.toContain('QuickBooks-invoice checkout');
    expect(starterTrial).toContain('License purchase creates a QuickBooks invoice');
    expect(starterTrial).not.toContain('Cancel anytime');
  });
});
