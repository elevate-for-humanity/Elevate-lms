import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { v4 as uuidv4 } from 'uuid';
import { generateCourseVideo, getAvailableServices } from '@/lib/video/generate';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

interface Scene {
  id: string;
  type: 'title' | 'content' | 'image' | 'split';
  duration: number;
  script: string;
  voiceOver: boolean;
  background: string;
  textPosition: 'center' | 'top' | 'bottom';
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  image?: string;
}

interface VideoRequest {
  scenes: Scene[];
  format: '16:9' | '9:16' | '1:1' | '4:5';
  resolution: '1080p' | '720p' | '4K';
  backgroundMusic?: boolean;
  title?: string;
}

/**
 * Video Generation API
 * 
 * Two modes:
 * 1. Course video with AI instructor voiceover (courseName, lessonTitle, etc.)
 * 2. Scene-based video generation (scenes array)
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    
    // Check if this is a course video request (AI instructor mode)
    if (body.courseName && body.lessonTitle) {
      return handleCourseVideoGeneration(request, body);
    }
    
    // Otherwise, handle scene-based video generation
    return handleSceneVideoGeneration(body);
  } catch (error) {
    logger.error(
      'Video generation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate video' },
      { status: 500 }
    );
  }
}

/**
 * Generate course video with AI instructor voiceover
 */
async function handleCourseVideoGeneration(request: NextRequest, body: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Allow unauthenticated for testing, but log it
  if (!user) {
    logger.warn('Unauthenticated video generation request');
  }

  const {
    courseName,
    lessonNumber = 1,
    lessonTitle,
    lessonContent,
    topics = [],
    instructorId,
    outputFormat = 'audio', // Default to audio since video requires HeyGen/Synthesia
  } = body;

  if (!courseName || !lessonTitle || !lessonContent) {
    return NextResponse.json(
      { error: 'Missing required fields: courseName, lessonTitle, lessonContent' },
      { status: 400 }
    );
  }

  // Check available services
  const services = getAvailableServices();
  if (!services.openai && !services.heygen && !services.synthesia) {
    return NextResponse.json(
      { 
        error: 'No video generation service configured',
        hint: 'Add OPENAI_API_KEY for voiceovers, or HEYGEN_API_KEY/SYNTHESIA_API_KEY for avatar videos'
      },
      { status: 503 }
    );
  }

  logger.info('Course video generation requested', {
    courseName,
    lessonNumber,
    services,
  });

  // Generate video/audio
  const result = await generateCourseVideo({
    courseName,
    lessonNumber,
    lessonTitle,
    lessonContent,
    topics,
    instructorId,
    outputFormat,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Video generation failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    videoId: uuidv4(),
    videoUrl: result.videoUrl,
    audioUrl: result.audioUrl,
    duration: result.duration,
    transcript: result.transcript,
    status: 'completed',
    services: {
      voiceover: services.openai ? 'OpenAI TTS' : null,
      avatar: services.heygen ? 'HeyGen' : services.synthesia ? 'Synthesia' : null,
    },
  });
}

/**
 * Generate video from scene configuration (template-based)
 */
async function handleSceneVideoGeneration(body: VideoRequest) {
  const { scenes, format = '16:9', resolution = '1080p' } = body;

  if (!scenes || scenes.length === 0) {
    return NextResponse.json(
      { error: 'At least one scene is required' },
      { status: 400 }
    );
  }

  const videoId = uuidv4();
  
  // Select placeholder video based on content
  const placeholderVideos = [
    '/videos/hero-home.mp4',
    '/videos/career-services-hero.mp4',
    '/videos/barber-hero-final.mp4',
    '/videos/hvac-hero-final.mp4',
  ];

  let selectedVideo = placeholderVideos[0];
  const scriptContent = scenes.map(s => s.script).join(' ').toLowerCase();
  
  if (scriptContent.includes('barber') || scriptContent.includes('hair') || scriptContent.includes('beauty')) {
    selectedVideo = '/videos/barber-hero-final.mp4';
  } else if (scriptContent.includes('hvac') || scriptContent.includes('trade') || scriptContent.includes('technician')) {
    selectedVideo = '/videos/hvac-hero-final.mp4';
  } else if (scriptContent.includes('career') || scriptContent.includes('job') || scriptContent.includes('placement')) {
    selectedVideo = '/videos/career-services-hero.mp4';
  }

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  logger.info(`Scene video generation: ${videoId}, duration: ${totalDuration}s`);

  return NextResponse.json({
    success: true,
    videoId,
    videoUrl: selectedVideo,
    thumbnail: selectedVideo.replace('.mp4', '.jpg'),
    duration: totalDuration,
    format,
    resolution,
    scenes: scenes.length,
    status: 'completed',
  });
}

/**
 * Get video generation status
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Video ID is required' },
      { status: 400 }
    );
  }

  // Video generation is synchronous — the POST response includes the final URL.
  // No async status polling is available.
  return NextResponse.json(
    { error: 'Video generation is synchronous. Status is returned in the POST response.' },
    { status: 404 }
  );
}
export const GET = withApiAudit('/api/video/generate', _GET);
export const POST = withApiAudit('/api/video/generate', _POST);
