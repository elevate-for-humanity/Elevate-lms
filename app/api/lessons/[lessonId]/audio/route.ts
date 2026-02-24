export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { COURSE_DEFINITIONS } from '@/lib/courses/definitions';
import type { CourseLesson, CourseModule } from '@/lib/courses/definitions';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';

/* ── Paths ──────────────────────────────────────────────────── */

const BASE_DIR = () => path.join(process.cwd(), 'public', 'generated', 'lessons');
const scriptFilePath = (id: string) => path.join(BASE_DIR(), `lesson-full-${id}.txt`);
const audioFilePath = (id: string) => path.join(BASE_DIR(), `lesson-full-${id}.mp3`);
const publicAudioUrl = (id: string) => `/generated/lessons/lesson-full-${id}.mp3`;
const publicScriptUrl = (id: string) => `/generated/lessons/lesson-full-${id}.txt`;

/* ── Lesson lookup ──────────────────────────────────────────── */

interface LessonContext {
  lesson: CourseLesson;
  module: CourseModule;
  moduleIndex: number;
  lessonIndex: number;
  courseName: string;
}

function findLesson(lessonId: string): LessonContext | null {
  for (const course of COURSE_DEFINITIONS) {
    for (let mi = 0; mi < course.modules.length; mi++) {
      const mod = course.modules[mi];
      for (let li = 0; li < mod.lessons.length; li++) {
        if (mod.lessons[li].id === lessonId) {
          return {
            lesson: mod.lessons[li],
            module: mod,
            moduleIndex: mi,
            lessonIndex: li,
            courseName: course.title,
          };
        }
      }
    }
  }
  return null;
}

/* ── Fallback script from lesson definition data (no API needed) ── */

function buildFallbackScript(ctx: LessonContext): string {
  const { lesson, module, moduleIndex, lessonIndex, courseName } = ctx;
  const instructor = getInstructorForCourse(courseName);

  const typeIntro: Record<string, string> = {
    video: `This is a video lecture covering ${lesson.title}.`,
    reading: `This is a reading lesson on ${lesson.title}. Follow along as we go through the material.`,
    quiz: `This is a quiz review for ${lesson.title}. Let's go over the key concepts you need to know.`,
    lab: `This is a hands-on lab session for ${lesson.title}. Pay close attention to the safety requirements and procedures.`,
    assignment: `This is an assignment for ${lesson.title}. Here's what you need to complete.`,
  };

  return `Welcome to ${courseName}. I'm ${instructor.name}, your instructor.

We're in Module ${moduleIndex + 1}: ${module.title}. ${module.description}

Today's lesson is "${lesson.title}". ${typeIntro[lesson.type] || ''}

${lesson.description || ''}

${lesson.durationMinutes ? `This lesson is approximately ${lesson.durationMinutes} minutes.` : ''}

The full AI-generated lecture for this lesson is being prepared and will be available shortly. In the meantime, review the lesson materials and feel free to ask the AI tutor any questions you have.

Remember, this is part of your 15-week HVAC Technician program at Elevate for Humanity. Stay focused, take notes, and don't hesitate to reach out if you need help.

Let's get to work.`.trim();
}

/* ── Full lecture script generation via aiChat (Gemini/OpenAI) ── */

async function generateFullScript(ctx: LessonContext): Promise<string> {
  const { lesson, module, moduleIndex, lessonIndex, courseName } = ctx;
  const instructor = getInstructorForCourse(courseName);

  const rawMinutes = lesson.durationMinutes || 10;
  const targetMinutes = Math.min(rawMinutes, 30);
  const targetWords = targetMinutes * 150;

  const siblingLessons = module.lessons
    .map((l, i) => `  ${i + 1}. ${l.title} (${l.type}${l.durationMinutes ? `, ${l.durationMinutes} min` : ''})`)
    .join('\n');

  const typeGuidance: Record<string, string> = {
    quiz: 'This is a QUIZ REVIEW lesson. Walk through every key concept students will be tested on. Explain common mistakes. Give example questions and talk through the correct answers.',
    lab: 'This is a HANDS-ON LAB lesson. Explain the full procedure step by step. Cover safety requirements, tools needed, PPE, and what competency looks like.',
    reading: 'This is a READING lesson. Narrate the full content as if reading a textbook chapter aloud. Explain every concept in depth with real-world examples.',
    video: 'This is a VIDEO LECTURE lesson. Teach the full content as a complete lecture with real-world examples from job sites.',
    assignment: 'This is an ASSIGNMENT lesson. Explain what students need to do, walk through the requirements, give tips for success.',
  };

  const systemPrompt = `You are ${instructor.name}, ${instructor.title} at Elevate for Humanity. You have 20 years of field experience. Write lecture scripts that sound natural and conversational — exactly as you would speak in a classroom.`;

  const userPrompt = `Write a COMPLETE, FULL-LENGTH lecture script for this lesson. This is the student's primary instruction.

COURSE: ${courseName}
MODULE ${moduleIndex + 1}: ${module.title}
${module.description}

Lessons in this module:
${siblingLessons}

CURRENT LESSON: Lesson ${lessonIndex + 1} — "${lesson.title}"
Type: ${lesson.type}
Description: ${lesson.description || 'N/A'}

${typeGuidance[lesson.type] || typeGuidance.video}

WORD COUNT: Write approximately ${targetWords} words (${targetMinutes} minutes at 150 wpm). This is a FULL lesson, not a summary.

STRUCTURE:
1. Opening (30s): Greet students, state lesson title, preview what they'll learn
2. Main content (${targetMinutes - 2} min): Full topic coverage with examples, safety notes, tips, common mistakes
3. Summary (1 min): Recap key points, preview next lesson

RULES:
- Write EXACTLY as you would speak — natural, conversational
- Use "you" and "we" — talk directly to the student
- NO stage directions, NO timestamps, NO markdown
- Say "In this lesson" not "In this video"`;

  const result = await aiChat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    maxTokens: Math.max(4096, Math.ceil(targetWords * 1.5)),
  });

  let script = result.content;

  // For lessons > 30 min, generate continuation
  if (rawMinutes > 30 && script.length > 100) {
    const remainingMinutes = Math.min(rawMinutes - 30, 30);
    const remainingWords = remainingMinutes * 150;

    const part2 = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: script },
        {
          role: 'user',
          content: `Continue the lecture for ${remainingMinutes} more minutes (~${remainingWords} words). Do NOT re-introduce yourself. Continue teaching, then end with a full summary.`,
        },
      ],
      temperature: 0.7,
      maxTokens: Math.max(4096, Math.ceil(remainingWords * 1.5)),
    });

    if (part2.content.length > 100) {
      script = script + '\n\n' + part2.content;
    }
  }

  return script;
}

/* ── TTS via Gemini native audio or Google Cloud TTS ────────── */

async function convertToAudio(script: string): Promise<Buffer | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleCloudKey = process.env.GOOGLE_CLOUD_API_KEY;

  // Split script into chunks for TTS (most APIs have char limits)
  const MAX_CHARS = 4500;
  const chunks: string[] = [];
  if (script.length <= MAX_CHARS) {
    chunks.push(script);
  } else {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    let current = '';
    for (const sentence of sentences) {
      if ((current + sentence).length > MAX_CHARS && current.length > 0) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
  }

  // Option 1: Google Cloud TTS (free tier: 1M chars/month for standard, 1M for WaveNet)
  if (googleCloudKey) {
    const audioBuffers: Buffer[] = [];
    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 300));
      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleCloudKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: chunks[i] },
            voice: {
              languageCode: 'en-US',
              name: 'en-US-Neural2-D', // Male voice for Marcus Johnson
              ssmlGender: 'MALE',
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 0.95,
              pitch: -1.0,
            },
          }),
        },
      );
      const data = await res.json();
      if (data.audioContent) {
        audioBuffers.push(Buffer.from(data.audioContent, 'base64'));
      } else {
        logger.warn(`[TTS] Google Cloud chunk ${i} failed`);
      }
    }
    if (audioBuffers.length > 0) return Buffer.concat(audioBuffers);
  }

  // Option 2: OpenAI TTS (if available)
  if (process.env.OPENAI_API_KEY) {
    const { getOpenAIClient } = await import('@/lib/openai-client');
    const openai = getOpenAIClient();
    const audioBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 500));
      try {
        const response = await openai.audio.speech.create({
          model: 'gpt-4o-mini-tts',
          voice: 'onyx' as any,
          input: chunks[i],
          instructions: 'Speak as an experienced HVAC trades instructor. Direct, practical, encouraging. Confident steady pace.',
          response_format: 'mp3',
        });
        audioBuffers.push(Buffer.from(await response.arrayBuffer()));
      } catch {
        const response = await openai.audio.speech.create({
          model: 'tts-1-hd',
          voice: 'onyx',
          input: chunks[i],
          response_format: 'mp3',
        });
        audioBuffers.push(Buffer.from(await response.arrayBuffer()));
      }
    }
    if (audioBuffers.length > 0) return Buffer.concat(audioBuffers);
  }

  // No TTS available — return null (client will use browser speech synthesis)
  return null;
}

/* ── Route handler ──────────────────────────────────────────── */

type Params = Promise<{ lessonId: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: Params },
) {
  const { lessonId } = await params;

  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const ctx = findLesson(lessonId);
  if (!ctx) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const audioPath = audioFilePath(lessonId);
  const sPath = scriptFilePath(lessonId);

  // 1. Audio already cached — return immediately
  if (existsSync(audioPath)) {
    return NextResponse.json({ audioUrl: publicAudioUrl(lessonId), cached: true });
  }

  // 2. No AI provider available
  if (!isAIAvailable()) {
    return NextResponse.json({
      audioUrl: null,
      scriptUrl: null,
      reason: 'no_ai_provider',
      message: 'Set GEMINI_API_KEY or OPENAI_API_KEY to enable lesson generation.',
    });
  }

  try {
    const dir = BASE_DIR();
    await mkdir(dir, { recursive: true });

    // Load pre-generated script, or generate on demand, or use lesson data as fallback
    let script: string;
    if (existsSync(sPath)) {
      script = await readFile(sPath, 'utf-8');
    } else if (isAIAvailable()) {
      try {
        logger.info(`[LessonAudio] Generating script for ${lessonId}`);
        // 15s timeout — if AI is slow/rate-limited, fall back immediately
        const result = await Promise.race([
          generateFullScript(ctx),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
        ]);
        script = result;
        await writeFile(sPath, script, 'utf-8');
      } catch (genErr) {
        logger.warn(`[LessonAudio] Generation failed for ${lessonId}, using fallback`);
        script = buildFallbackScript(ctx);
        await writeFile(sPath, script, 'utf-8');
      }
    } else {
      // No AI available — build script from lesson definition data
      script = buildFallbackScript(ctx);
      await writeFile(sPath, script, 'utf-8');
    }

    if (!script || script.length < 20) {
      return NextResponse.json({
        audioUrl: null,
        scriptUrl: null,
        reason: 'no_content',
      });
    }

    const wordCount = script.split(/\s+/).length;
    const estimatedMinutes = Math.round(wordCount / 150);

    // Try to generate audio
    logger.info(`[LessonAudio] Converting ${lessonId} to audio (${wordCount} words, ~${estimatedMinutes} min)`);
    const audioBuffer = await convertToAudio(script);

    if (audioBuffer) {
      await writeFile(audioPath, audioBuffer);
      logger.info(`[LessonAudio] Done: ${lessonId}`);
      return NextResponse.json({
        audioUrl: publicAudioUrl(lessonId),
        scriptUrl: publicScriptUrl(lessonId),
        cached: false,
        words: wordCount,
        estimatedMinutes,
      });
    }

    // No TTS available — return script URL for browser-side speech synthesis
    return NextResponse.json({
      audioUrl: null,
      scriptUrl: publicScriptUrl(lessonId),
      words: wordCount,
      estimatedMinutes,
      useBrowserTTS: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.error(`[LessonAudio] Failed for ${lessonId}: ${msg}`);
    return NextResponse.json(
      { error: 'Generation failed', audioUrl: null },
      { status: 500 },
    );
  }
}
