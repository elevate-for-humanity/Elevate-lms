import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPAIR_INFERENCE_TIMEOUT_MS,
  REPAIR_MODEL_PROBE_TIMEOUT_MS,
  repairCompletionTokens,
  budgetRepairMessages,
} from '../../lib/devstudio/repair-inference-budget.mjs';

// Production 2026-11-08: discovery turns finished in 29-59s, but the
// first 2048-token edit allowance timed out at about 211s with zero writes.
// A token ceiling is not a promise that the model can produce that many
// tokens before the HTTP deadline; retain headroom instead.
test('verified CPU source reads use a smaller edit allowance with inference headroom', () => {
  const discovery = repairCompletionTokens('cpu', ['READ_REJECTED lib/missing.ts']);
  const edit = repairCompletionTokens('cpu', ['READ lib/source.ts (sha verified): exact source']);
  assert.equal(discovery, 384);
  assert.equal(edit, 1280);
  assert.ok(edit > 768, 'must still be able to propose a small exact edit');
  assert.ok(edit < 2048, 'must not repeat the proven timeout-sized allowance');
  assert.equal(REPAIR_INFERENCE_TIMEOUT_MS, 210_000);
  assert.ok(REPAIR_INFERENCE_TIMEOUT_MS + REPAIR_MODEL_PROBE_TIMEOUT_MS < 285_000);
  assert.equal(repairCompletionTokens('gpu', ['READ lib/source.ts']), 2400);
});

test('the smaller CPU edit allowance does not drop immutable task authority or source inspection', () => {
  const task = 'Correct only the verified producer defect; do not bypass approval or existing tests.';
  const messages = [
    {role:'system',content:'Preserve owner authorization, GitHub write readback and independent validation.'},
    {role:'user',content:JSON.stringify({
      task, observations:['READ lib/producer.ts (sha verified): ' + 'exact source evidence '.repeat(1000)],
    })},
  ];
  const output = budgetRepairMessages(messages, 8192, repairCompletionTokens('cpu', ['READ lib/producer.ts']), 'cpu');
  assert.equal(output[0].content, messages[0].content);
  assert.equal(JSON.parse(output[1].content).task, task);
  assert.match(output[1].content, /READ lib\/producer\.ts/);
  assert.match(output[1].content, /Partial diagnostic excerpt/);
});
