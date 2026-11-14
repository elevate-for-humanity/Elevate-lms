// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { jwtVerify } from 'jose';
import { createMeetingToken, liveKitReadiness } from '@/lib/communications/livekit';
afterEach(() => vi.unstubAllEnvs());
it.each(['http://video.example.test', 'wss://video.example.test/api', 'wss://user:password@video.example.test', 'invalid'])('rejects unsafe or non-provider endpoints: %s', url => {
  vi.stubEnv('LIVEKIT_URL', url); vi.stubEnv('LIVEKIT_API_KEY', 'key'); vi.stubEnv('LIVEKIT_API_SECRET', 'secret');
  expect(liveKitReadiness().ready).toBe(false);
});
it('normalizes HTTPS provider configuration for browser signaling', () => {
  vi.stubEnv('LIVEKIT_URL', 'https://video.example.test/'); vi.stubEnv('LIVEKIT_API_KEY', 'key'); vi.stubEnv('LIVEKIT_API_SECRET', 'secret');
  expect(liveKitReadiness()).toEqual({ ready: true, url: 'wss://video.example.test' });
});
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
