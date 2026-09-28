import type { UltimateNarrationPort } from '../core/ports';
import {
  configuredNarrationProvider,
  generateEdgeTTS,
} from '@/lib/video/edge-tts';
import { uploadLessonMediaBuffer } from '@/lib/video/upload-lesson-media';

export class UltimatePlatformNarration implements UltimateNarrationPort {
  async generate(input: any) {
    const script = String(
      input.script ??
        input.artifacts?.instructor_script?.script ??
        input.artifacts?.instructor_script ??
        '',
    );
    if (!script.trim()) throw new Error('ULTIMATE_NARRATION_SCRIPT_REQUIRED');
    const lessonId = String(input.lessonId ?? '').trim();
    if (!lessonId) throw new Error('ULTIMATE_NARRATION_LESSON_ID_REQUIRED');

    const provider = configuredNarrationProvider();
    const audio = await generateEdgeTTS(script);
    const audioUrl = await uploadLessonMediaBuffer(audio, lessonId, 'mp3');
    return {
      provider,
      audioBytes: audio.byteLength,
      audioUrl,
      transcript: script,
      tone: input.tone ?? 'neutral-calm',
      targetWpm: input.targetWpm ?? 135,
    };
  }
}
