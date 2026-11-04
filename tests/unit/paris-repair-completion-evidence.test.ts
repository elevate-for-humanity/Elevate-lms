import {describe,it,expect} from 'vitest';
import {missingRepairDeliverables} from '@/lib/devstudio/paris-repair-deliverables.mjs';

describe('PARIS completion evidence',()=>{
  it('rejects a model completion with no repository edits',()=>{
    expect(missingRepairDeliverables(new Set(),new Set())).toBe(true);
  });
  it('rejects completion with only a test or only a source change',()=>{
    expect(missingRepairDeliverables(new Set(['tests/paris-new.test.ts']),new Set(['tests/paris-new.test.ts']))).toBe(true);
    expect(missingRepairDeliverables(new Set(['lib/fix.ts']),new Set())).toBe(true);
  });
  it('allows completion after a source fix and newly created regression test',()=>{
    expect(missingRepairDeliverables(new Set(['lib/fix.ts','tests/paris-new.test.ts']),new Set(['tests/paris-new.test.ts']))).toBe(false);
  });
});
