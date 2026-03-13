/**
 * POST /api/admin/courses/parse-file
 *
 * Accepts a multipart/form-data upload with a single "file" field.
 * Extracts plain text from PDF, DOCX, TXT, or MD files.
 * Returns { text: string, filename: string, char_count: number }
 *
 * Used by CourseIngestionWizard before sending to /api/admin/courses/ingest.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const SUPPORTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
];
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md'];

async function requireAdmin() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) return { error: 'Database unavailable', status: 500 };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await db
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'org_admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile };
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    // remove null bytes and other control chars except tab/newline
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

export async function POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided. Send a "file" field.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` },
      { status: 413 }
    );
  }

  const filename = file.name || '';
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const mime = file.type || '';

  const isPdf = ext === '.pdf' || mime === 'application/pdf';
  const isDocx =
    ext === '.docx' ||
    ext === '.doc' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword';
  const isText =
    ext === '.txt' || ext === '.md' || mime.startsWith('text/');

  if (!isPdf && !isDocx && !isText) {
    return NextResponse.json(
      {
        error: `Unsupported file type "${ext || mime}". Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`,
      },
      { status: 415 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';

    if (isPdf) {
      // pdf-parse v2 uses default export
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(buffer);
      rawText = result.text;
    } else if (isDocx) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
      if (result.messages?.length) {
        // non-fatal warnings from mammoth — log but continue
        console.warn('[parse-file] mammoth warnings:', result.messages.slice(0, 3));
      }
    } else {
      // plain text / markdown
      rawText = buffer.toString('utf-8');
    }

    const text = normalizeText(rawText);

    if (text.length < 20) {
      return NextResponse.json(
        { error: 'Could not extract readable text from this file. Try copying and pasting the content instead.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      filename,
      char_count: text.length,
    });
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('Invalid PDF') || msg.includes('Bad XRef')) {
      return NextResponse.json(
        { error: 'Could not parse this PDF. It may be encrypted, scanned, or corrupted. Try exporting as plain text.' },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: 'File parsing failed. Try a different format.' }, { status: 500 });
  }
}
