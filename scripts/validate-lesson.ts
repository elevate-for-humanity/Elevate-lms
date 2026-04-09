/**
 * scripts/validate-lesson.ts
 *
 * Validates one or more lesson files against the lesson schema contract.
 * Run before deploying any lesson to catch structural violations early.
 *
 * Usage:
 *   pnpm tsx scripts/validate-lesson.ts scripts/module4/lesson-22.ts
 *   pnpm tsx scripts/validate-lesson.ts scripts/module4/
 *   pnpm tsx scripts/validate-lesson.ts --all
 */

import path from 'path';
import fs from 'fs';
import { validateLesson, validateCheckpoint, type LessonContract, type CheckpointContract } from '../lib/curriculum/lesson-schema';

const args = process.argv.slice(2);

function resolveTargets(args: string[]): string[] {
  if (args.includes('--all')) {
    // Find all lesson/checkpoint files under scripts/module*/
    const base = path.resolve(process.cwd(), 'scripts');
    const files: string[] = [];
    for (const dir of fs.readdirSync(base)) {
      if (!dir.startsWith('module')) continue;
      const full = path.join(base, dir);
      if (!fs.statSync(full).isDirectory()) continue;
      for (const file of fs.readdirSync(full)) {
        if (file.endsWith('.ts')) files.push(path.join(full, file));
      }
    }
    return files;
  }

  return args.flatMap(arg => {
    const full = path.resolve(process.cwd(), arg);
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      return fs.readdirSync(full)
        .filter(f => f.endsWith('.ts'))
        .map(f => path.join(full, f));
    }
    return [full];
  });
}

async function validateFile(filePath: string): Promise<boolean> {
  const rel = path.relative(process.cwd(), filePath);

  let mod: { slug?: string; title?: string; content?: string; quizQuestions?: unknown[]; videoUrl?: string };
  try {
    mod = await import(filePath);
  } catch (e) {
    console.error(`\n✗ ${rel}\n  Cannot import: ${(e as Error).message}`);
    return false;
  }

  if (!mod.slug || !mod.content || !mod.quizQuestions) {
    console.error(`\n✗ ${rel}\n  Missing required exports: slug, content, quizQuestions`);
    return false;
  }

  const isCheckpoint = mod.slug.includes('checkpoint');

  if (isCheckpoint) {
    const result = validateCheckpoint({
      slug: mod.slug,
      title: mod.title ?? '',
      content: mod.content,
      quizQuestions: mod.quizQuestions as CheckpointContract['quizQuestions'],
      passingScore: 70,
    });

    if (result.valid) {
      console.log(`\n✓ ${rel} (checkpoint)`);
    } else {
      console.log(`\n✗ ${rel} (checkpoint)`);
      result.errors.forEach(e => console.log(`  ERROR: ${e}`));
    }
    result.warnings.forEach(w => console.log(`  WARN:  ${w}`));
    return result.valid;
  } else {
    const result = validateLesson({
      slug: mod.slug,
      title: mod.title ?? '',
      videoUrl: mod.videoUrl ?? '',
      content: mod.content,
      quizQuestions: mod.quizQuestions as LessonContract['quizQuestions'],
    });

    if (result.valid) {
      console.log(`\n✓ ${rel} — ${mod.content.length.toLocaleString()} chars, ${mod.quizQuestions.length} questions`);
    } else {
      console.log(`\n✗ ${rel}`);
      result.errors.forEach(e => console.log(`  ERROR: ${e}`));
    }
    result.warnings.forEach(w => console.log(`  WARN:  ${w}`));
    return result.valid;
  }
}

async function main() {
  if (args.length === 0) {
    console.error('Usage: pnpm tsx scripts/validate-lesson.ts <file|dir|--all>');
    process.exit(1);
  }

  const targets = resolveTargets(args);
  if (targets.length === 0) {
    console.error('No lesson files found');
    process.exit(1);
  }

  console.log(`Validating ${targets.length} file(s) against lesson schema...\n`);

  let passed = 0;
  let failed = 0;

  for (const target of targets) {
    const ok = await validateFile(target);
    if (ok) passed++; else failed++;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFix all errors before deploying.');
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
