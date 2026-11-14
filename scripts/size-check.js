#!/usr/bin/env node
// Enhanced bundle size check with per-file budget + JSON artifact output
const fs = require('fs');
const path = require('path');

const dist = path.join(process.cwd(), 'client', 'dist');
const budgetKB = parseInt(process.env.BUNDLE_BUDGET_KB || '800', 10); // total budget
const singleKB = parseInt(process.env.BUNDLE_SINGLE_MAX_KB || '260', 10); // per-file max
const artifactDir = path.join(process.cwd(), 'artifacts');
const artifactFile = path.join(artifactDir, 'size-report.json');

function walk(dir, list = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, list);
    else list.push({ file: full, size: stat.size });
  }
  return list;
}

if (!fs.existsSync(dist)) {
  process.exit(1);
}

const files = walk(dist).filter((f) => /\.(js|css)$/.test(f.file));
const total = files.reduce((a, b) => a + b.size, 0);
const totalKB = Math.round(total / 1024);
const largest = files
  .slice()
  .sort((a, b) => b.size - a.size)
  .slice(0, 10);

let fail = false;
  `[size-check] total bytes=${total} (~${totalKB}KB) budget=${budgetKB}KB singleFileMax=${singleKB}KB`
);
for (const f of largest) {
  const kb = Math.round(f.size / 1024);
  const rel = f.file.replace(process.cwd(), '').slice(1);
  const over = kb > singleKB ? '  << OVER SINGLE FILE LIMIT' : '';
  if (over) fail = true;
}

if (totalKB > budgetKB) {
    `[size-check] FAIL: bundle ${totalKB}KB exceeds total budget ${budgetKB}KB`
  );
  fail = true;
}

// Write JSON artifact
try {
  if (!fs.existsSync(artifactDir))
    fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(
    artifactFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalBytes: total,
        totalKB,
        budgetKB,
        singleKB,
        largest: largest.map((f) => ({
          file: f.file.replace(process.cwd(), '').slice(1),
          bytes: f.size,
        })),
      },
      null,
      2
    )
  );
} catch (e) {
}

if (fail) process.exit(1);
