#!/usr/bin/env tsx
/**
 * Build lesson assembly manifests for all courses.
 *
 * Scans temp/generated-lessons/, config/brandon-clips.json, and
 * lib/courses/hvac-uuids.ts to produce one JSON manifest per lesson.
 *
 * Each manifest describes the segments to assemble into a final lesson video:
 *   Brandon intro → Diagram+Narration → Brandon explain → Diagram+Narration → Brandon recap → Outro
 *
 * Usage:
 *   npx tsx scripts/build-lesson-manifests.ts                    # all lessons
 *   npx tsx scripts/build-lesson-manifests.ts --lesson=5         # single lesson
 *   npx tsx scripts/build-lesson-manifests.ts --dry-run          # preview only
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const GENERATED_DIR = 'temp/generated-lessons';
const BRANDON_CLIPS_DIR = 'temp/lesson5-v10';
const OUTPUT_DIR = 'output/manifests';
const BRANDON_CONFIG = 'config/brandon-clips.json';

interface BrandonClip {
  file: string;
  duration: number;
  notes: string;
}

interface BrandonConfig {
  source_dir: string;
  roles: Record<string, { clips: BrandonClip[] }>;
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

interface Segment {
  type: 'presenter' | 'diagram' | 'narration';
  source: string;
  role?: string;
  duration?: number;
  label?: string;
}

// ---------------------------------------------------------------------------
// Load Brandon clips config
// ---------------------------------------------------------------------------

function loadBrandonClips(): BrandonConfig {
  const raw = fs.readFileSync(BRANDON_CONFIG, 'utf-8');
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Load HVAC UUIDs from the TS source
// ---------------------------------------------------------------------------

function loadHvacUuids(): Record<string, string> {
  const src = fs.readFileSync('lib/courses/hvac-uuids.ts', 'utf-8');
  const map: Record<string, string> = {};
  const re = /'(hvac-\d+-\d+)':\s*'([a-f0-9-]+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    map[m[1]] = m[2];
  }
  return map;
}

// ---------------------------------------------------------------------------
// Load lesson titles from content.json
// ---------------------------------------------------------------------------

function loadLessonTitle(lessonNum: number): string {
  const contentPath = path.join(GENERATED_DIR, `lesson-${lessonNum}`, 'content.json');
  if (!fs.existsSync(contentPath)) return `Lesson ${lessonNum}`;
  try {
    const data = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    // content.json has script + labels but no title field — derive from definitions
    return `Lesson ${lessonNum}`;
  } catch {
    return `Lesson ${lessonNum}`;
  }
}

// ---------------------------------------------------------------------------
// Load lesson titles from course definitions
// ---------------------------------------------------------------------------

function loadLessonTitles(): Record<string, string> {
  const src = fs.readFileSync('lib/courses/definitions.ts', 'utf-8');
  const titles: Record<string, string> = {};
  // Match: id: "hvac-01-01", title: "Welcome to HVAC..."
  const re = /id:\s*["'](hvac-\d+-\d+)["'],\s*title:\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    titles[m[1]] = m[2];
  }
  return titles;
}

// ---------------------------------------------------------------------------
// Pick Brandon clips by role with round-robin to avoid repetition
// ---------------------------------------------------------------------------

const clipCounters: Record<string, number> = {};

function pickClip(brandon: BrandonConfig, role: string): BrandonClip | null {
  const roleData = brandon.roles[role];
  if (!roleData || roleData.clips.length === 0) return null;
  const idx = (clipCounters[role] || 0) % roleData.clips.length;
  clipCounters[role] = idx + 1;
  return roleData.clips[idx];
}

// ---------------------------------------------------------------------------
// Build manifest for a single lesson
// ---------------------------------------------------------------------------

function buildManifest(
  lessonNum: number,
  defId: string,
  uuid: string,
  title: string,
  brandon: BrandonConfig,
): LessonManifest {
  const lessonDir = path.join(GENERATED_DIR, `lesson-${lessonNum}`);
  const segments: Segment[] = [];

  // 1. Brandon intro
  const introClip = pickClip(brandon, 'intro');
  if (introClip) {
    segments.push({
      type: 'presenter',
      source: path.join(BRANDON_CLIPS_DIR, introClip.file),
      role: 'intro',
      duration: introClip.duration,
    });
  }

  // 2. Diagram segment (if available)
  const diagramPath = path.join(lessonDir, 'diagram-720.png');
  const hasDiagram = fs.existsSync(diagramPath);
  if (hasDiagram) {
    segments.push({
      type: 'diagram',
      source: diagramPath,
      label: 'concept-diagram',
    });
  }

  // 3. Main narration (audio over diagram or b-roll)
  const audioPath = path.join(lessonDir, 'audio.mp3');
  if (fs.existsSync(audioPath)) {
    segments.push({
      type: 'narration',
      source: audioPath,
    });
  }

  // 4. Brandon explanation (mid-lesson)
  const explainClip = pickClip(brandon, 'explanation');
  if (explainClip) {
    segments.push({
      type: 'presenter',
      source: path.join(BRANDON_CLIPS_DIR, explainClip.file),
      role: 'explanation',
      duration: explainClip.duration,
    });
  }

  // 5. Brandon recap
  const recapClip = pickClip(brandon, 'recap');
  if (recapClip) {
    segments.push({
      type: 'presenter',
      source: path.join(BRANDON_CLIPS_DIR, recapClip.file),
      role: 'recap',
      duration: recapClip.duration,
    });
  }

  // 6. Brandon outro
  const outroClip = pickClip(brandon, 'outro');
  if (outroClip) {
    segments.push({
      type: 'presenter',
      source: path.join(BRANDON_CLIPS_DIR, outroClip.file),
      role: 'outro',
      duration: outroClip.duration,
    });
  }

  return {
    lessonNumber: lessonNum,
    lessonDefId: defId,
    lessonUuid: uuid,
    title,
    segments,
    audio: audioPath,
    captions: path.join(lessonDir, 'captions.json'),
    quiz: path.join(lessonDir, 'quiz.json'),
    recap: path.join(lessonDir, 'recap.json'),
    diagram: hasDiagram ? diagramPath : null,
    output: `output/final-lessons/lesson-${lessonNum}/final.mp4`,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const lessonArg = args.find(a => a.startsWith('--lesson='));
  const singleLesson = lessonArg ? parseInt(lessonArg.split('=')[1], 10) : null;

  // Load configs
  const brandon = loadBrandonClips();
  const uuids = loadHvacUuids();
  const titles = loadLessonTitles();

  // Build defId → lessonNumber mapping
  // hvac-01-01 is lesson 1, hvac-01-02 is lesson 2, etc.
  const defIds = Object.keys(uuids).sort();
  const defIdToNum: Record<string, number> = {};
  defIds.forEach((id, i) => { defIdToNum[id] = i + 1; });

  // Filter to single lesson if requested
  const targetDefIds = singleLesson
    ? defIds.filter(id => defIdToNum[id] === singleLesson)
    : defIds;

  if (!dryRun) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifests: LessonManifest[] = [];
  const missing: string[] = [];

  for (const defId of targetDefIds) {
    const num = defIdToNum[defId];
    const uuid = uuids[defId];
    const title = titles[defId] || `Lesson ${num}`;
    const lessonDir = path.join(GENERATED_DIR, `lesson-${num}`);

    if (!fs.existsSync(lessonDir)) {
      missing.push(`lesson-${num}: directory missing`);
      continue;
    }

    if (!fs.existsSync(path.join(lessonDir, 'audio.mp3'))) {
      missing.push(`lesson-${num}: audio.mp3 missing`);
      continue;
    }

    const manifest = buildManifest(num, defId, uuid, title, brandon);
    manifests.push(manifest);

    if (!dryRun) {
      const outPath = path.join(OUTPUT_DIR, `lesson-${num}.json`);
      fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
    }
  }

  // Summary
  console.log(`\n=== Manifest Generation ===`);
  console.log(`Total lessons: ${targetDefIds.length}`);
  console.log(`Manifests built: ${manifests.length}`);
  console.log(`With diagrams: ${manifests.filter(m => m.diagram).length}`);
  console.log(`Missing/skipped: ${missing.length}`);

  if (missing.length > 0) {
    console.log(`\nMissing assets:`);
    missing.forEach(m => console.log(`  ⚠️  ${m}`));
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] No files written.`);
    if (manifests.length > 0) {
      console.log(`\nSample manifest (lesson ${manifests[0].lessonNumber}):`);
      console.log(JSON.stringify(manifests[0], null, 2));
    }
  } else {
    console.log(`\nManifests written to: ${OUTPUT_DIR}/`);
  }

  // Build course index
  if (!dryRun && manifests.length > 0) {
    const courseIndex = buildCourseIndex(manifests, titles);
    const indexDir = 'output/course-index';
    fs.mkdirSync(indexDir, { recursive: true });
    fs.writeFileSync(
      path.join(indexDir, 'hvac-course.json'),
      JSON.stringify(courseIndex, null, 2),
    );
    console.log(`Course index written to: ${indexDir}/hvac-course.json`);
  }
}

// ---------------------------------------------------------------------------
// Build course index (modules → lessons)
// ---------------------------------------------------------------------------

function buildCourseIndex(manifests: LessonManifest[], titles: Record<string, string>) {
  // Group by module (hvac-01, hvac-02, etc.)
  const moduleMap: Record<string, LessonManifest[]> = {};
  for (const m of manifests) {
    const modId = m.lessonDefId.replace(/-\d+$/, ''); // hvac-01-03 → hvac-01
    if (!moduleMap[modId]) moduleMap[modId] = [];
    moduleMap[modId].push(m);
  }

  // Load module titles from definitions
  const defSrc = fs.readFileSync('lib/courses/definitions.ts', 'utf-8');
  const modTitles: Record<string, string> = {};
  const modRe = /id:\s*["'](hvac-\d+)["'],\s*\n?\s*title:\s*["']([^"']+)["']/g;
  let mm: RegExpExecArray | null;
  while ((mm = modRe.exec(defSrc)) !== null) {
    modTitles[mm[1]] = mm[2];
  }

  const modules = Object.entries(moduleMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([modId, lessons]) => ({
      moduleId: modId,
      title: modTitles[modId] || modId,
      lessons: lessons
        .sort((a, b) => a.lessonNumber - b.lessonNumber)
        .map(l => ({
          lessonId: l.lessonDefId,
          lessonNumber: l.lessonNumber,
          uuid: l.lessonUuid,
          title: l.title,
          video: l.output,
          audio: l.audio,
          captions: l.captions,
          quiz: l.quiz,
          recap: l.recap,
          diagram: l.diagram,
        })),
    }));

  return {
    course: 'HVAC Technician Training',
    courseId: 'f0593164-55be-5867-98e7-8a86770a8dd0',
    totalLessons: manifests.length,
    totalModules: modules.length,
    modules,
  };
}

main();
