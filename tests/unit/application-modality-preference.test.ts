import { describe, expect, it } from 'vitest';
import { normalizeApplicationModalityPreference } from '@/lib/applications/modality-preference';

describe('normalizeApplicationModalityPreference', () => {
  it.each([
    ['in_person', 'in_person'],
    ['in-person', 'in_person'],
    ['In Person', 'in_person'],
    ['onsite', 'in_person'],
    ['classroom', 'in_person'],
    ['virtual', 'virtual'],
    ['online', 'virtual'],
    ['remote', 'virtual'],
    ['hybrid', 'hybrid'],
    ['blended', 'hybrid'],
  ] as const)('normalizes %s to %s', (input, expected) => {
    expect(normalizeApplicationModalityPreference(input)).toBe(expected);
  });

  it.each([null, undefined, '', '   '])('treats an absent value as null', (input) => {
    expect(normalizeApplicationModalityPreference(input)).toBeNull();
  });

  it('rejects values outside the database contract', () => {
    expect(normalizeApplicationModalityPreference('self-paced')).toBeNull();
  });
});
