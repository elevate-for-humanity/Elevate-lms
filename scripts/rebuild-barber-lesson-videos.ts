/**
 * Rebuilds barber lesson videos using real barbershop footage + TTS narration.
 * Each lesson video = relevant b-roll clip looped to narration length.
 * Replaces the canvas-rendered slide decks.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { barberApprenticeshipBlueprint } from '../lib/curriculum/blueprints/barber-apprenticeship';
import { generateAndSaveAudio } from '../server/tts-service';

const VIDEOS_DIR  = path.join(process.cwd(), 'public/videos/barber-lessons');
const BROLL_DIR   = path.join(process.cwd(), 'public/videos');

// Map lesson slug → best matching b-roll clip
const BROLL_MAP: Record<string, string> = {
  // Sanitation / infection control
  'barber-lesson-1':  'barber-training.mp4',
  'barber-lesson-2':  'course-barber-sanitation.mp4',
  'barber-lesson-3':  'course-barber-sanitation.mp4',
  'barber-lesson-4':  'course-barber-sanitation.mp4',
  'barber-lesson-5':  'course-barber-sanitation.mp4',
  'barber-lesson-6':  'barber-training.mp4',
  // Hair science
  'barber-lesson-8':  'course-barber-shampoo.mp4',
  'barber-lesson-9':  'course-barber-shampoo.mp4',
  'barber-lesson-10': 'course-barber-shampoo.mp4',
  'barber-lesson-11': 'course-barber-shampoo.mp4',
  // Client services
  'barber-lesson-12': 'course-barber-consultation.mp4',
  'barber-lesson-13': 'course-barber-shampoo.mp4',
  // Tools
  'barber-lesson-15': 'course-barber-clipper-techniques.mp4',
  'barber-lesson-16': 'course-barber-scissors.mp4',
  'barber-lesson-17': 'course-barber-razor.mp4',
  'barber-lesson-18': 'course-barber-clipper-techniques.mp4',
  'barber-lesson-19': 'barber-training.mp4',
  'barber-lesson-20': 'course-barber-consultation.mp4',
  // Haircutting
  'barber-lesson-22': 'course-barber-fade.mp4',
  'barber-lesson-23': 'course-barber-fade.mp4',
  'barber-lesson-24': 'course-barber-clipper-techniques.mp4',
  'barber-lesson-25': 'course-barber-scissors.mp4',
  'barber-lesson-26': 'course-barber-lineup.mp4',
  'barber-lesson-27': 'course-barber-scissors.mp4',
  // Shaving
  'barber-lesson-29': 'course-barber-razor.mp4',
  'barber-lesson-30': 'course-barber-razor.mp4',
  'barber-lesson-31': 'course-barber-beard.mp4',
  'barber-lesson-32': 'course-barber-razor.mp4',
  'barber-lesson-33': 'course-barber-beard.mp4',
  // Chemical / color
  'barber-lesson-35': 'course-barber-styling.mp4',
  'barber-lesson-36': 'course-barber-styling.mp4',
  'barber-lesson-37': 'course-barber-styling.mp4',
  // Career / business
  'barber-lesson-38': 'barber-client-experience.mp4',
  'barber-lesson-39': 'barber-client-experience.mp4',
  'barber-lesson-40': 'barber-client-experience.mp4',
  'barber-lesson-41': 'course-barber-fade.mp4',
  'barber-lesson-42': 'barber-client-experience.mp4',
  'barber-lesson-43': 'barber-training.mp4',
  // State board / capstone
  'barber-lesson-44': 'barber-training.mp4',
  'barber-lesson-45': 'barber-training.mp4',
  'barber-lesson-46': 'barber-training.mp4',
  'barber-lesson-47': 'barber-training.mp4',
  'barber-lesson-48': 'barber-training.mp4',
  'barber-lesson-49': 'barber-client-experience.mp4',
};

function buildNarration(title: string, content: string): string {
  // Strip HTML tags
  const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return `${title}. ${plain}`.slice(0, 3000);
}

function getAudioDuration(audioPath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`,
      { encoding: 'utf8' }
    );
    return parseFloat(out.trim()) || 60;
  } catch { return 60; }
}

async function buildLessonVideo(
  slug: string,
  title: string,
  content: string,
  outputPath: string,
) {
  const brollFile = BROLL_MAP[slug] ?? 'barber-training.mp4';
  const brollPath = path.join(BROLL_DIR, brollFile);

  if (!fs.existsSync(brollPath)) {
    console.error(`  ✗ B-roll not found: ${brollFile}`);
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'barber-'));
  try {
    // 1. Generate TTS narration
    const audioPath = path.join(tmp, 'narration.mp3');
    const narration = buildNarration(title, content);
    await generateAndSaveAudio(narration, audioPath, { voice: 'onyx', speed: 0.88 });

    const audioDur = getAudioDuration(audioPath);

    // 2. Loop b-roll to cover the full narration duration
    const loopedVideo = path.join(tmp, 'looped.mp4');
    execSync(
      `ffmpeg -y -stream_loop -1 -i "${brollPath}" -t ${audioDur.toFixed(2)} ` +
      `-c:v libx264 -preset fast -crf 20 -an "${loopedVideo}"`,
      { stdio: 'pipe' }
    );

    // 3. Mux looped video + narration audio
    execSync(
      `ffmpeg -y -i "${loopedVideo}" -i "${audioPath}" ` +
      `-c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`,
      { stdio: 'pipe' }
    );

    const dur = getAudioDuration(outputPath);
    console.log(`  ✓ ${slug} — ${dur.toFixed(0)}s — ${brollFile}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function main() {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  // Delete old canvas-rendered slide videos
  const existing = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.mp4'));
  for (const f of existing) {
    fs.unlinkSync(path.join(VIDEOS_DIR, f));
    console.log(`🗑  Deleted old: ${f}`);
  }

  // Collect all lessons with content
  let lessonNum = 0;
  for (const mod of barberApprenticeshipBlueprint.modules) {
    for (const lesson of mod.lessons) {
      lessonNum++;
      if (!lesson.content) continue;

      const outputPath = path.join(VIDEOS_DIR, `barber-lesson-${lessonNum}.mp4`);
      console.log(`\n[${lessonNum}] ${lesson.title}`);
      await buildLessonVideo(lesson.slug, lesson.title, lesson.content, outputPath);
    }
  }

  console.log('\n✅ All barber lesson videos rebuilt.');
}

main().catch(console.error);
