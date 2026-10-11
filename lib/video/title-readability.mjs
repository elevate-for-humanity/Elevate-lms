import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { FOOTAGE_TITLE_LAYOUT, footageTitleCropFilter } from '../../remotion-src/footage-title-layout.mjs';

const exec = promisify(execFile);
const options = { timeout: 30_000, maxBuffer: 1_000_000 };
export const MIN_TITLE_WORD_COVERAGE = 0.75;

export function titleWordCoverage(expectedTitle, decodedText) {
  const words = String(expectedTitle).toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const expected = [...new Set(words.filter(word => word.length > 2))];
  const decoded = new Set(decodedText.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  return expected.length ? expected.filter(word => decoded.has(word)).length / expected.length : 0;
}

/**
 * @param {{frame:string, expectedTitle:string, titleLayout?:string}} input
 * @returns {Promise<{wordCoverage:number, decoded:string, ocrMode:'full-frame'|'title-region'}>}
 */
export async function readEncodedTitle({ frame, expectedTitle, titleLayout }) {
  const { stdout } = await exec('tesseract', [frame, 'stdout', '--psm', '11'], options);
  const full = { wordCoverage: titleWordCoverage(expectedTitle, stdout), decoded: stdout,
    ocrMode: /** @type {const} */ ('full-frame') };
  if (full.wordCoverage >= MIN_TITLE_WORD_COVERAGE || titleLayout !== FOOTAGE_TITLE_LAYOUT) return full;

  // Only the current renderer's explicit title-box contract permits this retry.
  // Crop the already downscaled encoded frame: no resizing, source text, or OCR search.
  const cropped = `${frame}.title-region.png`;
  await exec('ffmpeg', ['-y', '-loglevel', 'error', '-i', frame,
    '-vf', footageTitleCropFilter(), cropped], options);
  const { stdout: decoded } = await exec('tesseract', [cropped, 'stdout', '--psm', '6'], options);
  const wordCoverage = titleWordCoverage(expectedTitle, decoded);
  return wordCoverage > full.wordCoverage
    ? { wordCoverage, decoded, ocrMode: 'title-region' }
    : full;
}
