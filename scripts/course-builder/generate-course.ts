/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import type { LessonSeed, ModuleSeed, CheckpointSeed, CompetencyCheck } from '../../lib/curriculum/course-builder-types';
import { REQUIRED_DOMAINS } from '../../lib/curriculum/course-builder-types';
import { barberCourse as barberCourseSeed } from './seeds/barber-course.seed';

// ── Validation — hard fail before any output is written ───────────────────────

function validateLesson(l: LessonSeed): void {
  if (!l.domain)      throw new Error(`${l.slug}: missing domain`);
  if (!l.ojtCategory) throw new Error(`${l.slug}: missing ojtCategory`);
  if (l.hoursCredit === undefined || l.hoursCredit === null)
                      throw new Error(`${l.slug}: missing hoursCredit`);
  if (l.durationMin < 10)
                      throw new Error(`${l.slug}: durationMin ${l.durationMin} too short (min 10)`);
  if (!l.competencyChecks?.length)
                      throw new Error(`${l.slug}: competencyChecks is empty`);
  const required = l.competencyChecks.filter(c => c.required);
  if (required.length < 3)
                      throw new Error(`${l.slug}: needs ≥3 required competencyChecks (has ${required.length})`);
}

function validate(seed: { slug: string; modules: ModuleSeed[] }): void {
  const moduleOrders = new Set<number>();
  const slugs = new Set<string>();

  for (const mod of seed.modules) {
    if (moduleOrders.has(mod.order))
      throw new Error(`Duplicate module order ${mod.order} in ${mod.slug}`);
    moduleOrders.add(mod.order);

    for (const l of mod.lessons) {
      if (slugs.has(l.slug)) throw new Error(`Duplicate slug ${l.slug}`);
      slugs.add(l.slug);
      validateLesson(l);
    }
    if (mod.checkpoint) {
      if (slugs.has(mod.checkpoint.slug))
        throw new Error(`Duplicate checkpoint slug ${mod.checkpoint.slug}`);
      slugs.add(mod.checkpoint.slug);
      if (!mod.checkpoint.domain)      throw new Error(`${mod.checkpoint.slug}: missing domain`);
      if (!mod.checkpoint.ojtCategory) throw new Error(`${mod.checkpoint.slug}: missing ojtCategory`);
      if (mod.checkpoint.hoursCredit === undefined)
        throw new Error(`${mod.checkpoint.slug}: missing hoursCredit`);
    }
  }

  const covered = new Set(seed.modules.flatMap(m => m.lessons.map(l => l.domain)));
  const missing = REQUIRED_DOMAINS.filter(d => !covered.has(d));
  if (missing.length) throw new Error(`Missing required domains: ${missing.join(', ')}`);
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function esc(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/'/g, "\\'");
}

function renderStringArray(items?: string[], indent = 6): string {
  if (!items?.length) return '[]';
  const pad = ' '.repeat(indent);
  return `[\n${items.map(i => `${pad}'${esc(i)}'`).join(',\n')}\n${' '.repeat(indent - 2)}]`;
}

function renderCompetencyChecks(checks: CompetencyCheck[], indent = 6): string {
  const pad = ' '.repeat(indent);
  const items = checks.map(c =>
    `${pad}{ id: '${esc(c.id)}', description: '${esc(c.description)}', required: ${c.required} }`
  );
  return `[\n${items.join(',\n')}\n${' '.repeat(indent - 2)}]`;
}

function renderSections(sections: LessonSeed['sections'], indent = 6): string {
  const pad = ' '.repeat(indent);
  const rendered = sections.map(s => {
    if (s.type === 'text')
      return `${pad}{ type: 'text', heading: '${esc(s.heading)}', body: ${renderStringArray(s.body, indent + 4)} }`;
    if (s.type === 'steps')
      return `${pad}{ type: 'steps', heading: '${esc(s.heading)}', steps: ${renderStringArray(s.steps, indent + 4)} }`;
    if (s.type === 'table')
      return `${pad}{ type: 'table', heading: '${esc(s.heading)}', rows: [\n${s.rows.map(r =>
        `${pad}  { label: '${esc(r.label)}', value: '${esc(r.value)}' }`
      ).join(',\n')}\n${pad}] }`;
    return `${pad}{ type: 'callout', heading: '${esc(s.heading)}', tone: '${s.tone}', body: ${renderStringArray(s.body, indent + 4)} }`;
  });
  return `[\n${rendered.join(',\n')}\n${' '.repeat(indent - 2)}]`;
}

function renderQuiz(quiz?: LessonSeed['quiz'], indent = 6): string {
  if (!quiz) return 'undefined';
  const pad = ' '.repeat(indent);
  const qs = quiz.questions.map(q =>
    `${pad}  { prompt: '${esc(q.prompt)}', choices: ${renderStringArray(q.choices, indent + 6)}, answerIndex: ${q.answerIndex}, rationale: '${esc(q.rationale)}' }`
  ).join(',\n');
  return `{ passingScore: ${quiz.passingScore ?? 70}, questions: [\n${qs}\n${pad}] }`;
}

function renderFlashcards(cards?: { term: string; definition: string }[], indent = 6): string {
  if (!cards?.length) return '[]';
  const pad = ' '.repeat(indent);
  const items = cards.map(c => `${pad}{ term: '${esc(c.term)}', definition: '${esc(c.definition)}' }`);
  return `[\n${items.join(',\n')}\n${' '.repeat(indent - 2)}]`;
}

function renderLesson(l: LessonSeed): string {
  return `    {
      slug: '${esc(l.slug)}',
      title: '${esc(l.title)}',
      durationMin: ${l.durationMin},
      domain: '${l.domain}',
      ojtCategory: '${l.ojtCategory}',
      hoursCredit: ${l.hoursCredit},
      content: \`${l.content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`,
      competencyChecks: ${renderCompetencyChecks(l.competencyChecks, 8)},
      quiz: ${renderQuiz(l.quiz, 8)},
      flashcards: ${renderFlashcards(l.flashcards, 8)},
    }`;
}

function renderCheckpoint(c: CheckpointSeed): string {
  return `    {
      slug: '${esc(c.slug)}',
      title: '${esc(c.title)}',
      durationMin: ${c.durationMin},
      domain: '${c.domain}',
      ojtCategory: '${c.ojtCategory}',
      hoursCredit: ${c.hoursCredit},
      passingScore: ${c.passingScore},
      questions: ${renderStringArray([], 8)},
      quiz: ${renderQuiz({ passingScore: c.passingScore, questions: c.questions }, 8)},
    }`;
}

function renderModule(m: ModuleSeed): string {
  const lessons = [...m.lessons].map(renderLesson);
  if (m.checkpoint) lessons.push(renderCheckpoint(m.checkpoint));
  return `  {
    slug: '${esc(m.slug)}',
    title: '${esc(m.title)}',
    order: ${m.order},
    objective: ${m.objective ? `'${esc(m.objective)}'` : 'undefined'},
    lessons: [\n${lessons.join(',\n')}\n    ],
  }`;
}

// ── Entry point ───────────────────────────────────────────────────────────────

function main(): void {
  validate(barberCourseSeed);

  const modules = [...barberCourseSeed.modules].sort((a, b) => a.order - b.order);
  const out = `/* AUTO-GENERATED. DO NOT EDIT BY HAND. */\n\nexport const generatedBarberCourseBlueprint = {\n  slug: '${esc(barberCourseSeed.slug)}',\n  title: '${esc(barberCourseSeed.title)}',\n  modules: [\n${modules.map(renderModule).join(',\n')}\n  ],\n};\n\nexport default generatedBarberCourseBlueprint;\n`;

  const outPath = path.resolve(process.cwd(), 'scripts/generated/barber-course.generated.ts');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`Generated: ${outPath}`);
}

main();
