import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Header from '@/components/site/Header';

afterEach(() => vi.unstubAllEnvs());

describe('standalone Store navigation', () => {
  it('keeps shopping and sign-in on Store without an LMS navigation dependency', () => {
    vi.stubEnv('K_SERVICE', 'elevate-store-migration');
    const markup = renderToStaticMarkup(<Header />);
    expect(markup).toContain('href="https://store.elevateforhumanity.org/login?redirect=%2Fstore"');
    for (const href of ['/store', '/store/apps', '/store/plans', '/store/cart']) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).not.toContain('app.elevateforhumanity.org');
    expect(markup).not.toContain('href="/programs"');
  });

  it('retains the public website navigation for explicit Marketing identity', () => {
    vi.stubEnv('K_SERVICE', 'elevate-marketing-migration');
    vi.stubEnv('APPLICATION_SERVICE', 'store');
    vi.stubEnv('STORE_ONLY_RUNTIME', 'true');
    const markup = renderToStaticMarkup(<Header />);
    expect(markup).toContain('href="/programs"');
    expect(markup).toContain('app.elevateforhumanity.org/login');
  });

  it('prerenders the Store header using the validated image component', () => {
    vi.stubEnv('K_SERVICE', '');
    vi.stubEnv('STORE_ONLY_RUNTIME', '');
    vi.stubEnv('APPLICATION_SERVICE', 'store');
    expect(renderToStaticMarkup(<Header />)).toContain('aria-label="Store navigation"');
  });
});
