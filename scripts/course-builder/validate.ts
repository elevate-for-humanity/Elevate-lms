/* eslint-disable no-console */
import {
  VALID_DOMAINS, VALID_OJT_CATEGORIES, VALID_COMPETENCY_TYPES,
  REQUIRED_DOMAINS,
} from '../../lib/curriculum/course-builder-types';
import type { CourseSeed, LessonSeed, CheckpointSeed } from '../../lib/curriculum/course-builder-types';
import { barberCourse } from './seeds/barber-course.seed';

type AuditRow = {
  moduleSlug: string;
  lessonSlug: string;
  title: string;
  hasDomain: boolean;
  hasOjtCategory: boolean;
  hasHoursCredit: boolean;
  hasCompetencyChecks: boolean;
  competencyCount: number;
  status: 'COMPLETE' | 'PARTIAL' | 'MISSING';
};

function fail(msg: string): never {
  console.error(`\nFAIL: ${msg}`);
  process.exit(1);
}

function validateLesson(l: LessonSeed, moduleSlug: string): AuditRow {
  if (!l.slug)  fail(`Lesson missing slug in ${moduleSlug}`);
  if (!l.title) fail(`Missing title: ${l.slug}`);
  if (!l.durationMin || l.durationMin < 10) fail(`Invalid durationMin: ${l.slug}`);
  if (!l.content || l.content.trim().length < 20) fail(`Missing/empty content: ${l.slug}`);
  const wordCount = l.content.trim().split(/\s+/).length;
  if (wordCount < 800) fail(`${l.slug}: content too thin (${wordCount}w, need 800w) — run: pnpm course:generate-content --slug ${l.slug}`);

  if (!l.domain)      fail(`Missing domain: ${l.slug}`);
  if (!VALID_DOMAINS.includes(l.domain)) fail(`Invalid domain "${l.domain}": ${l.slug}`);

  if (!l.ojtCategory) fail(`Missing ojtCategory: ${l.slug}`);
  if (!VALID_OJT_CATEGORIES.includes(l.ojtCategory)) fail(`Invalid ojtCategory "${l.ojtCategory}": ${l.slug}`);

  if (l.hoursCredit === undefined || l.hoursCredit <= 0) fail(`Invalid hoursCredit: ${l.slug}`);

  if (!l.competencyChecks?.length) fail(`Empty competencyChecks: ${l.slug}`);
  const required = l.competencyChecks.filter(c => c.required);
  if (required.length < 3) fail(`${l.slug} needs ≥3 required competencyChecks (has ${required.length})`);
  for (const c of l.competencyChecks) {
    if (!c.id)          fail(`Competency missing id in ${l.slug}`);
    if (!c.type)        fail(`Competency missing type in ${l.slug}`);
    if (!VALID_COMPETENCY_TYPES.includes(c.type)) fail(`Invalid competency type "${c.type}" in ${l.slug}`);
    if (!c.description) fail(`Competency missing description in ${l.slug}`);
  }

  const qCount = l.quiz?.questions?.length ?? 0;
  if (qCount < 20) fail(`${l.slug}: needs 20 quiz questions (has ${qCount}) — run: pnpm course:generate-content --slug ${l.slug}`);

  // Enforce scenario question minimum
  const scenarioCount = (l.quiz?.questions ?? []).filter(q => {
    const p = q.prompt.toLowerCase();
    return p.startsWith('a client') || p.startsWith('during a') || p.startsWith('a new client') ||
      p.startsWith('you notice') || p.startsWith('while performing') || p.includes('presents with') ||
      (q as unknown as Record<string,string>).type === 'scenario' || (q as unknown as Record<string,string>).type === 'applied';
  }).length;
  if (scenarioCount < 8) fail(`${l.slug}: needs ≥8 scenario questions (has ${scenarioCount}) — run: pnpm course:generate-content --slug ${l.slug} --quiz-only --force`);

  const fcCount = l.flashcards?.length ?? 0;
  if (fcCount < 15) fail(`${l.slug}: needs 15 flashcards (has ${fcCount}) — run: pnpm course:generate-content --slug ${l.slug}`);

  // Lab lessons must have procedures
  const isLab = l.ojtCategory === 'PRACTICAL' || l.ojtCategory === 'DEMONSTRATION';
  if (isLab && !l.procedures?.length) {
    fail(`${l.slug}: lab/practical lesson needs procedures — run: pnpm course:generate-content --slug ${l.slug}`);
  }

  return {
    moduleSlug, lessonSlug: l.slug, title: l.title,
    hasDomain: true, hasOjtCategory: true, hasHoursCredit: true, hasCompetencyChecks: true,
    competencyCount: l.competencyChecks.length, status: 'COMPLETE',
  };
}

const CHECKPOINT_QUESTION_OVERRIDES: Record<string, number> = {
  'barber-indiana-state-board-exam': 60,
};

function validateCheckpoint(c: CheckpointSeed, moduleSlug: string): void {
  if (!c.slug)  fail(`Checkpoint missing slug in ${moduleSlug}`);
  if (!c.domain) fail(`Missing domain on checkpoint: ${c.slug}`);
  if (!VALID_DOMAINS.includes(c.domain)) fail(`Invalid domain on checkpoint: ${c.slug}`);
  if (!c.ojtCategory) fail(`Missing ojtCategory on checkpoint: ${c.slug}`);
  if (!VALID_OJT_CATEGORIES.includes(c.ojtCategory)) fail(`Invalid ojtCategory on checkpoint: ${c.slug}`);
  if (c.hoursCredit === undefined || c.hoursCredit <= 0) fail(`Invalid hoursCredit on checkpoint: ${c.slug}`);
  if (!c.passingScore || c.passingScore <= 0) fail(`Missing passingScore on checkpoint: ${c.slug}`);
  const required = CHECKPOINT_QUESTION_OVERRIDES[c.slug] ?? 20;
  const actual = c.questions?.length ?? 0;
  if (actual < required) fail(`${c.slug}: needs ${required} questions (has ${actual})`);
}

function validateCourse(course: CourseSeed): void {
  if (!course.slug)  fail('Course missing slug');
  if (!course.title) fail('Course missing title');
  if (!course.modules?.length) fail('Course has no modules');

  const slugSet = new Set<string>();
  const moduleOrders = new Set<number>();
  const rows: AuditRow[] = [];
  let totalHours = 0;
  let lessonCount = 0;

  for (const m of course.modules) {
    if (!m.slug)  fail('Module missing slug');
    if (!m.title) fail('Module missing title');
    if (!m.order) fail(`Module missing order: ${m.slug}`);
    if (moduleOrders.has(m.order)) fail(`Duplicate module order ${m.order}: ${m.slug}`);
    moduleOrders.add(m.order);

    for (const l of m.lessons) {
      if (slugSet.has(l.slug)) fail(`Duplicate slug: ${l.slug}`);
      slugSet.add(l.slug);
      const row = validateLesson(l, m.slug);
      rows.push(row);
      totalHours += l.hoursCredit;
      lessonCount++;
    }

    if (m.checkpoint) {
      if (slugSet.has(m.checkpoint.slug)) fail(`Duplicate checkpoint slug: ${m.checkpoint.slug}`);
      slugSet.add(m.checkpoint.slug);
      validateCheckpoint(m.checkpoint, m.slug);
      totalHours += m.checkpoint.hoursCredit;
    }
  }

  // Domain coverage
  const covered = new Set(course.modules.flatMap(m => m.lessons.map(l => l.domain)));
  const missing = REQUIRED_DOMAINS.filter(d => !covered.has(d));
  if (missing.length) fail(`Missing required domains: ${missing.join(', ')}`);

  // Audit table
  console.log('\nAudit table:');
  console.log('─'.repeat(80));
  console.log(`${'Module'.padEnd(28)} ${'Lesson'.padEnd(30)} ${'Status'.padEnd(10)} Checks`);
  console.log('─'.repeat(80));
  for (const r of rows) {
    console.log(`${r.moduleSlug.padEnd(28)} ${r.lessonSlug.padEnd(30)} ${r.status.padEnd(10)} ${r.competencyCount}`);
  }
  console.log('─'.repeat(80));

  console.log(`\nTotal lessons:     ${lessonCount}`);
  console.log(`Total slugs:       ${slugSet.size}`);
  console.log(`Total RTI hours:   ${totalHours.toFixed(2)}h`);
  console.log(`Domains covered:   ${[...covered].join(', ')}`);
  console.log('\nVALIDATION PASSED ✓');
}

validateCourse(barberCourse);
