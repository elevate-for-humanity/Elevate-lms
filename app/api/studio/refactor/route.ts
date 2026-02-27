import { logger } from '@/lib/logger';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { files, oldName, newName, type } = await req.json();

    if (!files || !oldName || !newName) {
      return NextResponse.json(
        { error: 'files, oldName, and newName required' },
        { status: 400 }
      );
    }

    // For simple renames, do string replacement
    if (type === 'simple') {
      const results = files.map((file: { path: string; content: string }) => {
        const updatedContent = file.content
          .replace(new RegExp(`\\b${escapeRegex(oldName)}\\b`, 'g'), newName);
        
        return {
          path: file.path,
          content: updatedContent,
          changed: updatedContent !== file.content,
        };
      });

      return NextResponse.json({
        results: results.filter((r: { changed: boolean }) => r.changed),
        totalFiles: files.length,
        changedFiles: results.filter((r: { changed: boolean }) => r.changed).length,
      });
    }

    // For intelligent refactoring, use AI
    const prompt = `Refactor the following code files to rename "${oldName}" to "${newName}".

Update all references including:
- Variable/function/class declarations
- Import/export statements
- Type references
- Comments and documentation
- String literals that reference the name

Files:
${files.map((f: { path: string; content: string }) => `
--- ${f.path} ---
${f.content.slice(0, 3000)}
`).join('\n')}

Return a JSON array with the updated files:
[
  { "path": "file/path.ts", "content": "updated content..." },
  ...
]

Only include files that need changes.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 8000,
    });

    let result = response.choices[0].message.content || '[]';
    
    // Extract JSON from response
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      result = jsonMatch[0];
    }

    const updatedFiles = JSON.parse(result);

    return NextResponse.json({
      results: updatedFiles,
      totalFiles: files.length,
      changedFiles: updatedFiles.length,
      usage: response.usage,
    });
  } catch (error) {
    logger.error('Refactor error:', error);
    return NextResponse.json(
      { error: 'Failed to refactor' },
      { status: 500 }
    );
  }
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export const POST = withApiAudit('/api/studio/refactor', _POST);
