import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyUltimateMediaSchema } from './verify-ultimate-media-schema.mjs';
test('schema preflight checks migration and practical contracts without reading records or changing data', async () => {
  const requests = [];
  await verifyUltimateMediaSchema({ url: 'https://example.supabase.co/', secret: 'test-only', request: async (...args) => { requests.push(args); return { ok: true, json: async () => true }; } });
  assert.equal(requests[0][0], 'https://example.supabase.co/rest/v1/rpc/ultimate_media_wakeup_ready');
  assert.equal(requests.length, 7);
  assert.ok(requests.every(([,options]) => options.method === 'GET'));
  assert.ok(requests.slice(1).every(([url]) => url.endsWith('&limit=0')));
  for (const response of [{ ok: false }, { ok: true, json: async () => false }]) {
    await assert.rejects(verifyUltimateMediaSchema({ url: 'https://example.supabase.co', secret: 'test-only', request: async () => response }), /Apply 20261004150000/);
  }
});
test('premerge practical-only audit requires existing tables but does not require unapplied migration', async () => {
  const requests = [];
  await verifyUltimateMediaSchema({ url: 'https://example.supabase.co', secret: 'test-only', practicalOnly: true,
    request: async url => { requests.push(url); return { ok: true }; } });
  assert.equal(requests.length, 6);
  assert.ok(requests.every(url => !url.includes('/rpc/')));
  await assert.rejects(verifyUltimateMediaSchema({ url: 'https://example.supabase.co', secret: 'test-only', practicalOnly: true,
    request: async () => ({ ok: false, status: 404 }) }), /course_practical_submissions/);
});
