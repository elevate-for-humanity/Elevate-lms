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

function loadCourses() {
  const coursesPath = path.join(rootDir, 'lms-data', 'courses.ts');
  if (!fs.existsSync(coursesPath)) throw new Error(`Missing canonical course data: ${coursesPath}`);
  const content = fs.readFileSync(coursesPath, 'utf-8');
  if (!content.trim()) throw new Error('Canonical course data file is empty');

  const courses = [];
  const courseMatches = content.matchAll(/{\s*id:\s*["']([^"']+)["'][\s\S]*?title:\s*["']([^"']+)["'][\s\S]*?(?:shortDescription|description):\s*["']([^"']+)["'][\s\S]*?modules:\s*\[([\s\S]*?)\]\s*[,}]/g);
  for (const match of courseMatches) {
    const moduleContent = match[4];
    const moduleCount = (moduleContent.match(/\bid:\s*["'][^"']+["']/g) || []).length;
    const lessonCount = (moduleContent.match(/\blessons\s*:/g) || []).length;
    courses.push({ id: match[1], title: match[2], description: match[3], moduleCount, lessonCount });
  }
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
  if (course.lessonCount < 2) issues.push(`Insufficient lesson structure (${course.lessonCount} module lesson collections detected)`);
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
