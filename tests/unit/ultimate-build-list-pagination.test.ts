import { describe, expect, it } from 'vitest';
import { loadUltimateBuildPage, parseBuildListPage } from '@/lib/ultimate-course-builder/queries/build-list-page';

function database() {
  const ranges: number[][] = [];
  const orders: string[] = [];
  let course: string | undefined;
  let bounds = [0, 50];
  const rows = Array.from({ length: 101 }, (_, i) => ({ id: String(101 - i), course_id: 'course-a' }));
  const query: any = {
    select: () => query, order: (field: string) => { orders.push(field); return query; },
    range: (start: number, end: number) => { bounds = [start, end]; ranges.push(bounds); return query; },
    eq: (_field: string, value: string) => { course = value; return query; },
    then: (resolve: any) => Promise.resolve({ data: (course && course !== 'course-a' ? [] : rows).slice(bounds[0], bounds[1] + 1), error: null }).then(resolve),
  };
  return { db: { from: () => query } as never, ranges, orders };
}
describe('Course Builder history pagination', () => {
  it('keeps the first 50 records compatible and exposes continuation', async () => {
    const { db, orders } = database();
    const result = await loadUltimateBuildPage(db, undefined, 1);
    expect(result.data).toHaveLength(50);
    expect(result.pagination).toEqual({ page: 1, pageSize: 50, hasMore: true, nextPage: 2 });
    expect(orders).toEqual(['created_at', 'id']);
  });
  it('makes records beyond 50 and 100 reachable without duplicate boundary rows', async () => {
    const { db, ranges } = database();
    const pages = await Promise.all([1, 2, 3].map(async page => {
      // Each request owns its query instance.
      const request = database();
      const result = await loadUltimateBuildPage(request.db, 'course-a', page);
      return result;
    }));
    expect(new Set(pages.flatMap(page => page.data.map(row => row.id))).size).toBe(101);
    expect(pages[2].pagination).toEqual({ page: 3, pageSize: 50, hasMore: false, nextPage: null });
    await loadUltimateBuildPage(db, undefined, 2);
    expect(ranges).toEqual([[50, 100]]);
  });
  it('retains the course filter for later pages', async () => {
    const { db } = database();
    const result = await loadUltimateBuildPage(db, 'other-course', 2);
    expect(result.data).toEqual([]);
    expect(result.pagination.hasMore).toBe(false);
  });
  it('rejects malformed or unbounded page input', async () => {
    expect(parseBuildListPage(null)).toBe(1);
    for (const value of ['', '0', '-1', '1.5', 'NaN', '10001', '1e3']) expect(parseBuildListPage(value)).toBeNull();
    expect(parseBuildListPage('10000')).toBe(10000);
    const { db } = database();
    await expect(loadUltimateBuildPage(db, undefined, 0)).rejects.toThrow('PAGE_INVALID');
  });
});
