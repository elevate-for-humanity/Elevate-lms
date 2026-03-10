/**
 * HeyGen API Service
 *
 * Wrapper for HeyGen v2 video generation API.
 * Supports multi-scene avatar videos with custom backgrounds.
 */

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY!;
const BASE = 'https://api.heygen.com';

/* ── helpers ─────────────────────────────────────────────────────── */

async function heygenFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': HEYGEN_API_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<any>;
}

async function heygenGet(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Api-Key': HEYGEN_API_KEY },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen GET ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<any>;
}

/* ── types ───────────────────────────────────────────────────────── */

export interface HeyGenScene {
  /** Script the avatar will speak (max 5,000 chars) */
  script: string;
  /** Avatar ID — defaults to Brandon Business Standing Front */
  avatarId?: string;
  /** Voice ID — defaults to David Boles Informative */
  voiceId?: string;
  /** Background image URL (publicly accessible) */
  backgroundUrl?: string;
  /** Background color hex (used if no backgroundUrl) */
  backgroundColor?: string;
}

export interface CreateVideoOptions {
  scenes: HeyGenScene[];
  width?: number;
  height?: number;
  /** Default avatar for all scenes (can be overridden per scene) */
  defaultAvatarId?: string;
  /** Default voice for all scenes (can be overridden per scene) */
  defaultVoiceId?: string;
}

/* ── public API ──────────────────────────────────────────────────── */

/**
 * Create a HeyGen video with one or more scenes.
 * Returns the HeyGen video_id (use pollVideo to wait for completion).
 */
export async function createVideo(options: CreateVideoOptions): Promise<string> {
  const {
    scenes,
    width = 1920,
    height = 1080,
    defaultAvatarId = 'Brandon_Business_Standing_Front_public',
    defaultVoiceId = '61ac6ff657244feb9da60288fbcfea20', // David Boles - Informative
  } = options;

  const video_inputs = scenes.map((s) => {
    const avatarId = s.avatarId || defaultAvatarId;
    const voiceId = s.voiceId || defaultVoiceId;

    let background: Record<string, unknown>;
    if (s.backgroundUrl) {
      background = { type: 'image', url: s.backgroundUrl };
    } else {
      background = { type: 'color', value: s.backgroundColor || '#0f172a' };
    }

    return {
      character: {
        type: 'avatar',
        avatar_id: avatarId,
        avatar_style: 'normal',
      },
      voice: {
        type: 'text',
        input_text: s.script,
        voice_id: voiceId,
      },
      background,
    };
  });

  const data = await heygenFetch('/v2/video/generate', {
    video_inputs,
    dimension: { width, height },
  });

  return data.data.video_id as string;
}

/**
 * Poll until the video is ready. Returns the download URL.
 */
export async function pollVideo(
  videoId: string,
  intervalMs = 15_000,
  maxWaitMs = 900_000, // 15 minutes max
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const data = await heygenGet(`/v1/video_status.get?video_id=${videoId}`);
    const status = data.data?.status;
    console.log(`  HeyGen video ${videoId}: ${status} (${Math.round((Date.now() - start) / 1000)}s elapsed)`);

    if (status === 'completed') return data.data.video_url as string;
    if (status === 'failed') {
      throw new Error(`HeyGen video ${videoId} failed: ${JSON.stringify(data.data)}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`HeyGen video ${videoId} timed out after ${maxWaitMs}ms`);
}

/**
 * Convenience: create + poll → download URL.
 */
export async function generateVideo(options: CreateVideoOptions): Promise<string> {
  const id = await createVideo(options);
  console.log(`  HeyGen video created: ${id}`);
  return pollVideo(id);
}

/**
 * Get remaining API credits in seconds.
 */
export async function getRemainingCredits(): Promise<number> {
  const data = await heygenGet('/v2/user/remaining_quota');
  return data.data?.remaining_quota ?? 0;
}
