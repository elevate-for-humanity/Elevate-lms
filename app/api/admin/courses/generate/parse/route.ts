/**
 * POST /api/admin/courses/generate/parse
 *
 * Accepts multipart/form-data with either:
 *   - file: PDF or DOCX
 *   - text: pasted syllabus/script
 *   - prompt: plain-English description
 *
 * Returns { raw_text, input_type } — normalized text ready for generation.
 * Does not call OpenAI. Parsing only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse works with Buffer directly
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.text?.trim() ?? '';
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? '';
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createAdminClient();
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !ADMIN_ROLES.has(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') ?? '';

    // ── File upload path ────────────────────────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const text = form.get('text') as string | null;
      const prompt = form.get('prompt') as string | null;

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const name = file.name.toLowerCase();
        let raw_text = '';
        let input_type = 'file';

        if (name.endsWith('.pdf')) {
          raw_text = await extractPdf(buffer);
          input_type = 'pdf';
        } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
          raw_text = await extractDocx(buffer);
          input_type = 'docx';
        } else {
          return NextResponse.json(
            { error: 'Unsupported file type. Upload a PDF or DOCX.' },
            { status: 400 }
          );
        }

        if (!raw_text) {
          return NextResponse.json(
            { error: 'Could not extract text from file. Try pasting the content instead.' },
            { status: 422 }
          );
        }

        logger.info('File parsed for course generation', {
          userId: user.id, input_type, chars: raw_text.length,
        });
        return NextResponse.json({ raw_text, input_type });
      }

      if (text?.trim()) {
        return NextResponse.json({ raw_text: text.trim(), input_type: 'syllabus' });
      }

      if (prompt?.trim()) {
        return NextResponse.json({ raw_text: prompt.trim(), input_type: 'prompt' });
      }

      return NextResponse.json({ error: 'No input provided' }, { status: 400 });
    }

    // ── JSON path (text/prompt) ─────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const { text, prompt } = body as { text?: string; prompt?: string };

    if (text?.trim()) {
      return NextResponse.json({ raw_text: text.trim(), input_type: 'syllabus' });
    }
    if (prompt?.trim()) {
      return NextResponse.json({ raw_text: prompt.trim(), input_type: 'prompt' });
    }

    return NextResponse.json({ error: 'No input provided' }, { status: 400 });
  } catch (err: any) {
    logger.error('Parse error:', err);
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
  }
}
