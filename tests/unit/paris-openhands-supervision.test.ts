import {execFileSync} from 'node:child_process';
import {expect,it} from 'vitest';
it('supervises the accepted provider after prepare timeout without replaying starts or skipping validation',()=>{
 expect(()=>execFileSync(process.execPath,['--test','tests/worker/paris-openhands-supervision.test.mjs'],{
  cwd:process.cwd(),encoding:'utf8',timeout:30000,
 })).not.toThrow();
});
