/**
 * Scans all lesson assets and generates per-lesson assembly manifests.
 *
 * Each manifest defines the segment sequence:
 *   Brandon intro → Diagram with TTS → Brandon explain → Diagram detail → Brandon recap → Outro
 *
 * Usage:
 *   npx tsx scripts/build-hvac-lesson-manifests.ts
 *   npx tsx scripts/build-hvac-lesson-manifests.ts --lesson 10
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve(__dirname, '..');
const GEN_DIR = path.join(ROOT, 'temp/generated-lessons');
const CLIPS_DIR = path.join(ROOT, 'temp/lesson5-v10');
const CLIPS_CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/brandon-clips.json'), 'utf-8'));
const OUT_DIR = path.join(ROOT, 'output/manifests');
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

interface Segment {
  type: 'brandon' | 'diagram' | 'title-card';
  role: string;
  source: string;
  audio?: string;
  duration?: number;
  labels?: { text: string; fadeInSec: number }[];
  title?: string;
}

interface LessonManifest {
  lessonNumber: number;
  title: string;
  segments: Segment[];
  assets: {
    audio: string | null;
    diagram: string | null;
    captions: string | null;
    quiz: string | null;
    recap: string | null;
    content: string | null;
  };
  warnings: string[];
}

function getDuration(filePath: string): number {
  try {
    return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`).toString().trim());
  } catch { return 0; }
}

function pickClip(role: string, index: number): string {
  const roleData = CLIPS_CONFIG.roles[role];
  if (!roleData || roleData.clips.length === 0) return '';
  const clip = roleData.clips[index % roleData.clips.length];
  return path.join(CLIPS_DIR, clip.file);
}

function buildManifest(lessonNumber: number): LessonManifest {
  const lessonDir = path.join(GEN_DIR, `lesson-${lessonNumber}`);
  const warnings: string[] = [];

  // Check what assets exist
  const audioPath = path.join(lessonDir, 'audio.mp3');
  const diagramPath = path.join(lessonDir, 'diagram-720.png');
  const captionsPath = path.join(lessonDir, 'captions.json');
  const quizPath = path.join(lessonDir, 'quiz.json');
  const recapPath = path.join(lessonDir, 'recap.json');
  const contentPath = path.join(lessonDir, 'content.json');

  const hasAudio = fs.existsSync(audioPath);
  const hasDiagram = fs.existsSync(diagramPath);
  const hasCaptions = fs.existsSync(captionsPath);
  const hasContent = fs.existsSync(contentPath);

  if (!hasAudio) warnings.push('Missing audio.mp3');
  if (!hasContent) warnings.push('Missing content.json');

  // Load content for title and labels
  let title = `Lesson ${lessonNumber}`;
  let labels: { text: string; fadeInSec: number }[] = [];
  let needsDiagram = false;

  if (hasContent) {
    const content = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    title = content.script?.split('.')[0]?.replace(/^Welcome to /, '') || title;
    labels = content.labels || [];
    needsDiagram = content.needsDiagram;
  }

  // Get audio duration to split into segments
  const audioDur = hasAudio ? getDuration(audioPath) : 60;

  // Build segment sequence following the training pattern:
  // Brandon intro → Diagram with TTS part 1 → Brandon explain → Diagram with TTS part 2 → Brandon recap → Outro
  const segments: Segment[] = [];

  // 1. Brandon intro (reusable motion clip)
  const introClip = pickClip('intro', 0);
  if (introClip && fs.existsSync(introClip)) {
    segments.push({
      type: 'brandon',
      role: 'intro',
      source: introClip,
      duration: getDuration(introClip),
    });
  } else {
    warnings.push('Missing intro Brandon clip');
  }

  if (hasDiagram && needsDiagram) {
    // 2. Diagram segment with first half of TTS audio + labels
    const halfDur = audioDur / 2;
    const firstLabels = labels.slice(0, 2);
    segments.push({
      type: 'diagram',
      role: 'concept',
      source: diagramPath,
      audio: audioPath,
      duration: halfDur,
      labels: firstLabels,
      title: `Lesson ${lessonNumber}`,
    });

    // 3. Brandon explanation (motion clip — pick based on lesson number for variety)
    const explainClip = pickClip('explanation', lessonNumber);
    if (explainClip && fs.existsSync(explainClip)) {
      segments.push({
        type: 'brandon',
        role: 'explanation',
        source: explainClip,
        duration: getDuration(explainClip),
      });
    }

    // 4. Diagram segment with second half of TTS audio + remaining labels
    const secondLabels = labels.slice(2);
    segments.push({
      type: 'diagram',
      role: 'detail',
      source: diagramPath,
      audio: audioPath,
      duration: halfDur,
      labels: secondLabels,
      title: `Lesson ${lessonNumber}`,
    });
  } else {
    // Non-diagram lesson: Brandon explains over title card with TTS audio
    segments.push({
      type: 'title-card',
      role: 'concept',
      source: '',
      audio: audioPath,
      duration: audioDur,
      labels,
      title: `Lesson ${lessonNumber}`,
    });
  }

  // 5. Brandon recap (motion clip)
  const recapClip = pickClip('recap', 0);
  if (recapClip && fs.existsSync(recapClip)) {
    segments.push({
      type: 'brandon',
      role: 'recap',
      source: recapClip,
      duration: getDuration(recapClip),
    });
  }

  // 6. Brandon outro (motion clip)
  const outroClip = pickClip('outro', 0);
  if (outroClip && fs.existsSync(outroClip)) {
    segments.push({
      type: 'brandon',
      role: 'outro',
      source: outroClip,
      duration: getDuration(outroClip),
    });
  }

  return {
    lessonNumber,
    title,
    segments,
    assets: {
      audio: hasAudio ? audioPath : null,
      diagram: hasDiagram ? diagramPath : null,
      captions: hasCaptions ? captionsPath : null,
      quiz: fs.existsSync(quizPath) ? quizPath : null,
      recap: fs.existsSync(recapPath) ? recapPath : null,
      content: hasContent ? contentPath : null,
    },
    warnings,
  };
}

// ── Main ──

const args = process.argv.slice(2);
let filterLesson: number | null = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--lesson' && args[i + 1]) filterLesson = parseInt(args[i + 1]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// Find all lesson directories
const lessonDirs = fs.readdirSync(GEN_DIR)
  .filter(d => d.startsWith('lesson-'))
  .map(d => parseInt(d.replace('lesson-', '')))
  .sort((a, b) => a - b);

const toProcess = filterLesson ? lessonDirs.filter(n => n === filterLesson) : lessonDirs;

console.log(`\n=== Building Lesson Manifests ===`);
console.log(`Lessons: ${toProcess.length}`);
console.log(`Brandon clips: ${Object.values(CLIPS_CONFIG.roles).reduce((sum: number, r: any) => sum + r.clips.length, 0)}`);
console.log('');

let totalWarnings = 0;

for (const num of toProcess) {
  const manifest = buildManifest(num);
  const outPath = path.join(OUT_DIR, `lesson-${num}.json`);
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

  const segSummary = manifest.segments.map(s => `${s.role}(${s.type})`).join(' → ');
  const warnStr = manifest.warnings.length > 0 ? ` ⚠️ ${manifest.warnings.join(', ')}` : '';
  totalWarnings += manifest.warnings.length;

  console.log(`[${num}] ${segSummary}${warnStr}`);
}

console.log(`\nManifests written to: ${OUT_DIR}`);
console.log(`Total warnings: ${totalWarnings}`);
