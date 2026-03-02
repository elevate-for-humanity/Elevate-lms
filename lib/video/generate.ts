/**
 * Video & Audio Generation System
 *
 * Priority chain:
 *   1. Synthesia — full avatar video (training/L&D, premium)
 *   2. D-ID — talking-head from instructor photo + audio
 *   3. OpenAI Sora — AI-generated scene video (sora-2, 4-12s clips)
 *   4. OpenAI gpt-4o-mini-tts — natural, instructor-voiced audio with personality
 *   5. OpenAI tts-1-hd — standard high-quality TTS fallback
 */

import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { getInstructorForCourse, generateLessonScript } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

// ── Types ───────────────────────────────────────────────────────────────

export interface VideoGenerationRequest {
  courseName: string;
  lessonNumber: number;
  lessonTitle: string;
  lessonContent: string;
  topics?: string[];
  instructorId?: string;
  outputFormat?: 'audio' | 'video';
}

export interface VideoGenerationResult {
  success: boolean;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  transcript?: string;
  method?: 'synthesia' | 'd-id' | 'sora' | 'gpt4o-mini-tts' | 'tts-1-hd';
  error?: string;
}

// Voice mapping: instructor ID → OpenAI voice
const INSTRUCTOR_VOICE_MAP: Record<string, string> = {
  'dr-sarah-chen': 'nova',
  'marcus-johnson': 'onyx',
  'james-williams': 'echo',
  'lisa-martinez': 'shimmer',
  'robert-davis': 'fable',
  'angela-thompson': 'alloy',
};

// Instructor personality instructions for gpt-4o-mini-tts
const INSTRUCTOR_STYLE_MAP: Record<string, string> = {
  'dr-sarah-chen': 'Speak as a warm, knowledgeable healthcare instructor. Use a calm, reassuring tone with clear enunciation. Pace yourself for students taking notes.',
  'marcus-johnson': 'Speak as an experienced trades instructor on a job site. Be direct, practical, and encouraging. Use a confident, steady pace.',
  'james-williams': 'Speak as a master barber teaching in a shop. Be personable, energetic, and real. Mix professionalism with approachable warmth.',
  'lisa-martinez': 'Speak as a patient IT instructor. Break down technical concepts clearly. Be encouraging and use a friendly, measured pace.',
  'robert-davis': 'Speak as a veteran truck driver turned instructor. Be straightforward, safety-focused, and supportive. Use a calm, authoritative tone.',
  'angela-thompson': 'Speak as a business coach. Be professional, motivating, and clear. Use an upbeat but grounded tone.',
};

// ── OpenAI gpt-4o-mini-tts (natural, with personality) ──────────────────

export async function generateNaturalVoiceover(
  script: string,
  voice: string = 'nova',
  instructorId?: string,
  outputPath?: string
): Promise<{ audioBuffer: Buffer; duration: number }> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured');
  }

  const openai = getOpenAIClient();
  const instructions = instructorId ? INSTRUCTOR_STYLE_MAP[instructorId] : undefined;

  const response = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: voice as any,
    input: script,
    instructions: instructions || 'Speak as a professional instructor. Be clear, warm, and engaging. Pace yourself for students.',
    response_format: 'mp3',
  });

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  const wordCount = script.split(/\s+/).length;
  const duration = Math.ceil((wordCount / 150) * 60);

  if (outputPath) {
    await fs.writeFile(outputPath, audioBuffer);
  }

  return { audioBuffer, duration };
}

// ── OpenAI tts-1-hd (standard fallback) ─────────────────────────────────

export async function generateVoiceover(
  script: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
  outputPath?: string
): Promise<{ audioBuffer: Buffer; duration: number }> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured');
  }

  const openai = getOpenAIClient();

  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: voice,
    input: script,
    response_format: 'mp3',
  });

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  const wordCount = script.split(/\s+/).length;
  const duration = Math.ceil((wordCount / 150) * 60);

  if (outputPath) {
    await fs.writeFile(outputPath, audioBuffer);
  }

  return { audioBuffer, duration };
}

// ── OpenAI Sora (AI video generation) ───────────────────────────────────

export async function generateSoraVideo(
  prompt: string,
  seconds: '4' | '8' | '12' = '8',
  size: '1280x720' | '720x1280' = '1280x720'
): Promise<{ videoUrl: string; videoId: string }> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI not configured');
  }

  const openai = getOpenAIClient();

  // Submit video generation
  const video = await openai.videos.create({
    model: 'sora-2',
    prompt,
    seconds,
    size,
  });

  // Poll for completion
  const maxWaitMs = 300000; // 5 minutes
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = await openai.videos.retrieve(video.id);

    if (status.status === 'completed') {
      // Download the video content
      const downloadResponse = await openai.videos.downloadContent(video.id, { variant: 'video' });
      const videoBuffer = Buffer.from(await downloadResponse.arrayBuffer());

      // Save locally
      const outputDir = path.join(process.cwd(), 'public', 'generated', 'videos');
      await fs.mkdir(outputDir, { recursive: true });
      const filename = `sora-${video.id}.mp4`;
      const outputPath = path.join(outputDir, filename);
      await fs.writeFile(outputPath, videoBuffer);

      return { videoUrl: `/generated/videos/${filename}`, videoId: video.id };
    }

    if (status.status === 'failed') {
      throw new Error(`Sora failed: ${status.error?.message || 'unknown'}`);
    }

    await new Promise(r => setTimeout(r, 5000));
  }

  throw new Error(`Sora timed out after ${maxWaitMs / 1000}s`);
}

// ── D-ID (talking-head from instructor photo + audio) ───────────────────

export async function generateDIDVideo(
  script: string,
  photoUrl: string,
  audioUrl: string
): Promise<{ videoUrl: string; duration: number }> {
  const { createTalk, pollTalkResult } = await import('@/lib/d-id/generate-talk');
  const { id } = await createTalk({ photoUrl, audioUrl });
  const result = await pollTalkResult(id);
  const wordCount = script.split(/\s+/).length;
  return { videoUrl: result.result_url, duration: Math.ceil((wordCount / 150) * 60) };
}

// ── Synthesia ───────────────────────────────────────────────────────────

export async function generateSynthesiaVideo(
  script: string,
  avatarId: string,
  voiceId?: string
): Promise<{ videoUrl: string; duration: number }> {
  const apiKey = process.env.SYNTHESIA_API_KEY;
  if (!apiKey) throw new Error('Synthesia API key not configured');

  const createResponse = await fetch('https://api.synthesia.io/v2/videos', {
    method: 'POST',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      test: process.env.NODE_ENV !== 'production',
      input: [{ scriptText: script, avatar: avatarId, background: 'off_white', ...(voiceId && { voice: voiceId }) }],
      aspectRatio: '16:9',
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Synthesia API error: ${error}`);
  }

  const { id: videoId } = await createResponse.json();
  let attempts = 0;
  while (attempts < 120) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const statusResponse = await fetch(`https://api.synthesia.io/v2/videos/${videoId}`, {
      headers: { 'Authorization': apiKey },
    });
    const statusData = await statusResponse.json();
    if (statusData.status === 'complete') {
      const wordCount = script.split(/\s+/).length;
      return { videoUrl: statusData.download, duration: Math.ceil((wordCount / 150) * 60) };
    }
    if (statusData.status === 'failed') throw new Error('Synthesia video generation failed');
    attempts++;
  }
  throw new Error('Synthesia video generation timed out');
}

// ── Main orchestrator ───────────────────────────────────────────────────

/**
 * Generate lesson media using the best available method.
 * Chain: Synthesia → D-ID → Sora → gpt-4o-mini-tts → tts-1-hd
 */
export async function generateCourseVideo(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  try {
    const { courseName, lessonNumber, lessonTitle, lessonContent, topics = [], instructorId } = request;

    const instructor = instructorId
      ? (await import('@/lib/ai-instructors')).AI_INSTRUCTORS.find((i: any) => i.id === instructorId)
      : getInstructorForCourse(courseName);

    if (!instructor) throw new Error('Instructor not found');

    const script = generateLessonScript(instructor, courseName, lessonNumber, lessonTitle, lessonContent, topics);
    const voice = INSTRUCTOR_VOICE_MAP[instructor.id] || 'nova';

    // 1. Try Synthesia (full avatar video — premium)
    if (process.env.SYNTHESIA_API_KEY) {
      try {
        const result = await generateSynthesiaVideo(script, 'anna_costume1_cameraA');
        return { success: true, videoUrl: result.videoUrl, duration: result.duration, transcript: script, method: 'synthesia' };
      } catch (error) {
        logger.warn('[VideoGen] Synthesia failed, trying D-ID', { error });
      }
    }

    // 2. Try D-ID (talking-head from instructor photo + generated audio)
    if (process.env.DID_API_KEY && isOpenAIConfigured()) {
      try {
        // Generate voiceover audio first, then lip-sync to instructor photo
        const { audioBuffer } = await generateNaturalVoiceover(script, voice, instructor.id);
        const audioBase64 = audioBuffer.toString('base64');
        const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;
        const result = await generateDIDVideo(script, instructor.avatar, audioDataUrl);
        return { success: true, videoUrl: result.videoUrl, duration: result.duration, transcript: script, method: 'd-id' };
      } catch (error) {
        logger.warn('[VideoGen] D-ID failed, trying Sora', { error });
      }
    }

    // 3. Try Sora (AI-generated b-roll video)
    if (isOpenAIConfigured()) {
      try {
        const soraPrompt = `Professional educational video for a ${courseName} course. Lesson: ${lessonTitle}. Show a clean, modern classroom or training environment with relevant visual elements. Professional lighting, 16:9 aspect ratio.`;
        const result = await generateSoraVideo(soraPrompt, '8', '1280x720');
        return { success: true, videoUrl: result.videoUrl, transcript: script, method: 'sora' };
      } catch (error) {
        logger.warn('[VideoGen] Sora failed, falling back to TTS', { error });
      }
    }

    // 4. Try gpt-4o-mini-tts (natural voice with personality)
    if (isOpenAIConfigured()) {
      try {
        const { audioBuffer, duration } = await generateNaturalVoiceover(script, voice, instructor.id);
        const audioBase64 = audioBuffer.toString('base64');
        return {
          success: true,
          audioUrl: `data:audio/mp3;base64,${audioBase64}`,
          duration,
          transcript: script,
          method: 'gpt4o-mini-tts',
        };
      } catch (error) {
        logger.warn('[VideoGen] gpt-4o-mini-tts failed, trying tts-1-hd', { error });
      }
    }

    // 5. Fallback: tts-1-hd
    if (isOpenAIConfigured()) {
      const { audioBuffer, duration } = await generateVoiceover(script, voice as any);
      const audioBase64 = audioBuffer.toString('base64');
      return {
        success: true,
        audioUrl: `data:audio/mp3;base64,${audioBase64}`,
        duration,
        transcript: script,
        method: 'tts-1-hd',
      };
    }

    throw new Error('No generation service configured');
  } catch (error) {
    logger.error('[VideoGen] Generation failed', error as Error);
    return { success: false, error: 'Operation failed' };
  }
}

/**
 * Batch generate for a course
 */
export async function generateCourseVideos(
  courseName: string,
  lessons: Array<{ number: number; title: string; content: string; topics?: string[] }>,
  instructorId?: string
): Promise<VideoGenerationResult[]> {
  const results: VideoGenerationResult[] = [];
  for (const lesson of lessons) {
    const result = await generateCourseVideo({
      courseName,
      lessonNumber: lesson.number,
      lessonTitle: lesson.title,
      lessonContent: lesson.content,
      topics: lesson.topics,
      instructorId,
    });
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return results;
}

/**
 * Check which services are available
 */
export function getAvailableServices(): {
  openai: boolean;
  synthesia: boolean;
  did: boolean;
  sora: boolean;
  gpt4oMiniTts: boolean;
  elevenlabs: boolean;
} {
  return {
    openai: isOpenAIConfigured(),
    synthesia: !!process.env.SYNTHESIA_API_KEY,
    did: !!process.env.DID_API_KEY,
    sora: isOpenAIConfigured(),
    gpt4oMiniTts: isOpenAIConfigured(),
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
  };
}
