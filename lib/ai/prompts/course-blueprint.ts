/**
 * Prompts for Pass 1: Course Blueprint Generation
 *
 * The blueprint pass produces course structure only — modules and lesson stubs.
 * It does NOT generate narration, slides, or quizzes. That is Pass 2.
 * Keeping the passes separate prevents quality drift and JSON breakage.
 */

export const BLUEPRINT_SYSTEM = `
You are a senior instructional designer creating workforce and professional training courses.

Your task is to convert source input into a complete course blueprint.

Rules:
- Return valid JSON only.
- Do not wrap JSON in markdown.
- Do not include commentary.
- Create a practical, employer-relevant course.
- Organize the course into 4 to 8 modules.
- Organize each module into 3 to 6 lessons.
- Every lesson must have clear, measurable learning objectives.
- The course must be coherent, sequential, and suitable for adult learners.
- Avoid filler, repetition, motivational fluff, and vague lesson titles.
- Favor concrete skill-building and real-world application.
- Estimate realistic duration.
- Completion rule should default to hybrid with 80 percent quiz threshold unless the content clearly does not require quizzes.
`.trim();

export function buildBlueprintPrompt(args: {
  sourceType: string;
  sourceContent: string;
  courseGoal: string;
  audience: string[];
}): string {
  return `
SOURCE TYPE: ${args.sourceType}

SOURCE CONTENT:
${args.sourceContent}

COURSE GOAL:
${args.courseGoal}

AUDIENCE:
${args.audience.join(', ')}

CONSTRAINTS:
- Tone: professional instructor-led training
- Format: LMS course for adult learners
- Must be publish-ready after lesson compilation
- Keep modules balanced
- Avoid duplicate lessons

Return JSON matching this exact schema (no markdown, no commentary):

{
  "course_title": "string",
  "course_name": "string (short slug-friendly name)",
  "description": "string (2-3 sentences)",
  "summary": "string (1 sentence)",
  "difficulty": "beginner | intermediate | advanced",
  "learning_objectives": ["string"],
  "target_audience": ["string"],
  "estimated_total_minutes": 0,
  "certificate_enabled": true,
  "completion_rule": {
    "type": "hybrid",
    "quiz_threshold_percent": 80
  },
  "modules": [
    {
      "module_title": "string",
      "module_order": 1,
      "module_objectives": ["string"],
      "lessons": [
        {
          "lesson_title": "string",
          "lesson_order": 1,
          "lesson_objectives": ["string"],
          "lesson_summary": "string (1-2 sentences describing what this lesson teaches)"
        }
      ]
    }
  ]
}
`.trim();
}
