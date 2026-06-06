/**
 * lib/video/edge-tts.ts
 *
 * Free TTS using Microsoft Edge TTS via the `edge-tts` npm package (no API key).
 */

import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const EDGE_TTS_VOICES = {
  marcus: 'en-US-GuyNeural',
  female: 'en-US-JennyNeural',
  neutral: 'en-US-AriaNeural',
  british: 'en-GB-RyanNeural',
  warm: 'en-US-DavisNeural',
} as const;

export type EdgeTTSVoice = (typeof EDGE_TTS_VOICES)[keyof typeof EDGE_TTS_VOICES];

export interface EdgeTTSOptions {
  voice?: EdgeTTSVoice;
  rate?: string;
  pitch?: string;
  volume?: string;
}

/**
 * Generate speech from text using Edge TTS.
 * Returns a Buffer containing the MP3 audio.
 */
export async function generateEdgeTTS(text: string, options: EdgeTTSOptions = {}): Promise<Buffer> {
  const {
    voice = EDGE_TTS_VOICES.marcus,
    rate = '-5%',
    pitch = '0Hz',
    volume = '+0%',
  } = options;

  const { tts } = await import(/* turbopackIgnore: true */ 'edge-tts');

  const audioBuffer = await tts(text, {
    voice,
    rate,
    pitch,
    volume,
  });

  return Buffer.from(audioBuffer);
}

/**
 * Generate speech and write to a file path (for ffmpeg pipelines).
 */
export async function generateEdgeTTSFile(
  text: string,
  outPath: string,
  options: EdgeTTSOptions = {},
): Promise<void> {
  const buf = await generateEdgeTTS(text, options);
  await writeFile(outPath, buf);
}

export function buildLessonScript(lesson: {
  title: string;
  moduleTitle: string;
  objective: string;
  keyPoints: string[];
  example: string;
  summary: string;
}): string {
  const { title, moduleTitle, objective, keyPoints, example, summary } = lesson;

  return `
Welcome to ${moduleTitle}.

In this lesson, we'll cover: ${title}.

By the end of this lesson, you will be able to: ${objective}

Let's start with the key concepts.

${keyPoints.map((point, i) => `Point ${i + 1}: ${point}`).join('\n\n')}

Now let's look at a real-world example.

${example}

To summarize: ${summary}

Take a moment to review what you've learned, then complete the knowledge check to continue.
`.trim();
}

export function buildSegmentScripts(lesson: {
  title: string;
  moduleTitle: string;
  objective: string;
  keyPoints: string[];
  example: string;
  summary: string;
}): [string, string, string, string, string] {
  const { title, moduleTitle, objective, keyPoints, example, summary } = lesson;

  return [
    `Welcome to ${moduleTitle}. In this lesson, we'll explore: ${title}. By the end, you will be able to: ${objective}`,
    keyPoints
      .slice(0, 2)
      .map((p, i) => `Key concept ${i + 1}: ${p}`)
      .join('. '),
    keyPoints
      .slice(2)
      .map((p, i) => `Point ${i + 3}: ${p}`)
      .join('. '),
    `Here's a real-world example. ${example}`,
    `To summarize: ${summary}. Complete the knowledge check to continue.`,
  ];
}
