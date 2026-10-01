import { measureNarrationCaptions } from '@/lib/video/media-quality-gate';
import type { UltimateNarrationPort } from '../core/ports';
import { configuredNarrationProvider, generateEdgeTTS } from '@/lib/video/edge-tts';
import { uploadLessonMediaBuffer } from '@/lib/video/upload-lesson-media';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const execute = promisify(execFile);
export class UltimatePlatformNarration implements UltimateNarrationPort {
  async generate(input: any) {
    const approved = input.artifacts?.instructor_script?.script?.segments;
    if (!approved?.length || !input.lessonId)
      throw new Error('ULTIMATE_APPROVED_NARRATION_SEGMENTS_REQUIRED');
    const directory = await mkdtemp(join(tmpdir(), 'ultimate-narration-'));
    try {
      const segments = [];
      for (const segment of approved) {
        const audio = await generateEdgeTTS(segment.text);
        const file = join(directory, `${segments.length}.mp3`);
        await writeFile(file, audio);
        const { stdout } = await execute('ffprobe', [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          file,
        ]);
        const durationSeconds = Number(stdout.trim());
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
          throw new Error('ULTIMATE_NARRATION_DURATION_REQUIRED');
        const audioUrl = await uploadLessonMediaBuffer(
          audio,
          `${input.lessonId}-${segment.id.replace(/[^a-zA-Z0-9-]/g, '-')}`,
          'mp3',
        );
        const captions = await measureNarrationCaptions(audio, segment.text, durationSeconds);
        segments.push({
          segmentId: segment.id,
          text: segment.text,
          audioUrl,
          durationSeconds,
          captions,
        });
      }
      return {
        provider: configuredNarrationProvider(),
        segments,
        transcript: segments.map((s) => s.text).join('\n\n'),
        durationSeconds: segments.reduce((sum, s) => sum + s.durationSeconds, 0),
      };
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
