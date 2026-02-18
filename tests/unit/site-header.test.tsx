import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for SiteHeader component
 * Verifies that header text colors are always visible on white background
 */

describe('SiteHeader', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should have consistent text colors that are visible on white background', () => {
    // These are the expected class patterns for text on white header
    const visibleTextClasses = [
      'text-gray-900',
      'text-gray-700',
      'text-brand-blue-600',
    ];

    // Classes that would be invisible on white background
    const invisibleTextClasses = [
      'text-white',
      'text-white/90',
    ];

    // Read the SiteHeader source to verify no invisible text classes are used unconditionally
    const fs = require('fs');
    const path = require('path');
    const headerSource = fs.readFileSync(
      path.join(process.cwd(), 'components/layout/SiteHeader.tsx'),
      'utf-8'
    );

    // Check that the logo text uses visible color
    expect(headerSource).toContain('text-gray-900');
    
    // Check that phone number uses visible color (brand-blue-600 per brand token convention)
    expect(headerSource).toContain('text-gray-700 hover:text-brand-blue-600');
    
    // Verify no conditional white text on elements that should always be visible
    // The pattern "? 'text-gray-" should not be followed by white text alternatives
    const conditionalWhiteTextPattern = /\?\s*['"]text-gray-[^'"]+['"]\s*:\s*['"]text-white/;
    expect(headerSource).not.toMatch(conditionalWhiteTextPattern);
  });

  it('should not have unused state variables', () => {
    const fs = require('fs');
    const path = require('path');
    const headerSource = fs.readFileSync(
      path.join(process.cwd(), 'components/layout/SiteHeader.tsx'),
      'utf-8'
    );

    // Check that isScrolled state is not declared (was removed as unused)
    expect(headerSource).not.toContain('const [isScrolled, setIsScrolled]');
    
    // Check that mounted state is not declared (was removed as unused)
    expect(headerSource).not.toContain('const [mounted, setMounted]');
  });

  it('should have mobile menu button with visible text color', () => {
    const fs = require('fs');
    const path = require('path');
    const headerSource = fs.readFileSync(
      path.join(process.cwd(), 'components/layout/SiteHeader.tsx'),
      'utf-8'
    );

    // Mobile menu button should have gray-900 icon (visible on white)
    // The Menu icon uses text-gray-900 class
    expect(headerSource).toContain('Menu className="w-6 h-6 text-gray-900"');
  });
});
