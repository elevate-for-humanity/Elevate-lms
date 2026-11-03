import {expect,it} from 'vitest';
import {budgetRepairMessages,repairCompletionTokens,REPAIR_INFERENCE_TIMEOUT_MS,REPAIR_MODEL_PROBE_TIMEOUT_MS} from '@/lib/devstudio/repair-inference-budget.mjs';
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
it('gives owned inference its supported deadline with workflow headroom',()=>{
 expect(REPAIR_INFERENCE_TIMEOUT_MS).toBe(210000);
 expect(REPAIR_INFERENCE_TIMEOUT_MS + REPAIR_MODEL_PROBE_TIMEOUT_MS).toBeLessThan(285000);
});

it('keeps private CPU discovery turns short and preserves the edit budget after reading a file',()=>{
 expect(repairCompletionTokens('cpu',['SEARCH ai.chat','READ_REJECTED lib/ai/chat'])).toBe(384);
 expect(repairCompletionTokens('cpu',['READ lib/ai/ai-service.ts (sha verified):'])).toBe(2400);
 expect(repairCompletionTokens('gpu',[])).toBe(2400);
});
