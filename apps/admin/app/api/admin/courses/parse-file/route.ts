/**
 * POST /api/admin/courses/parse-file
 *
 * Accepts a multipart/form-data upload with a single "file" field.
 * Extracts plain text from PDF, DOCX, TXT, or MD files.
 */

import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const MAX_OCR_PAGES = 8;
const MAX_OCR_FILE_BYTES = 8 * 1024 * 1024;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md'];

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

function isScannedPdf(text: string, pageCount: number): boolean {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length < Math.max(100, pageCount * 100);
}

async function ocrPdf(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  pagesOcrd: number;
  method: 'ocr' | 'ocr_partial' | 'ocr_failed';
}> {
  const images: Buffer[] = [];
  let offset = 0;
  while (offset < buffer.length - 2 && images.length < MAX_OCR_PAGES) {
    const jpegStart = buffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]), offset);
    if (jpegStart === -1) break;
    const jpegEnd = buffer.indexOf(Buffer.from([0xff, 0xd9]), jpegStart + 2);
    if (jpegEnd === -1) break;
    const imgBuf = buffer.slice(jpegStart, jpegEnd + 2);
    if (imgBuf.length > 10 * 1024) images.push(imgBuf);
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
        const {
          data: { text },
        } = await worker.recognize(imgBuf);
        if (text.trim().length > 20) texts.push(text.trim());
      } catch {
        // Skip unreadable image.
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

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

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
      { status: 413 },
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
  const isText = ext === '.txt' || ext === '.md' || mime.startsWith('text/');

  if (!isPdf && !isDocx && !isText) {
    return NextResponse.json(
      { error: `Unsupported file type "${ext || mime}". Supported: ${SUPPORTED_EXTENSIONS.join(', ')}` },
      { status: 415 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';
    let extractionMethod: 'text' | 'ocr' | 'ocr_partial' | 'ocr_failed' = 'text';
    let extractionWarning: string | null = null;

    if (isPdf) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      let pageCount = 1;
      try {
        const pdfResult = await parser.getText();
        rawText = pdfResult.text ?? '';
        pageCount = Array.isArray((pdfResult as { pages?: unknown[] }).pages)
          ? (pdfResult as { pages: unknown[] }).pages.length || 1
          : 1;
      } catch (parseErr: any) {
        const msg = parseErr?.message || '';
        if (msg.includes('Invalid PDF') || msg.includes('Bad XRef') || msg.includes('encrypted')) {
          return NextResponse.json(
            { error: 'Could not parse this PDF. It may be encrypted or corrupted. Try exporting as a plain text file.' },
            { status: 422 },
          );
        }
        throw parseErr;
      } finally {
        await parser.destroy();
      }

      if (isScannedPdf(rawText, pageCount)) {
        if (file.size > MAX_OCR_FILE_BYTES) {
          return NextResponse.json(
            {
              error:
                `This PDF appears to be scanned (image-only) and is too large (${(file.size / 1024 / 1024).toFixed(1)} MB) ` +
                'for automatic text recognition within the time limit. Please export the document as a text or Word file, or copy and paste the content directly.',
            },
            { status: 422 },
          );
        }

        const ocrResult = await ocrPdf(buffer);
        if (ocrResult.method === 'ocr_failed' || !ocrResult.text.trim()) {
          return NextResponse.json(
            { error: 'This PDF is scanned (image-only) and OCR could not extract readable text. Try exporting as a Word document or copying the text manually.' },
            { status: 422 },
          );
        }

        rawText = ocrResult.text;
        extractionMethod = ocrResult.method;
        extractionWarning =
          ocrResult.method === 'ocr_partial'
            ? `This PDF is scanned. OCR was applied to the first ${ocrResult.pagesOcrd} of ${ocrResult.pageCount} pages. Review the extracted content carefully.`
            : 'This PDF is scanned. Text was extracted using OCR — review for accuracy before generating a course.';
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
        { status: 422 },
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
        { status: 422 },
      );
    }
    return NextResponse.json({ error: 'File parsing failed. Try a different format.' }, { status: 500 });
  }
}
