import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {buildAdminAiSystemPrompt} from '@/lib/platform/admin-ai-assistant';
import {getAiCharterContext} from '@/lib/devstudio/platform-control-plane';
import {getSystemRegistryContext} from '@/lib/platform/system-registry';
import {elevateCompletionBudget} from '@/lib/ai/providers/elevate';
const toolInventory=[...readFileSync('apps/admin/app/api/admin/dev-studio/chat/route.ts','utf8').matchAll(/\bname:\s*['"]([^'"]+)['"]/g)].map(match=>match[1]);
describe('owned CPU chat context',()=>{
 it('fits a real greeting with the institutional charter and current tool inventory in the 8192-token model',()=>{
  const prompt=buildAdminAiSystemPrompt({contextProfile:'owned-cpu',lastUserMessage:'Hello.',institutionalContext:getAiCharterContext(),toolInventory});
  expect(prompt.length).toBeLessThanOrEqual(12000);
  expect(elevateCompletionBudget({messages:[{role:'system',content:prompt},{role:'user',content:'Hello.'}],maxTokens:2048})).toBe(2048);
  expect(prompt).toContain('Never claim to have investigated');
  expect(prompt).toContain('https://admin.elevateforhumanity.org');
 });
 it('bounds large reference payloads while preserving the evidence rules and current user instruction separately',()=>{
  const context='source '.repeat(20000),goal='Inspect QuickBooks. Do not change any records.';
  const prompt=buildAdminAiSystemPrompt({contextProfile:'owned-cpu',lastUserMessage:goal,institutionalContext:getAiCharterContext(),ragContext:context,fileContext:context,documentsContext:context,automaticEvidence:context,toolInventory});
  expect(prompt.length).toBeLessThanOrEqual(12000);
  expect(prompt).toContain('Missing or partial context is not evidence of success');
  expect(prompt).toContain(getAiCharterContext());
  expect(elevateCompletionBudget({messages:[{role:'system',content:prompt},{role:'user',content:goal}],maxTokens:2048})).toBe(2048);
 });
 it('keeps the full reference catalog for other configured prompt profiles',()=>{
  expect(buildAdminAiSystemPrompt({lastUserMessage:'Explain the registry'})).toContain(getSystemRegistryContext());
 });
});
