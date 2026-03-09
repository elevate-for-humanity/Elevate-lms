import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { lessonScript } from '../lesson1-script';
import { lessonToScenes } from '../../../../lib/autopilot/lesson-to-scenes';
import fs from 'fs/promises';

async function generateScenes() {
  console.log('Generating scenes from lesson script...');

  const result = await lessonToScenes({
    title: 'Introduction to HVAC Systems',
    content: lessonScript,
    description: 'Module 1: Learn the major components of a residential HVAC condenser unit and how technicians inspect them during service calls.',
    lessonNumber: 1,
    courseName: 'HVAC Technician Training',
    courseCategory: 'hvac',
    moduleName: 'HVAC System Overview',
    instructorName: 'Elevate Instructor',
    instructorTitle: 'HVAC Training Program',
  });

  console.log(`Generated ${result.scenes.length} scenes`);
  console.log(`Total duration: ${result.totalDuration}s`);
  console.log(`Image paths: ${result.imagePaths.length}`);

  // Save scenes to JSON for the video renderer
  const outputPath = path.join(process.cwd(), 'courses/hvac/module1', 'lesson1-scenes.json');
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
  console.log(`Scenes saved to ${outputPath}`);

  for (const scene of result.scenes) {
    console.log(`  [${scene.type}] ${scene.duration}s — ${scene.script.substring(0, 80)}...`);
  }
}

generateScenes().catch((err) => {
  console.error('Scene generation failed:', err);
  process.exit(1);
});
