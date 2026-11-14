'use client';
import { PlatformVideoRoom } from '@/components/communications/PlatformVideoRoom';

export function MeetingRoom({ roomId, allowScreenShare = true }: { roomId: string; allowScreenShare?: boolean }) {
  return <PlatformVideoRoom tokenEndpoint={`/api/communications/meetings/${roomId}/token`} allowScreenShare={allowScreenShare} />;
}
