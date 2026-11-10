import { it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { distinctPublishedActivity } from '@/lib/learner/course-activity';
it('counts distinct saved activity only for the published course lesson identities', () => {
  expect(
    distinctPublishedActivity(
      ['one', 'two'],
      [{ lesson_id: 'one' }, { lesson_id: 'one' }, { lesson_id: 'two' }, { lesson_id: 'foreign' }],
    ),
  ).toBe(2);
});
