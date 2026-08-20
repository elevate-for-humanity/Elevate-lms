/**
 * Universal narration adapter used by the Remotion lesson renderer.
 *
 * Edge TTS remains the zero-cost first attempt, but it is an unofficial public
 * endpoint and can reject datacenter traffic with HTTP 403. Production must not
 * lose every course video when that happens, so the same adapter falls back to
 * authenticated OpenAI speech when OpenAI is configured.
 */

import { tts } from 'edge-tts';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/ai/openai-client';
import { logger } from '@/lib/logger';

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

const OPENAI_VOICE_MAP: Record<EdgeTTSVoice, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
  'en-US-GuyNeural': 'onyx',
  'en-US-JennyNeural': 'nova',
  'en-US-AriaNeural': 'alloy',
  'en-GB-RyanNeural': 'fable',
  'en-US-DavisNeural': 'echo',
};

async function generateOpenAINarration(text: string, voice: EdgeTTSVoice): Promise<Buffer> {
  if (!isOpenAIConfigured()) {
    throw new Error('Edge TTS failed and OpenAI narration is not configured');
  }

  const openai = getOpenAIClient();
  const mappedVoice = OPENAI_VOICE_MAP[voice] ?? 'alloy';

  try {
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: mappedVoice,
      input: text,
      instructions:
        'Speak as a clear, professional workforce instructor. Use a natural teaching pace, warm confidence, and precise pronunciation.',
      response_format: 'mp3',
    });
    return Buffer.from(await response.arrayBuffer());
  } catch (primaryError) {
    logger.warn('[Narration] gpt-4o-mini-tts failed; trying tts-1-hd', {
      error: primaryError instanceof Error ? primaryError.message : String(primaryError),
    });
    const response = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: mappedVoice,
      input: text,
      response_format: 'mp3',
    });
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function generateEdgeTTS(text: string, options: EdgeTTSOptions = {}): Promise<Buffer> {
  const normalizedText = text.trim();
  if (!normalizedText) throw new Error('Narration requires non-empty text');

  const {
    voice = EDGE_TTS_VOICES.marcus,
    rate = '-5%',
    pitch = '0Hz',
    volume = '+0%',
  } = options;

  try {
    const audio = await tts(normalizedText, { voice, rate, pitch, volume });
    return Buffer.isBuffer(audio) ? audio : Buffer.from(audio);
  } catch (edgeError) {
    logger.warn('[Narration] Edge TTS unavailable; using authenticated fallback', {
      error: edgeError instanceof Error ? edgeError.message : String(edgeError),
    });
    return generateOpenAINarration(normalizedText, voice);
  }
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
    keyPoints.slice(0, 2).map((p, i) => `Key concept ${i + 1}: ${p}`).join('. '),
    keyPoints.slice(2).map((p, i) => `Point ${i + 3}: ${p}`).join('. '),
    `Here's a real-world example. ${example}`,
    `To summarize: ${summary}. Complete the knowledge check to continue.`,
  ];
}
