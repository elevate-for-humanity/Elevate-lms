import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';

const getOpenAI = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI-powered LSP-like features
// Since we can't run actual language servers in the browser,
// we use AI to provide similar functionality

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { action, code, position, language, filename, symbol } = await req.json();

    switch (action) {
      case 'hover':
        return handleHover(code, position, language);
      
      case 'definition':
        return handleGoToDefinition(code, symbol, language, filename);
      
      case 'references':
        return handleFindReferences(code, symbol, language);
      
      case 'completion':
        return handleCompletion(code, position, language);
      
      case 'signature':
        return handleSignatureHelp(code, position, language);
      
      case 'diagnostics':
        return handleDiagnostics(code, language, filename);
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('LSP error:', error);
    return NextResponse.json({ error: 'LSP request failed' }, { status: 500 });
  }
}

async function handleHover(code: string, position: { line: number; column: number }, language: string) {
  // Extract the word at position
  const lines = code.split('\n');
  const line = lines[position.line - 1] || '';
  const wordMatch = line.slice(0, position.column).match(/[\w.]+$/);
  const word = wordMatch ? wordMatch[0] + (line.slice(position.column).match(/^[\w]*/)?.[0] || '') : '';

  if (!word) {
    return NextResponse.json({ hover: null });
  }

  const prompt = `In ${language}, explain what "${word}" is in this context. Be very brief (1-2 sentences).

Code context:
${lines.slice(Math.max(0, position.line - 5), position.line + 5).join('\n')}

If it's a function, show its signature. If it's a type, show its definition.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  });

  return NextResponse.json({
    hover: {
      contents: response.choices[0].message.content,
      range: {
        startLine: position.line,
        startColumn: position.column - (wordMatch?.[0].length || 0),
        endLine: position.line,
        endColumn: position.column + (line.slice(position.column).match(/^[\w]*/)?.[0].length || 0),
      },
    },
  });
}

async function handleGoToDefinition(code: string, symbol: string, language: string, filename: string) {
  const prompt = `In this ${language} code, find where "${symbol}" is defined.

Code:
${code}

Return JSON: { "line": <line number>, "column": <column number>, "file": "<filename or null if same file>" }
If not found, return { "line": null }`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 100,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json({ definition: result });
  } catch {
    return NextResponse.json({ definition: null });
  }
}

async function handleFindReferences(code: string, symbol: string, language: string) {
  const prompt = `In this ${language} code, find all references to "${symbol}".

Code:
${code}

Return JSON array: [{ "line": <line>, "column": <column>, "context": "<surrounding code>" }, ...]`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 500,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '[]');
    return NextResponse.json({ references: result });
  } catch {
    return NextResponse.json({ references: [] });
  }
}

async function handleCompletion(code: string, position: { line: number; column: number }, language: string) {
  const lines = code.split('\n');
  const prefix = lines.slice(0, position.line - 1).join('\n') + '\n' + lines[position.line - 1].slice(0, position.column);

  const prompt = `Provide code completions for ${language} at the cursor position.

Code before cursor:
${prefix.slice(-500)}

Return JSON array of completions: [{ "label": "name", "kind": "function|variable|class|property|keyword", "detail": "brief description", "insertText": "text to insert" }, ...]
Max 10 items.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 500,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '[]');
    return NextResponse.json({ completions: result });
  } catch {
    return NextResponse.json({ completions: [] });
  }
}

async function handleSignatureHelp(code: string, position: { line: number; column: number }, language: string) {
  const lines = code.split('\n');
  const line = lines[position.line - 1] || '';
  
  // Find function call context
  const beforeCursor = line.slice(0, position.column);
  const funcMatch = beforeCursor.match(/(\w+)\s*\([^)]*$/);

  if (!funcMatch) {
    return NextResponse.json({ signature: null });
  }

  const funcName = funcMatch[1];

  const prompt = `In ${language}, what is the signature of the function "${funcName}"?

Context:
${lines.slice(Math.max(0, position.line - 10), position.line + 1).join('\n')}

Return JSON: { "label": "full signature", "parameters": [{ "label": "param name", "documentation": "description" }], "activeParameter": <index of current param> }`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 300,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json({ signature: result });
  } catch {
    return NextResponse.json({ signature: null });
  }
}

async function handleDiagnostics(code: string, language: string, filename: string) {
  const prompt = `Analyze this ${language} code for errors, warnings, and issues.

File: ${filename}
Code:
${code}

Return JSON array: [{ "line": <line>, "column": <column>, "severity": "error|warning|info", "message": "description", "code": "error code if applicable" }, ...]
Only include real issues, not style preferences.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 1000,
  });

  try {
    const result = JSON.parse(response.choices[0].message.content || '[]');
    return NextResponse.json({ diagnostics: result });
  } catch {
    return NextResponse.json({ diagnostics: [] });
  }
}
export const POST = withRuntime(withApiAudit('/api/studio/lsp', _POST));
