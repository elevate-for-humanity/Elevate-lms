import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';
import {
  generateNaturalVoiceover,
  generateVoiceover,
  generateDIDVideo,
  generateSynthesiaVideo,
  generateSoraVideo,
  getAvailableServices,
} from '@/lib/video/generate';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 300;

// ── Synthesia avatar mapping ─────────────────────────────────────────────

function getSynthesiaAvatarForCourse(courseName: string): string {
  const name = courseName.toLowerCase();
  if (name.includes('health') || name.includes('cna') || name.includes('medical') || name.includes('cpr'))
    return 'anna_costume1_cameraA';
  if (name.includes('trade') || name.includes('hvac') || name.includes('welding') || name.includes('cdl'))
    return 'jack_costume1_cameraA';
  if (name.includes('tech') || name.includes('cyber') || name.includes('it '))
    return 'bridget_costume1_cameraA';
  return 'anna_costume1_cameraA';
}

// ── Script generation ───────────────────────────────────────────────────

function buildScript(lesson: any, courseName: string): string {
  const content = (lesson.content || '').substring(0, 400);
  const topics = Array.isArray(lesson.topics) ? lesson.topics.join(', ') : '';
  const topicLine = topics ? ` Today we will cover: ${topics}.` : '';
  return `Welcome to ${courseName}, Lesson ${lesson.lesson_number}: ${lesson.title}. ${content}${topicLine} Let's get started.`.trim();
}

function buildSoraPrompt(courseName: string, lessonTitle: string): string {
  return `Professional educational training video for "${courseName}" course, lesson "${lessonTitle}". Show a modern, well-lit classroom or training facility with relevant equipment and materials. Clean, professional look with warm lighting. No text overlays. 16:9 cinematic.`;
}

// ── Voice mapping ───────────────────────────────────────────────────────

const VOICE_MAP: Record<string, string> = {
  'dr-sarah-chen': 'nova',
  'marcus-johnson': 'onyx',
  'james-williams': 'echo',
  'lisa-martinez': 'shimmer',
  'robert-davis': 'fable',
  'angela-thompson': 'alloy',
};

// ── Per-lesson generation: Synthesia → D-ID → Sora → gpt-4o-mini-tts → tts-1-hd

let synthesiaSkip = false;
let didSkip = false;
let soraSkip = false;

async function generateForLesson(
  lesson: any,
  courseName: string,
  db: any
): Promise<{ success: boolean; videoUrl?: string; method?: string; error?: string }> {
  const script = buildScript(lesson, courseName);
  const instructor = getInstructorForCourse(courseName);
  const voice = VOICE_MAP[instructor.id] || 'nova';

  // 1. Synthesia avatar video (premium)
  if (process.env.SYNTHESIA_API_KEY && !synthesiaSkip) {
    try {
      const avatarId = getSynthesiaAvatarForCourse(courseName);
      logger.info(`[VideoGen] Synthesia: "${lesson.title}" (${avatarId})`);
      const result = await generateSynthesiaVideo(script, avatarId);

      await supabase.from('training_lessons')
        .update({ video_url: result.videoUrl, updated_at: new Date().toISOString() })
        .eq('id', lesson.id);

      return { success: true, videoUrl: result.videoUrl, method: 'synthesia' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('credit') || msg.includes('quota') || msg.includes('limit')) {
        synthesiaSkip = true;
        logger.warn('[VideoGen] Synthesia credits depleted — skipping for batch');
      } else {
        logger.warn(`[VideoGen] Synthesia failed: ${msg}`);
      }
    }
  }

  // 2. D-ID talking-head (instructor photo + generated audio)
  if (process.env.DID_API_KEY && !didSkip) {
    try {
      logger.info(`[VideoGen] D-ID: "${lesson.title}" (voice: ${voice})`);
      const { audioBuffer } = await generateNaturalVoiceover(script, voice, instructor.id);
      const audioBase64 = audioBuffer.toString('base64');
      const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;
      const result = await generateDIDVideo(script, instructor.avatar, audioDataUrl);

      await supabase.from('training_lessons')
        .update({ video_url: result.videoUrl, updated_at: new Date().toISOString() })
        .eq('id', lesson.id);

      return { success: true, videoUrl: result.videoUrl, method: 'd-id' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('credit') || msg.includes('quota') || msg.includes('limit')) {
        didSkip = true;
        logger.warn('[VideoGen] D-ID credits depleted — skipping for batch');
      } else {
        logger.warn(`[VideoGen] D-ID failed: ${msg}`);
      }
    }
  }

  // 3. OpenAI Sora video
  if (!soraSkip) {
    try {
      const prompt = buildSoraPrompt(courseName, lesson.title);
      logger.info(`[VideoGen] Sora: "${lesson.title}"`);
      const result = await generateSoraVideo(prompt, '8', '1280x720');

      await supabase.from('training_lessons')
        .update({ video_url: result.videoUrl, updated_at: new Date().toISOString() })
        .eq('id', lesson.id);

      return { success: true, videoUrl: result.videoUrl, method: 'sora' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // If Sora isn't available or quota exceeded, skip for rest of batch
      if (msg.includes('not available') || msg.includes('quota') || msg.includes('billing')) {
        soraSkip = true;
        logger.warn('[VideoGen] Sora unavailable — skipping for batch');
      } else {
        logger.warn(`[VideoGen] Sora failed: ${msg}`);
      }
    }
  }

  // 3. gpt-4o-mini-tts (natural voice with instructor personality)
  try {
    logger.info(`[VideoGen] gpt-4o-mini-tts: "${lesson.title}" (voice: ${voice})`);
    const outputDir = path.join(process.cwd(), 'public', 'generated', 'lessons');
    await mkdir(outputDir, { recursive: true });
    const filename = `lesson-${lesson.id}.mp3`;
    const outputPath = path.join(outputDir, filename);

    await generateNaturalVoiceover(script, voice, instructor.id, outputPath);
    const audioUrl = `/hvac/audio/${filename}`;

    await supabase.from('training_lessons')
      .update({ video_url: audioUrl, updated_at: new Date().toISOString() })
      .eq('id', lesson.id);

    return { success: true, videoUrl: audioUrl, method: 'gpt4o-mini-tts' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    logger.warn(`[VideoGen] gpt-4o-mini-tts failed: ${msg}`);
  }

  // 4. tts-1-hd fallback
  try {
    logger.info(`[VideoGen] tts-1-hd fallback: "${lesson.title}"`);
    const outputDir = path.join(process.cwd(), 'public', 'generated', 'lessons');
    await mkdir(outputDir, { recursive: true });
    const filename = `lesson-${lesson.id}.mp3`;
    const outputPath = path.join(outputDir, filename);

    await generateVoiceover(script, voice as any, outputPath);
    const audioUrl = `/hvac/audio/${filename}`;

    await supabase.from('training_lessons')
      .update({ video_url: audioUrl, updated_at: new Date().toISOString() })
      .eq('id', lesson.id);

    return { success: true, videoUrl: audioUrl, method: 'tts-1-hd' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.error('[VideoGen] generateForLesson failed:', msg);
    return { success: false, error: 'Video generation failed' };
  }
}

// ── POST /api/admin/generate-lesson-videos ──────────────────────────────

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: _roleProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!_roleProfile || !['admin', 'super_admin', 'staff'].includes(_roleProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Reset per-request flags
    synthesiaSkip = false;
    didSkip = false;
    soraSkip = false;

    const { courseId, lessonId, batchSize = 5 } = await request.json();
    let lessons: any[] = [];

    if (lessonId) {
      const { data } = await supabase
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .eq('id', lessonId)
        .single();
      if (data) lessons = [data];
    } else if (courseId) {
      const { data } = await supabase
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .eq('course_id', courseId)
        .or('video_url.is.null,video_url.like.%.mp3')
        .order('lesson_number');
      lessons = data || [];
    } else {
      const { data } = await supabase
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .or('video_url.is.null,video_url.like.%.mp3')
        .order('created_at')
        .limit(batchSize);
      lessons = data || [];
    }

    if (lessons.length === 0) {
      return NextResponse.json({ success: true, message: 'All lessons have media', generated: 0 });
    }

    const results: any[] = [];
    for (const lesson of lessons) {
      const courseName = lesson.training_courses?.course_name || 'Course';
      const result = await generateForLesson(lesson, courseName, db);
      results.push({ lessonId: lesson.id, title: lesson.title, course: courseName, ...result });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const methods: Record<string, number> = {};
    for (const r of results) {
      if (r.method) methods[r.method] = (methods[r.method] || 0) + 1;
    }

    const { data: { user: actor } } = await supabase.auth.getUser();
    if (actor) await logAdminAudit({ action: AdminAction.LESSON_VIDEO_GENERATED, actorId: actor.id, entityType: 'training_lessons', entityId: BULK_ENTITY_ID, metadata: { generated: successful, failed, methods }, req: request });

    return NextResponse.json({
      success: true,
      message: `Generated ${successful}, ${failed} failed`,
      generated: successful,
      failed,
      methods,
      services: getAvailableServices(),
      results,
    });

  } catch (error) {
    logger.error('[VideoGen] Route error:', error);
    return NextResponse.json({ error: 'Failed to generate videos' }, { status: 500 });
  }
}

// ── GET /api/admin/generate-lesson-videos (status) ──────────────────────

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { count: total } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true });

    const { count: withRealVideo } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .not('video_url', 'is', null)
      .not('video_url', 'like', '%.mp3');

    const { count: withMp3 } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .like('video_url', '%.mp3');

    const { count: noMedia } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .is('video_url', null);

    const realVideos = withRealVideo || 0;
    const needsGen = (withMp3 || 0) + (noMedia || 0);

    return NextResponse.json({
      total,
      withVideos: realVideos,
      withMp3Only: withMp3 || 0,
      withoutMedia: noMedia || 0,
      needsGeneration: needsGen,
      percentComplete: total ? Math.round(realVideos / total * 100) : 0,
      services: getAvailableServices(),
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/generate-lesson-videos', _GET);
export const POST = withApiAudit('/api/admin/generate-lesson-videos', _POST);
