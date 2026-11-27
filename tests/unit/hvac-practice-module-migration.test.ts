// @vitest-environment node
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20261125014055_hvac_required_practice_module_links.sql',
    import.meta.url,
  ),
  'utf8',
);
const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
const oldModule = '343c2818-05fc-4695-a360-05f061f7ff26';
const finalModule = '9ccb55ef-e880-4cf9-9cbc-70a1656568d4';
const finalModuleTitle = 'Practical Skills and Career Support';
const targets = [
  [
    'hvac-required-practice-core',
    'Core',
    'e47bab32-5d13-5d53-b525-135c6ecd4d48',
    '53cdef20-f4d2-43b1-b7c7-ff73d884807b',
  ],
  [
    'hvac-required-practice-type-i',
    'Type I',
    '6e9ae471-b744-5d73-ac6e-7664da9b9496',
    '9c662af0-0c16-44ab-a299-983f25549c3e',
  ],
  [
    'hvac-required-practice-type-ii',
    'Type II',
    '9fe4ceb8-f11d-5737-b3a0-a1be0b403abd',
    'd1f421b7-fc14-46b8-977a-6c403c9ed37f',
  ],
  [
    'hvac-required-practice-type-iii',
    'Type III',
    'fbe3299c-027f-596f-938b-c934f39ea212',
    '7f5136c1-b826-42e0-ad08-bfc5090b41cb',
  ],
];
const databases: PGlite[] = [];
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.close()));
});

async function fixture(seed = true) {
  const db = new PGlite();
  databases.push(db);
  await db.exec(`
    CREATE TABLE courses(id uuid PRIMARY KEY, slug text UNIQUE, status text, is_active boolean);
    CREATE TABLE course_modules(id uuid PRIMARY KEY, course_id uuid REFERENCES courses(id), title text, is_published boolean);
    CREATE TABLE course_lessons(id uuid PRIMARY KEY, course_id uuid REFERENCES courses(id), module_id uuid REFERENCES course_modules(id), slug text, is_published boolean, lesson_type text, quiz_questions jsonb);
    CREATE TABLE checkpoint_scores(lesson_id uuid REFERENCES course_lessons(id), score integer, passed boolean);
    CREATE TABLE course_lesson_release_weeks(lesson_id uuid REFERENCES course_lessons(id), release_week integer);
  `);
  if (!seed) return db;
  await db.query('INSERT INTO courses VALUES($1,$2,$3,true)', [
    courseId,
    'epa608-replacement-20261019',
    'published',
  ]);
  await db.query('INSERT INTO course_modules VALUES($1,$2,$3,false)', [
    oldModule,
    courseId,
    'Module 10: Career Readiness & Program Completion',
  ]);
  await db.query('INSERT INTO course_modules VALUES($1,$2,$3,true)', [
    finalModule,
    courseId,
    finalModuleTitle,
  ]);
  for (const [slug, title, lessonId, moduleId] of targets) {
    await db.query('INSERT INTO course_modules VALUES($1,$2,$3,true)', [moduleId, courseId, title]);
    await db.query("INSERT INTO course_lessons VALUES($1,$2,$3,$4,true,'quiz',$5)", [
      lessonId,
      courseId,
      oldModule,
      slug,
      JSON.stringify([{ question: 'Preserve authored question', answer: 2 }]),
    ]);
    await db.query('INSERT INTO checkpoint_scores VALUES($1,88,true)', [lessonId]);
    await db.query('INSERT INTO course_lesson_release_weeks VALUES($1,4)', [lessonId]);
  }
  return db;
}

describe('HVAC required practice module repair', () => {
  it('makes all four existing final exams visible after instruction without changing scores, content or release weeks', async () => {
    const db = await fixture();
    const before = (
      await db.query(
        'SELECT id,course_id,slug,is_published,lesson_type,quiz_questions FROM course_lessons ORDER BY slug',
      )
    ).rows;
    await db.exec(migration);
    const linked = (
      await db.query<{ slug: string; title: string }>(
        'SELECT l.slug,m.title FROM course_lessons l JOIN course_modules m ON m.id=l.module_id WHERE m.is_published ORDER BY l.slug',
      )
    ).rows;
    expect(linked).toEqual(targets.map(([slug]) => ({ slug, title: finalModuleTitle })));
    expect(
      (
        await db.query(
          'SELECT id,course_id,slug,is_published,lesson_type,quiz_questions FROM course_lessons ORDER BY slug',
        )
      ).rows,
    ).toEqual(before);
    expect((await db.query('SELECT score,passed FROM checkpoint_scores')).rows).toEqual(
      Array.from({ length: 4 }, () => ({ score: 88, passed: true })),
    );
    expect((await db.query('SELECT release_week FROM course_lesson_release_weeks')).rows).toEqual(
      Array.from({ length: 4 }, () => ({ release_week: 4 })),
    );
    await db.exec(migration);
    expect((await db.query('SELECT id FROM course_lessons')).rows).toHaveLength(4);
  });

  it('rolls back instead of overwriting a newer module assignment', async () => {
    const db = await fixture();
    await db.query('UPDATE course_lessons SET module_id=$1 WHERE slug=$2', [
      targets[0][3],
      targets[2][0],
    ]);
    const before = (await db.query('SELECT id,module_id FROM course_lessons ORDER BY id')).rows;
    await expect(db.exec(migration)).rejects.toThrow('HVAC practice module changed unexpectedly');
    expect((await db.query('SELECT id,module_id FROM course_lessons ORDER BY id')).rows).toEqual(
      before,
    );
  });

  it('does not create course data in a fresh installation', async () => {
    const db = await fixture(false);
    await db.exec(migration);
    expect((await db.query('SELECT id FROM courses')).rows).toEqual([]);
  });
});
