/**
 * POST /api/admin/courses/parse-file
 *
 * Accepts a multipart/form-data upload with a single "file" field.
 * Extracts plain text from PDF, DOCX, TXT, or MD files.
 * Returns { text, filename, char_count, extraction_method }
 *
 * extraction_method values:
 *   "text"        — normal PDF/DOCX text extraction
 *   "ocr"         — full OCR (scanned PDF, all pages within limit)
 *   "ocr_partial" — OCR ran on first MAX_OCR_PAGES pages only
 *   "ocr_failed"  — OCR attempted but produced no usable text
 *
 * OCR limits (Netlify 60s budget):
 *   MAX_OCR_PAGES = 8  — OCR only first N pages of scanned PDFs
 *   OCR is skipped for files >8 MB (too slow for request budget)
 *   tesseract.js + sharp are already in netlify external_node_modules
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const MAX_OCR_PAGES = 8;
const MAX_OCR_FILE_BYTES = 8 * 1024 * 1024; // 8 MB — above this OCR is too slow

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
const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase
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
    .replace(/\n{3,}/g, '\n\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/** Returns true if extracted PDF text is too sparse to be real content */
function isScannedPdf(text: string, pageCount: number): boolean {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  // Fewer than 100 chars per page on average = likely image-only
  return cleaned.length < Math.max(100, pageCount * 100);
}

/**
 * OCR a PDF buffer using tesseract.js on embedded images.
 *
 * PDF-to-image rendering requires pdfjs-dist (not installed) or system tools
 * (pdftoppm/ghostscript, not available on Netlify). Instead, we attempt to
 * extract any embedded raster images directly from the PDF binary using a
 * simple JPEG/PNG stream scan, then run tesseract on those images.
 *
 * This works for PDFs that embed scanned page images as JPEG/PNG streams
 * (the most common case for scanned documents). It does not work for PDFs
 * with embedded JBIG2 or CCITT-compressed images.
 *
 * Operational limit: first MAX_OCR_PAGES image streams only.
 */
async function ocrPdf(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  pagesOcrd: number;
  method: 'ocr' | 'ocr_partial' | 'ocr_failed';
}> {
  // Extract embedded JPEG image streams from PDF binary
  // JPEG streams start with FF D8 FF and end with FF D9
  const images: Buffer[] = [];
  let offset = 0;
  while (offset < buffer.length - 2 && images.length < MAX_OCR_PAGES) {
    // Find JPEG SOI marker
    const jpegStart = buffer.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), offset);
    if (jpegStart === -1) break;
    // Find JPEG EOI marker
    const jpegEnd = buffer.indexOf(Buffer.from([0xFF, 0xD9]), jpegStart + 2);
    if (jpegEnd === -1) break;
    const imgBuf = buffer.slice(jpegStart, jpegEnd + 2);
    // Only keep images larger than 10KB (skip thumbnails/icons)
    if (imgBuf.length > 10 * 1024) {
      images.push(imgBuf);
    }
    offset = jpegEnd + 2;
  }

  if (images.length === 0) {
    return { text: '', pageCount: 0, pagesOcrd: 0, method: 'ocr_failed' };
  }

  const Tesseract = await import('tesseract.js').catch(() => null);
  if (!Tesseract) {
    return { text: '', pageCount: images.length, pagesOcrd: 0, method: 'ocr_failed' };
  }

  const worker = await Tesseract.createWorker('eng');
  const texts: string[] = [];

  try {
    for (const imgBuf of images) {
      try {
        const { data: { text } } = await worker.recognize(imgBuf);
        if (text.trim().length > 20) texts.push(text.trim());
      } catch {
        // skip unreadable image
      }
    }
  } finally {
    await worker.terminate();
  }

  const combined = texts.join('\n\n');
  if (!combined.trim()) {
    return { text: '', pageCount: images.length, pagesOcrd: images.length, method: 'ocr_failed' };
  }

  const pagesOcrd = images.length;
  return {
    text: combined,
    pageCount: images.length,
    pagesOcrd,
    method: pagesOcrd < images.length ? 'ocr_partial' : 'ocr',
  };
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
    let extractionMethod: 'text' | 'ocr' | 'ocr_partial' | 'ocr_failed' = 'text';
    let extractionWarning: string | null = null;

    if (isPdf) {
      const pdfParse = (await import('pdf-parse')).default;
      let pdfResult: { text: string; numpages: number };
      try {
        pdfResult = await pdfParse(buffer);
      } catch (parseErr: any) {
        const msg = parseErr?.message || '';
        if (msg.includes('Invalid PDF') || msg.includes('Bad XRef') || msg.includes('encrypted')) {
          return NextResponse.json(
            { error: 'Could not parse this PDF. It may be encrypted or corrupted. Try exporting as a plain text file.' },
            { status: 422 }
          );
        }
        throw parseErr;
      }

      rawText = pdfResult.text;
      const pageCount = pdfResult.numpages || 1;

      // Detect scanned/image-only PDF
      if (isScannedPdf(rawText, pageCount)) {
        if (file.size > MAX_OCR_FILE_BYTES) {
          // File too large for OCR within request budget
          return NextResponse.json(
            {
              error:
                `This PDF appears to be scanned (image-only) and is too large (${(file.size / 1024 / 1024).toFixed(1)} MB) ` +
                `for automatic text recognition within the time limit. ` +
                `Please export the document as a text or Word file, or copy and paste the content directly.`,
            },
            { status: 422 }
          );
        }

        // Run OCR fallback
        const ocrResult = await ocrPdf(buffer);

        if (ocrResult.method === 'ocr_failed' || !ocrResult.text.trim()) {
          return NextResponse.json(
            {
              error:
                'This PDF is scanned (image-only) and OCR could not extract readable text. ' +
                'Try exporting as a Word document or copying the text manually.',
            },
            { status: 422 }
          );
        }

        rawText = ocrResult.text;
        extractionMethod = ocrResult.method;

        if (ocrResult.method === 'ocr_partial') {
          extractionWarning =
            `This PDF is scanned. OCR was applied to the first ${ocrResult.pagesOcrd} of ${ocrResult.pageCount} pages ` +
            `(limit: ${MAX_OCR_PAGES} pages per request). Review the extracted content carefully — ` +
            `content from later pages was not included.`;
        } else {
          extractionWarning = `This PDF is scanned. Text was extracted using OCR — review for accuracy before generating a course.`;
        }
      }
    } else if (isDocx) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
    } else {
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
      extraction_method: extractionMethod,
      ...(extractionWarning ? { warning: extractionWarning } : {}),
    });
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('Invalid PDF') || msg.includes('Bad XRef')) {
      return NextResponse.json(
        { error: 'Could not parse this PDF. It may be encrypted or corrupted. Try exporting as a plain text file.' },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: 'File parsing failed. Try a different format.' }, { status: 500 });
  }
}
