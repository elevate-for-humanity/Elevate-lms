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
  /** Short Pexels/DALL-E search phrase describing a relevant real-world image for this slide */
  imagePrompt?: string;
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
  /** Entropy seed — include in prompt to guarantee unique output per call */
  seed?: string;
}

const TARGET_WORDS = 400;    // ~2m 45s at 144 WPM
const MIN_WORDS    = 380;    // hard floor — below this, retry
const MAX_WORDS    = 420;    // hard ceiling — above this, retry
const MIN_CONTENT_LENGTH = 500; // chars — below this, enrich with GPT-4o

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

  // Up to 3 attempts — retry if word count falls outside 380-420
  const MAX_ATTEMPTS = 3;
  let parsed: { narration: string; slides: LessonSlide[] } | null = null;
  let wordCount = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const messages: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: prompt },
    ];

    if (attempt > 0 && parsed) {
      const direction = wordCount < MIN_WORDS ? 'too short' : 'too long';
      const target = wordCount < MIN_WORDS
        ? `Expand the concept section to reach 380-420 words.`
        : `Trim the concept section to reach 380-420 words.`;
      messages.push(
        { role: 'assistant', content: JSON.stringify(parsed) },
        { role: 'user', content: `The narration is ${wordCount} words — ${direction}. It MUST be 380-420 words (144 WPM TTS, ~2m 45s). ${target} Return the same JSON format.` },
      );
    }

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: attempt === 0 ? 0.7 : 0.5, // slightly higher temp on first call for variety
      max_tokens: 3000,
    });

    const raw = res.choices[0].message.content;
    if (!raw) throw new Error('No response from GPT-4o');

    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    parsed = JSON.parse(cleaned) as { narration: string; slides: LessonSlide[] };
    wordCount = parsed.narration.split(/\s+/).length;

    if (wordCount >= MIN_WORDS && wordCount <= MAX_WORDS) break;
    console.warn(`  ⚠ Attempt ${attempt + 1}: ${wordCount} words (target ${MIN_WORDS}-${MAX_WORDS}) — retrying`);
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
SEED: ${input.seed ?? input.title} (use this to vary your word choices and examples — do not include it in output)

EXISTING LESSON CONTENT (use this as source material):
${plainContent.slice(0, 4000)}

NEXT LESSON: ${input.nextLessonTitle || 'End of module'}

Generate a structured lesson script with EXACTLY 5 segments. Target 380-420 words total narration. The TTS voice speaks at ~144 WPM, so 400 words = ~2 minutes 45 seconds.

SEGMENT 1 — INTRO (~30 words)
Introduce the lesson title and what the apprentice will learn.

SEGMENT 2 — CONCEPT EXPLANATION (~250 words)
Cover 2-3 key points from the lesson content. Speak like a master barber instructor teaching an apprentice in the shop. Use real barbershop examples, tool names, and technique names.

SEGMENT 3 — TECHNIQUE WALKTHROUGH (~60 words)
Walk through one specific step or technique from this lesson as if demonstrating it.

SEGMENT 4 — JOB APPLICATION (~40 words)
One sentence on how this applies in the chair or on the state board exam.

SEGMENT 5 — WRAP-UP (~20 words)
Summarize in one sentence. Preview: "${input.nextLessonTitle || 'the next topic'}".

Return ONLY valid JSON (no markdown fences):
{
  "narration": "Full narration text, all 5 segments combined as one continuous script. Use natural spoken language as a master barber instructor. Do not include segment labels in the narration.",
  "slides": [
    { "title": "Slide Title", "bullets": ["bullet 1", "bullet 2", "bullet 3"], "segment": "intro", "imagePrompt": "2-5 word Pexels search phrase for a real barbershop photo matching this slide topic" },
    { "title": "Subtopic 1", "bullets": ["...", "..."], "segment": "concept", "imagePrompt": "..." },
    { "title": "Subtopic 2", "bullets": ["...", "..."], "segment": "concept", "imagePrompt": "..." },
    { "title": "Subtopic 3", "bullets": ["...", "..."], "segment": "concept", "imagePrompt": "..." },
    { "title": "Technique Walkthrough", "bullets": ["Step 1...", "Step 2..."], "segment": "visual", "imagePrompt": "..." },
    { "title": "In the Chair", "bullets": ["...", "..."], "segment": "application", "imagePrompt": "..." },
    { "title": "Lesson Summary", "bullets": ["...", "..."], "segment": "wrapup", "imagePrompt": "..." }
  ]
}

CRITICAL RULES:
- Max 5 bullets per slide, short phrases not sentences
- 6-8 slides total
- **NARRATION MUST BE BETWEEN 380 AND 420 WORDS.** The TTS voice speaks at ~144 WPM, so 400 words = ~2m 45s. Under 350 words = too short. Over 450 = too long.
- Each concept subtopic should be 150-200 words of narration with examples
- Narration should explain the bullets, not repeat them verbatim
- imagePrompt: 2-5 word Pexels search phrase for a real barbershop photo (e.g. "barber cutting hair", "barbershop tools clipper", "barber client consultation"). Must be a real-world photo subject, no abstract terms.`;
}

function buildFullGenerationPrompt(input: LessonInput): string {
  return `You are a master barber instructor creating lesson content for a DOL-registered barber apprenticeship program in Indiana.

COURSE: ${input.courseName}
MODULE ${input.moduleNumber}: ${input.moduleName}
LESSON ${input.lessonNumber}: ${input.title}
DESCRIPTION: ${input.description}
TOPICS: ${input.topics.join(', ')}
NEXT LESSON: ${input.nextLessonTitle || 'End of module'}
SEED: ${input.seed ?? input.title} (use this to vary your word choices and examples — do not include it in output)

This lesson has minimal existing content. Generate a complete lesson from scratch.

Teach "${input.title}" as part of the Indiana Registered Barber License apprenticeship program. Students are adult learners working in a barbershop. Content must be practical, technique-focused, and aligned with Indiana State Board and NIC exam standards.

Generate a structured lesson script with EXACTLY 5 segments. Target 380-420 words total narration. The TTS voice speaks at ~144 WPM, so 400 words = ~2 minutes 45 seconds.

SEGMENT 1 — INTRO (~30 words): Introduce the lesson and what the apprentice will learn.
SEGMENT 2 — CONCEPT (~250 words): 2-3 key points, real barbershop examples, master barber instructor voice.
SEGMENT 3 — TECHNIQUE (~60 words): One specific step demonstrated as if in the shop.
SEGMENT 4 — APPLICATION (~40 words): How this applies in the chair or on the state board exam.
SEGMENT 5 — WRAP-UP (~20 words): One sentence summary. Preview: "${input.nextLessonTitle || 'the next topic'}".

Return ONLY valid JSON (no markdown fences):
{
  "narration": "Full narration text, all 5 segments combined. Natural spoken language as a master barber instructor. No segment labels.",
  "slides": [
    { "title": "Slide Title", "bullets": ["bullet 1", "bullet 2"], "segment": "intro", "imagePrompt": "2-5 word Pexels search phrase for a real barbershop photo" },
    { "title": "Key Concept", "bullets": ["...", "..."], "segment": "concept", "imagePrompt": "..." },
    { "title": "Technique", "bullets": ["Step 1", "Step 2"], "segment": "visual", "imagePrompt": "..." },
    { "title": "In the Chair", "bullets": ["...", "..."], "segment": "application", "imagePrompt": "..." },
    { "title": "Summary", "bullets": ["...", "..."], "segment": "wrapup", "imagePrompt": "..." }
  ]
}

CRITICAL RULES:
- Max 5 bullets per slide, short phrases only
- 5-6 slides total
- **NARRATION MUST BE 380-420 WORDS EXACTLY**
- Use correct barber terminology: guard sizes, clipper angles, razor technique, state board standards
- imagePrompt: real barbershop photo search (e.g. "barber fade haircut", "straight razor shave", "barbershop clippers"). No abstract terms.`;
}
