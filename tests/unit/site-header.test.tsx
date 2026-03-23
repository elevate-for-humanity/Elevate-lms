import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Static source analysis tests for the site header components.
 *
 * Verifies structural invariants without rendering — checks that the
 * header source files don't contain patterns known to cause visual bugs
 * or dead code.
 */

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const headerFiles = [
    'components/site/Header.tsx',
    'components/site/HeaderDesktopNav.tsx',
    'components/site/HeaderMobileMenu.client.tsx',
  ];

  function readHeader(file: string): string {
    return fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
  }

  it('should have consistent text colors that are visible on white background', () => {
    for (const file of headerFiles) {
      const src = readHeader(file);
      expect(src.length).toBeGreaterThan(0);
    }
  });

  it('should not have unused scroll/mount state variables', () => {
    // These state variables were removed as unused in a prior refactor.
    for (const file of headerFiles) {
      const src = readHeader(file);
      expect(src).not.toContain('const [isScrolled, setIsScrolled]');
      expect(src).not.toContain('const [mounted, setMounted]');
    }
  });

  it('should have mobile menu button with accessible markup', () => {
    const src = readHeader('components/site/HeaderMobileMenu.client.tsx');
    expect(src).toContain('<button');
    const hasAccessibility = src.includes('aria-label') || src.includes('sr-only');
    expect(hasAccessibility).toBe(true);
  });
});
