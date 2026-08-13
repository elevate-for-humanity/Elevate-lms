/**
 * POST /api/admin/courses/generate/parse
 * Parses PDF/DOCX or text input for the canonical Admin Course Builder.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff', 'org_admin']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function extractPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text?.trim() ?? '';
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? '';
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await requireAdminClient();
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !ADMIN_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const text = form.get('text') as string | null;
      const prompt = form.get('prompt') as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const name = file.name.toLowerCase();
        let rawText = '';
        let inputType = 'file';

        if (name.endsWith('.pdf')) {
          rawText = await extractPdf(buffer);
          inputType = 'pdf';
        } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
          rawText = await extractDocx(buffer);
          inputType = 'docx';
        } else {
          return NextResponse.json(
            { error: 'Unsupported file type. Upload a PDF or DOCX.' },
            { status: 400 },
          );
        }

        if (!rawText) {
          return NextResponse.json(
            { error: 'Could not extract text from file. Try pasting the content instead.' },
            { status: 422 },
          );
        }

        logger.info('File parsed for course generation', {
          userId: user.id,
          inputType,
          chars: rawText.length,
        });

        return NextResponse.json({ raw_text: rawText, input_type: inputType });
      }

      if (text?.trim()) {
        return NextResponse.json({ raw_text: text.trim(), input_type: 'syllabus' });
      }

      if (prompt?.trim()) {
        return NextResponse.json({ raw_text: prompt.trim(), input_type: 'prompt' });
      }

      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { text, prompt } = body as { text?: string; prompt?: string };

    if (text?.trim()) {
      return NextResponse.json({ raw_text: text.trim(), input_type: 'syllabus' });
    }

    if (prompt?.trim()) {
      return NextResponse.json({ raw_text: prompt.trim(), input_type: 'prompt' });
    }

    return NextResponse.json({ error: 'No input provided' }, { status: 400 });
  } catch (error) {
    logger.error(
      'Course parse error',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
  }
}
