import {describe,it,expect} from 'vitest';
import {checkInspectionBudget, inspectActionKey} from '@/lib/devstudio/paris-inspection-budget.mjs';

describe('PARIS durable inspection budget',()=>{
  it('permits first inspection then redirects a duplicate and stops a third',()=>{
    const action={type:'list',path:'lib/ultimate-course-builder/core'};
    const history=[];
    expect(checkInspectionBudget(history,action).decision).toBe('inspect');
    history.push(inspectActionKey(action));
    expect(checkInspectionBudget(history,action).decision).toBe('redirect');
    history.push(inspectActionKey(action));
    expect(checkInspectionBudget(history,action).decision).toBe('stop');
  });
  it('normalizes repeated searches across durable planner turns',()=>{
    expect(inspectActionKey({type:'search',query:' Barber  scene  error '}))
      .toBe(inspectActionKey({type:'search',query:'barber scene error'}));
  });
  it('does not restrict patch and regression-test write actions',()=>{
    expect(checkInspectionBudget(['list:lib'],{type:'replace',path:'lib/file.ts'}).decision).toBe('not-inspection');
    expect(checkInspectionBudget(['list:lib'],{type:'create',path:'tests/fix.test.ts'}).decision).toBe('not-inspection');
  });
});
