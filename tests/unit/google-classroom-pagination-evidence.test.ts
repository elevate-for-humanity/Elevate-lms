// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/secrets', () => ({ getSecrets: async () => ({}) }));
import { listGoogleClassroomCourses } from '@/lib/integrations/google-classroom';
afterEach(() => vi.unstubAllGlobals());
it('rejects repeated pagination tokens instead of certifying a partial or endless sync', async () => {
  const request = vi.fn().mockImplementation(async () => Response.json({ courses: [], nextPageToken: 'same-page' }));
  vi.stubGlobal('fetch', request);
  await expect(listGoogleClassroomCourses('private-token')).rejects.toThrow('PAGINATION_INCOMPLETE');
  expect(request).toHaveBeenCalledTimes(2);
});
it('rejects malformed successful responses instead of treating them as an empty Classroom', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('not-json', { status: 200 })));
  await expect(listGoogleClassroomCourses('private-token')).rejects.toThrow();
});
it('deduplicates course identities across provider pages', async () => {
  const request = vi.fn().mockImplementationOnce(async () => Response.json({ courses: [{ id: '1' }], nextPageToken: 'next' }))
    .mockImplementationOnce(async () => Response.json({ courses: [{ id: '1' }, { id: '2' }] }));
  vi.stubGlobal('fetch', request);
  expect(await listGoogleClassroomCourses('private-token')).toEqual([{ id: '1' }, { id: '2' }]);
});
