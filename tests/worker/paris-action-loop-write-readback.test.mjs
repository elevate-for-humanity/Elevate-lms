import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DISCOVERABLE_REPAIR_SOURCE,rememberSourcePaths,rankSourcePaths} from '../../lib/devstudio/paris-source-discovery.mjs';
import {recoverRepeatedInspection,checkInspectionBudget} from '../../lib/devstudio/paris-inspection-budget.mjs';
import {repairCompletionTokens,budgetRepairMessages} from '../../lib/devstudio/repair-inference-budget.mjs';
import {hasApplicationSourceCorrection,nextRepairActionConstraint,assertCommittedWriteReadback} from '../../lib/devstudio/paris-action-loop.mjs';

test('source discovery retains actual authorized workflow and GCP script paths',()=>{
 const workflow='.github/workflows/deploy-google-store-runtime.yml',script='scripts/gcp/repair-studio-browser-cloud-run.mjs';
 assert.deepEqual(rememberSourcePaths([], [workflow,script,'lib/ultimate-course-builder/core/production-handlers.ts']),
  [workflow,script,'lib/ultimate-course-builder/core/production-handlers.ts']);
 assert.deepEqual(recoverRepeatedInspection(['search:deploy'],{type:'search',query:'deploy'},[],[workflow,script]),{type:'read',path:workflow});
 assert.deepEqual(rankSourcePaths('Failed check: '+workflow,[{path:workflow,type:'blob'},{path:'tests/e2e/generic.spec.ts',type:'blob'}])[0],workflow);
 for(const unsafe of ['.github/workflows/../token.yml','scripts/gcp/.env','scripts/gcp/secret.json','lib/../credentials']) {
  assert.equal(DISCOVERABLE_REPAIR_SOURCE.test(unsafe)&&!unsafe.includes('..')&&!unsafe.includes('/.'),false);
 }
});
test('rank real course producer ahead of unrelated test files',()=>{
 const files=['tests/e2e/course-builder.spec.ts','lib/ultimate-course-builder/core/production-handlers.ts'].map(path=>({path,type:'blob'}));
 assert.equal(rankSourcePaths('REPAIR_PRODUCER_UNCHANGED:synchronization',files)[0],'lib/ultimate-course-builder/core/production-handlers.ts');
});
test('CPU inference receives a meaningful edit budget after source inspection',()=>{
 assert.equal(repairCompletionTokens('cpu',[]),384);
 assert.equal(repairCompletionTokens('cpu',['READ lib/ultimate-course-builder/core/production-handlers.ts: exact source']),1280);
 assert.equal(repairCompletionTokens('gpu',['READ lib/x.ts']),2400);
 const messages=budgetRepairMessages([
  {role:'system',content:'Authorize only reviewed changes. '.repeat(75)},
  {role:'user',content:JSON.stringify({task:'Fix narrow producer',observations:['READ lib/x.ts: '+ 'function broken() {}'.repeat(10)]})}
 ],8192,repairCompletionTokens('cpu',['READ lib/x.ts']),'cpu');
 assert.ok(JSON.parse(messages[1].content).observations.join(' ').includes('broken'));
});
test('model gets action-specific progression after one or two reads',()=>{
 assert.match(nextRepairActionConstraint(['read:lib/foo.ts'],0),/NEXT JSON action should be replace/);
 assert.match(nextRepairActionConstraint(['read:lib/foo.ts','read:lib/bar.ts'],0),/already read source files/);
 assert.match(nextRepairActionConstraint([],1,['tests/regression.test.ts']),/Only non-application changes/);
 assert.match(nextRepairActionConstraint([],1,['lib/ultimate-course-builder/core/producer.ts']),/source correction was committed/);
});
test('duplicate reads do not manufacture independent source inspection evidence',()=>{
 assert.match(nextRepairActionConstraint(['read:lib/foo.ts','read:lib/foo.ts'],0),/NEXT JSON action should be replace/);
 assert.match(nextRepairActionConstraint(['read:lib/foo.ts','read:lib/foo.ts','read:lib/bar.ts'],0),/already read source files/);
});
test('GitHub write only counts when committed file, blob, branch ref and bytes all match',()=>{
 const sha='a'.repeat(40),blob='b'.repeat(40);
 const receipt={expectedContent:'export const fixed=true;',observedContent:'export const fixed=true;',commitSha:sha,branchSha:sha,expectedBlobSha:blob,observedBlobSha:blob};
 assert.deepEqual(assertCommittedWriteReadback(receipt),{verified:true,commitSha:sha,contentSha:blob});
 for(const variant of [{observedContent:'old'},{branchSha:'c'.repeat(40)},{observedBlobSha:'d'.repeat(40)},{commitSha:'not-a-sha'}]) {
  assert.throws(()=>assertCommittedWriteReadback({...receipt,...variant}),/PARIS_SOURCE_WRITE_READBACK_MISMATCH/);
 }
});
test('live planner wires edit-specific guidance and exact committed readback without weakening security',()=>{
 const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
 assert.match(source,/nextRepairActionConstraint\(inspectionHistory,writes\)/);
 assert.match(source,/assertCommittedWriteReadback\(/);
 assert.match(source,/if\(next===file\.content\)/);
 assert.match(source,/if\s*\(blockedPath\(normalized\)\)/);
 assert.match(source,/getGitHubAppToken\(\{requireWorkflowWrite:true\}\)/);
 assert.match(source,/newRegressionTests\.add\(action\.path\)/);
});

test('source-first admission separates real application edits from test-only or fixture writes',()=>{
 assert.equal(hasApplicationSourceCorrection([]),false);
 assert.equal(hasApplicationSourceCorrection(['tests/9-integrity-gate-regression.test.ts']),false);
 assert.equal(hasApplicationSourceCorrection(['lib/example.spec.ts']),false);
 assert.equal(hasApplicationSourceCorrection(['tests/9-integrity-gate-regression.test.ts','lib/course-builder/producer.ts']),true);
 assert.match(nextRepairActionConstraint(['read:lib/a.ts'],1,['tests/regression.test.ts']),/NEXT action must correct/);
 const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
 assert.match(source,/action\.path\.startsWith\('tests\/'\) && !hasApplicationSourceCorrection\(changedFiles\)/);
 assert.match(source,/nextRepairActionConstraint\(inspectionHistory,writes,\[\.\.\.changedFiles\]\)/);
});
