import { describe, expect, it } from 'vitest';
import { formatDeliveryDisclosure } from '@/lib/programs/program-schema';

describe('formatDeliveryDisclosure', () => {
  it('resolves Elevate delivery with org name', () => {
    const text = formatDeliveryDisclosure('Elevate');
    expect(text).toContain('Elevate for Humanity');
    expect(text).not.toContain('${PLATFORM_DEFAULTS');
  });

  it('returns partner copy without placeholders', () => {
    expect(formatDeliveryDisclosure('Partner')).toBe(
      'Delivered by an approved training partner.',
    );
  });

  it('returns null when deliveredBy is omitted', () => {
    expect(formatDeliveryDisclosure(undefined)).toBeNull();
  });
});
