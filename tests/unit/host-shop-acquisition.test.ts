import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('host shop acquisition architecture', () => {
  it('publishes allowlisted Indiana regional hubs in the sitemap', () => {
    const regions = readFileSync('lib/marketing/host-shop-regions.ts', 'utf8');
    const sitemap = readFileSync('apps/marketing/app/sitemap.ts', 'utf8');
    for (const city of ['indianapolis', 'fort-wayne', 'evansville', 'south-bend', 'gary', 'bloomington']) expect(regions).toContain(`slug: '${city}'`);
    expect(sitemap).toContain('HOST_SHOP_REGIONS.map');
  });

  it('uses qualified claims and tracks completed Host Site applications', () => {
    const page = readFileSync('apps/marketing/app/partners/host-shops/indiana/[city]/page.tsx', 'utf8');
    const estimator = readFileSync('components/partners/WageReimbursementEstimator.tsx', 'utf8');
    const confirmation = readFileSync('apps/marketing/app/partners/host-shop/confirmation/page.tsx', 'utf8');
    expect(page).toContain('Approval is not automatic');
    expect(estimator).toContain('WorkOne must approve');
    expect(page).not.toContain('free labor');
    expect(confirmation).toContain('HostShopApplicationConversion');
  });

  it('publishes an organic authority-blog cluster with application links', () => {
    const posts = readFileSync('content/blog/posts.ts', 'utf8');
    expect(posts).toContain('how-indianapolis-barbershops-can-build-an-apprentice-talent-pipeline');
    expect(posts).toContain('indiana-salon-owner-guide-to-workone-ojt-wage-reimbursement');
    expect(posts).toContain('booth-renters-vs-paid-apprentices-what-indiana-salon-owners-should-compare');
    expect(posts).toContain('[start the Host Site application](/partners/host-shop/apply)');
  });
});
