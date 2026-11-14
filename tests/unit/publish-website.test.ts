import { describe, expect, it } from 'vitest';
import { PUBLIC_REVALIDATE_PATHS } from '@/lib/public-revalidate-paths';

describe('publish website revalidate paths', () => {
  it('includes audit-critical Indianapolis SEO hubs', () => {
    expect(PUBLIC_REVALIDATE_PATHS).toContain('/cna-training-indianapolis');
    expect(PUBLIC_REVALIDATE_PATHS).toContain('/hvac-training-indianapolis');
    expect(PUBLIC_REVALIDATE_PATHS).toContain('/blog');
    expect(PUBLIC_REVALIDATE_PATHS).toContain('/impact/methodology');
  });

  it('has no duplicate paths', () => {
    expect(new Set(PUBLIC_REVALIDATE_PATHS).size).toBe(PUBLIC_REVALIDATE_PATHS.length);
  });
});
