import {describe,expect,it} from 'vitest';
import {firstWorkbookUnreviewedIndex,workbookWritingComplete} from '@/lib/lms/workbook-progression';
import {emptyWorkbookAnswers} from '@/lib/lms/workbook-validation';

describe('one guided workbook path',()=>{
  it('starts at lesson one if no earlier study is reviewed',()=>{
    expect(firstWorkbookUnreviewedIndex(['lesson-1','lesson-2','lesson-7'],new Set())).toBe(0);
  });
  it('unlocks one successor only when the previous section is saved and reviewed',()=>{
    const ids=['lesson-1','lesson-2','lesson-3'];
    expect(firstWorkbookUnreviewedIndex(ids,new Set(['lesson-1']))).toBe(1);
    expect(firstWorkbookUnreviewedIndex(ids,new Set(['lesson-1','lesson-2']))).toBe(2);
  });
  it('does not grade reflections right or wrong, only checks meaningful writing',()=>{
    const answers={...emptyWorkbookAnswers(),
      notes:'My learning notes for this session.',
      practice1:'I will review the lesson carefully.',
      practice2:'I discussed a practical scenario with a trainer.',
      nextGoal:'I plan to continue practicing tomorrow.'};
    expect(workbookWritingComplete(answers,2)).toBe(true);
    expect(workbookWritingComplete({...answers,practice2:''},2)).toBe(false);
    expect(workbookWritingComplete(answers,4)).toBe(false);
  });
});
