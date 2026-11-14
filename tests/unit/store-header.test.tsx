import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Header from '@/components/site/Header';
import StoreFooter from '@/components/store/StoreFooter';
import { assertStorePageChrome } from '@/scripts/gcp/store-page-contract.mjs';

afterEach(() => vi.unstubAllEnvs());

describe('standalone Store navigation', () => {
  it('passes the packaged-page contract with the real canonical Store sign-in URL', () => {
    vi.stubEnv('K_SERVICE', 'elevate-store-migration');
    const markup = renderToStaticMarkup(<><Header /><StoreFooter /></>);
    expect(() => assertStorePageChrome(markup, '/store')).not.toThrow();
  });

  it('fails the packaged-page contract when sign-in points to LMS', () => {
    vi.stubEnv('K_SERVICE', 'elevate-store-migration');
    const markup = renderToStaticMarkup(<><Header /><StoreFooter /></>);
    expect(() => assertStorePageChrome(
      markup.replace('https://store.elevateforhumanity.org/login', 'https://app.elevateforhumanity.org/login'),
      '/store',
    )).toThrow('/store must keep sign-in on Store');
  });

  it('keeps shopping and sign-in on Store without an LMS navigation dependency', () => {
    vi.stubEnv('K_SERVICE', 'elevate-store-migration');
    const markup = renderToStaticMarkup(<Header />);
    expect(markup).toContain('href="https://store.elevateforhumanity.org/login?redirect=%2Fstore"');
    for (const href of ['/store', '/store/apps', '/store/plans', '/store/cart']) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).not.toContain('app.elevateforhumanity.org');
    expect(markup).not.toContain('lms.elevateforhumanity.org');
    expect(markup).not.toContain('href="/programs"');
  });

  it('retains the public website navigation for explicit Marketing identity', () => {
    vi.stubEnv('K_SERVICE', 'elevate-marketing-migration');
    vi.stubEnv('APPLICATION_SERVICE', 'store');
    vi.stubEnv('STORE_ONLY_RUNTIME', 'true');
    const markup = renderToStaticMarkup(<Header />);
    expect(markup).toContain('href="/programs"');
    expect(markup).toContain('lms.elevateforhumanity.org/login');
  });

  it('prerenders the Store header using the validated image component', () => {
    vi.stubEnv('K_SERVICE', '');
    vi.stubEnv('STORE_ONLY_RUNTIME', '');
    vi.stubEnv('APPLICATION_SERVICE', 'store');
    expect(renderToStaticMarkup(<Header />)).toContain('aria-label="Store navigation"');
  });
});
