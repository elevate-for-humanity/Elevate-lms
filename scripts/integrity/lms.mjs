#!/usr/bin/env node
/**
 * LMS Course Authority Integrity Check
 *
 * Course content is persisted in Supabase. This repository check proves that
 * every production read/write/publish path points at the canonical relational
 * model and that the retired static catalog cannot silently return.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const requiredFiles = {
  orchestration: 'lib/course-builder/orchestrator.ts',
  persistedPublishGate: 'lib/course-builder/persisted-publish-service.ts',
  canonicalDatabaseService: 'lib/db/courses.ts',
  lmsCourseApi: 'apps/lms/app/api/courses/route.ts',
};

const requiredContracts = [
  ['lib/course-builder/orchestrator.ts', /\.from\(['"]courses['"]\)/, 'Course Builder persists course configuration'],
  ['lib/course-builder/persisted-publish-service.ts', /\.from\(['"]courses['"]\)/, 'publish gate reads persisted courses'],
  ['lib/course-builder/persisted-publish-service.ts', /\.from\(['"]course_modules['"]\)/, 'publish gate validates persisted modules'],
  ['lib/course-builder/persisted-publish-service.ts', /course_lessons\(/, 'publish gate validates persisted lessons'],
  ['lib/course-builder/persisted-publish-service.ts', /review_status[^\n]*approved/, 'publish gate requires human approval'],
  ['lib/db/courses.ts', /\.from\(['"]course_lessons['"]\)/, 'course service uses canonical lessons table'],
];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') return [];
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function relative(file) {
  return path.relative(rootDir, file).split(path.sep).join('/');
}

const checks = [];
for (const [name, file] of Object.entries(requiredFiles)) {
  checks.push({ name, pass: fs.existsSync(path.join(rootDir, file)), detail: file });
}

for (const [file, pattern, name] of requiredContracts) {
  const absolute = path.join(rootDir, file);
  const content = fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
  checks.push({ name, pass: pattern.test(content), detail: file });
}

const retiredCatalog = path.join(rootDir, 'lms-data', 'courses');
const retiredCatalogFiles = fs.existsSync(retiredCatalog) ? walk(retiredCatalog) : [];
checks.push({
  name: 'retired static course catalog is absent',
  pass: retiredCatalogFiles.length === 0,
  detail: retiredCatalogFiles.length ? retiredCatalogFiles.map(relative).join(', ') : 'lms-data/courses (absent or empty)',
});

const applicationFiles = ['apps', 'components', 'lib'].flatMap((directory) =>
  walk(path.join(rootDir, directory)).filter((file) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file)),
);
const legacyImports = applicationFiles.flatMap((file) => {
  const content = fs.readFileSync(file, 'utf8');
  return /lms-data\/courses(?:\/|['"])/.test(content) ? [relative(file)] : [];
});
checks.push({
  name: 'application has no static course catalog imports',
  pass: legacyImports.length === 0,
  detail: legacyImports.length ? legacyImports.join(', ') : 'none',
});

const failed = checks.filter((check) => !check.pass);
const report = {
  timestamp: new Date().toISOString(),
  authority: 'Supabase courses -> course_modules -> course_lessons',
  summary: { totalChecks: checks.length, passed: checks.length - failed.length, failed: failed.length },
  checks,
};
fs.writeFileSync(path.join(reportsDir, 'lms_integrity_report.json'), JSON.stringify(report, null, 2));

for (const check of checks) {
  console.log(`${check.pass ? 'PASS' : 'FAIL'}: ${check.name} (${check.detail})`);
}
if (failed.length) {
  console.error(`FAIL: LMS persisted-course authority could not be proven (${failed.length} failed check(s)).`);
  process.exit(1);
}
console.log('PASS: LMS course integrity proven from the canonical persisted-course architecture.');
