import { expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  role: 'admin',
  user: { id: 'authenticated-user' },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) } }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) =>
      table === 'profiles'
        ? {
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: { role: mocks.role } }) }),
            }),
          }
        : { upsert: mocks.upsert },
  }),
}));
vi.mock('@/lib/secrets', () => ({ getSecrets: async () => ({}) }));
import { PUT, registerDevice } from '@/lib/notifications/pwa-alert-api';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = 'admin';
  mocks.upsert.mockResolvedValue({ error: null });
});
it('saves only authenticated account preferences and never accepts a supplied recipient', async () => {
  const result = await PUT(
    new NextRequest('https://admin.example/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ user_id: 'someone-else', enabled: true, sound: 'voice' }),
    }),
  );
  expect(result.status).toBe(200);
  expect(mocks.upsert.mock.calls[0][0]).toMatchObject({
    user_id: 'authenticated-user',
    sound: 'voice',
  });
});
it('prevents a learner from opting into administrator student monitoring', async () => {
  mocks.role = 'student';
  const result = await PUT(
    new NextRequest('https://app.example/api/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ student_sign_in: true }),
    }),
  );
  expect(result.status).toBe(403);
  expect(mocks.upsert).not.toHaveBeenCalled();
});
it('rejects private network endpoints before storing a device subscription', async () => {
  const result = await registerDevice(
    new NextRequest('https://admin.example/api/notifications/device', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: 'https://127.0.0.1/private',
        keys: { auth: 'aaaaaaaaaaaaaaaa', p256dh: 'bbbbbbbbbbbbbbbb' },
      }),
    }),
  );
  expect(result.status).toBe(400);
  expect(mocks.upsert).not.toHaveBeenCalled();
});
