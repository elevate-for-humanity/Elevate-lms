import { describe, expect, it } from 'vitest';
import { materializeUltimateDraft } from '@/lib/ultimate-course-builder/worker/materialize-draft';
import { UltimateAppendixAStandardsSource } from '@/lib/ultimate-course-builder/credential/appendix-a-source';

function database(initialLessons: any[] = []) {
  const rows: Record<string, any[]> = { course_lessons: [...initialLessons], course_modules: [] };
  const db: any = { from(table: string) {
    let inserted: any;
    const filters: Array<[string, unknown]> = [];
    const query: any = {
      select: () => query,
      eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
      upsert: (row: any) => {
        inserted = rows[table].find(x => x.course_id === row.course_id && x.slug === row.slug);
        if (!inserted) {
          inserted = { id: `${table}-${rows[table].length}`, ...row }; rows[table].push(inserted);
        }
        return query;
      },
      maybeSingle: async () => ({ data: inserted, error: null }),
      single: async () => ({ data: rows[table].find(x => filters.every(([k,v]) => x[k] === v)), error: null }),
      then: (resolve: any) => Promise.resolve({ data: rows[table].filter(x => filters.every(([k,v]) => x[k] === v)), error: null }).then(resolve),
    };
    return query;
  } };
  return { db, rows };
}

describe('canonical source-backed draft materialization', () => {
  it('gives every Appendix A competency a substantive unpublished lesson, and resumes without duplicates', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({ programSlug: 'barber-apprenticeship' });
    const { db, rows } = database();
    const seeded = await materializeUltimateDraft(db, 'course', profile);
    expect(Object.keys(seeded.canonicalLessonIds!)).toHaveLength(profile.competencies.length);
    expect(rows.course_lessons).toHaveLength(profile.competencies.length);
    for (const lesson of rows.course_lessons) {
      expect(lesson.content.length).toBeGreaterThan(180);
      expect(lesson.content_json.blueprint.assessment.questions.length).toBeGreaterThan(0);
      expect(lesson).toMatchObject({ status: 'draft', is_published: false, approved: false });
    }
    expect(rows.course_modules[0]).toMatchObject({ is_draft: true, is_published: false });
    expect(await materializeUltimateDraft(db, 'course', seeded)).toEqual(seeded);
    expect(rows.course_lessons).toHaveLength(profile.competencies.length);
  });
  it('retains existing canonical lessons and their publication fields', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({ programSlug: 'barber-apprenticeship' });
    profile.competencies = [{ ...profile.competencies[0], id: 'existing-id' }];
    const existing = { id: 'existing-id', course_id: 'course', slug: 'original', status: 'published' };
    const { db, rows } = database([existing]);
    const result = await materializeUltimateDraft(db, 'course', profile);
    expect(result.canonicalLessonIds).toEqual({ 'existing-id': 'existing-id' });
    expect(rows.course_lessons).toEqual([existing]);
    expect(rows.course_modules).toEqual([]);
  });
  it('refuses to seed a lesson without authorized instructional sources', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({ programSlug: 'barber-apprenticeship' });
    const { db, rows } = database();
    await expect(materializeUltimateDraft(db, 'course', { ...profile, instructionalSources: [], lessonBlueprints: {} }))
      .rejects.toThrow('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');
    expect(rows.course_lessons).toEqual([]);
  });
});
