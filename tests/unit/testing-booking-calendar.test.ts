import { describe, expect, it } from 'vitest';
import { testingAppointmentLabel, testingCalendarUrl, validTestingReference } from '../../lib/testing/booking-calendar';

describe('paid testing calendar details', () => {
  it('uses the Indianapolis appointment time regardless of the browser time zone', () => {
    expect(testingAppointmentLabel('2026-10-12T14:30:00Z')).toContain('10:30 AM Eastern Time');
    expect(testingAppointmentLabel('2026-11-07T15:30:00Z')).toContain('10:30 AM Eastern Time');
  });
  it('preserves the reserved start and end across daylight saving time', () => {
    const url = new URL(testingCalendarUrl({ examName:'EPA 608', confirmationCode:'A&B', start:'2026-11-07T15:30:00Z', end:'2026-11-07T18:00:00Z', location:'120 E. Market St.' }));
    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20261107T153000Z/20261107T180000Z');
    expect(url.searchParams.get('ctz')).toBe('America/New_York');
    expect(url.searchParams.get('details')).toContain('A&B');
  });
  it('rejects guessable provider IDs and email-only booking lookups', () => {
    expect(validTestingReference('42')).toBe(false);
    expect(validTestingReference('student@example.com')).toBe(false);
    expect(validTestingReference('b55dc7d7-56d9-4b6b-8de9-68069a29746a')).toBe(true);
  });
});
