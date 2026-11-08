import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repairCompletionTokens} from '../../lib/devstudio/repair-inference-budget.mjs';

// Production durable checkpoints keep only the latest eight observations.
// Source reads must survive rollover, but attempted/rejected reads do not
// establish source evidence or authorize additional inference.
test('verified CPU source-read proof survives rolling diagnostic observations', () => {
  const latest = Array.from({length:8}, (_,i) => 'SEARCH subsequent_'+i+': no matches');
  assert.equal(repairCompletionTokens('cpu',latest),384);
  assert.equal(repairCompletionTokens('cpu',latest,true),1280);
  assert.equal(repairCompletionTokens('cpu',latest,false),384);
  assert.equal(repairCompletionTokens('gpu',latest,true),2400);
});

test('rejected reads and inspection attempts cannot increase CPU editing budget', () => {
  assert.equal(repairCompletionTokens('cpu',['READ_REJECTED lib/missing.ts']),384);
  assert.equal(repairCompletionTokens('cpu',['READ lib/source.ts (sha verified): source']),1280);
  assert.equal(repairCompletionTokens('cpu',['SEARCH read:lib/producer.ts'],false),384);
});

test('controller persists only successful reads, never raw inspection attempts as verification', () => {
  const source = readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
  assert.match(source,/maxTokens: repairCompletionTokens\(ownedTier, observations, verifiedSourceRead\)/);
  assert.match(source,/verifiedSourceRead\?: boolean/);
  assert.match(source,/commits,writes,summary,complete,verifiedSourceRead/);
  assert.match(source,/const file = await readFile\(action\.path, branch, task \+ JSON\.stringify\(sourceEvidence \?\? \{\}\)\);\s*verifiedSourceRead = true/);
  assert.match(source,/assertCommittedWriteReadback/);
});
