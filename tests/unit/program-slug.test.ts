import { describe, expect, it } from 'vitest';
import { toDbSlug, toCanonicalSlug, resolveCanonicalSlug } from '@/lib/programs/slug';

describe('program slug resolver', () => {
  it('uses the verified canonical cna database slug', () => {
    expect(toDbSlug('cna')).toBe('cna');
  });

  it('maps db slug back to canonical', () => {
    expect(toCanonicalSlug('cna-cert')).toBe('cna');
  });

  it.each(['nail_technician', 'nail tech', 'nail-tech', 'manicurist', 'nails'])(
    'normalizes %s consistently for every program surface', value => {
      expect(resolveCanonicalSlug(value)).toBe('nail-technician-apprenticeship');
      expect(toDbSlug(value)).toBe('nail-technician-apprenticeship');
    },
  );
  it('resolves hvac alias to canonical slug', () => {
    expect(resolveCanonicalSlug('hvac')).toBe('hvac-technician');
  });
});

it('uses one program identity across application and host-shop entry points', async () => {
  const { normalizeHostShopProgram } = await import('@/lib/programs/host-shop-programs');
  const { getProgramApplicationConfig } = await import('@/lib/programs/application-config');
  for (const value of ['manicurist', 'nail-tech', 'nail_technician', 'nails']) {
    const canonical = resolveCanonicalSlug(value);
    expect(normalizeHostShopProgram(value)).toBe(canonical);
    expect(getProgramApplicationConfig(value)?.slug).toBe(canonical);
  }
});
