import { describe, expect, it } from 'vitest';
import {
  isExtensionReachable,
  isWithinSchedule,
  normalizeUsPhone,
} from '@/lib/phone/availability';

const mondayAtTenInIndianapolis = new Date('2026-09-21T14:00:00.000Z');

describe('program-holder PWA phone availability', () => {
  it('evaluates weekly hours in the phone-system timezone', () => {
    expect(
      isWithinSchedule(
        { mon: ['09:00', '17:00'] },
        'America/Indiana/Indianapolis',
        mondayAtTenInIndianapolis,
      ),
    ).toBe(true);
    expect(
      isWithinSchedule(
        { mon: ['11:00', '17:00'] },
        'America/Indiana/Indianapolis',
        mondayAtTenInIndianapolis,
      ),
    ).toBe(false);
  });

  it('requires an enabled, recently connected, available extension', () => {
    const current = {
      enabled: true,
      presence_status: 'available',
      ring_mode: 'ring' as const,
      availability_source: 'manual' as const,
      availability_schedule: {},
      last_presence_at: new Date(mondayAtTenInIndianapolis.getTime() - 45_000).toISOString(),
    };
    expect(
      isExtensionReachable(current, 'America/Indiana/Indianapolis', mondayAtTenInIndianapolis),
    ).toBe(true);
    expect(
      isExtensionReachable(
        { ...current, last_presence_at: new Date(mondayAtTenInIndianapolis.getTime() - 121_000).toISOString() },
        'America/Indiana/Indianapolis',
        mondayAtTenInIndianapolis,
      ),
    ).toBe(false);
    expect(
      isExtensionReachable(
        { ...current, ring_mode: 'do_not_disturb' },
        'America/Indiana/Indianapolis',
        mondayAtTenInIndianapolis,
      ),
    ).toBe(false);
  });

  it('enforces scheduled hours and normalizes US callback numbers', () => {
    expect(
      isExtensionReachable(
        {
          enabled: true,
          presence_status: 'available',
          ring_mode: 'silent',
          availability_source: 'schedule',
          availability_schedule: { mon: ['09:00', '17:00'] },
          last_presence_at: mondayAtTenInIndianapolis.toISOString(),
        },
        'America/Indiana/Indianapolis',
        mondayAtTenInIndianapolis,
      ),
    ).toBe(true);
    expect(normalizeUsPhone('(317) 760-7908')).toBe('+13177607908');
    expect(normalizeUsPhone('not a number')).toBeNull();
  });
});
