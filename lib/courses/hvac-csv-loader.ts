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

/** RFC 4180-compliant CSV parser — handles quoted fields with embedded commas and newlines. */
function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuote = false;
  let i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (inQuote) {
      if (c === '"' && raw[i + 1] === '"') { cur += '"'; i += 2; continue; }
      if (c === '"')                        { inQuote = false; i++; continue; }
      cur += c; i++; continue;
    }
    if (c === '"')  { inQuote = true; i++; continue; }
    if (c === ',')  { row.push(cur); cur = ''; i++; continue; }
    if (c === '\r' && raw[i + 1] === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i += 2; continue; }
    if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; i++; continue; }
    cur += c; i++;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

let _cache: HvacLesson[] | null = null;

export function getAllHvacLessons(): HvacLesson[] {
  if (_cache) return _cache;

  const csvPath = path.join(process.cwd(), 'data', 'hvac-master-curriculum.csv');
  const raw = readFileSync(csvPath, 'utf8');
  const parsed = parseCSV(raw);
  const headers = parsed[0];
  const rows: Record<string, string>[] = parsed.slice(1)
    .filter(r => r.length === headers.length && r[0])
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));

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
