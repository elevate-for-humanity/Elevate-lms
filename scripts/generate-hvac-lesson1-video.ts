/**
 * Generate HVAC lesson 1 video using the same pipeline as barber videos.
 * Canvas slide renderer + OpenAI TTS + FFmpeg compositor.
 * Output: public/hvac/videos/lesson-2f172cb2-4657-5460-9b93-f9b062ad8dd2.mp4
 *
 * Usage:
 *   pnpm tsx scripts/generate-hvac-lesson1-video.ts
 *   pnpm tsx scripts/generate-hvac-lesson1-video.ts --dry-run
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs/promises';
import { generateLessonScript } from '../lib/autopilot/lesson-script-generator';
import { generateTextToSpeech } from '../server/tts-service';
import { renderLessonVideo } from '../server/lesson-video-renderer';

const OUTPUT_DIR       = path.join(process.cwd(), 'public/hvac/videos');
const INSTRUCTOR_PHOTO = path.join(process.cwd(), 'public/images/instructors/marcus-johnson.jpg');
const VOICE            = 'onyx';
const DRY_RUN          = process.argv.includes('--dry-run');

const LESSON = {
  uuid:  '2f172cb2-4657-5460-9b93-f9b062ad8dd2',
  slug:  'hvac-01-01',
  title: 'Welcome to HVAC Technician Training',
  lessonNumber: 1,
  moduleName: 'Program Orientation & Workforce Readiness',
  moduleNumber: 1,
  description: 'Program structure, schedule, credentials earned, and career outlook',
  nextLessonTitle: 'WIOA Funding & Support Services',
  courseName: 'HVAC Technician — EPA 608 Certification',
  content: `
    This lesson introduces the full 16-module HVAC training program. You will learn the weekly schedule,
    what credentials you earn (EPA 608 Universal, OSHA 10, CPR/AED), how the classroom and lab time is
    structured, and what employers expect from graduates.

    The HVAC industry has a severe technician shortage. The Bureau of Labor Statistics projects 13% job
    growth through 2031, much faster than average. Starting wages for certified technicians range from
    $16-22/hr, with experienced techs earning $25-40/hr.

    Program structure: 16 modules covering fundamentals, EPA 608 certification (modules 6-10), hands-on
    skills (modules 11-13), OSHA 10 and CPR (modules 14-15), and final exam plus career placement (module 16).

    Attendance requirement: 80% minimum to maintain WIOA funding. Documentation deadlines are hard deadlines.
    Register at indianacareerconnect.com immediately if not already done.

    Career pathway: apprentice → journeyman (8,000 OJT hours) → master technician → contractor.
    EPA 608 Universal certification qualifies you to work on all equipment types.

    Key credentials earned: EPA 608 Universal (federal refrigerant handling certification),
    OSHA 10 (construction safety, DOL wallet card), CPR/AED certification.
  `,
  topics: [
    'Program structure and 16-module overview',
    'EPA 608, OSHA 10, and CPR credentials',
    'HVAC industry job outlook and wages',
    'Attendance and WIOA funding requirements',
    'Career pathway: apprentice to contractor',
  ],
  contentType: 'video',
};

async function main() {
  console.log('=== HVAC Lesson 1 Video Generator ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}\n`);

  const outputPath = path.join(OUTPUT_DIR, `lesson-${LESSON.uuid}.mp4`);
  const tempAudio  = path.join(OUTPUT_DIR, `lesson-${LESSON.uuid}.tmp.mp3`);

  // Step 1: Generate structured script + slides
  console.log('Step 1: Generating lesson script...');
  const script = await generateLessonScript({
    title:           LESSON.title,
    lessonNumber:    LESSON.lessonNumber,
    moduleName:      LESSON.moduleName,
    moduleNumber:    LESSON.moduleNumber,
    description:     LESSON.description,
    content:         LESSON.content,
    topics:          LESSON.topics,
    contentType:     LESSON.contentType,
    nextLessonTitle: LESSON.nextLessonTitle,
    courseName:      LESSON.courseName,
  });

  console.log(`  → ${script.wordCount} words, ~${Math.round(script.estimatedDuration / 60)} min`);
  console.log(`  → ${script.slides.length} slides`);
  script.slides.forEach((s, i) => console.log(`     [${i + 1}] ${s.segment}: ${s.title}`));

  if (DRY_RUN) {
    console.log('\nDry run — stopping here.');
    return;
  }

  // Step 2: Generate TTS audio
  console.log('\nStep 2: Generating TTS audio (onyx)...');
  const audioBuffer = await generateTextToSpeech(script.narration, VOICE, 0.95);
  await fs.writeFile(tempAudio, audioBuffer);
  console.log(`  → ${(audioBuffer.length / 1024 / 1024).toFixed(1)} MB audio`);

  // Step 3: Render video
  console.log('\nStep 3: Rendering video (Canvas + FFmpeg)...');
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const result = await renderLessonVideo(script.slides, tempAudio, outputPath, {
    width:           1280,
    height:          720,
    instructorName:  'Marcus Johnson',
    instructorTitle: 'HVAC Instructor',
    instructorPhoto: INSTRUCTOR_PHOTO,
    accentColor:     '#ea580c',
    courseName:      LESSON.courseName,
  });

  // Cleanup temp audio
  await fs.unlink(tempAudio).catch(() => {});

  console.log(`\n✅ Done!`);
  console.log(`   Duration: ${Math.round(result.duration / 60)} min`);
  console.log(`   Size:     ${(result.fileSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Output:   ${outputPath}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
