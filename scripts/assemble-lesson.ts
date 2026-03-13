#!/usr/bin/env tsx
/**
 * Assemble a single lesson video from its manifest.
 *
 * Reads a manifest JSON and uses FFmpeg to composite:
 *   Brandon intro → Diagram+Narration → Brandon explain → Brandon recap → Brandon outro
 *
 * All segments are normalized to 1280x720 25fps h264+aac before concatenation.
 *
 * Usage:
 *   npx tsx scripts/assemble-lesson.ts --lesson=5
 *   npx tsx scripts/assemble-lesson.ts --lesson=5 --force
 *   npx tsx scripts/assemble-lesson.ts --lesson=5 --dry-run
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Segment {
  type: 'presenter' | 'diagram' | 'narration';
  source: string;
  role?: string;
  duration?: number;
  label?: string;
}

interface LessonManifest {
  lessonNumber: number;
  lessonDefId: string;
  lessonUuid: string;
  title: string;
  segments: Segment[];
  audio: string;
  captions: string;
  quiz: string;
  recap: string;
  diagram: string | null;
  output: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TARGET_W = 1280;
const TARGET_H = 720;
const TARGET_FPS = 25;
const MANIFESTS_DIR = 'output/manifests';
const TEMP_DIR = 'output/temp-assembly';

// ---------------------------------------------------------------------------
// FFmpeg helpers
// ---------------------------------------------------------------------------

function run(cmd: string, label?: string) {
  if (label) console.log(`  [ffmpeg] ${label}`);
  try {
    execSync(cmd, { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 });
  } catch (err: any) {
    console.error(`  ❌ FFmpeg failed: ${label || ''}`);
    console.error(err.stderr?.toString().slice(-500) || err.message);
    throw err;
  }
}

function getAudioDuration(file: string): number {
  const out = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${file}"`,
    { encoding: 'utf-8' },
  ).trim();
  return parseFloat(out) || 0;
}

/**
 * Normalize a presenter clip to target resolution/fps.
 * Brandon clips are already 1280x720 25fps, but this ensures consistency.
 */
function normalizePresenterClip(input: string, output: string) {
  run(
    `ffmpeg -y -i "${input}" ` +
    `-vf "scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2,fps=${TARGET_FPS}" ` +
    `-c:v libx264 -preset fast -crf 23 ` +
    `-c:a aac -ar 48000 -ac 2 ` +
    `-movflags +faststart "${output}"`,
    `normalize ${path.basename(input)}`,
  );
}

/**
 * Create a video segment from a static diagram image + narration audio.
 * The diagram is shown full-screen while the narration plays.
 */
function createDiagramNarrationSegment(
  diagramPath: string,
  audioPath: string,
  output: string,
) {
  const duration = getAudioDuration(audioPath);
  run(
    `ffmpeg -y -loop 1 -i "${diagramPath}" -i "${audioPath}" ` +
    `-vf "scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2:color=white,fps=${TARGET_FPS}" ` +
    `-c:v libx264 -preset fast -crf 23 -tune stillimage ` +
    `-c:a aac -ar 48000 -ac 2 ` +
    `-t ${duration} -shortest ` +
    `-movflags +faststart "${output}"`,
    `diagram+narration (${Math.round(duration)}s)`,
  );
}

/**
 * Create a video segment from narration audio only (dark background with title).
 * Used when no diagram is available.
 */
function createNarrationOnlySegment(
  audioPath: string,
  title: string,
  output: string,
) {
  const duration = getAudioDuration(audioPath);
  // Dark slate background with lesson title text
  const escapedTitle = title.replace(/'/g, "'\\''").replace(/:/g, '\\:');
  run(
    `ffmpeg -y -f lavfi -i "color=c=0x1E293B:s=${TARGET_W}x${TARGET_H}:d=${duration}:r=${TARGET_FPS}" ` +
    `-i "${audioPath}" ` +
    `-vf "drawtext=text='${escapedTitle}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2:font=Arial" ` +
    `-c:v libx264 -preset fast -crf 23 ` +
    `-c:a aac -ar 48000 -ac 2 ` +
    `-t ${duration} -shortest ` +
    `-movflags +faststart "${output}"`,
    `narration-only (${Math.round(duration)}s)`,
  );
}

// ---------------------------------------------------------------------------
// Main assembly
// ---------------------------------------------------------------------------

function assembleLesson(manifest: LessonManifest, force: boolean): string | null {
  const outputDir = path.dirname(manifest.output);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  if (fs.existsSync(manifest.output) && !force) {
    console.log(`  ⏭️  Already exists: ${manifest.output}`);
    return manifest.output;
  }

  const partFiles: string[] = [];
  let partIdx = 0;

  // Process segments in order
  const presenterSegments = manifest.segments.filter(s => s.type === 'presenter');
  const diagramSegment = manifest.segments.find(s => s.type === 'diagram');
  const narrationSegment = manifest.segments.find(s => s.type === 'narration');

  // Find specific presenter roles
  const intro = presenterSegments.find(s => s.role === 'intro');
  const explanation = presenterSegments.find(s => s.role === 'explanation');
  const recap = presenterSegments.find(s => s.role === 'recap');
  const outro = presenterSegments.find(s => s.role === 'outro');

  // 1. Brandon intro
  if (intro && fs.existsSync(intro.source)) {
    const partFile = path.join(TEMP_DIR, `part-${manifest.lessonNumber}-${partIdx++}.mp4`);
    normalizePresenterClip(intro.source, partFile);
    partFiles.push(partFile);
  }

  // 2. Diagram + narration (or narration-only)
  if (narrationSegment && fs.existsSync(narrationSegment.source)) {
    const partFile = path.join(TEMP_DIR, `part-${manifest.lessonNumber}-${partIdx++}.mp4`);
    if (diagramSegment && fs.existsSync(diagramSegment.source)) {
      createDiagramNarrationSegment(diagramSegment.source, narrationSegment.source, partFile);
    } else {
      createNarrationOnlySegment(narrationSegment.source, manifest.title, partFile);
    }
    partFiles.push(partFile);
  }

  // 3. Brandon explanation
  if (explanation && fs.existsSync(explanation.source)) {
    const partFile = path.join(TEMP_DIR, `part-${manifest.lessonNumber}-${partIdx++}.mp4`);
    normalizePresenterClip(explanation.source, partFile);
    partFiles.push(partFile);
  }

  // 4. Brandon recap
  if (recap && fs.existsSync(recap.source)) {
    const partFile = path.join(TEMP_DIR, `part-${manifest.lessonNumber}-${partIdx++}.mp4`);
    normalizePresenterClip(recap.source, partFile);
    partFiles.push(partFile);
  }

  // 5. Brandon outro
  if (outro && fs.existsSync(outro.source)) {
    const partFile = path.join(TEMP_DIR, `part-${manifest.lessonNumber}-${partIdx++}.mp4`);
    normalizePresenterClip(outro.source, partFile);
    partFiles.push(partFile);
  }

  if (partFiles.length === 0) {
    console.log(`  ❌ No segments to assemble`);
    return null;
  }

  // Concatenate all parts
  const concatFile = path.join(TEMP_DIR, `concat-${manifest.lessonNumber}.txt`);
  const concatContent = partFiles.map(f => `file '${path.resolve(f)}'`).join('\n');
  fs.writeFileSync(concatFile, concatContent);

  run(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
    `-c:v libx264 -preset fast -crf 22 ` +
    `-c:a aac -ar 48000 -ac 2 ` +
    `-movflags +faststart "${manifest.output}"`,
    `concat ${partFiles.length} parts → final.mp4`,
  );

  // Clean up temp parts
  partFiles.forEach(f => { try { fs.unlinkSync(f); } catch {} });
  try { fs.unlinkSync(concatFile); } catch {}

  // Copy metadata files alongside the video
  const metaFiles = [
    { src: manifest.captions, dest: path.join(outputDir, 'captions.json') },
    { src: manifest.quiz, dest: path.join(outputDir, 'quiz.json') },
    { src: manifest.recap, dest: path.join(outputDir, 'recap.json') },
  ];
  for (const { src, dest } of metaFiles) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // Write sources manifest
  fs.writeFileSync(
    path.join(outputDir, 'sources.json'),
    JSON.stringify({
      lessonNumber: manifest.lessonNumber,
      defId: manifest.lessonDefId,
      uuid: manifest.lessonUuid,
      title: manifest.title,
      assembledFrom: partFiles.length + ' segments',
      hasDiagram: !!manifest.diagram,
      timestamp: new Date().toISOString(),
    }, null, 2),
  );

  return manifest.output;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const lessonArg = args.find(a => a.startsWith('--lesson='));

  if (!lessonArg) {
    console.error('Usage: npx tsx scripts/assemble-lesson.ts --lesson=5 [--force] [--dry-run]');
    process.exit(1);
  }

  const lessonNum = parseInt(lessonArg.split('=')[1], 10);
  const manifestPath = path.join(MANIFESTS_DIR, `lesson-${lessonNum}.json`);

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    console.error('Run: npx tsx scripts/build-lesson-manifests.ts');
    process.exit(1);
  }

  const manifest: LessonManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  console.log(`\n=== Assembling Lesson ${lessonNum}: ${manifest.title} ===`);
  console.log(`  Segments: ${manifest.segments.length}`);
  console.log(`  Diagram: ${manifest.diagram ? 'yes' : 'no'}`);
  console.log(`  Output: ${manifest.output}`);

  if (dryRun) {
    console.log('\n[DRY RUN] Would assemble:');
    manifest.segments.forEach((s, i) => {
      console.log(`  ${i + 1}. [${s.type}] ${s.source} ${s.role ? `(${s.role})` : ''}`);
    });
    return;
  }

  const start = Date.now();
  const result = assembleLesson(manifest, force);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  if (result) {
    const stat = fs.statSync(result);
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`\n✅ Assembled: ${result} (${sizeMB} MB, ${elapsed}s)`);
  } else {
    console.log(`\n❌ Assembly failed`);
    process.exit(1);
  }
}

main();
