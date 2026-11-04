import {expect,it} from 'vitest';
import {budgetRepairMessages,repairCompletionTokens,repairRetryGoal,REPAIR_INFERENCE_TIMEOUT_MS,REPAIR_MODEL_PROBE_TIMEOUT_MS} from '@/lib/devstudio/repair-inference-budget.mjs';
import {elevateCompletionBudget} from '@/lib/ai/providers/elevate';
it('retains task authority while fitting eight large source observations in the owned context',()=>{
 const task='Fix the known bug. Preserve all existing learner records.';
 const messages=[{role:'system',content:'Preserve rules. '.repeat(150)},{role:'user',content:JSON.stringify({task,turn:5,writes:0,observations:Array.from({length:8},(_,i)=>`READ file-${i}: `+'source "\\n'.repeat(4000))})}];
 const result=budgetRepairMessages(messages);
 expect(JSON.parse(result[1].content).task).toBe(task);
 expect(result[0]).toBe(messages[0]);
 expect(result[1].content).toContain('READ file-7');
 expect(result[1].content).toContain('Partial diagnostic excerpt');
 expect(elevateCompletionBudget({messages:result as any,maxTokens:2400})).toBe(2400);
});
it('refuses to silently truncate an oversized task or its system rules',()=>{
 expect(()=>budgetRepairMessages([{role:'system',content:'Rules'},{role:'user',content:JSON.stringify({task:'x'.repeat(40000),observations:[]})}])).toThrow('PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT');
});
it('fits the observed 7104-character immutable CPU task within the configured model without dropping authority',()=>{
 const system={role:'system',content:'Authority rules. '.repeat(100)};
 const task='Original authorized repair. '+ 'x'.repeat(5500);
 const messages=[system,{role:'user',content:JSON.stringify({task,observations:['READ exact.ts: '+ 'source'.repeat(1000)]})}];
 const result=budgetRepairMessages(messages,8192,512,'cpu');
 expect(result[0]).toBe(system);
 expect(JSON.parse(result[1].content).task).toBe(task);
 expect(result[1].content).toContain('READ exact.ts:');
 expect(result[0].content.length+result[1].content.length).toBeLessThanOrEqual((4096-512-512-24)*3);
 expect(()=>budgetRepairMessages(messages,3072,512,'cpu')).toThrow('PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT');
});
it('replaces retry diagnostics without accumulating old patches or losing the original scope',()=>{
 const original='Fix the workbook; preserve learner records and access controls.';
 let goal=original;
 for(let attempt=0;attempt<10;attempt++) goal=repairRetryGoal(goal,'attempt '+attempt+' '+ 'patch'.repeat(3000));
 expect(goal.startsWith(original)).toBe(true);
 expect(goal).toContain('attempt 9');
 expect(goal).not.toContain('attempt 8');
 expect(goal.length).toBeLessThan(original.length+2100);
 const legacy=original+'\nThe previous attempt failed independent checks or main publication. old patch';
 expect(repairRetryGoal(legacy,'current')).not.toContain('old patch');
});
it('gives owned inference its supported deadline with workflow headroom',()=>{
 expect(REPAIR_INFERENCE_TIMEOUT_MS).toBe(210000);
 expect(REPAIR_INFERENCE_TIMEOUT_MS + REPAIR_MODEL_PROBE_TIMEOUT_MS).toBeLessThan(285000);
});

it('bounds private CPU discovery and editing while preserving GPU capacity',()=>{
 expect(repairCompletionTokens('cpu',['SEARCH ai.chat','READ_REJECTED lib/ai/chat'])).toBe(384);
 expect(repairCompletionTokens('cpu',['READ lib/ai/ai-service.ts (sha verified):'])).toBe(512);
 expect(repairCompletionTokens('gpu',[])).toBe(2400);
});

it('keeps the latest source excerpt and task inside the private CPU time budget',()=>{
 const rules={role:'system',content:'Repository and actor restrictions. '.repeat(60)};
 const input={task:'Inspect the exact failure',turn:6,observations:['READ lib/source.ts: '+('line of real source\n'.repeat(1800))]};
 const messages=[rules,{role:'user',content:JSON.stringify(input)}];
 const cpu=budgetRepairMessages(messages,8192,512,'cpu');
 const gpu=budgetRepairMessages(messages,8192,2400,'gpu');
 expect(cpu[0]).toBe(rules);
 expect(JSON.parse(cpu[1].content).task).toBe(input.task);
 expect(cpu[1].content).toContain('READ lib/source.ts');
 expect(cpu[1].content).toContain('Partial diagnostic excerpt');
 expect(cpu[0].content.length+cpu[1].content.length).toBeLessThanOrEqual((3072-512-512-24)*3);
 expect(gpu[1].content.length).toBeGreaterThan(cpu[1].content.length);
});
