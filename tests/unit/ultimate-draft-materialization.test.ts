import { UltimatePlatformInstructionalGenerator } from '@/lib/ultimate-course-builder/adapters/platform-instructional-generator';
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
          inserted = { id: `${table}-${rows[table].length}`, ...JSON.parse(JSON.stringify(row)) }; rows[table].push(inserted);
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
  it('reserves source-backed parallel drafts that satisfy the credential guard without claiming approval', async () => {
    const loaded = await new UltimateAppendixAStandardsSource().load({ programSlug: 'barber-apprenticeship' });
    const profile = {...loaded, instructionalAuthoring:{provider:'google' as const,model:'gemini-test',version:'source-grounded-teaching-1'},lessonPresentation:'approved-premium-v1' as const,lessonBlueprints:{}};
    const {db,rows}=database();
    const seeded=await materializeUltimateDraft(db,'course',profile,undefined,{deferInstruction:true});
    expect(Object.keys(seeded.canonicalLessonIds!)).toHaveLength(profile.competencies.length);
    expect(Object.values(seeded.canonicalLessonIds!).every(Boolean)).toBe(true);
    for(const row of rows.course_lessons){
      expect(row).toMatchObject({status:'draft',is_published:false,approved:false,generation_status:'generating'});
      expect(row.content.length).toBeGreaterThan(180);
      expect(row.learning_objectives.length).toBeGreaterThan(0);
      expect(row.content_json).toMatchObject({instructionPending:true,sourceBlueprintOnly:true,releasePending:true});
      expect(row.content_json.blueprint.segments.length).toBeGreaterThanOrEqual(13);
      expect(row.content_json.blueprint.competencyId).toBe(row.content_json.competencyId);
      expect(row.content_json.blueprint.authoringEvidence).toBeUndefined();
    }
    expect(await materializeUltimateDraft(db,'course',seeded,undefined,{deferInstruction:true})).toEqual(seeded);
    expect(rows.course_lessons).toHaveLength(profile.competencies.length);
  });
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
  it('retains a supplied valid authored blueprint without requiring a duplicate text source', async () => {
    const profile = await new UltimateAppendixAStandardsSource().load({programSlug:'barber-apprenticeship'});
    const competency = profile.competencies[0];
    const authored = await new UltimatePlatformInstructionalGenerator().blueprint({profile,competency});
    const supplied = {...profile,instructionalSources:[],lessonBlueprints:{[competency.id]:authored}};
    const {db,rows}=database();
    await materializeUltimateDraft(db,'course',supplied,[competency.id],{deferInstruction:true});
    expect(rows.course_lessons).toHaveLength(1);
    expect(rows.course_lessons[0].content_json.blueprint.competencyId).toBe(competency.id);
    expect(rows.course_lessons[0].approved).toBe(false);
    expect(supplied.lessonBlueprints[competency.id]).toBe(authored);
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
    await expect(materializeUltimateDraft(db, 'course', { ...profile, instructionalSources: [], lessonBlueprints: {} },undefined,{deferInstruction:true}))
      .rejects.toThrow('ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED');
    expect(rows.course_lessons).toEqual([]);
  });
});
