import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repairCompletionTokens} from '../../lib/devstudio/repair-inference-budget.mjs';

// Production checkpoints retain only the latest eight diagnostic observations.
// A successful READ may fall out of that window before the later patch turn.
test('CPU edit allowance survives diagnostic observation rollover via durable inspection history', () => {
  const latest = Array.from({length:8}, (_,i) => 'SEARCH subsequent_'+i+': no content matches');
  assert.equal(repairCompletionTokens('cpu',latest),384);
  assert.equal(repairCompletionTokens('cpu',latest,['search:initial','read:lib/producer.ts']),1280);
  assert.equal(repairCompletionTokens('cpu',latest,['list:lib','read:lib/producer.ts','read:tests/a.test.mjs']),1280);
  assert.equal(repairCompletionTokens('cpu',latest,['search:initial','list:lib']),384);
  assert.equal(repairCompletionTokens('gpu',latest,['read:lib/producer.ts']),2400);
});

test('CPU allowance is not raised by rejected source-read diagnostic alone', () => {
  assert.equal(repairCompletionTokens('cpu',['READ_REJECTED lib/not-found.ts']),384);
  assert.equal(repairCompletionTokens('cpu',['READ lib/producer.ts (sha verified): source']),1280);
});

test('the staged repair controller passes checkpointed history into the inference budget', () => {
  const source = readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
  assert.match(source,/maxTokens: repairCompletionTokens\(ownedTier, observations, inspectionHistory\)/);
  assert.match(source,/inspectionHistory:inspectionHistory\.slice\(-30\)/);
  assert.match(source,/assertCommittedWriteReadback/);
});
