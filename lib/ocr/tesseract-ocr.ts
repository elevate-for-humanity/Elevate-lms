/**
 * OCR utilities — image OCR via Tesseract.js, PDF text via pdf-parse.
 * Both fall back gracefully when the library is unavailable.
 */

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  /** Source of the extracted text */
  source: 'tesseract' | 'pdf-parse' | 'none';
}

/**
 * Extract text from an image buffer using Tesseract OCR.
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  language = 'eng',
): Promise<OCRResult> {
  try {
    const Tesseract = await import(/* webpackIgnore: true */ 'tesseract.js');
    const worker = await Tesseract.createWorker(language);
    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();

    return {
      text: data.text,
      confidence: data.confidence,
      words: ((data as any).words ?? []).map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })),
      source: 'tesseract',
    };
  } catch {
    return { text: '', confidence: 0, words: [], source: 'none' };
  }
}

/**
 * Extract text from a PDF buffer using pdf-parse.
 * PDFs with embedded text return confidence 100 (no OCR needed).
 * Scanned PDFs (image-only) return empty text — caller should re-run as image OCR.
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<OCRResult> {
  try {
    const pdfParse = await import(/* webpackIgnore: true */ 'pdf-parse');
    const parsed = await (pdfParse as any).default(pdfBuffer);
    const text = (parsed.text ?? '').trim();
    return {
      text,
      confidence: text.length > 0 ? 100 : 0,
      words: [],
      source: 'pdf-parse',
    };
  } catch {
    return { text: '', confidence: 0, words: [], source: 'none' };
  }
}

/**
 * Auto-extract text from a buffer, routing by MIME type.
 * - PDF → pdf-parse (falls back to Tesseract if no embedded text found)
 * - Image → Tesseract
 * - Other → empty result
 */
export async function autoExtract(buffer: Buffer, mimeType?: string): Promise<OCRResult> {
  const mime = mimeType ?? detectMimeType(buffer);

  if (mime === 'application/pdf') {
    const pdfResult = await extractTextFromPdf(buffer);
    // Scanned PDF — no embedded text, try Tesseract
    if (pdfResult.confidence === 0 || pdfResult.text.length < 20) {
      const imgResult = await extractTextFromImage(buffer);
      return imgResult.text.length > pdfResult.text.length ? imgResult : pdfResult;
    }
    return pdfResult;
  }

  if (mime.startsWith('image/')) {
    return extractTextFromImage(buffer);
  }

  return { text: '', confidence: 0, words: [], source: 'none' };
}

/**
 * Detect MIME type from buffer magic bytes.
 */
function detectMimeType(buffer: Buffer): string {
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp';
  return 'application/octet-stream';
}
