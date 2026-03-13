#!/usr/bin/env tsx
/**
 * Batch-assemble all lesson videos from manifests.
 *
 * Usage:
 *   npx tsx scripts/assemble-all-lessons.ts              # all lessons
 *   npx tsx scripts/assemble-all-lessons.ts --force       # re-assemble even if output exists
 *   npx tsx scripts/assemble-all-lessons.ts --dry-run     # preview only
 *   npx tsx scripts/assemble-all-lessons.ts --from=10     # start from lesson 10
 *   npx tsx scripts/assemble-all-lessons.ts --to=20       # stop at lesson 20
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MANIFESTS_DIR = 'output/manifests';

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const fromArg = args.find(a => a.startsWith('--from='));
  const toArg = args.find(a => a.startsWith('--to='));
  const fromNum = fromArg ? parseInt(fromArg.split('=')[1], 10) : 1;
  const toNum = toArg ? parseInt(toArg.split('=')[1], 10) : 999;

  // Find all manifest files
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const num = parseInt(f.replace('lesson-', '').replace('.json', ''), 10);
      return { file: f, num };
    })
    .filter(({ num }) => num >= fromNum && num <= toNum)
    .sort((a, b) => a.num - b.num);

  console.log(`\n=== Batch Assembly ===`);
  console.log(`Lessons: ${manifestFiles.length} (${fromNum}-${toNum})`);
  console.log(`Force: ${force}`);
  console.log(`Dry run: ${dryRun}\n`);

  let assembled = 0;
  let skipped = 0;
  let failed = 0;
  const startTime = Date.now();

  for (const { file, num } of manifestFiles) {
    const forceFlag = force ? '--force' : '';
    const cmd = `npx tsx scripts/assemble-lesson.ts --lesson=${num} ${forceFlag}`;

    if (dryRun) {
      console.log(`[DRY RUN] Would run: ${cmd}`);
      skipped++;
      continue;
    }

    try {
      console.log(`\n--- Lesson ${num} ---`);
      execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), timeout: 300_000 });
      assembled++;
    } catch (err) {
      console.error(`❌ Lesson ${num} failed`);
      failed++;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

  console.log(`\n=== Batch Complete ===`);
  console.log(`Assembled: ${assembled}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Time: ${elapsed}s`);

  if (assembled > 0) {
    // Calculate total output size
    let totalBytes = 0;
    for (let i = fromNum; i <= toNum; i++) {
      const outPath = `output/final-lessons/lesson-${i}/final.mp4`;
      if (fs.existsSync(outPath)) {
        totalBytes += fs.statSync(outPath).size;
      }
    }
    console.log(`Total output: ${(totalBytes / 1024 / 1024).toFixed(0)} MB`);
  }
}

main();
