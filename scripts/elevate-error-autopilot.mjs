#!/usr/bin/env node
// Elevate LMS – Error Autopilot
// Reads logs from the runner script and emits a human task list (no placeholders).

import fs from 'fs';
import path from 'path';

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) return null;
  return process.argv[index + 1];
}

const tsLogPath = readArg('--ts');
const buildLogPath = readArg('--build');
const migrationsLogPath = readArg('--migrations');
const eslintLogPath = readArg('--eslint');
const prettierLogPath = readArg('--prettier');
const envReportPath = readArg('--env');

const tsStatus = Number(readArg('--tsStatus') || '0');
const buildStatus = Number(readArg('--buildStatus') || '0');
const migrationStatus = Number(readArg('--migrationStatus') || '0');
const eslintStatus = Number(readArg('--eslintStatus') || '0');
const prettierStatus = Number(readArg('--prettierStatus') || '0');

function safeRead(filePath) {
  if (!filePath) return '';
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch {
    // ignore
  }
  return '';
}

const tsLog = safeRead(tsLogPath);
const buildLog = safeRead(buildLogPath);
const migrationsLog = safeRead(migrationsLogPath);
const eslintLog = safeRead(eslintLogPath);
const prettierLog = safeRead(prettierLogPath);
const envReport = safeRead(envReportPath);

function printSection(title) {
}

function parseTsErrors(log) {
  const lines = log.split('\n');
  const results = [];
  const tsRegex =
    /^(.+\.tsx?|.+\.ts):(\d+):(\d+)\s*-\s*error\s*(TS\d+):\s*(.+)$/;

  for (const raw of lines) {
    const line = raw.trim();
    const match = tsRegex.exec(line);
    if (match) {
      const [, file, lineNum, colNum, code, msg] = match;
      results.push({
        file: path.normalize(file),
        line: Number(lineNum),
        column: Number(colNum),
        code,
        message: msg.trim(),
      });
    }
  }

  return results;
}

function parseBuildErrors(log) {
  const lines = log.split('\n');
  const relevant = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Highlight error lines
    if (
      line.toLowerCase().includes('error') ||
      line.toLowerCase().includes('failed') ||
      line.toLowerCase().includes('cannot find module') ||
      line.toLowerCase().includes('module not found')
    ) {
      relevant.push(line);
    }
  }

  return relevant;
}

function parseEslintErrors(log) {
  const lines = log.split('\n');
  const max = 50; // avoid dumping thousands
  const out = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (out.length >= max) break;
    out.push(line);
  }
  return out;
}

function hasContent(str) {
  return str && str.trim().length > 0;
}

// START REPORT

// ENV
if (hasContent(envReport)) {
  printSection('Environment status');
}

// TYPESCRIPT
const tsErrors = tsStatus !== 0 ? parseTsErrors(tsLog) : [];
if (tsStatus !== 0) {
  printSection('TypeScript errors (must fix line-by-line)');

  if (tsErrors.length === 0) {
      'TypeScript returned an error code but no standard TS lines were parsed.'
    );
  } else {
    const grouped = new Map();
    for (const err of tsErrors) {
      if (!grouped.has(err.file)) grouped.set(err.file, []);
      grouped.get(err.file).push(err);
    }

    for (const [file, errs] of grouped.entries()) {
      for (const e of errs) {
          `  • line ${e.line}, column ${e.column} – ${e.code} – ${e.message}`
        );
      }
    }

      '➡ ACTION: Open each file above and fix the listed lines and TypeScript codes.'
    );
  }
} else {
  printSection('TypeScript');
}

// BUILD
if (buildStatus !== 0) {
  const buildErrors = parseBuildErrors(buildLog);
  printSection('Next.js build failures');

  if (buildErrors.length === 0) {
  } else {
    for (const line of buildErrors) {
    }

      '➡ ACTION: Most of these map to import issues, invalid props, or server/client misuse.'
    );
      '   Fix from top to bottom. Once done, re-run the autopilot script.'
    );
  }
} else {
  printSection('Next.js build');
}

// SUPABASE
if (migrationStatus !== 0) {
  if (hasContent(migrationsLog)) {
    printSection('Supabase migration issues');
    const lines = migrationsLog.split('\n').filter((l) => l.trim());
    for (const line of lines) {
    }
      '➡ ACTION: Fix SQL errors or missing database objects, then re-run migrations.'
    );
  } else {
    printSection('Supabase migration issues');
      'Supabase returned a non-zero exit code but no log was captured.'
    );
  }
} else {
  printSection('Supabase migrations');
}

// ESLINT
if (eslintStatus !== 0) {
  const eslintSummary = parseEslintErrors(eslintLog);
  printSection('ESLint warnings/errors');

  if (eslintSummary.length === 0) {
  } else {
    for (const line of eslintSummary) {
    }
      '➡ ACTION: Fix style and logic issues flagged above to keep the codebase clean.'
    );
  }
} else {
  printSection('ESLint');
}

// PRETTIER
if (prettierStatus !== 0) {
  printSection('Prettier issues');
  if (hasContent(prettierLog)) {
    const lines = prettierLog.split('\n').filter((l) => l.trim());
    for (const line of lines.slice(0, 50)) {
    }
  } else {
  }
    '➡ ACTION: Fix the files Prettier could not format (likely syntax errors).'
  );
} else {
  printSection('Prettier');
}

// FINAL SUMMARY
printSection('Summary');

const blockers = [];

if (tsStatus !== 0) blockers.push('TypeScript compilation errors');
if (buildStatus !== 0) blockers.push('Next.js build failures');
if (migrationStatus !== 0) blockers.push('Supabase migration problems');

if (blockers.length === 0) {
} else {
  for (const b of blockers) {
  }
    '➡ Fix the issues above file-by-file and re-run scripts/elevate-autopilot.sh'
  );
}

