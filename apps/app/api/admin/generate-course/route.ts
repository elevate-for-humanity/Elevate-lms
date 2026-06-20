/**
 * POST /api/admin/generate-course
 *
 * Accepts a course name + optional parameters, calls OpenAI with the
 * workforce curriculum prompt, and returns a CredentialBlueprint-compatible
 * JSON object ready to be saved as a blueprint file and seeded.
 *
 * The response is NOT automatically seeded — the admin reviews it first,
 * then triggers pnpm seed-course-from-blueprint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

// ── Request shape ─────────────────────────────────────────────────────────────

interface GenerateCourseRequest {
  courseName: string;
  state?: string; // two-letter state code, default 'IN'
  credentialTarget?: string; // 'IC&RC' | 'NAADAC' | 'STATE_BOARD' | 'INTERNAL'
  moduleCount?: number; // 4–10, default 6
  lessonsPerModule?: number; // 3–8, default 5
  includeCheckpoints?: boolean; // default true
  includeFinalExam?: boolean; // default true
  complianceTopics?: string[]; // injected into prompt
  programSlug?: string; // programs.slug to link to
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a workforce curriculum designer specializing in state-aligned training programs.
Your output is always valid JSON that conforms exactly to the schema provided.
You never add commentary, markdown, or explanation outside the JSON object.
All content must be workforce-ready, SAMHSA-aligned where applicable, and suitable for adult learners seeking employment or certification.`;
}

// ── User prompt ───────────────────────────────────────────────────────────────

function buildUserPrompt(req: GenerateCourseRequest): string {
  const {
    courseName,
    state = 'IN',
    credentialTarget = 'STATE_BOARD',
    moduleCount = 6,
    lessonsPerModule = 5,
    includeCheckpoints = true,
    includeFinalExam = true,
    complianceTopics = [
      'Ethics',
      'Confidentiality',
      'Boundaries',
      'Cultural Competency',
      'Documentation',
      'Professional Conduct',
    ],
  } = req;

  const totalLessons =
    moduleCount * lessonsPerModule +
    (includeCheckpoints ? moduleCount : 0) +
    (includeFinalExam ? 1 : 0);
  const slug = courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `Generate a complete workforce training course for: "${courseName}"

Target audience: entry-level participants seeking certification or employment.
State: ${state}
Credential target: ${credentialTarget}
Modules: ${moduleCount}
Lessons per module: ${lessonsPerModule} standard lessons + ${includeCheckpoints ? '1 checkpoint quiz' : 'no checkpoint'}
${includeFinalExam ? 'Include a final exam lesson as the last lesson of the last module.' : ''}
Compliance topics to weave in: ${complianceTopics.join(', ')}

Return a single JSON object matching this exact schema. No markdown, no explanation — only the JSON object.

{
  "id": "${slug}-${state.toLowerCase()}-v1",
  "version": "1.0.0",
  "credentialSlug": "${slug}",
  "credentialTitle": "<full credential name>",
  "credentialCode": "<short code, e.g. IN-PRS>",
  "state": "${state}",
  "programSlug": "${req.programSlug ?? slug}",
  "trackVariants": ["standard"],
  "status": "draft",
  "credentialTarget": "${credentialTarget}",
  "minimumHours": <number — total seat time in hours>,
  "requiresFinalExam": ${includeFinalExam},
  "skipLqs": true,
  "expectedModuleCount": ${moduleCount},
  "expectedLessonCount": ${totalLessons},
  "generationRules": {
    "minModules": ${moduleCount},
    "maxModules": ${moduleCount},
    "minLessonsPerModule": ${lessonsPerModule},
    "maxLessonsPerModule": ${lessonsPerModule + (includeCheckpoints ? 1 : 0)},
    "requireCheckpointPerModule": ${includeCheckpoints},
    "requireFinalExam": ${includeFinalExam},
    "passingScore": 70,
    "allowedLessonTypes": ["lesson", ${includeCheckpoints ? '"checkpoint",' : ''} ${includeFinalExam ? '"exam"' : ''}]
  },
  "videoConfig": {
    "videoGenerator": "runway",
    "template": "elevate-slide",
    "instructorName": "Marcus Johnson",
    "instructorTitle": "Workforce Development Specialist",
    "instructorImagePath": "/images/instructors/marcus-johnson.jpg",
    "topBarColor": "#f97316",
    "accentColor": "#3b82f6",
    "backgroundColor": "#0f172a",
    "ttsVoice": "onyx",
    "ttsSpeed": 0.85,
    "slideCount": 5,
    "segments": ["intro", "concept", "visual", "application", "wrapup"],
    "generateDalleImage": true,
    "dalleImageStyle": "natural",
    "width": 1920,
    "height": 1080
  },
  "modules": [
    // ${moduleCount} modules, each with this shape:
    {
      "slug": "<module-slug>",
      "title": "<Module Title>",
      "orderIndex": 1,
      "domainKey": "<domain-key>",
      "minLessons": ${lessonsPerModule},
      "maxLessons": ${lessonsPerModule + (includeCheckpoints ? 1 : 0)},
      "quizRequired": ${includeCheckpoints},
      "practicalRequired": false,
      "isCritical": false,
      "requiredLessonTypes": ${includeCheckpoints ? '[{"lessonType":"checkpoint","requiredCount":1}]' : '[]'},
      "competencies": [
        {
          "competencyKey": "<competency-key>",
          "isCritical": false,
          "minimumTouchpoints": 1,
          "assessmentMethod": "quiz"
        }
      ],
      "lessons": [
        // ${lessonsPerModule} standard lessons + ${includeCheckpoints ? '1 checkpoint' : 'no checkpoint'}
        // Standard lesson shape:
        {
          "slug": "<module-slug>-lesson-<n>",
          "title": "<Lesson Title>",
          "order": 1,
          "domainKey": "<domain-key>",
          "objective": "<one sentence: what the learner will be able to do>",
          "content": "<full lesson body as HTML — minimum 300 words — include: introduction paragraph, 3-5 key concepts with explanations, real-world example, compliance connection, summary>",
          "durationMinutes": 10
        },
        // Checkpoint lesson (last in module, slug must end in -checkpoint):
        {
          "slug": "<module-slug>-checkpoint",
          "title": "<Module Title> — Knowledge Check",
          "order": ${lessonsPerModule + 1},
          "domainKey": "<domain-key>",
          "objective": "Demonstrate understanding of <module topic>",
          "content": "<brief review HTML>",
          "passingScore": 70,
          "durationMinutes": 10,
          "quizQuestions": [
            // 5 questions minimum, each:
            {
              "id": "q<n>",
              "question": "<question text>",
              "options": ["<A>", "<B>", "<C>", "<D>"],
              "correctAnswer": 0,
              "explanation": "<why this answer is correct>"
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Every standard lesson must have content of at least 300 words as HTML paragraphs
- Every checkpoint must have exactly 5 quiz questions with 4 options each
- Weave compliance topics (${complianceTopics.join(', ')}) naturally into lesson content
- Final exam (if included) must have 10 questions, slug ending in -exam, passingScore 75
- All slugs must be lowercase kebab-case and unique across the entire course
- domainKey values should be short snake_case identifiers matching the module topic
- Career outcomes: list 3-5 job titles and entry-level salary range in the last module's last lesson content`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: GenerateCourseRequest;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  if (!body.courseName?.trim()) {
    return safeError('courseName is required', 400);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return safeError('OPENAI_API_KEY not configured', 503);
  }

  logger.info('[generate-course] Starting generation', {
    courseName: body.courseName,
    userId: auth.id,
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        temperature: 0.3, // low temp = consistent structure
        max_tokens: 16000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(body) },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      logger.error('[generate-course] OpenAI error', undefined, { status: response.status, err });
      return safeError('AI generation failed', 502);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      return safeError('Empty response from AI', 502);
    }

    let blueprint: Record<string, unknown>;
    try {
      blueprint = JSON.parse(raw);
    } catch {
      logger.error('[generate-course] Failed to parse AI JSON', undefined, { raw: raw.slice(0, 500) });
      return safeError('AI returned invalid JSON', 502);
    }

    // Basic structural validation
    const errors: string[] = [];
    if (!blueprint.id) errors.push('missing id');
    if (!blueprint.modules) errors.push('missing modules');
    if (!Array.isArray(blueprint.modules)) errors.push('modules must be array');
    if (errors.length) {
      return safeError(`Blueprint validation failed: ${errors.join(', ')}`, 422);
    }

    logger.info('[generate-course] Generation complete', {
      courseName: body.courseName,
      moduleCount: (blueprint.modules as unknown[]).length,
      userId: auth.id,
    });

    return NextResponse.json({
      blueprint,
      meta: {
        courseName: body.courseName,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4.1',
        tokensUsed: data.usage?.total_tokens ?? null,
        nextStep: `Save as lib/curriculum/blueprints/${blueprint.id}.ts then run: pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint ${blueprint.id}`,
      },
    });
  } catch (err) {
    return safeInternalError(err, 'Course generation failed');
  }
}
