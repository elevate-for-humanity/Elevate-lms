import { beforeEach, expect, it, vi } from 'vitest';
import { resumeMediaDependency } from '@/lib/ultimate-course-builder/worker/resume-media-dependency';

const { enqueue } = vi.hoisted(() => ({ enqueue: vi.fn() }));
vi.mock('@/lib/ultimate-course-builder/worker/job-queue', () => ({
  UltimateJobQueue: class {
    enqueue = enqueue;
  },
}));
beforeEach(() => enqueue.mockReset().mockResolvedValue({ id: 'existing-job' }));

function database(
  options: {
    path?: string;
    missing?: boolean;
    licensed?: boolean;
    attached?: boolean;
    wrongEntitlement?: boolean;
    published?: boolean;
  } = {},
) {
  const filters: Array<[string, string, unknown]> = [];
  const file = {
    id: 'asset',
    lesson_id: null,
    entitlement_id: 'license',
    storage_path: options.path ?? 'course/previously-imported-envato.mp4',
    licensed_media_entitlements: {
      provider: 'envato',
      provider_item_id: 'envato-item',
      license_document_url: options.licensed === false ? null : 'https://example.org/license.pdf',
      metadata: {},
    },
  };
  const rows: Record<string, any[]> = {
    course_videos: [file],
    course_lesson_media_matches:
      options.attached === false
        ? []
        : [
            {
              lesson_id: 'lesson',
              course_video_id: 'asset',
              entitlement_id: options.wrongEntitlement ? 'other-license' : 'license',
            },
          ],
    ultimate_course_builds: [{ id: 'existing-build', status: options.published ? 'published' : 'running' }],
  };
  const sign = vi
    .fn()
    .mockResolvedValue(
      options.missing
        ? { data: null, error: { message: 'Object not found' } }
        : { data: { signedUrl: 'https://example.org/short-lived-url' }, error: null },
    );
  const db = {
    from(table: string) {
      const query: any = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters.push([table, column, value]);
          return query;
        },
        in: () => query,
        not: () => query,
        neq: () => query,
        order: (column: string, value: unknown) => {
          filters.push([table, column, value]);
          return query;
        },
        limit: (value: number) => {
          filters.push([table, 'limit', value]);
          return query;
        },
        then: (resolve: any) =>
          Promise.resolve({ data: rows[table] ?? [], error: null }).then(resolve),
      };
      return query;
    },
    storage: { from: () => ({ createSignedUrl: sign }) },
  };
  return { db: db as any, sign, filters };
}

it('resumes existing builds for a licensed stored clip linked through its attached lesson match, regardless of old path naming', async () => {
  const { db, sign, filters } = database();
  expect(await resumeMediaDependency(db, 'course', ['lesson'])).toEqual([{ id: 'existing-job' }]);
  expect(sign).toHaveBeenCalledWith('course/previously-imported-envato.mp4', 60);
  expect(enqueue).toHaveBeenCalledWith('existing-build', {
    dependencyResume: 'licensed_media_attached',
    lessonIds: ['lesson'],
    assetIds: ['asset'],
  });
  expect(filters).toContainEqual(['course_lesson_media_matches', 'status', 'attached']);
  expect(filters).toContainEqual(['course_videos', 'course_id', 'course']);
  expect(filters).toContainEqual(['ultimate_course_builds', 'created_at', { ascending: false }]);
  expect(filters).toContainEqual(['ultimate_course_builds', 'limit', 1]);
});

it.each([{ missing: true }, { licensed: false }, { attached: false }, { wrongEntitlement: true }])(
  'does not resume for missing storage, absent license evidence, unlinked intent, or a mismatched entitlement: %j',
  async (options) => {
    const { db } = database(options);
    expect(await resumeMediaDependency(db, 'course', ['lesson'])).toEqual([]);
    expect(enqueue).not.toHaveBeenCalled();
  },
);

it('does not resume from an empty intended lesson list', async () => {
  const { db, sign } = database();
  expect(await resumeMediaDependency(db, 'course', [])).toEqual([]);
  expect(sign).not.toHaveBeenCalled();
  expect(enqueue).not.toHaveBeenCalled();
});

it('does not revive historical attempts when the current build is already published', async () => {
  const { db } = database({ published: true });
  expect(await resumeMediaDependency(db, 'course', ['lesson'])).toEqual([]);
  expect(enqueue).not.toHaveBeenCalled();
});

it('surfaces a transient storage failure so the import can retry instead of silently losing its resume trigger', async () => {
  const { db, sign } = database();
  sign.mockResolvedValue({ data: null, error: new Error('Storage temporarily unavailable') });
  await expect(resumeMediaDependency(db, 'course', ['lesson'])).rejects.toThrow(
    'Storage temporarily unavailable',
  );
  expect(enqueue).not.toHaveBeenCalled();
});
