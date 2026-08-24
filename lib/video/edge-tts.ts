/**
 * Universal narration adapter used by the Remotion lesson renderer.
 *
 * Narration priority:
 *   1. Edge TTS (zero-cost public endpoint)
 *   2. ElevenLabs authenticated MP3
 *   3. Gemini authenticated TTS, transcoded to MP3
 *   4. OpenAI authenticated MP3
 *
 * Edge TTS can reject datacenter traffic with HTTP 403. Production therefore
 * never depends on that public endpoint as the sole narration provider.
 */

import { spawn } from 'node:child_process';
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

async function pcm16MonoToMp3(pcm: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0',
      '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', 'pipe:1',
    ]);
    const output: Buffer[] = [];
    const errors: Buffer[] = [];
    ffmpeg.stdout.on('data', (chunk: Buffer) => output.push(chunk));
    ffmpeg.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg narration transcode failed (${code}): ${Buffer.concat(errors).toString('utf8').slice(0, 500)}`));
        return;
      }
      const result = Buffer.concat(output);
      if (!result.length) reject(new Error('ffmpeg narration transcode returned empty MP3'));
      else resolve(result);
    });
    ffmpeg.stdin.end(pcm);
  });
}

async function generateLocalNarration(text: string): Promise<Buffer> {
  const wav = await new Promise<Buffer>((resolve, reject) => {
    const speech = spawn('espeak-ng', ['--stdin', '--stdout', '-v', 'en-us', '-s', '155']);
    const output: Buffer[] = [];
    const errors: Buffer[] = [];
    speech.stdout.on('data', (chunk: Buffer) => output.push(chunk));
    speech.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
    speech.on('error', reject);
    speech.on('close', (code) => {
      const result = Buffer.concat(output);
      if (code !== 0 || !result.length) reject(new Error(`local narration failed (${code}): ${Buffer.concat(errors).toString('utf8').slice(0, 300)}`));
      else resolve(result);
    });
    speech.stdin.end(text, 'utf8');
  });

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', 'pipe:1']);
    const output: Buffer[] = [];
    const errors: Buffer[] = [];
    ffmpeg.stdout.on('data', (chunk: Buffer) => output.push(chunk));
    ffmpeg.stderr.on('data', (chunk: Buffer) => errors.push(chunk));
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => {
      const result = Buffer.concat(output);
      if (code !== 0 || !result.length) reject(new Error(`local narration transcode failed (${code}): ${Buffer.concat(errors).toString('utf8').slice(0, 300)}`));
      else resolve(result);
    });
    ffmpeg.stdin.end(wav);
  });
}

async function generateGeminiNarration(text: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const model = process.env.GEMINI_TTS_MODEL?.trim() || 'gemini-3.1-flash-tts-preview';
  const voiceName = process.env.GEMINI_TTS_VOICE?.trim() || 'Kore';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini TTS returned ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`);
  }
  const json = await response.json();
  const encoded = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (typeof encoded !== 'string' || !encoded) throw new Error('Gemini TTS returned no audio data');
  return pcm16MonoToMp3(Buffer.from(encoded, 'base64'));
}

async function generateElevenLabsNarration(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || 'JBFqnCBsd6RMkjVDRZzb';
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL_ID?.trim() || 'eleven_multilingual_v2' }),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`ElevenLabs TTS returned ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ''}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateOpenAINarration(text: string, voice: EdgeTTSVoice): Promise<Buffer> {
  if (!isOpenAIConfigured()) throw new Error('OpenAI narration is not configured');
  const openai = getOpenAIClient();
  const mappedVoice = OPENAI_VOICE_MAP[voice] ?? 'alloy';
  try {
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts', voice: mappedVoice, input: text,
      instructions: 'Speak as a clear, professional workforce instructor. Use a natural teaching pace, warm confidence, and precise pronunciation.',
      response_format: 'mp3',
    });
    return Buffer.from(await response.arrayBuffer());
  } catch (primaryError) {
    logger.warn('[Narration] gpt-4o-mini-tts failed; trying tts-1-hd', { error: primaryError instanceof Error ? primaryError.message : String(primaryError) });
    const response = await openai.audio.speech.create({ model: 'tts-1-hd', voice: mappedVoice, input: text, response_format: 'mp3' });
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function generateEdgeTTS(text: string, options: EdgeTTSOptions = {}): Promise<Buffer> {
  const normalizedText = text.trim();
  if (!normalizedText) throw new Error('Narration requires non-empty text');
  const { voice = EDGE_TTS_VOICES.marcus, rate = '-5%', pitch = '0Hz', volume = '+0%' } = options;

  if (process.env.ELEVENLABS_API_KEY?.trim()) {
    try { return await generateElevenLabsNarration(normalizedText); }
    catch (error) { logger.warn('[Narration] ElevenLabs unavailable; trying Gemini', { error: error instanceof Error ? error.message : String(error) }); }
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    try { return await generateGeminiNarration(normalizedText); }
    catch (error) { logger.warn('[Narration] Gemini TTS unavailable; trying OpenAI', { error: error instanceof Error ? error.message : String(error) }); }
  }
  if (isOpenAIConfigured()) {
    try { return await generateOpenAINarration(normalizedText, voice); }
    catch (error) { logger.warn('[Narration] OpenAI TTS unavailable; trying Edge TTS', { error: error instanceof Error ? error.message : String(error) }); }
  }

  try {
    const audio = await tts(normalizedText, { voice, rate, pitch, volume });
    return Buffer.isBuffer(audio) ? audio : Buffer.from(audio);
  } catch (edgeError) {
    logger.warn('[Narration] Edge TTS unavailable', { error: edgeError instanceof Error ? edgeError.message : String(edgeError) });
  }

  if (process.env.NODE_ENV !== 'production') {
    logger.info('[Narration] Using diagnostic-only local espeak-ng fallback');
    return generateLocalNarration(normalizedText);
  }
  throw new Error('No publication-quality narration provider is available');
}

export function buildLessonScript(lesson: { title: string; moduleTitle: string; objective: string; keyPoints: string[]; example: string; summary: string }): string {
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

export function buildSegmentScripts(lesson: { title: string; moduleTitle: string; objective: string; keyPoints: string[]; example: string; summary: string }): [string, string, string, string, string] {
  const { title, moduleTitle, objective, keyPoints, example, summary } = lesson;
  return [
    `Welcome to ${moduleTitle}. In this lesson, we'll explore: ${title}. By the end, you will be able to: ${objective}`,
    keyPoints.slice(0, 2).map((p, i) => `Key concept ${i + 1}: ${p}`).join('. '),
    keyPoints.slice(2).map((p, i) => `Point ${i + 3}: ${p}`).join('. '),
    `Here's a real-world example. ${example}`,
    `To summarize: ${summary}. Complete the knowledge check to continue.`,
  ];
}
