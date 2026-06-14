import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
// Dynamic import keeps tesseract.js out of the SSR bundle (44 MB wasm core)
type TesseractStatic = (typeof import('tesseract.js'))['default'];

const execFileAsync = promisify(execFile);

export type OcrResult = {
  text: string;
  /** Tesseract confidence score (0-100). Average across all pages processed. */
  confidence: number;
  pagesProcessed: number;
};

async function pdftoppmToPng(pdfPath: string, outPrefix: string, pages: number) {
  await execFileAsync('pdftoppm', [
    '-f',
    '1',
    '-l',
    String(pages),
    '-r',
    '300', // 300 DPI for better OCR accuracy
    '-png',
    pdfPath,
    outPrefix,
  ]);
}

/**
 * Extract text from a scanned PDF via pdftoppm + Tesseract OCR.
 * Returns text, average confidence score, and page count.
 */
export async function ocrPdfFirstPages(pdfBuffer: Buffer, pages = 2): Promise<OcrResult> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'coi-'));
  const pdfPath = path.join(dir, 'coi.pdf');
  await fs.writeFile(pdfPath, pdfBuffer);

  const outPrefix = path.join(dir, 'page');

  try {
    await pdftoppmToPng(pdfPath, outPrefix, pages);
  } catch {
    await cleanupDir(dir);
    return { text: '', confidence: 0, pagesProcessed: 0 };
  }

  let totalConfidence = 0;
  let pagesProcessed = 0;
  const textParts: string[] = [];

  for (let i = 1; i <= pages; i++) {
    const imgPath = `${outPrefix}-${i}.png`;
    try {
      await fs.access(imgPath);
      const Tesseract = (await import(/* webpackIgnore: true */ 'tesseract.js'))
        .default as TesseractStatic;
      const { data } = await Tesseract.recognize(imgPath, 'eng');
      textParts.push(data.text || '');
      totalConfidence += data.confidence ?? 0;
      pagesProcessed++;
    } catch {
      // Page doesn't exist or OCR failed — skip
    }
  }

  await cleanupDir(dir);

  return {
    text: textParts.join('\n').trim(),
    confidence: pagesProcessed > 0 ? totalConfidence / pagesProcessed : 0,
    pagesProcessed,
  };
}

// Backward-compatible wrapper
export async function ocrPdfFirstPagesToText(pdfBuffer: Buffer, pages = 2): Promise<string> {
  const result = await ocrPdfFirstPages(pdfBuffer, pages);
  return result.text;
}

async function cleanupDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
}
