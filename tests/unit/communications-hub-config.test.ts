import { describe, expect, it } from 'vitest';
import {
  businessHoursFromForm,
  formatUsPhone,
  normalizeUsPhone,
  parseBusinessHours,
  validMenuDigit,
} from '@/lib/phone/config';
import { communicationsKnowledgeFor } from '@/lib/paris/communications-knowledge';
import { isOpenNow, menuPrompt } from '@/lib/phone/telnyx';

describe('Communications Hub configuration', () => {
  it('normalizes US cell phones without changing ownership semantics', () => {
    expect(normalizeUsPhone('317-314-3757')).toBe('+13173143757');
    expect(normalizeUsPhone('+1 (317) 314-3757')).toBe('+13173143757');
    expect(normalizeUsPhone('555')).toBeNull();
    expect(formatUsPhone('+13173143757')).toBe('(317) 314-3757');
  });

  it('accepts menu digits from zero through nine only', () => {
    expect(validMenuDigit('0')).toBe(0);
    expect(validMenuDigit('9')).toBe(9);
    expect(validMenuDigit('10')).toBeNull();
    expect(validMenuDigit('-1')).toBeNull();
  });

  it('persists enabled business days and rejects inverted hours', () => {
    const valid = new FormData();
    valid.set('mon_enabled', 'on');
    valid.set('mon_open', '09:00');
    valid.set('mon_close', '17:00');
    expect(businessHoursFromForm(valid)).toEqual({ mon: ['09:00', '17:00'] });

    const invalid = new FormData();
    invalid.set('tue_enabled', 'on');
    invalid.set('tue_open', '17:00');
    invalid.set('tue_close', '09:00');
    expect(() => businessHoursFromForm(invalid)).toThrow(/valid opening and closing times/i);
  });

  it('ignores malformed stored business-hour values', () => {
    expect(parseBusinessHours({ mon: ['09:00', '17:00'], tue: ['bad', '17:00'] })).toEqual({
      mon: ['09:00', '17:00'],
    });
  });

  it('routes phone and meeting questions to Paris canonical guidance', () => {
    expect(communicationsKnowledgeFor('How do I forward my phone?')).toContain(
      'forwarded to the carrier-provisioned receiving number',
    );
    expect(communicationsKnowledgeFor('How do I share my screen in a meeting?')).toContain(
      'Share Screen',
    );
    expect(communicationsKnowledgeFor('Write a course outline')).toBeNull();
  });
});

describe('Telnyx routing helpers', () => {
  it('builds a spoken menu from enabled options', () => {
    expect(menuPrompt('Welcome.', [{ digit: 1, label: 'Admissions' }])).toBe(
      'Welcome. Press 1 for Admissions.',
    );
  });

  it('evaluates business hours in the configured timezone', () => {
    const hours = { mon: ['09:00', '17:00'] as [string, string] };
    expect(isOpenNow(hours, 'America/Indiana/Indianapolis', new Date('2026-09-14T15:00:00Z'))).toBe(
      true,
    );
    expect(isOpenNow(hours, 'America/Indiana/Indianapolis', new Date('2026-09-14T23:00:00Z'))).toBe(
      false,
    );
  });
});
