import { describe, expect, it } from 'vitest';
import { toDbSlug, toCanonicalSlug, resolveCanonicalSlug } from '@/lib/programs/slug';

describe('program slug resolver', () => {
  it('maps canonical cna to db cna-cert', () => {
    expect(toDbSlug('cna')).toBe('cna-cert');
  });

  it('maps db slug back to canonical', () => {
    expect(toCanonicalSlug('cna-cert')).toBe('cna');
  });

  it('resolves hvac alias to canonical slug', () => {
    expect(resolveCanonicalSlug('hvac')).toBe('hvac-technician');
  });
});
