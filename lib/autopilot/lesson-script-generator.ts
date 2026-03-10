/**
 * Lesson Script Generator
 *
 * Produces a structured 5-segment lesson script (~1,000 words, ~7 min at ~144 WPM)
 * from existing lesson data. Only calls GPT-4o when lesson content is too thin.
 *
 * Calibrated from pilot with chunked TTS (nova voice):
 *   1207 words → 495s (8.3 min, 146 WPM)
 *   982 words → 408s (6.8 min, 144 WPM)
 *   1049 words → 441s (7.3 min, 143 WPM)
 * Sweet spot: 950-1050 words → 6.5-7.3 min
 *
 * Output: narration text + slide definitions for the video renderer.
 *
 * Segment structure:
 *   1. Intro (20s, ~50 words) — module, title, learning objective
 *   2. Concept explanation (4min, ~700 words) — 3-4 subtopics, max 5 bullets each
 *   3. Visual reinforcement (90s, ~150 words) — diagram walkthrough or system overview
 *   4. Job application (45s, ~100 words) — how this applies on the job
 *   5. Wrap-up (20s, ~50 words) — summary + preview next lesson
 */

import OpenAI from 'openai';

export interface LessonSlide {
  title: string;
  bullets: string[];
  segment: 'intro' | 'concept' | 'visual' | 'application' | 'wrapup';
}

export interface LessonScript {
  narration: string;
  slides: LessonSlide[];
  wordCount: number;
  estimatedDuration: number; // seconds
}

interface LessonInput {
  title: string;
  lessonNumber: number;
  moduleName: string;
  moduleNumber: number;
  description: string;
  content: string;       // HTML content from DB
  topics: string[];
  contentType: string;
  nextLessonTitle?: string;
  courseName: string;
}

const TARGET_WORDS = 1000;
const MIN_CONTENT_LENGTH = 500; // chars — below this, we enrich with GPT-4o

/**
 * Strip HTML tags and normalize whitespace
 */
function stripHtml(html: string): string {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a structured lesson script from existing content.
 * Uses GPT-4o only when content is thin.
 */
export async function generateLessonScript(input: LessonInput): Promise<LessonScript> {
  const plainContent = stripHtml(input.content);

  // If content is substantial, derive the script locally + GPT for structure
  // If content is thin, use GPT to generate everything
  const needsEnrichment = plainContent.length < MIN_CONTENT_LENGTH;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = needsEnrichment
    ? buildFullGenerationPrompt(input)
    : buildStructuringPrompt(input, plainContent);

  // Retry up to 2 times if word count is under 900
  const MAX_ATTEMPTS = 2;
  let parsed: { narration: string; slides: LessonSlide[] } | null = null;
  let wordCount = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: prompt },
    ];

    if (attempt > 0 && parsed) {
      messages.push(
        { role: 'assistant', content: JSON.stringify(parsed) },
        { role: 'user', content: `The narration is only ${wordCount} words. It MUST be 950-1,050 words (the TTS voice speaks at 144 WPM, so we need ~1,000 words for a 7-minute video). Expand each concept subtopic to 150-200 words with more examples and explanations. Return the same JSON format with longer narration.` },
      );
    }

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.6,
      max_tokens: 6000,
    });

    const raw = res.choices[0].message.content;
    if (!raw) throw new Error('No response from GPT-4o');

    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleaned) as { narration: string; slides: LessonSlide[] };
    wordCount = parsed.narration.split(/\s+/).length;

    if (wordCount >= 900) break;
  }

  if (!parsed) throw new Error('Failed to generate lesson script');

  // nova voice speaks at ~144 WPM based on pilot calibration with chunked TTS
  const estimatedDuration = Math.round((wordCount / 144) * 60);

  return {
    narration: parsed.narration,
    slides: parsed.slides,
    wordCount,
    estimatedDuration,
  };
}

function buildStructuringPrompt(input: LessonInput, plainContent: string): string {
  return `You are an instructional designer for a workforce training program.

COURSE: ${input.courseName}
MODULE ${input.moduleNumber}: ${input.moduleName}
LESSON ${input.lessonNumber}: ${input.title}
DESCRIPTION: ${input.description}
TOPICS: ${input.topics.join(', ')}

EXISTING LESSON CONTENT (use this as source material):
${plainContent.slice(0, 4000)}

NEXT LESSON: ${input.nextLessonTitle || 'End of module'}

Generate a structured lesson script with EXACTLY 5 segments. Target 950-1,050 words total narration. The TTS voice speaks at ~144 WPM, so 1,000 words = ~7 minutes.

SEGMENT 1 — INTRO (~50 words, ~20 seconds)
Introduce the module number, lesson title, and what the student will learn.

SEGMENT 2 — CONCEPT EXPLANATION (~700 words, ~4 minutes)
Break the existing content into 3-4 subtopics. Each subtopic should be 150-200 words. Explain each clearly with examples from real bookkeeping/QuickBooks work. Do NOT just repeat the bullet points — explain them as an instructor would.

SEGMENT 3 — VISUAL REINFORCEMENT (~150 words, ~90 seconds)
Describe a process, workflow, or system overview that reinforces the concept. Walk through it step by step as if pointing at a diagram.

SEGMENT 4 — JOB APPLICATION (~100 words, ~45 seconds)
Explain how a bookkeeper or QuickBooks user applies this knowledge on the job. Be specific — mention actual tasks, screens, or reports.

SEGMENT 5 — WRAP-UP (~50 words, ~20 seconds)
Summarize what was learned. Preview the next lesson: "${input.nextLessonTitle || 'the next topic'}".

Return ONLY valid JSON (no markdown fences):
{
  "narration": "Full narration text, all 5 segments combined as one continuous script. Use natural spoken language. Do not include segment labels in the narration.",
  "slides": [
    { "title": "Slide Title", "bullets": ["bullet 1", "bullet 2", "bullet 3"], "segment": "intro" },
    { "title": "Subtopic 1", "bullets": ["...", "..."], "segment": "concept" },
    { "title": "Subtopic 2", "bullets": ["...", "..."], "segment": "concept" },
    { "title": "Subtopic 3", "bullets": ["...", "..."], "segment": "concept" },
    { "title": "Process Overview", "bullets": ["Step 1...", "Step 2..."], "segment": "visual" },
    { "title": "On the Job", "bullets": ["...", "..."], "segment": "application" },
    { "title": "Lesson Summary", "bullets": ["...", "..."], "segment": "wrapup" }
  ]
}

CRITICAL RULES:
- Max 5 bullets per slide
- Short phrases, not sentences
- 6-8 slides total
- **NARRATION MUST BE BETWEEN 950 AND 1,050 WORDS.** The TTS voice speaks at ~144 WPM, so 1,000 words = ~7 minutes. Under 900 words = video too short. Over 1,100 = too long.
- Each concept subtopic should be 150-200 words of narration with examples
- Narration should explain the bullets, not repeat them verbatim`;
}

function buildFullGenerationPrompt(input: LessonInput): string {
  return `You are an instructional designer for a workforce training program.

COURSE: ${input.courseName}
MODULE ${input.moduleNumber}: ${input.moduleName}
LESSON ${input.lessonNumber}: ${input.title}
DESCRIPTION: ${input.description}
TOPICS: ${input.topics.join(', ')}
NEXT LESSON: ${input.nextLessonTitle || 'End of module'}

This lesson has minimal existing content. Generate a complete lesson from scratch.

The lesson should teach "${input.title}" as part of a Bookkeeping & QuickBooks Certified User program. Students are adult learners in workforce training. Content must be practical and job-focused.

Generate a structured lesson script with EXACTLY 5 segments. Target 950-1,050 words total narration. The TTS voice speaks at ~144 WPM, so 1,000 words = ~7 minutes.

SEGMENT 1 — INTRO (~50 words, ~20 seconds)
SEGMENT 2 — CONCEPT EXPLANATION (~700 words, ~4 minutes, 3-4 subtopics, each 150-200 words with examples)
SEGMENT 3 — VISUAL REINFORCEMENT (~150 words, ~90 seconds)
SEGMENT 4 — JOB APPLICATION (~100 words, ~45 seconds)
SEGMENT 5 — WRAP-UP (~50 words, ~20 seconds)

Return ONLY valid JSON (no markdown fences):
{
  "narration": "Full narration text, all 5 segments combined. Natural spoken language. No segment labels.",
  "slides": [
    { "title": "Slide Title", "bullets": ["bullet 1", "bullet 2"], "segment": "intro" },
    { "title": "Subtopic", "bullets": ["...", "..."], "segment": "concept" },
    { "title": "Process Overview", "bullets": ["Step 1", "Step 2"], "segment": "visual" },
    { "title": "On the Job", "bullets": ["...", "..."], "segment": "application" },
    { "title": "Summary", "bullets": ["...", "..."], "segment": "wrapup" }
  ]
}

CRITICAL RULES:
- Max 5 bullets per slide, short phrases
- 6-8 slides total
- **NARRATION MUST BE BETWEEN 950 AND 1,050 WORDS.** The TTS voice speaks at ~144 WPM, so 1,000 words = ~7 minutes. Under 900 = too short, over 1,100 = too long.
- Each concept subtopic should be 150-200 words with examples
- Narration explains bullets, does not repeat them verbatim
- Include real QuickBooks Online screen references and bookkeeping terminology`;
}
