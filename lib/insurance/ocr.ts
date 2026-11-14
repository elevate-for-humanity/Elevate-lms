import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

export type OcrResult = {
  text: string;
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
    '300',
    '-png',
    pdfPath,
    outPrefix,
  ]);
}

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

  let text = '';
  let totalConfidence = 0;
  let pagesProcessed = 0;

  const Tesseract = await import(/* webpackIgnore: true */ 'tesseract.js');
  const worker = await Tesseract.createWorker('eng');

  try {
    for (let i = 1; i <= pages; i++) {
      const imgPath = `${outPrefix}-${i}.png`;
      try {
        await fs.access(imgPath);
        const { data } = await worker.recognize(imgPath);
        text += '\n' + (data.text || '');
        totalConfidence += data.confidence ?? 0;
        pagesProcessed++;
      } catch {
        // Page does not exist or OCR failed; continue with available pages.
      }
    }
  } finally {
    await worker.terminate();
    await cleanupDir(dir);
  }

  return {
    text: text.trim(),
    confidence: pagesProcessed > 0 ? totalConfidence / pagesProcessed : 0,
    pagesProcessed,
  };
}

export async function ocrPdfFirstPagesToText(pdfBuffer: Buffer, pages = 2): Promise<string> {
  const result = await ocrPdfFirstPages(pdfBuffer, pages);
  return result.text;
}

async function cleanupDir(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // best effort
  }
}
