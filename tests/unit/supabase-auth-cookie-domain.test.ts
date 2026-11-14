import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  resolveSupabaseAuthCookieDomain,
  withSupabaseAuthCookieDomain,
} from '@/lib/supabase/auth-cookie-domain';

describe('resolveSupabaseAuthCookieDomain', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
  });

  afterEach(() => {
    process.env = envBackup;
  });

  it('omits domain on localhost admin dev', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_ADMIN_URL = 'http://localhost:3001';
    expect(resolveSupabaseAuthCookieDomain()).toBeUndefined();
  });

  it('scopes domain in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.elevateforhumanity.org';
    process.env.NEXT_PUBLIC_ADMIN_URL = '';
    delete process.env.NEXTAUTH_URL;
    expect(resolveSupabaseAuthCookieDomain()).toBe('.elevateforhumanity.org');
  });

  it('strips domain from cookie options when local', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    const result = withSupabaseAuthCookieDomain({
      path: '/',
      domain: '.elevateforhumanity.org',
      sameSite: 'lax' as const,
    });
    expect(result).toEqual({ path: '/', sameSite: 'lax' });
  });
});
