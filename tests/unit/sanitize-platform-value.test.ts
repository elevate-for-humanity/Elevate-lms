import { describe, expect, it } from 'vitest';
import {
  isPlatformPlaceholderString,
  programHeroImageAlt,
  sanitizePlatformValue,
} from '@/lib/config/sanitize-platform-value';

describe('sanitizePlatformValue', () => {
  it('rejects literal PLATFORM_DEFAULTS placeholders', () => {
    expect(isPlatformPlaceholderString('{PLATFORM_DEFAULTS.orgName}')).toBe(true);
    expect(isPlatformPlaceholderString('${PLATFORM_DEFAULTS.orgName}')).toBe(true);
    expect(sanitizePlatformValue('{PLATFORM_DEFAULTS.orgName}', 'Fallback Org')).toBe(
      'Fallback Org',
    );
  });

  it('keeps real org names', () => {
    expect(sanitizePlatformValue('Elevate for Humanity', 'Fallback')).toBe('Elevate for Humanity');
  });

  it('builds program hero alt without placeholders', () => {
    const alt = programHeroImageAlt('HVAC', '{PLATFORM_DEFAULTS.orgName}');
    expect(alt).toBe('HVAC training at Elevate for Humanity');
    expect(alt).not.toMatch(/PLATFORM_DEFAULTS/);
  });
});
