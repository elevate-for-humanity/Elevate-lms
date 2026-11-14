import test from 'node:test';
import assert from 'node:assert/strict';
import {openInfrastructureRepair} from '../../lib/devstudio/infrastructure-repair.mjs';

const sha = 'a'.repeat(40);
const candidate = { branch: { name: 'repair/nonproduction-test', sha }, summary: 'Protected repair candidate' };
const repairId = 'd1507c12-93f7-459e-9aaf-b73286e2bd5c';
const pr = { number: 2613, state: 'open', base: { ref: 'main' }, head: { sha }, node_id: 'PR_2613' };

test('open repair PR is never auto-merged before independent review and checks', async () => {
  const calls = [];
  const github = async (path, options) => {
    calls.push([path, options?.method ?? 'GET']);
    if (path.startsWith('/git/ref/heads/')) return { object: { sha } };
    if (path.startsWith('/pulls?')) return [pr];
    throw Error('Unexpected GitHub request ' + path);
  };
  const graphql = async () => { throw Error('Unreviewed merge must never be requested'); };
  const result = await openInfrastructureRepair({ candidate, repairId, github, graphql });
  assert.deepEqual({ number: result.number, headSha: result.headSha }, { number: 2613, headSha: sha });
  assert.equal(calls.length, 2);
  assert.ok(calls.every(([, method]) => method === 'GET'));
});

test('newly opened repair PR remains review-gated without an auto-merge mutation', async () => {
  const calls = [];
  const github = async (path, options) => {
    calls.push([path, options?.method ?? 'GET']);
    if (path.startsWith('/git/ref/heads/')) return { object: { sha } };
    if (path.startsWith('/pulls?')) return [];
    if (path === '/pulls' && options?.method === 'POST') return pr;
    throw Error('Unexpected GitHub request ' + path);
  };
  const graphql = async () => { throw Error('Unreviewed merge must never be requested'); };
  const result = await openInfrastructureRepair({ candidate, repairId, github, graphql });
  assert.equal(result.number, 2613);
  assert.deepEqual(calls.map(([, method]) => method), ['GET', 'GET', 'POST']);
});
