import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('protected apprenticeship competency routes', () => {
  it('moves the complete marketing route family into the authenticated LMS', () => {
    const marketingMiddleware = readFileSync('apps/marketing/middleware.ts', 'utf8');
    const lmsMiddleware = readFileSync('apps/lms/middleware.ts', 'utf8');

    expect(marketingMiddleware).toContain("prefix: '/compliance/competency-verification'");
    expect(marketingMiddleware).toContain("destination: '/apprenticeship/compliance'");
    expect(marketingMiddleware).toContain("'X-Robots-Tag', 'noindex, nofollow, noarchive'");
    expect(lmsMiddleware).toContain("'/apprenticeship'");
  });

  it('does not advertise protected competency records in public navigation', () => {
    const footer = readFileSync('components/site/ServerFooter.tsx', 'utf8');
    const compliancePage = readFileSync('apps/marketing/app/compliance/page.tsx', 'utf8');

    expect(footer).not.toContain("href: '/compliance/competency-verification'");
    expect(compliancePage).not.toContain('href="/compliance/competency-verification"');
  });
});
