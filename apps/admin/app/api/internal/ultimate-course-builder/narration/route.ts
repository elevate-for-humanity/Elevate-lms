import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  configuredNarrationProvider,
  generateEdgeTTS,
} from '@/lib/video/edge-tts';
import { uploadLessonMediaBuffer } from '@/lib/video/upload-lesson-media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

function authorized(request: NextRequest): boolean {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const allowed = [
    process.env.ULTIMATE_MEDIA_SERVICE_SECRET,
    process.env.CRON_SECRET,
  ].filter((value): value is string => Boolean(value?.trim()));
  return Boolean(bearer && allowed.some((value) => value.trim() === bearer));
}

async function measureMp3Duration(audio: Buffer): Promise<number> {
  const dir = await mkdtemp(path.join(tmpdir(), 'ultimate-narration-'));
  const file = path.join(dir, 'narration.mp3');
  try {
    await writeFile(file, audio);
    const { stdout } = await execFileAsync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        file,
      ],
      { timeout: 30_000, maxBuffer: 256 * 1024 },
    );
    const duration = Number(stdout.trim());
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('ULTIMATE_NARRATION_DURATION_INVALID');
    }
    return duration;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const lessonId = typeof body?.lessonId === 'string' ? body.lessonId.trim() : '';
  const script = typeof body?.script === 'string' ? body.script.trim() : '';
  const tone = typeof body?.tone === 'string' && body.tone.trim() ? body.tone.trim() : 'neutral-calm';
  const targetWpm = Number(body?.targetWpm ?? 135);

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
  }
  if (!script) {
    return NextResponse.json({ error: 'script is required' }, { status: 400 });
  }
  if (script.length > 80_000) {
    return NextResponse.json({ error: 'script exceeds maximum length' }, { status: 413 });
  }

  await hydrateProcessEnv();

  try {
    const audio = await generateEdgeTTS(script);
    const [audioUrl, durationSeconds] = await Promise.all([
      uploadLessonMediaBuffer(audio, `${lessonId}-ultimate-narration`, 'mp3'),
      measureMp3Duration(audio),
    ]);

    return NextResponse.json({
      provider: configuredNarrationProvider(),
      audioUrl,
      durationSeconds,
      transcript: script,
      tone,
      targetWpm: Number.isFinite(targetWpm) && targetWpm > 0 ? targetWpm : 135,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ultimate-media:narration] failed', { lessonId, message });
    return NextResponse.json(
      { error: 'Ultimate narration generation failed', code: message.slice(0, 160) },
      { status: 502 },
    );
  }
}
