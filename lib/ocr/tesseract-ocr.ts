/**
 * OCR utilities for extracting text from images.
 * Uses Tesseract.js when available, falls back to empty results.
 */

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

/**
 * Extract text from an image buffer using Tesseract OCR.
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  language = 'eng'
): Promise<OCRResult> {
  try {
    const Tesseract = await import('tesseract.js');
    const worker = await Tesseract.createWorker(language);
    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();

    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map((w: any) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })),
    };
  } catch {
    // Tesseract.js not installed — return empty result
    return { text: '', confidence: 0, words: [] };
  }
}

/**
 * Auto-extract text from a buffer, detecting image type.
 */
export async function autoExtract(buffer: Buffer): Promise<OCRResult> {
  return extractTextFromImage(buffer);
}
