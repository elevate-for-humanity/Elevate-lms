import {it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
it('enforces the bounded PARIS retry and provider-cooldown regressions',()=>{
  expect(()=>execFileSync(process.execPath,['--test','tests/worker/paris-inference-retry-deadline.test.mjs'],{cwd:process.cwd(),stdio:'pipe'})).not.toThrow();
});
