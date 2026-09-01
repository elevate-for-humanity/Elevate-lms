import { NextRequest, NextResponse } from 'next/server';
import { safeInternalError } from '@/lib/api/safe-error';
import { runAITask, type AITask } from '@/lib/ai/orchestrator';
import { isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODE_CONFIG: Record<string, { task: AITask; instruction: string }> = {
  course: {
    task: 'course_generation',
    instruction:
      'Generate a course blueprint with title, summary, description, measurable objectives, ordered modules, and ordered lessons. Return JSON only.',
  },
  module: {
    task: 'course_generation',
    instruction:
      'Generate one course module with a title, description, measurable learning outcomes, and ordered lesson names. Return JSON only.',
  },
  lesson: {
    task: 'lesson_generation',
    instruction:
      'Generate one complete workforce lesson with objectives, safe HTML teaching content, activities, practical application, and summary. Return JSON only with an html field.',
  },
  quiz: {
    task: 'quiz_generation',
    instruction:
      'Generate ten multiple-choice questions. Each must include question, four options, correctAnswer from 0 through 3, and an explanation. Return a JSON array only.',
  },
  objectives: {
    task: 'course_generation',
    instruction:
      'Generate five to eight measurable learning objectives using observable action verbs. Return a JSON array only.',
  },
  images: {
    task: 'course_generation',
    instruction:
      'Generate ten detailed, accessible visual prompts for original educational images. Include setting, people, action, evidence, composition, and alt-text intent. Return a JSON array only.',
  },
};

function parseStructuredOutput(content: string): unknown {
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  if (!cleaned) throw new Error('AI returned an empty response');
  return JSON.parse(cleaned);
}

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => null);
    const mode = typeof body?.mode === 'string' ? body.mode : '';
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const config = MODE_CONFIG[mode];

    if (!config || !prompt) {
      return NextResponse.json(
        { error: 'A supported mode and non-empty prompt are required' },
        { status: 400 },
      );
    }
    if (!isAIAvailable()) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const response = await runAITask({
      task: config.task,
      prompt: `${config.instruction}\n\nUser request: ${prompt}\n\nReturn valid JSON only. Do not use markdown fences or placeholders.`,
      context: {
        userId: auth.userId ?? undefined,
        topic: prompt.slice(0, 200),
      },
      maxTokens: 4000,
      temperature: 0.4,
    });

    let output: unknown;
    try {
      output = parseStructuredOutput(response.content);
    } catch (error) {
      logger.warn('[generate-course] Structured output validation failed', {
        mode,
        provider: response.provider,
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'AI returned invalid structured course content', retryable: true },
        { status: 502 },
      );
    }

    return NextResponse.json({
      mode,
      output,
      success: true,
      provider: response.provider,
      canonicalOrchestrator: true,
      reviewStatus: 'draft_for_human_review',
    });
  } catch (error) {
    logger.error('AI generation error:', error instanceof Error ? error : new Error(String(error)));
    return safeInternalError(error as Error, 'Failed to generate content');
  }
}

export const POST = withApiAudit('/api/ai/generate-course', _POST);
