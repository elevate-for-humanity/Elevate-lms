import { describe, expect, it } from 'vitest';
import { loadLessonWorkbook, hasRequiredLessonWorkbook } from '@/lib/lms/lesson-workbook';
import {
  MANUFACTURING_COURSE_ID,
  MANUFACTURING_WORKBOOK_SLUG,
  MANUFACTURING_RESPONSE_FIELDS,
} from '@/lib/lms/manufacturing-workbook-contract';

function fixture({ allowed = true, reviewed = true, missingSection = false } = {}) {
  const answers = Object.fromEntries(
    MANUFACTURING_RESPONSE_FIELDS.map((field) => [
      field,
      'An explanation of this task and my work.',
    ]),
  );
  const records: Record<string, any> = {
    digital_workbooks: {
      id: 'workbook',
      slug: MANUFACTURING_WORKBOOK_SLUG,
      title: 'Manufacturing workbook',
      program_id: 'program',
    },
    digital_workbook_sections: missingSection
      ? null
      : {
          id: 'section',
          workbook_id: 'workbook',
          lesson_id: 'lesson',
          prompts: ['One', 'Two', 'Three'],
        },
    digital_workbook_responses: { section_id: 'section', answers, reviewed, version: 1 },
  };
  const calls: Array<{ table: string; filters: Array<[string, unknown]> }> = [];
  let rpcCalls = 0;
  const db: any = {
    from(table: string) {
      const entry = { table, filters: [] as Array<[string, unknown]> };
      calls.push(entry);
      const q: any = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          entry.filters.push([key, value]);
          return q;
        },
        maybeSingle: async () => ({ data: records[table], error: null }),
      };
      return q;
    },
    rpc: async (name: string, input: any) => {
      expect(name).toBe('can_edit_digital_workbook');
      expect(input).toEqual({ p_workbook_id: 'workbook' });
      rpcCalls++;
      return { data: allowed, error: null };
    },
  };
  return { db, records, calls, answers, rpcCalls: () => rpcCalls };
}

describe('manufacturing lesson workbook integration', () => {
  it('loads only the designated course workbook and matching lesson through the existing access RPC', async () => {
    const f = fixture();
    const loaded = await loadLessonWorkbook(f.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner');
    expect(loaded).toMatchObject({
      readOnly: false,
      requiredForCompletion: true,
      accountId: 'learner',
      section: { lesson_id: 'lesson', course_id: MANUFACTURING_COURSE_ID },
    });
    expect(f.calls[0].filters).toContainEqual(['slug', MANUFACTURING_WORKBOOK_SLUG]);
    expect(f.calls[1].filters).toContainEqual(['lesson_id', 'lesson']);
    expect(f.calls[2].filters).toContainEqual(['user_id', 'learner']);
    expect(f.rpcCalls()).toBe(1);
  });
  it('keeps a denied learner read-only and administrator preview free of learner answer reads', async () => {
    const denied = fixture({ allowed: false });
    expect(
      (await loadLessonWorkbook(denied.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner'))?.readOnly,
    ).toBe(true);
    const preview = fixture();
    expect(
      (await loadLessonWorkbook(preview.db, MANUFACTURING_COURSE_ID, 'lesson', undefined, true))
        ?.readOnly,
    ).toBe(true);
    expect(preview.calls.map((call) => call.table)).not.toContain('digital_workbook_responses');
    expect(preview.rpcCalls()).toBe(0);
  });
  it('requires all five saved response fields and chapter review before online lesson completion', async () => {
    const complete = fixture();
    expect(
      await hasRequiredLessonWorkbook(complete.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner'),
    ).toBe(true);
    const incomplete = fixture();
    incomplete.answers.practice2 = ' ';
    expect(
      await hasRequiredLessonWorkbook(incomplete.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner'),
    ).toBe(false);
    const unreviewed = fixture({ reviewed: false });
    expect(
      await hasRequiredLessonWorkbook(unreviewed.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner'),
    ).toBe(false);
  });
  it('fails closed when a required manufacturing chapter is missing and leaves other courses unchanged', async () => {
    const f = fixture({ missingSection: true });
    await expect(
      loadLessonWorkbook(f.db, MANUFACTURING_COURSE_ID, 'lesson', 'learner'),
    ).rejects.toThrow('Matching workbook chapter');
    const other = fixture();
    expect(await loadLessonWorkbook(other.db, 'unrelated-course', 'lesson', 'learner')).toBeNull();
    expect(await hasRequiredLessonWorkbook(other.db, 'unrelated-course', 'lesson', 'learner')).toBe(
      true,
    );
    expect(other.calls).toHaveLength(0);
  });
});
