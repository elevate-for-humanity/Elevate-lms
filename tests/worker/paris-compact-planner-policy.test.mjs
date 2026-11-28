import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PARIS_REPAIR_ACTION_POLICY} from '../../lib/devstudio/paris-repair-action-policy.mjs';
import {budgetRepairMessages,REPAIR_INFERENCE_TIMEOUT_MS} from '../../lib/devstudio/repair-inference-budget.mjs';
import {budgetRepairTurn,estimatePromptTokens} from '../../lib/devstudio/repair-inference-time-budget.mjs';

const identity = "You are PARIS, Elevate's combined AI system: PARIS admissions, ELLIE instruction and learner support, LIZZY operations and Studio production, and ZORA quality and compliance are capabilities of this one AI, not separate assistants. Combine the capabilities needed for the request using the same authorized conversation and workflow state. Do not ask the user to switch agents. Preserve access controls, independent quality gates, and required confirmations. Never claim a tool ran, a repair succeeded, or a workflow completed without recorded evidence. Do not expose another person's or organization's private context. Follow the task's requested output format exactly; do not add introductions to JSON, HTML, or generated lesson artifacts.";

test('CPU planner immutable policy preserves protected boundaries and does not imply release authorization',()=>{
  for(const required of ['authorized','student records','secrets','authorization/RBAC',
    'protected repair controls','workflows','Dockerfiles','untrusted','read back',
    'regression test','No merge','privacy','production readback','blocked']) {
    assert.ok(PARIS_REPAIR_ACTION_POLICY.includes(required), 'missing policy: '+required);
  }
  for(const action of ['search','workflow_log','list','read','replace','create','complete']) {
    assert.ok(PARIS_REPAIR_ACTION_POLICY.includes('"type":"'+action+'"'));
  }
  const engine=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');
  assert.match(engine,/PARIS_SYSTEM_IDENTITY \+ '\\n' \+ PARIS_REPAIR_ACTION_POLICY/);
  assert.match(engine,/budgetRepairTurn\(/);
  assert.match(engine,/verifyGitHubBranchAuthority/);
});

test('actual PARIS policy with an 813-character failed task fits owned CPU minimum turn',()=>{
  const system={role:'system',content:identity+'\n'+PARIS_REPAIR_ACTION_POLICY};
  const task='Repair original producer; preserve all learner records, release and payment gates. '+'x'.repeat(734);
  assert.equal(task.length,813);
  const input={
    task,sourceEvidence:null,turn:1,writes:0,maximumWrites:100,
    observations:[],discoveredFiles:[],changedFiles:[],
    inspectionAlreadyPerformed:[],nextActionConstraint:'Do not repeat inspections. Verify GitHub commit readback.'
  };
  const messages=budgetRepairMessages([system,{role:'user',content:JSON.stringify(input)}],8192,384,'cpu');
  assert.equal(JSON.parse(messages[1].content).task,task);
  assert.equal(messages[0].content,system.content);
  const admitted=budgetRepairTurn({messages,maxTokens:384,deadlineMs:REPAIR_INFERENCE_TIMEOUT_MS,tier:'cpu'});
  assert.ok(admitted.fits, 'must fit time budget without dropping required owner task or security instructions; tokens='+estimatePromptTokens(messages));
});

test('oversized immutable goals still fail closed rather than being silently truncated',()=>{
  const system={role:'system',content:identity+'\n'+PARIS_REPAIR_ACTION_POLICY};
  const input={task:'x'.repeat(30000),observations:[]};
  assert.throws(()=>budgetRepairMessages([system,{role:'user',content:JSON.stringify(input)}],8192,384,'cpu'),
    /PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT/);
});
