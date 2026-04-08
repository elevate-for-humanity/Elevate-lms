import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { code, error, language, filename } = await req.json();

    if (!code || !error) {
      return NextResponse.json({ error: 'Code and error required' }, { status: 400 });
    }

    const prompt = `Fix the following ${language || ''} code error.

File: ${filename || 'unknown'}

Error:
${error}

Code:
\`\`\`${language || ''}
${code}
\`\`\`

Provide ONLY the fixed code, no explanation. Return the complete fixed code.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000,
    });

    let fixedCode = response.choices[0].message.content?.trim() || '';
    
    // Extract code from markdown if present
    const codeMatch = fixedCode.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeMatch) {
      fixedCode = codeMatch[1];
    }

    return NextResponse.json({
      fixedCode,
      usage: response.usage,
    });
  } catch (error) {
    logger.error('Fix error:', error);
    return NextResponse.json(
      { error: 'Failed to fix code' },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/studio/fix', _POST));
