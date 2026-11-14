import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function source(path) {
  return readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
}

const access = source('lib/devstudio/openhands/task-access.ts');
const chat = source('apps/admin/app/api/admin/dev-studio/openhands/chat/route.ts');
const agent = source('apps/admin/app/api/admin/dev-studio/openhands/agent/route.ts');

test('provider conversation IDs cannot authorize themselves', () => {
  assert.match(access, /\.eq\('id', input\.taskId\)/);
  assert.match(access, /\.eq\('user_id', input\.actorId\)/);
  assert.match(access, /\.eq\('tool_name', 'openhands\.execute'\)/);
  assert.match(access, /external\.conversation_id !== input\.conversationId/);
  assert.match(access, /external\.start_task_id !== input\.startTaskId/);
});

test('follow-up requires same owner and privileged dev-tool role before Cloud message', () => {
  assert.match(chat, /canAccessDevTools\(auth\.effectiveRoles\)/);
  const fromContinuation = chat.slice(chat.indexOf('if (conversationId) {'), chat.indexOf('if (taskId) {'));
  assert.ok(fromContinuation.indexOf('findOwnedOpenHandsTask(') >= 0);
  assert.ok(fromContinuation.indexOf('findOwnedOpenHandsTask(') < fromContinuation.indexOf('sendOpenHandsMessage('));
  assert.match(fromContinuation, /\['running', 'queued'\]\.includes\(task\.status\)/);
  assert.match(fromContinuation, /status: 404/);
  assert.match(fromContinuation, /status: 409/);
});

test('new chat uses tracked dispatcher rather than unowned direct Cloud start', () => {
  assert.match(chat, /dispatchOpenHandsTask\(/);
  assert.doesNotMatch(chat, /startOpenHandsTask\(/);
  assert.match(chat, /taskId: dispatched\.taskId/);
});

test('all chat lifecycle reads require task ownership, not arbitrary external IDs', () => {
  const get = chat.slice(chat.indexOf('export async function GET('));
  assert.match(get, /findOwnedOpenHandsTask\(/);
  assert.ok(get.indexOf('findOwnedOpenHandsTask(') < get.indexOf('refreshOpenHandsTask('));
  assert.match(get, /taskId: owned\.taskId/);
});

test('Admin agent status verifies ownership before mutating task reconciliation', () => {
  const get = agent.slice(agent.indexOf('export async function GET('));
  assert.ok(get.indexOf('findOwnedOpenHandsTask(') < get.indexOf('refreshOpenHandsTask('));
  assert.match(get, /Use the owned taskId to query OpenHands status/);
  assert.doesNotMatch(get, /getOpenHandsLifecycle\(\{ startTaskId, conversationId \}\)/);
});
