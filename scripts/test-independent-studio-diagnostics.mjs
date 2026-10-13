import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const engineering=stripTypeScriptTypes(readFileSync('lib/devstudio/engineering-runner/plan.ts','utf8'));
const dependency='data:text/javascript;base64,'+Buffer.from(engineering).toString('base64');
const source=readFileSync('lib/platform/planner.ts','utf8').replace("'@/lib/devstudio/engineering-runner/plan'",JSON.stringify(dependency));
const {decomposePlan,canExecuteStep}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
test('browser outage does not prevent independent platform diagnosis',()=>{
 const p=decomposePlan('Get platform health. Read only; do not deploy or change records.');
 p.steps[0].status='failed';
 assert.equal(canExecuteStep(p.steps[1],p.steps),true);
 assert.equal(canExecuteStep(p.steps[2],p.steps),true);
});
test('diagnostic commands preserve no-mutation boundary',()=>{
 const p=decomposePlan('Read-only platform health diagnostic');
 assert.equal(p.steps.length,3);
 assert.ok(p.steps.every(x=>!x.depends_on?.length));
 assert.match(p.steps[2].command,/do not modify/);
});
test('deployment and engineering dependencies remain enforced',()=>{
 const p=decomposePlan('Fix repository code and deploy the website');
 const child=p.steps.find(x=>x.depends_on?.length);
 assert.ok(child);
 assert.equal(canExecuteStep(child,p.steps),false);
});
