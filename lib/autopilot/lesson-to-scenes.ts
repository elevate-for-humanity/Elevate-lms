/**
 * Lesson-to-Scenes Converter
 *
 * Takes lesson content from the DB and generates VideoScene definitions
 * for the video-generator-v2 pipeline. Uses GPT-4o for scene planning
 * and DALL-E for background images.
 *
 * Cost per lesson: ~$0.20 (4 DALL-E images × $0.04 + GPT-4o ~$0.04)
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import type { VideoScene } from '../../server/video-generator-v2';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export interface LessonInput {
  title: string;
  content: string;
  description: string;
  lessonNumber: number;
  courseName: string;
  courseCategory: string; // 'hvac', 'bookkeeping', 'business', etc.
  moduleName: string;
  instructorName: string;
  instructorTitle: string;
}

interface ScenePlan {
  scenes: {
    type: 'title' | 'content' | 'split';
    heading: string;
    bullets: string[];
    script: string;
    imagePrompt: string;
    duration: number;
  }[];
}

/**
 * Convert lesson content into video scenes with AI-generated backgrounds.
 */
export async function lessonToScenes(input: LessonInput): Promise<{
  scenes: VideoScene[];
  imagePaths: string[];
  totalDuration: number;
}> {
  // Strip HTML from content
  const plainContent = input.content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. GPT-4o plans the scenes
  const plan = await planScenes(input, plainContent);

  // 2. Generate DALL-E images for each scene (parallel)
  const tempDir = path.join(process.cwd(), 'temp', `scenes-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const imagePromises = plan.scenes.map(async (scene, i) => {
    const imgPath = path.join(tempDir, `scene-${i}.png`);
    await generateSceneImage(scene.imagePrompt, imgPath);
    return imgPath;
  });

  const imagePaths = await Promise.all(imagePromises);

  // 3. Build VideoScene array
  const scenes: VideoScene[] = plan.scenes.map((scene, i) => ({
    id: `scene-${i}`,
    type: scene.type,
    duration: scene.duration,
    script: scene.script,
    voiceOver: true,
    background: '#0f172a',
    textPosition: scene.type === 'title' ? 'center' as const : 'top' as const,
    animation: i === 0 ? 'fade' as const : 'slide' as const,
    image: imagePaths[i],
    textStyle: {
      fontSize: scene.type === 'title' ? 64 : 48,
      color: '#ffffff',
      fontWeight: scene.type === 'title' ? 'bold' : 'normal',
    },
  }));

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return { scenes, imagePaths, totalDuration };
}

/**
 * Use GPT-4o to plan scenes from lesson content.
 */
async function planScenes(input: LessonInput, plainContent: string): Promise<ScenePlan> {
  const res = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a video producer for a workforce training program. Break this lesson into 5-6 video scenes.

COURSE: ${input.courseName}
MODULE: ${input.moduleName}
LESSON ${input.lessonNumber}: ${input.title}
INSTRUCTOR: ${input.instructorName}, ${input.instructorTitle}

LESSON CONTENT:
${plainContent.slice(0, 4000)}

Create 5-6 scenes. Each scene needs:
- type: "title" for the intro scene, "content" for teaching scenes, "split" for scenes with side-by-side visuals
- heading: short heading (3-6 words)
- bullets: 2-4 key points shown on screen (short phrases)
- script: what the instructor says (40-60 words per scene, conversational teaching tone)
- imagePrompt: DALL-E prompt for a photorealistic background image relevant to the scene topic. Be specific about the ${input.courseCategory} context. Include "professional training environment" or "workplace setting". No text in images.
- duration: seconds (intro=15, content=30-45, closing=15)

Scene 1 must be type "title" introducing the lesson.
Last scene must be a brief wrap-up.
Total duration should be 2.5-3.5 minutes.

Return JSON only:
{
  "scenes": [
    {
      "type": "title",
      "heading": "...",
      "bullets": ["..."],
      "script": "...",
      "imagePrompt": "...",
      "duration": 15
    }
  ]
}`
    }],
  });

  const raw = res.choices[0].message.content || '';
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned) as ScenePlan;
}

/**
 * Generate a DALL-E image and save to disk.
 */
async function generateSceneImage(prompt: string, outputPath: string): Promise<void> {
  const res = await getOpenAI().images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
    style: 'natural',
  });

  const imageUrl = res.data[0]?.url;
  if (!imageUrl) throw new Error('No image URL returned from DALL-E');

  // Download image
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(outputPath, buffer);
}

/**
 * Clean up temporary scene images after video generation.
 */
export async function cleanupSceneImages(imagePaths: string[]): Promise<void> {
  for (const p of imagePaths) {
    await fs.unlink(p).catch(() => {});
  }
  // Try to remove the parent temp directory
  if (imagePaths.length > 0) {
    const dir = path.dirname(imagePaths[0]);
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
