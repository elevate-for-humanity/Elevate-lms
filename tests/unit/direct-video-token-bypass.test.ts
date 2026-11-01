import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ from: vi.fn(), token: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'recipient' } } }) }, from: mock.from }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: mock.from }) }));
vi.mock('@/lib/auth/require-program-holder', () => ({ requireProgramHolder: async () => ({ mode: 'holder', user: { id: 'recipient' }, profile: {}, db: { from: mock.from } }) }));
vi.mock('@/lib/communications/livekit', () => ({ createMeetingToken: mock.token }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));
import { POST as admin } from '@/apps/admin/app/api/communications/meetings/[roomId]/token/route';
import { POST as student } from '@/apps/lms/app/api/meetings/[roomId]/token/route';
import { POST as holder } from '@/apps/lms/app/api/program-holder/meetings/[roomId]/token/route';
const room = { id: 'room', room_key: 'direct-video-private', status: 'open', host_profile_id: 'other', communication_workspaces: { tenant_id: null, status: 'active' } };
function query(data: unknown) {
  const q = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(async () => ({ data })) };
  q.select.mockReturnValue(q); q.eq.mockReturnValue(q); return q;
}
beforeEach(() => vi.resetAllMocks());
it('prevents the generic Admin meeting endpoint from bypassing direct invitations', async () => {
  mock.from.mockReturnValueOnce(query({ id: 'recipient', role: 'admin' })).mockReturnValueOnce(query(room));
  expect((await admin(new Request('https://fixture'), { params: Promise.resolve({ roomId: 'room' }) })).status).toBe(403); expect(mock.token).not.toHaveBeenCalled();
});
it('prevents the generic student meeting endpoint from joining a pending direct invitation', async () => {
  mock.from.mockReturnValueOnce(query({ id: 'participant', display_name: 'Recipient', role: 'participant', communication_rooms: room }));
  expect((await student(new Request('https://fixture'), { params: Promise.resolve({ roomId: 'room' }) })).status).toBe(403); expect(mock.token).not.toHaveBeenCalled();
});
it('prevents the generic holder endpoint from bypassing direct invitations', async () => {
  mock.from.mockReturnValueOnce(query(room)).mockReturnValueOnce(query({ id: 'participant' }));
  expect((await holder(new Request('https://fixture'), { params: Promise.resolve({ roomId: 'room' }) })).status).toBe(403); expect(mock.token).not.toHaveBeenCalled();
});
