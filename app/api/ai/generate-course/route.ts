import { safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { mode, prompt } = await req.json();
    if (!mode || !prompt) return NextResponse.json({ error: 'Missing mode or prompt' }, { status: 400 });

    if (!isAIAvailable()) return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });

    const basePrompts: Record<string, string> = {
      course: 'Generate a full course including title, summary, description, objectives (as array), modules (as array with titles and descriptions), and lessons (as array with titles) in JSON format. Make it comprehensive and educational.',
      module: 'Generate a module with title, description, learning outcomes (as array), and lesson names (as array) in JSON format. Make it detailed and structured.',
      lesson: "Generate a full lesson with title, content (in HTML format), objectives (as array), step-by-step teaching text (in HTML), activities, and summary. Return as JSON with an 'html' field containing the formatted content.",
      quiz: 'Generate a 10-question quiz in JSON format. Each question should have: question text, options (array of 4 choices), correctAnswer (index 0-3), and explanation. Make questions relevant and educational.',
      objectives: 'Generate 5-8 strong, measurable learning objectives in JSON format as an array. Use action verbs (analyze, create, evaluate, etc.) and be specific about what learners will achieve.',
      images: 'Generate 10 detailed AI image prompts in JSON format as an array. Each prompt should describe a relevant educational image for course materials, hero banners, or section illustrations. Be specific about style, composition, and educational context.',
    };

    const finalPrompt = `${basePrompts[mode]}\n\nUser request: ${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are an expert instructional designer and curriculum developer. Create high-quality, engaging educational content that follows best practices in pedagogy and learning design. Always return valid JSON.' },
        { role: 'user', content: finalPrompt },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    const output = response.content;
    let parsedOutput;
    try {
      const cleanOutput = output?.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedOutput = JSON.parse(cleanOutput || '{}');
    } catch {
      parsedOutput = { content: output, raw: true };
    }

    return NextResponse.json({ mode, output: parsedOutput, raw: output, success: true });
  } catch (error) {
    logger.error('AI generation error:', error instanceof Error ? error : new Error(String(error)));
    return safeInternalError(error as Error, 'Failed to generate content');
  }
}
export const POST = withApiAudit('/api/ai/generate-course', _POST);
