/**
 * Loads HVAC lesson data from data/hvac-master-curriculum.csv.
 * This is the single source of truth for all lesson content per the spec.
 * Called server-side only (Next.js Server Components / generateStaticParams).
 */

import { readFileSync } from 'fs';
import path from 'path';

export interface HvacLesson {
  lessonId:       string;  // e.g. hvac-01-01
  module:         string;  // e.g. Program Orientation
  lessonOrder:    number;
  lessonTitle:    string;
  scriptText:     string;
  diagramPrompt:  string;
  diagramFile:    string;  // e.g. ref-cycle-overview.png
  videoFile:      string;  // canonical: hvac/videos/lesson-{uuid}.mp4
  audioFile:      string;  // canonical: hvac/audio/lesson-{uuid}.mp3
  quizQuestion:   string;
  quizAnswer:     string;
  keyConcept:     string;
  durationMin:    number;
}

function parseCSVRow(line: string): string[] {
  const cols: string[] = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && !inQuote)                        { inQuote = true;  continue; }
    if (c === '"' && inQuote && line[i + 1] === '"')  { cur += '"'; i++; continue; }
    if (c === '"' && inQuote)                         { inQuote = false; continue; }
    if (c === ',' && !inQuote)                        { cols.push(cur); cur = ''; continue; }
    cur += c;
  }
  cols.push(cur);
  return cols;
}

let _cache: HvacLesson[] | null = null;

export function getAllHvacLessons(): HvacLesson[] {
  if (_cache) return _cache;

  const csvPath = path.join(process.cwd(), 'data', 'hvac-master-curriculum.csv');

  // Use Python for reliable CSV parsing — handles quoted fields with embedded
  // commas and newlines that the hand-rolled JS parser breaks on.
  const { execSync } = require('child_process') as typeof import('child_process');
  const jsonStr = execSync(
    `python3 -c "
import csv, json, sys
with open('${csvPath.replace(/\\/g, '/')}') as f:
    rows = list(csv.DictReader(f))
sys.stdout.write(json.dumps(rows))
"`,
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  const rows: Record<string, string>[] = JSON.parse(jsonStr);

  _cache = rows.map(row => ({
    lessonId:      row['Lesson_ID']          ?? '',
    module:        row['Module']             ?? '',
    lessonOrder:   parseInt(row['Lesson_Order'] ?? '0', 10) || 0,
    lessonTitle:   row['Lesson_Title']       ?? '',
    scriptText:    row['Script_Text']        ?? '',
    diagramPrompt: row['Diagram_Prompt']     ?? '',
    diagramFile:   row['Diagram_File']       ?? 'ref-cycle-overview.png',
    videoFile:     row['Video_File']         ?? '',
    audioFile:     row['Audio_File']         ?? '',
    quizQuestion:  row['Quiz_Question']      ?? '',
    quizAnswer:    row['Quiz_Answer']        ?? '',
    keyConcept:    row['Key_Concept']        ?? '',
    durationMin:   parseInt(row['Lesson_Duration_Min'] ?? '3', 10) || 3,
  })).filter(l => l.lessonId.startsWith('hvac-'));

  return _cache;
}

export function getHvacLesson(lessonId: string): HvacLesson | null {
  return getAllHvacLessons().find(l => l.lessonId === lessonId) ?? null;
}

/** Returns all unique modules in order */
export function getHvacModules(): string[] {
  const seen = new Set<string>();
  const modules: string[] = [];
  for (const l of getAllHvacLessons()) {
    if (!seen.has(l.module)) { seen.add(l.module); modules.push(l.module); }
  }
  return modules;
}

/** Returns lessons for a given module */
export function getLessonsForModule(module: string): HvacLesson[] {
  return getAllHvacLessons().filter(l => l.module === module);
}
