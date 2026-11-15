import {describe,it,expect} from 'vitest';
import {missingRepairDeliverables,isApplicationSourceCorrection} from '@/lib/devstudio/paris-repair-deliverables.mjs';

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
  it('treats a new shared test helper as an application correction',()=>{
    expect(isApplicationSourceCorrection('tests/e2e/helpers/browser-runtime-errors.ts')).toBe(true);
    expect(isApplicationSourceCorrection('tests/helpers/guard.ts')).toBe(true);
    // Assertion suites stay immutable even under a helpers directory.
    expect(isApplicationSourceCorrection('tests/e2e/helpers/guard.spec.ts')).toBe(false);
    expect(isApplicationSourceCorrection('tests/e2e/guard.test.ts')).toBe(false);
    expect(missingRepairDeliverables(
      new Set(['tests/e2e/helpers/browser-runtime-errors.ts','tests/e2e/guard.test.ts']),
      new Set(['tests/e2e/guard.test.ts']))).toBe(false);
  });
});
