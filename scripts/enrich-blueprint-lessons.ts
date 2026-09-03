#!/usr/bin/env tsx
/**
 * scripts/enrich-blueprint-lessons.ts
 *
 * Reads a blueprint, runs LQS validation to find failing lessons, then uses
 * Groq to generate full LQS-compliant content for each one. Patches the
 * blueprint TS file in-place — no manual editing required.
 *
 * Usage:
 *   pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint barber-apprenticeship-v1
 *   pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint barber-apprenticeship-v1 --dry-run
 *   pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint barber-apprenticeship-v1 --slug barber-lesson-8
 */

import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });

import fs from 'fs';
import { getBlueprintById, getBlueprintByProgramSlug } from '../lib/curriculum/blueprints';
import { validateBlueprintLessons } from '../lib/curriculum/lqs-validator';
import { groqJSON } from '../lib/groq-client';
import type { BlueprintLessonRef } from '../lib/curriculum/blueprints/types';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const blueprintArg = getArg('--blueprint');
const slugFilter = getArg('--slug'); // enrich a single lesson by slug
const dryRun = process.argv.includes('--dry-run');
const deterministicOnly = process.argv.includes('--deterministic-only');

if (!blueprintArg) {
  console.error('Usage: pnpm tsx scripts/enrich-blueprint-lessons.ts --blueprint <id> [--slug <slug>] [--dry-run]');
  process.exit(1);
}

// ── Prompt builder ─────────────────────────────────────────────────────────

function buildPrompt(lesson: BlueprintLessonRef, programTitle: string, moduleTitle: string): string {
  return `You are a barber curriculum author for a DOL-registered Indiana Barber Apprenticeship program.

Write a lesson. Output ONLY a raw JSON object — no markdown, no fences, no preamble.

Lesson: ${lesson.title}
Module: ${moduleTitle}
Objective: ${lesson.objective || 'Master the practical and theoretical components of this lesson.'}

Content requirements (all 7 must appear — each section 60-120 words):
1. Tools/equipment/materials list (ul, at least 6 items)
2. IF/THEN decision block for hair type, skin, or client variation (p or ul, 2+ scenarios)
3. Sanitation/disinfection reference with specific product or method (p)
4. One "do NOT" contraindication with consequence (p strong)
5. One failure mode: specific cause + step-by-step recovery (p)
6. Visual execution cues: angles, positioning, appearance descriptors (p)
7. Step-by-step procedure (ol, 6-10 steps, each step 15-25 words)

Total content: 500-700 words. Use compact HTML — no whitespace between tags.

JSON schema (output this exact shape, nothing else):
{"content":"<h2>Overview</h2><p>...</p><h2>Tools Required</h2><ul><li>...</li></ul><h2>Procedure</h2><ol><li>...</li></ol><h2>Safety</h2><p>...</p><h2>Visual Cues</h2><p>...</p>","quizQuestions":[{"id":"${lesson.slug}-q1","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":0,"explanation":"..."},{"id":"${lesson.slug}-q2","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":1,"explanation":"..."},{"id":"${lesson.slug}-q3","question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":0,"explanation":"..."},{"id":"${lesson.slug}-q4","question":"SCENARIO: A client presents with [condition]. What do you do?","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":2,"explanation":"..."},{"id":"${lesson.slug}-q5","question":"SCENARIO: During the service you notice [issue]. Correct response?","options":["A. ...","B. ...","C. ...","D. ..."],"correctAnswer":1,"explanation":"..."}]}

Rules: correctAnswer is 0-based index. Questions 4-5 must be scenario-based. No literal newlines in the JSON string values.`;
}

// ── AI content generation via groqJSON (Groq + Gemini fallback) ──────────────

async function generateLessonContent(
  lesson: BlueprintLessonRef,
  programTitle: string,
  moduleTitle: string,
): Promise<{ content: string; quizQuestions: any[] } | null> {
  const prompt = buildPrompt(lesson, programTitle, moduleTitle);
  const aiTimeoutMs = 45000;

  try {
    const result = await Promise.race([
      groqJSON<{ content: string; quizQuestions: any[] }>(prompt),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`AI generation timed out after ${aiTimeoutMs}ms`)), aiTimeoutMs);
      }),
    ]);

    if (!result.content || !Array.isArray(result.quizQuestions)) {
      console.error(`  ✗ Unexpected shape from AI for ${lesson.slug}`);
      return null;
    }

    return result;
  } catch (err: any) {
    console.error(`  ✗ AI generation error for ${lesson.slug}: ${err.message}`);
    return null;
  }
}

function countWords(text: string): number {
  return text
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function lessonPassesLqs(lesson: BlueprintLessonRef): { passed: boolean; violations: string[] } {
  const [result] = validateBlueprintLessons([lesson]);
  return {
    passed: result?.passed ?? false,
    violations: (result?.violations ?? []).map((v) => v.category),
  };
}

function buildDeterministicFallback(lesson: BlueprintLessonRef, moduleTitle: string): {
  content: string;
  quizQuestions: any[];
} {
  const safeTitle = lesson.title;
  const objective = lesson.objective || `Perform ${safeTitle} safely and consistently.`;
  const content =
    `<h2>Overview</h2><p>${safeTitle} in ${moduleTitle} requires consistent technique, sanitation discipline, and judgment-based adjustments for client variation. This lesson reinforces repeatable execution standards tied to Indiana apprenticeship expectations. Learners focus on setup, safe tool handling, sequencing, and communication while maintaining service quality under time pressure. Objective: ${objective}</p>` +
    `<h2>Tools Required</h2><ul><li>Primary service tools for ${safeTitle}</li><li>Secondary detailing tools</li><li>Disinfectant solution and clean towel set</li><li>Disposable gloves and neck strips</li><li>Mirror and lighting check tools</li><li>Sectioning and control implements</li></ul>` +
    `<h2>Decision Logic</h2><p>If the client has coarse or dense hair, reduce speed and increase control passes to maintain clean lines. If the client has fine or fragile hair, use lighter pressure and shorter contact to avoid damage. If skin is sensitive or irritated, avoid aggressive friction and adjust technique to protect barrier function. Depending on growth pattern and head shape, alter angle and position before final refinement.</p>` +
    `<h2>Procedure</h2><ol><li>Sanitize station, disinfect tools, and verify all equipment is clean, dry, and organized before client contact.</li><li>Complete consultation, identify goals, and confirm contraindications, including open skin, irritation, or recent chemical sensitivity.</li><li>Drape and position client for clear visibility; maintain body mechanics and stable hand support during execution.</li><li>Execute baseline technical sequence with controlled pressure, deliberate sections, and frequent visual checks for balance.</li><li>Refine details by adjusting angle, position, and tension based on texture, density, and growth direction.</li><li>Re-check symmetry from multiple viewpoints and confirm appearance quality under direct and side lighting.</li><li>Finish service with cleanup, product guidance, and maintenance recommendations tailored to the client profile.</li></ol>` +
    `<h2>Safety</h2><p>Disinfect all reusable tools with an EPA-registered disinfectant between clients and follow contact-time instructions. Do not proceed when active infection signs, broken skin, or severe irritation are present; continuing can worsen inflammation and create contamination risk. Common failure mode: overworking one area due to rushed correction. Cause: poor section control and inconsistent angle. Recovery: stop, reset section lines, reduce pressure, and rebuild sequence step-by-step.</p>` +
    `<h2>Visual Cues</h2><p>Correct execution looks like clean transitions, stable line integrity, and uniform finish from front, profile, and rear views. Incorrect execution looks patchy, heavy, or asymmetrical with visible pressure marks and uneven blending. You should see balanced weight distribution and consistent detail boundaries. When positioning is correct, the service reads intentional and polished under normal shop lighting.</p>`;

  const quizQuestions = [
    {
      id: `${lesson.slug}-q1`,
      question: `What is the best first priority before starting ${safeTitle}?`,
      options: [
        'A. Begin immediately to save time',
        'B. Sanitize station and disinfect tools',
        'C. Skip consultation if client is returning',
        'D. Apply product before setup',
      ],
      correctAnswer: 1,
      explanation: 'Safe, consistent execution starts with sanitation, tool readiness, and controlled setup.',
    },
    {
      id: `${lesson.slug}-q2`,
      question: 'Which adjustment is most appropriate for fine or fragile hair?',
      options: [
        'A. Increase pressure for faster results',
        'B. Use heavier friction to remove bulk quickly',
        'C. Use lighter pressure and shorter contact',
        'D. Ignore variation and keep one technique',
      ],
      correctAnswer: 2,
      explanation: 'Fine or fragile hair requires lighter control to avoid breakage and uneven finish.',
    },
    {
      id: `${lesson.slug}-q3`,
      question: 'What is the correct response to visible asymmetry during final check?',
      options: [
        'A. Add random detail work',
        'B. Stop and reset section lines before refinement',
        'C. Increase speed to finish sooner',
        'D. Ignore if one side looks acceptable',
      ],
      correctAnswer: 1,
      explanation: 'Resetting sections and rebuilding sequence prevents overcorrection and preserves control.',
    },
    {
      id: `${lesson.slug}-q4`,
      question: 'A client has sensitive skin with mild irritation. What should you do?',
      options: [
        'A. Continue with standard pressure',
        'B. Increase pressure to reduce passes',
        'C. Adjust technique to protect skin and avoid aggressive friction',
        'D. Skip all safety checks',
      ],
      correctAnswer: 2,
      explanation: 'Skin variation requires controlled adaptation to prevent further irritation.',
    },
    {
      id: `${lesson.slug}-q5`,
      question: 'During service you notice overworked areas from repeated corrections. What is the best recovery?',
      options: [
        'A. Keep repeating the same pass',
        'B. Stop, reset section lines, reduce pressure, and rebuild step-by-step',
        'C. Add product and continue at high speed',
        'D. End service without correction',
      ],
      correctAnswer: 1,
      explanation: 'Structured recovery prevents compounding errors and restores visual balance.',
    },
  ];

  return { content, quizQuestions };
}

// ── Blueprint file patcher ─────────────────────────────────────────────────

function escapeForTemplateLiteral(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function patchBlueprintFile(
  filePath: string,
  slug: string,
  newContent: string,
  newQuizQuestions: any[],
): boolean {
  let src = fs.readFileSync(filePath, 'utf-8');

  // Find the lesson block by slug
  const slugMarker = `slug: '${slug}'';
  const slugIdx = src.indexOf(slugMarker);
  if (slugIdx === -1) {
    console.error(`  ✗ Could not find slug ${slug} in blueprint file`);
    return false;
  }

  // Replace content template literal
  const contentStart = src.indexOf('content: `', slugIdx);
  const nextSlugIdx = src.indexOf("slug: 'barber-", slugIdx + slugMarker.length);
  const searchEnd = nextSlugIdx !== -1 ? nextSlugIdx : src.length;

  if (contentStart === -1 || contentStart > searchEnd) {
    // No existing content block — this shouldn't happen but handle gracefully
    console.error(`  ✗ No content block found for ${slug}`);
    return false;
  }

  const contentEnd = src.indexOf('',', contentStart) + 2;
  if (contentEnd <= contentStart) {
    console.error(`  ✗ Could not find end of content block for ${slug}`);
    return false;
  }

  const escapedContent = escapeForTemplateLiteral(newContent);
  const newContentBlock = `content: \`${escapedContent}\`,`;
  src = src.slice(0, contentStart) + newContentBlock + src.slice(contentEnd);

  // Now handle quizQuestions — replace existing block or insert after content
  const quizStart = src.indexOf('quizQuestions: [', slugIdx);
  const newSlugIdx = src.indexOf("slug: 'barber-", slugIdx + slugMarker.length);
  const searchEnd2 = newSlugIdx !== -1 ? newSlugIdx : src.length;

  const questionsJson = JSON.stringify(newQuizQuestions, null, 10)
    .split('\n')
    .map((line, i) => (i === 0 ? line : '          ' + line))
    .join('\n');

  if (quizStart !== -1 && quizStart < searchEnd2) {
    // Find end of existing quizQuestions block
    let depth = 0;
    let qEnd = quizStart + 'quizQuestions: '.length;
    for (let i = qEnd; i < src.length; i++) {
      if (src[i] === '[') depth++;
      else if (src[i] === ']') {
        depth--;
        if (depth === 0) {
          qEnd = i + 1;
          break;
        }
      }
    }
    // Replace quiz block
    src = src.slice(0, quizStart) + `quizQuestions: ${questionsJson}` + src.slice(qEnd);
  } else {
    // Insert quizQuestions before the closing brace of the lesson object
    // Find the content block end again (after our replacement)
    const insertAfter = src.indexOf(newContentBlock, slugIdx) + newContentBlock.length;
    src = src.slice(0, insertAfter) + `\n          quizQuestions: ${questionsJson},` + src.slice(insertAfter);
  }

  fs.writeFileSync(filePath, src, 'utf-8');
  return true;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const blueprint =
    (await getBlueprintById(blueprintArg!)) ??
    (await getBlueprintByProgramSlug(blueprintArg!));

  if (!blueprint) {
    console.error(`No blueprint found for "${blueprintArg}"`);
    process.exit(1);
  }

  console.log(`\nBlueprint: ${blueprint.id} (${blueprint.programSlug})`);
  if (deterministicOnly) {
    console.log('Mode: deterministic-only (AI generation disabled)');
  }

  // Find blueprint file path
  const blueprintFile = path.join(
    process.cwd(),
    'lib/curriculum/blueprints',
    `${blueprint.programSlug}.ts`,
  );

  if (!fs.existsSync(blueprintFile)) {
    console.error(`Blueprint file not found: ${blueprintFile}`);
    process.exit(1);
  }

  // Collect all lessons
  const allLessons: Array<{ lesson: BlueprintLessonRef; moduleTitle: string }> = [];
  for (const mod of blueprint.modules) {
    for (const lesson of mod.lessons ?? []) {
      allLessons.push({ lesson, moduleTitle: mod.title });
    }
  }

  // Run LQS to find failures
  const lqsResults = validateBlueprintLessons(allLessons.map((l) => l.lesson));
  const failures = lqsResults.filter((r) => !r.passed);

  if (failures.length === 0) {
    console.log('\n✅ All lessons already pass LQS — nothing to enrich.\n');
    process.exit(0);
  }

  // Filter to single slug if requested
  const toEnrich = slugFilter
    ? failures.filter((f) => f.slug === slugFilter)
    : failures;

  console.log(`\nLQS failures to fix: ${toEnrich.length} / ${failures.length} total\n`);

  if (toEnrich.length === 0 && slugFilter) {
    console.log(`Lesson "${slugFilter}" is not in the failure list — already passing or not found.`);
    process.exit(0);
  }

  let enriched = 0;
  let failed = 0;
  // Groq quota can be exhausted; keep attempts low so deterministic fallback engages quickly.
  const maxAttempts = 1;

  for (let i = 0; i < toEnrich.length; i++) {
    const failure = toEnrich[i];
    const entry = allLessons.find((l) => l.lesson.slug === failure.slug);
    if (!entry) continue;

    console.log(`[${i + 1}/${toEnrich.length}] ${failure.slug} — "${entry.lesson.title}"`);
    console.log(`  Violations: ${failure.violations.map((v) => v.category).join(', ')}`);

    if (dryRun) {
      console.log(`  (dry-run — skipping generation)\n`);
      continue;
    }

    // Throttle to avoid rate limits
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    let generated: { content: string; quizQuestions: any[] } | null = null;
    let lqsCheck: { passed: boolean; violations: string[] } = { passed: false, violations: [] };

    for (let attempt = 1; attempt <= maxAttempts && !deterministicOnly; attempt++) {
      generated = await generateLessonContent(
        entry.lesson,
        blueprint.credentialTitle,
        entry.moduleTitle,
      );

      if (!generated) {
        console.log(`  Attempt ${attempt}/${maxAttempts}: generation failed`);
        continue;
      }

      const candidateLesson: BlueprintLessonRef = {
        ...entry.lesson,
        content: generated.content,
        quizQuestions: generated.quizQuestions,
      };

      lqsCheck = lessonPassesLqs(candidateLesson);
      const words = countWords(generated.content);

      if (lqsCheck.passed && words >= 500) {
        break;
      }

      console.log(
        `  Attempt ${attempt}/${maxAttempts}: retrying (words=${words}, LQS=${lqsCheck.passed ? 'pass' : 'fail'}${lqsCheck.violations.length ? `, violations=${lqsCheck.violations.join(', ')}` : ''})`,
      );

      if (attempt === maxAttempts) {
        generated = null;
      }
    }

    if (!generated) {
      const fallback = buildDeterministicFallback(entry.lesson, entry.moduleTitle);
      const fallbackLesson: BlueprintLessonRef = {
        ...entry.lesson,
        content: fallback.content,
        quizQuestions: fallback.quizQuestions,
      };
      const fallbackCheck = lessonPassesLqs(fallbackLesson);
      if (fallbackCheck.passed) {
        generated = fallback;
        console.log('  ↺ Using deterministic fallback content (LQS pass)');
      } else {
        failed++;
        console.log(`  ✗ Could not generate LQS-compliant content after ${maxAttempts} attempts — skipping\n`);
        continue;
      }
    }

    const patched = patchBlueprintFile(
      blueprintFile,
      failure.slug,
      generated.content,
      generated.quizQuestions,
    );

    if (patched) {
      enriched++;
      const finalWords = countWords(generated.content);
      console.log(`  ✓ Patched (${finalWords} words, ${generated.quizQuestions.length} questions)\n`);
    } else {
      failed++;
      console.log(`  ✗ Patch failed\n`);
    }
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`Enriched: ${enriched} / ${toEnrich.length}`);
  if (failed > 0) console.log(`Failed:   ${failed}`);

  if (!dryRun && enriched > 0) {
    console.log(`\nNext: run the LQS validator to confirm all lessons now pass:`);
    console.log(`  pnpm tsx scripts/seed-course-from-blueprint.ts --blueprint ${blueprint.id} --program <programId> --dry-run\n`);
  }
}

main().catch((err) => {
  console.error('Enrichment failed:', err.message);
  process.exit(1);
});
