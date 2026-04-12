import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/**
 * Concatenate rendered scene MP4s into a single final MP4.
 *
 * Uses the concat demuxer with stream copy — fast, no re-encode.
 * This works correctly because each scene is rendered at a fixed 30fps
 * with consistent codec parameters in renderSceneVideo.ts.
 * Final pass re-encodes to guarantee +faststart moov atom at front.
 */
export async function concatSceneVideos(
  scenePaths: string[],
  outputPath: string,
  tempDir: string,
): Promise<void> {
  if (scenePaths.length === 0) throw new Error('No scene videos to concatenate');

  const listPath = path.join(tempDir, 'concat.txt');
  await fs.writeFile(listPath, scenePaths.map(p => `file '${p}'`).join('\n'));

  const tmpConcat = outputPath + '.concat.tmp.mp4';
  const tmpFinal  = outputPath + '.final.tmp.mp4';

  // Stream-copy concat — fast because scenes are already encoded consistently
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${tmpConcat}"`,
    { stdio: 'pipe' },
  );

  // Probe actual video duration from concat output
  const probeOut = execSync(
    `ffprobe -v quiet -select_streams v:0 -show_entries stream=duration -of default=nw=1 "${tmpConcat}"`,
    { encoding: 'utf-8' },
  );
  const videoDur = parseFloat(probeOut.match(/duration=([\d.]+)/)?.[1] ?? '0');

  // Re-encode for +faststart — use video duration as authoritative length
  execSync(
    `ffmpeg -y -i "${tmpConcat}" ` +
    `-c:v libx264 -crf 22 -preset fast -pix_fmt yuv420p ` +
    `-c:a aac -b:a 128k -ar 48000 ` +
    (videoDur > 0 ? `-t ${videoDur.toFixed(3)} ` : '') +
    `-movflags +faststart "${tmpFinal}"`,
    { stdio: 'pipe' },
  );

  await fs.rename(tmpFinal, outputPath);
  await fs.unlink(tmpConcat).catch(() => {});
}
