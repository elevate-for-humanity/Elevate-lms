import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { hasRequiredLessonWorkbook } from '@/lib/lms/lesson-workbook';
import { HVAC_COURSE_ID, HVAC_RESPONSE_FIELDS } from '@/lib/lms/hvac-workbook-contract';
import content from '@/lib/lms/hvac-workbook-content.json';

function database(response: unknown, fail = false) {
  const from = vi.fn((table: string) => {
    const result =
      table === 'digital_workbooks'
        ? { id: 'book', slug: 'hvac-epa608-guided-practice' }
        : table === 'digital_workbook_sections'
          ? { id: content.chapters[0].section_id, lesson_id: content.chapters[0].lesson_id }
          : response;
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: result, error: fail ? new Error('offline') : null }),
    };
    return chain;
  });
  return { from, rpc: vi.fn().mockResolvedValue({ data: true, error: null }) } as any;
}

describe('HVAC lesson and workbook completion', () => {
  it('requires the learner’s saved review and all five written responses', async () => {
    const lesson = content.chapters[0].lesson_id;
    expect(await hasRequiredLessonWorkbook(database(null), HVAC_COURSE_ID, lesson, 'learner')).toBe(
      false,
    );
    const answers = Object.fromEntries(
      HVAC_RESPONSE_FIELDS.map((key) => [key, 'My worked explanation']),
    );
    expect(
      await hasRequiredLessonWorkbook(
        database({ reviewed: false, answers }),
        HVAC_COURSE_ID,
        lesson,
        'learner',
      ),
    ).toBe(false);
    expect(
      await hasRequiredLessonWorkbook(
        database({ reviewed: true, answers: { ...answers, practice2: ' ' } }),
        HVAC_COURSE_ID,
        lesson,
        'learner',
      ),
    ).toBe(false);
    expect(
      await hasRequiredLessonWorkbook(
        database({ reviewed: true, answers }),
        HVAC_COURSE_ID,
        lesson,
        'learner',
      ),
    ).toBe(true);
  });
  it('does not add writing gates to separate practice exams or other courses', async () => {
    const db = database(null);
    expect(await hasRequiredLessonWorkbook(db, HVAC_COURSE_ID, 'practice-exam', 'learner')).toBe(
      true,
    );
    expect(
      await hasRequiredLessonWorkbook(
        db,
        'another-course',
        content.chapters[0].lesson_id,
        'learner',
      ),
    ).toBe(true);
    expect(db.from).not.toHaveBeenCalled();
  });
  it('does not treat a failed database lookup as completed work', async () => {
    await expect(
      hasRequiredLessonWorkbook(
        database(null, true),
        HVAC_COURSE_ID,
        content.chapters[0].lesson_id,
        'learner',
      ),
    ).rejects.toThrow('workbook');
  });
});
