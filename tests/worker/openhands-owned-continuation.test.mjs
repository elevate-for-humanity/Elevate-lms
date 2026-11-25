import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';

function source(path) {
  return readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
}

const access = source('lib/devstudio/openhands/task-access.ts');

test('provider conversation IDs cannot authorize themselves', () => {
  assert.match(access, /\.eq\('id', input\.taskId\)/);
  assert.match(access, /\.eq\('user_id', input\.actorId\)/);
  assert.match(access, /\.eq\('tool_name', 'openhands\.execute'\)/);
  assert.match(access, /external\.conversation_id !== input\.conversationId/);
  assert.match(access, /external\.start_task_id !== input\.startTaskId/);
});

test('OpenHands HTTP routes are deleted: no chat or agent route file exists', () => {
  assert.equal(
    existsSync(new URL('../../apps/admin/app/api/admin/dev-studio/openhands/chat/route.ts', import.meta.url)),
    false,
  );
  assert.equal(
    existsSync(new URL('../../apps/admin/app/api/admin/dev-studio/openhands/agent/route.ts', import.meta.url)),
    false,
  );
});

test('no AI tool surface can dispatch to the deleted routes', () => {
  const executor = source('lib/ai/tools/executor.ts');
  const registry = source('lib/ai/tools/registry.ts');
  const planner = source('lib/ai/tools/planner.ts');
  assert.doesNotMatch(executor, /dev-studio\/openhands/);
  assert.doesNotMatch(registry, /dev-studio\/openhands/);
  assert.doesNotMatch(registry, /openhands\.execute/);
  assert.doesNotMatch(registry, /openhands\.status/);
  assert.doesNotMatch(planner, /name: 'openhands\.status'/);
});
