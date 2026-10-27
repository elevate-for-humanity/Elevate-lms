import test from 'node:test';
import assert from 'node:assert/strict';
import { metricCount, loadAllEnrollmentRows } from './report-integrity.mjs';
test('missing data is distinguished from a legitimate zero', () => {
  assert.equal(metricCount({ count: 0, error: null }), 0);
  assert.equal(metricCount({ count: null, error: null }), null);
  assert.equal(metricCount({ count: 0, error: { message: 'denied' } }), null);
});
function database(rows, failPage = -1) {
  let page = 0;
  const q = {
    select: () => q,
    not: () => q,
    order: () => q,
    range: async (start, end) =>
      page++ === failPage
        ? { data: null, error: { message: 'failed page' } }
        : { data: rows.slice(start, end + 1), error: null },
  };
  return { from: () => q };
}
test('ranking includes programs beyond the old 500-record cutoff', async () => {
  const rows = Array.from({ length: 1201 }, (_, id) => ({ id, program_id: id < 500 ? 'A' : 'B' }));
  const result = await loadAllEnrollmentRows(database(rows));
  assert.equal(result.data.length, 1201);
  assert.equal(result.data.filter((row) => row.program_id === 'B').length, 701);
});
test('a failed later page never produces an apparently complete ranking', async () => {
  const result = await loadAllEnrollmentRows(
    database(
      Array.from({ length: 600 }, (_, id) => ({ id })),
      1,
    ),
  );
  assert.equal(result.data, null);
  assert.ok(result.error);
});
