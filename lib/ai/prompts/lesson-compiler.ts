/**
 * Prompts for Pass 2: Lesson Compilation
 *
 * Each lesson is compiled independently with full course + module context.
 * This produces narration, slides, exercises, and a 5-question quiz bank.
 */

export const LESSON_COMPILER_SYSTEM = `
You are a professional training facilitator and instructional designer.

Your task is to compile a single LMS lesson into publish-ready teaching assets.

Rules:
- Return valid JSON only.
- Do not wrap JSON in markdown.
- Do not include commentary.
- Use clear instructor voice.
- Write for adult learners in workforce, agency, nonprofit, or professional training contexts.
- Narration must sound like a real instructor, not a chatbot.
- Slide bullets must be concise and presentation-ready.
- Speaker notes must expand on the bullets.
- Include one practical exercise.
- Include exactly 5 quiz questions with 4 options each.
- Explanations must teach, not just state correct/incorrect.
- Avoid generic filler, hype language, and repeated phrasing.
- Estimated minutes should be realistic (narration word count / 130 WPM + 2 min per slide).
- The lesson must align to its objectives and the surrounding course context.
`.trim();

export function buildLessonCompilerPrompt(args: {
  courseTitle: string;
  courseDescription: string;
  audience: string[];
  difficulty: string;
  moduleTitle: string;
  moduleObjectives: string[];
  lessonTitle: string;
  lessonObjectives: string[];
  lessonSummary: string;
}): string {
  return `
COURSE CONTEXT:
Title: ${args.courseTitle}
Description: ${args.courseDescription}
Audience: ${args.audience.join(', ')}
Difficulty: ${args.difficulty}

MODULE CONTEXT:
Module: ${args.moduleTitle}
Module Objectives:
${args.moduleObjectives.map((x) => `- ${x}`).join('\n')}

LESSON BLUEPRINT:
Title: ${args.lessonTitle}
Objectives:
${args.lessonObjectives.map((x) => `- ${x}`).join('\n')}
Summary:
${args.lessonSummary}

STYLE REQUIREMENTS:
- Instructor-led
- Clear and authoritative
- Practical examples
- Workforce/professional relevance
- No fluff
- No first-person autobiographical language

Return valid JSON only matching this exact schema:

{
  "lesson_title": "string",
  "lesson_objectives": ["string"],
  "estimated_minutes": 0,
  "narration_script": "string (600-900 words, instructor voice, second person)",
  "slide_outline": [
    {
      "slide_number": 1,
      "title": "string",
      "bullets": ["string (3-6 bullets, concise, no full sentences)"],
      "speaker_notes": "string (expands on bullets, 1-3 sentences)",
      "visual_suggestion": "string (optional)"
    }
  ],
  "practice_exercise": {
    "title": "string",
    "instructions": "string",
    "expected_outcome": "string"
  },
  "knowledge_check": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string (must exactly match one of the options)",
      "explanation": "string (teaches why correct, why others are wrong)"
    }
  ],
  "instructor_notes": ["string (2-8 facilitation tips)"]
}
`.trim();
}
