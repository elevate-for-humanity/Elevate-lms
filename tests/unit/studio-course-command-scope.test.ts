import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {planAIToolFromCommand} from '@/lib/ai/tools/planner';
import {decomposePlan} from '@/lib/platform/planner';
import {getAITool} from '@/lib/ai/tools/registry';
const selected='5a72b6d1-6a05-4294-832b-0a836ac4a74d';
const named='8f3472fe-8fe9-4e16-bc31-d502e3de3c7a';
const context=JSON.stringify({workspace:'course',courseId:selected,title:'Intuit Certified Bookkeeping',programSlug:'bookkeeping'});
describe('Studio course command identity',()=>{
 it('does not route a named course build to the unrelated open course',()=>{
  expect(planAIToolFromCommand('Build the complete Esthetician Apprenticeship course.\n'+context)).toEqual({name:'courses.generate',input:{action:'start',goal:'Build the complete Esthetician Apprenticeship course.'}});
 });
 it('preserves an explicitly selected course for a referential build request',()=>{
  expect(planAIToolFromCommand('Resume this course.\n'+context)?.input).toEqual({action:'start',goal:'Resume this course.',courseId:selected});
 });
 it('takes an explicit command identity ahead of the sidebar selection',()=>{
  expect(planAIToolFromCommand('Build course '+named+'\n'+context)?.input).toMatchObject({courseId:named,goal:'Build course '+named});
 });
 it('retains the selected course for a lesson text edit',()=>{
  expect(planAIToolFromCommand('Rewrite the introduction lesson.\n'+context)).toEqual({name:'courses.edit',input:{courseId:selected,goal:'Rewrite the introduction lesson.'}});
 });
 it('allows authorized draft generation while retaining publication approval',()=>{
  expect(getAITool('courses.generate')?.approvalRequired).toBe(false);
  expect(getAITool('courses.publish')?.approvalRequired).toBe(true);
 });
});

it('splits explicitly named apprenticeship courses into independent targets',()=>{
 const plan=decomposePlan('Start both complete courses: Esthetician (esthetician-apprenticeship) and Nail Technician (nail-technician-apprenticeship).\n'+context);
 expect(plan.steps).toHaveLength(2);
 const tools=plan.steps.map(step=>planAIToolFromCommand(step.command));
 expect(tools.map(tool=>tool?.name)).toEqual(['courses.generate','courses.generate']);
 expect(tools.map(tool=>tool?.input.programSlug)).toEqual(['esthetician-apprenticeship','nail-technician-apprenticeship']);
 expect(tools.every(tool=>!tool?.input.courseId && !String(tool?.input.goal).includes(selected))).toBe(true);
});
