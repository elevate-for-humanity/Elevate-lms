import { afterEach, describe, expect, it } from 'vitest';
import {
  buildDevStudioPreviewTargets,
  resolveDefaultPreviewUrl,
  resolvePublicSiteUrl,
} from '@/lib/devstudio/preview-config';

const ENV_KEYS = [
  'NEXT_PUBLIC_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_LMS_URL',
  'NEXT_PUBLIC_ADMIN_URL',
  'DEVSTUDIO_DEFAULT_PREVIEW_URL',
] as const;

function clearPreviewEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearPreviewEnv();
});

describe('resolvePublicSiteUrl', () => {
  it('prefers NEXT_PUBLIC_PUBLIC_SITE_URL on the admin runtime', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL = 'https://www.elevateforhumanity.org';
    expect(resolvePublicSiteUrl()).toBe('https://www.elevateforhumanity.org');
  });

  it('does not treat admin NEXT_PUBLIC_SITE_URL as the public site', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    expect(resolvePublicSiteUrl()).toBe('https://www.elevateforhumanity.org');
  });
});

describe('resolveDefaultPreviewUrl', () => {
  it('defaults to admin dashboard when Dev Studio runs on admin host', () => {
    process.env.NEXT_PUBLIC_ADMIN_URL = '';
    expect(
      resolveDefaultPreviewUrl({ requestHost: 'admin.elevateforhumanity.org' }),
    ).toBe('/admin/dashboard');
  });

  it('respects DEVSTUDIO_DEFAULT_PREVIEW_URL', () => {
    process.env.DEVSTUDIO_DEFAULT_PREVIEW_URL = 'https://www.elevateforhumanity.org/programs';
    expect(resolveDefaultPreviewUrl({ requestHost: 'admin.elevateforhumanity.org' })).toBe(
      'https://www.elevateforhumanity.org/programs',
    );
  });
});

describe('buildDevStudioPreviewTargets', () => {
  it('includes admin and public targets from env', () => {
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL = 'https://www.elevateforhumanity.org';
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.elevateforhumanity.org';
    const targets = buildDevStudioPreviewTargets();
    // Admin targets are always included
    expect(targets.some((t) => t.url.includes('/admin/dashboard'))).toBe(true);
    // Public targets are included
    expect(targets.some((t) => t.url.includes('elevateforhumanity.org/programs'))).toBe(true);
  });
});
