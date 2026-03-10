/**
 * Generate HVAC Module 1 Lesson Video with DALL-E visuals
 *
 * Uses the existing pipeline:
 *   lesson script → lessonToScenes (GPT-4o + DALL-E images)
 *                 → generateVideo (TTS + FFmpeg compositing with background images)
 *                 → final MP4
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { lessonScript } from '../lesson1-script';
import { lessonToScenes, cleanupSceneImages } from '../../../../lib/autopilot/lesson-to-scenes';
import { generateVideo } from '../../../../server/video-generator-v2';
import fs from 'fs/promises';

async function generate() {
  console.log('STEP 1: Converting lesson script to scenes with DALL-E images...');

  const sceneResult = await lessonToScenes({
    title: 'Introduction to HVAC Systems',
    content: lessonScript,
    description: 'Module 1: Learn the major components of a residential HVAC condenser unit.',
    lessonNumber: 1,
    courseName: 'HVAC Technician Training',
    courseCategory: 'hvac',
    moduleName: 'HVAC System Overview',
    instructorName: 'Elevate Instructor',
    instructorTitle: 'HVAC Training Program',
  });

  console.log(`  ${sceneResult.scenes.length} scenes, ${sceneResult.imagePaths.length} images, ${sceneResult.totalDuration}s`);

  console.log('\nSTEP 2: Generating video (TTS + FFmpeg compositing)...');

  const result = await generateVideo({
    title: 'HVAC Module 1 - Introduction to HVAC Systems',
    scenes: sceneResult.scenes,
    settings: {
      format: '16:9',
      resolution: '1080p',
      voiceOver: true,
      backgroundMusic: false,
      voice: 'onyx',
    },
  });

  console.log(`\nResult status: ${result.status}`);
  console.log(`  videoPath: ${result.videoPath}`);
  console.log(`  duration: ${result.duration}s`);

  if (result.status === 'failed') {
    console.error('  Error:', result.error);
    process.exit(1);
  }

  if (result.videoPath) {
    const finalPath = path.join(process.cwd(), 'courses/hvac/module1/output/hvac-module1-lesson1.mp4');
    await fs.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.copyFile(result.videoPath, finalPath);
    const stat = await fs.stat(finalPath);
    console.log(`  Copied to: ${finalPath} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  }

  await cleanupSceneImages(sceneResult.imagePaths);
  console.log('  Temp images cleaned up');
}

generate().catch((err) => {
  console.error('Video generation failed:', err);
  process.exit(1);
});
