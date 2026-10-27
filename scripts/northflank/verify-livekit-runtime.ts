#!/usr/bin/env tsx
/**
 * Proves that the canonical Northflank runtime has usable LiveKit credentials.
 * Never prints credential values.
 */
import { RoomServiceClient } from 'livekit-server-sdk';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');
  const secretId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
  const current = await nfFetch<{
    secrets?: { variables?: Record<string, string> };
    variables?: Record<string, string>;
  }>(projectApiPath(projectId, `/secrets/${secretId}`));
  const variables = current.secrets?.variables || current.variables || {};
  const required = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'] as const;
  const missing = required.filter((key) => !variables[key]?.trim());
  if (missing.length) throw new Error(`LiveKit runtime is missing: ${missing.join(', ')}`);

  const url = variables.LIVEKIT_URL!.trim();
  const apiKey = variables.LIVEKIT_API_KEY!.trim();
  const apiSecret = variables.LIVEKIT_API_SECRET!.trim();
  const roomName = `runtime-proof-${Date.now()}`;
  const client = new RoomServiceClient(url, apiKey, apiSecret);

  await client.createRoom({ name: roomName, maxParticipants: 2, emptyTimeout: 60 });
  const rooms = await client.listRooms([roomName]);
  if (!rooms.some((room) => room.name === roomName)) {
    throw new Error('LiveKit accepted credentials but runtime proof room was not readable.');
  }
  await client.deleteRoom(roomName);

  console.log('LIVEKIT_RUNTIME_PROOF=PASS');
  console.log('LIVEKIT_URL_PRESENT=true');
  console.log('LIVEKIT_API_KEY_PRESENT=true');
  console.log('LIVEKIT_API_SECRET_PRESENT=true');
  console.log('LIVEKIT_CONTROL_PLANE_CREATE_READ_DELETE=true');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
