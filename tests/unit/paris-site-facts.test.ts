import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config/platform-config', () => ({ PLATFORM_DEFAULTS: {} }));

import { findSiteFacts, formatProgramIndex, formatSiteFacts } from '@/lib/ai/paris-site-facts';

describe('PARIS site facts', () => {
  it('matches the EPA 608 question to HVAC', () => {
    const matched = findSiteFacts('What do I need to do to get EPA 608 certified for HVAC work?');
    expect(matched.length).toBeGreaterThan(0);
    expect(matched[0].slug).toBe('hvac-technician');
  });

  it('matches a barber cost question to the barber apprenticeship', () => {
    const matched = findSiteFacts('how much is barber school and how long does it take');
    expect(matched.map((program) => program.slug)).toContain('barber-apprenticeship');
  });

  it('matches a CNA question to the CNA program', () => {
    const matched = findSiteFacts('I want to become a certified nursing assistant');
    expect(matched.map((program) => program.slug)).toContain('cna');
  });

  it('returns nothing for a question with no program words', () => {
    expect(findSiteFacts('asdf qwer zxcv')).toEqual([]);
  });

  it('formats matched facts from the registry, with the program page and price', () => {
    const matched = findSiteFacts('What do I need to do to get EPA 608 certified for HVAC work?');
    const facts = formatSiteFacts(matched);
    expect(facts).toContain('/programs/hvac-technician');
    expect(facts).toContain('$5,000');
    expect(facts).toContain('EPA 608 Universal');
    expect(facts).toContain('WIOA');
  });

  it('falls back to a catalog index that names real programs', () => {
    const index = formatProgramIndex();
    expect(index).toContain('/programs');
    expect(index).toContain('HVAC Certification');
    expect(index).toContain('CNA');
  });
});
