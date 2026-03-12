/**
 * Full lesson generation pipeline for HVAC EPA 608 course.
 *
 * For each lesson:
 *   1. GPT-4o generates the teaching script + 4 key labels + 5 quiz questions + recap topics
 *   2. DALL-E 3 generates component diagrams (technical lessons only)
 *   3. OpenAI TTS (onyx voice) generates Brandon's audio
 *   4. FFmpeg composites: static Brandon PiP + diagram + labels + audio → mp4
 *   5. Whisper transcribes the audio for captions
 *   6. Outputs: video mp4, captions JSON, quiz JSON, recap JSON
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/generate-all-lessons.ts
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/generate-all-lessons.ts --lesson 10
 *   DOTENV_CONFIG_PATH=.env.local npx tsx scripts/generate-all-lessons.ts --module 6
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ── Config ──────────────────────────────────────────────────────────────

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';

const BRANDON_IMG = path.resolve('public/images/brandon-instructor.png');
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const OUT_DIR = path.resolve('temp/generated-lessons');
const TTS_VOICE = 'onyx' as const;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Types ───────────────────────────────────────────────────────────────

interface LessonRow {
  id: string;
  lesson_number: number;
  title: string;
  video_url: string | null;
}

interface GeneratedLesson {
  script: string;
  labels: { text: string; fadeInSec: number }[];
  quiz: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
  recap: { title: string; description: string }[];
  needsDiagram: boolean;
  diagramPrompt: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Step 1: Generate lesson content with GPT-4o ─────────────────────────

async function generateLessonContent(
  lessonNumber: number,
  title: string,
  allLessons: LessonRow[]
): Promise<GeneratedLesson> {
  // Determine context: what module, what came before
  const moduleNum = Math.ceil(lessonNumber / 6); // approximate
  const isQuizLesson = title.toLowerCase().includes('quiz') || title.toLowerCase().includes('exam');
  const isLabLesson = title.toLowerCase().includes('lab');
  const isOrientationLesson = lessonNumber <= 4;
  const isCareerLesson = lessonNumber >= 90;
  const isTechnicalLesson = !isQuizLesson && !isOrientationLesson && !isCareerLesson;

  const systemPrompt = `You are an expert HVAC instructor creating lesson content for an EPA 608 certification course. 
The student is training to pass the EPA 608 Universal certification exam.
Every piece of content must be accurate to EPA 608 exam standards.
Write in a clear, direct teaching voice — like you're explaining to a student face-to-face.`;

  const userPrompt = `Generate content for Lesson ${lessonNumber}: "${title}"

Return a JSON object with these fields:
{
  "script": "The full teaching script Brandon will read aloud (300-500 words). Teach the topic clearly. Reference specific EPA 608 exam content where relevant. End with a transition to the quiz.",
  "labels": [
    {"text": "Key Term 1", "fadeInSec": 3},
    {"text": "Key Term 2", "fadeInSec": 8},
    {"text": "Key Term 3", "fadeInSec": 14},
    {"text": "Key Term 4", "fadeInSec": 20}
  ],
  "quiz": [
    {
      "id": "l${lessonNumber}-q1",
      "question": "EPA 608 exam-style question?",
      "options": ["Wrong answer", "Correct answer", "Wrong answer", "Wrong answer"],
      "correctAnswer": 1,
      "explanation": "Detailed explanation of WHY this is correct, referencing what Brandon taught in the video. 2-3 sentences that recap the concept."
    }
  ],
  "recap": [
    {"title": "Topic Name", "description": "1-2 sentence summary of what was covered"}
  ],
  "needsDiagram": ${isTechnicalLesson},
  "diagramPrompt": ${isTechnicalLesson ? '"A detailed 3D technical diagram of [specific component] on a dark navy (#0A1628) background, labeled components visible, professional HVAC training style, 1792x1024"' : 'null'}
}

Requirements:
- script: 300-500 words, conversational teaching tone, references EPA 608 where applicable
- labels: exactly 4 key terms that appear on screen during the video, spaced ~5-7 seconds apart
- quiz: exactly 5 multiple-choice questions with 4 options each, EPA 608 exam style, each with a detailed explanation
- recap: 4-5 topic summaries shown before the quiz
- needsDiagram: true for technical lessons, false for orientation/career/quiz lessons
- diagramPrompt: specific DALL-E prompt for the main diagram, or null
- correctAnswer: 0-based index

${isQuizLesson ? 'This is a quiz/exam lesson. The script should introduce the quiz, remind students of key concepts, and encourage them. No diagram needed.' : ''}
${isLabLesson ? 'This is a hands-on lab lesson. The script should walk through the procedure step by step. Include safety warnings.' : ''}
${isOrientationLesson ? 'This is an orientation lesson. Keep it welcoming and informational. No technical diagrams.' : ''}
${isCareerLesson ? 'This is a career readiness lesson. Focus on practical job-seeking advice. No technical diagrams.' : ''}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = JSON.parse(response.choices[0].message.content!);
  return content as GeneratedLesson;
}

// ── Step 2: Generate DALL-E diagram ─────────────────────────────────────

async function generateDiagram(
  prompt: string,
  lessonNumber: number
): Promise<string> {
  const outPath = path.join(OUT_DIR, `lesson-${lessonNumber}`, 'diagram.png');

  if (fs.existsSync(outPath)) {
    console.log(`    Diagram exists, skipping`);
    return outPath;
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'standard',
  });

  const imageUrl = response.data[0].url!;

  // Download
  const res = await fetch(imageUrl);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);

  // Scale to 1280x720 for video
  const scaledPath = path.join(OUT_DIR, `lesson-${lessonNumber}`, 'diagram-720.png');
  execSync(`ffmpeg -y -i "${outPath}" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0A1628" "${scaledPath}" 2>/dev/null`);

  return scaledPath;
}

// ── Step 3: Generate TTS audio ──────────────────────────────────────────

async function generateTTS(
  script: string,
  lessonNumber: number
): Promise<string> {
  const outPath = path.join(OUT_DIR, `lesson-${lessonNumber}`, 'audio.mp3');

  if (fs.existsSync(outPath)) {
    console.log(`    Audio exists, skipping`);
    return outPath;
  }

  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: TTS_VOICE,
    input: script,
    speed: 0.95, // slightly slower for learning
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  return outPath;
}

// ── Step 4: FFmpeg composite ────────────────────────────────────────────

function compositeVideo(
  audioPath: string,
  diagramPath: string | null,
  labels: { text: string; fadeInSec: number }[],
  title: string,
  lessonNumber: number
): string {
  const outPath = path.join(OUT_DIR, `lesson-${lessonNumber}`, 'video.mp4');

  if (fs.existsSync(outPath)) {
    console.log(`    Video exists, skipping`);
    return outPath;
  }

  // Get audio duration
  const durStr = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`).toString().trim();
  const duration = parseFloat(durStr);

  // Sanitize title for ffmpeg (remove special chars)
  const safeTitle = title.replace(/[^a-zA-Z0-9 &\-]/g, '').substring(0, 50);

  let fc = '';
  let inputs = '';

  if (diagramPath) {
    // Layout: Brandon PiP left + diagram right
    inputs = `-loop 1 -t ${duration} -i "${BRANDON_IMG}" -loop 1 -t ${duration} -i "${diagramPath}" -i "${audioPath}"`;

    fc += `color=c=0x0A1628:s=1280x720:d=${duration}[bg];`;
    fc += `[0:v]scale=350:504[brandon];`;
    fc += `[1:v]scale=820:580[diagram];`;
    fc += `[bg][diagram]overlay=430:80[d1];`;
    fc += `[d1][brandon]overlay=30:130[d2];`;

    // Borders + title
    fc += `[d2]drawbox=x=28:y=128:w=354:h=508:color=white@0.5:t=2,`;
    fc += `drawbox=x=428:y=78:w=824:h=584:color=white@0.3:t=2,`;
    fc += `drawbox=y=0:w=iw:h=65:color=black@0.7:t=fill,`;
    fc += `drawtext=fontfile=${FONT_BOLD}:text='${safeTitle}':fontcolor=white:fontsize=26:x=(w-text_w)/2:y=20,`;
    fc += `drawtext=fontfile=${FONT_BOLD}:text='ELEVATE':fontcolor=white@0.3:fontsize=12:x=1190:y=705,`;
    fc += `drawbox=x=30:y=600:w=350:h=35:color=black@0.7:t=fill,`;
    fc += `drawtext=fontfile=${FONT_REG}:text='Brandon - HVAC Instructor':fontcolor=white@0.9:fontsize=14:x=100:y=608`;

    // Labels
    labels.forEach((label, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = 460 + col * 380;
      const ly = 110 + row * 80;
      const tEnd = duration;
      const safeLabel = label.text.replace(/[^a-zA-Z0-9 &\-\/\.]/g, '');
      const alpha = `if(lt(t,${label.fadeInSec}),0,if(lt(t,${label.fadeInSec}+0.8),min((t-${label.fadeInSec})/0.8\\,1),if(lt(t,${tEnd}),1,0)))`;

      fc += `,drawbox=x=${lx - 8}:y=${ly - 6}:w=260:h=38:color=black@0.8:t=fill:enable='between(t,${label.fadeInSec},${tEnd})'`;
      fc += `,drawtext=fontfile=${FONT_BOLD}:text='${safeLabel}':fontcolor=0x00FF88:fontsize=24:x=${lx}:y=${ly}:alpha='${alpha}':enable='between(t,${label.fadeInSec},${tEnd})'`;

      // Arrow
      const arrowY = ly + 12;
      fc += `,drawbox=x=390:y=${arrowY - 1}:w=${lx - 402}:h=3:color=0x00FF88@0.5:t=fill:enable='between(t,${label.fadeInSec},${tEnd})'`;
      fc += `,drawbox=x=${lx - 10}:y=${arrowY - 5}:w=6:h=12:color=0x00FF88@0.7:t=fill:enable='between(t,${label.fadeInSec},${tEnd})'`;
    });

    // Outro text
    fc += `,drawtext=fontfile=${FONT_BOLD}:text='Start the Quiz Below':fontcolor=0x00FF88:fontsize=28:x=(w-text_w)/2:y=660:alpha='if(lt(t,${duration - 5}),0,min((t-${duration - 5})/0.8\\,1))':enable='gte(t,${duration - 5})'`;

    fc += `[out]`;

    execSync(
      `ffmpeg -y ${inputs} -filter_complex "${fc}" -map "[out]" -map 2:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest "${outPath}" 2>/dev/null`
    );
  } else {
    // No diagram — Brandon full frame with text overlays
    inputs = `-loop 1 -t ${duration} -i "${BRANDON_IMG}" -i "${audioPath}"`;

    fc += `[0:v]scale=1280:720,`;
    fc += `drawbox=y=0:w=iw:h=65:color=black@0.7:t=fill,`;
    fc += `drawtext=fontfile=${FONT_BOLD}:text='${safeTitle}':fontcolor=white:fontsize=26:x=(w-text_w)/2:y=20,`;
    fc += `drawtext=fontfile=${FONT_BOLD}:text='ELEVATE':fontcolor=white@0.3:fontsize=12:x=1190:y=705`;

    // Labels as centered text
    labels.forEach((label) => {
      const safeLabel = label.text.replace(/[^a-zA-Z0-9 &\-\/\.]/g, '');
      const alpha = `if(lt(t,${label.fadeInSec}),0,if(lt(t,${label.fadeInSec}+0.8),min((t-${label.fadeInSec})/0.8\\,1),if(lt(t,${duration}),1,0)))`;
      fc += `,drawtext=fontfile=${FONT_BOLD}:text='${safeLabel}':fontcolor=0x00FF88:fontsize=28:x=(w-text_w)/2:y=660:alpha='${alpha}':enable='between(t,${label.fadeInSec},${label.fadeInSec + 5})'`;
    });

    fc += `,drawtext=fontfile=${FONT_BOLD}:text='Start the Quiz Below':fontcolor=0x00FF88:fontsize=28:x=(w-text_w)/2:y=660:alpha='if(lt(t,${duration - 5}),0,min((t-${duration - 5})/0.8\\,1))':enable='gte(t,${duration - 5})'`;

    fc += `[out]`;

    execSync(
      `ffmpeg -y ${inputs} -filter_complex "${fc}" -map "[out]" -map 1:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -shortest "${outPath}" 2>/dev/null`
    );
  }

  return outPath;
}

// ── Step 5: Whisper transcription ───────────────────────────────────────

async function transcribeAudio(
  audioPath: string,
  lessonNumber: number
): Promise<{ start: number; end: number; text: string }[]> {
  const outPath = path.join(OUT_DIR, `lesson-${lessonNumber}`, 'captions.json');

  if (fs.existsSync(outPath)) {
    console.log(`    Captions exist, skipping`);
    return JSON.parse(fs.readFileSync(outPath, 'utf-8'));
  }

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  const segments = (transcription.segments || []).map((s: any) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  fs.writeFileSync(outPath, JSON.stringify(segments, null, 2));
  return segments;
}

// ── Step 6: Upload to Supabase ──────────────────────────────────────────

async function uploadVideo(
  videoPath: string,
  lessonId: string,
  lessonNumber: number
): Promise<string> {
  const file = fs.readFileSync(videoPath);
  const storagePath = `hvac/hvac-lesson-${String(lessonNumber).padStart(3, '0')}.mp4`;

  const { error } = await supabase.storage
    .from('media')
    .upload(storagePath, file, { contentType: 'video/mp4', upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // Update lesson record
  await supabase
    .from('training_lessons')
    .update({ video_url: publicUrl })
    .eq('id', lessonId);

  return publicUrl;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let filterLesson: number | null = null;
  let filterModule: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lesson' && args[i + 1]) filterLesson = parseInt(args[i + 1]);
    if (args[i] === '--module' && args[i + 1]) filterModule = parseInt(args[i + 1]);
  }

  // Fetch all lessons from DB
  const { data: lessons, error } = await supabase
    .from('training_lessons')
    .select('id, lesson_number, title, video_url')
    .eq('course_id', COURSE_ID)
    .order('lesson_number', { ascending: true });

  if (error || !lessons) {
    console.error('Failed to fetch lessons:', error?.message);
    process.exit(1);
  }

  // Filter
  let toProcess = lessons as LessonRow[];
  if (filterLesson) {
    toProcess = toProcess.filter(l => l.lesson_number === filterLesson);
  } else if (filterModule) {
    // Approximate module boundaries (6 lessons per module)
    const start = (filterModule - 1) * 6 + 1;
    const end = filterModule * 8; // generous range
    toProcess = toProcess.filter(l => l.lesson_number >= start && l.lesson_number <= end);
  }

  console.log(`\n=== HVAC Lesson Generation Pipeline ===`);
  console.log(`Processing ${toProcess.length} of ${lessons.length} lessons\n`);

  ensureDir(OUT_DIR);

  let totalCost = 0;
  let generated = 0;
  let skipped = 0;

  for (const lesson of toProcess) {
    const lessonDir = path.join(OUT_DIR, `lesson-${lesson.lesson_number}`);
    ensureDir(lessonDir);

    // Check if already fully generated
    const videoExists = fs.existsSync(path.join(lessonDir, 'video.mp4'));
    if (videoExists && lesson.video_url && !args.includes('--force')) {
      console.log(`[${lesson.lesson_number}/${lessons.length}] ${lesson.title} — SKIP (already done)`);
      skipped++;
      continue;
    }

    console.log(`[${lesson.lesson_number}/${lessons.length}] ${lesson.title}`);

    try {
      // Step 1: Generate content
      console.log(`  1. Generating script + quiz + recap...`);
      const contentPath = path.join(lessonDir, 'content.json');
      let content: GeneratedLesson;

      if (fs.existsSync(contentPath)) {
        content = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
        console.log(`    Content exists, skipping`);
      } else {
        content = await generateLessonContent(lesson.lesson_number, lesson.title, lessons);
        fs.writeFileSync(contentPath, JSON.stringify(content, null, 2));
        totalCost += 0.01; // ~$0.01 per GPT-4o call
        await sleep(500); // rate limit
      }

      // Step 2: Generate diagram (if needed)
      let diagramPath: string | null = null;
      if (content.needsDiagram && content.diagramPrompt) {
        console.log(`  2. Generating diagram...`);
        diagramPath = await generateDiagram(content.diagramPrompt, lesson.lesson_number);
        totalCost += 0.08;
        await sleep(1000);
      } else {
        console.log(`  2. No diagram needed`);
      }

      // Step 3: Generate TTS audio
      console.log(`  3. Generating TTS audio...`);
      const audioPath = await generateTTS(content.script, lesson.lesson_number);
      const charCount = content.script.length;
      totalCost += (charCount / 1000) * 0.015;
      await sleep(500);

      // Step 4: Composite video
      console.log(`  4. Compositing video...`);
      const videoPath = compositeVideo(
        audioPath,
        diagramPath,
        content.labels,
        lesson.title,
        lesson.lesson_number
      );

      // Step 5: Transcribe
      console.log(`  5. Transcribing captions...`);
      const captions = await transcribeAudio(audioPath, lesson.lesson_number);
      const audioDur = parseFloat(
        execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`).toString().trim()
      );
      totalCost += (audioDur / 60) * 0.006;

      // Step 6: Upload
      console.log(`  6. Uploading to Supabase...`);
      const url = await uploadVideo(videoPath, lesson.id, lesson.lesson_number);
      console.log(`  ✓ Done: ${url}\n`);

      // Save quiz and recap for later wiring
      fs.writeFileSync(path.join(lessonDir, 'quiz.json'), JSON.stringify(content.quiz, null, 2));
      fs.writeFileSync(path.join(lessonDir, 'recap.json'), JSON.stringify(content.recap, null, 2));

      generated++;
      await sleep(1000); // pace API calls
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${err.message}\n`);
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Estimated cost: $${totalCost.toFixed(2)}`);
}

main().catch(console.error);
