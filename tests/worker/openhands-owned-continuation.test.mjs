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

test('follow-up is removed: chat POST cannot send a Cloud message or continue a conversation', () => {
  const post = chat.slice(chat.indexOf('export async function POST('), chat.indexOf('export async function GET('));
  // The privileged dev-tool role is still checked first, then the route is
  // permanently closed: OpenHands has been removed, so no ownership lookup,
  // approval check, or provider call can ever follow.
  assert.match(post, /canAccessDevTools\(auth\.effectiveRoles\)/);
  assert.match(post, /OPENHANDS_REMOVED/);
  assert.match(post, /status: 410/);
  assert.doesNotMatch(post, /findOwnedOpenHandsTask\(/);
  assert.doesNotMatch(post, /sendOpenHandsMessage\(/);
  assert.doesNotMatch(post, /dispatchOpenHandsTask\(/);
});

test('new chat cannot start any task: no dispatcher or direct Cloud start remains in the route', () => {
  assert.doesNotMatch(chat, /dispatchOpenHandsTask\(/);
  assert.doesNotMatch(chat, /startOpenHandsTask\(/);
  assert.doesNotMatch(chat, /sendOpenHandsMessage\(/);
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
