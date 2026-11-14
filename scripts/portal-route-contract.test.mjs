import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasGetRouteHandler } from './portal-route-contract.mjs';

test('a protected CSV GET route is a valid navigable portal endpoint', () => {
  assert.equal(hasGetRouteHandler("export async function GET() { const auth = await requireRole(['admin']); return new Response('csv'); }"), true);
});
test('wrapped and re-exported GET handlers also serve navigable endpoints', () => {
  assert.equal(hasGetRouteHandler('export const GET = withApiAudit(handler);'), true);
  assert.equal(hasGetRouteHandler("export { download as GET } from './download';"), true);
});
test('POST-only handlers, missing exports and ordinary pages cannot satisfy a GET handler contract', () => {
  for (const source of ['export async function POST() {}', 'function GET() {}', 'export default function Page() {}', '']) {
    assert.equal(hasGetRouteHandler(source), false);
  }
});
