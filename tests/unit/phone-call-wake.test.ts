import { describe, expect, it, vi } from 'vitest';
import {
  buildCallWakeNotification,
  buildCallWakeUrl,
  callWakeCallerLabel,
  countLiveDevices,
  planCallWake,
  sendCallWakePush,
  CALL_WAKE_LIVE_WINDOW_MS,
  CALL_WAKE_VIBRATE,
} from '@/lib/phone/call-wake';

const CALL = {
  callId: '3f6b0f62-6f5d-4b9c-9f2a-1c2d3e4f5a6b',
  extension: '100',
  caller: '+13175550142',
};

/** Minimal chainable stand-in for the two tables the wake path reads. */
function fakeDb(state: { liveCount?: number; liveError?: unknown; pushEnabled?: boolean | null }) {
  const deviceFilters: Array<[string, unknown]> = [];
  const db = {
    from: (table: string) => {
      if (table === 'phone_webrtc_devices') {
        const query: any = {
          select: () => query,
          eq: (field: string, value: unknown) => {
            deviceFilters.push([field, value]);
            return query;
          },
          gte: (field: string, value: unknown) => {
            deviceFilters.push([field, value]);
            return Promise.resolve(
              state.liveError
                ? { count: null, error: state.liveError }
                : { count: state.liveCount ?? 0, error: null },
            );
          },
        };
        return query;
      }
      if (table === 'notification_preferences') {
        const query: any = {
          select: () => query,
          eq: () => query,
          maybeSingle: async () => ({
            data: state.pushEnabled === undefined ? null : { push_enabled: state.pushEnabled },
            error: null,
          }),
        };
        return query;
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
  return { db, deviceFilters };
}

describe('planCallWake targeting', () => {
  it('sends when the owner exists, the phone may ring, and nothing is live', () => {
    expect(planCallWake({ profileId: 'owner', ringMode: 'ring', liveDeviceCount: 0 })).toEqual({ send: true });
    expect(planCallWake({ profileId: 'owner', ringMode: 'vibrate', liveDeviceCount: 0 })).toEqual({ send: true });
  });

  it('never wakes an extension with no assigned owner', () => {
    expect(planCallWake({ profileId: null, ringMode: 'ring', liveDeviceCount: 0 })).toEqual({
      send: false,
      reason: 'no_recipient',
    });
  });

  it('honors ring modes that silence the phone', () => {
    for (const ringMode of ['offline', 'do_not_disturb', 'silent']) {
      expect(planCallWake({ profileId: 'owner', ringMode, liveDeviceCount: 0 })).toEqual({
        send: false,
        reason: 'ring_mode_muted',
      });
    }
  });

  it('does not double-alert when a device is already live', () => {
    expect(planCallWake({ profileId: 'owner', ringMode: 'ring', liveDeviceCount: 1 })).toEqual({
      send: false,
      reason: 'device_live',
    });
  });

  it('honors an explicit push opt-out but not a missing preference row', () => {
    expect(planCallWake({ profileId: 'owner', ringMode: 'ring', liveDeviceCount: 0, pushEnabled: false })).toEqual({
      send: false,
      reason: 'push_disabled',
    });
    expect(planCallWake({ profileId: 'owner', ringMode: 'ring', liveDeviceCount: 0, pushEnabled: null })).toEqual({
      send: true,
    });
  });
});

describe('countLiveDevices presence derivation', () => {
  it('mirrors the phone route: active asterisk device, connected, seen inside the window', async () => {
    const { db, deviceFilters } = fakeDb({ liveCount: 2 });
    const now = new Date('2026-11-25T18:40:00.000Z');
    await expect(countLiveDevices(db, 'ext-row', now)).resolves.toBe(2);
    expect(deviceFilters).toContainEqual(['extension_id', 'ext-row']);
    expect(deviceFilters).toContainEqual(['status', 'active']);
    expect(deviceFilters).toContainEqual(['provider', 'asterisk']);
    expect(deviceFilters).toContainEqual(['connection_state', 'connected']);
    expect(deviceFilters).toContainEqual([
      'last_seen_at',
      new Date(now.getTime() - CALL_WAKE_LIVE_WINDOW_MS).toISOString(),
    ]);
  });

  it('fails closed with the fixed diagnostic when presence cannot be read', async () => {
    const { db } = fakeDb({ liveError: { code: 'XX000' } });
    await expect(countLiveDevices(db, 'ext-row')).rejects.toThrow('call_wake_presence_unavailable');
  });
});

describe('call-wake notification payload', () => {
  it('builds the wake URL onto the phone page with the call identity', () => {
    const url = buildCallWakeUrl(CALL);
    expect(url.startsWith('/phone/dial-pad?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('wake')).toBe('1');
    expect(params.get('call')).toBe(CALL.callId);
    expect(params.get('from')).toBe(CALL.caller);
  });

  it('prefers the caller name, then the number, then a generic label', () => {
    expect(callWakeCallerLabel({ ...CALL, callerName: '  Jane   Doe ' })).toBe('Jane Doe');
    expect(callWakeCallerLabel(CALL)).toBe(CALL.caller);
    expect(callWakeCallerLabel({ ...CALL, caller: 'unknown' })).toBe('Unknown caller');
  });

  it('shapes a persistent, buzzing, per-call notification the SW can route', () => {
    const notification = buildCallWakeNotification({ ...CALL, callerName: 'Jane Doe' });
    expect(notification.title).toBe('Incoming call — Jane Doe');
    expect(notification.body).toContain('100');
    expect(notification.tag).toBe(`incoming-call-${CALL.callId}`);
    expect(notification.requireInteraction).toBe(true);
    expect(notification.vibrate).toEqual(CALL_WAKE_VIBRATE);
    expect(notification.url).toBe(buildCallWakeUrl(CALL));
    expect(notification.data).toEqual({
      type: 'incoming_call',
      callId: CALL.callId,
      extension: '100',
      caller: CALL.caller,
    });
  });
});

describe('sendCallWakePush orchestration', () => {
  const extension = { id: 'ext-row', profile_id: 'owner', ring_mode: 'ring' };

  it('sends exactly one wake to the owner when no device is live', async () => {
    const { db } = fakeDb({ liveCount: 0 });
    const sendPush = vi.fn(async () => 2);
    const result = await sendCallWakePush(db, extension, CALL, sendPush);
    expect(result).toEqual({ sent: true, reason: 'sent', acceptedDeviceCount: 2 });
    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(sendPush).toHaveBeenCalledWith('owner', expect.objectContaining({ tag: `incoming-call-${CALL.callId}` }));
  });

  it('skips the send entirely when a device is live', async () => {
    const { db } = fakeDb({ liveCount: 1 });
    const sendPush = vi.fn(async () => 1);
    await expect(sendCallWakePush(db, extension, CALL, sendPush)).resolves.toEqual({
      sent: false,
      reason: 'device_live',
    });
    expect(sendPush).not.toHaveBeenCalled();
  });

  it('skips muted ring modes and push opt-outs before sending', async () => {
    const sendPush = vi.fn(async () => 1);
    const muted = fakeDb({ liveCount: 0 });
    await expect(
      sendCallWakePush(muted.db, { ...extension, ring_mode: 'do_not_disturb' }, CALL, sendPush),
    ).resolves.toEqual({ sent: false, reason: 'ring_mode_muted' });
    const optedOut = fakeDb({ liveCount: 0, pushEnabled: false });
    await expect(sendCallWakePush(optedOut.db, extension, CALL, sendPush)).resolves.toEqual({
      sent: false,
      reason: 'push_disabled',
    });
    expect(sendPush).not.toHaveBeenCalled();
  });

  it('reports no_subscriptions when the provider accepts nothing, and never throws', async () => {
    const { db } = fakeDb({ liveCount: 0 });
    await expect(sendCallWakePush(db, extension, CALL, async () => 0)).resolves.toEqual({
      sent: false,
      reason: 'no_subscriptions',
    });
    await expect(
      sendCallWakePush(db, extension, CALL, async () => {
        throw new Error('provider down');
      }),
    ).resolves.toEqual({ sent: false, reason: 'no_subscriptions' });
  });

  it('short-circuits an ownerless extension without touching the database', async () => {
    const sendPush = vi.fn(async () => 1);
    await expect(
      sendCallWakePush(null, { id: 'ext-row', profile_id: null, ring_mode: 'ring' }, CALL, sendPush),
    ).resolves.toEqual({ sent: false, reason: 'no_recipient' });
    expect(sendPush).not.toHaveBeenCalled();
  });
});
