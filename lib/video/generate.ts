/**
 * Video Generation System
 * 
 * Generates course videos using:
 * - OpenAI TTS for voiceovers
 * - HeyGen or Synthesia for AI avatar videos (when configured)
 * - Fallback to audio-only with slides
 */

import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai-client';
import { getInstructorForCourse, generateLessonScript } from '@/lib/ai-instructors';
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

// Voice mapping from our instructors to OpenAI voices
const INSTRUCTOR_VOICE_MAP: Record<string, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
  'dr-sarah-chen': 'nova',
  'marcus-johnson': 'onyx',
  'james-williams': 'echo',
  'lisa-martinez': 'shimmer',
  'robert-davis': 'fable',
  'angela-thompson': 'alloy',
};

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
  error?: string;
}

/**
 * Generate voiceover audio using OpenAI TTS
 */
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
  
  // Estimate duration (rough: ~150 words per minute for TTS)
  const wordCount = script.split(/\s+/).length;
  const duration = Math.ceil((wordCount / 150) * 60);

  if (outputPath) {
    await fs.writeFile(outputPath, audioBuffer);
  }

  return { audioBuffer, duration };
}

/**
 * Generate AI avatar video using HeyGen
 */
export async function generateHeyGenVideo(
  script: string,
  avatarId: string,
  voiceId?: string
): Promise<{ videoUrl: string; duration: number }> {
  const apiKey = process.env.HEYGEN_API_KEY;
  
  if (!apiKey) {
    throw new Error('HeyGen API key not configured');
  }

  // Create video
  const createResponse = await fetch('https://api.heygen.com/v2/video/generate', {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: avatarId,
            avatar_style: 'normal',
          },
          voice: voiceId ? {
            type: 'text',
            input_text: script,
            voice_id: voiceId,
          } : {
            type: 'text',
            input_text: script,
          },
          background: {
            type: 'color',
            value: '#1e293b',
          },
        },
      ],
      dimension: {
        width: 1920,
        height: 1080,
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`HeyGen API error: ${error}`);
  }

  const { data } = await createResponse.json();
  const videoId = data.video_id;

  // Poll for completion
  let videoUrl = '';
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': apiKey },
    });

    const statusData = await statusResponse.json();
    
    if (statusData.data.status === 'completed') {
      videoUrl = statusData.data.video_url;
      break;
    } else if (statusData.data.status === 'failed') {
      throw new Error('HeyGen video generation failed');
    }
    
    attempts++;
  }

  if (!videoUrl) {
    throw new Error('HeyGen video generation timed out');
  }

  // Estimate duration
  const wordCount = script.split(/\s+/).length;
  const duration = Math.ceil((wordCount / 150) * 60);

  return { videoUrl, duration };
}

/**
 * Generate AI avatar video using Synthesia
 */
export async function generateSynthesiaVideo(
  script: string,
  avatarId: string,
  voiceId?: string
): Promise<{ videoUrl: string; duration: number }> {
  const apiKey = process.env.SYNTHESIA_API_KEY;
  
  if (!apiKey) {
    throw new Error('Synthesia API key not configured');
  }

  // Create video
  const createResponse = await fetch('https://api.synthesia.io/v2/videos', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      test: process.env.NODE_ENV !== 'production', // Use test mode in dev
      input: [
        {
          scriptText: script,
          avatar: avatarId,
          background: 'off_white',
          ...(voiceId && { voice: voiceId }),
        },
      ],
      aspectRatio: '16:9',
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Synthesia API error: ${error}`);
  }

  const { id: videoId } = await createResponse.json();

  // Poll for completion
  let videoUrl = '';
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max (Synthesia can be slower)

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await fetch(`https://api.synthesia.io/v2/videos/${videoId}`, {
      headers: { 'Authorization': apiKey },
    });

    const statusData = await statusResponse.json();
    
    if (statusData.status === 'complete') {
      videoUrl = statusData.download;
      break;
    } else if (statusData.status === 'failed') {
      throw new Error('Synthesia video generation failed');
    }
    
    attempts++;
  }

  if (!videoUrl) {
    throw new Error('Synthesia video generation timed out');
  }

  const wordCount = script.split(/\s+/).length;
  const duration = Math.ceil((wordCount / 150) * 60);

  return { videoUrl, duration };
}

/**
 * Main video generation function
 * Automatically selects the best available method
 */
export async function generateCourseVideo(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  try {
    const {
      courseName,
      lessonNumber,
      lessonTitle,
      lessonContent,
      topics = [],
      instructorId,
      outputFormat = 'video',
    } = request;

    // Get instructor
    const instructor = instructorId 
      ? (await import('@/lib/ai-instructors')).AI_INSTRUCTORS.find(i => i.id === instructorId) 
      : getInstructorForCourse(courseName);

    if (!instructor) {
      throw new Error('Instructor not found');
    }

    // Generate script
    const script = generateLessonScript(
      instructor,
      courseName,
      lessonNumber,
      lessonTitle,
      lessonContent,
      topics
    );

    logger.info('Generating video', {
      courseName,
      lessonNumber,
      instructor: instructor.name,
      scriptLength: script.length,
    });

    // Try video generation services in order of preference
    if (outputFormat === 'video') {
      // Try HeyGen first
      if (process.env.HEYGEN_API_KEY) {
        try {
          const result = await generateHeyGenVideo(script, 'default'); // Use default avatar
          return {
            success: true,
            videoUrl: result.videoUrl,
            duration: result.duration,
            transcript: script,
          };
        } catch (error) {
          logger.warn('HeyGen failed, trying Synthesia', { error });
        }
      }

      // Try Synthesia
      if (process.env.SYNTHESIA_API_KEY) {
        try {
          const result = await generateSynthesiaVideo(script, 'anna_costume1_cameraA');
          return {
            success: true,
            videoUrl: result.videoUrl,
            duration: result.duration,
            transcript: script,
          };
        } catch (error) {
          logger.warn('Synthesia failed, falling back to audio', { error });
        }
      }
    }

    // Fallback to audio-only with OpenAI TTS
    if (isOpenAIConfigured()) {
      const voice = INSTRUCTOR_VOICE_MAP[instructor.id] || 'nova';
      const { audioBuffer, duration } = await generateVoiceover(script, voice);
      
      // In production, upload to storage and return URL
      // For now, return base64
      const audioBase64 = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

      return {
        success: true,
        audioUrl,
        duration,
        transcript: script,
      };
    }

    throw new Error('No video or audio generation service configured');
  } catch (error) {
    logger.error('Video generation failed', error as Error);
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Generate multiple lesson videos for a course
 */
export async function generateCourseVideos(
  courseName: string,
  lessons: Array<{
    number: number;
    title: string;
    content: string;
    topics?: string[];
  }>,
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

    // Add delay between generations to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

/**
 * Check which video generation services are available
 */
export function getAvailableServices(): {
  openai: boolean;
  heygen: boolean;
  synthesia: boolean;
} {
  return {
    openai: isOpenAIConfigured(),
    heygen: !!process.env.HEYGEN_API_KEY,
    synthesia: !!process.env.SYNTHESIA_API_KEY,
  };
}
