import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  generateNaturalVoiceover,
  generateVoiceover,
  generateHeyGenVideo,
  generateSoraVideo,
  getAvailableServices,
} from '@/lib/video/generate';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 300;

// ── Avatar mapping (HeyGen-specific) ────────────────────────────────────

function getHeyGenAvatarForCourse(courseName: string): { avatarId: string; voiceId: string } {
  const name = courseName.toLowerCase();

  if (name.includes('cna') || name.includes('medical') || name.includes('phlebotomy') ||
      name.includes('pharmacy') || name.includes('dental') || name.includes('emt') ||
      name.includes('health') || name.includes('cpr') || name.includes('direct support') ||
      name.includes('ekg') || name.includes('patient care'))
    return { avatarId: 'Carlotta_BizTalk_Front_public', voiceId: '42d00d4aac5441279d8536cd6b52c53c' };

  if (name.includes('hvac') || name.includes('solar') || name.includes('building') ||
      name.includes('forklift') || name.includes('manufacturing') || name.includes('diesel') ||
      name.includes('automotive') || name.includes('maintenance') || name.includes('welding') ||
      name.includes('electrical') || name.includes('plumbing') || name.includes('construction'))
    return { avatarId: 'Armando_Casual_Front_public', voiceId: '2eca0d3dd5ec4a1ea6efa6194b19eb78' };

  if (name.includes('cdl') || name.includes('trucking') || name.includes('driving') ||
      name.includes('warehouse') || name.includes('logistics'))
    return { avatarId: 'Armando_Casual_Side_public', voiceId: '88bb9ee1c81b466eb2a08fdde86d3619' };

  if (name.includes('barber') || name.includes('hair') || name.includes('nail') ||
      name.includes('esthetician') || name.includes('cosmetology') || name.includes('beauty'))
    return { avatarId: 'Brandon_expressive_public', voiceId: '2eca0d3dd5ec4a1ea6efa6194b19eb78' };

  if (name.includes('cyber') || name.includes('web') || name.includes('data') ||
      name.includes('it support') || name.includes('technology') || name.includes('security officer'))
    return { avatarId: 'Annie_expressive10_public', voiceId: '1704ea0565c04c5188d9b67062b31a1a' };

  if (name.includes('tax') || name.includes('bookkeeping') || name.includes('business') ||
      name.includes('entrepreneur') || name.includes('insurance') || name.includes('real estate') ||
      name.includes('administrative') || name.includes('customer service') || name.includes('nrf'))
    return { avatarId: 'Adriana_BizTalk_Front_public', voiceId: '4754e1ec667544b0bd18cdf4bec7d6a7' };

  if (name.includes('recovery') || name.includes('reentry') || name.includes('peer') ||
      name.includes('life coach') || name.includes('community') || name.includes('culinary') ||
      name.includes('hospitality') || name.includes('early childhood'))
    return { avatarId: 'Annie_expressive11_public', voiceId: 'cef3bc4e0a84424cafcde6f2cf466c97' };

  return { avatarId: 'Annie_expressive11_public', voiceId: '42d00d4aac5441279d8536cd6b52c53c' };
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

// ── Per-lesson generation: HeyGen → Sora → gpt-4o-mini-tts → tts-1-hd ─

let heygenSkip = false;
let soraSkip = false;

async function generateForLesson(
  lesson: any,
  courseName: string,
  supabase: any
): Promise<{ success: boolean; videoUrl?: string; method?: string; error?: string }> {
  const script = buildScript(lesson, courseName);
  const instructor = getInstructorForCourse(courseName);
  const voice = VOICE_MAP[instructor.id] || 'nova';

  // 1. HeyGen avatar video
  if (process.env.HEYGEN_API_KEY && !heygenSkip) {
    try {
      const { avatarId, voiceId } = getHeyGenAvatarForCourse(courseName);
      logger.info(`[VideoGen] HeyGen: "${lesson.title}" (${avatarId})`);
      const result = await generateHeyGenVideo(script, avatarId, voiceId);

      await db.from('training_lessons')
        .update({ video_url: result.videoUrl, updated_at: new Date().toISOString() })
        .eq('id', lesson.id);

      return { success: true, videoUrl: result.videoUrl, method: 'heygen' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('INSUFFICIENT_CREDIT') || msg.includes('Insufficient credit')) {
        heygenSkip = true;
        logger.warn('[VideoGen] HeyGen credits depleted — skipping for batch');
      } else {
        logger.warn(`[VideoGen] HeyGen failed: ${msg}`);
      }
    }
  }

  // 2. OpenAI Sora video
  if (!soraSkip) {
    try {
      const prompt = buildSoraPrompt(courseName, lesson.title);
      logger.info(`[VideoGen] Sora: "${lesson.title}"`);
      const result = await generateSoraVideo(prompt, '8', '1280x720');

      await db.from('training_lessons')
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
    const audioUrl = `/generated/lessons/${filename}`;

    await db.from('training_lessons')
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
    const audioUrl = `/generated/lessons/${filename}`;

    await db.from('training_lessons')
      .update({ video_url: audioUrl, updated_at: new Date().toISOString() })
      .eq('id', lesson.id);

    return { success: true, videoUrl: audioUrl, method: 'tts-1-hd' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return { success: false, error: msg };
  }
}

// ── POST /api/admin/generate-lesson-videos ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Reset per-request flags
    heygenSkip = false;
    soraSkip = false;

    const { courseId, lessonId, batchSize = 5 } = await request.json();
    let lessons: any[] = [];

    if (lessonId) {
      const { data } = await db
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .eq('id', lessonId)
        .single();
      if (data) lessons = [data];
    } else if (courseId) {
      const { data } = await db
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .eq('course_id', courseId)
        .or('video_url.is.null,video_url.like.%.mp3')
        .order('lesson_number');
      lessons = data || [];
    } else {
      const { data } = await db
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
      const result = await generateForLesson(lesson, courseName, supabase);
      results.push({ lessonId: lesson.id, title: lesson.title, course: courseName, ...result });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const methods: Record<string, number> = {};
    for (const r of results) {
      if (r.method) methods[r.method] = (methods[r.method] || 0) + 1;
    }

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

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    const { count: total } = await db
      .from('training_lessons')
      .select('*', { count: 'exact', head: true });

    const { count: withRealVideo } = await db
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .not('video_url', 'is', null)
      .not('video_url', 'like', '%.mp3');

    const { count: withMp3 } = await db
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .like('video_url', '%.mp3');

    const { count: noMedia } = await db
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
