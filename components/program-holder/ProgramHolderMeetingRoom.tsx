'use client';
import { PlatformVideoRoom } from '@/components/communications/PlatformVideoRoom';

export function ProgramHolderMeetingRoom({ roomId, tokenEndpoint = `/api/program-holder/meetings/${roomId}/token` }: { roomId: string; tokenEndpoint?: string }) {
  return <PlatformVideoRoom tokenEndpoint={tokenEndpoint} />;
}
