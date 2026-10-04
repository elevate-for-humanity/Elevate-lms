import test from 'node:test';
import assert from 'node:assert/strict';
import { locator, getByRole, getByText } from './cdp-dom.mjs';

function frame(handler) {
  const actions = [];
  return {
    actions,
    evaluate: (_, request) => handler(request),
    offset: async () => ({ x: 80, y: 100 }),
    page: {
      mouse: { click: async (...args) => actions.push(['click', ...args]) },
      keyboard: {
        press: async (key) => actions.push(['key', key]),
        insertText: async (text) => actions.push(['text', text]),
      },
    },
  };
}
test('click waits for stable geometry and uses trusted mouse with frame offsets', async () => {
  let calls = 0;
  const target = frame(() => ({
    value: { x: ++calls === 1 ? 5 : 10, y: 20, width: 40, height: 30 },
  }));
  await locator(target, 'button').click();
  assert.equal(calls, 3);
  assert.deepEqual(target.actions, [['click', 90, 120, {}]]);
});
test('fill focuses editable node and replaces text using keyboard', async () => {
  const requests = [];
  const target = frame((request) => {
    requests.push(request.operation);
    return { value: true };
  });
  await locator(target, 'input').fill('hello@example.com');
  assert.deepEqual(requests, ['fill']);
  assert.deepEqual(target.actions, [
    ['key', 'ControlOrMeta+A'],
    ['key', 'Backspace'],
    ['text', 'hello@example.com'],
  ]);
});
test('queries compose relative filters and preserve regex and exact options', async () => {
  let request;
  const target = frame((input) => {
    request = input;
    return 2;
  });
  await locator(target, 'section')
    .filter({ has: getByText(target, 'Prompt', { exact: true }) })
    .getByRole('button', { name: /submit/i })
    .count();
  assert.equal(request.steps[1].has[0].exact, true);
  assert.deepEqual(request.steps[2].name, { regex: 'submit', flags: 'i' });
  assert.throws(
    () =>
      locator(target, 'section').filter({
        has: getByRole(
          frame(() => {}),
          'button',
        ),
      }),
    /same frame/,
  );
});
test('waits for attachment and visibility independently', async () => {
  let calls = 0;
  const target = frame(() => ({ attached: true, visible: ++calls > 1 }));
  await locator(target, 'button').waitFor({ state: 'visible' });
  assert.equal(calls, 2);
});
test('strict query errors propagate without converting to missing elements', async () => {
  const target = frame(() => {
    throw new Error('Strict locator resolved to 2 elements');
  });
  await assert.rejects(locator(target, 'button').click(), /Strict locator/);
});
test('retries detached elements but reports timeout', async () => {
  const target = frame(() => ({ retry: 'Element not attached' }));
  await assert.rejects(
    locator(target, 'button').focus({ timeout: 0 }),
    /timed out: Element not attached/,
  );
});
test('check verifies the real input result', async () => {
  const target = frame(({ operation }) => ({
    value: operation === 'checked' ? false : { x: 1, y: 2, width: 30, height: 40 },
  }));
  await assert.rejects(locator(target, 'input').check(), /did not become checked/);
  assert.equal(target.actions[0][0], 'click');
});
