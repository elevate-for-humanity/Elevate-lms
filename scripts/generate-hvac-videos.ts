#!/usr/bin/env tsx
/**
 * HVAC Instructional Video Generator
 * 
 * For each video lesson:
 * 1. Pulls lesson content from Supabase DB
 * 2. Uses GPT-4o to create a structured narration script + diagram prompts
 * 3. Generates instructional diagrams via DALL-E 3
 * 4. Generates TTS narration via OpenAI TTS
 * 5. Composites diagrams + audio into MP4 via ffmpeg
 * 6. Uploads to Supabase Storage and updates the lesson record
 */

import { createClient } from '@supabase/supabase-js';
import { COURSE_DEFINITIONS } from '../lib/courses/definitions';
import { HVAC_LESSON_UUID, HVAC_COURSE_ID } from '../lib/courses/hvac-uuids';
import { buildLessonContent, isPlaceholderContent } from '../lib/courses/hvac-content-builder';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const HVAC_DEF = COURSE_DEFINITIONS.find(c => c.slug === 'hvac-technician')!;

const OUT_DIR = '/tmp/hvac-videos';
const VOICE = 'onyx'; // deep male voice for trades instruction
const TTS_MODEL = 'tts-1-hd';
const IMAGE_MODEL = 'dall-e-3';
const GPT_MODEL = 'gpt-4o';

// Scene duration: each diagram shows for this many seconds of narration
const MIN_SCENE_DURATION = 8;
const TARGET_VIDEO_MINUTES = 5; // target ~5 min per video

// ─── OpenAI helpers ─────────────────────────────────────────────

async function callGPT(systemPrompt: string, userPrompt: string): Promise<string> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: GPT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`GPT error: ${JSON.stringify(data)}`);
  return data.choices[0].message.content;
}

async function generateImage(prompt: string, outputPath: string, retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        if (attempt < retries) {
          process.stdout.write(` (retry ${attempt})...`);
          await new Promise(r => setTimeout(r, 3000 * attempt));
          continue;
        }
        throw new Error(`DALL-E error after ${retries} attempts: ${JSON.stringify(data)}`);
      }
      
      const imageUrl = data.data[0].url;
      const imgResp = await fetch(imageUrl);
      const buffer = Buffer.from(await imgResp.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);
      return;
    } catch (err: any) {
      if (attempt >= retries) throw err;
      process.stdout.write(` (retry ${attempt})...`);
      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
}

async function generateTTS(text: string, outputPath: string): Promise<void> {
  const resp = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: text,
      voice: VOICE,
      response_format: 'mp3',
      speed: 0.95,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`TTS error: ${err}`);
  }
  const buffer = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

function getAudioDuration(filePath: string): number {
  const output = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`, { encoding: 'utf8' });
  return parseFloat(output.trim());
}

// ─── Script generation ──────────────────────────────────────────

interface VideoScene {
  narration: string;
  diagramPrompt: string;
}

interface VideoScript {
  title: string;
  scenes: VideoScene[];
}

async function generateScript(lesson: {
  title: string;
  module: string;
  content: string;
}): Promise<VideoScript> {
  const systemPrompt = `You are an HVAC technical training video scriptwriter. You create instructional narration for workforce training videos.

Rules:
- Write clear, direct narration a TTS voice will read aloud
- Each scene covers ONE concept with ONE diagram
- Target 4-6 scenes per video
- Each scene narration should be 60-90 words (about 30-45 seconds spoken)
- Use technical HVAC terminology correctly
- Include diagnostic reasoning ("If you see X, that indicates Y")
- Reference specific measurements, pressures, temperatures where relevant
- For diagram prompts: describe a clean, labeled technical diagram on white background. NO people, NO photos. Just clean engineering-style diagrams with labels and arrows.

Output EXACTLY this JSON format, no markdown:
{"title":"...","scenes":[{"narration":"...","diagramPrompt":"..."},...]}`; 

  const userPrompt = `Create an instructional video script for this HVAC lesson.

Lesson: ${lesson.title}
Module: ${lesson.module}
Content summary: ${lesson.content.substring(0, 2000)}

Generate 4-6 scenes with narration and diagram descriptions.`;

  const raw = await callGPT(systemPrompt, userPrompt);
  
  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = raw;
  if (raw.includes('```')) {
    jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }
  
  return JSON.parse(jsonStr);
}

// ─── Video compositing ─────────────────────────────────────────

function compositeVideo(
  scenes: { imagePath: string; audioPath: string; duration: number }[],
  outputPath: string,
  title: string
): void {
  const tempDir = path.dirname(outputPath);
  const concatFile = path.join(tempDir, 'concat.txt');
  const sceneVideos: string[] = [];

  // Create a video segment for each scene: image + audio
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneVideo = path.join(tempDir, `scene_${i}.mp4`);
    
    // Create video from still image + audio
    execSync(
      `ffmpeg -y -loop 1 -i "${scene.imagePath}" -i "${scene.audioPath}" ` +
      `-c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p ` +
      `-vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:white" ` +
      `-shortest -t ${scene.duration + 1} "${sceneVideo}"`,
      { stdio: 'pipe' }
    );
    sceneVideos.push(sceneVideo);
  }

  // Create concat file
  const concatContent = sceneVideos.map(v => `file '${v}'`).join('\n');
  fs.writeFileSync(concatFile, concatContent);

  // Concatenate all scenes
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`,
    { stdio: 'pipe' }
  );

  // Cleanup scene videos
  for (const v of sceneVideos) {
    try { fs.unlinkSync(v); } catch {}
  }
  try { fs.unlinkSync(concatFile); } catch {}
}

// ─── Main pipeline ──────────────────────────────────────────────

async function processLesson(lesson: {
  defId: string;
  uuid: string;
  title: string;
  module: string;
  content: string;
}, index: number, total: number): Promise<{ success: boolean; videoPath?: string; duration?: number; error?: string }> {
  const lessonDir = path.join(OUT_DIR, lesson.defId);
  fs.mkdirSync(lessonDir, { recursive: true });

  const outputPath = path.join(OUT_DIR, `${lesson.uuid}.mp4`);
  
  // Skip if already generated
  if (fs.existsSync(outputPath)) {
    const dur = getAudioDuration(outputPath);
    console.log(`  [${index}/${total}] SKIP (exists) ${lesson.title} — ${Math.round(dur)}s`);
    return { success: true, videoPath: outputPath, duration: dur };
  }

  try {
    // Step 1: Generate script
    process.stdout.write(`  [${index}/${total}] ${lesson.title}\n`);
    process.stdout.write(`    Generating script...`);
    const script = await generateScript(lesson);
    process.stdout.write(` ${script.scenes.length} scenes\n`);

    const sceneData: { imagePath: string; audioPath: string; duration: number }[] = [];

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const imgPath = path.join(lessonDir, `scene_${i}.png`);
      const audioPath = path.join(lessonDir, `scene_${i}.mp3`);

      // Step 2: Generate diagram
      process.stdout.write(`    Scene ${i + 1}/${script.scenes.length}: diagram...`);
      if (!fs.existsSync(imgPath)) {
        await generateImage(
          `Clean, professional HVAC technical training diagram on white background. ${scene.diagramPrompt}. Style: engineering textbook illustration with clear labels, arrows, and annotations. No people, no photographs. Clean vector-style diagram.`,
          imgPath
        );
      }
      process.stdout.write(` TTS...`);

      // Step 3: Generate TTS
      if (!fs.existsSync(audioPath)) {
        await generateTTS(scene.narration, audioPath);
      }
      
      const duration = getAudioDuration(audioPath);
      process.stdout.write(` ${Math.round(duration)}s\n`);
      
      sceneData.push({ imagePath: imgPath, audioPath: audioPath, duration });
    }

    // Step 4: Composite video
    process.stdout.write(`    Compositing video...`);
    compositeVideo(sceneData, outputPath, lesson.title);
    const totalDuration = getAudioDuration(outputPath);
    process.stdout.write(` ${Math.round(totalDuration)}s total\n`);

    // Cleanup scene files
    try { fs.rmSync(lessonDir, { recursive: true }); } catch {}

    return { success: true, videoPath: outputPath, duration: totalDuration };
  } catch (err: any) {
    console.error(`    ERROR: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Parse CLI args for range
  const startIdx = parseInt(process.argv[2] || '0', 10);
  const endIdx = parseInt(process.argv[3] || '999', 10);

  console.log('═══════════════════════════════════════════════════════');
  console.log('  HVAC INSTRUCTIONAL VIDEO GENERATOR');
  console.log(`  Processing lessons ${startIdx} to ${endIdx}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Get all video lessons
  const videoLessons: Array<{
    defId: string;
    uuid: string;
    title: string;
    module: string;
    content: string;
  }> = [];

  for (const mod of HVAC_DEF.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.type !== 'video') continue;
      const uuid = HVAC_LESSON_UUID[lesson.id];
      
      // Get content from DB
      const { data } = await supabase
        .from('training_lessons')
        .select('content')
        .eq('id', uuid)
        .single();
      
      let content = data?.content || '';
      if (isPlaceholderContent(content)) {
        content = buildLessonContent(lesson.id);
      }
      // Strip HTML
      content = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      videoLessons.push({
        defId: lesson.id,
        uuid,
        title: lesson.title,
        module: mod.title,
        content,
      });
    }
  }

  console.log(`Found ${videoLessons.length} video lessons.\n`);

  // Process requested range
  const subset = videoLessons.slice(startIdx, endIdx + 1);
  let successCount = 0;
  let failCount = 0;
  const results: Array<{ defId: string; uuid: string; title: string; success: boolean; duration?: number }> = [];

  for (let i = 0; i < subset.length; i++) {
    const lesson = subset[i];
    const result = await processLesson(lesson, startIdx + i + 1, videoLessons.length);
    results.push({
      defId: lesson.defId,
      uuid: lesson.uuid,
      title: lesson.title,
      success: result.success,
      duration: result.duration,
    });
    if (result.success) successCount++;
    else failCount++;
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERATION COMPLETE');
  console.log(`  Success: ${successCount} | Failed: ${failCount}`);
  console.log(`  Videos in: ${OUT_DIR}/`);
  
  const totalDuration = results.reduce((s, r) => s + (r.duration || 0), 0);
  console.log(`  Total runtime: ${Math.round(totalDuration / 60)} minutes`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Write results
  fs.writeFileSync(path.join(OUT_DIR, 'generation_results.json'), JSON.stringify(results, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
