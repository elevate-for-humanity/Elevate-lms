/**
 * Batch video generation script
 * Run: DOTENV_CONFIG_PATH=.env.local npx tsx scripts/generate-videos-batch.ts
 *
 * Generates lesson audio using gpt-4o-mini-tts with instructor personalities.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const HEYGEN_KEY = process.env.HEYGEN_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

// ── Instructor mapping ──────────────────────────────────────────────────

interface InstructorConfig {
  voice: string;
  instructions: string;
}

function getInstructor(courseName: string): InstructorConfig {
  const name = courseName.toLowerCase();

  if (name.includes('cna') || name.includes('medical') || name.includes('phlebotomy') ||
      name.includes('pharmacy') || name.includes('dental') || name.includes('emt') ||
      name.includes('health') || name.includes('cpr') || name.includes('direct support') ||
      name.includes('ekg') || name.includes('patient care'))
    return { voice: 'nova', instructions: 'Speak as a warm, knowledgeable healthcare instructor. Calm, reassuring tone with clear enunciation. Pace for note-taking.' };

  if (name.includes('hvac') || name.includes('solar') || name.includes('building') ||
      name.includes('forklift') || name.includes('manufacturing') || name.includes('diesel') ||
      name.includes('automotive') || name.includes('maintenance') || name.includes('welding') ||
      name.includes('electrical') || name.includes('plumbing') || name.includes('construction'))
    return { voice: 'onyx', instructions: 'Speak as an experienced trades instructor on a job site. Direct, practical, encouraging. Confident, steady pace.' };

  if (name.includes('cdl') || name.includes('trucking') || name.includes('driving') ||
      name.includes('warehouse') || name.includes('logistics'))
    return { voice: 'fable', instructions: 'Speak as a veteran truck driver turned instructor. Straightforward, safety-focused, supportive. Calm, authoritative tone.' };

  if (name.includes('barber') || name.includes('hair') || name.includes('nail') ||
      name.includes('esthetician') || name.includes('cosmetology') || name.includes('beauty'))
    return { voice: 'echo', instructions: 'Speak as a master barber teaching in a shop. Personable, energetic, real. Mix professionalism with approachable warmth.' };

  if (name.includes('cyber') || name.includes('web') || name.includes('data') ||
      name.includes('it support') || name.includes('technology') || name.includes('security officer'))
    return { voice: 'shimmer', instructions: 'Speak as a patient IT instructor. Break down technical concepts clearly. Encouraging, friendly, measured pace.' };

  if (name.includes('tax') || name.includes('bookkeeping') || name.includes('business') ||
      name.includes('entrepreneur') || name.includes('insurance') || name.includes('real estate') ||
      name.includes('administrative') || name.includes('customer service') || name.includes('nrf'))
    return { voice: 'alloy', instructions: 'Speak as a business coach. Professional, motivating, clear. Upbeat but grounded tone.' };

  if (name.includes('recovery') || name.includes('reentry') || name.includes('peer') ||
      name.includes('life coach') || name.includes('community') || name.includes('culinary') ||
      name.includes('hospitality') || name.includes('early childhood'))
    return { voice: 'nova', instructions: 'Speak as a compassionate community instructor. Warm, supportive, encouraging. Gentle but clear pace.' };

  return { voice: 'nova', instructions: 'Speak as a professional instructor. Clear, warm, engaging. Pace for students.' };
}

function buildScript(lesson: any, courseName: string): string {
  const content = (lesson.content || '').substring(0, 400);
  const topics = Array.isArray(lesson.topics) ? lesson.topics.join(', ') : '';
  const topicLine = topics ? ` Today we will cover: ${topics}.` : '';
  return `Welcome to ${courseName}, Lesson ${lesson.lesson_number}: ${lesson.title}. ${content}${topicLine} Let's get started.`.trim();
}

// ── Generation ──────────────────────────────────────────────────────────

async function generateTTS(lessonId: string, script: string, courseName: string): Promise<string> {
  const { voice, instructions } = getInstructor(courseName);

  const outputDir = path.join(process.cwd(), 'public', 'generated', 'lessons');
  await mkdir(outputDir, { recursive: true });
  const filename = `lesson-${lessonId}.mp3`;
  const outputPath = path.join(outputDir, filename);

  // Try gpt-4o-mini-tts first (natural voice with personality)
  try {
    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: voice as any,
      input: script,
      instructions,
      response_format: 'mp3',
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, buffer);
    return `/generated/lessons/${filename}`;
  } catch (err) {
    console.log(`  gpt-4o-mini-tts failed, trying tts-1-hd...`);
  }

  // Fallback to tts-1-hd
  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: voice as any,
    input: script,
    response_format: 'mp3',
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
  return `/generated/lessons/${filename}`;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Elevate LMS Video Generation ===\n');

  if (!OPENAI_KEY) {
    console.error('OPENAI_API_KEY not set');
    process.exit(1);
  }

  // Get all lessons needing generation (no video or MP3 only)
  const { data: lessons, error } = await supabase
    .from('training_lessons')
    .select('*, training_courses(course_name)')
    .or('video_url.is.null,video_url.like.%.mp3')
    .order('created_at');

  if (error) {
    console.error('DB error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${lessons?.length || 0} lessons needing generation`);
  console.log(`OpenAI: ✅  |  HeyGen: ${HEYGEN_KEY ? '✅ (but 0 API credits)' : '❌'}`);
  console.log(`Using: gpt-4o-mini-tts with instructor personalities\n`);

  if (!lessons || lessons.length === 0) {
    console.log('All lessons have media. Done.');
    return;
  }

  let success = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const courseName = lesson.training_courses?.course_name || 'Course';
    const script = buildScript(lesson, courseName);

    process.stdout.write(`[${i + 1}/${lessons.length}] ${courseName} — ${lesson.title}... `);

    try {
      const audioUrl = await generateTTS(lesson.id, script, courseName);

      await supabase
        .from('training_lessons')
        .update({ video_url: audioUrl, updated_at: new Date().toISOString() })
        .eq('id', lesson.id);

      success++;
      console.log(`✅ ${audioUrl}`);
    } catch (err: any) {
      failed++;
      console.log(`❌ ${err.message}`);
    }

    // Rate limit: ~1.5s between calls
    await new Promise(r => setTimeout(r, 1500));

    // Progress every 50
    if ((i + 1) % 50 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const rate = Math.round(success / (elapsed / 60));
      console.log(`\n--- Progress: ${success} done, ${failed} failed, ${elapsed}s elapsed, ~${rate}/min ---\n`);
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n=== COMPLETE ===`);
  console.log(`Success: ${success} | Failed: ${failed} | Time: ${totalTime}s`);
}

main().catch(console.error);
