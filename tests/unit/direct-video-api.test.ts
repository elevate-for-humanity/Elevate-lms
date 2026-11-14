import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ actor: vi.fn(), room: vi.fn(), token: vi.fn(), end: vi.fn(), from: vi.fn(), limit: vi.fn() }));
vi.mock('@/lib/phone/actor-response', () => ({ phoneActorResponse: mock.actor }));
vi.mock('@/lib/communications/livekit', () => ({ ensureLiveKitRoom: mock.room, createMeetingToken: mock.token, endLiveKitRoom: mock.end, liveKitReadiness: () => ({ ready: true }) }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mock.limit }));
import { GET, POST, PATCH, TOKEN } from '@/lib/communications/direct-video-api';
const id = '00000000-0000-4000-8000-000000000001';
const ctx = { user: { id: 'caller' }, profile: { full_name: 'Caller' }, previewing: false, extension: { workspace_id: 'workspace', display_name: 'Caller', extension: '101' }, system: { status: 'active' }, db: { from: mock.from } };
function query(data: unknown, error: unknown = null) {
  const value: Record<string, unknown> = {};
  for (const key of ['select', 'insert', 'update', 'eq', 'in', 'like', 'gte', 'limit']) value[key] = vi.fn(() => value);
  value.maybeSingle = vi.fn(async () => ({ data, error }));
  value.single = vi.fn(async () => ({ data, error }));
  value.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve);
  return value;
}
const request = (body: unknown) => new Request('https://admin.example/api/communications/video-calls', { method: 'POST', body: JSON.stringify(body) });
const params = { params: Promise.resolve({ roomId: id }) };
function scoped(status = 'accepted', roomStatus = 'open', created = new Date().toISOString()) {
  mock.from.mockReturnValueOnce(query({ invite_status: status }));
  mock.from.mockReturnValueOnce(query(roomStatus === 'open' ? { id, room_key: 'direct-video-fixture', status: roomStatus, created_at: created, host_profile_id: 'other' } : null));
}
beforeEach(() => { vi.resetAllMocks(); mock.actor.mockResolvedValue({ actor: ctx }); mock.limit.mockResolvedValue(null); mock.end.mockResolvedValue(undefined); mock.room.mockImplementation(async (name: string) => ({ name })); mock.token.mockResolvedValue({ token: 'scoped-token', serverUrl: 'wss://fixture.livekit.cloud' }); });
describe('direct extension video authorization and persistence', () => {
  it('preserves authentication failure without touching the database', async () => {
    mock.actor.mockResolvedValue({ response: Response.json({ error: 'Sign in' }, { status: 401 }) });
    expect((await GET()).status).toBe(401); expect(mock.from).not.toHaveBeenCalled();
  });
  it('rejects signed previews before provider access', async () => {
    mock.actor.mockResolvedValue({ actor: { ...ctx, previewing: true } });
    expect((await POST(request({ extension: '102' }))).status).toBe(403); expect(mock.room).not.toHaveBeenCalled();
  });
  it('rejects outside telephone numbers as video destinations', async () => {
    expect((await POST(request({ extension: '+14632401404' }))).status).toBe(400); expect(mock.from).not.toHaveBeenCalled();
  });
  it('does not create an invitation when the extension is absent from the assigned workspace', async () => {
    const q = query(null); mock.from.mockReturnValue(q);
    expect((await POST(request({ extension: '102' }))).status).toBe(409);
    expect(q.eq).toHaveBeenCalledWith('workspace_id', 'workspace'); expect(mock.room).not.toHaveBeenCalled();
  });
  function target() { mock.from.mockReturnValueOnce(query({ profile_id: 'recipient', display_name: 'Recipient', ring_mode: 'ring' })); mock.from.mockReturnValueOnce(query({ id: 'recipient', is_active: true, suspended: false })); }
  it('requires the provider to confirm the exact room identity', async () => {
    target(); mock.room.mockResolvedValue({ name: 'unrelated' });
    expect((await POST(request({ extension: '102' }))).status).toBe(503); expect(mock.from).toHaveBeenCalledTimes(2);
  });
  it('saves both explicit participants before reporting an invitation', async () => {
    target(); mock.from.mockReturnValueOnce(query({ id })); const invites = query(null); mock.from.mockReturnValueOnce(invites);
    expect((await POST(request({ extension: '102' }))).status).toBe(201);
    expect(invites.insert).toHaveBeenCalledWith([expect.objectContaining({ profile_id: 'caller', invite_status: 'accepted' }), expect.objectContaining({ profile_id: 'recipient', invite_status: 'pending' })]);
  });
  it('cancels a room when saving its invitation fails', async () => {
    target(); mock.from.mockReturnValueOnce(query({ id })).mockReturnValueOnce(query(null, { message: 'write failed' }));
    const cancelled = query(null); mock.from.mockReturnValueOnce(cancelled);
    expect((await POST(request({ extension: '102' }))).status).toBe(503); expect(cancelled.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
  });
  it.each(['pending', 'absent', 'ended'])('denies tokens for %s membership', async state => {
    if (state === 'absent') mock.from.mockReturnValueOnce(query(null)); else scoped(state === 'pending' ? 'pending' : 'accepted', state === 'ended' ? 'ended' : 'open');
    expect((await TOKEN(request({}), params)).status).toBe(403); expect(mock.token).not.toHaveBeenCalled();
  });
  it('issues a room-scoped token only after acceptance', async () => {
    scoped(); mock.from.mockReturnValueOnce(query([{ invite_status: 'accepted' }, { invite_status: 'accepted' }]));
    expect((await TOKEN(request({}), params)).status).toBe(200); expect(mock.token).toHaveBeenCalledWith(expect.objectContaining({ roomName: 'direct-video-fixture', identity: 'caller' }));
  });
  it('rejects an expired unanswered invitation', async () => {
    scoped('pending', 'open', new Date(Date.now() - 121000).toISOString());
    expect((await PATCH(request({ roomId: id, action: 'accept' }))).status).toBe(409);
  });
  it('ends the saved call and disconnects the provider room', async () => {
    scoped(); const update = query({ id }); mock.from.mockReturnValueOnce(update);
    expect((await PATCH(request({ roomId: id, action: 'end' }))).status).toBe(200);
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'ended' })); expect(mock.end).toHaveBeenCalledWith('direct-video-fixture');
  });
});
