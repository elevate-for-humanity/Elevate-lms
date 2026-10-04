import { describe, expect, it } from 'vitest';
import { directoryPages, intakeCompleted, MENU_INPUT, programDestination } from '@/lib/phone/call-flow';

describe('phone call flow', () => {
  it('accepts single-key selections without waiting for extension digits', () => {
    expect(MENU_INPUT.maximum_digits).toBe(1);
    expect(MENU_INPUT.minimum_digits).toBe(1);
    expect(MENU_INPUT.valid_digits).toContain('*');
  });
  it('reads every directory entry in bounded speech requests', () => {
    const entries = Array.from({ length: 45 }, (_, i) => ({
      extension: String(100 + i), display_name: `Person ${i}`, department: 'Program and partner services',
    }));
    const pages = directoryPages(entries);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((p) => p.length <= 500)).toBe(true);
    for (const e of entries) expect(pages.join(' ')).toContain(`${e.display_name}, ${e.department}. Extension ${e.extension.split('').join(' ')}.`);
  });
  it('announces one extension per person without a competing menu shortcut', () => {
    const legacyEntry = { extension: '103', display_name: 'Doreen Hawkins', menu_digit: 3 };
    const speech = directoryPages([legacyEntry]).join(' ');
    expect(speech).toContain('Extension 1 0 3.');
    expect(speech).not.toMatch(/or press|press 3/i);
  });
  it('never treats timeout, provider failure, or unconfirmed intake as completed', () => {
    for (const status of ['client_error', 'timeout', 'invalid', undefined]) {
      expect(intakeCompleted(status, { conversation_complete: true })).toBe(false);
    }
    expect(intakeCompleted('valid', {})).toBe(false);
    expect(intakeCompleted('valid', { conversation_complete: false })).toBe(false);
    expect(intakeCompleted('valid', { conversation_complete: true })).toBe(true);
  });
  const options = [
    { destination_id: 'technology', spoken_keywords: ['it', 'technology', 'software', 'network'] },
    { destination_id: 'beauty', spoken_keywords: ['esthetician', 'esthetics', 'cosmetology', 'nail', 'barber'] },
    { destination_id: 'hvac', spoken_keywords: ['hvac', 'heating', 'cooling'] },
  ];
  it('keeps esthetician inquiries out of technology and resolves programs from configured destinations', () => {
    expect(programDestination('Esthetician apprenticeship', options)).toBe('beauty');
    expect(programDestination('information technology', options)).toBe('technology');
    expect(programDestination('HVAC technician', options)).toBe('hvac');
    expect(programDestination('I want it explained', options)).toBeNull();
    expect(programDestination('technology or cosmetology', options)).toBeNull();
    expect(programDestination('unlisted program', options)).toBeNull();
  });
});
