import 'server-only';

import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';

export type LiveKitReadiness = { ready: true; url: string } | { ready: false; missing: string[] };

export function liveKitReadiness(): LiveKitReadiness {
  const required = {
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  return missing.length ? { ready: false, missing } : { ready: true, url: required.LIVEKIT_URL! };
}

function credentials() {
  const readiness = liveKitReadiness();
  if ('missing' in readiness)
    throw new Error(`Meeting service is missing: ${readiness.missing.join(', ')}`);
  return {
    url: readiness.url,
    apiKey: process.env.LIVEKIT_API_KEY!,
    apiSecret: process.env.LIVEKIT_API_SECRET!,
  };
}

export async function ensureLiveKitRoom(roomName: string, maxParticipants: number) {
  const config = credentials();
  const service = new RoomServiceClient(config.url, config.apiKey, config.apiSecret);
  try {
    return await service.createRoom({
      name: roomName,
      maxParticipants,
      emptyTimeout: 10 * 60,
      departureTimeout: 60,
    });
  } catch (error: any) {
    if (
      String(error?.message || '')
        .toLowerCase()
        .includes('already exists')
    )
      return null;
    throw error;
  }
}

export async function createMeetingToken(input: {
  roomName: string;
  identity: string;
  displayName: string;
  canPublish: boolean;
  canShare: boolean;
}) {
  const config = credentials();
  const token = new AccessToken(config.apiKey, config.apiSecret, {
    identity: input.identity,
    name: input.displayName,
    ttl: '2h',
  });
  token.addGrant({
    roomJoin: true,
    room: input.roomName,
    canSubscribe: true,
    canPublish: input.canPublish,
    canPublishData: true,
    canPublishSources: input.canShare
      ? [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO]
      : [TrackSource.CAMERA, TrackSource.MICROPHONE],
  });
  return { token: await token.toJwt(), serverUrl: config.url };
}
