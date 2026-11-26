import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const updates: Array<{ table: string; patch: Record<string, unknown> }> = [];
  const extension = {
    id: 'ext-1',
    extension: '0',
    display_name: 'Admin',
    department: 'Administration',
    ring_mode: 'ring',
    availability_source: 'manual',
    availability_schedule: null,
    ring_seconds: 25,
    voicemail_greeting: null,
    admin_external_fallback: false,
    presence_status: 'available',
    communication_workspaces: { id: 'ws-1', phone_system_id: 'sys-1' },
  };
  const db = {
    from: (table: string) => {
      let mode = 'select';
      let patch: Record<string, unknown> | null = null;
      const query: any = {
        select: () => query,
        eq: () => query,
        update: (value: Record<string, unknown>) => {
          mode = 'update';
          patch = value;
          updates.push({ table, patch: value });
          return query;
        },
        maybeSingle: async () => {
          if (table === 'communication_extensions') return { data: extension, error: null };
          if (table === 'phone_systems')
            return {
              data: {
                id: 'sys-1',
                name: 'Elevate',
                timezone: 'America/Indiana/Indianapolis',
                status: 'active',
                tenant_id: null,
              },
              error: null,
            };
          if (table === 'phone_numbers') return { data: { e164: '+14632401404' }, error: null };
          if (table === 'phone_webrtc_devices') return { data: { id: 'dev-1' }, error: null };
          return { data: null, error: null };
        },
        then: (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve),
      };
      void mode;
      void patch;
      return query;
    },
  };
  return { updates, db, deviceStatus: vi.fn() };
});

vi.mock('server-only', () => ({}));
vi.mock('@/lib/phone/actor-response', () => ({
  phoneActorResponse: async () => ({
    actor: {
      db: mocks.db,
      user: { id: 'profile-1' },
      roles: ['program_holder'],
      previewing: false,
    },
  }),
}));
vi.mock('@/lib/phone/asterisk', () => ({
  asteriskDeviceStatus: mocks.deviceStatus,
  asteriskDeviceId: (id: string) => id,
}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/phone/forwarding-policy', () => ({
  ADMIN_FORWARDING_NUMBER: '+13179562748',
  adminForwardingAllowed: () => false,
}));
vi.mock('@/lib/phone/availability', () => ({ DEFAULT_AVAILABILITY_SCHEDULE: {} }));

import { PATCH } from '@/apps/lms/app/api/program-holder/phone/route';

function heartbeatRequest() {
  return new Request('https://lms.example/api/program-holder/phone', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'heartbeat', deviceId: 'device-1234567890' }),
  });
}

function deviceUpdates() {
  return mocks.updates.filter((update) => update.table === 'phone_webrtc_devices');
}

beforeEach(() => {
  mocks.updates.length = 0;
  mocks.deviceStatus.mockReset();
});

it('preserves verified registration state when the provisioner cannot be reached', async () => {
  mocks.deviceStatus.mockRejectedValue(new Error('provisioner unavailable'));
  const response = await PATCH(heartbeatRequest());
  expect(response.status).toBe(503);
  const updates = deviceUpdates();
  // The heartbeat is recorded honestly: last_seen advances, and nothing
  // overwrites the previously verified registration/connection state.
  expect(updates).toHaveLength(1);
  expect(updates[0].patch).toHaveProperty('last_seen_at');
  expect(updates[0].patch).not.toHaveProperty('registration_state');
  expect(updates[0].patch).not.toHaveProperty('connection_state');
  expect(updates[0].patch).not.toHaveProperty('registration_verified_at');
  // Presence on the extension is not falsified either.
  expect(mocks.updates.filter((update) => update.table === 'communication_extensions')).toHaveLength(0);
});

it('records verified presence when the provisioner confirms registration', async () => {
  mocks.deviceStatus.mockResolvedValue({
    registered: true,
    connectionState: 'connected',
    observedAt: '2026-11-25T17:00:00.000Z',
  });
  const response = await PATCH(heartbeatRequest());
  expect(response.status).toBe(200);
  const updates = deviceUpdates();
  expect(updates).toHaveLength(1);
  expect(updates[0].patch).toMatchObject({
    registration_state: 'registered',
    connection_state: 'connected',
    last_seen_at: '2026-11-25T17:00:00.000Z',
    registration_verified_at: '2026-11-25T17:00:00.000Z',
  });
});

it('still records provisioner evidence that a device is not registered', async () => {
  mocks.deviceStatus.mockResolvedValue({
    registered: false,
    connectionState: 'disconnected',
    observedAt: '2026-11-25T17:00:00.000Z',
  });
  const response = await PATCH(heartbeatRequest());
  expect(response.status).toBe(409);
  const updates = deviceUpdates();
  expect(updates).toHaveLength(1);
  expect(updates[0].patch).toMatchObject({
    registration_state: 'unregistered',
    connection_state: 'disconnected',
  });
});

it('reports device_not_provisioned when the provisioner no longer holds the device', async () => {
  mocks.deviceStatus.mockResolvedValue({
    registered: false,
    connectionState: 'disconnected',
    observedAt: '2026-11-25T17:00:00.000Z',
    provisioned: false,
  });
  const response = await PATCH(heartbeatRequest());
  expect(response.status).toBe(409);
  // The distinct code tells the client a heartbeat can never succeed again
  // and it must re-provision; the evidence write itself is unchanged.
  expect(await response.json()).toMatchObject({ code: 'device_not_provisioned' });
  const updates = deviceUpdates();
  expect(updates).toHaveLength(1);
  expect(updates[0].patch).toMatchObject({
    registration_state: 'unregistered',
    connection_state: 'disconnected',
  });
});

it('does not report device_not_provisioned while the provisioner still holds the lease', async () => {
  mocks.deviceStatus.mockResolvedValue({
    registered: false,
    connectionState: 'disconnected',
    observedAt: '2026-11-25T17:00:00.000Z',
    provisioned: true,
  });
  const response = await PATCH(heartbeatRequest());
  expect(response.status).toBe(409);
  expect(await response.json()).not.toHaveProperty('code');
});
