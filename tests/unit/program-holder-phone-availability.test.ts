import { describe, expect, it } from 'vitest';
import {
  derivePhoneDevicePresence,
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

  it('derives device presence from last-seen freshness, never the stored claim alone', () => {
    const now = mondayAtTenInIndianapolis;
    const seenSecondsAgo = (seconds: number) =>
      new Date(now.getTime() - seconds * 1000).toISOString();
    expect(
      derivePhoneDevicePresence(
        {
          registration_state: 'registered',
          connection_state: 'connected',
          last_seen_at: seenSecondsAgo(30),
        },
        now,
      ),
    ).toEqual({ registrationState: 'registered', connectionState: 'connected', live: true });
    // A handset that vanished hours ago still stores 'registered'/'connected'
    // — the derived presence must read as offline.
    expect(
      derivePhoneDevicePresence(
        {
          registration_state: 'registered',
          connection_state: 'connected',
          last_seen_at: seenSecondsAgo(3 * 60 * 60),
        },
        now,
      ),
    ).toEqual({ registrationState: 'unregistered', connectionState: 'disconnected', live: false });
    expect(
      derivePhoneDevicePresence(
        { registration_state: 'registered', connection_state: 'connected', last_seen_at: null },
        now,
      ).live,
    ).toBe(false);
    expect(
      derivePhoneDevicePresence(
        {
          registration_state: 'unregistered',
          connection_state: 'disconnected',
          last_seen_at: seenSecondsAgo(10),
        },
        now,
      ).live,
    ).toBe(false);
  });
});
