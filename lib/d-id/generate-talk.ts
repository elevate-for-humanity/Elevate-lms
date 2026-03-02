/**
 * D-ID Talks API integration.
 * Generates a lip-synced talking-head video from a photo + audio source.
 *
 * Usage:
 *   import { createTalk, pollTalkResult } from '@/lib/d-id/generate-talk';
 *   const { id } = await createTalk({ photoUrl, audioUrl });
 *   const result = await pollTalkResult(id);
 *   // result.result_url → MP4 download URL
 *
 * Requires DID_API_KEY environment variable.
 * D-ID API docs: https://docs.d-id.com/reference/create-a-talk
 */

import { logger } from '@/lib/logger';

const DID_API_BASE = 'https://api.d-id.com';

function getApiKey(): string {
  const key = process.env.DID_API_KEY;
  if (!key) throw new Error('DID_API_KEY is not set');
  return key;
}

function headers() {
  return {
    Authorization: `Basic ${getApiKey()}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export interface CreateTalkParams {
  /** Public URL to a front-facing photo (JPEG/PNG, min 256x256) */
  photoUrl: string;
  /** Public URL to an audio file (MP3/WAV/M4A) */
  audioUrl: string;
  /** Optional: driver expression (e.g. 'subtle', 'expressive') */
  expression?: string;
}

export interface TalkResponse {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  error?: { kind: string; description: string };
}

const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];

/**
 * Create a D-ID talk (async — returns an ID to poll).
 * Rejects video URLs — D-ID Talks requires an audio track, not a video file.
 */
export async function createTalk(params: CreateTalkParams): Promise<TalkResponse> {
  const audioPath = new URL(params.audioUrl).pathname.toLowerCase();
  const hasValidExt = ALLOWED_AUDIO_EXTENSIONS.some((ext) => audioPath.endsWith(ext));
  if (!hasValidExt) {
    throw new Error(
      `audioUrl must be an audio file (${ALLOWED_AUDIO_EXTENSIONS.join(', ')}), got: ${audioPath}. ` +
      `Extract audio from video first: ffmpeg -i input.mp4 -vn -acodec libmp3lame -ab 192k output.mp3`
    );
  }

  const body = {
    source_url: params.photoUrl,
    script: {
      type: 'audio',
      audio_url: params.audioUrl,
    },
    config: {
      stitch: true,
      result_format: 'mp4',
    },
  };

  const res = await fetch(`${DID_API_BASE}/talks`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error('D-ID createTalk failed', { status: res.status, body: err });
    throw new Error(`D-ID API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  logger.info('D-ID talk created', { id: data.id, status: data.status });
  return data;
}

/**
 * Poll a D-ID talk until it completes or fails.
 * Returns the final result with result_url (MP4).
 */
export async function pollTalkResult(
  talkId: string,
  maxAttempts = 60,
  intervalMs = 5000
): Promise<TalkResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${DID_API_BASE}/talks/${talkId}`, {
      headers: headers(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`D-ID poll error ${res.status}: ${err}`);
    }

    const data: TalkResponse = await res.json();

    if (data.status === 'done') {
      logger.info('D-ID talk complete', { id: talkId, result_url: data.result_url });
      return data;
    }

    if (data.status === 'error') {
      logger.error('D-ID talk failed', { id: talkId, error: data.error });
      throw new Error(`D-ID talk failed: ${data.error?.description || 'Unknown error'}`);
    }

    // Still processing — wait and retry
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`D-ID talk ${talkId} timed out after ${maxAttempts * intervalMs / 1000}s`);
}
