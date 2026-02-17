import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { code, language, filename, framework } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 });
    }

    // Detect test framework based on language
    let testFramework = framework;
    if (!testFramework) {
      if (language === 'typescript' || language === 'javascript' || language === 'typescriptreact' || language === 'javascriptreact') {
        testFramework = 'jest';
      } else if (language === 'python') {
        testFramework = 'pytest';
      } else if (language === 'go') {
        testFramework = 'go test';
      } else {
        testFramework = 'unit tests';
      }
    }

    const prompt = `Generate comprehensive unit tests for the following code using ${testFramework}.

File: ${filename || 'unknown'}
Language: ${language || 'unknown'}

Code to test:
\`\`\`${language || ''}
${code}
\`\`\`

Generate tests that:
1. Test all exported functions/classes
2. Include edge cases
3. Test error handling
4. Use descriptive test names

Return ONLY the test code, no explanation.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });

    let tests = response.choices[0].message.content?.trim() || '';
    
    // Extract code from markdown if present
    const codeMatch = tests.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeMatch) {
      tests = codeMatch[1];
    }

    // Generate test filename
    let testFilename = filename || 'test';
    if (testFilename.includes('.')) {
      const parts = testFilename.split('.');
      const ext = parts.pop();
      testFilename = `${parts.join('.')}.test.${ext}`;
    } else {
      testFilename = `${testFilename}.test.ts`;
    }

    return NextResponse.json({
      tests,
      testFilename,
      framework: testFramework,
      usage: response.usage,
    });
  } catch (error) {
    logger.error('Generate tests error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tests' },
      { status: 500 }
    );
  }
}
