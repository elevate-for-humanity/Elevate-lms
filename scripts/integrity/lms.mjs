#!/usr/bin/env node
/**
 * LMS Course Integrity Check
 * Fails closed when canonical course data is missing or cannot be parsed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const PLACEHOLDER_PATTERNS = [/lorem ipsum/i,/placeholder/i,/coming soon/i,/\btbd\b/i,/\btodo\b/i,/sample content/i,/test course/i,/john doe/i,/jane doe/i];
const containsPlaceholder = (text) => Boolean(text && PLACEHOLDER_PATTERNS.some((p) => p.test(text)));

function findMatching(text, start, open, close) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractArrayAfter(text, marker, from = 0) {
  const markerIndex = text.indexOf(marker, from);
  if (markerIndex < 0) return null;
  const start = text.indexOf('[', markerIndex + marker.length);
  if (start < 0) return null;
  const end = findMatching(text, start, '[', ']');
  return end < 0 ? null : { content: text.slice(start + 1, end), start, end };
}

function splitTopLevelObjects(arrayContent) {
  const objects = [];
  let quote = null;
  let escaped = false;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < arrayContent.length; i += 1) {
    const ch = arrayContent[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(arrayContent.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objects;
}

function quotedField(objectText, field) {
  const match = objectText.match(new RegExp(`\\b${field}:\\s*['\"]([^'\"]+)['\"]`));
  return match?.[1] ?? '';
}

function countModulesAndLessons(courseText) {
  const modules = extractArrayAfter(courseText, 'modules:');
  if (!modules) return { moduleCount: 0, lessonCount: 0 };
  const moduleObjects = splitTopLevelObjects(modules.content);
  let lessonCount = 0;
  for (const moduleText of moduleObjects) {
    const lessons = extractArrayAfter(moduleText, 'lessons:');
    if (lessons) lessonCount += splitTopLevelObjects(lessons.content).length;
  }
  return { moduleCount: moduleObjects.length, lessonCount };
}

function loadCourses() {
  const coursesPath = path.join(rootDir, 'lms-data', 'courses.ts');
  if (!fs.existsSync(coursesPath)) throw new Error(`Missing canonical course data: ${coursesPath}`);
  const content = fs.readFileSync(coursesPath, 'utf-8');
  if (!content.trim()) throw new Error('Canonical course data file is empty');

  const array = extractArrayAfter(content, 'export const courses: Course[] =');
  if (!array) throw new Error('Could not locate canonical courses array');

  const courses = splitTopLevelObjects(array.content).map((courseText) => {
    const id = quotedField(courseText, 'id');
    const title = quotedField(courseText, 'title');
    const description = quotedField(courseText, 'shortDescription') || quotedField(courseText, 'description');
    const { moduleCount, lessonCount } = countModulesAndLessons(courseText);
    return { id, title, description, moduleCount, lessonCount };
  }).filter((course) => course.id && course.title);

  if (courses.length === 0) throw new Error('Course parser found zero courses; integrity cannot be proven');
  return courses;
}

function loadInstructors() {
  const instructorsPath = path.join(rootDir, 'lms-data', 'instructors.ts');
  if (!fs.existsSync(instructorsPath)) return [];
  const content = fs.readFileSync(instructorsPath, 'utf-8');
  return Array.from(content.matchAll(/id:\s*["']([^"']+)["'][\s\S]*?programId:\s*["']([^"']+)["'][\s\S]*?name:\s*["']([^"']+)["']/g)).map((m) => ({ id:m[1], programId:m[2], name:m[3] }));
}

function validateCourse(course) {
  const issues = [];
  if (!course.title || course.title.length < 3) issues.push('Missing or invalid title');
  if (!course.description || course.description.length < 10) issues.push('Missing or invalid description');
  if (containsPlaceholder(course.title) || containsPlaceholder(course.description)) issues.push('Contains placeholder content');
  if (course.moduleCount < 2) issues.push(`Insufficient modules (${course.moduleCount}, need >= 2)`);
  if (course.lessonCount < 2) issues.push(`Insufficient lessons (${course.lessonCount}, need >= 2)`);
  return { courseId: course.id, title: course.title, status: issues.length ? 'FAIL' : 'PASS', issues };
}

try {
  const courses = loadCourses();
  const instructors = loadInstructors();
  const results = courses.map(validateCourse);
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const report = { timestamp:new Date().toISOString(), summary:{ totalCourses:courses.length, passed:results.length-failed, failed, instructorsDetected:instructors.length }, results };
  fs.writeFileSync(path.join(reportsDir,'lms_integrity_report.json'), JSON.stringify(report,null,2));
  console.log(`LMS integrity: ${courses.length} courses, ${failed} failed, ${instructors.length} instructors detected.`);
  if (failed) {
    for (const r of results.filter((r)=>r.status==='FAIL')) console.error(`FAIL ${r.title}: ${r.issues.join('; ')}`);
    process.exit(1);
  }
  console.log('PASS: LMS course integrity proven from canonical course data.');
  process.exit(0);
} catch (error) {
  const report = { timestamp:new Date().toISOString(), summary:{ totalCourses:0, passed:0, failed:1 }, fatalError:String(error?.message || error), results:[] };
  fs.writeFileSync(path.join(reportsDir,'lms_integrity_report.json'), JSON.stringify(report,null,2));
  console.error(`FAIL: LMS integrity could not be proven: ${report.fatalError}`);
  process.exit(1);
}
