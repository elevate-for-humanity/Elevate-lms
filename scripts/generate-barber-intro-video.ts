/**
 * Generate Barber Apprenticeship — Lesson 1 Introduction Video
 *
 * Uses the full course generator pipeline:
 *   GPT-4o scene planning → DALL-E 3 backgrounds → TTS onyx voice → FFmpeg compositor
 *
 * Output: public/videos/barber-lessons/barber-lesson-1.mp4
 *
 * Usage:
 *   pnpm tsx scripts/generate-barber-intro-video.ts
 *   pnpm tsx scripts/generate-barber-intro-video.ts --dry-run
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { lessonToScenes, cleanupSceneImages } from '../lib/autopilot/lesson-to-scenes';
import { generateVideo } from '../server/video-generator-v2';

const OUTPUT = path.join(process.cwd(), 'public/videos/barber-lessons/barber-lesson-1.mp4');
const DRY_RUN = process.argv.includes('--dry-run');

const LESSON = {
  title: 'Welcome to the Barber Apprenticeship',
  lessonNumber: 1,
  moduleName: 'Sanitation & Infection Control',
  courseName: 'Barber Apprenticeship — Elevate for Humanity',
  courseCategory: 'barber',
  instructorName: 'Marcus Johnson',
  instructorTitle: 'Barber Apprenticeship Instructor',
  description: 'Introduction to the DOL-registered barber apprenticeship program — structure, credentials, schedule, and what to expect over 52 weeks.',
  content: `
    This is a United States Department of Labor registered apprenticeship program. You will complete
    2,000 hours total — 500 hours of related technical instruction (this course) and 1,500 hours of
    on-the-job training in a licensed barbershop.

    The program is structured across 52 weeks and 10 subject areas:
    Sanitation and Infection Control (weeks 1-6),
    Anatomy of Skin and Scalp (weeks 7-10),
    Hair Theory and Chemistry (weeks 11-16),
    Indiana State Law and Regulations (weeks 17-20),
    Tools Equipment and Techniques (weeks 21-28),
    Haircutting and Styling (weeks 29-36),
    Shaving and Beard Services (weeks 37-41),
    Client Consultation (weeks 42-45),
    Business and Operations (weeks 46-49),
    and State Board Exam Preparation (weeks 50-52).

    Upon completing 2,000 hours and passing the Indiana State Board written and practical exams,
    you earn your Indiana Barber License. That license qualifies you to practice in Indiana and
    most other states through reciprocity.

    Each week you will complete 1 to 2 lessons in this course and approximately 29 hours of
    on-the-job training in your host shop. Your OJT hours are logged separately and submitted
    to the Department of Labor.

    Each lesson includes a video, reading material, a quiz you must pass at 70 percent or higher,
    and practical exercises tied directly to what you are doing in the shop.

    Attendance and documentation are not optional. WIOA funding requires you to stay current
    with your coursework and your OJT hour submissions. Missing documentation deadlines pauses
    your funding.

    The barbering industry in Indiana is growing. Licensed barbers earn between 35,000 and 65,000
    dollars per year. Shop owners and booth renters earn significantly more. This program gives you
    the credential, the skills, and the professional foundation to build a real career.

    Let us get started.
  `,
};

async function main() {
  console.log('\n=== Barber Lesson 1 — Course Generator Pipeline ===\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Title: ${LESSON.title}`);
  console.log(`Output: ${OUTPUT}\n`);

  if (DRY_RUN) {
    console.log('Step 1: GPT-4o scene planning → would generate ~5 scenes');
    console.log('Step 2: DALL-E 3 → would generate 1 background image per scene');
    console.log('Step 3: TTS onyx → would generate narration audio per scene');
    console.log('Step 4: FFmpeg → would composite scenes into final MP4');
    console.log('\nEstimated cost: ~$0.35 | Estimated duration: ~8-10 min video');
    return;
  }

  // Step 1: GPT-4o plans scenes + DALL-E generates backgrounds
  console.log('Step 1: Planning scenes + generating DALL-E backgrounds...');
  const { scenes, imagePaths, totalDuration } = await lessonToScenes(LESSON);
  console.log(`  → ${scenes.length} scenes | ~${Math.round(totalDuration / 60)} min total`);
  scenes.forEach((s, i) => console.log(`     [${i+1}] ${s.type}: ${(s as any).heading || s.background?.slice(0,40)}`));

  // Step 2: Generate video
  console.log('\nStep 2: Generating video (TTS + FFmpeg)...');
  const result = await generateVideo({
    title: LESSON.title,
    scenes,
    settings: {
      format: '16:9',
      resolution: '720p',
      voiceOver: true,
      backgroundMusic: false,
      voice: 'onyx',
    },
  });

  if (result.status === 'failed') {
    console.error('Video generation failed:', result.error);
    process.exit(1);
  }

  // Move output to final destination
  if (result.videoPath) {
    await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
    await fs.copyFile(result.videoPath, OUTPUT);
    await fs.unlink(result.videoPath).catch(() => {});
  }

  // Cleanup DALL-E temp images
  await cleanupSceneImages(imagePaths);

  const stat = await fs.stat(OUTPUT);
  console.log(`\n✅ Done!`);
  console.log(`   Duration: ~${Math.round((result.duration || totalDuration) / 60)} min`);
  console.log(`   Size:     ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Output:   ${OUTPUT}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
