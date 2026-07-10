/**
 * lib/video/edge-tts.ts
 *
 * Free TTS using Microsoft Edge TTS via the `edge-tts` npm package.
 * No API key required. 400+ voices. Near-ElevenLabs quality.
 *
 * Voice map for Elevate instructors:
 *   Marcus Johnson  → en-US-GuyNeural       (warm, professional male)
 *   Female default  → en-US-JennyNeural     (clear, instructional female)
 *   Neutral         → en-US-AriaNeural      (natural, conversational)
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const execFileAsync = promisify(execFile);

// ── Voice map ─────────────────────────────────────────────────────────────────

export const EDGE_TTS_VOICES = {
  marcus: 'en-US-GuyNeural',
  female: 'en-US-JennyNeural',
  neutral: 'en-US-AriaNeural',
  british: 'en-GB-RyanNeural',
  warm: 'en-US-DavisNeural',
} as const;

export type EdgeTTSVoice = (typeof EDGE_TTS_VOICES)[keyof typeof EDGE_TTS_VOICES];

// ── Options ───────────────────────────────────────────────────────────────────

export interface EdgeTTSOptions {
  voice?: EdgeTTSVoice;
  rate?: string; // e.g. '-10%' to slow down, '+5%' to speed up
  pitch?: string; // e.g. '-5Hz'
  volume?: string; // e.g. '+10%'
}

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Generate speech from text using Edge TTS.
 * Returns a Buffer containing the MP3 audio.
 */
export async function generateEdgeTTS(text: string, options: EdgeTTSOptions = {}): Promise<Buffer> {
  const {
    voice = EDGE_TTS_VOICES.marcus,
    rate = '-5%', // slightly slower for instructional content
    pitch = '0Hz',
    volume = '+0%',
  } = options;

  // Write text to temp file (handles long scripts and special chars)
  const tmpDir = await mkdtemp(join(tmpdir(), 'elevate-tts-'));
  const textFile = join(tmpDir, 'input.txt');
  const audioFile = join(tmpDir, 'output.mp3');

  try {
    await writeFile(textFile, text, 'utf8');

    // edge-tts CLI: edge-tts --voice <voice> --rate <rate> --file <input> --write-media <output>
    await execFileAsync(
      'npx',
      [
        'edge-tts',
        '--voice',
        voice,
        '--rate',
        rate,
        '--pitch',
        pitch,
        '--volume',
        volume,
        '--file',
        textFile,
        '--write-media',
        audioFile,
      ],
      {
        timeout: 60_000,
        maxBuffer: 50 * 1024 * 1024, // 50MB
      },
    );

    const audioBuffer = await readFile(audioFile);
    return audioBuffer;
  } finally {
    // Clean up temp files
    await unlink(textFile).catch(() => {});
    await unlink(audioFile).catch(() => {});
    await unlink(tmpDir).catch(() => {});
  }
}

// ── Script builder ────────────────────────────────────────────────────────────

/**
 * Build a narration script from lesson data.
 * Structured for 5-segment delivery matching the Remotion composition.
 */
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

// ── Segment-aware script builder ──────────────────────────────────────────────

/**
 * Build separate scripts for each video segment.
 * Returns 5 strings matching the 5 Remotion segments.
 */
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
    // Segment 0: Intro
    `Welcome to ${moduleTitle}. In this lesson, we'll explore: ${title}. By the end, you will be able to: ${objective}`,

    // Segment 1: Concept (key points 1-2)
    keyPoints
      .slice(0, 2)
      .map((p, i) => `Key concept ${i + 1}: ${p}`)
      .join('. '),

    // Segment 2: Visual (key points 3+)
    keyPoints
      .slice(2)
      .map((p, i) => `Point ${i + 3}: ${p}`)
      .join('. '),

    // Segment 3: Application
    `Here's a real-world example. ${example}`,

    // Segment 4: Wrap-up
    `To summarize: ${summary}. Complete the knowledge check to continue.`,
  ];
}
