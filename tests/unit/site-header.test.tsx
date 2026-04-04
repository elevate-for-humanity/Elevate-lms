/**
 * Static analysis tests for the site Header component.
 * Reads the source file and verifies structural requirements.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Header lives at components/site/Header.tsx
const headerPath = path.resolve('components/site/Header.tsx');
const src = fs.readFileSync(headerPath, 'utf-8');

describe('SiteHeader', () => {
  it('file exists and has a default export', () => {
    expect(fs.existsSync(headerPath)).toBe(true);
    expect(src).toContain('export default');
  });

  it('renders a nav element', () => {
    expect(src).toContain('nav');
  });

  it('has mobile menu support via HeaderMobileMenu', () => {
    expect(src).toContain('HeaderMobileMenu');
  });

  it('has auth-aware links (login)', () => {
    expect(src).toContain('login');
  });
});
