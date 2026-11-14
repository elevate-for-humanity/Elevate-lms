import {execFileSync} from 'node:child_process';
import {expect,it} from 'vitest';

it('runs actual ringtone cancellation regressions in required CI',()=>{
 const report=execFileSync(process.execPath,['--experimental-strip-types','--test-reporter=tap','--test','tests/worker/phone-ringtone-lifecycle.test.mjs'],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
 expect(report).toContain('# fail 0');
},40000);
