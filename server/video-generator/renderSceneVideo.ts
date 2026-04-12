import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import type { RenderedScenePlan, SceneRenderOptions } from './types';

const FONT_BOLD    = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

const DEFAULT_OPTS: SceneRenderOptions = {
  width: 1920,
  height: 1080,
  fps: 30,
  fontPath: FONT_BOLD,
  headlineFontSize: 68,
  subcaptionFontSize: 38,
  marginX: 80,
  marginBottom: 90,
  overlayOpacity: 0.52,
};

/** Escape text for FFmpeg drawtext filter */
function esc(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\u2019")   // replace straight apostrophe with curly to avoid shell quoting issues
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Wrap long caption text across two lines if needed.
 * Returns [line1, line2?] — line2 is undefined if it fits on one line.
 * Rough heuristic: ~32 chars per line at 68px on 1920px wide with 80px margins.
 */
function wrapCaption(text: string, charsPerLine = 38): [string, string | undefined] {
  if (text.length <= charsPerLine) return [text, undefined];
  const words = text.split(' ');
  let line1 = '';
  let i = 0;
  while (i < words.length && (line1 + words[i]).length <= charsPerLine) {
    line1 += (line1 ? ' ' : '') + words[i++];
  }
  const line2 = words.slice(i).join(' ');
  return [line1, line2 || undefined];
}

export async function renderSceneVideo(
  scene: RenderedScenePlan,
  outputDir: string,
  opts: Partial<SceneRenderOptions> = {},
): Promise<string> {
  const o = { ...DEFAULT_OPTS, ...opts };
  const outputPath = path.join(outputDir, `${scene.id}.mp4`);
  const tmpPath    = outputPath + '.tmp.mp4';

  const { videoPath, durationSeconds: clipDuration } = scene.video;
  const { audioPath, durationSeconds: audioDuration } = scene.audio;
  const sceneDuration = audioDuration + scene.timing.tailPadSeconds;

  // If the clip is shorter than the scene, loop it
  const needsLoop = clipDuration < sceneDuration;

  const [capLine1, capLine2] = wrapCaption(scene.caption);
  const hasSubcap = !!scene.subcaption;

  // Y positions — anchor from bottom
  // Layout (lower_third): gradient bar at bottom, headline above subcaption
  const gradientH  = hasSubcap ? 220 : 170;
  const gradientY  = o.height - gradientH;

  // subcaption sits just above the bottom margin
  const subcapY    = o.height - o.marginBottom;
  // headline sits above subcaption (or above bottom margin if no subcap)
  const headlineY  = hasSubcap
    ? subcapY - o.subcaptionFontSize - 24
    : o.height - o.marginBottom - 10;
  // if caption wraps, line2 is below line1
  const headlineY2 = headlineY + o.headlineFontSize + 10;

  // Build drawtext filters
  const drawtextFilters: string[] = [];

  // Headline line 1
  drawtextFilters.push(
    `drawtext=fontfile='${FONT_BOLD}':text='${esc(capLine1)}':fontsize=${o.headlineFontSize}:fontcolor=white:x=${o.marginX}:y=${headlineY}:shadowcolor=black@0.6:shadowx=2:shadowy=2`,
  );

  // Headline line 2 (if wrapped)
  if (capLine2) {
    drawtextFilters.push(
      `drawtext=fontfile='${FONT_BOLD}':text='${esc(capLine2)}':fontsize=${o.headlineFontSize}:fontcolor=white:x=${o.marginX}:y=${headlineY2}:shadowcolor=black@0.6:shadowx=2:shadowy=2`,
    );
  }

  // Subcaption
  if (scene.subcaption) {
    drawtextFilters.push(
      `drawtext=fontfile='${FONT_REGULAR}':text='${esc(scene.subcaption)}':fontsize=${o.subcaptionFontSize}:fontcolor=white@0.85:x=${o.marginX}:y=${subcapY}:shadowcolor=black@0.5:shadowx=1:shadowy=1`,
    );
  }

  // Build filtergraph
  // [0:v] → scale/crop → format → drawbox gradient → drawtext(s) → [vout]
  const scaleFilter   = `scale=${o.width}:${o.height}:force_original_aspect_ratio=increase,crop=${o.width}:${o.height}`;
  const formatFilter  = `format=yuv420p`;
  const gradientFilter = `drawbox=x=0:y=${gradientY}:w=${o.width}:h=${gradientH}:color=black@${o.overlayOpacity}:t=fill`;

  const filterChain = [scaleFilter, formatFilter, gradientFilter, ...drawtextFilters].join(',');
  const filterComplex = `[0:v]${filterChain}[vout]`;

  // Input options — loop if needed
  const inputOpts = needsLoop ? ['-stream_loop', '-1'] : [];

  const cmd = [
    'ffmpeg', '-y',
    ...inputOpts,
    '-i', `"${videoPath}"`,
    '-i', `"${audioPath}"`,
    '-filter_complex', `"${filterComplex}"`,
    '-map', '[vout]',
    '-map', '1:a',
    '-c:v', 'libx264', '-crf', '22', '-preset', 'fast',
    // Lock to constant 30fps — required for stream-copy concat to work correctly.
    // Variable-rate source clips produce misaligned timestamps that truncate the
    // video stream when concatenated without re-encoding.
    `-r`, `${o.fps}`,
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000',
    '-t', sceneDuration.toFixed(3),
    `"${tmpPath}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
  await fs.rename(tmpPath, outputPath);
  return outputPath;
}
