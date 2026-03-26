import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json(
      {
        error:
          'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.',
      },
      { status: 500 }
    );
  }

  const pageType = request.nextUrl.searchParams.get('type') || 'home';
  const description = request.nextUrl.searchParams.get('description') || '';

  try {
    const prompt = `Generate a React component for a ${pageType} page. ${description}

Requirements:
- Use TypeScript
- Use Tailwind CSS for styling
- Make it responsive
- Include proper semantic HTML
- Return ONLY the component code, no explanations

Component should be a default export function.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert React developer. Generate clean, production-ready React components with TypeScript and Tailwind CSS.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: 'OpenAI API error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const code = data.choices[0].message.content;

    // Extract code from markdown if present
    const codeMatch = code.match(/```(?:typescript|tsx)?\n([\s\S]*?)\n```/);
    const cleanCode = codeMatch ? codeMatch[1] : code;

    return NextResponse.json({
      code: cleanCode,
      pageType,
      description,
    });
  } catch (error) { 
    logger.error(
      'AI Page Builder error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate page' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/ai/generate-page', _GET);
