/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import type { CourseSeed, LessonSeed, ModuleSeed, CheckpointSeed } from './types';
import { barberCourseSeed } from './seeds/barber-course.seed';

function esc(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${').replace(/'/g, "\\'");
}

function renderStringArray(items?: string[], indent = 6): string {
  if (!items?.length) return '[]';
  const pad = ' '.repeat(indent);
  return `[\n${items.map(i => `${pad}'${esc(i)}'`).join(',\n')}\n${' '.repeat(indent - 2)}]`;
}

function renderSections(sections: LessonSeed['sections'], indent = 6): string {
  const pad = ' '.repeat(indent);
  const rendered = sections.map(s => {
    if (s.type === 'text') return `${pad}{ type: 'text', heading: '${esc(s.heading)}', body: ${renderStringArray(s.body, indent + 4)} }`;
    if (s.type === 'steps') return `${pad}{ type: 'steps', heading: '${esc(s.heading)}', steps: ${renderStringArray(s.steps, indent + 4)} }`;
    if (s.type === 'table') return `${pad}{ type: 'table', heading: '${esc(s.heading)}', rows: [\n${s.rows.map(r => `${pad}  { label: '${esc(r.label)}', value: '${esc(r.value)}' }`).join(',\n')}\n${pad}] }`;
    return `${pad}{ type: 'callout', heading: '${esc(s.heading)}', tone: '${s.tone}', body: ${renderStringArray(s.body, indent + 4)} }`;
  });
  return `[\n${rendered.join(',\n')}\n${' '.repeat(indent - 2)}]`;
}

function renderQuiz(quiz?: LessonSeed['quiz'], indent = 6): string {
  if (!quiz) return 'undefined';
  const pad = ' '.repeat(indent);
  const qs = quiz.questions.map(q =>
    `${pad}  { prompt: '${esc(q.prompt)}', choices: ${renderStringArray(q.choices, indent + 6)}, answerIndex: ${q.answerIndex}, rationale: ${q.rationale ? `'${esc(q.rationale)}'` : 'undefined'} }`
  ).join(',\n');
  return `{ passingScore: ${quiz.passingScore ?? 80}, questions: [\n${qs}\n${pad}] }`;
}

function renderLesson(l: LessonSeed): string {
  return `    {
      slug: '${esc(l.slug)}',
      title: '${esc(l.title)}',
      lessonType: '${l.lessonType ?? 'lesson'}',
      lessonOrder: ${l.lessonOrder},
      durationMin: ${l.durationMin},
      objective: '${esc(l.objective)}',
      style: '${l.style ?? 'standard'}',
      tools: ${renderStringArray(l.tools, 8)},
      materials: ${renderStringArray(l.materials, 8)},
      safetyNotes: ${renderStringArray(l.safetyNotes, 8)},
      sanitationNotes: ${renderStringArray(l.sanitationNotes, 8)},
      stateBoardFocus: ${renderStringArray(l.stateBoardFocus, 8)},
      miladyAlignment: ${renderStringArray(l.miladyAlignment, 8)},
      vocabulary: [${(l.vocabulary ?? []).map(v => `{ term: '${esc(v.term)}', definition: '${esc(v.definition)}' }`).join(', ')}],
      sections: ${renderSections(l.sections, 8)},
      competencyChecks: ${renderStringArray(l.competencyChecks, 8)},
      quiz: ${renderQuiz(l.quiz, 8)},
    }`;
}

function renderCheckpoint(c: CheckpointSeed): string {
  return `    {
      slug: '${esc(c.slug)}',
      title: '${esc(c.title)}',
      lessonType: 'checkpoint',
      lessonOrder: ${c.lessonOrder},
      durationMin: ${c.durationMin},
      objective: '${esc(c.objective)}',
      instructions: ${renderStringArray(c.instructions, 8)},
      rubric: ${renderStringArray(c.rubric, 8)},
      quiz: ${renderQuiz(c.quiz, 8)},
    }`;
}

function renderModule(m: ModuleSeed): string {
  const lessons = [...m.lessons].sort((a, b) => a.lessonOrder - b.lessonOrder).map(renderLesson);
  if (m.checkpoint) lessons.push(renderCheckpoint(m.checkpoint));
  return `  {
    slug: '${esc(m.slug)}',
    title: '${esc(m.title)}',
    moduleOrder: ${m.moduleOrder},
    objective: ${m.objective ? `'${esc(m.objective)}'` : 'undefined'},
    lessons: [\n${lessons.join(',\n')}\n    ],
  }`;
}

function validate(seed: CourseSeed): void {
  const moduleOrders = new Set<number>();
  const slugs = new Set<string>();
  for (const mod of seed.modules) {
    if (moduleOrders.has(mod.moduleOrder)) throw new Error(`Duplicate moduleOrder ${mod.moduleOrder} in ${mod.slug}`);
    moduleOrders.add(mod.moduleOrder);
    const lessonOrders = new Set<number>();
    for (const l of mod.lessons) {
      if (lessonOrders.has(l.lessonOrder)) throw new Error(`Duplicate lessonOrder ${l.lessonOrder} in ${mod.slug}`);
      if (slugs.has(l.slug)) throw new Error(`Duplicate slug ${l.slug}`);
      lessonOrders.add(l.lessonOrder);
      slugs.add(l.slug);
    }
    if (mod.checkpoint) {
      if (lessonOrders.has(mod.checkpoint.lessonOrder)) throw new Error(`Checkpoint order collision in ${mod.slug}`);
      if (slugs.has(mod.checkpoint.slug)) throw new Error(`Duplicate checkpoint slug ${mod.checkpoint.slug}`);
    }
  }
}

function main(): void {
  validate(barberCourseSeed);
  const modules = [...barberCourseSeed.modules].sort((a, b) => a.moduleOrder - b.moduleOrder);
  const out = `/* AUTO-GENERATED. DO NOT EDIT BY HAND. */\n\nexport const generatedBarberCourseBlueprint = {\n  slug: '${esc(barberCourseSeed.courseSlug)}',\n  title: '${esc(barberCourseSeed.courseTitle)}',\n  modules: [\n${modules.map(renderModule).join(',\n')}\n  ],\n};\n\nexport default generatedBarberCourseBlueprint;\n`;
  const outPath = path.resolve(process.cwd(), 'scripts/generated/barber-course.generated.ts');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`Generated: ${outPath}`);
}

main();
