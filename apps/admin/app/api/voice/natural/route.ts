import { handleNaturalVoiceRequest } from '@/lib/ai/natural-voice-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  return handleNaturalVoiceRequest(request);
}
