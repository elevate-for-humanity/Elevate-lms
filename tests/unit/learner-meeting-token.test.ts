// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { jwtVerify } from 'jose';
import { createMeetingToken } from '@/lib/communications/livekit';
afterEach(() => vi.unstubAllEnvs());
it('issues a signed room token allowing camera, microphone, and permitted screen sharing', async () => {
  vi.stubEnv('LIVEKIT_URL', 'wss://meeting.example.test');
  vi.stubEnv('LIVEKIT_API_KEY', 'test-key');
  vi.stubEnv('LIVEKIT_API_SECRET', 'test-secret-for-room-token-validation');
  const result = await createMeetingToken({
    roomName: 'assigned-room',
    identity: 'assigned-student',
    displayName: 'Student',
    canPublish: true,
    canShare: true,
  });
  const { payload } = await jwtVerify(
    result.token,
    new TextEncoder().encode('test-secret-for-room-token-validation'),
  );
  expect(payload.sub).toBe('assigned-student');
  expect(payload.video).toMatchObject({
    room: 'assigned-room',
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  expect((payload.video as { canPublishSources: string[] }).canPublishSources).toEqual(
    expect.arrayContaining(['camera', 'microphone', 'screen_share', 'screen_share_audio']),
  );
});
it('preserves viewer restrictions instead of granting presentation access', async () => {
  vi.stubEnv('LIVEKIT_URL', 'wss://meeting.example.test');
  vi.stubEnv('LIVEKIT_API_KEY', 'test-key');
  vi.stubEnv('LIVEKIT_API_SECRET', 'test-secret-for-room-token-validation');
  const result = await createMeetingToken({
    roomName: 'assigned-room',
    identity: 'viewer',
    displayName: 'Viewer',
    canPublish: false,
    canShare: false,
  });
  const { payload } = await jwtVerify(
    result.token,
    new TextEncoder().encode('test-secret-for-room-token-validation'),
  );
  expect(payload.video).toMatchObject({ canPublish: false });
  expect((payload.video as { canPublishSources: string[] }).canPublishSources).not.toContain(
    'screen_share',
  );
});
