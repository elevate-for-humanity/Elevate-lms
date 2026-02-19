/**
 * Batch Sora video generation
 * Run: DOTENV_CONFIG_PATH=.env.local npx tsx scripts/generate-sora-batch.ts
 *
 * Generates 4-second Sora scene videos for each lesson, 5 in parallel.
 * Updates training_lessons.video_url with the local MP4 path.
 * Keeps the MP3 audio as a separate asset (doesn't overwrite).
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const CONCURRENCY = 5;
const VIDEO_DIR = path.join(process.cwd(), 'public', 'generated', 'videos');

// ── Scene prompts by course category ────────────────────────────────────

function getScenePrompt(courseName: string, lessonTitle: string): string {
  const name = courseName.toLowerCase();
  let scene: string;

  if (name.includes('cna') || name.includes('medical') || name.includes('phlebotomy') ||
      name.includes('pharmacy') || name.includes('dental') || name.includes('emt') ||
      name.includes('health') || name.includes('cpr') || name.includes('ekg') ||
      name.includes('patient care'))
    scene = 'a modern healthcare training classroom with medical equipment, practice mannequins, and students in scrubs learning patient care techniques';

  else if (name.includes('hvac') || name.includes('solar') || name.includes('building') ||
      name.includes('manufacturing') || name.includes('diesel') || name.includes('automotive') ||
      name.includes('maintenance') || name.includes('welding') || name.includes('electrical') ||
      name.includes('plumbing') || name.includes('construction'))
    scene = 'a hands-on skilled trades workshop with tools, workbenches, and students practicing technical skills under instructor guidance';

  else if (name.includes('cdl') || name.includes('trucking') || name.includes('driving') ||
      name.includes('forklift') || name.includes('warehouse') || name.includes('logistics'))
    scene = 'a commercial driving training facility with trucks, a practice yard, and students learning vehicle inspection and driving techniques';

  else if (name.includes('barber') || name.includes('hair') || name.includes('nail') ||
      name.includes('esthetician') || name.includes('cosmetology') || name.includes('beauty'))
    scene = 'a professional barbershop training studio with barber chairs, mirrors, styling tools, and students practicing cutting techniques on mannequin heads';

  else if (name.includes('cyber') || name.includes('web') || name.includes('data') ||
      name.includes('it support') || name.includes('technology'))
    scene = 'a modern computer lab with multiple monitors, networking equipment, and students working on cybersecurity and IT projects';

  else if (name.includes('tax') || name.includes('bookkeeping') || name.includes('business') ||
      name.includes('entrepreneur') || name.includes('insurance') || name.includes('real estate') ||
      name.includes('administrative') || name.includes('customer service') || name.includes('nrf'))
    scene = 'a professional business training classroom with whiteboards, laptops, and students engaged in a business workshop';

  else if (name.includes('culinary') || name.includes('hospitality'))
    scene = 'a commercial kitchen training facility with stainless steel equipment, cooking stations, and students in chef coats preparing dishes';

  else if (name.includes('recovery') || name.includes('reentry') || name.includes('peer') ||
      name.includes('life coach') || name.includes('community'))
    scene = 'a warm community training center with a circle of chairs, whiteboards, and students engaged in group discussion and peer support training';

  else if (name.includes('early childhood'))
    scene = 'a bright early childhood education classroom with learning materials, small tables, and students studying child development';

  else
    scene = 'a modern, well-equipped training classroom with students actively engaged in hands-on learning';

  return `Professional educational training video. ${lessonTitle} lesson for ${courseName}. Show ${scene}. Clean, professional look with warm natural lighting. Slow cinematic camera movement. No text overlays. 16:9 widescreen.`;
}

// ── Generate one video ──────────────────────────────────────────────────

async function generateOne(lessonId: string, courseName: string, lessonTitle: string): Promise<{ success: boolean; file?: string; error?: string }> {
  try {
    const prompt = getScenePrompt(courseName, lessonTitle);

    const video = await openai.videos.create({
      model: 'sora-2',
      prompt,
      seconds: '4',
      size: '1280x720',
    });

    // Poll for completion (max 5 min)
    const start = Date.now();
    while (Date.now() - start < 300000) {
      await new Promise(r => setTimeout(r, 5000));
      const status = await openai.videos.retrieve(video.id);

      if (status.status === 'completed') {
        const response = await openai.videos.downloadContent(video.id, { variant: 'video' });
        const buffer = Buffer.from(await response.arrayBuffer());
        const filename = `lesson-${lessonId}.mp4`;
        writeFileSync(path.join(VIDEO_DIR, filename), buffer);

        const videoUrl = `/generated/videos/${filename}`;
        await supabase.from('training_lessons')
          .update({ video_url: videoUrl, updated_at: new Date().toISOString() })
          .eq('id', lessonId);

        return { success: true, file: videoUrl };
      }

      if (status.status === 'failed') {
        return { success: false, error: status.error?.message || 'Sora failed' };
      }
    }

    return { success: false, error: 'Timed out' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Parallel batch runner ───────────────────────────────────────────────

async function runBatch(items: any[], concurrency: number) {
  let idx = 0;
  let success = 0;
  let failed = 0;
  const total = items.length;
  const startTime = Date.now();

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      const lesson = items[i];
      const courseName = lesson.training_courses?.course_name || 'Course';

      process.stdout.write(`[${i + 1}/${total}] ${courseName} — ${lesson.title}... `);

      const result = await generateOne(lesson.id, courseName, lesson.title);

      if (result.success) {
        success++;
        console.log(`✅ ${result.file}`);
      } else {
        failed++;
        console.log(`❌ ${result.error}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return { success, failed, time: Math.round((Date.now() - startTime) / 1000) };
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Elevate LMS — Sora Video Generation ===\n');

  mkdirSync(VIDEO_DIR, { recursive: true });

  // Get all lessons (skip ones that already have MP4 video URLs)
  const { data: lessons, error } = await supabase
    .from('training_lessons')
    .select('*, training_courses(course_name)')
    .or('video_url.is.null,video_url.like.%.mp3')
    .order('created_at');

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  console.log(`Lessons needing video: ${lessons?.length || 0}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Estimated time: ~${Math.round((lessons?.length || 0) * 70 / CONCURRENCY / 60)} minutes`);
  console.log(`Estimated cost: ~$${Math.round((lessons?.length || 0) * 0.15)}\n`);

  if (!lessons || lessons.length === 0) {
    console.log('All lessons have video. Done.');
    return;
  }

  const { success, failed, time } = await runBatch(lessons, CONCURRENCY);

  console.log(`\n=== COMPLETE ===`);
  console.log(`Success: ${success} | Failed: ${failed} | Time: ${time}s (${Math.round(time / 60)}min)`);
}

main().catch(console.error);
