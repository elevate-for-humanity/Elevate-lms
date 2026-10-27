import test from 'node:test';
import assert from 'node:assert/strict';
import { trafficRequests, loadTraffic } from '../../lib/analytics/traffic.mjs';
test('apprentice scope rejects empty input instead of returning global traffic', () => {
  assert.throws(() => trafficRequests([]));
  assert.throws(() => trafficRequests('owned.example'));
});
test('every apprentice report filters exact verified domains', () => {
  const reports = trafficRequests(['owned.example']);
  assert.equal(reports.length, 3);
  for (const { body } of reports) {
    assert.deepEqual(body.dimensionFilter.filter, { fieldName: 'hostName', inListFilter: { values: ['owned.example'] } });
    assert.equal(body.dateRanges[0].endDate, 'yesterday');
  }
  assert.equal(reports[2].body.metrics[0].name, 'activeUsers');
});
test('missing GA configuration reports unavailable, never synthetic counts', async () => {
  const original = process.env.GA4_PROPERTY_ID;
  delete process.env.GA4_PROPERTY_ID;
  try {
    const result = await loadTraffic();
    assert.ok(result.error);
    assert.deepEqual(result.reports, []);
  } finally {
    if (original !== undefined) process.env.GA4_PROPERTY_ID = original;
  }
});
