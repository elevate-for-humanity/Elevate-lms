import type { UltimateNarrationPort } from '../core/ports';
import { callUltimateMediaService } from './platform-media-service';

type NarrationResult = {
  provider: string;
  audioUrl: string;
  durationSeconds: number;
  transcript: string;
  tone: string;
  targetWpm: number;
};

export class UltimatePlatformNarration implements UltimateNarrationPort {
  async generate(input: any) {
    const script = String(
      input.script ??
        input.artifacts?.instructor_script?.script ??
        input.artifacts?.instructor_script ??
        '',
    );
    if (!script.trim()) throw new Error('ULTIMATE_NARRATION_SCRIPT_REQUIRED');

    return callUltimateMediaService<NarrationResult>(
      '/api/internal/ultimate-course-builder/narration',
      {
        lessonId: String(input.lessonId ?? ''),
        script,
        tone: input.tone ?? 'neutral-calm',
        targetWpm: input.targetWpm ?? 135,
      },
      Number(process.env.ULTIMATE_NARRATION_TIMEOUT_MS ?? 300_000),
    );
  }
}
