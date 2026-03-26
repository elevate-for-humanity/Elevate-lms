import { NextRequest, NextResponse } from 'next/server';


import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { generateCourseVideo, getAvailableServices } from '@/lib/video/generate';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminRole } from '@/lib/api/requireAdminRole';
import { createClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * AI Video Generation API
 *
 * Two modes:
 * 1. Scene-based: scenes array → video-generator-v2 pipeline (FFmpeg + TTS)
 * 2. Course-based: courseName + lessonTitle → lib/video/generate (HeyGen → Sora → TTS)
 */

async function _POST(request: NextRequest) {
  // Video rendering requires native binaries (ffmpeg, canvas) that are
  // excluded from the Netlify SSR handler to stay under the 250MB limit.
  if (process.env.NETLIFY === 'true') {
    return NextResponse.json(
      { error: 'Video rendering is not available in this deployment. Use a dedicated worker.' },
      { status: 501 }
    );
  }

  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const adminCheck = await requireAdminRole();
    if (adminCheck) return adminCheck;

    const body = await request.json();

    // Route to course-based generation if courseName is provided
    if (body.courseName && body.lessonTitle) {
      return handleCourseVideo(body);
    }

    // Scene-based generation
    return handleSceneVideo(body);
  } catch (error) {
    logger.error('Video generation error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate video' },
      { status: 500 }
    );
  }
}

async function handleCourseVideo(body: any) {
  const { courseName, lessonNumber = 1, lessonTitle, lessonContent, topics = [], instructorId } = body;

  if (!lessonContent) {
    return NextResponse.json({ error: 'lessonContent is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Create job record
  const { data: job } = await supabase.from('video_generation_jobs').insert({
    title: `${courseName} - ${lessonTitle}`,
    status: 'processing',
    config: { courseName, lessonNumber, lessonTitle, topics, instructorId },
    scenes: [],
    voice: 'onyx',
    created_by: user?.id,
  }).select('id').single();

  // 2. Create task record
  const { data: task } = await supabase.from('ai_generation_tasks').insert({
    task_type: 'video',
    status: 'running',
    input_config: { courseName, lessonTitle, lessonNumber },
    created_by: user?.id,
  }).select('id').single();

  const services = getAvailableServices();

  try {
    const result = await generateCourseVideo({
      courseName,
      lessonNumber,
      lessonTitle,
      lessonContent,
      topics,
      instructorId,
    });

    if (!result.success) {
      // Update both records as failed
      const errorMsg = result.error || 'Generation failed';
      if (job?.id) await supabase.from('video_generation_jobs').update({ status: 'failed', error_message: errorMsg }).eq('id', job.id);
      if (task?.id) await supabase.from('ai_generation_tasks').update({ status: 'failed', error_message: errorMsg, completed_at: new Date().toISOString() }).eq('id', task.id);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    // 3. Update job as completed
    if (job?.id) {
      await supabase.from('video_generation_jobs').update({
        status: 'completed',
        output_url: result.videoUrl || result.audioUrl,
        duration_seconds: result.duration,
        completed_at: new Date().toISOString(),
      }).eq('id', job.id);
    }

    // 4. Register as media asset
    await supabase.from('media_assets').insert({
      asset_type: result.videoUrl ? 'video' : 'audio',
      title: `${courseName} - ${lessonTitle}`,
      public_url: result.videoUrl || result.audioUrl,
      duration_seconds: result.duration,
      metadata: { method: result.method, courseName, lessonNumber },
      source_job_id: job?.id,
      created_by: user?.id,
    });

    // 5. Complete task
    if (task?.id) {
      await supabase.from('ai_generation_tasks').update({
        status: 'completed',
        output_result: { jobId: job?.id, videoUrl: result.videoUrl, audioUrl: result.audioUrl, method: result.method },
        completed_at: new Date().toISOString(),
      }).eq('id', task.id);
    }

    return NextResponse.json({
      success: true,
      jobId: job?.id,
      taskId: task?.id,
      videoUrl: result.videoUrl,
      audioUrl: result.audioUrl,
      duration: result.duration,
      transcript: result.transcript,
      method: result.method,
      services,
    });
  } catch (error) {
    if (job?.id) await supabase.from('video_generation_jobs').update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Unknown error' }).eq('id', job.id);
    if (task?.id) await supabase.from('ai_generation_tasks').update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Unknown error', completed_at: new Date().toISOString() }).eq('id', task.id);
    throw error;
  }
}

async function handleSceneVideo(body: any) {
  const {
    title = 'Untitled Video',
    scenes,
    voice = 'onyx',
    format = '16:9',
    resolution = '1080p',
    backgroundMusic = false,
    musicPath,
    musicVolume = 0.3,
    uploadToStorage = true,
  } = body;

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return NextResponse.json({ error: 'At least one scene is required' }, { status: 400 });
  }

  // Dynamic import — video-generator-v2 requires fluent-ffmpeg + canvas (native deps)
  let videoGen;
  try {
    videoGen = await import('@/server/video-generator-v2');
  } catch {
    return NextResponse.json(
      { error: 'FFmpeg video pipeline not available. Use course-based generation instead (provide courseName + lessonTitle).' },
      { status: 503 }
    );
  }

  const timeline = videoGen.processTimeline(scenes);
  if (!timeline.valid) {
    return NextResponse.json({ error: 'Invalid timeline', details: timeline.errors }, { status: 400 });
  }

  logger.info('Scene video generation started', {
    title,
    scenes: scenes.length,
    duration: timeline.totalDuration,
    estimatedTime: videoGen.estimateGenerationTime(scenes),
  });

  const result = await videoGen.generateVideo({
    title,
    scenes,
    settings: {
      format: format as '16:9' | '9:16' | '1:1',
      resolution: resolution as '720p' | '1080p' | '4K',
      voiceOver: true,
      backgroundMusic,
      voice,
      musicPath,
      musicVolume,
    },
  });

  if (result.status === 'failed') {
    return NextResponse.json({ error: result.error || 'Video generation failed' }, { status: 500 });
  }

  // Upload to Supabase storage
  let publicUrl = result.videoPath;
  if (uploadToStorage && result.videoPath) {
    try {
      const supabase = await createClient();
      const fs = await import('fs/promises');
      const videoBuffer = await fs.readFile(result.videoPath);
      const storagePath = `generated/${result.jobId}.mp4`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, videoBuffer, { contentType: 'video/mp4', upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);
        publicUrl = urlData.publicUrl;
      } else {
        logger.error('Video storage upload failed:', uploadError);
      }
    } catch (uploadErr) {
      logger.error('Video upload error:', uploadErr instanceof Error ? uploadErr : new Error(String(uploadErr)));
    }
  }

  return NextResponse.json({
    success: true,
    jobId: result.jobId,
    videoUrl: publicUrl,
    duration: result.duration,
    title,
    voice,
    format,
    resolution,
  });
}

export const POST = withApiAudit('/api/ai-studio/generate-video', _POST);
