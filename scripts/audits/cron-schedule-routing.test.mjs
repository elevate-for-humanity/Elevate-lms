import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../.github/workflows/cron-scheduler.yml',import.meta.url),'utf8');
test('every active cron trigger is routed to at least one job',()=>{
 const specs=[...source.matchAll(/^\\s*- cron: '([^']+)'/gm)].map(x=>x[1]);
 assert.ok(specs.length>0);
 for(const spec of specs){
  assert.ok(source.includes("github.event.schedule == '"+spec+"'"),'Unmatched cron: '+spec);
 }
 assert.ok(!specs.includes('*/30 * * * *'),'Unmatched 30-minute cron should not produce skipped workflow runs');
});
