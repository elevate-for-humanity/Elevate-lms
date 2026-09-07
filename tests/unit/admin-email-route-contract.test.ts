import { describe, expect, it } from 'vitest';

import { adminUrl } from '@/lib/utils/url-factory';

describe('admin email route contract', () => {
  it('builds application review links on the Admin origin at its root route', () => {
    expect(adminUrl('/applications/review/application-id')).toBe(
      'https://admin.elevateforhumanity.org/applications/review/application-id',
    );
  });

  it('normalizes legacy /admin-prefixed paths instead of emitting broken links', () => {
    expect(adminUrl('/admin/applications/review/application-id')).toBe(
      'https://admin.elevateforhumanity.org/applications/review/application-id',
    );
    expect(adminUrl('/admin')).toBe('https://admin.elevateforhumanity.org/');
  });
});
